'use client';

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, type Auth, type User } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const FIREBASE_CLIENT_ENV = {
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
} as const;

function getRequiredClientEnv(
  key: keyof typeof FIREBASE_CLIENT_ENV,
  value: string | undefined
): string {
  if (!value) {
    throw new Error(`Missing required Firebase client environment variable: ${key}`);
  }
  return value;
}

function resolveFirebaseConfig() {
  return {
    projectId: getRequiredClientEnv(
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      FIREBASE_CLIENT_ENV.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    ),
    appId: getRequiredClientEnv(
      'NEXT_PUBLIC_FIREBASE_APP_ID',
      FIREBASE_CLIENT_ENV.NEXT_PUBLIC_FIREBASE_APP_ID
    ),
    storageBucket: getRequiredClientEnv(
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      FIREBASE_CLIENT_ENV.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    ),
    apiKey: getRequiredClientEnv(
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      FIREBASE_CLIENT_ENV.NEXT_PUBLIC_FIREBASE_API_KEY
    ),
    authDomain: getRequiredClientEnv(
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      FIREBASE_CLIENT_ENV.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    ),
    messagingSenderId: getRequiredClientEnv(
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      FIREBASE_CLIENT_ENV.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    ),
  };
}

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
      getApps().length === 0 ? initializeApp(resolveFirebaseConfig()) : getApp();
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

async function waitForFirebaseUser(
  auth: Auth,
  timeoutMs = 1500
): Promise<User | null> {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  if (typeof auth.authStateReady === 'function') {
    await auth.authStateReady();
  }

  if (auth.currentUser) {
    return auth.currentUser;
  }

  return await new Promise<User | null>((resolve) => {
    let settled = false;
    let unsubscribe: (() => void) | null = null;

    const finish = (user: User | null) => {
      if (settled) {
        return;
      }
      settled = true;
      if (unsubscribe) {
        unsubscribe();
      }
      window.clearTimeout(timeoutId);
      resolve(user);
    };

    unsubscribe = onAuthStateChanged(
      auth,
      (user) => finish(user),
      () => finish(auth.currentUser)
    );

    const timeoutId = window.setTimeout(() => {
      finish(auth.currentUser);
    }, timeoutMs);
  });
}

export async function getFirebaseIdToken(options?: {
  forceRefresh?: boolean;
  required?: boolean;
  timeoutMs?: number;
}): Promise<string | null> {
  const auth = await getFirebaseAuth();
  const user = await waitForFirebaseUser(auth, options?.timeoutMs);

  if (!user) {
    if (options?.required) {
      throw new Error('Nicht eingeloggt');
    }
    return null;
  }

  return user.getIdToken(options?.forceRefresh ?? false);
}

function withBearerHeader(
  headers: HeadersInit | undefined,
  token: string,
): Headers {
  const nextHeaders = new Headers(headers);
  nextHeaders.set('Authorization', `Bearer ${token}`);
  return nextHeaders;
}

export async function fetchWithFirebaseAuth(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options?: {
    required?: boolean;
    retryOnUnauthorized?: boolean;
  },
): Promise<Response> {
  const required = options?.required ?? true;
  const retryOnUnauthorized = options?.retryOnUnauthorized ?? true;

  const token = await getFirebaseIdToken({ required });
  if (!token) {
    throw new Error('Nicht eingeloggt');
  }

  let response = await fetch(input, {
    ...init,
    headers: withBearerHeader(init.headers, token),
  });

  if (response.status === 401 && retryOnUnauthorized) {
    const refreshedToken = await getFirebaseIdToken({
      forceRefresh: true,
      required,
    });

    if (refreshedToken) {
      response = await fetch(input, {
        ...init,
        headers: withBearerHeader(init.headers, refreshedToken),
      });
    }
  }

  return response;
}

export { app, auth, db };
