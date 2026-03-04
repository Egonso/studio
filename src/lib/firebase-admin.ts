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
    'FIREBASE_ADMIN_SERVICE_ACCOUNT',
    'GOOGLE_APPLICATION_CREDENTIALS_JSON',
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

    try {
        return JSON.parse(cleaned);
    } catch {
        const decoded = decodeBase64(cleaned);
        if (!decoded) return null;
        try {
            return JSON.parse(decoded);
        } catch {
            return null;
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
                throw new Error('Invalid JSON or base64 JSON payload');
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
            console.log(
                `⚠️ Firebase Admin initialized with application default credentials (project: ${projectId})`
            );
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
