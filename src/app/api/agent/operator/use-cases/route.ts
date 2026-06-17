import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  findMissingAgentKitScopes,
  authenticateAgentKitHeaders,
  mapAgentKitAuthenticationError,
} from '@/lib/agent-kit/operator-auth';
import {
  listAgentOperatorUseCases,
  touchAgentOperatorReadUsage,
} from '@/lib/agent-kit/operator';
import { registerUseCaseStatusSchema } from '@/lib/register-first/schema';

const operatorUseCaseListQuerySchema = z.object({
  registerId: z.string().trim().min(1).max(200),
  status: registerUseCaseStatusSchema.optional(),
  searchText: z.string().trim().max(200).optional(),
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
      'read:usecase',
    ]);
    if (missingScopes.length > 0) {
      return NextResponse.json(
        {
          error:
            'Dieser Agent-Kit-API-Key darf keine Use Cases lesen.',
          missingScopes,
        },
        { status: 403 },
      );
    }

    const query = operatorUseCaseListQuerySchema.parse({
      registerId: req.nextUrl.searchParams.get('registerId') ?? undefined,
      status: req.nextUrl.searchParams.get('status') ?? undefined,
      searchText: req.nextUrl.searchParams.get('searchText') ?? undefined,
      limit: req.nextUrl.searchParams.get('limit') ?? undefined,
    });
    const result = await listAgentOperatorUseCases(authentication.record, query);

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
      mode: 'read_only',
      scopes: authentication.record.scopes,
      ...result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Ungueltige Operator-Abfrage.' },
        { status: 400 },
      );
    }

    console.error('Agent operator use cases route failed:', error);
    return NextResponse.json(
      { error: 'Operator-Use-Cases konnten nicht geladen werden.' },
      { status: 500 },
    );
  }
}
