import { createPrivateKey } from 'node:crypto';

export const PROJECT_ID_KEYS = [
  'FIREBASE_ADMIN_PROJECT_ID',
  'FIREBASE_PROJECT_ID',
  'GCLOUD_PROJECT',
  'GCP_PROJECT',
] as const;

export const SERVICE_ACCOUNT_JSON_KEYS = [
  'FIREBASE_SERVICE_ACCOUNT_KEY',
  'FIREBASE_SERVICE_ACCOUNT_JSON',
  'FIREBASE_SERVICE_ACCOUNT_KEY_BASE64',
  'FIREBASE_SERVICE_ACCOUNT_B64',
  'FIREBASE_ADMIN_SERVICE_ACCOUNT',
  'FIREBASE_ADMIN_SERVICE_ACCOUNT_B64',
  'GOOGLE_APPLICATION_CREDENTIALS_JSON',
  'GOOGLE_APPLICATION_CREDENTIALS_BASE64',
] as const;

export const SERVICE_ACCOUNT_FILE_KEYS = [
  'GOOGLE_APPLICATION_CREDENTIALS',
  'FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH',
] as const;

export const CLIENT_EMAIL_KEYS = [
  'FIREBASE_ADMIN_CLIENT_EMAIL',
  'FIREBASE_CLIENT_EMAIL',
  'GOOGLE_CLIENT_EMAIL',
] as const;

export const PRIVATE_KEY_KEYS = [
  'FIREBASE_ADMIN_PRIVATE_KEY',
  'FIREBASE_PRIVATE_KEY',
  'GOOGLE_PRIVATE_KEY',
] as const;

export type ParsedServiceAccount = {
  project_id?: string;
  projectId?: string;
  client_email?: string;
  clientEmail?: string;
  private_key?: string;
  privateKey?: string;
};

export type PrivateKeyValidationResult =
  | {
      ok: true;
      privateKey: string;
    }
  | {
      ok: false;
      error: string;
    };

export function cleanEnv(value?: string): string | undefined {
  if (!value) return undefined;
  return value.trim().replace(/^['"]|['"]$/g, '');
}

export function firstEnv(
  keys: readonly string[],
): { key: string; value: string } | null {
  for (const key of keys) {
    const value = cleanEnv(process.env[key]);
    if (value) {
      return { key, value };
    }
  }
  return null;
}

function decodeBase64(value: string): string | undefined {
  const candidates = [value];
  const urlSafe = value.replace(/-/g, '+').replace(/_/g, '/');
  if (urlSafe !== value) {
    candidates.push(urlSafe);
  }

  for (const candidate of candidates) {
    const padLength = candidate.length % 4 === 0 ? 0 : 4 - (candidate.length % 4);
    const padded = candidate + '='.repeat(padLength);
    try {
      const decoded = Buffer.from(padded, 'base64').toString('utf8');
      if (decoded) {
        return decoded;
      }
    } catch {
      // Continue trying alternative encodings.
    }
  }

  return undefined;
}

export function normalizePrivateKey(value?: string): string | undefined {
  const cleaned = cleanEnv(value);
  if (!cleaned) return undefined;

  const normalized = cleaned.replace(/\\n/g, '\n');

  const normalizePemBlock = (candidate: string): string | undefined => {
    const beginMarker = '-----BEGIN PRIVATE KEY-----';
    const endMarker = '-----END PRIVATE KEY-----';
    if (
      !candidate.includes(beginMarker) ||
      !candidate.includes(endMarker)
    ) {
      return undefined;
    }

    const body = candidate
      .replace(beginMarker, '')
      .replace(endMarker, '')
      .replace(/\s+/g, '');

    if (!body) {
      return undefined;
    }

    const wrappedBody = body.match(/.{1,64}/g)?.join('\n') ?? body;
    return `${beginMarker}\n${wrappedBody}\n${endMarker}\n`;
  };

  const normalizedPem = normalizePemBlock(normalized);
  if (normalizedPem) {
    return normalizedPem;
  }

  const maybeDecoded = decodeBase64(normalized);
  if (maybeDecoded) {
    const decodedPem = normalizePemBlock(maybeDecoded);
    if (decodedPem) {
      return decodedPem;
    }
  }

  return normalized;
}

export function parseServiceAccountJson(raw: string): ParsedServiceAccount | null {
  const cleaned = cleanEnv(raw);
  if (!cleaned) {
    return null;
  }

  function parseCandidate(candidate: string): ParsedServiceAccount | null {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (parsed && typeof parsed === 'object') {
        return parsed as ParsedServiceAccount;
      }
      if (typeof parsed === 'string') {
        const nested = JSON.parse(parsed) as unknown;
        if (nested && typeof nested === 'object') {
          return nested as ParsedServiceAccount;
        }
      }
    } catch {
      // Continue with the next candidate.
    }

    return null;
  }

  const candidates: string[] = [cleaned];
  const decoded = decodeBase64(cleaned);
  if (decoded) {
    candidates.push(decoded);
  }

  try {
    const decodedUri = decodeURIComponent(cleaned);
    if (decodedUri !== cleaned) {
      candidates.push(decodedUri);
    }
  } catch {
    // Ignore invalid URI encoding.
  }

  const quoteUnescaped = cleaned.replace(/\\"/g, '"');
  if (quoteUnescaped !== cleaned) {
    candidates.push(quoteUnescaped);
  }

  const maybeQuoted = cleaned.replace(/^"+|"+$/g, '');
  if (maybeQuoted && maybeQuoted !== cleaned) {
    candidates.push(maybeQuoted);
  }

  for (const candidate of candidates) {
    const parsed = parseCandidate(candidate);
    if (parsed) {
      return parsed;
    }
  }

  return null;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error);
}

export function validatePrivateKey(value?: string): PrivateKeyValidationResult {
  const privateKey = normalizePrivateKey(value);
  if (!privateKey) {
    return { ok: false, error: 'missing private key' };
  }

  try {
    createPrivateKey({ key: privateKey, format: 'pem' });
    return { ok: true, privateKey };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}
