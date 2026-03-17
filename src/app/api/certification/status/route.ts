import { NextResponse } from 'next/server';

import { requireCertificationActor } from '@/lib/certification/request-auth';
import { getUserCertificationSnapshot } from '@/lib/certification/server';
import { logError } from '@/lib/observability/logger';
import {
  buildRateLimitKey,
  enforceRequestRateLimit,
} from '@/lib/security/request-security';

export async function GET(request: Request) {
  try {
    const actor = await requireCertificationActor(request);
    const rateLimit = await enforceRequestRateLimit({
      request,
      namespace: 'certification-status',
      key: buildRateLimitKey(request, actor.uid, actor.email),
      limit: 60,
      windowMs: 60 * 60 * 1000,
      logContext: {
        actorUserId: actor.uid,
      },
    });
    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: 'Zu viele Statusabfragen in kurzer Zeit.' },
        { status: 429 },
      );
    }

    const snapshot = await getUserCertificationSnapshot(actor.email);
    return NextResponse.json(snapshot);
  } catch (error) {
    const isAuthFailure =
      error instanceof Error && error.message === 'Authentication required.';
    logError('certification_status_failed', {
      errorMessage: error instanceof Error ? error.message : 'unknown_error',
      isAuthFailure,
    });
    return NextResponse.json(
      { error: isAuthFailure ? 'Authentication required.' : 'Status could not be loaded.' },
      { status: isAuthFailure ? 401 : 500 },
    );
  }
}
