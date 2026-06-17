import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  AGENT_OPERATOR_CANDIDATE_STATUS_VALUES,
  listAgentOperatorCandidates,
} from '@/lib/agent-kit/candidates';
import { getAgentOperatorRun } from '@/lib/agent-kit/runs';
import {
  authenticateAgentKitHeaders,
  findMissingAgentKitScopes,
  mapAgentKitAuthenticationError,
} from '@/lib/agent-kit/operator-auth';
import { touchAgentOperatorReadUsage } from '@/lib/agent-kit/operator';

const reviewExportQuerySchema = z.object({
  registerId: z.string().trim().min(1).max(200),
  status: z.enum(AGENT_OPERATOR_CANDIDATE_STATUS_VALUES).optional(),
  runId: z.string().trim().min(1).max(200).optional(),
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
      'read:audit',
    ]);
    if (missingScopes.length > 0) {
      return NextResponse.json(
        {
          error:
            'Dieser Agent-Kit-API-Key darf keine Review-Auszüge lesen.',
          missingScopes,
        },
        { status: 403 },
      );
    }

    const query = reviewExportQuerySchema.parse({
      registerId: req.nextUrl.searchParams.get('registerId') ?? undefined,
      status: req.nextUrl.searchParams.get('status') ?? undefined,
      runId: req.nextUrl.searchParams.get('runId') ?? undefined,
    });
    const [candidateResult, runResult] = await Promise.all([
      listAgentOperatorCandidates({
        record: authentication.record,
        registerId: query.registerId,
        status: query.status,
        runId: query.runId,
        limit: 200,
      }),
      query.runId
        ? getAgentOperatorRun({
            record: authentication.record,
            registerId: query.registerId,
            runId: query.runId,
          })
        : Promise.resolve(null),
    ]);

    if (!candidateResult) {
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
      mode: 'audit_read',
      scopes: authentication.record.scopes,
      kind: 'kiregister.agentReviewExport',
      schemaVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
      register: candidateResult.register,
      filters: {
        status: query.status ?? null,
        runId: query.runId ?? null,
      },
      run: runResult?.run ?? null,
      totalCount: candidateResult.totalCount,
      exportedCount: candidateResult.count,
      limit: candidateResult.limit,
      statusCounts: candidateResult.statusCounts,
      candidates: candidateResult.candidates,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Ungueltige Review-Export-Abfrage.' },
        { status: 400 },
      );
    }

    console.error('Agent operator review export route failed:', error);
    return NextResponse.json(
      { error: 'Operator-Review-Auszug konnte nicht erzeugt werden.' },
      { status: 500 },
    );
  }
}
