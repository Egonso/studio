import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  AGENT_OPERATOR_CANDIDATE_REVIEW_STATUS_VALUES,
  reviewAgentOperatorCandidateForLocation,
} from '@/lib/agent-kit/candidates';
import {
  authorizeAgentOperatorCandidateReview,
} from '@/lib/agent-kit/candidate-review-auth';
import {
  ServerAuthError,
} from '@/lib/server-auth';

interface RouteContext {
  params: Promise<{ orgId: string; candidateId: string }>;
}

const candidateReviewSchema = z.object({
  status: z.enum(AGENT_OPERATOR_CANDIDATE_REVIEW_STATUS_VALUES),
  note: z.string().trim().max(1000).optional().nullable(),
});

function handleCandidateReviewError(error: unknown) {
  if (error instanceof ServerAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? 'Ungültige Review-Entscheidung.' },
      { status: 400 },
    );
  }

  console.error('Agent candidate review decision route failed:', error);
  return NextResponse.json(
    { error: 'Review-Entscheidung konnte nicht gespeichert werden.' },
    { status: 500 },
  );
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { orgId, candidateId } = await context.params;
  const registerId = req.nextUrl.searchParams.get('registerId')?.trim();

  if (!registerId) {
    return NextResponse.json(
      { error: 'Register-ID fehlt.' },
      { status: 400 },
    );
  }

  try {
    const authorization = await authorizeAgentOperatorCandidateReview({
      authorizationHeader: req.headers.get('authorization'),
      orgId,
      registerId,
    });

    if (!authorization) {
      return NextResponse.json(
        { error: 'Register nicht gefunden.' },
        { status: 404 },
      );
    }

    const payload = candidateReviewSchema.parse(await req.json());
    const result = await reviewAgentOperatorCandidateForLocation({
      location: authorization.location,
      scopeType: authorization.scopeType,
      candidateId,
      status: payload.status,
      note: payload.note,
      decidedByUserId: authorization.user.uid,
      decidedByEmail: authorization.user.email,
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Review-Kandidat nicht gefunden.' },
        { status: 404 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleCandidateReviewError(error);
  }
}
