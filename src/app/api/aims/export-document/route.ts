import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  DOCUMENTERO_API_URL,
  resolveDocumenteroAimsTemplateId,
  resolveDocumenteroApiKey,
} from '@/lib/documentero';
import { logError, logInfo } from '@/lib/observability/logger';
import { requireUser, ServerAuthError } from '@/lib/server-auth';
import {
  buildRateLimitKey,
  enforceRequestRateLimit,
  safePlainTextSchema,
} from '@/lib/security/request-security';

const AimsProgressSchema = z
  .object({
    step1_complete: z.boolean().optional(),
    step2_complete: z.boolean().optional(),
    step3_complete: z.boolean().optional(),
    step4_complete: z.boolean().optional(),
    step5_complete: z.boolean().optional(),
    step6_complete: z.boolean().optional(),
    updatedAt: z.unknown().optional(),
  })
  .passthrough();

const AimsExportPayloadSchema = z.object({
  format: z.enum(['pdf', 'docx']),
  exportData: z.object({
    projectName: safePlainTextSchema('Projektname', { max: 160 }),
    scope: z.string().trim().max(4000).optional().default(''),
    systems: z.string().trim().max(4000).optional().default(''),
    factors: z.string().trim().max(4000).optional().default(''),
    departments: z.string().trim().max(4000).optional().default(''),
    stakeholders: z.array(z.record(z.unknown())).max(100).optional().default([]),
    policy: z.string().trim().max(12000).optional().default(''),
    raci: z.array(z.record(z.unknown())).max(100).optional().default([]),
    risks: z.array(z.record(z.unknown())).max(100).optional().default([]),
    kpis: z.string().trim().max(4000).optional().default(''),
    monitoringProcess: z.string().trim().max(4000).optional().default(''),
    auditRhythm: z.string().trim().max(2000).optional().default(''),
    improvementProcess: z.string().trim().max(4000).optional().default(''),
    aimsProgress: AimsProgressSchema,
    generatedAt: z.string().datetime(),
  }),
});

function normalizeAimsTimestamp(value: unknown): string {
  if (!value || typeof value !== 'object') {
    return '';
  }

  const seconds = (value as { seconds?: unknown }).seconds;
  if (typeof seconds === 'number' && Number.isFinite(seconds)) {
    return new Date(seconds * 1000).toLocaleString('de-DE');
  }

  return '';
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireUser(request.headers.get('authorization'));
    const payload = AimsExportPayloadSchema.parse(await request.json());

    const rateLimit = await enforceRequestRateLimit({
      request,
      namespace: 'aims-export-document',
      key: buildRateLimitKey(request, actor.uid, payload.format),
      limit: 8,
      windowMs: 60 * 60 * 1000,
      logContext: {
        actorUserId: actor.uid,
      },
    });

    if (!rateLimit.ok) {
      return NextResponse.json(
        {
          error: 'Zu viele Dokument-Exporte in kurzer Zeit. Bitte versuchen Sie es später erneut.',
        },
        { status: 429 },
      );
    }

    const apiKey = resolveDocumenteroApiKey();
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Document Export ist nicht konfiguriert. Hinterlegen Sie DOCUMENTERO_API_KEY auf dem Server.',
        },
        { status: 503 },
      );
    }

    const response = await fetch(DOCUMENTERO_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `apiKey ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document: resolveDocumenteroAimsTemplateId(),
        format: payload.format,
        data: {
          ...payload.exportData,
          'aimsProgress.step1_complete':
            payload.exportData.aimsProgress?.step1_complete ?? false,
          'aimsProgress.step2_complete':
            payload.exportData.aimsProgress?.step2_complete ?? false,
          'aimsProgress.step3_complete':
            payload.exportData.aimsProgress?.step3_complete ?? false,
          'aimsProgress.step4_complete':
            payload.exportData.aimsProgress?.step4_complete ?? false,
          'aimsProgress.step5_complete':
            payload.exportData.aimsProgress?.step5_complete ?? false,
          'aimsProgress.step6_complete':
            payload.exportData.aimsProgress?.step6_complete ?? false,
          'aimsProgress.updatedAt': normalizeAimsTimestamp(
            payload.exportData.aimsProgress?.updatedAt,
          ),
          generatedAt: new Date(payload.exportData.generatedAt).toLocaleString('de-DE'),
        },
      }),
    });

    const result = (await response.json().catch(() => ({}))) as {
      status?: number;
      data?: string;
      message?: string;
    };

    if (!response.ok || result.status !== 200 || !result.data) {
      logError('aims_export_document_failed', {
        actorUserId: actor.uid,
        format: payload.format,
        responseStatus: response.status,
      });
      return NextResponse.json(
        {
          error:
            result.message ??
            'Dokument konnte gerade nicht erstellt werden. Bitte versuchen Sie es erneut.',
        },
        { status: 502 },
      );
    }

    logInfo('aims_export_document_created', {
      actorUserId: actor.uid,
      format: payload.format,
    });

    return NextResponse.json({
      success: true,
      url: result.data,
    });
  } catch (error) {
    if (error instanceof ServerAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Ungültige Exportdaten.' },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Dokument konnte nicht erstellt werden.' },
      { status: 500 },
    );
  }
}
