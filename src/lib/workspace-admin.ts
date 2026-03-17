import { db } from '@/lib/firebase-admin';
import {
  createDefaultEnterpriseWorkspaceSettings,
  createWorkspaceRecord,
  mergeEnterpriseWorkspaceSettings,
  normalizeWorkspaceMember,
  type EnterpriseWorkspaceSettingsUpdate,
  type EnterpriseWorkspaceSettings,
  type ManagedWorkspaceRole,
  type WorkspaceRole,
  type WorkspaceMemberRecord,
  type WorkspaceProvisioningSource,
  type WorkspaceRecord,
} from '@/lib/enterprise/workspace';
import {
  removeWorkspaceMembership,
  upsertWorkspaceMembership,
  type WorkspaceAccessProfile,
} from '@/lib/server-access';

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function workspaceRef(orgId: string) {
  return db.collection('workspaces').doc(orgId);
}

function memberRef(orgId: string, userId: string) {
  return workspaceRef(orgId).collection('members').doc(userId);
}

export interface UserWorkspaceSummary {
  orgId: string;
  name: string;
  role: WorkspaceRole;
}

export async function ensureWorkspaceRecord(input: {
  orgId: string;
  name: string;
  ownerUserId: string;
  plan?: 'free' | 'pro' | 'enterprise';
}): Promise<WorkspaceRecord> {
  const ref = workspaceRef(input.orgId);
  const snapshot = await ref.get();
  if (snapshot.exists) {
    const data = snapshot.data() as WorkspaceRecord;
    if (!data.enterpriseSettings) {
      await ref.set(
        {
          enterpriseSettings: createDefaultEnterpriseWorkspaceSettings(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    }
    return {
      ...data,
      enterpriseSettings:
        data.enterpriseSettings ?? createDefaultEnterpriseWorkspaceSettings(),
    };
  }

  const record = createWorkspaceRecord({
    orgId: input.orgId,
    name: input.name,
    ownerUserId: input.ownerUserId,
    plan: input.plan ?? 'enterprise',
  });
  await ref.set(record, { merge: false });
  await memberRef(input.orgId, input.ownerUserId).set(
    normalizeWorkspaceMember({
      userId: input.ownerUserId,
      email: `${input.ownerUserId}@workspace.invalid`,
      displayName: input.name,
      role: 'OWNER',
      status: 'active',
      source: 'legacy',
      joinedAt: record.createdAt,
    }),
    { merge: true },
  );
  return record;
}

export async function getWorkspaceRecord(
  orgId: string,
): Promise<WorkspaceRecord | null> {
  const snapshot = await workspaceRef(orgId).get();
  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() as WorkspaceRecord;
  return {
    ...data,
    enterpriseSettings:
      data.enterpriseSettings ?? createDefaultEnterpriseWorkspaceSettings(),
    linkedRegisterIds: Array.isArray(data.linkedRegisterIds)
      ? data.linkedRegisterIds
      : [],
  };
}

export async function listWorkspaceMembers(
  orgId: string,
): Promise<WorkspaceMemberRecord[]> {
  const snapshot = await workspaceRef(orgId).collection('members').get();
  return snapshot.docs
    .map((doc) => normalizeWorkspaceMember(doc.data() as WorkspaceMemberRecord))
    .sort((left, right) => left.email.localeCompare(right.email));
}

export async function listUserWorkspaces(
  userId: string,
): Promise<UserWorkspaceSummary[]> {
  const [ownedWorkspacesSnapshot, memberSnapshot] = await Promise.all([
    db.collection('workspaces').where('ownerUserId', '==', userId).get(),
    db.collectionGroup('members').where('userId', '==', userId).get(),
  ]);

  const byOrgId = new Map<string, UserWorkspaceSummary>();

  for (const workspaceDoc of ownedWorkspacesSnapshot.docs) {
    const workspace = workspaceDoc.data() as WorkspaceRecord;
    byOrgId.set(workspaceDoc.id, {
      orgId: workspaceDoc.id,
      name: workspace.name?.trim() || workspaceDoc.id,
      role: 'OWNER',
    });
  }

  const missingWorkspaceIds = new Set<string>();

  for (const memberDoc of memberSnapshot.docs) {
    const workspaceDoc = memberDoc.ref.parent.parent;
    if (!workspaceDoc) {
      continue;
    }

    const orgId = workspaceDoc.id;
    const member = normalizeWorkspaceMember(
      memberDoc.data() as WorkspaceMemberRecord,
    );
    if (member.status !== 'active') {
      continue;
    }
    const existing = byOrgId.get(orgId);

    if (!existing) {
      missingWorkspaceIds.add(orgId);
    }

    byOrgId.set(orgId, {
      orgId,
      name: existing?.name ?? orgId,
      role: existing?.role === 'OWNER' ? 'OWNER' : member.role,
    });
  }

  if (missingWorkspaceIds.size > 0) {
    const workspaces = await Promise.all(
      Array.from(missingWorkspaceIds).map(async (orgId) => ({
        orgId,
        workspace: await getWorkspaceRecord(orgId),
      })),
    );

    for (const entry of workspaces) {
      const existing = byOrgId.get(entry.orgId);
      if (!existing) {
        continue;
      }

      byOrgId.set(entry.orgId, {
        ...existing,
        name: entry.workspace?.name?.trim() || existing.name,
      });
    }
  }

  return Array.from(byOrgId.values()).sort((left, right) =>
    left.name.localeCompare(right.name, 'de'),
  );
}

export async function upsertWorkspaceMemberRecord(input: {
  orgId: string;
  orgName: string;
  userId: string;
  email: string;
  role: ManagedWorkspaceRole | 'OWNER';
  displayName?: string | null;
  source: WorkspaceProvisioningSource;
  status?: WorkspaceMemberRecord['status'];
  invitedByUserId?: string | null;
  ownerUserId?: string | null;
}): Promise<WorkspaceMemberRecord> {
  const workspace = await ensureWorkspaceRecord({
    orgId: input.orgId,
    name: input.orgName,
    ownerUserId:
      normalizeOptionalText(input.ownerUserId) ??
      (input.role === 'OWNER' ? input.userId : input.invitedByUserId) ??
      input.userId,
  });
  const nowIso = new Date().toISOString();
  const nextMember = normalizeWorkspaceMember({
    userId: input.userId,
    email: input.email,
    displayName: input.displayName ?? null,
    role: input.role,
    status: input.status ?? 'active',
    source: input.source,
    joinedAt: input.status === 'invited' ? null : nowIso,
    invitedAt: nowIso,
    invitedByUserId: input.invitedByUserId ?? null,
    lastSyncedAt: input.source === 'sso' || input.source === 'scim' ? nowIso : null,
  });

  await memberRef(input.orgId, input.userId).set(nextMember, { merge: true });
  await workspaceRef(input.orgId).set(
    {
      name: workspace.name || input.orgName,
      updatedAt: nowIso,
    },
    { merge: true },
  );

  return nextMember;
}

export async function syncUserWorkspaceAccess(input: {
  userId: string;
  email: string;
  orgId: string;
  orgName: string;
  role: ManagedWorkspaceRole;
}): Promise<void> {
  const userRef = db.collection('users').doc(input.userId);
  const snapshot = await userRef.get();
  const data = (snapshot.data() as WorkspaceAccessProfile | undefined) ?? {};
  const nextMembership = upsertWorkspaceMembership(data, {
    orgId: input.orgId,
    orgName: input.orgName,
    role: input.role,
  });

  await userRef.set(
    {
      email: input.email.trim().toLowerCase(),
      workspaces: nextMembership.workspaces,
      workspaceOrgIds: nextMembership.workspaceOrgIds,
      workspaceRolesByOrg: nextMembership.workspaceRolesByOrg,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

export async function removeUserWorkspaceAccess(input: {
  userId: string;
  orgId: string;
}): Promise<void> {
  const userRef = db.collection('users').doc(input.userId);
  const snapshot = await userRef.get();
  if (!snapshot.exists) {
    return;
  }

  const data = snapshot.data() as WorkspaceAccessProfile;
  const nextMembership = removeWorkspaceMembership(data, input.orgId);
  await userRef.set(
    {
      workspaces: nextMembership.workspaces,
      workspaceOrgIds: nextMembership.workspaceOrgIds,
      workspaceRolesByOrg: nextMembership.workspaceRolesByOrg,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

export async function updateWorkspaceMemberRole(input: {
  orgId: string;
  memberUserId: string;
  role: ManagedWorkspaceRole;
}): Promise<WorkspaceMemberRecord> {
  const workspace = await getWorkspaceRecord(input.orgId);
  if (!workspace) {
    throw new Error('WORKSPACE_NOT_FOUND');
  }
  if (workspace.ownerUserId === input.memberUserId) {
    throw new Error('OWNER_ROLE_IMMUTABLE');
  }

  const ref = memberRef(input.orgId, input.memberUserId);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    throw new Error('MEMBER_NOT_FOUND');
  }

  const existing = snapshot.data() as WorkspaceMemberRecord;
  const nextMember = normalizeWorkspaceMember({
    ...existing,
    role: input.role,
  });
  await ref.set(nextMember, { merge: true });
  await syncUserWorkspaceAccess({
    userId: input.memberUserId,
    email: nextMember.email,
    orgId: input.orgId,
    orgName: workspace.name,
    role: input.role,
  });
  return nextMember;
}

export async function removeWorkspaceMember(input: {
  orgId: string;
  memberUserId: string;
}): Promise<void> {
  const workspace = await getWorkspaceRecord(input.orgId);
  if (!workspace) {
    throw new Error('WORKSPACE_NOT_FOUND');
  }
  if (workspace.ownerUserId === input.memberUserId) {
    throw new Error('OWNER_REMOVAL_FORBIDDEN');
  }

  await memberRef(input.orgId, input.memberUserId).delete();
  await removeUserWorkspaceAccess({
    userId: input.memberUserId,
    orgId: input.orgId,
  });
}

export async function listPendingWorkspaceInvites(
  orgId: string,
): Promise<
  Array<{
    inviteId: string;
    email: string;
    role: string;
    status: string;
    expiresAt: string;
    createdAt: string;
  }>
> {
  const snapshot = await db
    .collection('pendingWorkspaceInvites')
    .where('targetOrgId', '==', orgId)
    .where('status', '==', 'pending')
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data() as Record<string, unknown>;
    return {
      inviteId: doc.id,
      email: String(data.email ?? ''),
      role: String(data.role ?? 'MEMBER'),
      status: String(data.status ?? 'pending'),
      expiresAt: String(data.expiresAt ?? ''),
      createdAt: String(data.createdAt ?? ''),
    };
  });
}

export async function updateWorkspaceEnterpriseSettings(input: {
  orgId: string;
  actorUserId?: string | null;
  updates: EnterpriseWorkspaceSettingsUpdate;
}): Promise<EnterpriseWorkspaceSettings> {
  const existing = await getWorkspaceRecord(input.orgId);
  if (!existing) {
    throw new Error('WORKSPACE_NOT_FOUND');
  }

  const nextSettings = mergeEnterpriseWorkspaceSettings(
    existing.enterpriseSettings,
    input.updates,
    input.actorUserId,
  );
  await workspaceRef(input.orgId).set(
    {
      enterpriseSettings: nextSettings,
      updatedAt: nextSettings.updatedAt,
    },
    { merge: true },
  );
  return nextSettings;
}

export async function ensureRegisterLinkedToWorkspace(input: {
  orgId: string;
  registerId: string;
}): Promise<void> {
  const workspace = await getWorkspaceRecord(input.orgId);
  if (!workspace) {
    return;
  }

  if (workspace.linkedRegisterIds.includes(input.registerId)) {
    return;
  }

  await workspaceRef(input.orgId).set(
    {
      linkedRegisterIds: [...workspace.linkedRegisterIds, input.registerId],
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

export async function getWorkspaceSettingsForRegister(input: {
  registerWorkspaceId?: string | null;
  registerOwnerId: string;
}): Promise<EnterpriseWorkspaceSettings | null> {
  const workspaceId =
    normalizeOptionalText(input.registerWorkspaceId) ?? input.registerOwnerId;
  const workspace = await getWorkspaceRecord(workspaceId);
  return workspace?.enterpriseSettings ?? null;
}
