import type { SubscriptionPlan } from "./types";

export interface EntitlementSyncResult {
  applied: boolean;
  needsRegister: boolean;
  plan: SubscriptionPlan;
  registerId: string | null;
  source: string | null;
}

export async function syncRegisterEntitlement(options: {
  registerId?: string | null;
  sessionId?: string | null;
} = {}): Promise<EntitlementSyncResult | null> {
  const { fetchWithFirebaseAuth, getFirebaseIdToken } = await import("@/lib/firebase");
  const token = await getFirebaseIdToken();

  if (!token) {
    return null;
  }

  const response = await fetchWithFirebaseAuth("/api/entitlements/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      registerId: options.registerId ?? undefined,
      sessionId: options.sessionId ?? undefined,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(
      typeof payload?.error === "string"
        ? payload.error
        : "Entitlement sync failed."
    );
  }

  return (await response.json()) as EntitlementSyncResult;
}
