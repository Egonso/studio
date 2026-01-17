import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ai-act-compass-m6o05',
        });
    } catch (error) {
        console.log('Firebase admin initialization error', error);
    }
}

export const db = admin.firestore();
export const auth = admin.auth();
