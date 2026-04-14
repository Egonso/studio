import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  buildAuthEmailContinueUrl,
  buildCustomAuthActionUrl,
  sendCustomPasswordResetEmail,
} from '@/lib/auth/custom-auth-email';
import { captureException } from '@/lib/observability/error-tracking';
import { logInfo, logWarn } from '@/lib/observability/logger';
import { getAdminAuth } from '@/lib/firebase-admin';
import {
  buildRateLimitKey,
  enforceRequestRateLimit,
  safeEmailSchema,
} from '@/lib/security/request-security';

const PasswordResetBodySchema = z
  .object({
    email: safeEmailSchema,
  })
  .strict();

function isUserNotFoundError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'auth/user-not-found'
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = PasswordResetBodySchema.parse(
      await request.json().catch(() => ({})),
    );

    const rateLimit = await enforceRequestRateLimit({
      request,
      namespace: 'auth:password-reset',
      key: buildRateLimitKey(request, body.email),
      limit: 5,
      windowMs: 15 * 60 * 1000,
      logContext: {
        email: body.email,
      },
    });

    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: 'Zu viele Passwort-Reset-Anfragen in kurzer Zeit. Bitte versuchen Sie es spaeter erneut.' },
        { status: 429 },
      );
    }

    try {
      const adminAuth = getAdminAuth();
      const userRecord = await adminAuth.getUserByEmail(body.email);
      const generatedLink = await adminAuth.generatePasswordResetLink(body.email, {
        url: buildAuthEmailContinueUrl(body.email),
      });

      await sendCustomPasswordResetEmail({
        to: body.email,
        displayName: userRecord.displayName ?? null,
        actionUrl: buildCustomAuthActionUrl(generatedLink),
      });

      logInfo('auth_password_reset_email_sent_custom', {
        email: body.email,
      });
    } catch (error) {
      if (isUserNotFoundError(error)) {
        logInfo('auth_password_reset_email_requested_unknown_user', {
          email: body.email,
        });
      } else {
        throw error;
      }
    }

    return NextResponse.json({ sent: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Ungueltige Eingabe.' },
        { status: 400 },
      );
    }

    logWarn('auth_password_reset_email_send_failed', {
      reason: error instanceof Error ? error.message : 'unknown',
    });
    captureException(error, {
      boundary: 'app',
      component: 'auth-password-reset-route',
      route: '/api/auth/password-reset',
    });
    return NextResponse.json(
      { error: 'Passwort-Reset-E-Mail konnte nicht gesendet werden.' },
      { status: 500 },
    );
  }
}
