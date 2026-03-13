import { NextResponse } from 'next/server';

import { buildCertificateBadgeMarkup } from '@/lib/certification/badge';
import { requireCertificationActor } from '@/lib/certification/request-auth';
import { submitExamAttempt } from '@/lib/certification/server';

export async function POST(request: Request) {
  try {
    const actor = await requireCertificationActor(request);
    const body = (await request.json()) as {
      attemptId?: string;
      sectionAnswers?: number[][];
      company?: string | null;
    };

    if (!body.attemptId || !Array.isArray(body.sectionAnswers)) {
      return NextResponse.json(
        { error: 'Attempt ID and section answers are required.' },
        { status: 400 },
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
    console.error('Exam submit route failed:', error);
    return NextResponse.json(
      { error: 'Exam attempt could not be submitted.' },
      { status: 400 },
    );
  }
}
