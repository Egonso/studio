import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { buildRateLimitKey, enforceRequestRateLimit, safeEmailSchema } from '@/lib/security/request-security';

const AuthAttemptSchema = z.object({
  action: z.enum(['login', 'signup', 'password_reset']),
  email: safeEmailSchema,
});

const RATE_LIMIT_CONFIG = {
  login: { limit: 8, windowMs: 15 * 60 * 1000 },
  signup: { limit: 4, windowMs: 60 * 60 * 1000 },
  password_reset: { limit: 4, windowMs: 60 * 60 * 1000 },
} as const;

export async function POST(request: NextRequest) {
  try {
    const payload = AuthAttemptSchema.parse(await request.json());
    const config = RATE_LIMIT_CONFIG[payload.action];
    const decision = await enforceRequestRateLimit({
      request,
      namespace: `auth-${payload.action}`,
      key: buildRateLimitKey(request, payload.action, payload.email),
      limit: config.limit,
      windowMs: config.windowMs,
      logContext: {
        action: payload.action,
      },
    });

    if (!decision.ok) {
      return NextResponse.json(
        {
          error: 'Zu viele Versuche in kurzer Zeit. Bitte warten Sie einen Moment und versuchen Sie es erneut.',
          retryAfterMs: decision.retryAfterMs,
        },
        { status: 429 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Ungültige Authentifizierungsdaten.' },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Authentifizierungsanfrage konnte nicht geprüft werden.' },
      { status: 500 },
    );
  }
}
