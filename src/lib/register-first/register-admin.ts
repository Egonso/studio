import { db } from '@/lib/firebase-admin';

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

export async function getServerRegister(
  ownerId: string,
  registerId: string,
): Promise<Register | null> {
  const snapshot = await db.doc(`users/${ownerId}/registers/${registerId}`).get();
  return snapshot.exists ? (snapshot.data() as Register) : null;
}

export async function findRegisterLocationById(
  registerId: string,
): Promise<ServerRegisterLocation | null> {
  const normalizedRegisterId = normalizeOptionalText(registerId);
  if (!normalizedRegisterId) {
    return null;
  }

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

  return null;
}

export async function listWorkspaceRegisters(
  workspaceId: string,
): Promise<ServerRegisterLocation[]> {
  const normalizedWorkspaceId = normalizeOptionalText(workspaceId);
  if (!normalizedWorkspaceId) {
    return [];
  }

  const snapshot = await db
    .collectionGroup('registers')
    .where('workspaceId', '==', normalizedWorkspaceId)
    .get();

  return snapshot.docs
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
