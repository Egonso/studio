import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  createAgentOperatorRun,
  listAgentOperatorRuns,
  agentOperatorRunPayloadSchema,
} from '@/lib/agent-kit/runs';
import {
  authenticateAgentKitHeaders,
  findMissingAgentKitScopes,
  mapAgentKitAuthenticationError,
} from '@/lib/agent-kit/operator-auth';
import { touchAgentOperatorReadUsage } from '@/lib/agent-kit/operator';

const runListQuerySchema = z.object({
  registerId: z.string().trim().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(100).optional(),
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
            'Dieser Agent-Kit-API-Key darf keine Agent-Läufe lesen.',
          missingScopes,
        },
        { status: 403 },
      );
    }

    const query = runListQuerySchema.parse({
      registerId: req.nextUrl.searchParams.get('registerId') ?? undefined,
      limit: req.nextUrl.searchParams.get('limit') ?? undefined,
    });
    const result = await listAgentOperatorRuns({
      record: authentication.record,
      registerId: query.registerId,
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
        { error: error.issues[0]?.message ?? 'Ungueltige Run-Abfrage.' },
        { status: 400 },
      );
    }

    console.error('Agent operator runs route failed:', error);
    return NextResponse.json(
      { error: 'Operator-Läufe konnten nicht geladen werden.' },
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
            'Dieser Agent-Kit-API-Key darf keine Agent-Läufe dokumentieren.',
          missingScopes,
        },
        { status: 403 },
      );
    }

    const payload = agentOperatorRunPayloadSchema.parse(await req.json());
    const result = await createAgentOperatorRun({
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
        { error: error.issues[0]?.message ?? 'Ungueltiger Agent-Lauf.' },
        { status: 400 },
      );
    }

    console.error('Agent operator run create route failed:', error);
    return NextResponse.json(
      { error: 'Operator-Lauf konnte nicht dokumentiert werden.' },
      { status: 500 },
    );
  }
}
