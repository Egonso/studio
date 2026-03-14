import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { db } from '@/lib/firebase-admin';
import { deliverWorkspaceNotificationHooks } from '@/lib/enterprise/notifications';
import { captureException } from '@/lib/observability/error-tracking';
import { logInfo, logWarn } from '@/lib/observability/logger';
import {
  buildExternalSubmissionRecord,
  createSubmissionApprovalWorkflow,
} from '@/lib/register-first/external-submissions';
import { sanitizeFirestorePayload } from '@/lib/register-first/firestore-sanitize';
import {
  markSupplierRequestTokenUsed,
  resolveSupplierRequestTokenAccess,
} from '@/lib/register-first/request-token-admin';
import { registerFirstFlags } from '@/lib/register-first/flags';
import { parseSupplierRequestSubmission } from '@/lib/register-first/supplier-requests';
import type { Register } from '@/lib/register-first/types';
import { checkPublicRateLimit } from '@/lib/security/public-rate-limit';
import { getWorkspaceSettingsForRegister } from '@/lib/workspace-admin';

const SUPPLIER_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const SUPPLIER_RATE_LIMIT_MAX_REQUESTS = 8;

function mapTokenFailure(reason: string): { status: number; error: string } {
  switch (reason) {
    case 'expired':
      return {
        status: 410,
        error: 'Dieser Lieferanten-Link ist abgelaufen.',
      };
    case 'revoked':
      return {
        status: 410,
        error: 'Dieser Lieferanten-Link wurde widerrufen.',
      };
    case 'register_not_found':
      return {
        status: 410,
        error: 'Dieses Register ist nicht mehr aktiv.',
      };
    default:
      return {
        status: 404,
        error: 'Ungueltiger Lieferanten-Link.',
      };
  }
}

function resolveSupplierRateLimitKey(request: Request, requestToken: string): string {
  const forwardedFor = request.headers.get('x-forwarded-for') ?? 'unknown';
  const firstIp = forwardedFor.split(',')[0]?.trim() || 'unknown';
  return `${firstIp}:${requestToken}`;
}

export async function POST(req: Request) {
  let phase = 'parse_request';
  try {
    const body = await req.json();
    phase = 'resolve_token';
    const requestToken =
      typeof body?.requestToken === 'string' ? body.requestToken.trim() : '';

    if (!requestToken) {
      return NextResponse.json(
        { error: 'requestToken is required.' },
        { status: 400 },
      );
    }

    const rateLimitKey = resolveSupplierRateLimitKey(req, requestToken);
    const supplierRateLimit = await checkPublicRateLimit({
      namespace: 'supplier-submit',
      key: rateLimitKey,
      limit: SUPPLIER_RATE_LIMIT_MAX_REQUESTS,
      windowMs: SUPPLIER_RATE_LIMIT_WINDOW_MS,
    });
    if (!supplierRateLimit.ok) {
      logWarn('supplier_submit_rate_limited', {
        requestTokenPreview: requestToken.slice(0, 8),
        limiterSource: supplierRateLimit.source,
      });
      return NextResponse.json(
        {
          error:
            'Zu viele Einreichungsversuche in kurzer Zeit. Bitte warten Sie kurz und versuchen Sie es erneut.',
        },
        { status: 429 },
      );
    }

    const tokenAccess = await resolveSupplierRequestTokenAccess(requestToken);
    if (!tokenAccess.ok) {
      const mapped = mapTokenFailure(tokenAccess.reason);
      logWarn('supplier_submit_token_rejected', {
        reason: tokenAccess.reason,
      });
      return NextResponse.json(
        { error: mapped.error },
        { status: mapped.status },
      );
    }

    phase = 'parse_submission';
    const parsedSubmission = parseSupplierRequestSubmission({
      supplierEmail: body?.supplierEmail,
      toolName: body?.toolName,
      systems: registerFirstFlags.supplierMultisystemCapture
        ? body?.systems
        : undefined,
      purpose: body?.purpose,
      dataCategory: body?.dataCategory,
      dataCategories: body?.dataCategories,
      aiActCategory: body?.aiActCategory,
      workflowConnectionMode: registerFirstFlags.supplierMultisystemCapture
        ? body?.workflowConnectionMode
        : undefined,
      workflowSummary: registerFirstFlags.supplierMultisystemCapture
        ? body?.workflowSummary
        : undefined,
    });
    phase = 'load_register';
    const registerRef = db.doc(
      `users/${tokenAccess.value.token.ownerId}/registers/${tokenAccess.value.token.registerId}`,
    );
    const registerSnapshot = await registerRef.get();
    const register = registerSnapshot.exists
      ? (registerSnapshot.data() as Register)
      : null;
    phase = 'load_workspace_settings';
    const workspaceSettings = await getWorkspaceSettingsForRegister({
      registerWorkspaceId: register?.workspaceId,
      registerOwnerId: tokenAccess.value.token.ownerId,
    });
    phase = 'build_approval_workflow';
    const approvalWorkflow = createSubmissionApprovalWorkflow({
      settings: workspaceSettings,
      requestedAt: new Date().toISOString(),
      requestedBy: parsedSubmission.supplierEmail,
    });

    phase = 'build_submission_record';
    const submission = buildExternalSubmissionRecord({
      registerId: tokenAccess.value.token.registerId,
      ownerId: tokenAccess.value.token.ownerId,
      sourceType: 'supplier_request',
      requestTokenId: tokenAccess.value.token.tokenId,
      submittedByName: parsedSubmission.supplierEmail,
      submittedByEmail: parsedSubmission.supplierEmail,
      submittedAt: new Date(),
      rawPayloadSnapshot: parsedSubmission,
      status: 'submitted',
      approvalWorkflow,
    });

    phase = 'persist_submission';
    await db
      .doc(
        `users/${submission.ownerId}/registers/${submission.registerId}/externalSubmissions/${submission.submissionId}`,
      )
      .set(sanitizeFirestorePayload(submission));

    phase = 'mark_token_used';
    await markSupplierRequestTokenUsed(tokenAccess.value.token.tokenId);

    const workspaceId = register?.workspaceId ?? tokenAccess.value.token.ownerId;
    phase = 'notify_submission_received';
    await deliverWorkspaceNotificationHooks({
      workspaceId,
      eventType: 'submission_received',
      eventId: submission.submissionId,
      data: {
        kind: 'supplier_request',
        submissionId: submission.submissionId,
        registerId: submission.registerId,
        submittedByEmail: submission.submittedByEmail,
      },
    }).catch((hookError) => {
      logWarn('supplier_submission_hook_failed', {
        submissionId: submission.submissionId,
        workspaceId,
        error:
          hookError instanceof Error ? hookError.message : 'unknown_hook_error',
      });
    });

    if (approvalWorkflow?.status === 'pending') {
      phase = 'notify_approval_needed';
      await deliverWorkspaceNotificationHooks({
        workspaceId,
        eventType: 'approval_needed',
        eventId: `${submission.submissionId}_approval`,
        data: {
          kind: 'supplier_request',
          submissionId: submission.submissionId,
          registerId: submission.registerId,
          requiredRoles: approvalWorkflow.requiredRoles,
        },
      }).catch((hookError) => {
        logWarn('supplier_submission_approval_hook_failed', {
          submissionId: submission.submissionId,
          workspaceId,
          error:
            hookError instanceof Error ? hookError.message : 'unknown_hook_error',
        });
      });
    }

    logInfo('supplier_submission_created', {
      ownerId: submission.ownerId,
      registerId: submission.registerId,
      requestTokenId: submission.requestTokenId,
      submissionId: submission.submissionId,
    });

    return NextResponse.json({
      success: true,
      submissionId: submission.submissionId,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Bitte pruefen Sie die uebermittelten Lieferantenangaben.' },
        { status: 400 },
      );
    }

    logWarn('supplier_submit_failed', {
      phase,
      error: error instanceof Error ? error.message : 'unknown_error',
    });
    captureException(error, {
      boundary: 'app',
      component: 'supplier-submit-route',
      route: '/api/supplier-submit',
      tags: {
        phase,
      },
    });
    return NextResponse.json(
      {
        error: 'Lieferantenangaben konnten nicht gespeichert werden.',
        ...(process.env.NODE_ENV !== 'production'
          ? {
              detail:
                error instanceof Error ? error.message : 'unknown_error',
              phase,
            }
          : {}),
      },
      { status: 500 },
    );
  }
}
