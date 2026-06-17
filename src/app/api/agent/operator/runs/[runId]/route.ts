import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  agentOperatorRunUpdatePayloadSchema,
  getAgentOperatorRun,
  updateAgentOperatorRun,
} from '@/lib/agent-kit/runs';
import {
  authenticateAgentKitHeaders,
  findMissingAgentKitScopes,
  mapAgentKitAuthenticationError,
} from '@/lib/agent-kit/operator-auth';
import { touchAgentOperatorReadUsage } from '@/lib/agent-kit/operator';

interface RouteContext {
  params: Promise<{ runId: string }>;
}

function getRegisterId(req: NextRequest): string | null {
  return req.nextUrl.searchParams.get('registerId')?.trim() || null;
}

async function authenticateRunRequest(req: NextRequest) {
  const authentication = await authenticateAgentKitHeaders(req.headers);
  if (!authentication.ok) {
    const mapped = mapAgentKitAuthenticationError(authentication.reason);
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: mapped.error },
        { status: mapped.status },
      ),
    };
  }

  const missingScopes = findMissingAgentKitScopes(authentication.record, [
    'write:candidate',
  ]);
  if (missingScopes.length > 0) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          error:
            'Dieser Agent-Kit-API-Key darf keine Agent-Läufe verwenden.',
          missingScopes,
        },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true as const,
    record: authentication.record,
  };
}

function handleRunRouteError(error: unknown) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? 'Ungueltige Run-Anfrage.' },
      { status: 400 },
    );
  }

  console.error('Agent operator run item route failed:', error);
  return NextResponse.json(
    { error: 'Operator-Lauf konnte nicht verarbeitet werden.' },
    { status: 500 },
  );
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { runId } = await context.params;
  const registerId = getRegisterId(req);
  if (!registerId) {
    return NextResponse.json(
      { error: 'Register-ID fehlt.' },
      { status: 400 },
    );
  }

  try {
    const authorization = await authenticateRunRequest(req);
    if (!authorization.ok) {
      return authorization.response;
    }

    const result = await getAgentOperatorRun({
      record: authorization.record,
      registerId,
      runId,
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Agent-Lauf nicht gefunden.' },
        { status: 404 },
      );
    }

    await touchAgentOperatorReadUsage(authorization.record);

    return NextResponse.json({
      mode: 'candidate_review',
      scopes: authorization.record.scopes,
      ...result,
    });
  } catch (error) {
    return handleRunRouteError(error);
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { runId } = await context.params;
  const registerId = getRegisterId(req);
  if (!registerId) {
    return NextResponse.json(
      { error: 'Register-ID fehlt.' },
      { status: 400 },
    );
  }

  try {
    const authorization = await authenticateRunRequest(req);
    if (!authorization.ok) {
      return authorization.response;
    }

    const payload = agentOperatorRunUpdatePayloadSchema.parse(await req.json());
    const result = await updateAgentOperatorRun({
      record: authorization.record,
      registerId,
      runId,
      payload,
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Agent-Lauf nicht gefunden.' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      mode: 'candidate_review',
      scopes: authorization.record.scopes,
      ...result,
    });
  } catch (error) {
    return handleRunRouteError(error);
  }
}
