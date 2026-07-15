import { randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';

import {
  ART4_EXAM_VERSION,
  ART4_PASS_THRESHOLD,
  ART4_VALIDITY_MONTHS,
  getArt4Module,
} from '@/lib/art4-training/definitions';
import { ART4_ANSWER_KEYS } from '@/lib/art4-training/answers';
import { requireCertificationActor } from '@/lib/certification/request-auth';
import { issueTrainingProgramCertificate } from '@/lib/certification/server';
import {
  getAdminDb,
  hasFirebaseAdminCredentials,
} from '@/lib/firebase-admin';
import { logError } from '@/lib/observability/logger';
import {
  buildRateLimitKey,
  enforceRequestRateLimit,
} from '@/lib/security/request-security';

interface SubmitBody {
  moduleSlug?: unknown;
  answers?: unknown;
  company?: unknown;
}

export async function POST(request: Request) {
  try {
    const actor = await requireCertificationActor(request);
    const rateLimit = await enforceRequestRateLimit({
      request,
      namespace: 'certification-art4-submit',
      key: buildRateLimitKey(request, actor.uid, actor.email),
      limit: 30,
      windowMs: 60 * 60 * 1000,
      logContext: {
        actorUserId: actor.uid,
      },
    });
    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: 'Zu viele Versuche in kurzer Zeit. Bitte später erneut.' },
        { status: 429 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as SubmitBody;
    const moduleSlug =
      typeof body.moduleSlug === 'string' ? body.moduleSlug : '';
    const moduleDefinition = getArt4Module(moduleSlug);
    const answerKey = ART4_ANSWER_KEYS[moduleSlug];

    if (!moduleDefinition || !answerKey) {
      return NextResponse.json(
        { error: 'Unbekanntes Schulungsmodul.' },
        { status: 400 },
      );
    }

    const answers = Array.isArray(body.answers) ? body.answers : null;
    if (
      !answers ||
      answers.length !== answerKey.length ||
      answers.some((value) => typeof value !== 'number')
    ) {
      return NextResponse.json(
        { error: 'Bitte beantworten Sie alle Fragen.' },
        { status: 400 },
      );
    }

    const results = answerKey.map(
      (correctIndex, index) => answers[index] === correctIndex,
    );
    const score = results.filter(Boolean).length;
    const passed = score >= ART4_PASS_THRESHOLD;
    const company =
      typeof body.company === 'string' && body.company.trim().length > 0
        ? body.company.trim().slice(0, 200)
        : null;

    if (hasFirebaseAdminCredentials()) {
      try {
        await getAdminDb()
          .collection('art4_training_attempts')
          .doc(randomUUID())
          .set({
            moduleSlug,
            userId: actor.uid,
            email: actor.email.trim().toLowerCase(),
            submittedAt: new Date().toISOString(),
            score,
            total: answerKey.length,
            passed,
          });
      } catch (error) {
        logError('art4_attempt_persist_failed', {
          errorMessage:
            error instanceof Error ? error.message : 'unknown_error',
        });
      }
    }

    if (!passed) {
      return NextResponse.json({
        passed: false,
        score,
        total: answerKey.length,
        passThreshold: ART4_PASS_THRESHOLD,
        results,
      });
    }

    const issued = await issueTrainingProgramCertificate(actor, {
      program: `art4-${moduleSlug}`,
      examVersion: ART4_EXAM_VERSION,
      modules: [
        moduleDefinition.certificateModuleLabel,
        'Lernkontrolle bestanden (mind. 6 von 8 Fragen)',
        'Kostenlose Schulung · fachlich redaktionell kuratiert · KI-gestützte Werkzeuge unterstützend eingesetzt',
      ],
      company,
      validityMonths: ART4_VALIDITY_MONTHS,
    });

    return NextResponse.json({
      passed: true,
      score,
      total: answerKey.length,
      passThreshold: ART4_PASS_THRESHOLD,
      results,
      certificate: {
        code: issued.certificate.certificateCode,
        verifyUrl: issued.certificate.publicUrl,
        documentUrl: issued.certificate.latestDocumentUrl,
        validUntil: issued.certificate.validUntil,
        holderName: issued.certificate.holderName,
      },
    });
  } catch (error) {
    const isAuthFailure =
      error instanceof Error && error.message === 'Authentication required.';
    logError('certification_art4_submit_failed', {
      errorMessage: error instanceof Error ? error.message : 'unknown_error',
      isAuthFailure,
    });
    return NextResponse.json(
      {
        error: isAuthFailure
          ? 'Authentication required.'
          : 'Die Lernkontrolle konnte nicht ausgewertet werden.',
      },
      { status: isAuthFailure ? 401 : 400 },
    );
  }
}
