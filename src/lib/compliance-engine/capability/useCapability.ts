'use client';

import { useEffect, useState } from 'react';

import {
  getEntitlementAccessPlan,
  getActiveRegisterId,
  normalizeRegisterEntitlement,
  registerService,
  resolveRegisterEntitlement,
  syncRegisterEntitlement,
  type RegisterEntitlement,
  type SubscriptionPlan,
} from '@/lib/register-first';
import {
  getPlanLabel,
  getRequiredPlan,
  hasCapability,
  type FeatureCapability,
} from '@/lib/compliance-engine/capability/featureChecker';

interface EntitlementCacheEntry {
  entitlement: RegisterEntitlement;
  registerId: string | null;
}

interface UseEntitlementResult {
  entitlement: RegisterEntitlement;
  plan: SubscriptionPlan;
  loading: boolean;
}

interface UseCapabilityResult extends UseEntitlementResult {
  allowed: boolean;
  requiredPlan: SubscriptionPlan;
  requiredPlanLabel: string;
}

let entitlementCache: EntitlementCacheEntry | null = null;
let entitlementPromise: Promise<EntitlementCacheEntry> | null = null;

async function loadWorkspaceEntitlement(): Promise<RegisterEntitlement | null> {
  const { getFirebaseAuth, getFirebaseDb } = await import('@/lib/firebase');
  const auth = await getFirebaseAuth();
  const userId = auth.currentUser?.uid;
  if (!userId) {
    return null;
  }

  const db = await getFirebaseDb();
  const { doc, getDoc } = await import('firebase/firestore');
  const snapshot = await getDoc(doc(db, 'users', userId));
  const data = snapshot.data() as
    | { workspaceEntitlement?: Partial<RegisterEntitlement> | null }
    | undefined;

  return normalizeRegisterEntitlement(data?.workspaceEntitlement);
}

async function resolveCurrentEntitlement(): Promise<EntitlementCacheEntry> {
  try {
    await syncRegisterEntitlement().catch(() => null);

    const registers = await registerService.listRegisters();
    if (registers.length === 0) {
      const entitlement =
        (await loadWorkspaceEntitlement()) ?? resolveRegisterEntitlement(null);
      entitlementCache = { entitlement, registerId: null };
      return entitlementCache;
    }

    const activeRegisterId = getActiveRegisterId();
    const activeRegister =
      registers.find((register) => register.registerId === activeRegisterId) ??
      registers[0];
    const entitlement = resolveRegisterEntitlement(activeRegister);

    entitlementCache = {
      entitlement,
      registerId: activeRegister.registerId,
    };
    return entitlementCache;
  } catch {
    const entitlement = resolveRegisterEntitlement(null);
    entitlementCache = { entitlement, registerId: null };
    return entitlementCache;
  }
}

export function useEntitlement(): UseEntitlementResult {
  const [state, setState] = useState<EntitlementCacheEntry | null>(
    entitlementCache,
  );
  const [loading, setLoading] = useState(!entitlementCache);

  useEffect(() => {
    if (entitlementCache) {
      setState(entitlementCache);
      setLoading(false);
      return;
    }

    if (!entitlementPromise) {
      entitlementPromise = resolveCurrentEntitlement();
    }

    entitlementPromise
      .then((resolved) => {
        setState(resolved);
        setLoading(false);
      })
      .finally(() => {
        entitlementPromise = null;
      });
  }, []);

  const entitlement = state?.entitlement ?? resolveRegisterEntitlement(null);

  return {
    entitlement,
    plan: getEntitlementAccessPlan(entitlement),
    loading,
  };
}

export function useCapability(feature: FeatureCapability): UseCapabilityResult {
  const { entitlement, plan, loading } = useEntitlement();
  const requiredPlan = getRequiredPlan(feature);

  return {
    allowed: hasCapability(plan, feature),
    entitlement,
    plan,
    requiredPlan,
    requiredPlanLabel: getPlanLabel(requiredPlan),
    loading,
  };
}

export function invalidatePlanCache(): void {
  entitlementCache = null;
  entitlementPromise = null;
}

export function invalidateEntitlementCache(): void {
  invalidatePlanCache();
}

export function checkCapability(
  plan: SubscriptionPlan | undefined | null,
  feature: FeatureCapability,
): boolean {
  return hasCapability(plan, feature);
}
