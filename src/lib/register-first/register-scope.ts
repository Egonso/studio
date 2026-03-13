import { doc, getDoc } from 'firebase/firestore';

import { buildWorkspaceAccessState } from '@/lib/server-access';
import { getFirebaseDb } from '@/lib/firebase';
import { getActiveWorkspaceId } from '@/lib/workspace-session';

import type { Register, RegisterScopeContext } from './types';

const PERSONAL_SCOPE: RegisterScopeContext = { kind: 'personal' };

export interface RegisterLocation {
  ownerId: string;
  register: Register;
}

export interface ResolveClientRegisterScopeOptions {
  userId: string;
  requestedScope?: RegisterScopeContext | null;
  accessibleWorkspaceIds?: string[] | null;
}

export function normalizeRegisterScopeContext(
  context?: RegisterScopeContext | null,
): RegisterScopeContext {
  if (context?.kind === 'workspace') {
    const workspaceId = context.workspaceId?.trim();
    if (workspaceId) {
      return {
        kind: 'workspace',
        workspaceId,
      };
    }
  }

  return PERSONAL_SCOPE;
}

export function parseRegisterScopeFromWorkspaceValue(
  value: string | null | undefined,
): RegisterScopeContext {
  const normalized = value?.trim();
  if (!normalized || normalized === 'personal') {
    return PERSONAL_SCOPE;
  }

  return {
    kind: 'workspace',
    workspaceId: normalized,
  };
}

export function getRegisterScopeKey(context?: RegisterScopeContext | null): string {
  const normalized = normalizeRegisterScopeContext(context);
  return normalized.kind === 'workspace'
    ? `workspace:${normalized.workspaceId}`
    : 'personal';
}

export function isRegisterInScope(
  location: RegisterLocation,
  actorUserId: string,
  context: RegisterScopeContext,
): boolean {
  if (context.kind === 'workspace') {
    return location.register.workspaceId === context.workspaceId;
  }

  return location.ownerId === actorUserId;
}

export async function loadAccessibleWorkspaceIds(
  userId: string,
): Promise<string[]> {
  const db = await getFirebaseDb();
  const snapshot = await getDoc(doc(db, 'users', userId));
  if (!snapshot.exists()) {
    return [];
  }

  const access = buildWorkspaceAccessState(
    userId,
    snapshot.data() as Parameters<typeof buildWorkspaceAccessState>[1],
  );

  return access.orgIds.filter((orgId) => orgId !== userId);
}

export async function resolveClientRegisterScopeContext(
  options: ResolveClientRegisterScopeOptions,
): Promise<RegisterScopeContext> {
  const requested =
    options.requestedScope ??
    parseRegisterScopeFromWorkspaceValue(getActiveWorkspaceId());
  const normalized = normalizeRegisterScopeContext(requested);

  if (normalized.kind !== 'workspace') {
    return PERSONAL_SCOPE;
  }

  const accessibleWorkspaceIds =
    options.accessibleWorkspaceIds ??
    (await loadAccessibleWorkspaceIds(options.userId));

  if (!accessibleWorkspaceIds.includes(normalized.workspaceId!)) {
    return PERSONAL_SCOPE;
  }

  return normalized;
}
