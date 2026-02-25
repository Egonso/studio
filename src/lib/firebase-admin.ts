import * as admin from 'firebase-admin';

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
    try {
        const decoded = Buffer.from(value, 'base64').toString('utf8');
        return decoded || undefined;
    } catch {
        return undefined;
    }
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

if (!admin.apps.length) {
    const projectIdConfig = firstEnv(PROJECT_ID_KEYS);
    const projectId = projectIdConfig?.value || 'ai-act-compass-m6o05';
    let initialized = false;

    // 1) Preferred: single JSON env var
    const serviceAccountConfig = firstEnv(SERVICE_ACCOUNT_JSON_KEYS);
    if (serviceAccountConfig) {
        try {
            const parsed = JSON.parse(serviceAccountConfig.value) as {
                project_id?: string;
                client_email?: string;
                private_key?: string;
            };
            const clientEmail = cleanEnv(parsed.client_email);
            const privateKey = normalizePrivateKey(parsed.private_key);
            const serviceProjectId = cleanEnv(parsed.project_id) || projectId;

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

    // 2) Split env vars
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

    // 3) Fallback (Cloud runtime / ADC)
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

    // 4) Last resort to prevent module-level crash; Firestore call will still fail
    if (!initialized) {
        admin.initializeApp({ projectId });
        console.warn('⚠️ Firebase Admin initialized without explicit credentials');
    }
}

export const db = admin.firestore();
export const auth = admin.auth();
