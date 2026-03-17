import { NextResponse } from 'next/server';

import { requireCertificationActor } from '@/lib/certification/request-auth';
import { startExamAttempt } from '@/lib/certification/server';
import { logError } from '@/lib/observability/logger';
import {
  buildRateLimitKey,
  enforceRequestRateLimit,
} from '@/lib/security/request-security';

export async function POST(request: Request) {
  try {
    const actor = await requireCertificationActor(request);
    const rateLimit = await enforceRequestRateLimit({
      request,
      namespace: 'certification-exam-start',
      key: buildRateLimitKey(request, actor.uid, actor.email),
      limit: 10,
      windowMs: 60 * 60 * 1000,
      logContext: {
        actorUserId: actor.uid,
      },
    });
    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: 'Zu viele Prüfungsstarts in kurzer Zeit.' },
        { status: 429 },
      );
    }

    const attempt = await startExamAttempt(actor);
    return NextResponse.json({ attempt });
  } catch (error) {
    const isAuthFailure =
      error instanceof Error && error.message === 'Authentication required.';
    logError('certification_exam_start_failed', {
      errorMessage: error instanceof Error ? error.message : 'unknown_error',
      isAuthFailure,
    });
    return NextResponse.json(
      {
        error: isAuthFailure
          ? 'Authentication required.'
          : 'Exam attempt could not be started.',
      },
      { status: isAuthFailure ? 401 : 400 },
    );
  }
}
