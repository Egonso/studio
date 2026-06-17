import { NextRequest, NextResponse } from 'next/server';

import {
  AgentOperatorCandidateMergeStateError,
  mergeAgentOperatorCandidateForLocation,
} from '@/lib/agent-kit/candidates';
import {
  authorizeAgentOperatorCandidateReview,
} from '@/lib/agent-kit/candidate-review-auth';
import {
  buildSubmittedUseCaseUrls,
} from '@/lib/agent-kit/manifest';
import {
  ServerAuthError,
} from '@/lib/server-auth';

interface RouteContext {
  params: Promise<{ orgId: string; candidateId: string }>;
}

function handleCandidateMergeError(error: unknown) {
  if (error instanceof ServerAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof AgentOperatorCandidateMergeStateError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  console.error('Agent candidate merge route failed:', error);
  return NextResponse.json(
    { error: 'Review-Kandidat konnte nicht übernommen werden.' },
    { status: 500 },
  );
}

export async function POST(req: NextRequest, context: RouteContext) {
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

    const result = await mergeAgentOperatorCandidateForLocation({
      location: authorization.location,
      scopeType: authorization.scopeType,
      candidateId,
      mergedByUserId: authorization.user.uid,
      mergedByEmail: authorization.user.email,
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Review-Kandidat nicht gefunden.' },
        { status: 404 },
      );
    }

    const urls = buildSubmittedUseCaseUrls({
      useCaseId: result.useCase.useCaseId,
      workspaceId:
        authorization.scopeType === 'personal'
          ? null
          : authorization.location.register.workspaceId,
    });

    return NextResponse.json(
      {
        register: result.register,
        candidate: result.candidate,
        useCase: {
          useCaseId: result.useCase.useCaseId,
          status: result.useCase.status,
          purpose: result.useCase.purpose,
          detailPath: urls.detailPath,
          detailUrl: urls.detailUrl,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleCandidateMergeError(error);
  }
}
