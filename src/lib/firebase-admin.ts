import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ai-act-compass-m6o05';
        const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

        if (clientEmail && privateKey) {
            // Use environment variables (production/development with service account)
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey: privateKey.replace(/\\n/g, '\n'), // Convert escaped newlines
                }),
                projectId,
            });
            console.log('✅ Firebase Admin initialized with service account');
        } else {
            // Fallback to application default credentials (for local emulator or Cloud Run)
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                projectId,
            });
            console.log('⚠️ Firebase Admin initialized with application default credentials');
        }
    } catch (error) {
        console.error('❌ Firebase admin initialization error', error);
    }
}

export const db = admin.firestore();
export const auth = admin.auth();
