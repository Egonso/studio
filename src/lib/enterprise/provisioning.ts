import type {
  EnterpriseWorkspaceSettings,
  ManagedWorkspaceRole,
  WorkspaceMemberRecord,
  WorkspaceProvisioningSource,
} from './workspace';

export interface ProvisionedIdentity {
  email: string;
  displayName?: string | null;
  groups?: string[];
}

export interface ScimProvisioningEnvelope {
  userName: string;
  displayName?: string | null;
  active: boolean;
  groups: string[];
  role: ManagedWorkspaceRole;
  source: WorkspaceProvisioningSource;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeGroupList(groups: string[] | null | undefined): string[] {
  return Array.from(
    new Set(
      (groups ?? [])
        .map((group) => group.trim())
        .filter((group) => group.length > 0),
    ),
  );
}

export function resolveProvisionedWorkspaceRole(input: {
  settings: EnterpriseWorkspaceSettings;
  groups?: string[] | null;
}): ManagedWorkspaceRole {
  const groups = normalizeGroupList(input.groups);
  const mappingGroups = [
    ...input.settings.identityProvider.roleMappings,
    ...input.settings.scim.groupMappings,
  ];

  for (const mapping of mappingGroups) {
    if (groups.includes(mapping.groupName)) {
      return mapping.role;
    }
  }

  return input.settings.scim.defaultRole;
}

export function buildScimProvisioningEnvelope(input: {
  identity: ProvisionedIdentity;
  settings: EnterpriseWorkspaceSettings;
  source?: WorkspaceProvisioningSource;
}): ScimProvisioningEnvelope {
  const groups = normalizeGroupList(input.identity.groups);
  return {
    userName: input.identity.email.trim().toLowerCase(),
    displayName: normalizeOptionalText(input.identity.displayName),
    active: true,
    groups,
    role: resolveProvisionedWorkspaceRole({
      settings: input.settings,
      groups,
    }),
    source: input.source ?? 'scim',
  };
}

export function buildProvisionedWorkspaceMember(input: {
  identity: ProvisionedIdentity;
  settings: EnterpriseWorkspaceSettings;
  userId: string;
  source?: WorkspaceProvisioningSource;
}): WorkspaceMemberRecord {
  const envelope = buildScimProvisioningEnvelope({
    identity: input.identity,
    settings: input.settings,
    source: input.source,
  });

  return {
    userId: input.userId,
    email: envelope.userName,
    displayName: envelope.displayName,
    role: envelope.role,
    status: 'active',
    source: envelope.source,
    joinedAt: new Date().toISOString(),
    invitedAt: null,
    invitedByUserId: null,
    groups: envelope.groups,
    lastSyncedAt: new Date().toISOString(),
  };
}
