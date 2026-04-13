import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { db } from '@/lib/firebase-admin';
import { buildPublicAppUrl } from '@/lib/app-url';
import type { ApprovalWorkflow } from '@/lib/enterprise/workspace';
import { deliverWorkspaceNotificationHooks } from '@/lib/enterprise/notifications';
import { captureException } from '@/lib/observability/error-tracking';
import { logInfo, logWarn } from '@/lib/observability/logger';
import {
  buildExternalSubmissionRecord,
  createSubmissionApprovalWorkflow,
} from '@/lib/register-first/external-submissions';
import { sanitizeFirestorePayload } from '@/lib/register-first/firestore-sanitize';
import {
  hashIpForAudit,
  markSupplierRequestTokenUsed,
  resolveSupplierRequestTokenAccess,
} from '@/lib/register-first/request-token-admin';
import { sendSupplierSubmissionConfirmationEmail } from '@/lib/register-first/supplier-invite-email';
import { registerFirstFlags } from '@/lib/register-first/flags';
import { parseSupplierRequestSubmission } from '@/lib/register-first/supplier-requests';
import { parseSupplierInviteToken, updateSupplierInviteStatus } from '@/lib/register-first/supplier-invites';
import { parseSupplierInviteRecord } from '@/lib/register-first/supplier-invite-schema';
import { validateSupplierSession } from '@/lib/register-first/supplier-invite-session';
import type { SupplierInviteRecord } from '@/lib/register-first/supplier-invite-types';
import type { Register } from '@/lib/register-first/types';
import type { SubmissionRiskFlag } from '@/lib/register-first/submission-trust-tier';
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

function resolveClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for') ?? 'unknown';
  return forwardedFor.split(',')[0]?.trim() || 'unknown';
}

function resolveSupplierRateLimitKey(request: Request, requestToken: string): string {
  return `${resolveClientIp(request)}:${requestToken}`;
}

function isV2InviteToken(token: string): boolean {
  return token.startsWith('sinv1.');
}

const INVITE_COLLECTION = 'registerSupplierInvites';
const RAPID_SUBMISSION_THRESHOLD_MS = 30_000; // 30 seconds

function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveSubmittedSystemNames(
  body: Record<string, unknown>,
  fallbackToolName: string,
): string[] {
  const systems = Array.isArray(body.systems)
    ? body.systems
        .map((entry) => normalizeOptionalText(entry))
        .filter((value): value is string => value !== null)
    : [];

  if (systems.length > 0) {
    return Array.from(new Set(systems));
  }

  return [fallbackToolName];
}

function formatWorkspaceRole(role: string): string {
  switch (role) {
    case 'OWNER':
      return 'Inhaberschaft';
    case 'ADMIN':
      return 'Administration';
    case 'REVIEWER':
      return 'Review';
    case 'EXTERNAL_OFFICER':
      return 'Externer Officer';
    default:
      return 'internes Team';
  }
}

function buildSupplierNextStep(approvalWorkflow: ApprovalWorkflow | null | undefined) {
  if (
    approvalWorkflow &&
    approvalWorkflow.status === 'pending' &&
    approvalWorkflow.requiredRoles.length > 0
  ) {
    const roleLabel = approvalWorkflow.requiredRoles
      .map((role) => formatWorkspaceRole(role))
      .join(', ');

    return {
      nextStepTitle: 'Interne Freigabe ausstehend',
      nextStepDescription: `Die Einreichung liegt jetzt vor und wird intern geprueft. Fuer die naechste Freigabe sind ${roleLabel} vorgesehen.`,
    };
  }

  return {
    nextStepTitle: 'Interne Sichtung im Register',
    nextStepDescription:
      'Die Angaben liegen jetzt als nachvollziehbare externe Einreichung vor und koennen intern geprueft, freigegeben oder uebernommen werden.',
  };
}

function buildSupplierSetupUrl(verifiedEmail: string): string {
  const params = new URLSearchParams({
    email: verifiedEmail,
  });

  return buildPublicAppUrl(`/einrichten?${params.toString()}`);
}

function computeRiskFlags(
  invite: SupplierInviteRecord,
  submitIpHash: string,
  verifiedAt: string | undefined,
): SubmissionRiskFlag[] {
  const flags: SubmissionRiskFlag[] = [];

  // ipMismatch: OTP verification and submit from different IP hashes
  if (invite.lastUsedIpHash && invite.lastUsedIpHash !== submitIpHash) {
    flags.push('ipMismatch');
  }

  // rapidSubmission: < 30s between verification and submit
  if (verifiedAt) {
    const timeDiff = Date.now() - new Date(verifiedAt).getTime();
    if (timeDiff < RAPID_SUBMISSION_THRESHOLD_MS) {
      flags.push('rapidSubmission');
    }
  }

  // deliveryBounced
  if (invite.deliveryFailed) {
    flags.push('deliveryBounced');
  }

  return flags;
}

async function handleV2Submit(
  req: Request,
  body: Record<string, unknown>,
  requestToken: string,
  ipHash: string,
): Promise<NextResponse> {
  const parsed = parseSupplierInviteToken(requestToken);
  if (!parsed) {
    return NextResponse.json(
      { error: 'Ungueltiger Anfrage-Link.' },
      { status: 400 },
    );
  }

  // Validate session cookie
  const cookieHeader = req.headers.get('cookie') ?? '';
  const sessionMatch = cookieHeader.match(/__supplier_session=([^;]+)/);
  const sessionCookieValue = sessionMatch?.[1];

  const sessionResult = validateSupplierSession(sessionCookieValue, parsed.inviteId);
  if (!sessionResult.valid) {
    logWarn('supplier_invite_v2_submit_session_invalid', {
      inviteId: parsed.inviteId,
      reason: sessionResult.reason,
      ipHash,
    });
    const messageMap: Record<string, string> = {
      missing: 'Bitte verifizieren Sie sich zuerst.',
      expired: 'Ihre Sitzung ist abgelaufen. Bitte verifizieren Sie sich erneut.',
      invalid_signature: 'Ungueltige Sitzung. Bitte verifizieren Sie sich erneut.',
      invite_mismatch: 'Sitzung passt nicht zur Anfrage.',
      malformed: 'Ungueltige Sitzung.',
    };
    return NextResponse.json(
      { error: messageMap[sessionResult.reason] ?? 'Sitzung ungueltig.' },
      { status: 403 },
    );
  }

  // Load invite
  const inviteDoc = await db.collection(INVITE_COLLECTION).doc(parsed.inviteId).get();
  if (!inviteDoc.exists) {
    return NextResponse.json({ error: 'Anfrage nicht gefunden.' }, { status: 404 });
  }

  const invite = parseSupplierInviteRecord(inviteDoc.data());

  // Check invite status
  if (invite.revokedAt || invite.status === 'revoked') {
    return NextResponse.json(
      { error: 'Diese Anfrage wurde zurueckgezogen.' },
      { status: 410 },
    );
  }

  if (new Date(invite.expiresAt) <= new Date()) {
    return NextResponse.json(
      { error: 'Diese Anfrage ist abgelaufen.' },
      { status: 410 },
    );
  }

  if (invite.status === 'submitted' && invite.submissionCount >= invite.maxSubmissions) {
    return NextResponse.json(
      { error: 'Diese Anfrage wurde bereits beantwortet.' },
      { status: 410 },
    );
  }

  // Parse submission data
  const parsedSubmission = parseSupplierRequestSubmission({
    supplierEmail: body.supplierEmail,
    supplierOrganisation: body.supplierOrganisation,
    toolName: body.toolName,
    systems: registerFirstFlags.supplierMultisystemCapture ? body.systems : undefined,
    purpose: body.purpose,
    dataCategory: body.dataCategory,
    dataCategories: body.dataCategories,
    aiActCategory: body.aiActCategory,
    workflowConnectionMode: registerFirstFlags.supplierMultisystemCapture
      ? body.workflowConnectionMode
      : undefined,
    workflowSummary: registerFirstFlags.supplierMultisystemCapture
      ? body.workflowSummary
      : undefined,
  });

  // Load register
  const registerRef = db.doc(`users/${invite.ownerId}/registers/${invite.registerId}`);
  const registerSnapshot = await registerRef.get();
  const register = registerSnapshot.exists ? (registerSnapshot.data() as Register) : null;
  const systemNames = resolveSubmittedSystemNames(body, parsedSubmission.toolName);

  // Workspace settings + approval workflow
  const workspaceSettings = await getWorkspaceSettingsForRegister({
    registerWorkspaceId: register?.workspaceId,
    registerOwnerId: invite.ownerId,
  });

  const approvalWorkflow = createSubmissionApprovalWorkflow({
    settings: workspaceSettings,
    requestedAt: new Date().toISOString(),
    requestedBy: sessionResult.payload.verifiedEmail,
  });
  const nextStep = buildSupplierNextStep(approvalWorkflow);

  // Compute risk flags
  const riskFlags = computeRiskFlags(invite, ipHash, sessionResult.payload.verifiedAt);

  // Build submission record with V2 verification metadata
  const submission = buildExternalSubmissionRecord({
    registerId: invite.registerId,
    ownerId: invite.ownerId,
    sourceType: 'supplier_request',
    submittedByName: parsedSubmission.supplierOrganisation ?? parsedSubmission.supplierEmail,
    submittedByEmail: sessionResult.payload.verifiedEmail,
    submittedAt: new Date(),
    rawPayloadSnapshot: {
      ...parsedSubmission,
      inviteId: invite.inviteId,
      verifiedEmail: sessionResult.payload.verifiedEmail,
      verificationMethod: 'email_otp',
      verifiedAt: sessionResult.payload.verifiedAt,
      senderPolicyResult: 'exact_match',
      riskFlags,
    },
    status: 'submitted',
    approvalWorkflow,
  });

  // Persist
  await db
    .doc(
      `users/${submission.ownerId}/registers/${submission.registerId}/externalSubmissions/${submission.submissionId}`,
    )
    .set(sanitizeFirestorePayload(submission));

  // Update invite status
  const now = new Date().toISOString();
  await updateSupplierInviteStatus(invite.inviteId, 'submitted', {
    submissionCount: invite.submissionCount + 1,
    lastUsedAt: now,
    lastUsedIpHash: ipHash,
    firstUsedAt: invite.firstUsedAt ?? now,
  });

  // KPI: time from verification to submission
  const verifiedAtMs = new Date(sessionResult.payload.verifiedAt).getTime();
  const timeToSubmitMs = Date.now() - verifiedAtMs;

  // Notifications
  const workspaceId = register?.workspaceId ?? invite.ownerId;
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
      error: hookError instanceof Error ? hookError.message : 'unknown_hook_error',
    });
  });

  logInfo('supplier_invite_v2_submitted', {
    inviteId: invite.inviteId,
    registerId: invite.registerId,
    submissionId: submission.submissionId,
    submissionCount: invite.submissionCount + 1,
    timeToSubmitMs,
    riskFlags,
    ipHash,
  });

  const organisationName =
    register?.organisationName ?? register?.name ?? 'Ihre Organisation';
  let confirmationEmailSent = false;
  try {
    await sendSupplierSubmissionConfirmationEmail({
      inviteId: invite.inviteId,
      submissionId: submission.submissionId,
      registerId: invite.registerId,
      to: sessionResult.payload.verifiedEmail,
      organisationName,
      supplierOrganisation: parsedSubmission.supplierOrganisation,
      verifiedEmail: sessionResult.payload.verifiedEmail,
      submittedAt: submission.submittedAt,
      systemNames,
      purpose: parsedSubmission.purpose,
      aiActCategory: parsedSubmission.aiActCategory,
      nextStepTitle: nextStep.nextStepTitle,
      nextStepDescription: nextStep.nextStepDescription,
      setupUrl: buildSupplierSetupUrl(sessionResult.payload.verifiedEmail),
    });
    confirmationEmailSent = true;
  } catch (confirmationError) {
    logWarn('supplier_invite_confirmation_email_failed', {
      inviteId: invite.inviteId,
      submissionId: submission.submissionId,
      registerId: invite.registerId,
      reason:
        confirmationError instanceof Error
          ? confirmationError.message
          : 'unknown',
    });
  }

  return NextResponse.json({
    success: true,
    submissionId: submission.submissionId,
    submittedAt: submission.submittedAt,
    systemNames,
    nextStepTitle: nextStep.nextStepTitle,
    nextStepDescription: nextStep.nextStepDescription,
    setupUrl: buildSupplierSetupUrl(sessionResult.payload.verifiedEmail),
    confirmationEmailSent,
  });
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

    const clientIp = resolveClientIp(req);
    const ipHash = hashIpForAudit(clientIp);

    // Honeypot: invisible field — if filled, silently reject
    if (typeof body?.companyWebsiteUrl === 'string' && body.companyWebsiteUrl.trim() !== '') {
      logInfo('supplier_submission', {
        tokenIdPreview: requestToken.slice(0, 12),
        ipHash,
        honeypotTriggered: true,
        outcome: 'rejected_honeypot',
      });
      return NextResponse.json({ success: true, submissionId: 'accepted' });
    }

    // ── V2 Invite Flow ────────────────────────────────────────────────────
    if (isV2InviteToken(requestToken)) {
      return handleV2Submit(req, body, requestToken, ipHash);
    }

    // ── V1 Legacy Flow ────────────────────────────────────────────────────
    const tokenAccess = await resolveSupplierRequestTokenAccess(requestToken);
    if (!tokenAccess.ok) {
      const mapped = mapTokenFailure(tokenAccess.reason);
      logInfo('supplier_submission', {
        tokenIdPreview: requestToken.slice(0, 12),
        ipHash,
        honeypotTriggered: false,
        outcome: `rejected_${tokenAccess.reason}`,
      });
      return NextResponse.json(
        { error: mapped.error },
        { status: mapped.status },
      );
    }

    // Check maxSubmissions if explicitly set
    const tokenRecord = tokenAccess.value.token;
    if (
      tokenRecord.maxSubmissions != null &&
      (tokenRecord.submissionCount ?? 0) >= tokenRecord.maxSubmissions
    ) {
      logInfo('supplier_submission', {
        tokenId: tokenRecord.tokenId,
        ipHash,
        submissionCount: tokenRecord.submissionCount ?? 0,
        maxSubmissions: tokenRecord.maxSubmissions,
        honeypotTriggered: false,
        outcome: 'rejected_consumed',
      });
      return NextResponse.json(
        { error: 'Dieser Einreichungslink wurde bereits verwendet.' },
        { status: 410 },
      );
    }

    phase = 'parse_submission';
    const parsedSubmission = parseSupplierRequestSubmission({
      supplierEmail: body?.supplierEmail,
      supplierOrganisation: body?.supplierOrganisation,
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
      submittedByName:
        parsedSubmission.supplierOrganisation ?? parsedSubmission.supplierEmail,
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
    await markSupplierRequestTokenUsed(tokenAccess.value.token.tokenId, {
      ipHash,
      token: tokenAccess.value.token,
    });

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

    logInfo('supplier_submission', {
      tokenId: tokenAccess.value.token.tokenId,
      ipHash,
      submissionCount: (tokenAccess.value.token.submissionCount ?? 0) + 1,
      honeypotTriggered: false,
      outcome: 'accepted',
      submissionId: submission.submissionId,
      registerId: submission.registerId,
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
