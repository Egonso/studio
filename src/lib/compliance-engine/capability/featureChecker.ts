import type { SubscriptionPlan } from '@/lib/register-first/types';

// ── Feature Capabilities ────────────────────────────────────────────────────
// Every gated feature in the Governance OS. Grouped for clarity.

export type FeatureCapability =
    // ── Use Case Editing ────────────────────────────────────────────────────
    | 'editUseCase'           // Edit any field on a Use Case
    | 'isoLifecycleTab'       // ISO Lifecycle tab in Use Case detail
    | 'portfolioTab'          // Portfolio tab in Use Case detail
    | 'assessmentWizard'      // EUKI Assessment on Use Case

    // ── Organisation Settings (Extended) ────────────────────────────────────
    | 'extendedOrgSettings'   // RACI, Incident, Review, Scope, Competency
    | 'governanceWizard'      // Guided Governance Setup wizard

    // ── Policy & Compliance ──────────────────────────────────────────────────
    | 'policyEngine'          // Smart Policy Engine (Level 1+)
    | 'auditExport'           // PDF/JSON Audit Dossier export

    // ── ISO & Standards ──────────────────────────────────────────────────────
    | 'isoAlignmentPack'      // ISO 27001 / 42001 Mapping
    | 'competencyMatrix'      // Competency requirements tracking

    // ── Enterprise Features ──────────────────────────────────────────────────
    | 'trustPortal'           // Public Trust Portal
    | 'benchmarkInsights'     // Anonymized benchmark data
    | 'apiAccess'             // API integrations
    | 'executiveReporting'    // Board-level reporting
    | 'multiOrgStructure'     // Multiple organizations
    | 'supplyChainAssessment';// Lieferketten-Bewertung

// ── Plan → Feature Mapping ──────────────────────────────────────────────────
// Core principle from Monetarisierungsstrategie:
//   "Regulatorische Pflicht = Immer enthalten."
//   Monetized: Governance-Fähigkeiten, Komfort, externe Signalgebung.

const PLAN_CAPABILITIES: Record<SubscriptionPlan, FeatureCapability[]> = {
    free: [],
    // Free gets: Register, Quick Capture, Read-Only Use Case View, Basic Org Settings

    pro: [
        'editUseCase',
        'isoLifecycleTab',
        'portfolioTab',
        'assessmentWizard',
        'extendedOrgSettings',
        'governanceWizard',
        'policyEngine',
        'auditExport',
        'isoAlignmentPack',
        'competencyMatrix',
    ],

    enterprise: [
        // All pro features +
        'editUseCase',
        'isoLifecycleTab',
        'portfolioTab',
        'assessmentWizard',
        'extendedOrgSettings',
        'governanceWizard',
        'policyEngine',
        'auditExport',
        'isoAlignmentPack',
        'competencyMatrix',
        // Enterprise-only:
        'trustPortal',
        'benchmarkInsights',
        'apiAccess',
        'executiveReporting',
        'multiOrgStructure',
        'supplyChainAssessment',
    ],
};

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Check if a plan grants access to a feature.
 * Strict separation from compliance/legal ruleEngine (Monetarisierungsstrategie §4.3).
 */
export function hasCapability(
    plan: SubscriptionPlan | undefined | null,
    feature: FeatureCapability,
): boolean {
    const activePlan: SubscriptionPlan = plan || 'free';
    return PLAN_CAPABILITIES[activePlan].includes(feature);
}

/**
 * What's the minimum plan required for a feature?
 * Used in lock-UI to show "Verfügbar im Pro-Plan" or "Enterprise".
 */
export function getRequiredPlan(feature: FeatureCapability): SubscriptionPlan {
    if (PLAN_CAPABILITIES.pro.includes(feature)) return 'pro';
    if (PLAN_CAPABILITIES.enterprise.includes(feature)) return 'enterprise';
    return 'free';
}

/**
 * Human-readable plan label for UI.
 */
export function getPlanLabel(plan: SubscriptionPlan): string {
    switch (plan) {
        case 'free': return 'Register (Free)';
        case 'pro': return 'Governance Toolkit';
        case 'enterprise': return 'Enterprise';
    }
}

/**
 * Get all features NOT available in the current plan (for upsell suggestions).
 */
export function getLockedFeatures(plan: SubscriptionPlan | undefined | null): FeatureCapability[] {
    const activePlan: SubscriptionPlan = plan || 'free';
    const allFeatures: FeatureCapability[] = [
        ...PLAN_CAPABILITIES.pro,
        ...PLAN_CAPABILITIES.enterprise,
    ];
    const uniqueFeatures = [...new Set(allFeatures)];
    return uniqueFeatures.filter(f => !PLAN_CAPABILITIES[activePlan].includes(f));
}
