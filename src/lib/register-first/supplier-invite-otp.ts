import { createHash, randomInt, timingSafeEqual } from 'node:crypto';

import { db } from '@/lib/firebase-admin';

// ── OTP Challenge for Supplier Invite V2 ────────────────────────────────────

const CHALLENGE_COLLECTION = 'supplierInviteChallenges';
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS_PER_CHALLENGE = 3;
const MAX_CHALLENGES_PER_DAY = 5;
const CHALLENGE_CLEANUP_TTL_MS = 24 * 60 * 60 * 1000; // 24h for TTL deletion

export interface SupplierInviteChallengeRecord {
  challengeId: string;
  inviteId: string;
  email: string;
  otpHash: string;
  createdAt: string;
  expiresAt: string;
  attemptCount: number;
  consumedAt: string | null;
  ipHash: string;
  ttlDeleteAt: string;
}

function generateChallengeId(): string {
  return `sotp_${Buffer.from(
    Array.from({ length: 12 }, () => randomInt(256))
  ).toString('hex')}`;
}

function generateOtp(): string {
  return String(randomInt(100000, 999999));
}

function hashOtp(otp: string): string {
  return createHash('sha256').update(otp, 'utf8').digest('hex');
}

export function verifyOtpHash(otp: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashOtp(otp), 'utf8');
  const expected = Buffer.from(expectedHash, 'utf8');
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

// ── Check Daily Limit ───────────────────────────────────────────────────────

export async function countTodayChallenges(inviteId: string): Promise<number> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const snapshot = await db
    .collection(CHALLENGE_COLLECTION)
    .where('inviteId', '==', inviteId)
    .where('createdAt', '>', oneDayAgo)
    .get();
  return snapshot.size;
}

// ── Create Challenge ────────────────────────────────────────────────────────

export interface CreateChallengeResult {
  challengeId: string;
  otp: string;
  expiresAt: string;
}

export async function createOtpChallenge(
  inviteId: string,
  email: string,
  ipHash: string
): Promise<CreateChallengeResult> {
  const now = new Date();
  const challengeId = generateChallengeId();
  const otp = generateOtp();

  const record: SupplierInviteChallengeRecord = {
    challengeId,
    inviteId,
    email,
    otpHash: hashOtp(otp),
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + OTP_TTL_MS).toISOString(),
    attemptCount: 0,
    consumedAt: null,
    ipHash,
    ttlDeleteAt: new Date(now.getTime() + CHALLENGE_CLEANUP_TTL_MS).toISOString(),
  };

  await db.collection(CHALLENGE_COLLECTION).doc(challengeId).set(record);

  return {
    challengeId,
    otp,
    expiresAt: record.expiresAt,
  };
}

// ── Verify Challenge ────────────────────────────────────────────────────────

export type VerifyChallengeFailure =
  | 'not_found'
  | 'expired'
  | 'consumed'
  | 'too_many_attempts'
  | 'wrong_otp';

export async function verifyOtpChallenge(
  challengeId: string,
  otp: string
): Promise<
  | { ok: true; challenge: SupplierInviteChallengeRecord }
  | { ok: false; reason: VerifyChallengeFailure }
> {
  const ref = db.collection(CHALLENGE_COLLECTION).doc(challengeId);

  // Use a transaction to safely increment attemptCount
  return db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    if (!doc.exists) {
      return { ok: false as const, reason: 'not_found' as const };
    }

    const challenge = doc.data() as SupplierInviteChallengeRecord;

    if (challenge.consumedAt) {
      return { ok: false as const, reason: 'consumed' as const };
    }

    if (new Date(challenge.expiresAt) <= new Date()) {
      return { ok: false as const, reason: 'expired' as const };
    }

    if (challenge.attemptCount >= MAX_ATTEMPTS_PER_CHALLENGE) {
      return { ok: false as const, reason: 'too_many_attempts' as const };
    }

    // Increment BEFORE comparison (prevent race conditions)
    tx.update(ref, { attemptCount: challenge.attemptCount + 1 });

    if (!verifyOtpHash(otp, challenge.otpHash)) {
      return { ok: false as const, reason: 'wrong_otp' as const };
    }

    // Mark as consumed
    const now = new Date().toISOString();
    tx.update(ref, { consumedAt: now });

    return {
      ok: true as const,
      challenge: { ...challenge, attemptCount: challenge.attemptCount + 1, consumedAt: now },
    };
  });
}

export { MAX_CHALLENGES_PER_DAY };
