import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import { buildPublicAppUrl } from "@/lib/app-url";

import { parseSupplierRequestTokenRecord } from "./schema";
import type { SupplierRequestTokenRecord } from "./types";

const TOKEN_PREFIX = "reqv1";
const DEFAULT_EXPIRY_DAYS = 7;

export interface IssueSupplierRequestTokenInput {
  registerId: string;
  ownerId: string;
  createdBy: string;
  createdByEmail?: string | null;
  now?: Date;
  expiresInDays?: number;
}

export interface IssuedSupplierRequestToken {
  token: string;
  tokenId: string;
  record: SupplierRequestTokenRecord;
  publicUrl: string;
}

export interface ParsedSupplierRequestToken {
  tokenId: string;
  secret: string;
}

export type SupplierRequestTokenValidationReason =
  | "invalid_format"
  | "token_mismatch"
  | "hash_mismatch"
  | "revoked"
  | "expired";

export function createSupplierRequestTokenId(): string {
  return `srt_${randomBytes(12).toString("hex")}`;
}

export function createSupplierRequestTokenSecret(): string {
  return randomBytes(24).toString("base64url");
}

export function hashSupplierRequestTokenSecret(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

export function parseSupplierRequestToken(
  token: string | null | undefined
): ParsedSupplierRequestToken | null {
  if (!token) return null;
  const trimmed = token.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(".");
  if (parts.length !== 3) return null;
  if (parts[0] !== TOKEN_PREFIX) return null;
  if (!parts[1] || !parts[2]) return null;

  return {
    tokenId: parts[1],
    secret: parts[2],
  };
}

export function buildSupplierRequestTokenPath(token: string): string {
  return `/request/${encodeURIComponent(token)}`;
}

export function issueSupplierRequestToken(
  input: IssueSupplierRequestTokenInput
): IssuedSupplierRequestToken {
  const now = input.now ?? new Date();
  const tokenId = createSupplierRequestTokenId();
  const secret = createSupplierRequestTokenSecret();
  const token = `${TOKEN_PREFIX}.${tokenId}.${secret}`;
  const expiresAt = new Date(now);
  expiresAt.setDate(
    expiresAt.getDate() + Math.max(1, input.expiresInDays ?? DEFAULT_EXPIRY_DAYS)
  );

  const record = parseSupplierRequestTokenRecord({
    tokenId,
    registerId: input.registerId,
    ownerId: input.ownerId,
    tokenHash: hashSupplierRequestTokenSecret(secret),
    createdAt: now.toISOString(),
    createdBy: input.createdBy,
    createdByEmail: input.createdByEmail ?? null,
    expiresAt: expiresAt.toISOString(),
    revokedAt: null,
    revokedBy: null,
    revokedByEmail: null,
    revocationReason: null,
    lastUsedAt: null,
    firstUsedAt: null,
    lastUsedIpHash: null,
    submissionCount: 0,
    maxSubmissions: null,
  });

  return {
    token,
    tokenId,
    record,
    publicUrl: buildPublicAppUrl(buildSupplierRequestTokenPath(token)),
  };
}

export function verifySupplierRequestToken(
  token: string,
  record: SupplierRequestTokenRecord,
  now: Date = new Date()
): { valid: true; parsed: ParsedSupplierRequestToken } | {
  valid: false;
  reason: SupplierRequestTokenValidationReason;
} {
  const parsed = parseSupplierRequestToken(token);
  if (!parsed) {
    return { valid: false, reason: "invalid_format" };
  }

  if (parsed.tokenId !== record.tokenId) {
    return { valid: false, reason: "token_mismatch" };
  }

  const expectedHash = Buffer.from(record.tokenHash, "utf8");
  const actualHash = Buffer.from(
    hashSupplierRequestTokenSecret(parsed.secret),
    "utf8"
  );
  if (
    expectedHash.length !== actualHash.length ||
    !timingSafeEqual(expectedHash, actualHash)
  ) {
    return { valid: false, reason: "hash_mismatch" };
  }

  if (record.revokedAt) {
    return { valid: false, reason: "revoked" };
  }

  if (new Date(record.expiresAt) <= now) {
    return { valid: false, reason: "expired" };
  }

  return {
    valid: true,
    parsed,
  };
}
