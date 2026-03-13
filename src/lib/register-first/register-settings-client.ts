/**
 * Register Settings Client – manages defaultRegisterId.
 *
 * Primary storage: Firestore (users/{userId}/appData/registerSettings)
 * Cache: sessionStorage (for fast client-side reads without network)
 *
 * Settings are scope-aware:
 * - personal => users/{userId}/appData/registerSettings.defaultRegisterId
 * - workspace => users/{userId}/appData/registerSettings.defaultRegisterIdByScope["workspace:{orgId}"]
 */

const SESSION_KEY_PREFIX = 'activeRegisterId';

function normalizeScopeKey(scopeKey?: string | null): string {
  const normalized = scopeKey?.trim();
  return normalized && normalized.length > 0 ? normalized : 'personal';
}

function getSessionKey(scopeKey?: string | null): string {
  const normalizedScopeKey = normalizeScopeKey(scopeKey);
  return normalizedScopeKey === 'personal'
    ? SESSION_KEY_PREFIX
    : `${SESSION_KEY_PREFIX}:${normalizedScopeKey}`;
}

// ── sessionStorage (cache) ──────────────────────────────────────────────────

export function getActiveRegisterId(scopeKey?: string | null): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(getSessionKey(scopeKey));
}

export function setActiveRegisterId(
  registerId: string,
  scopeKey?: string | null,
): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(getSessionKey(scopeKey), registerId);
}

export function clearActiveRegisterId(scopeKey?: string | null): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(getSessionKey(scopeKey));
}

// ── Firestore (persistent) ──────────────────────────────────────────────────

export async function getDefaultRegisterId(
  userId: string,
  scopeKey?: string | null,
): Promise<string | null> {
  const { getFirebaseDb } = await import("@/lib/firebase");
  const db = await getFirebaseDb();
  const { doc, getDoc } = await import("firebase/firestore");
  const normalizedScopeKey = normalizeScopeKey(scopeKey);

  const docRef = doc(db, `users/${userId}/appData/registerSettings`);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as
    | {
        defaultRegisterId?: string;
        defaultRegisterIdByScope?: Record<string, string>;
      }
    | undefined;

  if (normalizedScopeKey === 'personal') {
    return data?.defaultRegisterId ?? null;
  }

  return data?.defaultRegisterIdByScope?.[normalizedScopeKey] ?? null;
}

export async function setDefaultRegisterId(
  userId: string,
  registerId: string,
  scopeKey?: string | null,
): Promise<void> {
  const { getFirebaseDb } = await import("@/lib/firebase");
  const db = await getFirebaseDb();
  const { doc, setDoc } = await import("firebase/firestore");
  const normalizedScopeKey = normalizeScopeKey(scopeKey);

  const docRef = doc(db, `users/${userId}/appData/registerSettings`);
  await setDoc(
    docRef,
    normalizedScopeKey === 'personal'
      ? { defaultRegisterId: registerId }
      : {
          defaultRegisterIdByScope: {
            [normalizedScopeKey]: registerId,
          },
        },
    { merge: true },
  );
  // Also update session cache
  setActiveRegisterId(registerId, normalizedScopeKey);
}
