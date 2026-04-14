import { NextRequest, NextResponse } from 'next/server';

import { buildCustomAuthActionUrl, buildAuthEmailContinueUrl, sendCustomVerificationEmail } from '@/lib/auth/custom-auth-email';
import { captureException } from '@/lib/observability/error-tracking';
import { logInfo, logWarn } from '@/lib/observability/logger';
import { getAdminAuth } from '@/lib/firebase-admin';
import {
  ServerAuthError,
} from '@/lib/server-auth';
import {
  buildRateLimitKey,
  enforceRequestRateLimit,
} from '@/lib/security/request-security';

function normalizeBearerToken(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.toLowerCase().startsWith('bearer ')) {
    return trimmed.slice(7).trim() || null;
  }

  return trimmed;
}

async function requireUnverifiedUser(authorizationHeader: string | null) {
  const token = normalizeBearerToken(authorizationHeader);
  if (!token) {
    throw new ServerAuthError('Authentication required.', 401);
  }

  const adminAuth = getAdminAuth();
  const decoded = await adminAuth.verifyIdToken(token, false);
  const userRecord = await adminAuth.getUser(decoded.uid);
  const email = userRecord.email?.trim().toLowerCase();

  if (!email) {
    throw new ServerAuthError('Authenticated user must have an email.', 403);
  }

  return {
    uid: decoded.uid,
    email,
    displayName: userRecord.displayName ?? decoded.name ?? null,
    emailVerified: userRecord.emailVerified === true,
  };
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireUnverifiedUser(
      request.headers.get('authorization'),
    );

    const rateLimit = await enforceRequestRateLimit({
      request,
      namespace: 'auth:email-verification',
      key: buildRateLimitKey(request, actor.uid, actor.email),
      limit: 3,
      windowMs: 15 * 60 * 1000,
      logContext: {
        actorUserId: actor.uid,
        email: actor.email,
      },
    });

    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: 'Zu viele Verifizierungsanfragen in kurzer Zeit. Bitte versuchen Sie es spaeter erneut.' },
        { status: 429 },
      );
    }

    if (actor.emailVerified) {
      return NextResponse.json({ sent: false, alreadyVerified: true });
    }

    const generatedLink = await getAdminAuth().generateEmailVerificationLink(
      actor.email,
      {
        url: buildAuthEmailContinueUrl(actor.email),
      },
    );

    const actionUrl = buildCustomAuthActionUrl(generatedLink);

    await sendCustomVerificationEmail({
      to: actor.email,
      displayName: actor.displayName,
      actionUrl,
    });

    logInfo('auth_verification_email_sent_custom', {
      actorUserId: actor.uid,
      email: actor.email,
    });

    return NextResponse.json({ sent: true });
  } catch (error) {
    if (error instanceof ServerAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    logWarn('auth_verification_email_send_failed', {
      reason: error instanceof Error ? error.message : 'unknown',
    });
    captureException(error, {
      boundary: 'app',
      component: 'auth-email-verification-route',
      route: '/api/auth/email-verification',
    });
    return NextResponse.json(
      { error: 'Verifizierungs-E-Mail konnte nicht gesendet werden.' },
      { status: 500 },
    );
  }
}
