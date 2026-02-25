import * as admin from 'firebase-admin';

function cleanEnv(value?: string): string | undefined {
    if (!value) return undefined;
    return value.trim().replace(/^['"]|['"]$/g, '');
}

function normalizePrivateKey(value?: string): string | undefined {
    const cleaned = cleanEnv(value);
    if (!cleaned) return undefined;
    return cleaned.replace(/\\n/g, '\n');
}

if (!admin.apps.length) {
    const projectId =
        cleanEnv(process.env.FIREBASE_ADMIN_PROJECT_ID) ||
        cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) ||
        'ai-act-compass-m6o05';
    let initialized = false;

    // 1) Preferred: single JSON env var
    const serviceAccountJson = cleanEnv(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    if (serviceAccountJson) {
        try {
            const parsed = JSON.parse(serviceAccountJson) as {
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
                console.log('✅ Firebase Admin initialized with FIREBASE_SERVICE_ACCOUNT_KEY');
            }
        } catch (error) {
            console.error('❌ Invalid FIREBASE_SERVICE_ACCOUNT_KEY', error);
        }
    }

    // 2) Split env vars
    if (!initialized) {
        const clientEmail = cleanEnv(process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
        const privateKey = normalizePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY);

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
                console.log('✅ Firebase Admin initialized with split service-account vars');
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
            console.log('⚠️ Firebase Admin initialized with application default credentials');
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
