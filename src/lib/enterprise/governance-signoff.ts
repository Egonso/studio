import {
  createGovernanceSignOffWorkflow,
  recordApprovalDecision,
  type ApprovalWorkflow,
  type EnterpriseWorkspaceSettings,
  type WorkspaceRole,
} from './workspace';

export type GovernanceSignOffStatus = 'pending' | 'approved' | 'rejected';

export interface GovernanceSignOffRecord {
  signOffId: string;
  workspaceId: string;
  status: GovernanceSignOffStatus;
  summary: string;
  requestedAt: string;
  requestedByUserId: string;
  requestedByEmail?: string | null;
  approvalWorkflow: ApprovalWorkflow | null;
  settingsSnapshot: {
    approvalPolicy: EnterpriseWorkspaceSettings['approvalPolicy'];
    retentionPolicy: EnterpriseWorkspaceSettings['retentionPolicy'];
    procurement: EnterpriseWorkspaceSettings['procurement'];
    identityProviderMode: EnterpriseWorkspaceSettings['identityProvider']['mode'];
    scimEnabled: boolean;
  };
  resolvedAt?: string | null;
  resolvedByUserId?: string | null;
  note?: string | null;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function createSignOffId(): string {
  return `gso_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export function buildGovernanceSignOffSettingsSnapshot(
  settings: EnterpriseWorkspaceSettings,
): GovernanceSignOffRecord['settingsSnapshot'] {
  return {
    approvalPolicy: settings.approvalPolicy,
    retentionPolicy: settings.retentionPolicy,
    procurement: settings.procurement,
    identityProviderMode: settings.identityProvider.mode,
    scimEnabled: settings.scim.enabled,
  };
}

export function createGovernanceSignOffRecord(input: {
  workspaceId: string;
  settings: EnterpriseWorkspaceSettings;
  requestedByUserId: string;
  requestedByEmail?: string | null;
  summary?: string | null;
  requestedAt?: string | null;
}): GovernanceSignOffRecord {
  const requestedAt =
    normalizeOptionalText(input.requestedAt) ?? new Date().toISOString();
  const workflow = createGovernanceSignOffWorkflow(input.settings, {
    requestedAt,
    requestedBy: input.requestedByUserId,
  });

  return {
    signOffId: createSignOffId(),
    workspaceId: input.workspaceId,
    status: workflow ? 'pending' : 'approved',
    summary:
      normalizeOptionalText(input.summary) ??
      'Governance configuration submitted for approval',
    requestedAt,
    requestedByUserId: input.requestedByUserId,
    requestedByEmail: normalizeOptionalText(input.requestedByEmail),
    approvalWorkflow: workflow,
    settingsSnapshot: buildGovernanceSignOffSettingsSnapshot(input.settings),
    resolvedAt: workflow ? null : requestedAt,
    resolvedByUserId: workflow ? null : input.requestedByUserId,
    note: workflow ? null : 'No additional governance sign-off required.',
  };
}

export function applyGovernanceSignOffDecision(input: {
  signOff: GovernanceSignOffRecord;
  actorRole: WorkspaceRole;
  actorUserId: string;
  decision: 'approved' | 'rejected';
  note?: string | null;
  decidedAt?: string | null;
}): GovernanceSignOffRecord {
  const decidedAt =
    normalizeOptionalText(input.decidedAt) ?? new Date().toISOString();
  const nextWorkflow = recordApprovalDecision(input.signOff.approvalWorkflow, {
    actorRole: input.actorRole,
    actorUserId: input.actorUserId,
    decision: input.decision,
    note: input.note,
    decidedAt,
  });

  const status: GovernanceSignOffStatus =
    input.decision === 'rejected'
      ? 'rejected'
      : nextWorkflow && nextWorkflow.status === 'pending'
        ? 'pending'
        : 'approved';

  return {
    ...input.signOff,
    status,
    approvalWorkflow: nextWorkflow,
    resolvedAt: status === 'pending' ? null : decidedAt,
    resolvedByUserId: status === 'pending' ? null : input.actorUserId,
    note: normalizeOptionalText(input.note),
  };
}
