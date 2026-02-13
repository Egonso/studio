/**
 * Register Settings Client – manages defaultRegisterId.
 *
 * Primary storage: Firestore (users/{userId}/appData/registerSettings)
 * Cache: sessionStorage (for fast client-side reads without network)
 */

const SESSION_KEY = "activeRegisterId";

// ── sessionStorage (cache) ──────────────────────────────────────────────────

export function getActiveRegisterId(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(SESSION_KEY);
}

export function setActiveRegisterId(registerId: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SESSION_KEY, registerId);
}

export function clearActiveRegisterId(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SESSION_KEY);
}

// ── Firestore (persistent) ──────────────────────────────────────────────────

export async function getDefaultRegisterId(
  userId: string
): Promise<string | null> {
  const { getFirebaseDb } = await import("@/lib/firebase");
  const db = await getFirebaseDb();
  const { doc, getDoc } = await import("firebase/firestore");

  const docRef = doc(db, `users/${userId}/appData/registerSettings`);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return (snapshot.data()?.defaultRegisterId as string) ?? null;
}

export async function setDefaultRegisterId(
  userId: string,
  registerId: string
): Promise<void> {
  const { getFirebaseDb } = await import("@/lib/firebase");
  const db = await getFirebaseDb();
  const { doc, setDoc } = await import("firebase/firestore");

  const docRef = doc(db, `users/${userId}/appData/registerSettings`);
  await setDoc(docRef, { defaultRegisterId: registerId }, { merge: true });
  // Also update session cache
  setActiveRegisterId(registerId);
}
