import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  findMissingAgentKitScopes,
  authenticateAgentKitHeaders,
  mapAgentKitAuthenticationError,
} from '@/lib/agent-kit/operator-auth';
import {
  AGENT_OPERATOR_CANDIDATE_STATUS_VALUES,
  agentOperatorCandidatePayloadSchema,
  createAgentOperatorCandidate,
  listAgentOperatorCandidates,
} from '@/lib/agent-kit/candidates';
import { touchAgentOperatorReadUsage } from '@/lib/agent-kit/operator';

const candidateListQuerySchema = z.object({
  registerId: z.string().trim().min(1).max(200),
  status: z.enum(AGENT_OPERATOR_CANDIDATE_STATUS_VALUES).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const authentication = await authenticateAgentKitHeaders(req.headers);
    if (!authentication.ok) {
      const mapped = mapAgentKitAuthenticationError(authentication.reason);
      return NextResponse.json(
        { error: mapped.error },
        { status: mapped.status },
      );
    }

    const missingScopes = findMissingAgentKitScopes(authentication.record, [
      'write:candidate',
    ]);
    if (missingScopes.length > 0) {
      return NextResponse.json(
        {
          error:
            'Dieser Agent-Kit-API-Key darf keine Kandidaten lesen.',
          missingScopes,
        },
        { status: 403 },
      );
    }

    const query = candidateListQuerySchema.parse({
      registerId: req.nextUrl.searchParams.get('registerId') ?? undefined,
      status: req.nextUrl.searchParams.get('status') ?? undefined,
      limit: req.nextUrl.searchParams.get('limit') ?? undefined,
    });
    const result = await listAgentOperatorCandidates({
      record: authentication.record,
      registerId: query.registerId,
      status: query.status,
      limit: query.limit,
    });

    if (!result) {
      return NextResponse.json(
        {
          error:
            'Register fuer diesen Agent-Kit-API-Key nicht gefunden.',
        },
        { status: 404 },
      );
    }

    await touchAgentOperatorReadUsage(authentication.record);

    return NextResponse.json({
      mode: 'candidate_review',
      scopes: authentication.record.scopes,
      ...result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Ungueltige Kandidaten-Abfrage.' },
        { status: 400 },
      );
    }

    console.error('Agent operator candidates route failed:', error);
    return NextResponse.json(
      { error: 'Operator-Kandidaten konnten nicht geladen werden.' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authentication = await authenticateAgentKitHeaders(req.headers);
    if (!authentication.ok) {
      const mapped = mapAgentKitAuthenticationError(authentication.reason);
      return NextResponse.json(
        { error: mapped.error },
        { status: mapped.status },
      );
    }

    const missingScopes = findMissingAgentKitScopes(authentication.record, [
      'write:candidate',
    ]);
    if (missingScopes.length > 0) {
      return NextResponse.json(
        {
          error:
            'Dieser Agent-Kit-API-Key darf keine Kandidaten einreichen.',
          missingScopes,
        },
        { status: 403 },
      );
    }

    const payload = agentOperatorCandidatePayloadSchema.parse(await req.json());
    const result = await createAgentOperatorCandidate({
      record: authentication.record,
      payload,
    });

    if (!result) {
      return NextResponse.json(
        {
          error:
            'Register fuer diesen Agent-Kit-API-Key nicht gefunden.',
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        mode: 'candidate_review',
        scopes: authentication.record.scopes,
        ...result,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Ungueltiger Kandidat.' },
        { status: 400 },
      );
    }

    console.error('Agent operator candidate create route failed:', error);
    return NextResponse.json(
      { error: 'Operator-Kandidat konnte nicht gespeichert werden.' },
      { status: 500 },
    );
  }
}
