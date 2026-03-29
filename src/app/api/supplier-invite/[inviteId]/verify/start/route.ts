import { NextResponse } from 'next/server';

import { db } from '@/lib/firebase-admin';
import { captureException } from '@/lib/observability/error-tracking';
import { logInfo, logWarn } from '@/lib/observability/logger';
import { hashIpForAudit } from '@/lib/register-first/request-token-admin';
import { parseSupplierInviteRecord } from '@/lib/register-first/supplier-invite-schema';
import {
  createOtpChallenge,
  countTodayChallenges,
  MAX_CHALLENGES_PER_DAY,
} from '@/lib/register-first/supplier-invite-otp';
import { checkPublicRateLimit } from '@/lib/security/public-rate-limit';

const INVITE_COLLECTION = 'registerSupplierInvites';

function resolveClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for') ?? 'unknown';
  return forwardedFor.split(',')[0]?.trim() || 'unknown';
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const { inviteId } = await params;
  const clientIp = resolveClientIp(req);
  const ipHash = hashIpForAudit(clientIp);

  try {
    // Rate limit on IP level
    const rateLimit = await checkPublicRateLimit({
      namespace: 'supplier-invite-verify',
      key: `${ipHash}:${inviteId}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: 'Zu viele Anfragen. Bitte warten Sie einige Minuten.' },
        { status: 429 },
      );
    }

    // Load invite
    const doc = await db.collection(INVITE_COLLECTION).doc(inviteId).get();
    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Anfrage nicht gefunden.' },
        { status: 404 },
      );
    }

    const invite = parseSupplierInviteRecord(doc.data());

    // Check status
    if (invite.revokedAt || invite.status === 'revoked') {
      return NextResponse.json(
        { error: 'Diese Anfrage wurde zurueckgezogen.' },
        { status: 410 },
      );
    }

    if (new Date(invite.expiresAt) <= new Date()) {
      return NextResponse.json(
        { error: 'Diese Anfrage ist abgelaufen. Bitte wenden Sie sich an den Absender.' },
        { status: 410 },
      );
    }

    if (invite.status === 'submitted' && invite.submissionCount >= invite.maxSubmissions) {
      return NextResponse.json(
        { error: 'Diese Anfrage wurde bereits beantwortet.' },
        { status: 410 },
      );
    }

    // Check daily challenge limit
    const todayCount = await countTodayChallenges(inviteId);
    if (todayCount >= MAX_CHALLENGES_PER_DAY) {
      logWarn('supplier_invite_otp_daily_limit', { inviteId, todayCount });
      return NextResponse.json(
        { error: 'Tageslimit fuer Bestaetigungscodes erreicht. Bitte versuchen Sie es morgen erneut.' },
        { status: 429 },
      );
    }

    // Create challenge — OTP goes to intendedEmail (not user-supplied)
    const challenge = await createOtpChallenge(inviteId, invite.intendedEmail, ipHash);

    // TODO: Send OTP via SendGrid Cloud Function
    // For now, log the OTP in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      logInfo('supplier_invite_otp_debug', {
        inviteId,
        email: invite.intendedEmail,
        otp: challenge.otp,
        challengeId: challenge.challengeId,
      });
    }

    logInfo('supplier_invite_otp_sent', {
      inviteId,
      challengeId: challenge.challengeId,
      ipHash,
    });

    return NextResponse.json({
      challengeId: challenge.challengeId,
      expiresInSeconds: 600,
    });
  } catch (error) {
    captureException(error, {
      boundary: 'app',
      component: 'supplier-invite-verify-start',
      route: `/api/supplier-invite/${inviteId}/verify/start`,
    });
    return NextResponse.json(
      { error: 'Bestaetigungscode konnte nicht gesendet werden.' },
      { status: 500 },
    );
  }
}
