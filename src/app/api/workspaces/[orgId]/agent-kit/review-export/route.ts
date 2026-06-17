import { NextRequest, NextResponse } from 'next/server';

import {
  AGENT_OPERATOR_CANDIDATE_STATUS_VALUES,
  listAgentOperatorCandidatesForLocation,
  type AgentOperatorCandidateStatus,
} from '@/lib/agent-kit/candidates';
import { getAgentOperatorRunForLocation } from '@/lib/agent-kit/runs';
import {
  authorizeAgentOperatorCandidateReview,
} from '@/lib/agent-kit/candidate-review-auth';
import {
  ServerAuthError,
} from '@/lib/server-auth';

interface RouteContext {
  params: Promise<{ orgId: string }>;
}

function parseStatus(value: string | null): AgentOperatorCandidateStatus | null {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  if (
    AGENT_OPERATOR_CANDIDATE_STATUS_VALUES.includes(
      normalized as AgentOperatorCandidateStatus,
    )
  ) {
    return normalized as AgentOperatorCandidateStatus;
  }

  throw new ServerAuthError('Ungültiger Kandidatenstatus.', 400);
}

function handleReviewExportError(error: unknown) {
  if (error instanceof ServerAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error('Agent review export route failed:', error);
  return NextResponse.json(
    { error: 'Review-Auszug konnte nicht erzeugt werden.' },
    { status: 500 },
  );
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

    const runId = req.nextUrl.searchParams.get('runId')?.trim() || null;
    const status = parseStatus(req.nextUrl.searchParams.get('status'));
    const [candidateResult, runResult] = await Promise.all([
      listAgentOperatorCandidatesForLocation({
        location: authorization.location,
        scopeType: authorization.scopeType,
        status,
        runId,
        limit: 200,
      }),
      runId
        ? getAgentOperatorRunForLocation({
            location: authorization.location,
            scopeType: authorization.scopeType,
            runId,
          })
        : Promise.resolve(null),
    ]);

    return NextResponse.json({
      kind: 'kiregister.agentReviewExport',
      schemaVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
      generatedBy: authorization.user.email ?? authorization.user.uid,
      register: candidateResult.register,
      filters: {
        status,
        runId,
      },
      run: runResult?.run ?? null,
      totalCount: candidateResult.totalCount,
      exportedCount: candidateResult.count,
      limit: candidateResult.limit,
      statusCounts: candidateResult.statusCounts,
      candidates: candidateResult.candidates,
    });
  } catch (error) {
    return handleReviewExportError(error);
  }
}
