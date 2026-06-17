import { NextRequest, NextResponse } from 'next/server';

import {
  getAgentOperatorCandidateForLocation,
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

function handleCandidateReviewError(error: unknown) {
  if (error instanceof ServerAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error('Agent candidate detail route failed:', error);
  return NextResponse.json(
    { error: 'Review-Kandidat konnte nicht geladen werden.' },
    { status: 500 },
  );
}

export async function GET(req: NextRequest, context: RouteContext) {
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

    const result = await getAgentOperatorCandidateForLocation({
      location: authorization.location,
      scopeType: authorization.scopeType,
      candidateId,
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
