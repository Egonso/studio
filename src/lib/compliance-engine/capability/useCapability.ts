'use client';

import { useCallback, useEffect, useState } from 'react';
import { registerService } from '@/lib/register-first/register-service';
import type { SubscriptionPlan } from '@/lib/register-first/types';
import {
    hasCapability,
    getRequiredPlan,
    getPlanLabel,
    type FeatureCapability,
} from '@/lib/compliance-engine/capability/featureChecker';

interface UseCapabilityResult {
    /** Whether the feature is allowed for the current plan */
    allowed: boolean;
    /** The current plan of the active register */
    plan: SubscriptionPlan;
    /** The minimum plan required for this feature */
    requiredPlan: SubscriptionPlan;
    /** Human-readable label of the required plan */
    requiredPlanLabel: string;
    /** True while the plan is being loaded */
    loading: boolean;
}

// Module-level cache so all hook instances share the same resolved plan
let planCache: { plan: SubscriptionPlan; registerId: string } | null = null;
let planPromise: Promise<SubscriptionPlan> | null = null;

async function resolveCurrentPlan(): Promise<SubscriptionPlan> {
    try {
        const registers = await registerService.listRegisters();
        if (registers.length === 0) return 'free';
        const active = registers[0];
        const plan = active.plan || 'free';
        planCache = { plan, registerId: active.registerId };
        return plan;
    } catch {
        return 'free';
    }
}

/**
 * React hook to check if the current register's plan allows a feature.
 *
 * Usage:
 *   const { allowed, requiredPlanLabel } = useCapability('editUseCase');
 *   if (!allowed) showLock(requiredPlanLabel);
 */
export function useCapability(feature: FeatureCapability): UseCapabilityResult {
    const [plan, setPlan] = useState<SubscriptionPlan>(planCache?.plan ?? 'free');
    const [loading, setLoading] = useState(!planCache);

    useEffect(() => {
        if (planCache) {
            setPlan(planCache.plan);
            setLoading(false);
            return;
        }

        if (!planPromise) {
            planPromise = resolveCurrentPlan();
        }

        planPromise.then((resolved) => {
            setPlan(resolved);
            setLoading(false);
            planPromise = null;
        });
    }, []);

    const requiredPlan = getRequiredPlan(feature);

    return {
        allowed: hasCapability(plan, feature),
        plan,
        requiredPlan,
        requiredPlanLabel: getPlanLabel(requiredPlan),
        loading,
    };
}

/**
 * Invalidate the plan cache (call after Stripe checkout success).
 */
export function invalidatePlanCache(): void {
    planCache = null;
    planPromise = null;
}

/**
 * Directly check a feature without the hook (for non-component code).
 */
export function checkCapability(
    plan: SubscriptionPlan | undefined | null,
    feature: FeatureCapability,
): boolean {
    return hasCapability(plan, feature);
}
