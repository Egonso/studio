import '@/lib/server-only-guard';

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

import { buildPublicAppUrl } from '@/lib/app-url';

const ENCRYPTION_VERSION = 'v1';
const OPT_OUT_TOKEN_TTL_MS = 120 * 24 * 60 * 60 * 1000;

function getCurrentSecret(): string {
  const secret = process.env.SUPPLIER_SESSION_SECRET?.trim();
  if (!secret) {
    throw new Error(
      'SUPPLIER_SESSION_SECRET is not configured. Cannot manage supplier delivery data.',
    );
  }
  return secret;
}

function getPreviousSecret(): string | null {
  return process.env.SUPPLIER_SESSION_SECRET_PREVIOUS?.trim() || null;
}

function deriveKey(secret: string): Buffer {
  return createHash('sha256').update(secret, 'utf8').digest();
}

function signPayload(payloadB64: string, secret: string): string {
  return createHmac('sha256', secret).update(payloadB64).digest('base64url');
}

export function encryptSupplierInviteAccessUrl(publicUrl: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveKey(getCurrentSecret()), iv);
  const encrypted = Buffer.concat([
    cipher.update(publicUrl, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    ENCRYPTION_VERSION,
    iv.toString('base64url'),
    encrypted.toString('base64url'),
    tag.toString('base64url'),
  ].join('.');
}

export function tryEncryptSupplierInviteAccessUrl(
  publicUrl: string,
): string | null {
  try {
    return encryptSupplierInviteAccessUrl(publicUrl);
  } catch (error) {
    console.warn(
      'Supplier invite access URL encryption skipped:',
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

function decryptWithSecret(ciphertext: string, secret: string): string | null {
  const [version, ivB64, dataB64, tagB64] = ciphertext.split('.');
  if (
    version !== ENCRYPTION_VERSION ||
    !ivB64 ||
    !dataB64 ||
    !tagB64
  ) {
    return null;
  }

  try {
    const decipher = createDecipheriv(
      'aes-256-gcm',
      deriveKey(secret),
      Buffer.from(ivB64, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64url')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch {
    return null;
  }
}

export function decryptSupplierInviteAccessUrl(
  ciphertext: string | null | undefined,
): string | null {
  if (!ciphertext) {
    return null;
  }

  const current = decryptWithSecret(ciphertext, getCurrentSecret());
  if (current) {
    return current;
  }

  const previousSecret = getPreviousSecret();
  if (!previousSecret) {
    return null;
  }

  return decryptWithSecret(ciphertext, previousSecret);
}

export function createSupplierReminderOptOutToken(
  inviteId: string,
  expiresAt: Date = new Date(Date.now() + OPT_OUT_TOKEN_TTL_MS),
): string {
  const payloadB64 = Buffer.from(
    JSON.stringify({
      inviteId,
      exp: expiresAt.getTime(),
    }),
  ).toString('base64url');

  return `${payloadB64}.${signPayload(payloadB64, getCurrentSecret())}`;
}

export type SupplierReminderOptOutValidationError =
  | 'missing'
  | 'malformed'
  | 'invalid_signature'
  | 'expired'
  | 'invite_mismatch';

export function validateSupplierReminderOptOutToken(
  token: string | null | undefined,
  expectedInviteId: string,
):
  | { valid: true }
  | { valid: false; reason: SupplierReminderOptOutValidationError } {
  if (!token) {
    return { valid: false, reason: 'missing' };
  }

  const dotIndex = token.lastIndexOf('.');
  if (dotIndex === -1) {
    return { valid: false, reason: 'malformed' };
  }

  const payloadB64 = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);
  if (!payloadB64 || !signature) {
    return { valid: false, reason: 'malformed' };
  }

  const currentExpected = Buffer.from(
    signPayload(payloadB64, getCurrentSecret()),
    'utf8',
  );
  const actualSignature = Buffer.from(signature, 'utf8');

  let signatureValid =
    currentExpected.length === actualSignature.length &&
    timingSafeEqual(currentExpected, actualSignature);

  if (!signatureValid) {
    const previousSecret = getPreviousSecret();
    if (previousSecret) {
      const previousExpected = Buffer.from(
        signPayload(payloadB64, previousSecret),
        'utf8',
      );
      signatureValid =
        previousExpected.length === actualSignature.length &&
        timingSafeEqual(previousExpected, actualSignature);
    }
  }

  if (!signatureValid) {
    return { valid: false, reason: 'invalid_signature' };
  }

  try {
    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8'),
    ) as { inviteId?: string; exp?: number };

    if (payload.inviteId !== expectedInviteId) {
      return { valid: false, reason: 'invite_mismatch' };
    }

    if (
      typeof payload.exp !== 'number' ||
      !Number.isFinite(payload.exp) ||
      payload.exp <= Date.now()
    ) {
      return { valid: false, reason: 'expired' };
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: 'malformed' };
  }
}

export function buildSupplierReminderOptOutUrl(
  inviteId: string,
  token: string,
): string {
  return buildPublicAppUrl(
    `/api/supplier-invite/${encodeURIComponent(inviteId)}/opt-out?token=${encodeURIComponent(token)}`,
  );
}
