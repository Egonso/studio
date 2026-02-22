export type SubscriptionPlan = 'core' | 'pro' | 'enterprise';

export type FeatureCapability =
    | 'auditExport'
    | 'iso42001Mapping'
    | 'roleManagement'
    | 'reviewWorkflow'
    | 'versionHistory'
    | 'consultantMode'
    | 'trustPortalLive'
    | 'benchmarkInsights'
    | 'apiAccess'
    | 'executiveReporting'
    | 'insuranceReport'
    | 'multiOrgStructure'
    | 'customPolicyFramework';

/**
 * Maps which plans have access to which capabilities.
 * Core = Legal baseline is always accessible, so only premium features are listed here.
 */
const PLAN_CAPABILITIES: Record<SubscriptionPlan, FeatureCapability[]> = {
    core: [], // Core gets all the baseline but none of the premium capabilities above.
    pro: [
        'auditExport',
        'iso42001Mapping',
        'roleManagement',
        'reviewWorkflow',
        'versionHistory',
        'consultantMode'
    ],
    enterprise: [
        'auditExport',
        'iso42001Mapping',
        'roleManagement',
        'reviewWorkflow',
        'versionHistory',
        'consultantMode',
        'trustPortalLive',
        'benchmarkInsights',
        'apiAccess',
        'executiveReporting',
        'insuranceReport',
        'multiOrgStructure',
        'customPolicyFramework'
    ]
};

/**
 * Checks if the given plan has access to the requested feature.
 * @param plan The user's active subscription plan
 * @param feature The target feature to check
 * @returns boolean True if allowed, false if locked
 */
export function hasCapability(plan: SubscriptionPlan | undefined, feature: FeatureCapability): boolean {
    const activePlan = plan || 'core'; // fallback
    return PLAN_CAPABILITIES[activePlan].includes(feature);
}

/**
 * Gets the minimum plan required for a particular feature to display in lock UI.
 */
export function getRequiredPlanForCapability(feature: FeatureCapability): SubscriptionPlan {
    if (PLAN_CAPABILITIES.pro.includes(feature)) {
        return 'pro';
    }
    return 'enterprise';
}
