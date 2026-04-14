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

    // ── Review & Reporting ────────────────────────────────────────────────────
    | 'reviewWorkflow'        // Review history + deadline monitoring

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
    free: [
        'editUseCase',
        'assessmentWizard',
    ],
    // Free gets: Register, Quick Capture, Use-Case editing, basic pass preparation and external intake.

    pro: [
        'isoLifecycleTab',
        'portfolioTab',
        'extendedOrgSettings',
        'governanceWizard',
        'policyEngine',
        'auditExport',
        'isoAlignmentPack',
        'competencyMatrix',
        'reviewWorkflow',
        'trustPortal',
    ],

    enterprise: [
        // All pro features +
        'isoLifecycleTab',
        'portfolioTab',
        'extendedOrgSettings',
        'governanceWizard',
        'policyEngine',
        'auditExport',
        'isoAlignmentPack',
        'competencyMatrix',
        'reviewWorkflow',
        'trustPortal',
        // Enterprise-only:
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
        case 'free': return 'Free Register';
        case 'pro': return 'Organisationssteuerung';
        case 'enterprise': return 'Erweiterte Organisationssteuerung';
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

// ── Feature Metadata ─────────────────────────────────────────────────────────
// Human-readable labels and short descriptions for each feature.
// Used by FeatureGateDialog to show contextual information.

interface FeatureMeta {
    label: string;
    description: string;
}

const FEATURE_META: Record<FeatureCapability, FeatureMeta> = {
    editUseCase:            { label: 'Edit use case',                description: 'Edit and update all fields of a use case.' },
    isoLifecycleTab:        { label: 'ISO Lifecycle',                description: 'Manage review cycles, oversight models, and lifecycle status per use case.' },
    portfolioTab:           { label: 'Portfolio Analysis',           description: 'Value and risk scores for strategic management of your AI portfolio.' },
    assessmentWizard:       { label: 'EU AI Act Assessment',         description: 'Guided assessment based on EU AI Act risk categories.' },
    extendedOrgSettings:    { label: 'Extended Org Settings',        description: 'Configure RACI matrix, incident processes, and review standards centrally.' },
    governanceWizard:       { label: 'Governance Wizard',            description: 'Guided setup of your organisation-wide governance framework.' },
    policyEngine:           { label: 'Policy Generator',             description: 'Generate and manage AI usage policies.' },
    auditExport:            { label: 'Audit Export',                 description: 'Export governance documentation as PDF or structured dossier.' },
    isoAlignmentPack:       { label: 'ISO Alignment',               description: 'Mapping to ISO 27001 / ISO 42001 requirements.' },
    competencyMatrix:       { label: 'Competency Matrix',            description: 'Track training requirements and competency records.' },
    reviewWorkflow:         { label: 'Review Workflows',             description: 'Document formal reviews and automatically monitor deadlines.' },
    trustPortal:            { label: 'Trust Portal',                 description: 'Public governance evidence for external stakeholders.' },
    benchmarkInsights:      { label: 'Benchmark Insights',           description: 'Anonymised comparison data from the industry.' },
    apiAccess:              { label: 'API Access',                   description: 'Programmatic access to register and governance data.' },
    executiveReporting:     { label: 'Executive Reporting',          description: 'Board-ready reports and dashboards.' },
    multiOrgStructure:      { label: 'Multi-Organisation',           description: 'Centrally manage multiple organisational units.' },
    supplyChainAssessment:  { label: 'Supply Chain Assessment',      description: 'Assess AI governance requirements across the supply chain.' },
};

/**
 * Get the human-readable label for a feature capability.
 */
export function getFeatureLabel(feature: FeatureCapability): string {
    return FEATURE_META[feature].label;
}

/**
 * Get the short description for a feature capability.
 */
export function getFeatureDescription(feature: FeatureCapability): string {
    return FEATURE_META[feature].description;
}

/**
 * Get a summary of key features included in a plan (for upsell dialogs).
 * Returns up to `limit` features with their labels.
 */
export function getPlanHighlights(plan: SubscriptionPlan, limit = 5): string[] {
    return PLAN_CAPABILITIES[plan]
        .slice(0, limit)
        .map(f => FEATURE_META[f].label);
}
