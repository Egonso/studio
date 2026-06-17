import { NextRequest, NextResponse } from 'next/server';

import { getAgentOperatorRunForLocation } from '@/lib/agent-kit/runs';
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
  params: Promise<{ orgId: string; runId: string }>;
}

function handleAgentRunDetailError(error: unknown) {
  if (error instanceof ServerAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error('Agent run detail route failed:', error);
  return NextResponse.json(
    { error: 'Agent-Lauf konnte nicht geladen werden.' },
    { status: 500 },
  );
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { orgId, runId } = await context.params;
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

    const run = await getAgentOperatorRunForLocation({
      location: authorization.location,
      scopeType: authorization.scopeType,
      runId,
    });

    if (!run) {
      return NextResponse.json(
        { error: 'Agent-Lauf nicht gefunden.' },
        { status: 404 },
      );
    }

    const candidates = await listAgentOperatorCandidatesForLocation({
      location: authorization.location,
      scopeType: authorization.scopeType,
      runId,
      limit: 100,
    });

    return NextResponse.json({
      register: run.register,
      run: run.run,
      candidates: candidates.candidates,
      candidateCount: candidates.totalCount,
      candidateStatusCounts: candidates.statusCounts,
    });
  } catch (error) {
    return handleAgentRunDetailError(error);
  }
}
