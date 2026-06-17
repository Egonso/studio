import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  findMissingAgentKitScopes,
  authenticateAgentKitHeaders,
  mapAgentKitAuthenticationError,
} from '@/lib/agent-kit/operator-auth';
import { getAgentOperatorCandidate } from '@/lib/agent-kit/candidates';
import { touchAgentOperatorReadUsage } from '@/lib/agent-kit/operator';

interface RouteContext {
  params: Promise<{ candidateId: string }>;
}

const candidateDetailQuerySchema = z.object({
  registerId: z.string().trim().min(1).max(200),
});

export async function GET(req: NextRequest, context: RouteContext) {
  const { candidateId } = await context.params;

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

    const query = candidateDetailQuerySchema.parse({
      registerId: req.nextUrl.searchParams.get('registerId') ?? undefined,
    });
    const result = await getAgentOperatorCandidate({
      record: authentication.record,
      registerId: query.registerId,
      candidateId,
    });

    if (!result) {
      return NextResponse.json(
        {
          error:
            'Kandidat fuer diesen Agent-Kit-API-Key nicht gefunden.',
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

    console.error('Agent operator candidate route failed:', error);
    return NextResponse.json(
      { error: 'Operator-Kandidat konnte nicht geladen werden.' },
      { status: 500 },
    );
  }
}
