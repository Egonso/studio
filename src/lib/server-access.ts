import {
  normalizeWorkspaceRole as normalizeEnterpriseWorkspaceRole,
  type ManagedWorkspaceRole,
} from '@/lib/enterprise/workspace';

export type StoredWorkspaceRole = ManagedWorkspaceRole;
export type ResolvedWorkspaceRole = "OWNER" | StoredWorkspaceRole;

export interface WorkspaceMembershipRecord {
  orgId: string;
  orgName?: string | null;
  role?: string | null;
}

export interface WorkspaceAccessProfile {
  workspaces?: WorkspaceMembershipRecord[] | null;
  workspaceOrgIds?: string[] | null;
  workspaceRolesByOrg?: Record<string, string> | null;
}

export interface WorkspaceAccessState {
  orgIds: string[];
  rolesByOrg: Record<string, ResolvedWorkspaceRole>;
}

export interface WorkspaceMembershipInput {
  orgId: string;
  orgName?: string | null;
  role: StoredWorkspaceRole;
}

export interface WorkspaceAccessWriteModel {
  workspaces: Array<{
    orgId: string;
    orgName: string;
    role: StoredWorkspaceRole;
  }>;
  workspaceOrgIds: string[];
  workspaceRolesByOrg: Record<string, StoredWorkspaceRole>;
}

export class AuthenticatedIdentityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticatedIdentityError";
  }
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function normalizeWorkspaceRole(
  value: string | null | undefined
): StoredWorkspaceRole {
  const normalizedRole = normalizeEnterpriseWorkspaceRole(value);
  return normalizedRole === 'OWNER' ? 'ADMIN' : normalizedRole;
}

function uniqueSorted(values: Iterable<string>): string[] {
  return Array.from(new Set(values)).sort((left, right) =>
    left.localeCompare(right)
  );
}

export function buildWorkspaceAccessState(
  userId: string,
  profile: WorkspaceAccessProfile | null | undefined
): WorkspaceAccessState {
  const rolesByOrg: Record<string, ResolvedWorkspaceRole> = {
    [userId]: "OWNER",
  };

  for (const orgId of profile?.workspaceOrgIds ?? []) {
    const normalizedOrgId = normalizeOptionalText(orgId);
    if (!normalizedOrgId || normalizedOrgId === userId) {
      continue;
    }
    rolesByOrg[normalizedOrgId] ??= "MEMBER";
  }

  for (const [orgId, role] of Object.entries(profile?.workspaceRolesByOrg ?? {})) {
    const normalizedOrgId = normalizeOptionalText(orgId);
    if (!normalizedOrgId || normalizedOrgId === userId) {
      continue;
    }
    rolesByOrg[normalizedOrgId] = normalizeWorkspaceRole(role);
  }

  for (const workspace of profile?.workspaces ?? []) {
    const normalizedOrgId = normalizeOptionalText(workspace?.orgId);
    if (!normalizedOrgId || normalizedOrgId === userId) {
      continue;
    }
    rolesByOrg[normalizedOrgId] = normalizeWorkspaceRole(workspace?.role);
  }

  return {
    orgIds: uniqueSorted(Object.keys(rolesByOrg)),
    rolesByOrg,
  };
}

export function hasWorkspaceAccess(
  state: WorkspaceAccessState,
  orgId: string
): boolean {
  return state.orgIds.includes(orgId);
}

export function hasWorkspaceRole(
  state: WorkspaceAccessState,
  orgId: string,
  allowedRoles: ResolvedWorkspaceRole[]
): boolean {
  const role = state.rolesByOrg[orgId];
  return Boolean(role) && allowedRoles.includes(role);
}

export function upsertWorkspaceMembership(
  profile: WorkspaceAccessProfile | null | undefined,
  membership: WorkspaceMembershipInput
): WorkspaceAccessWriteModel {
  const normalizedOrgId = normalizeOptionalText(membership.orgId);
  if (!normalizedOrgId) {
    throw new Error("orgId is required.");
  }

  const normalizedOrgName = normalizeOptionalText(membership.orgName) ?? "";
  const normalizedRole = normalizeWorkspaceRole(membership.role);

  const nextByOrg = new Map<
    string,
    { orgId: string; orgName: string; role: StoredWorkspaceRole }
  >();

  for (const workspace of profile?.workspaces ?? []) {
    const orgId = normalizeOptionalText(workspace?.orgId);
    if (!orgId) {
      continue;
    }
    nextByOrg.set(orgId, {
      orgId,
      orgName: normalizeOptionalText(workspace?.orgName) ?? "",
      role: normalizeWorkspaceRole(workspace?.role),
    });
  }

  nextByOrg.set(normalizedOrgId, {
    orgId: normalizedOrgId,
    orgName:
      normalizedOrgName ||
      nextByOrg.get(normalizedOrgId)?.orgName ||
      "KI-Register Workspace",
    role: normalizedRole,
  });

  const workspaces = Array.from(nextByOrg.values()).sort((left, right) =>
    left.orgId.localeCompare(right.orgId)
  );

  return {
    workspaces,
    workspaceOrgIds: workspaces.map((workspace) => workspace.orgId),
    workspaceRolesByOrg: Object.fromEntries(
      workspaces.map((workspace) => [workspace.orgId, workspace.role])
    ),
  };
}

export function removeWorkspaceMembership(
  profile: WorkspaceAccessProfile | null | undefined,
  orgIdToRemove: string,
): WorkspaceAccessWriteModel {
  const normalizedOrgId = normalizeOptionalText(orgIdToRemove);
  if (!normalizedOrgId) {
    throw new Error('orgId is required.');
  }

  const remainingMemberships = (profile?.workspaces ?? []).filter((workspace) => {
    const orgId = normalizeOptionalText(workspace?.orgId);
    return Boolean(orgId) && orgId !== normalizedOrgId;
  });

  const workspaces = remainingMemberships
    .map((workspace) => ({
      orgId: normalizeOptionalText(workspace.orgId) ?? '',
      orgName:
        normalizeOptionalText(workspace.orgName) ?? 'KI-Register Workspace',
      role: normalizeWorkspaceRole(workspace.role),
    }))
    .filter((workspace) => workspace.orgId.length > 0)
    .sort((left, right) => left.orgId.localeCompare(right.orgId));

  return {
    workspaces,
    workspaceOrgIds: workspaces.map((workspace) => workspace.orgId),
    workspaceRolesByOrg: Object.fromEntries(
      workspaces.map((workspace) => [workspace.orgId, workspace.role]),
    ),
  };
}

export function materializeWorkspaceAccessWriteModel(
  userId: string,
  profile: WorkspaceAccessProfile | null | undefined
): WorkspaceAccessWriteModel {
  const access = buildWorkspaceAccessState(userId, profile);
  const orgNameById = new Map<string, string>();

  for (const workspace of profile?.workspaces ?? []) {
    const orgId = normalizeOptionalText(workspace?.orgId);
    if (!orgId || orgId === userId) {
      continue;
    }

    orgNameById.set(
      orgId,
      normalizeOptionalText(workspace?.orgName) ?? "KI-Register Workspace"
    );
  }

  const workspaces = access.orgIds
    .filter((orgId) => orgId !== userId)
    .map((orgId) => ({
      orgId,
      orgName: orgNameById.get(orgId) ?? "KI-Register Workspace",
      role: normalizeWorkspaceRole(access.rolesByOrg[orgId]),
    }));

  return {
    workspaces,
    workspaceOrgIds: workspaces.map((workspace) => workspace.orgId),
    workspaceRolesByOrg: Object.fromEntries(
      workspaces.map((workspace) => [workspace.orgId, workspace.role])
    ),
  };
}

export function assertAuthenticatedIdentity(
  actor: { uid: string; email: string },
  input: { userId: string; email: string }
): void {
  const normalizedEmail = input.email.trim().toLowerCase();

  if (actor.uid !== input.userId) {
    throw new AuthenticatedIdentityError(
      "Authenticated user does not match request user."
    );
  }

  if (actor.email !== normalizedEmail) {
    throw new AuthenticatedIdentityError(
      "Authenticated email does not match request email."
    );
  }
}
