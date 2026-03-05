import * as admin from 'firebase-admin';
import { readFileSync } from 'node:fs';

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

function cleanEnv(value?: string): string | undefined {
    if (!value) return undefined;
    return value.trim().replace(/^['"]|['"]$/g, '');
}

function firstEnv(keys: readonly string[]): { key: string; value: string } | null {
    for (const key of keys) {
        const value = cleanEnv(process.env[key]);
        if (value) return { key, value };
    }
    return null;
}

function decodeBase64(value: string): string | undefined {
    const candidates = [value];

    // Also try URL-safe base64 variant with normalized alphabet/padding.
    const urlSafe = value.replace(/-/g, '+').replace(/_/g, '/');
    if (urlSafe !== value) candidates.push(urlSafe);

    for (const candidate of candidates) {
        const padLength = candidate.length % 4 === 0 ? 0 : 4 - (candidate.length % 4);
        const padded = candidate + '='.repeat(padLength);
        try {
            const decoded = Buffer.from(padded, 'base64').toString('utf8');
            if (decoded) return decoded;
        } catch {
            // continue
        }
    }

    return undefined;
}

function normalizePrivateKey(value?: string): string | undefined {
    const cleaned = cleanEnv(value);
    if (!cleaned) return undefined;

    const normalized = cleaned.replace(/\\n/g, '\n');
    if (normalized.includes('BEGIN PRIVATE KEY')) return normalized;

    const maybeDecoded = decodeBase64(normalized);
    if (maybeDecoded && maybeDecoded.includes('BEGIN PRIVATE KEY')) {
        return maybeDecoded;
    }

    return normalized;
}

function parseServiceAccountJson(raw: string): {
    project_id?: string;
    projectId?: string;
    client_email?: string;
    clientEmail?: string;
    private_key?: string;
    privateKey?: string;
} | null {
    const cleaned = cleanEnv(raw);
    if (!cleaned) return null;

    function parseCandidate(candidate: string): {
        project_id?: string;
        projectId?: string;
        client_email?: string;
        clientEmail?: string;
        private_key?: string;
        privateKey?: string;
    } | null {
        try {
            const parsed = JSON.parse(candidate) as unknown;
            if (parsed && typeof parsed === 'object') {
                return parsed as {
                    project_id?: string;
                    projectId?: string;
                    client_email?: string;
                    clientEmail?: string;
                    private_key?: string;
                    privateKey?: string;
                };
            }
            if (typeof parsed === 'string') {
                const nested = JSON.parse(parsed) as unknown;
                if (nested && typeof nested === 'object') {
                    return nested as {
                        project_id?: string;
                        projectId?: string;
                        client_email?: string;
                        clientEmail?: string;
                        private_key?: string;
                        privateKey?: string;
                    };
                }
            }
        } catch {
            // Continue with next candidate.
        }
        return null;
    }

    const candidates: string[] = [];
    candidates.push(cleaned);

    const decoded = decodeBase64(cleaned);
    if (decoded) candidates.push(decoded);

    // Common escaped payload shape in hosting UIs: {\"type\":\"service_account\",...}
    const quoteUnescaped = cleaned.replace(/\\"/g, '"');
    if (quoteUnescaped !== cleaned) candidates.push(quoteUnescaped);

    // Sometimes JSON strings are serialized twice.
    const maybeQuoted = cleaned.replace(/^"+|"+$/g, '');
    if (maybeQuoted && maybeQuoted !== cleaned) candidates.push(maybeQuoted);

    for (const candidate of candidates) {
        const parsed = parseCandidate(candidate);
        if (parsed) return parsed;
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
        `jsonEnv=${jsonPresent} splitEnv=${splitPresent} fileEnv=${filePresent}`
    );
    if (jsonPresent) {
        const selected = firstEnv(SERVICE_ACCOUNT_JSON_KEYS);
        if (selected) {
            console.warn(
                `⚠️ Candidate JSON key detected: ${selected.key} (${maskSecret(selected.value)})`
            );
        }
    }
}

if (!admin.apps.length) {
    const projectIdConfig = firstEnv(PROJECT_ID_KEYS);
    const projectId = projectIdConfig?.value || 'ai-act-compass-m6o05';
    let initialized = false;

    // 1) Preferred: single JSON env var
    const serviceAccountConfig = firstEnv(SERVICE_ACCOUNT_JSON_KEYS);
    if (serviceAccountConfig) {
        try {
            const parsed = parseServiceAccountJson(serviceAccountConfig.value);
            if (!parsed) {
                throw new Error('Invalid JSON/base64/escaped JSON payload');
            }
            const clientEmail = cleanEnv(parsed.client_email ?? parsed.clientEmail);
            const privateKey = normalizePrivateKey(parsed.private_key ?? parsed.privateKey);
            const serviceProjectId = cleanEnv(parsed.project_id ?? parsed.projectId) || projectId;

            if (clientEmail && privateKey) {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: serviceProjectId,
                        clientEmail,
                        privateKey,
                    }),
                    projectId: serviceProjectId,
                });
                initialized = true;
                console.log(
                    `✅ Firebase Admin initialized via ${serviceAccountConfig.key} (project: ${serviceProjectId})`
                );
            }
        } catch (error) {
            console.error(`❌ Invalid ${serviceAccountConfig.key}`, error);
        }
    }

    // 2) Service account file path
    if (!initialized) {
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
                const serviceProjectId = cleanEnv(parsed.project_id ?? parsed.projectId) || projectId;

                if (clientEmail && privateKey) {
                    admin.initializeApp({
                        credential: admin.credential.cert({
                            projectId: serviceProjectId,
                            clientEmail,
                            privateKey,
                        }),
                        projectId: serviceProjectId,
                    });
                    initialized = true;
                    console.log(
                        `✅ Firebase Admin initialized via ${serviceAccountFileConfig.key} file (project: ${serviceProjectId})`
                    );
                }
            } catch (error) {
                console.error(`❌ Invalid ${serviceAccountFileConfig.key} file`, error);
            }
        }
    }

    // 3) Split env vars
    if (!initialized) {
        const clientEmailConfig = firstEnv(CLIENT_EMAIL_KEYS);
        const privateKeyConfig = firstEnv(PRIVATE_KEY_KEYS);
        const clientEmail = clientEmailConfig?.value;
        const privateKey = normalizePrivateKey(privateKeyConfig?.value);

        if (clientEmail && privateKey) {
            try {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId,
                        clientEmail,
                        privateKey,
                    }),
                    projectId,
                });
                initialized = true;
                console.log(
                    `✅ Firebase Admin initialized with split vars (${clientEmailConfig?.key}, ${privateKeyConfig?.key}) for project ${projectId}`
                );
            } catch (error) {
                console.error('❌ Invalid split Firebase Admin credentials', error);
            }
        }
    }

    // 4) Fallback (Cloud runtime / ADC)
    if (!initialized) {
        try {
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                projectId,
            });
            initialized = true;
            logCredentialResolutionHints(projectId);
        } catch (error) {
            console.error('❌ Firebase Admin applicationDefault init failed', error);
        }
    }

    // 5) Last resort to prevent module-level crash; Firestore call will still fail
    if (!initialized) {
        admin.initializeApp({ projectId });
        console.warn('⚠️ Firebase Admin initialized without explicit credentials');
    }
}

export const db = admin.firestore();
export const auth = admin.auth();
