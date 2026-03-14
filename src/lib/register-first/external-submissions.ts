import { parseExternalSubmission, parseUseCaseCard } from './schema';
import {
  createExternalSubmissionApprovalWorkflow,
  recordApprovalDecision,
  type EnterpriseWorkspaceSettings,
  type WorkspaceRole,
} from '@/lib/enterprise/workspace';
import { createUseCaseOrigin } from './migration';
import {
  buildAccessCodeTrace,
  buildSupplierRequestTrace,
} from './external-intake';
import {
  createSupplierRequestUseCase,
  parseSupplierRequestSubmission,
} from './supplier-requests';
import { prepareUseCaseForStorage } from './use-case-builder';
import { getEntitlementAccessPlan } from './entitlement';
import { normalizeUseCaseWorkflow, resolveOrderedSystemsFromCard } from './card-model';
import type {
  CaptureUsageContext,
  DataCategory,
  DecisionInfluence,
  ExternalSubmission,
  ExternalSubmissionSourceType,
  ExternalSubmissionStatus,
  Register,
  UseCaseWorkflow,
  UseCaseCard,
  OrderedUseCaseSystem,
} from './types';

export interface AccessCodeSubmissionSnapshot extends Record<string, unknown> {
  purpose: string;
  toolId?: string;
  toolFreeText?: string;
  workflow?: UseCaseWorkflow;
  usageContexts: CaptureUsageContext[];
  dataCategories: DataCategory[];
  decisionInfluence?: DecisionInfluence | null;
  ownerRole: string;
  contactPersonName?: string | null;
  organisation?: string | null;
}

function createExternalSubmissionId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return `extsub_${crypto.randomUUID().replace(/-/g, '')}`;
  }

  return `extsub_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function sanitizeSnapshot(
  input: Record<string, unknown>,
): Record<string, unknown> {
  return JSON.parse(JSON.stringify(input)) as Record<string, unknown>;
}

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function resolvePrimarySnapshotSystem(
  rawPayloadSnapshot: Record<string, unknown>,
): Pick<OrderedUseCaseSystem, 'toolId' | 'toolFreeText'> | null {
  const supplierToolName =
    typeof rawPayloadSnapshot.toolName === 'string'
      ? normalizeOptionalText(rawPayloadSnapshot.toolName)
      : null;
  if (supplierToolName) {
    return {
      toolId: 'other',
      toolFreeText: supplierToolName,
    };
  }

  const toolFreeText =
    typeof rawPayloadSnapshot.toolFreeText === 'string'
      ? normalizeOptionalText(rawPayloadSnapshot.toolFreeText)
      : null;
  const toolId =
    typeof rawPayloadSnapshot.toolId === 'string'
      ? normalizeOptionalText(rawPayloadSnapshot.toolId)
      : null;

  if (!toolId && !toolFreeText) {
    return null;
  }

  return {
    toolId: toolId ?? undefined,
    toolFreeText: toolFreeText ?? undefined,
  };
}

function resolveSystemDisplayName(
  system: Pick<OrderedUseCaseSystem, 'toolId' | 'toolFreeText'>,
): string | null {
  return normalizeOptionalText(system.toolFreeText) ??
    normalizeOptionalText(system.toolId);
}

export function buildExternalSubmissionRecord(input: {
  submissionId?: string;
  registerId: string;
  ownerId: string;
  sourceType: ExternalSubmissionSourceType;
  requestTokenId?: string | null;
  accessCodeId?: string | null;
  submittedByName?: string | null;
  submittedByEmail?: string | null;
  submittedAt?: string | Date;
  rawPayloadSnapshot: Record<string, unknown>;
  status?: ExternalSubmissionStatus;
  linkedUseCaseId?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  reviewNote?: string | null;
  approvalWorkflow?: ExternalSubmission['approvalWorkflow'];
}): ExternalSubmission {
  const submittedAt =
    input.submittedAt instanceof Date
      ? input.submittedAt.toISOString()
      : (input.submittedAt ?? new Date().toISOString());

  return parseExternalSubmission({
    submissionId: input.submissionId ?? createExternalSubmissionId(),
    registerId: input.registerId,
    ownerId: input.ownerId,
    sourceType: input.sourceType,
    requestTokenId: normalizeOptionalText(input.requestTokenId),
    accessCodeId: normalizeOptionalText(input.accessCodeId),
    submittedByName: normalizeOptionalText(input.submittedByName),
    submittedByEmail: normalizeOptionalText(input.submittedByEmail),
    submittedAt,
    rawPayloadSnapshot: sanitizeSnapshot(input.rawPayloadSnapshot),
    status: input.status ?? 'submitted',
    linkedUseCaseId: normalizeOptionalText(input.linkedUseCaseId),
    reviewedAt: normalizeOptionalText(input.reviewedAt),
    reviewedBy: normalizeOptionalText(input.reviewedBy),
    reviewNote: normalizeOptionalText(input.reviewNote),
    approvalWorkflow: input.approvalWorkflow ?? null,
  });
}

export function createSubmissionApprovalWorkflow(input: {
  settings?: EnterpriseWorkspaceSettings | null;
  requestedAt?: string | null;
  requestedBy?: string | null;
}): ExternalSubmission['approvalWorkflow'] {
  return createExternalSubmissionApprovalWorkflow(input.settings, {
    requestedAt: input.requestedAt,
    requestedBy: input.requestedBy,
  });
}

export function applyExternalSubmissionReview(input: {
  submission: ExternalSubmission;
  action: 'approve' | 'reject' | 'merge';
  linkedUseCaseId?: string | null;
  reviewedAt?: string | Date;
  reviewedBy?: string | null;
  reviewNote?: string | null;
  actorRole?: WorkspaceRole | null;
}): ExternalSubmission {
  const reviewedAt =
    input.reviewedAt instanceof Date
      ? input.reviewedAt.toISOString()
      : (input.reviewedAt ?? new Date().toISOString());

  const status: ExternalSubmissionStatus =
    input.action === 'approve'
      ? 'approved'
      : input.action === 'reject'
        ? 'rejected'
        : 'merged';
  const nextApprovalWorkflow =
    input.submission.approvalWorkflow && input.action !== 'merge'
      ? recordApprovalDecision(input.submission.approvalWorkflow, {
          actorRole: input.actorRole ?? 'MEMBER',
          actorUserId:
            normalizeOptionalText(input.reviewedBy) ??
            normalizeOptionalText(input.submission.reviewedBy) ??
            'unknown_actor',
          decision: input.action === 'reject' ? 'rejected' : 'approved',
          note: input.reviewNote,
          decidedAt: reviewedAt,
        })
      : input.submission.approvalWorkflow ?? null;
  const effectiveStatus =
    input.action === 'approve' &&
    nextApprovalWorkflow &&
    nextApprovalWorkflow.status === 'pending'
      ? 'submitted'
      : status;

  return parseExternalSubmission({
    ...input.submission,
    status: effectiveStatus,
    linkedUseCaseId:
      normalizeOptionalText(input.linkedUseCaseId) ??
      input.submission.linkedUseCaseId,
    reviewedAt,
    reviewedBy: normalizeOptionalText(input.reviewedBy),
    reviewNote: normalizeOptionalText(input.reviewNote),
    approvalWorkflow: nextApprovalWorkflow,
  });
}

export function buildAccessCodeSubmissionSnapshot(
  input: AccessCodeSubmissionSnapshot,
): AccessCodeSubmissionSnapshot {
  return {
    purpose: input.purpose.trim(),
    toolId: normalizeOptionalText(input.toolId) ?? undefined,
    toolFreeText: normalizeOptionalText(input.toolFreeText) ?? undefined,
    workflow: normalizeUseCaseWorkflow(input.workflow),
    usageContexts: [...input.usageContexts],
    dataCategories: [...input.dataCategories],
    decisionInfluence: input.decisionInfluence ?? null,
    ownerRole: input.ownerRole.trim(),
    contactPersonName: normalizeOptionalText(input.contactPersonName),
    organisation: normalizeOptionalText(input.organisation),
  };
}

export function buildUseCaseFromAccessCodeSubmission(input: {
  useCaseId: string;
  registerId: string;
  ownerId?: string | null;
  accessCode: string;
  accessCodeLabel?: string | null;
  submissionId: string;
  snapshot: AccessCodeSubmissionSnapshot;
  now?: Date;
}): UseCaseCard {
  const now = input.now ?? new Date();
  const snapshot = buildAccessCodeSubmissionSnapshot(input.snapshot);
  const cardDraft = prepareUseCaseForStorage(
    {
      purpose: snapshot.purpose,
      usageContexts: snapshot.usageContexts,
      isCurrentlyResponsible: false,
      responsibleParty: snapshot.ownerRole,
      contactPersonName: snapshot.contactPersonName ?? undefined,
      decisionImpact: 'UNSURE',
      decisionInfluence: snapshot.decisionInfluence ?? undefined,
      toolId: snapshot.toolId,
      toolFreeText: snapshot.toolFreeText,
      workflow: snapshot.workflow,
      dataCategory: snapshot.dataCategories[0],
      dataCategories: snapshot.dataCategories,
      organisation: snapshot.organisation,
    },
    {
      useCaseId: input.useCaseId,
      now,
    },
  );

  return parseUseCaseCard({
    ...cardDraft,
    origin: createUseCaseOrigin({
      source: 'access_code',
      submittedByName: snapshot.contactPersonName ?? null,
      submittedByEmail: null,
      sourceRequestId: input.submissionId,
      capturedByUserId: null,
    }),
    capturedBy: 'ANONYMOUS',
    capturedByName: snapshot.contactPersonName ?? undefined,
    capturedViaCode: true,
    accessCodeLabel: normalizeOptionalText(input.accessCodeLabel) ?? undefined,
    externalIntake: buildAccessCodeTrace({
      submittedAt: now,
      registerId: input.registerId,
      ownerId: normalizeOptionalText(input.ownerId),
      accessCode: input.accessCode,
      accessCodeId: input.accessCode,
      accessCodeLabel: input.accessCodeLabel ?? null,
      submissionId: input.submissionId,
      submittedByName: snapshot.contactPersonName ?? null,
      submittedByRole: snapshot.ownerRole,
    }),
  });
}

export function buildUseCaseFromSupplierSubmission(input: {
  useCaseId: string;
  registerId: string;
  ownerId?: string | null;
  organisationName?: string | null;
  requestTokenId?: string | null;
  submission: ExternalSubmission;
  now?: Date;
}): UseCaseCard {
  const now = input.now ?? new Date();
  const snapshot = parseSupplierRequestSubmission(
    input.submission.rawPayloadSnapshot,
  );
  const supplierUseCase = createSupplierRequestUseCase(snapshot, {
    useCaseId: input.useCaseId,
    organisationName: input.organisationName,
    now,
  });

  return parseUseCaseCard({
    ...supplierUseCase,
    origin: createUseCaseOrigin({
      source: 'supplier_request',
      submittedByName:
        input.submission.submittedByName ??
        input.submission.submittedByEmail ??
        snapshot.supplierEmail,
      submittedByEmail:
        input.submission.submittedByEmail ?? snapshot.supplierEmail,
      sourceRequestId: input.submission.submissionId,
      capturedByUserId: null,
    }),
    externalIntake: buildSupplierRequestTrace({
      submittedAt: input.submission.submittedAt,
      registerId: input.registerId,
      ownerId: normalizeOptionalText(input.ownerId),
      supplierEmail:
        input.submission.submittedByEmail ?? snapshot.supplierEmail,
      requestTokenId:
        normalizeOptionalText(input.requestTokenId) ??
        normalizeOptionalText(input.submission.requestTokenId),
      submissionId: input.submission.submissionId,
    }),
  });
}

export function resolveExternalSubmissionOrderedSystems(
  submission: Pick<ExternalSubmission, 'rawPayloadSnapshot'>,
): OrderedUseCaseSystem[] {
  const primarySystem = resolvePrimarySnapshotSystem(submission.rawPayloadSnapshot);
  const workflow = normalizeUseCaseWorkflow(submission.rawPayloadSnapshot.workflow);

  return resolveOrderedSystemsFromCard({
    toolId: primarySystem?.toolId,
    toolFreeText: primarySystem?.toolFreeText,
    workflow,
  });
}

export function getExternalSubmissionSystemNames(
  submission: Pick<ExternalSubmission, 'rawPayloadSnapshot'>,
): string[] {
  return resolveExternalSubmissionOrderedSystems(submission)
    .map((system) => resolveSystemDisplayName(system))
    .filter((systemName): systemName is string => Boolean(systemName));
}

export function getExternalSubmissionSystemSummary(
  submission: Pick<ExternalSubmission, 'rawPayloadSnapshot'>,
): string {
  const systemNames = getExternalSubmissionSystemNames(submission);
  const [primarySystem, ...additionalSystems] = systemNames;

  if (!primarySystem) {
    return 'Ohne System';
  }

  return additionalSystems.length > 0
    ? `${primarySystem} +${additionalSystems.length}`
    : primarySystem;
}

export function getExternalSubmissionTitle(
  submission: Pick<ExternalSubmission, 'sourceType' | 'rawPayloadSnapshot'>,
): string {
  const toolName = getExternalSubmissionSystemSummary(submission);
  const purpose =
    typeof submission.rawPayloadSnapshot.purpose === 'string'
      ? submission.rawPayloadSnapshot.purpose
      : '';

  if (submission.sourceType === 'access_code') {
    return purpose ? `${toolName}: ${purpose}` : toolName;
  }

  return purpose ? `${toolName}: ${purpose}` : toolName;
}

export function getExternalSubmissionActor(
  submission: Pick<
    ExternalSubmission,
    'submittedByName' | 'submittedByEmail' | 'rawPayloadSnapshot'
  >,
): string {
  return (
    normalizeOptionalText(submission.submittedByName) ??
    normalizeOptionalText(submission.submittedByEmail) ??
    (typeof submission.rawPayloadSnapshot.ownerRole === 'string'
      ? normalizeOptionalText(submission.rawPayloadSnapshot.ownerRole)
      : null) ??
    'Unbekannt'
  );
}

export function isKmuRegisterMode(
  register: Register | null | undefined,
): boolean {
  const plan = getEntitlementAccessPlan(
    register?.entitlement ??
      (register?.plan
        ? {
            plan: register.plan,
            status: 'active' as const,
          }
        : null),
  );
  return plan === 'free';
}
