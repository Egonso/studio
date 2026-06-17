import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  findMissingAgentKitScopes,
  authenticateAgentKitHeaders,
  mapAgentKitAuthenticationError,
} from '@/lib/agent-kit/operator-auth';
import {
  getAgentOperatorUseCase,
  touchAgentOperatorReadUsage,
} from '@/lib/agent-kit/operator';

interface RouteContext {
  params: Promise<{ useCaseId: string }>;
}

const operatorUseCaseDetailQuerySchema = z.object({
  registerId: z.string().trim().min(1).max(200),
});

export async function GET(req: NextRequest, context: RouteContext) {
  const { useCaseId } = await context.params;

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

    const query = operatorUseCaseDetailQuerySchema.parse({
      registerId: req.nextUrl.searchParams.get('registerId') ?? undefined,
    });
    const result = await getAgentOperatorUseCase(authentication.record, {
      registerId: query.registerId,
      useCaseId,
    });

    if (!result) {
      return NextResponse.json(
        {
          error:
            'Use Case fuer diesen Agent-Kit-API-Key nicht gefunden.',
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

    console.error('Agent operator use case route failed:', error);
    return NextResponse.json(
      { error: 'Operator-Use-Case konnte nicht geladen werden.' },
      { status: 500 },
    );
  }
}
