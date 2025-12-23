'use client';

import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

// Node.js 25 compatibility fix: provide a minimal localStorage mock if missing or incomplete on the server
if (typeof window === 'undefined') {
  if (typeof global !== 'undefined' && !global.localStorage) {
    (global as any).localStorage = {
      getItem: () => null,
      setItem: () => { },
      removeItem: () => { },
      clear: () => { },
      key: () => null,
      length: 0
    };
  }
}

const firebaseConfig = {
  "projectId": "ai-act-compass-m6o05",
  "appId": "1:516664005385:web:8a51acd112bc94dc4d39d8",
  "storageBucket": "ai-act-compass-m6o05.firebasestorage.app",
  "apiKey": "AIzaSyBH2zJUhiLEK3fPjTb-KltdYjEQGcT--yo",
  "authDomain": "ai-act-compass-m6o05.firebaseapp.com",
  "messagingSenderId": "516664005385"
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

// Lazy initialization function
async function initializeFirebase() {
  if (typeof window === 'undefined') {
    throw new Error('Firebase can only be initialized on the client side');
  }

  if (app && auth && db) {
    return { app, auth, db };
  }

  const { initializeApp, getApps, getApp } = await import('firebase/app');
  const { getAuth } = await import('firebase/auth');
  const { getFirestore } = await import('firebase/firestore');

  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  auth = getAuth(app);
  db = getFirestore(app);

  return { app, auth, db };
}

// Export lazy getters
export async function getFirebaseApp(): Promise<FirebaseApp> {
  const { app } = await initializeFirebase();
  return app!;
}

export async function getFirebaseAuth(): Promise<Auth> {
  const { auth } = await initializeFirebase();
  return auth!;
}

export async function getFirebaseDb(): Promise<Firestore> {
  const { db } = await initializeFirebase();
  return db!;
}

// For backwards compatibility - synchronous access (only works after initialization)
export { app, auth, db };
