import { NextResponse } from 'next/server';
import { z } from 'zod';

import { buildCertificateBadgeMarkup } from '@/lib/certification/badge';
import { requireCertificationActor } from '@/lib/certification/request-auth';
import { submitExamAttempt } from '@/lib/certification/server';
import { logError } from '@/lib/observability/logger';
import {
  buildRateLimitKey,
  enforceRequestRateLimit,
  safeIdentifierSchema,
  safeOptionalPlainTextSchema,
} from '@/lib/security/request-security';

const ExamSubmitSchema = z
  .object({
    attemptId: safeIdentifierSchema,
    sectionAnswers: z
      .array(z.array(z.number().int().min(0).max(20)).max(50))
      .min(1)
      .max(20),
    company: safeOptionalPlainTextSchema('Unternehmen', { max: 160 }),
  })
  .strict();

export async function POST(request: Request) {
  try {
    const actor = await requireCertificationActor(request);
    const body = ExamSubmitSchema.parse(await request.json());
    const rateLimit = await enforceRequestRateLimit({
      request,
      namespace: 'certification-exam-submit',
      key: buildRateLimitKey(request, actor.uid, body.attemptId),
      limit: 20,
      windowMs: 60 * 60 * 1000,
      logContext: {
        actorUserId: actor.uid,
        attemptId: body.attemptId,
      },
    });
    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: 'Zu viele Prüfungsabgaben in kurzer Zeit.' },
        { status: 429 },
      );
    }

    const result = await submitExamAttempt(actor, {
      attemptId: body.attemptId,
      sectionAnswers: body.sectionAnswers,
      company: body.company ?? null,
    });

    return NextResponse.json({
      ...result,
      badgeHtml: result.certificate
        ? buildCertificateBadgeMarkup({
            certificateCode: result.certificate.certificateCode,
            holderName: result.certificate.holderName,
          })
        : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Ungültige Prüfungsdaten.' },
        { status: 400 },
      );
    }

    const isAuthFailure =
      error instanceof Error && error.message === 'Authentication required.';
    logError('certification_exam_submit_failed', {
      errorMessage: error instanceof Error ? error.message : 'unknown_error',
      isAuthFailure,
    });
    return NextResponse.json(
      {
        error: isAuthFailure
          ? 'Authentication required.'
          : 'Exam attempt could not be submitted.',
      },
      { status: isAuthFailure ? 401 : 400 },
    );
  }
}
