import { NextResponse } from 'next/server';

import { db } from '@/lib/firebase-admin';
import { captureException } from '@/lib/observability/error-tracking';
import { logInfo, logWarn } from '@/lib/observability/logger';
import { hashIpForAudit } from '@/lib/register-first/request-token-admin';
import { sendSupplierOtpEmail } from '@/lib/register-first/supplier-invite-email';
import { parseSupplierInviteRecord } from '@/lib/register-first/supplier-invite-schema';
import {
  createOtpChallenge,
  countTodayChallenges,
  MAX_CHALLENGES_PER_DAY,
} from '@/lib/register-first/supplier-invite-otp';
import { checkPublicRateLimit } from '@/lib/security/public-rate-limit';

const INVITE_COLLECTION = 'registerSupplierInvites';
const CHALLENGE_COLLECTION = 'supplierInviteChallenges';
const OTP_EXPIRY_SECONDS = 600;

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
    const registerDoc = await db
      .doc(`users/${invite.ownerId}/registers/${invite.registerId}`)
      .get();
    const registerData = registerDoc.data() as
      | { organisationName?: string | null; name?: string | null }
      | undefined;
    const organisationName =
      registerData?.organisationName ??
      registerData?.name ??
      'Ihre Organisation';

    try {
      await sendSupplierOtpEmail({
        inviteId,
        challengeId: challenge.challengeId,
        to: invite.intendedEmail,
        organisationName,
        otpCode: challenge.otp,
        expiresInMinutes: OTP_EXPIRY_SECONDS / 60,
      });

      await db.collection(INVITE_COLLECTION).doc(inviteId).update({
        otpDeliveryFailed: false,
      });
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        logWarn('supplier_invite_otp_sendgrid_fallback', {
          inviteId,
          challengeId: challenge.challengeId,
          reason: error instanceof Error ? error.message : 'unknown',
        });
        logInfo('supplier_invite_otp_debug', {
          inviteId,
          email: invite.intendedEmail,
          otp: challenge.otp,
          challengeId: challenge.challengeId,
        });
      } else {
        await db.collection(INVITE_COLLECTION).doc(inviteId).update({
          otpDeliveryFailed: true,
        });
        await db.collection(CHALLENGE_COLLECTION).doc(challenge.challengeId).delete();

        logWarn('supplier_invite_otp_failed', {
          inviteId,
          challengeId: challenge.challengeId,
          reason: error instanceof Error ? error.message : 'unknown',
          ipHash,
        });

        return NextResponse.json(
          { error: 'Bestaetigungscode konnte nicht gesendet werden.' },
          { status: 503 },
        );
      }
    }

    logInfo('supplier_invite_otp_sent', {
      inviteId,
      challengeId: challenge.challengeId,
      ipHash,
    });

    return NextResponse.json({
      challengeId: challenge.challengeId,
      expiresInSeconds: OTP_EXPIRY_SECONDS,
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
