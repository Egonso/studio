import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';

import {
  applicationDefault,
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
  type AppOptions,
} from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

const PROJECT_ID_KEYS = [
  'FIREBASE_ADMIN_PROJECT_ID',
  'FIREBASE_PROJECT_ID',
  'GCLOUD_PROJECT',
  'GCP_PROJECT',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
] as const;

const SERVICE_ACCOUNT_JSON_KEYS = [
  'FIREBASE_SERVICE_ACCOUNT_KEY',
  'FIREBASE_SERVICE_ACCOUNT_JSON',
  'FIREBASE_SERVICE_ACCOUNT_KEY_BASE64',
  'FIREBASE_SERVICE_ACCOUNT_B64',
  'FIREBASE_ADMIN_SERVICE_ACCOUNT',
  'FIREBASE_ADMIN_SERVICE_ACCOUNT_B64',
  'GOOGLE_APPLICATION_CREDENTIALS_JSON',
  'GOOGLE_APPLICATION_CREDENTIALS_BASE64',
] as const;

const SERVICE_ACCOUNT_FILE_KEYS = [
  'GOOGLE_APPLICATION_CREDENTIALS',
  'FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH',
] as const;

const CLIENT_EMAIL_KEYS = [
  'FIREBASE_ADMIN_CLIENT_EMAIL',
  'FIREBASE_CLIENT_EMAIL',
  'GOOGLE_CLIENT_EMAIL',
] as const;

const PRIVATE_KEY_KEYS = [
  'FIREBASE_ADMIN_PRIVATE_KEY',
  'FIREBASE_PRIVATE_KEY',
  'GOOGLE_PRIVATE_KEY',
] as const;

type ParsedServiceAccount = {
  project_id?: string;
  projectId?: string;
  client_email?: string;
  clientEmail?: string;
  private_key?: string;
  privateKey?: string;
};

function cleanEnv(value?: string): string | undefined {
  if (!value) return undefined;
  return value.trim().replace(/^['"]|['"]$/g, '');
}

function firstEnv(keys: readonly string[]): { key: string; value: string } | null {
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

function normalizePrivateKey(value?: string): string | undefined {
  const cleaned = cleanEnv(value);
  if (!cleaned) return undefined;

  const normalized = cleaned.replace(/\\n/g, '\n');
  if (normalized.includes('BEGIN PRIVATE KEY')) {
    return normalized;
  }

  const maybeDecoded = decodeBase64(normalized);
  if (maybeDecoded && maybeDecoded.includes('BEGIN PRIVATE KEY')) {
    return maybeDecoded;
  }

  return normalized;
}

function parseServiceAccountJson(raw: string): ParsedServiceAccount | null {
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

function maskSecret(value: string): string {
  if (value.length <= 8) return '********';
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

function hasAnyEnv(keys: readonly string[]): boolean {
  return keys.some((key) => Boolean(cleanEnv(process.env[key])));
}

function logCredentialResolutionHints(projectId: string): void {
  const jsonPresent = hasAnyEnv(SERVICE_ACCOUNT_JSON_KEYS);
  const splitPresent = hasAnyEnv(CLIENT_EMAIL_KEYS) || hasAnyEnv(PRIVATE_KEY_KEYS);
  const filePresent = hasAnyEnv(SERVICE_ACCOUNT_FILE_KEYS);
  console.warn(
    `⚠️ Firebase Admin fallback credentials in use (project: ${projectId}). ` +
      `jsonEnv=${jsonPresent} splitEnv=${splitPresent} fileEnv=${filePresent}`,
  );

  if (jsonPresent) {
    const selected = firstEnv(SERVICE_ACCOUNT_JSON_KEYS);
    if (selected) {
      console.warn(
        `⚠️ Candidate JSON key detected: ${selected.key} (${maskSecret(selected.value)})`,
      );
    }
  }
}

function hasServiceAccountJsonConfig(): boolean {
  return hasAnyEnv(SERVICE_ACCOUNT_JSON_KEYS);
}

function hasSplitServiceAccountConfig(): boolean {
  return hasAnyEnv(CLIENT_EMAIL_KEYS) && hasAnyEnv(PRIVATE_KEY_KEYS);
}

function hasServiceAccountFileConfig(): boolean {
  const configuredPath = firstEnv(SERVICE_ACCOUNT_FILE_KEYS)?.value;
  return Boolean(configuredPath && existsSync(configuredPath));
}

function hasLocalAdcFile(): boolean {
  return existsSync(`${homedir()}/.config/gcloud/application_default_credentials.json`);
}

function isCloudRuntime(): boolean {
  return Boolean(
    process.env.K_SERVICE ||
      process.env.FUNCTION_TARGET ||
      process.env.GAE_ENV ||
      process.env.FIREBASE_CONFIG,
  );
}

export function hasFirebaseAdminCredentials(): boolean {
  return (
    hasServiceAccountJsonConfig() ||
    hasSplitServiceAccountConfig() ||
    hasServiceAccountFileConfig() ||
    hasLocalAdcFile() ||
    isCloudRuntime()
  );
}

function resolveProjectId(): string {
  return firstEnv(PROJECT_ID_KEYS)?.value || 'ai-act-compass-m6o05';
}

function tryInitialize(
  label: string,
  optionsFactory: () => AppOptions,
  onSuccess?: () => void,
): App | null {
  try {
    const app = initializeApp(optionsFactory());
    onSuccess?.();
    return app;
  } catch (error) {
    console.error(`❌ Firebase Admin ${label} init failed`, error);
    return null;
  }
}

function initializeFirebaseAdminApp(): App {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return getApp();
  }

  const projectId = resolveProjectId();

  const serviceAccountConfig = firstEnv(SERVICE_ACCOUNT_JSON_KEYS);
  if (serviceAccountConfig) {
    const parsed = parseServiceAccountJson(serviceAccountConfig.value);
    if (!parsed) {
      console.error(
        `❌ Invalid ${serviceAccountConfig.key}: payload could not be parsed as service account JSON`,
      );
    } else {
      const clientEmail = cleanEnv(parsed.client_email ?? parsed.clientEmail);
      const privateKey = normalizePrivateKey(parsed.private_key ?? parsed.privateKey);
      const serviceProjectId =
        cleanEnv(parsed.project_id ?? parsed.projectId) || projectId;

      if (clientEmail && privateKey) {
        const app = tryInitialize(
          `service account JSON (${serviceAccountConfig.key})`,
          () => ({
            credential: cert({
              projectId: serviceProjectId,
              clientEmail,
              privateKey,
            }),
            projectId: serviceProjectId,
          }),
          () => {
            console.log(
              `✅ Firebase Admin initialized via ${serviceAccountConfig.key} (project: ${serviceProjectId})`,
            );
          },
        );
        if (app) {
          return app;
        }
      }
    }
  }

  const serviceAccountFileConfig = firstEnv(SERVICE_ACCOUNT_FILE_KEYS);
  if (serviceAccountFileConfig) {
    try {
      const fileContent = readFileSync(serviceAccountFileConfig.value, 'utf8');
      const parsed = parseServiceAccountJson(fileContent);
      if (!parsed) {
        throw new Error('Service account file is not valid JSON');
      }

      const clientEmail = cleanEnv(parsed.client_email ?? parsed.clientEmail);
      const privateKey = normalizePrivateKey(parsed.private_key ?? parsed.privateKey);
      const serviceProjectId =
        cleanEnv(parsed.project_id ?? parsed.projectId) || projectId;

      if (clientEmail && privateKey) {
        const app = tryInitialize(
          `service account file (${serviceAccountFileConfig.key})`,
          () => ({
            credential: cert({
              projectId: serviceProjectId,
              clientEmail,
              privateKey,
            }),
            projectId: serviceProjectId,
          }),
          () => {
            console.log(
              `✅ Firebase Admin initialized via ${serviceAccountFileConfig.key} file (project: ${serviceProjectId})`,
            );
          },
        );
        if (app) {
          return app;
        }
      }
    } catch (error) {
      console.error(`❌ Invalid ${serviceAccountFileConfig.key} file`, error);
    }
  }

  const clientEmailConfig = firstEnv(CLIENT_EMAIL_KEYS);
  const privateKeyConfig = firstEnv(PRIVATE_KEY_KEYS);
  const clientEmail = cleanEnv(clientEmailConfig?.value);
  const privateKey = normalizePrivateKey(privateKeyConfig?.value);
  if (clientEmail && privateKey) {
    const app = tryInitialize(
      'split service account vars',
      () => ({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      }),
      () => {
        console.log(
          `✅ Firebase Admin initialized with split vars (${clientEmailConfig?.key}, ${privateKeyConfig?.key}) for project ${projectId}`,
        );
      },
    );
    if (app) {
      return app;
    }
  }

  if (hasLocalAdcFile() || isCloudRuntime()) {
    const adcApp = tryInitialize(
      'applicationDefault',
      () => ({
        credential: applicationDefault(),
        projectId,
      }),
      () => {
        logCredentialResolutionHints(projectId);
      },
    );
    if (adcApp) {
      return adcApp;
    }
  }

  const fallbackApp = tryInitialize(
    'project-only fallback',
    () => ({ projectId }),
    () => {
      console.warn('⚠️ Firebase Admin initialized without explicit credentials');
    },
  );
  if (fallbackApp) {
    return fallbackApp;
  }

  throw new Error('Firebase Admin could not be initialized.');
}

export const adminApp = initializeFirebaseAdminApp();
export const db = getFirestore(adminApp);
export const auth = getAuth(adminApp);

export function getAdminApp(): App {
  return adminApp;
}

export function getAdminDb(): Firestore {
  return db;
}

export function getAdminAuth(): Auth {
  return auth;
}
