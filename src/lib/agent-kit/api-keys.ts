import '@/lib/server-only-guard';

import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

import { db } from '@/lib/firebase-admin';
import type { WorkspaceMemberRecord } from '@/lib/enterprise/workspace';
import { getWorkspaceRecord } from '@/lib/workspace-admin';

const AGENT_KIT_API_KEY_PREFIX = 'akv1';
export const AGENT_KIT_API_KEY_SCOPE_VALUES = [
  'submit:usecase',
  'read:register',
  'read:usecase',
  'read:audit',
  'write:candidate',
  'write:review-note',
  'write:status-proposal',
] as const;

export type AgentKitApiKeyScope =
  (typeof AGENT_KIT_API_KEY_SCOPE_VALUES)[number];

const AGENT_KIT_API_KEY_SCOPE_SET = new Set<string>(
  AGENT_KIT_API_KEY_SCOPE_VALUES,
);
const DEFAULT_AGENT_KIT_API_KEY_SCOPES: AgentKitApiKeyScope[] = [
  'submit:usecase',
];

export interface AgentKitApiKeyRecord {
  keyId: string;
  orgId: string;
  label: string;
  keyHash: string;
  keyPreview: string;
  scopes: AgentKitApiKeyScope[];
  createdAt: string;
  createdByUserId: string;
  createdByEmail?: string | null;
  lastUsedAt?: string | null;
  lastSubmittedUseCaseId?: string | null;
  revokedAt?: string | null;
  revokedByUserId?: string | null;
  revokedByEmail?: string | null;
}

export interface AgentKitApiKeySummary {
  keyId: string;
  orgId: string;
  label: string;
  keyPreview: string;
  scopes: AgentKitApiKeyScope[];
  createdAt: string;
  createdByUserId: string;
  createdByEmail?: string | null;
  lastUsedAt?: string | null;
  lastSubmittedUseCaseId?: string | null;
  revokedAt?: string | null;
}

export interface ParsedAgentKitApiKey {
  orgId: string;
  keyId: string;
  secret: string;
}

type AgentKitApiKeyValidationReason =
  | 'invalid_format'
  | 'not_found'
  | 'token_mismatch'
  | 'hash_mismatch'
  | 'revoked'
  | 'workspace_access_revoked';

export type AgentKitApiKeyAuthenticationResult =
  | {
      ok: true;
      parsed: ParsedAgentKitApiKey;
      record: AgentKitApiKeyRecord;
    }
  | {
      ok: false;
      reason: AgentKitApiKeyValidationReason;
    };

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function normalizeAgentKitApiKeyScopes(
  value: readonly string[] | null | undefined,
): AgentKitApiKeyScope[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [...DEFAULT_AGENT_KIT_API_KEY_SCOPES];
  }

  const scopes: AgentKitApiKeyScope[] = [];
  for (const rawScope of value) {
    const scope = normalizeOptionalText(rawScope);
    if (!scope || !AGENT_KIT_API_KEY_SCOPE_SET.has(scope)) {
      continue;
    }

    if (!scopes.includes(scope as AgentKitApiKeyScope)) {
      scopes.push(scope as AgentKitApiKeyScope);
    }
  }

  return scopes.length > 0 ? scopes : [...DEFAULT_AGENT_KIT_API_KEY_SCOPES];
}

function normalizeAgentKitApiKeyRecord(
  record: AgentKitApiKeyRecord,
): AgentKitApiKeyRecord {
  return {
    ...record,
    scopes: normalizeAgentKitApiKeyScopes(record.scopes),
  };
}

function normalizeAuthorizationValue(
  value: string | null | undefined,
): string | null {
  const normalized = normalizeOptionalText(value);
  if (!normalized) {
    return null;
  }

  if (normalized.toLowerCase().startsWith('bearer ')) {
    return normalizeOptionalText(normalized.slice(7));
  }

  return normalized;
}

function keyCollection(orgId: string) {
  return db.collection('workspaces').doc(orgId).collection('agentKitKeys');
}

export function isPersonalAgentKitScope(
  orgId: string,
  userId: string,
): boolean {
  return orgId.trim() === userId.trim();
}

function hashAgentKitApiKeySecret(secret: string): string {
  return createHash('sha256').update(secret, 'utf8').digest('hex');
}

function createAgentKitApiKeyId(): string {
  return `akit_${randomBytes(12).toString('hex')}`;
}

function createAgentKitApiKeySecret(): string {
  return randomBytes(24).toString('base64url');
}

function buildKeyPreview(parsed: ParsedAgentKitApiKey): string {
  return `${AGENT_KIT_API_KEY_PREFIX}.${parsed.orgId}.${parsed.keyId}.${parsed.secret.slice(0, 6)}…`;
}

function toSummary(record: AgentKitApiKeyRecord): AgentKitApiKeySummary {
  const normalizedRecord = normalizeAgentKitApiKeyRecord(record);
  return {
    keyId: normalizedRecord.keyId,
    orgId: normalizedRecord.orgId,
    label: normalizedRecord.label,
    keyPreview: normalizedRecord.keyPreview,
    scopes: normalizedRecord.scopes,
    createdAt: normalizedRecord.createdAt,
    createdByUserId: normalizedRecord.createdByUserId,
    createdByEmail: normalizedRecord.createdByEmail ?? null,
    lastUsedAt: normalizedRecord.lastUsedAt ?? null,
    lastSubmittedUseCaseId: normalizedRecord.lastSubmittedUseCaseId ?? null,
    revokedAt: normalizedRecord.revokedAt ?? null,
  };
}

export function parseAgentKitApiKey(
  value: string | null | undefined,
): ParsedAgentKitApiKey | null {
  const normalized = normalizeAuthorizationValue(value);
  if (!normalized) {
    return null;
  }

  const parts = normalized.split('.');
  if (parts.length !== 4) {
    return null;
  }

  if (parts[0] !== AGENT_KIT_API_KEY_PREFIX) {
    return null;
  }

  const orgId = normalizeOptionalText(parts[1]);
  const keyId = normalizeOptionalText(parts[2]);
  const secret = normalizeOptionalText(parts[3]);
  if (!orgId || !keyId || !secret) {
    return null;
  }

  return {
    orgId,
    keyId,
    secret,
  };
}

export function issueAgentKitApiKey(input: {
  orgId: string;
  label: string;
  scopes?: readonly AgentKitApiKeyScope[] | null;
  createdByUserId: string;
  createdByEmail?: string | null;
  now?: Date;
}): {
  apiKey: string;
  record: AgentKitApiKeyRecord;
} {
  const now = input.now ?? new Date();
  const keyId = createAgentKitApiKeyId();
  const secret = createAgentKitApiKeySecret();
  const parsed: ParsedAgentKitApiKey = {
    orgId: input.orgId,
    keyId,
    secret,
  };

  return {
    apiKey: `${AGENT_KIT_API_KEY_PREFIX}.${input.orgId}.${keyId}.${secret}`,
    record: {
      keyId,
      orgId: input.orgId,
      label: input.label.trim(),
      keyHash: hashAgentKitApiKeySecret(secret),
      keyPreview: buildKeyPreview(parsed),
      scopes: normalizeAgentKitApiKeyScopes(input.scopes),
      createdAt: now.toISOString(),
      createdByUserId: input.createdByUserId,
      createdByEmail: normalizeOptionalText(input.createdByEmail),
      lastUsedAt: null,
      lastSubmittedUseCaseId: null,
      revokedAt: null,
      revokedByUserId: null,
      revokedByEmail: null,
    },
  };
}

export async function createAgentKitApiKey(input: {
  orgId: string;
  label: string;
  scopes?: readonly AgentKitApiKeyScope[] | null;
  createdByUserId: string;
  createdByEmail?: string | null;
  now?: Date;
}): Promise<{
  apiKey: string;
  summary: AgentKitApiKeySummary;
}> {
  const issued = issueAgentKitApiKey(input);
  await keyCollection(input.orgId).doc(issued.record.keyId).set(issued.record);
  return {
    apiKey: issued.apiKey,
    summary: toSummary(issued.record),
  };
}

export async function listAgentKitApiKeysForUser(
  orgId: string,
  userId: string,
): Promise<AgentKitApiKeySummary[]> {
  return listAgentKitApiKeys(orgId, {
    createdByUserId: userId,
  });
}

export async function listAgentKitApiKeys(
  orgId: string,
  options: {
    createdByUserId?: string | null;
  } = {},
): Promise<AgentKitApiKeySummary[]> {
  const createdByUserId = normalizeOptionalText(options.createdByUserId);
  const snapshot = createdByUserId
    ? await keyCollection(orgId)
        .where('createdByUserId', '==', createdByUserId)
        .get()
    : await keyCollection(orgId).get();

  return snapshot.docs
    .map((document) =>
      toSummary(document.data() as AgentKitApiKeyRecord),
    )
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function getAgentKitApiKeyRecord(
  orgId: string,
  keyId: string,
): Promise<AgentKitApiKeyRecord | null> {
  const snapshot = await keyCollection(orgId).doc(keyId).get();
  return snapshot.exists
    ? normalizeAgentKitApiKeyRecord(snapshot.data() as AgentKitApiKeyRecord)
    : null;
}

export function hasAgentKitApiKeyScope(
  record: Pick<AgentKitApiKeyRecord, 'scopes'>,
  scope: AgentKitApiKeyScope,
): boolean {
  return normalizeAgentKitApiKeyScopes(record.scopes).includes(scope);
}

export function hasAgentKitApiKeyScopes(
  record: Pick<AgentKitApiKeyRecord, 'scopes'>,
  requiredScopes: readonly AgentKitApiKeyScope[],
): boolean {
  const availableScopes = normalizeAgentKitApiKeyScopes(record.scopes);
  return requiredScopes.every((scope) => availableScopes.includes(scope));
}

async function hasActiveWorkspaceAccess(
  orgId: string,
  userId: string,
): Promise<boolean> {
  if (isPersonalAgentKitScope(orgId, userId)) {
    return true;
  }

  const workspace = await getWorkspaceRecord(orgId);
  if (workspace?.ownerUserId === userId) {
    return true;
  }

  const memberSnapshot = await db
    .collection('workspaces')
    .doc(orgId)
    .collection('members')
    .doc(userId)
    .get();

  if (!memberSnapshot.exists) {
    return false;
  }

  const member = memberSnapshot.data() as WorkspaceMemberRecord | undefined;
  return (member?.status ?? 'active') === 'active';
}

export async function authenticateAgentKitApiKey(
  value: string | null | undefined,
): Promise<AgentKitApiKeyAuthenticationResult> {
  const parsed = parseAgentKitApiKey(value);
  if (!parsed) {
    return {
      ok: false,
      reason: 'invalid_format',
    };
  }

  const record = await getAgentKitApiKeyRecord(parsed.orgId, parsed.keyId);
  if (!record) {
    return {
      ok: false,
      reason: 'not_found',
    };
  }

  if (record.keyId !== parsed.keyId || record.orgId !== parsed.orgId) {
    return {
      ok: false,
      reason: 'token_mismatch',
    };
  }

  const expectedHash = Buffer.from(record.keyHash, 'utf8');
  const actualHash = Buffer.from(
    hashAgentKitApiKeySecret(parsed.secret),
    'utf8',
  );

  if (
    expectedHash.length !== actualHash.length ||
    !timingSafeEqual(expectedHash, actualHash)
  ) {
    return {
      ok: false,
      reason: 'hash_mismatch',
    };
  }

  if (record.revokedAt) {
    return {
      ok: false,
      reason: 'revoked',
    };
  }

  const stillHasAccess = await hasActiveWorkspaceAccess(
    record.orgId,
    record.createdByUserId,
  );
  if (!stillHasAccess) {
    return {
      ok: false,
      reason: 'workspace_access_revoked',
    };
  }

  return {
    ok: true,
    parsed,
    record,
  };
}

export async function revokeAgentKitApiKey(input: {
  orgId: string;
  keyId: string;
  revokedByUserId: string;
  revokedByEmail?: string | null;
  now?: Date;
}): Promise<AgentKitApiKeySummary | null> {
  const record = await getAgentKitApiKeyRecord(input.orgId, input.keyId);
  if (!record) {
    return null;
  }

  const now = (input.now ?? new Date()).toISOString();
  const nextRecord: AgentKitApiKeyRecord = {
    ...record,
    revokedAt: now,
    revokedByUserId: input.revokedByUserId,
    revokedByEmail: normalizeOptionalText(input.revokedByEmail),
  };

  await keyCollection(input.orgId).doc(input.keyId).set(nextRecord, {
    merge: false,
  });

  return toSummary(nextRecord);
}

export async function touchAgentKitApiKeyUsage(input: {
  orgId: string;
  keyId: string;
  lastSubmittedUseCaseId?: string | null;
  now?: Date;
}): Promise<void> {
  const patch: {
    lastUsedAt: string;
    lastSubmittedUseCaseId?: string | null;
  } = {
    lastUsedAt: (input.now ?? new Date()).toISOString(),
  };

  if ('lastSubmittedUseCaseId' in input) {
    patch.lastSubmittedUseCaseId =
      normalizeOptionalText(input.lastSubmittedUseCaseId) ?? null;
  }

  await keyCollection(input.orgId).doc(input.keyId).set(
    patch,
    { merge: true },
  );
}
