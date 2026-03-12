'use client';

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'ai-act-compass-m6o05',
  appId: '1:516664005385:web:8a51acd112bc94dc4d39d8',
  storageBucket: 'ai-act-compass-m6o05.firebasestorage.app',
  apiKey: 'AIzaSyBH2zJUhiLEK3fPjTb-KltdYjEQGcT--yo',
  authDomain: 'ai-act-compass-m6o05.firebaseapp.com',
  messagingSenderId: '516664005385',
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let initPromise:
  | Promise<{ app: FirebaseApp; auth: Auth; db: Firestore }>
  | null = null;

async function initializeFirebase() {
  if (typeof window === 'undefined') {
    throw new Error('Firebase can only be initialized on the client side');
  }

  if (app && auth && db) {
    return { app, auth, db };
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = Promise.resolve().then(() => {
    if (app && auth && db) {
      return { app, auth, db };
    }

    const resolvedApp =
      getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const resolvedAuth = getAuth(resolvedApp);
    const resolvedDb = getFirestore(resolvedApp);

    app = resolvedApp;
    auth = resolvedAuth;
    db = resolvedDb;

    return {
      app: resolvedApp,
      auth: resolvedAuth,
      db: resolvedDb,
    };
  });

  return initPromise;
}

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

export { app, auth, db };
