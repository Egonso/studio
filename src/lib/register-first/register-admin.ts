import { db } from '@/lib/firebase-admin';
import { logWarn } from '@/lib/observability/logger';
import { getWorkspaceRecord, listWorkspaceMembers } from '@/lib/workspace-admin';

import type { ExternalSubmission, Register } from './types';

export interface ServerRegisterLocation {
  ownerId: string;
  registerId: string;
  register: Register;
}

export interface ServerExternalSubmissionLocation {
  ownerId: string;
  registerId: string;
  register: Register;
  submission: ExternalSubmission;
}

interface FindRegisterLocationOptions {
  ownerId?: string | null;
  workspaceId?: string | null;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function extractOwnerIdFromRegisterPath(path: string): string | null {
  const match = path.match(/^users\/([^/]+)\/registers\/[^/]+$/);
  return match?.[1] ?? null;
}

function extractRegisterPathFromSubmissionPath(path: string): string | null {
  const match = path.match(/^(users\/[^/]+\/registers\/[^/]+)\/externalSubmissions\/[^/]+$/);
  return match?.[1] ?? null;
}

function isFailedPreconditionError(error: unknown): boolean {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    Number((error as { code?: unknown }).code) === 9
  ) {
    return true;
  }

  return (
    error instanceof Error &&
    error.message.toUpperCase().includes('FAILED_PRECONDITION')
  );
}

function normalizeOwnerIds(ownerIds: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const ownerId of ownerIds) {
    const normalized = normalizeOptionalText(ownerId);
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

export async function getServerRegister(
  ownerId: string,
  registerId: string,
): Promise<Register | null> {
  const snapshot = await db.doc(`users/${ownerId}/registers/${registerId}`).get();
  return snapshot.exists ? (snapshot.data() as Register) : null;
}

async function findRegisterLocationByOwnerCandidates(
  registerId: string,
  ownerIds: string[],
): Promise<ServerRegisterLocation | null> {
  for (const ownerId of ownerIds) {
    const register = await getServerRegister(ownerId, registerId);
    if (!register || register.isDeleted === true) {
      continue;
    }

    return {
      ownerId,
      registerId,
      register,
    };
  }

  return null;
}

async function resolveWorkspaceOwnerIds(workspaceId: string): Promise<string[]> {
  const [workspace, members] = await Promise.all([
    getWorkspaceRecord(workspaceId),
    listWorkspaceMembers(workspaceId),
  ]);

  return normalizeOwnerIds([
    workspace?.ownerUserId,
    ...members.map((member) => member.userId),
  ]);
}

async function listWorkspaceRegistersFromLinks(
  workspaceId: string,
): Promise<ServerRegisterLocation[]> {
  const workspace = await getWorkspaceRecord(workspaceId);
  const linkedRegisterIds = Array.isArray(workspace?.linkedRegisterIds)
    ? workspace!.linkedRegisterIds
    : [];

  if (linkedRegisterIds.length === 0) {
    return [];
  }

  const ownerIds = await resolveWorkspaceOwnerIds(workspaceId);
  const seen = new Set<string>();
  const locations: ServerRegisterLocation[] = [];

  for (const registerId of linkedRegisterIds) {
    const normalizedRegisterId = normalizeOptionalText(registerId);
    if (!normalizedRegisterId || seen.has(normalizedRegisterId)) {
      continue;
    }

    const location = await findRegisterLocationByOwnerCandidates(
      normalizedRegisterId,
      ownerIds,
    );

    if (
      !location ||
      location.register.workspaceId !== workspaceId ||
      location.register.isDeleted === true
    ) {
      continue;
    }

    seen.add(normalizedRegisterId);
    locations.push(location);
  }

  return locations;
}

async function listWorkspaceRegistersFromOwners(
  workspaceId: string,
): Promise<ServerRegisterLocation[]> {
  const ownerIds = await resolveWorkspaceOwnerIds(workspaceId);
  const locations: ServerRegisterLocation[] = [];

  for (const ownerId of ownerIds) {
    const snapshot = await db.collection(`users/${ownerId}/registers`).get();

    for (const document of snapshot.docs) {
      const register = document.data() as Register;
      if (register.workspaceId !== workspaceId || register.isDeleted === true) {
        continue;
      }

      locations.push({
        ownerId,
        registerId: String(register.registerId ?? document.id),
        register,
      });
    }
  }

  return locations;
}

export async function findRegisterLocationById(
  registerId: string,
  options: FindRegisterLocationOptions = {},
): Promise<ServerRegisterLocation | null> {
  const normalizedRegisterId = normalizeOptionalText(registerId);
  if (!normalizedRegisterId) {
    return null;
  }

  const directOwnerMatch = await findRegisterLocationByOwnerCandidates(
    normalizedRegisterId,
    normalizeOwnerIds([options.ownerId]),
  );
  if (directOwnerMatch) {
    return directOwnerMatch;
  }

  try {
    const snapshot = await db
      .collectionGroup('registers')
      .where('registerId', '==', normalizedRegisterId)
      .limit(5)
      .get();

    for (const document of snapshot.docs) {
      const ownerId = extractOwnerIdFromRegisterPath(document.ref.path);
      if (!ownerId) {
        continue;
      }

      const register = document.data() as Register;
      if (register.isDeleted === true) {
        continue;
      }

      return {
        ownerId,
        registerId: normalizedRegisterId,
        register,
      };
    }
  } catch (error) {
    if (!isFailedPreconditionError(error)) {
      throw error;
    }

    logWarn('register_admin_collection_group_fallback', {
      registerId: normalizedRegisterId,
      workspaceId: options.workspaceId ?? null,
      ownerId: options.ownerId ?? null,
    });
  }

  const workspaceId = normalizeOptionalText(options.workspaceId);
  if (workspaceId) {
    const workspaceRegisters = await listWorkspaceRegistersFromLinks(workspaceId);
    return (
      workspaceRegisters.find(
        (location) => location.registerId === normalizedRegisterId,
      ) ?? null
    );
  }

  return null;
}

export async function listWorkspaceRegisters(
  workspaceId: string,
): Promise<ServerRegisterLocation[]> {
  const normalizedWorkspaceId = normalizeOptionalText(workspaceId);
  if (!normalizedWorkspaceId) {
    return [];
  }

  try {
    const snapshot = await db
      .collectionGroup('registers')
      .where('workspaceId', '==', normalizedWorkspaceId)
      .get();

    const locations = snapshot.docs
      .map((document) => {
        const ownerId = extractOwnerIdFromRegisterPath(document.ref.path);
        const register = document.data() as Register;
        if (!ownerId || register.isDeleted === true) {
          return null;
        }

        return {
          ownerId,
          registerId: String(register.registerId ?? document.id),
          register,
        } satisfies ServerRegisterLocation;
      })
      .filter((entry): entry is ServerRegisterLocation => entry !== null);

    if (locations.length > 0) {
      return locations;
    }
  } catch (error) {
    if (!isFailedPreconditionError(error)) {
      throw error;
    }

    logWarn('workspace_register_collection_group_fallback', {
      workspaceId: normalizedWorkspaceId,
    });
  }

  const linkedLocations = await listWorkspaceRegistersFromLinks(
    normalizedWorkspaceId,
  );
  if (linkedLocations.length > 0) {
    return linkedLocations;
  }

  return listWorkspaceRegistersFromOwners(normalizedWorkspaceId);
}

export async function findWorkspaceExternalSubmissionById(input: {
  workspaceId: string;
  submissionId: string;
}): Promise<ServerExternalSubmissionLocation | null> {
  const normalizedWorkspaceId = normalizeOptionalText(input.workspaceId);
  const normalizedSubmissionId = normalizeOptionalText(input.submissionId);
  if (!normalizedWorkspaceId || !normalizedSubmissionId) {
    return null;
  }

  const snapshot = await db
    .collectionGroup('externalSubmissions')
    .where('submissionId', '==', normalizedSubmissionId)
    .limit(10)
    .get();

  for (const document of snapshot.docs) {
    const registerPath = extractRegisterPathFromSubmissionPath(document.ref.path);
    if (!registerPath) {
      continue;
    }

    const registerSnapshot = await db.doc(registerPath).get();
    if (!registerSnapshot.exists) {
      continue;
    }

    const register = registerSnapshot.data() as Register;
    if (register.workspaceId !== normalizedWorkspaceId || register.isDeleted === true) {
      continue;
    }

    const ownerId = extractOwnerIdFromRegisterPath(registerPath);
    if (!ownerId) {
      continue;
    }

    return {
      ownerId,
      registerId: String(register.registerId ?? registerSnapshot.id),
      register,
      submission: document.data() as ExternalSubmission,
    };
  }

  return null;
}
