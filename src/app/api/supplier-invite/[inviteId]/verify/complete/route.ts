import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/firebase-admin';
import { captureException } from '@/lib/observability/error-tracking';
import { logInfo, logWarn } from '@/lib/observability/logger';
import { hashIpForAudit } from '@/lib/register-first/request-token-admin';
import { parseSupplierInviteRecord } from '@/lib/register-first/supplier-invite-schema';
import { verifyOtpChallenge } from '@/lib/register-first/supplier-invite-otp';
import { createSupplierSessionCookie } from '@/lib/register-first/supplier-invite-session';
import { checkPublicRateLimit } from '@/lib/security/public-rate-limit';

const INVITE_COLLECTION = 'registerSupplierInvites';

const CompleteVerifyBodySchema = z.object({
  challengeId: z.string().trim().min(1).max(200),
  otp: z.string().trim().length(6),
});

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
    // Rate limit
    const rateLimit = await checkPublicRateLimit({
      namespace: 'supplier-invite-verify-complete',
      key: `${ipHash}:${inviteId}`,
      limit: 15,
      windowMs: 15 * 60 * 1000,
    });
    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: 'Zu viele Versuche. Bitte warten Sie einige Minuten.' },
        { status: 429 },
      );
    }

    const body = CompleteVerifyBodySchema.parse(
      await req.json().catch(() => ({}))
    );

    // Re-check invite status (may have been revoked between /start and /complete)
    const inviteDoc = await db.collection(INVITE_COLLECTION).doc(inviteId).get();
    if (!inviteDoc.exists) {
      return NextResponse.json(
        { error: 'Anfrage nicht gefunden.' },
        { status: 404 },
      );
    }

    const invite = parseSupplierInviteRecord(inviteDoc.data());

    if (invite.revokedAt || invite.status === 'revoked') {
      return NextResponse.json(
        { error: 'Diese Anfrage wurde zurueckgezogen.' },
        { status: 410 },
      );
    }

    if (new Date(invite.expiresAt) <= new Date()) {
      return NextResponse.json(
        { error: 'Diese Anfrage ist abgelaufen.' },
        { status: 410 },
      );
    }

    // Verify OTP
    const result = await verifyOtpChallenge(body.challengeId, body.otp);

    if (!result.ok) {
      const statusMap: Record<string, number> = {
        not_found: 404,
        expired: 410,
        consumed: 410,
        too_many_attempts: 429,
        wrong_otp: 400,
      };
      const messageMap: Record<string, string> = {
        not_found: 'Bestaetigungscode nicht gefunden.',
        expired: 'Bestaetigungscode ist abgelaufen. Bitte fordern Sie einen neuen an.',
        consumed: 'Bestaetigungscode wurde bereits verwendet.',
        too_many_attempts: 'Zu viele Fehlversuche. Bitte fordern Sie einen neuen Code an.',
        wrong_otp: 'Falscher Bestaetigungscode.',
      };

      logWarn('supplier_invite_otp_failed', {
        inviteId,
        challengeId: body.challengeId,
        reason: result.reason,
        ipHash,
      });

      return NextResponse.json(
        { error: messageMap[result.reason] ?? 'Verifikation fehlgeschlagen.' },
        { status: statusMap[result.reason] ?? 400 },
      );
    }

    // Update invite status to verified
    await db.collection(INVITE_COLLECTION).doc(inviteId).update({
      status: 'verified',
      firstUsedAt: invite.firstUsedAt ?? new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      lastUsedIpHash: ipHash,
    });

    // Create signed session cookie
    const sessionCookie = createSupplierSessionCookie(inviteId, invite.intendedEmail);

    logInfo('supplier_invite_verified', {
      inviteId,
      challengeId: body.challengeId,
      ipHash,
    });

    const response = NextResponse.json({ verified: true });
    response.cookies.set(sessionCookie.name, sessionCookie.value, {
      httpOnly: sessionCookie.options.httpOnly as boolean,
      secure: sessionCookie.options.secure as boolean,
      sameSite: sessionCookie.options.sameSite as 'strict',
      maxAge: sessionCookie.options.maxAge as number,
      path: sessionCookie.options.path as string,
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungueltige Eingabe.' },
        { status: 400 },
      );
    }

    captureException(error, {
      boundary: 'app',
      component: 'supplier-invite-verify-complete',
      route: `/api/supplier-invite/${inviteId}/verify/complete`,
    });
    return NextResponse.json(
      { error: 'Verifikation konnte nicht abgeschlossen werden.' },
      { status: 500 },
    );
  }
}
