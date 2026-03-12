export type WorkspaceRole =
  | 'OWNER'
  | 'ADMIN'
  | 'REVIEWER'
  | 'MEMBER'
  | 'EXTERNAL_OFFICER';

export type ManagedWorkspaceRole = Exclude<WorkspaceRole, 'OWNER'>;

export type WorkspaceProvisioningSource =
  | 'direct'
  | 'invite'
  | 'sso'
  | 'scim'
  | 'legacy';

export type WorkspaceMemberStatus = 'active' | 'invited' | 'suspended';

export type IdentityProviderMode = 'disabled' | 'saml' | 'oidc';

export type NotificationEventType =
  | 'submission_received'
  | 'review_due'
  | 'approval_needed';

export type ExternalSubmissionApprovalMode =
  | 'none'
  | 'reviewer'
  | 'reviewer_plus_officer'
  | 'admin';

export type GovernanceSignOffMode =
  | 'none'
  | 'admin'
  | 'external_officer';

export interface WorkspaceMemberRecord {
  userId: string;
  email: string;
  displayName?: string | null;
  role: WorkspaceRole;
  status: WorkspaceMemberStatus;
  source: WorkspaceProvisioningSource;
  joinedAt?: string | null;
  invitedAt?: string | null;
  invitedByUserId?: string | null;
  groups?: string[];
  lastSyncedAt?: string | null;
}

export interface WorkspaceRoleMappingEntry {
  groupName: string;
  role: ManagedWorkspaceRole;
}

export interface WorkspaceIdentityProviderConfig {
  mode: IdentityProviderMode;
  status: 'draft' | 'configured';
  displayName?: string | null;
  entityId?: string | null;
  metadataUrl?: string | null;
  ssoUrl?: string | null;
  issuer?: string | null;
  clientId?: string | null;
  audience?: string | null;
  groupsAttribute?: string | null;
  roleMappings: WorkspaceRoleMappingEntry[];
  lastValidatedAt?: string | null;
}

export interface WorkspaceScimConfig {
  enabled: boolean;
  status: 'disconnected' | 'ready' | 'error';
  baseUrl?: string | null;
  tokenLabel?: string | null;
  syncGroups: boolean;
  defaultRole: ManagedWorkspaceRole;
  groupMappings: WorkspaceRoleMappingEntry[];
  lastSyncAt?: string | null;
}

export interface WorkspaceWebhookConfig {
  webhookId: string;
  eventType: NotificationEventType;
  url: string;
  enabled: boolean;
  secretLabel?: string | null;
  createdAt: string;
  lastTriggeredAt?: string | null;
}

export interface WorkspaceNotificationSettings {
  emailDigest: 'disabled' | 'daily' | 'weekly';
  hooks: WorkspaceWebhookConfig[];
}

export interface WorkspaceRetentionPolicy {
  immutableAuditExportsDays: number;
  externalSubmissionDays: number;
  reviewArtifactsDays: number;
  incidentLogDays: number;
  legalHold: boolean;
}

export interface WorkspaceSubprocessor {
  name: string;
  region: string;
  purpose: string;
  url?: string | null;
}

export interface WorkspaceProcurementSettings {
  dpaUrl?: string | null;
  sccUrl?: string | null;
  subprocessorDirectoryUrl?: string | null;
  subprocessors: WorkspaceSubprocessor[];
  securityContactName?: string | null;
  securityContactEmail?: string | null;
  securityContactUrl?: string | null;
  incidentReportingUrl?: string | null;
  incidentReportingEmail?: string | null;
  retentionSummary?: string | null;
  documentationPortalUrl?: string | null;
}

export interface WorkspaceApprovalPolicy {
  externalSubmissions: ExternalSubmissionApprovalMode;
  governanceSignOff: GovernanceSignOffMode;
  autoCreateUseCaseOnApproval: boolean;
}

export interface EnterpriseWorkspaceSettings {
  identityProvider: WorkspaceIdentityProviderConfig;
  scim: WorkspaceScimConfig;
  approvalPolicy: WorkspaceApprovalPolicy;
  retentionPolicy: WorkspaceRetentionPolicy;
  notifications: WorkspaceNotificationSettings;
  procurement: WorkspaceProcurementSettings;
  updatedAt: string;
  updatedBy?: string | null;
}

export interface EnterpriseWorkspaceSettingsUpdate {
  identityProvider?: Partial<WorkspaceIdentityProviderConfig>;
  scim?: Partial<WorkspaceScimConfig>;
  approvalPolicy?: Partial<WorkspaceApprovalPolicy>;
  retentionPolicy?: Partial<WorkspaceRetentionPolicy>;
  notifications?: Partial<WorkspaceNotificationSettings>;
  procurement?: Partial<WorkspaceProcurementSettings>;
  updatedAt?: string;
  updatedBy?: string | null;
}

export interface WorkspaceRecord {
  orgId: string;
  name: string;
  ownerUserId: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  updatedAt: string;
  linkedRegisterIds: string[];
  enterpriseSettings: EnterpriseWorkspaceSettings;
}

export interface ApprovalDecisionRecord {
  decisionId: string;
  role: WorkspaceRole;
  actorUserId: string;
  decision: 'approved' | 'rejected';
  note?: string | null;
  decidedAt: string;
}

export interface ApprovalWorkflow {
  status: 'not_required' | 'pending' | 'approved' | 'rejected';
  requiredRoles: WorkspaceRole[];
  requestedAt?: string | null;
  requestedBy?: string | null;
  decisions: ApprovalDecisionRecord[];
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function uniqueRoles(roles: WorkspaceRole[]): WorkspaceRole[] {
  return Array.from(new Set(roles));
}

export function normalizeWorkspaceRole(
  value: string | null | undefined,
): WorkspaceRole {
  switch (value) {
    case 'OWNER':
    case 'ADMIN':
    case 'REVIEWER':
    case 'EXTERNAL_OFFICER':
    case 'MEMBER':
      return value;
    default:
      return 'MEMBER';
  }
}

export function getWorkspaceRoleLabel(role: WorkspaceRole): string {
  switch (role) {
    case 'OWNER':
      return 'Owner';
    case 'ADMIN':
      return 'Admin';
    case 'REVIEWER':
      return 'Reviewer';
    case 'EXTERNAL_OFFICER':
      return 'External Officer';
    default:
      return 'Member';
  }
}

export function canManageWorkspaceMembers(role: WorkspaceRole): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

export function canManageEnterpriseSettings(role: WorkspaceRole): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

export function canApproveExternalSubmissions(role: WorkspaceRole): boolean {
  return (
    role === 'OWNER' ||
    role === 'ADMIN' ||
    role === 'REVIEWER' ||
    role === 'EXTERNAL_OFFICER'
  );
}

export function createDefaultEnterpriseWorkspaceSettings(
  now: string = new Date().toISOString(),
): EnterpriseWorkspaceSettings {
  return {
    identityProvider: {
      mode: 'disabled',
      status: 'draft',
      displayName: null,
      entityId: null,
      metadataUrl: null,
      ssoUrl: null,
      issuer: null,
      clientId: null,
      audience: null,
      groupsAttribute: null,
      roleMappings: [],
      lastValidatedAt: null,
    },
    scim: {
      enabled: false,
      status: 'disconnected',
      baseUrl: null,
      tokenLabel: null,
      syncGroups: true,
      defaultRole: 'MEMBER',
      groupMappings: [],
      lastSyncAt: null,
    },
    approvalPolicy: {
      externalSubmissions: 'reviewer',
      governanceSignOff: 'admin',
      autoCreateUseCaseOnApproval: false,
    },
    retentionPolicy: {
      immutableAuditExportsDays: 365,
      externalSubmissionDays: 365,
      reviewArtifactsDays: 365,
      incidentLogDays: 365,
      legalHold: false,
    },
    notifications: {
      emailDigest: 'daily',
      hooks: [],
    },
    procurement: {
      dpaUrl: null,
      sccUrl: null,
      subprocessorDirectoryUrl: null,
      subprocessors: [],
      securityContactName: null,
      securityContactEmail: null,
      securityContactUrl: null,
      incidentReportingUrl: null,
      incidentReportingEmail: null,
      retentionSummary: null,
      documentationPortalUrl: null,
    },
    updatedAt: now,
    updatedBy: null,
  };
}

export function createWorkspaceRecord(input: {
  orgId: string;
  name: string;
  ownerUserId: string;
  plan?: 'free' | 'pro' | 'enterprise';
  createdAt?: string;
}): WorkspaceRecord {
  const createdAt = input.createdAt ?? new Date().toISOString();
  return {
    orgId: input.orgId,
    name: input.name.trim() || 'KI-Register Workspace',
    ownerUserId: input.ownerUserId,
    plan: input.plan ?? 'enterprise',
    createdAt,
    updatedAt: createdAt,
    linkedRegisterIds: [],
    enterpriseSettings: createDefaultEnterpriseWorkspaceSettings(createdAt),
  };
}

export function normalizeWorkspaceMember(input: WorkspaceMemberRecord): WorkspaceMemberRecord {
  return {
    ...input,
    email: input.email.trim().toLowerCase(),
    displayName: normalizeOptionalText(input.displayName),
    role: normalizeWorkspaceRole(input.role),
    status: input.status,
    source: input.source,
    joinedAt: normalizeOptionalText(input.joinedAt),
    invitedAt: normalizeOptionalText(input.invitedAt),
    invitedByUserId: normalizeOptionalText(input.invitedByUserId),
    groups: Array.isArray(input.groups)
      ? input.groups
          .map((group) => group.trim())
          .filter((group) => group.length > 0)
      : [],
    lastSyncedAt: normalizeOptionalText(input.lastSyncedAt),
  };
}

export function getExternalSubmissionApprovalRoles(
  mode: ExternalSubmissionApprovalMode,
): WorkspaceRole[] {
  switch (mode) {
    case 'reviewer':
      return ['REVIEWER'];
    case 'reviewer_plus_officer':
      return ['REVIEWER', 'EXTERNAL_OFFICER'];
    case 'admin':
      return ['ADMIN'];
    default:
      return [];
  }
}

export function createApprovalWorkflow(
  requiredRoles: WorkspaceRole[],
  input: {
    requestedAt?: string | null;
    requestedBy?: string | null;
  } = {},
): ApprovalWorkflow | null {
  const normalizedRoles = uniqueRoles(requiredRoles);
  if (normalizedRoles.length === 0) {
    return null;
  }

  return {
    status: 'pending',
    requiredRoles: normalizedRoles,
    requestedAt: normalizeOptionalText(input.requestedAt) ?? new Date().toISOString(),
    requestedBy: normalizeOptionalText(input.requestedBy),
    decisions: [],
  };
}

function canSatisfyRequiredRole(
  actorRole: WorkspaceRole,
  requiredRole: WorkspaceRole,
): boolean {
  if (actorRole === 'OWNER') return true;
  if (actorRole === requiredRole) return true;
  if (actorRole === 'ADMIN' && requiredRole === 'REVIEWER') return true;
  return false;
}

function pickSatisfiedRole(
  workflow: ApprovalWorkflow,
  actorRole: WorkspaceRole,
): WorkspaceRole | null {
  const decidedRoles = new Set(
    workflow.decisions
      .filter((decision) => decision.decision === 'approved')
      .map((decision) => decision.role),
  );
  const pendingRoles = workflow.requiredRoles.filter(
    (requiredRole) => !decidedRoles.has(requiredRole),
  );

  return (
    pendingRoles.find((requiredRole) =>
      canSatisfyRequiredRole(actorRole, requiredRole),
    ) ?? null
  );
}

export function recordApprovalDecision(
  workflow: ApprovalWorkflow | null | undefined,
  input: {
    actorRole: WorkspaceRole;
    actorUserId: string;
    decision: 'approved' | 'rejected';
    note?: string | null;
    decidedAt?: string;
  },
): ApprovalWorkflow | null {
  if (!workflow || workflow.status === 'not_required') {
    return workflow ?? null;
  }

  const role = pickSatisfiedRole(workflow, input.actorRole);
  if (!role && input.decision === 'approved') {
    throw new Error('APPROVAL_ROLE_NOT_ALLOWED');
  }

  const decidedAt = input.decidedAt ?? new Date().toISOString();
  const decisions = [
    ...workflow.decisions,
    {
      decisionId: `approval_${decidedAt}_${workflow.decisions.length + 1}`,
      role: role ?? input.actorRole,
      actorUserId: input.actorUserId,
      decision: input.decision,
      note: normalizeOptionalText(input.note),
      decidedAt,
    },
  ];

  if (input.decision === 'rejected') {
    return {
      ...workflow,
      status: 'rejected',
      decisions,
    };
  }

  const approvedRoles = new Set(
    decisions
      .filter((decision) => decision.decision === 'approved')
      .map((decision) => decision.role),
  );
  const allRolesApproved = workflow.requiredRoles.every((requiredRole) =>
    approvedRoles.has(requiredRole),
  );

  return {
    ...workflow,
    status: allRolesApproved ? 'approved' : 'pending',
    decisions,
  };
}

export function createExternalSubmissionApprovalWorkflow(
  settings: EnterpriseWorkspaceSettings | null | undefined,
  input: {
    requestedAt?: string | null;
    requestedBy?: string | null;
  } = {},
): ApprovalWorkflow | null {
  return createApprovalWorkflow(
    getExternalSubmissionApprovalRoles(
      settings?.approvalPolicy.externalSubmissions ?? 'none',
    ),
    input,
  );
}

export function getGovernanceSignOffRoles(
  mode: GovernanceSignOffMode,
): WorkspaceRole[] {
  switch (mode) {
    case 'admin':
      return ['ADMIN'];
    case 'external_officer':
      return ['EXTERNAL_OFFICER'];
    default:
      return [];
  }
}

export function createGovernanceSignOffWorkflow(
  settings: EnterpriseWorkspaceSettings | null | undefined,
  input: {
    requestedAt?: string | null;
    requestedBy?: string | null;
  } = {},
): ApprovalWorkflow | null {
  return createApprovalWorkflow(
    getGovernanceSignOffRoles(
      settings?.approvalPolicy.governanceSignOff ?? 'none',
    ),
    input,
  );
}

export function mergeEnterpriseWorkspaceSettings(
  existing: EnterpriseWorkspaceSettings | null | undefined,
  updates: EnterpriseWorkspaceSettingsUpdate,
  actorUserId?: string | null,
): EnterpriseWorkspaceSettings {
  const base = existing ?? createDefaultEnterpriseWorkspaceSettings();
  return {
    ...base,
    ...updates,
    identityProvider: {
      ...base.identityProvider,
      ...(updates.identityProvider ?? {}),
      roleMappings:
        updates.identityProvider?.roleMappings ?? base.identityProvider.roleMappings,
    },
    scim: {
      ...base.scim,
      ...(updates.scim ?? {}),
      groupMappings: updates.scim?.groupMappings ?? base.scim.groupMappings,
    },
    approvalPolicy: {
      ...base.approvalPolicy,
      ...(updates.approvalPolicy ?? {}),
    },
    retentionPolicy: {
      ...base.retentionPolicy,
      ...(updates.retentionPolicy ?? {}),
    },
    notifications: {
      ...base.notifications,
      ...(updates.notifications ?? {}),
      hooks: updates.notifications?.hooks ?? base.notifications.hooks,
    },
    procurement: {
      ...base.procurement,
      ...(updates.procurement ?? {}),
      subprocessors:
        updates.procurement?.subprocessors ?? base.procurement.subprocessors,
    },
    updatedAt: new Date().toISOString(),
    updatedBy: normalizeOptionalText(actorUserId) ?? base.updatedBy ?? null,
  };
}
