import {
  createDecipheriv,
  createHash,
  createHmac,
} from 'node:crypto';

import {
  appPublicOriginParam,
  supplierSessionSecret,
} from './runtimeParams';

const DEFAULT_APP_ORIGIN = 'https://kiregister.com';
const ENCRYPTION_VERSION = 'v1';
const OPT_OUT_TOKEN_TTL_MS = 120 * 24 * 60 * 60 * 1000;

function parseTrimmed(value: string | undefined | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function safeSecretValue(): string | null {
  try {
    return parseTrimmed(supplierSessionSecret.value());
  } catch {
    return null;
  }
}

function safeAppOriginValue(): string | null {
  try {
    return normalizeOrigin(appPublicOriginParam.value());
  } catch {
    return null;
  }
}

function normalizeOrigin(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    parsed.pathname = '';
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function getPublicAppOrigin(): string {
  return (
    normalizeOrigin(process.env.NEXT_PUBLIC_APP_ORIGIN) ??
    normalizeOrigin(process.env.NEXT_PUBLIC_APP_BASE_URL) ??
    safeAppOriginValue() ??
    DEFAULT_APP_ORIGIN
  );
}

function getCurrentSecret(): string {
  const secret =
    parseTrimmed(process.env.SUPPLIER_SESSION_SECRET) ??
    safeSecretValue();
  if (!secret) {
    throw new Error(
      'SUPPLIER_SESSION_SECRET is not configured. Cannot manage supplier delivery data.',
    );
  }
  return secret;
}

function getPreviousSecret(): string | null {
  return parseTrimmed(process.env.SUPPLIER_SESSION_SECRET_PREVIOUS) ?? null;
}

function deriveKey(secret: string): Buffer {
  return createHash('sha256').update(secret, 'utf8').digest();
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

function signPayload(payloadB64: string, secret: string): string {
  return createHmac('sha256', secret).update(payloadB64).digest('base64url');
}

export function createSupplierReminderOptOutUrl(inviteId: string): string {
  const payloadB64 = Buffer.from(
    JSON.stringify({
      inviteId,
      exp: Date.now() + OPT_OUT_TOKEN_TTL_MS,
    }),
  ).toString('base64url');
  const signature = signPayload(payloadB64, getCurrentSecret());

  return new URL(
    `/api/supplier-invite/${encodeURIComponent(inviteId)}/opt-out?token=${encodeURIComponent(`${payloadB64}.${signature}`)}`,
    `${getPublicAppOrigin()}/`,
  ).toString();
}
