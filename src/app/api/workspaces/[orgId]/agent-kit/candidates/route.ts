import { NextRequest, NextResponse } from 'next/server';

import {
  listAgentOperatorCandidatesForLocation,
} from '@/lib/agent-kit/candidates';
import {
  authorizeAgentOperatorCandidateReview,
} from '@/lib/agent-kit/candidate-review-auth';
import {
  ServerAuthError,
} from '@/lib/server-auth';

interface RouteContext {
  params: Promise<{ orgId: string }>;
}

function handleCandidateReviewError(error: unknown) {
  if (error instanceof ServerAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error('Agent candidate review route failed:', error);
  return NextResponse.json(
    { error: 'Review-Kandidaten konnten nicht geladen werden.' },
    { status: 500 },
  );
}

function parseLimit(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { orgId } = await context.params;
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

    const result = await listAgentOperatorCandidatesForLocation({
      location: authorization.location,
      scopeType: authorization.scopeType,
      limit: parseLimit(req.nextUrl.searchParams.get('limit')),
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleCandidateReviewError(error);
  }
}
