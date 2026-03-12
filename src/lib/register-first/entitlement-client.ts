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
  const { getFirebaseAuth } = await import("@/lib/firebase");
  const auth = await getFirebaseAuth();
  const token = await auth.currentUser?.getIdToken();

  if (!token) {
    return null;
  }

  const response = await fetch("/api/entitlements/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
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
