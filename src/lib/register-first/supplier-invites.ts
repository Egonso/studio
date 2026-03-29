import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

import { db } from '@/lib/firebase-admin';
import { buildPublicAppUrl } from '@/lib/app-url';

import { parseSupplierInviteRecord } from './supplier-invite-schema';
import type {
  SupplierInviteRecord,
  SupplierInviteStatus,
} from './supplier-invite-types';
import type { Register } from './types';

// ── Constants ───────────────────────────────────────────────────────────────

const INVITE_PREFIX = 'sinv1';
const INVITE_COLLECTION = 'registerSupplierInvites';
const DEFAULT_EXPIRY_DAYS = 14;
const DEFAULT_MAX_SUBMISSIONS = 1;

// ── Token Helpers ───────────────────────────────────────��───────────────────

export function createSupplierInviteId(): string {
  return `sinv_${randomBytes(12).toString('hex')}`;
}

function createInviteSecret(): string {
  return randomBytes(24).toString('base64url');
}

function hashInviteSecret(secret: string): string {
  return createHash('sha256').update(secret, 'utf8').digest('hex');
}

export function parseSupplierInviteToken(
  token: string | null | undefined
): { inviteId: string; secret: string } | null {
  if (!token) return null;
  const parts = token.trim().split('.');
  if (parts.length !== 3) return null;
  if (parts[0] !== INVITE_PREFIX) return null;
  if (!parts[1] || !parts[2]) return null;
  return { inviteId: parts[1], secret: parts[2] };
}

function buildInviteToken(inviteId: string, secret: string): string {
  return `${INVITE_PREFIX}.${inviteId}.${secret}`;
}

function buildInvitePublicUrl(token: string): string {
  return buildPublicAppUrl(`/request/${encodeURIComponent(token)}`);
}

// ── Issue Invite ────────────────────────────────────────────────────────────

export interface IssueSupplierInviteInput {
  registerId: string;
  ownerId: string;
  createdBy: string;
  createdByEmail?: string | null;
  intendedEmail: string;
  supplierOrganisationHint?: string | null;
  expiresInDays?: number;
  maxSubmissions?: number;
  now?: Date;
}

export interface IssuedSupplierInvite {
  token: string;
  inviteId: string;
  record: SupplierInviteRecord;
  publicUrl: string;
}

export function issueSupplierInvite(
  input: IssueSupplierInviteInput
): IssuedSupplierInvite {
  const now = input.now ?? new Date();
  const inviteId = createSupplierInviteId();
  const secret = createInviteSecret();
  const token = buildInviteToken(inviteId, secret);
  const expiresAt = new Date(now);
  expiresAt.setDate(
    expiresAt.getDate() + Math.max(1, input.expiresInDays ?? DEFAULT_EXPIRY_DAYS)
  );

  const emailLower = input.intendedEmail.trim().toLowerCase();
  const domain = emailLower.split('@')[1] ?? '';

  const record = parseSupplierInviteRecord({
    inviteId,
    registerId: input.registerId,
    ownerId: input.ownerId,
    secretHash: hashInviteSecret(secret),
    status: 'active',
    intendedEmail: emailLower,
    intendedDomain: domain,
    supplierOrganisationHint: input.supplierOrganisationHint ?? null,
    senderPolicy: 'exact_email',
    verificationMode: 'email_otp',
    maxSubmissions: input.maxSubmissions ?? DEFAULT_MAX_SUBMISSIONS,
    submissionCount: 0,
    createdAt: now.toISOString(),
    createdBy: input.createdBy,
    createdByEmail: input.createdByEmail ?? null,
    expiresAt: expiresAt.toISOString(),
    revokedAt: null,
    revokedBy: null,
    firstUsedAt: null,
    lastUsedAt: null,
    lastUsedIpHash: null,
    deliveryFailed: false,
    riskFlags: [],
    reissueTargetEmail: null,
    reassignedFromEmail: null,
    reissuedAt: null,
  });

  return {
    token,
    inviteId,
    record,
    publicUrl: buildInvitePublicUrl(token),
  };
}

// ── Verify Invite Token ─────────────────────────────────────────────────────

export type SupplierInviteValidationReason =
  | 'invalid_format'
  | 'not_found'
  | 'hash_mismatch'
  | 'revoked'
  | 'expired'
  | 'already_submitted';

export function verifySupplierInviteSecret(
  secret: string,
  record: SupplierInviteRecord,
  now: Date = new Date()
): { valid: true } | { valid: false; reason: SupplierInviteValidationReason } {
  const expectedHash = Buffer.from(record.secretHash, 'utf8');
  const actualHash = Buffer.from(hashInviteSecret(secret), 'utf8');
  if (
    expectedHash.length !== actualHash.length ||
    !timingSafeEqual(expectedHash, actualHash)
  ) {
    return { valid: false, reason: 'hash_mismatch' };
  }

  if (record.revokedAt) {
    return { valid: false, reason: 'revoked' };
  }

  if (new Date(record.expiresAt) <= now) {
    return { valid: false, reason: 'expired' };
  }

  if (record.status === 'submitted' && record.submissionCount >= record.maxSubmissions) {
    return { valid: false, reason: 'already_submitted' };
  }

  return { valid: true };
}

// ── Resolve Invite Access ───────────────────────────────────────────────────

export type SupplierInviteAccessFailureReason =
  | 'invalid'
  | 'revoked'
  | 'expired'
  | 'already_submitted'
  | 'register_not_found';

export interface SupplierInviteAccessResult {
  invite: SupplierInviteRecord;
  register: Register;
}

export async function resolveSupplierInviteAccess(
  rawToken: string
): Promise<
  | { ok: true; value: SupplierInviteAccessResult }
  | { ok: false; reason: SupplierInviteAccessFailureReason }
> {
  const parsed = parseSupplierInviteToken(rawToken);
  if (!parsed) {
    return { ok: false, reason: 'invalid' };
  }

  const doc = await db.collection(INVITE_COLLECTION).doc(parsed.inviteId).get();
  if (!doc.exists) {
    return { ok: false, reason: 'invalid' };
  }

  const invite = parseSupplierInviteRecord(doc.data());
  const validation = verifySupplierInviteSecret(parsed.secret, invite);
  if (!validation.valid) {
    const reason: SupplierInviteAccessFailureReason =
      validation.reason === 'expired' ? 'expired'
      : validation.reason === 'revoked' ? 'revoked'
      : validation.reason === 'already_submitted' ? 'already_submitted'
      : 'invalid';
    return { ok: false, reason };
  }

  const registerDoc = await db
    .doc(`users/${invite.ownerId}/registers/${invite.registerId}`)
    .get();
  if (!registerDoc.exists || registerDoc.data()?.isDeleted === true) {
    return { ok: false, reason: 'register_not_found' };
  }

  return {
    ok: true,
    value: {
      invite,
      register: registerDoc.data() as Register,
    },
  };
}

// ── Status Transitions ──────────────────────────────────────────────────────

export async function updateSupplierInviteStatus(
  inviteId: string,
  status: SupplierInviteStatus,
  extra?: Record<string, unknown>
): Promise<void> {
  await db.collection(INVITE_COLLECTION).doc(inviteId).update({
    status,
    ...extra,
  });
}

export async function revokeSupplierInvite(
  inviteId: string,
  revokedBy: string
): Promise<void> {
  await updateSupplierInviteStatus(inviteId, 'revoked', {
    revokedAt: new Date().toISOString(),
    revokedBy,
  });
}

// ── Revoke Active Invites for Register ──────────────────────────────────────

export async function revokeActiveInvitesForRegister(input: {
  ownerId: string;
  registerId: string;
  revokedBy: string;
}): Promise<number> {
  const snapshot = await db
    .collection(INVITE_COLLECTION)
    .where('registerId', '==', input.registerId)
    .where('ownerId', '==', input.ownerId)
    .get();

  const activeDocs = snapshot.docs.filter((doc) => {
    const data = doc.data();
    return data.status === 'active' || data.status === 'verified';
  });

  if (activeDocs.length === 0) return 0;

  const now = new Date().toISOString();
  const batch = db.batch();
  for (const doc of activeDocs) {
    batch.update(doc.ref, {
      status: 'revoked',
      revokedAt: now,
      revokedBy: input.revokedBy,
    });
  }
  await batch.commit();
  return activeDocs.length;
}

// ── Persist Invite ──────────────────────────────────────────────────────────

export async function persistSupplierInvite(
  record: SupplierInviteRecord
): Promise<void> {
  await db.collection(INVITE_COLLECTION).doc(record.inviteId).set(record);
}
