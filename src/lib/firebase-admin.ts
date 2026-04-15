import '@/lib/server-only-guard';

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
import {
  PROJECT_ID_KEYS,
  SERVICE_ACCOUNT_JSON_KEYS,
  SERVICE_ACCOUNT_FILE_KEYS,
  CLIENT_EMAIL_KEYS,
  PRIVATE_KEY_KEYS,
  cleanEnv,
  firstEnv,
  parseServiceAccountJson,
  getErrorMessage,
  validatePrivateKey,
} from '@/lib/firebase-admin-credentials';

function maskSecret(value: string): string {
  if (value.length <= 8) return '********';
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

function hasAnyEnv(keys: readonly string[]): boolean {
  return keys.some((key) => Boolean(cleanEnv(process.env[key])));
}

type FirebaseAdminWarningStore = {
  seen: Set<string>;
};

function getWarningStore(): FirebaseAdminWarningStore {
  const globalKey = '__kiregisterFirebaseAdminWarnings';
  const globalState = globalThis as typeof globalThis & {
    [globalKey]?: FirebaseAdminWarningStore;
  };

  if (!globalState[globalKey]) {
    globalState[globalKey] = {
      seen: new Set<string>(),
    };
  }

  return globalState[globalKey];
}

function warnOnce(key: string, message: string): void {
  const store = getWarningStore();
  if (store.seen.has(key)) {
    return;
  }

  store.seen.add(key);
  console.warn(message);
}

function logCredentialResolutionHints(
  projectId: string,
  rejectedCredentials: string[] = [],
): void {
  const jsonPresent = hasAnyEnv(SERVICE_ACCOUNT_JSON_KEYS);
  const splitPresent = hasAnyEnv(CLIENT_EMAIL_KEYS) || hasAnyEnv(PRIVATE_KEY_KEYS);
  const filePresent = hasAnyEnv(SERVICE_ACCOUNT_FILE_KEYS);
  const rejectedSummary =
    rejectedCredentials.length > 0
      ? ` rejected=${rejectedCredentials.slice(0, 2).join(' | ')}${
          rejectedCredentials.length > 2
            ? ` (+${rejectedCredentials.length - 2} more)`
            : ''
        }`
      : '';
  warnOnce(
    `fallback-credentials:${projectId}:${rejectedCredentials.join('|')}`,
    `⚠️ Firebase Admin fallback credentials in use (project: ${projectId}). ` +
      `jsonEnv=${jsonPresent} splitEnv=${splitPresent} fileEnv=${filePresent}${rejectedSummary}`,
  );

  if (jsonPresent) {
    const selected = firstEnv(SERVICE_ACCOUNT_JSON_KEYS);
    if (selected) {
      warnOnce(
        `fallback-json-candidate:${selected.key}`,
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
    warnOnce(
      `init-failed:${label}:${getErrorMessage(error)}`,
      `⚠️ Firebase Admin ${label} init skipped: ${getErrorMessage(error)}`,
    );
    return null;
  }
}

function initializeFirebaseAdminApp(): App {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return getApp();
  }

  const projectId = resolveProjectId();
  const rejectedCredentials: string[] = [];
  const noteRejectedCredential = (label: string, reason: string): void => {
    rejectedCredentials.push(`${label}: ${reason}`);
  };

  const serviceAccountConfig = firstEnv(SERVICE_ACCOUNT_JSON_KEYS);
  if (serviceAccountConfig) {
    const parsed = parseServiceAccountJson(serviceAccountConfig.value);
    if (!parsed) {
      noteRejectedCredential(
        serviceAccountConfig.key,
        'payload could not be parsed as service account JSON',
      );
    } else {
      const clientEmail = cleanEnv(parsed.client_email ?? parsed.clientEmail);
      const serviceProjectId =
        cleanEnv(parsed.project_id ?? parsed.projectId) || projectId;

      if (!clientEmail) {
        noteRejectedCredential(serviceAccountConfig.key, 'missing client email');
      } else {
        const privateKeyResult = validatePrivateKey(
          parsed.private_key ?? parsed.privateKey,
        );
        if (!privateKeyResult.ok) {
          noteRejectedCredential(
            serviceAccountConfig.key,
            `invalid private key (${privateKeyResult.error})`,
          );
        } else {
          const app = tryInitialize(
            `service account JSON (${serviceAccountConfig.key})`,
            () => ({
              credential: cert({
                projectId: serviceProjectId,
                clientEmail,
                privateKey: privateKeyResult.privateKey,
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
      const serviceProjectId =
        cleanEnv(parsed.project_id ?? parsed.projectId) || projectId;

      if (!clientEmail) {
        noteRejectedCredential(
          `${serviceAccountFileConfig.key} file`,
          'missing client email',
        );
      } else {
        const privateKeyResult = validatePrivateKey(
          parsed.private_key ?? parsed.privateKey,
        );
        if (!privateKeyResult.ok) {
          noteRejectedCredential(
            `${serviceAccountFileConfig.key} file`,
            `invalid private key (${privateKeyResult.error})`,
          );
        } else {
          const app = tryInitialize(
            `service account file (${serviceAccountFileConfig.key})`,
            () => ({
              credential: cert({
                projectId: serviceProjectId,
                clientEmail,
                privateKey: privateKeyResult.privateKey,
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
      }
    } catch (error) {
      noteRejectedCredential(
        `${serviceAccountFileConfig.key} file`,
        getErrorMessage(error),
      );
    }
  }

  const clientEmailConfig = firstEnv(CLIENT_EMAIL_KEYS);
  const privateKeyConfig = firstEnv(PRIVATE_KEY_KEYS);
  const clientEmail = cleanEnv(clientEmailConfig?.value);
  if (clientEmailConfig || privateKeyConfig) {
    if (!clientEmail) {
      noteRejectedCredential('split service account vars', 'missing client email');
    } else {
      const privateKeyResult = validatePrivateKey(privateKeyConfig?.value);
      if (!privateKeyResult.ok) {
        noteRejectedCredential(
          'split service account vars',
          `invalid private key (${privateKeyResult.error})`,
        );
      } else {
        const app = tryInitialize(
          'split service account vars',
          () => ({
            credential: cert({
              projectId,
              clientEmail,
              privateKey: privateKeyResult.privateKey,
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
        logCredentialResolutionHints(projectId, rejectedCredentials);
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
      logCredentialResolutionHints(projectId, rejectedCredentials);
      warnOnce(
        `project-only-fallback:${projectId}:${rejectedCredentials.join('|')}`,
        rejectedCredentials.length > 0
          ? '⚠️ Firebase Admin initialized without usable explicit credentials'
          : '⚠️ Firebase Admin initialized without explicit credentials',
      );
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
