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
        case 'pro': return 'Governance Control Center';
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

// ── Feature Metadata ─────────────────────────────────────────────────────────
// Human-readable labels and short descriptions for each feature.
// Used by FeatureGateDialog to show contextual information.

interface FeatureMeta {
    label: string;
    description: string;
}

const FEATURE_META: Record<FeatureCapability, FeatureMeta> = {
    editUseCase:            { label: 'Use-Case bearbeiten',          description: 'Alle Felder eines Einsatzfalls bearbeiten und aktualisieren.' },
    isoLifecycleTab:        { label: 'ISO Lifecycle',                description: 'Review-Zyklen, Aufsichtsmodelle und Lifecycle-Status pro Einsatzfall pflegen.' },
    portfolioTab:           { label: 'Portfolio-Analyse',            description: 'Value- und Risk-Scores zur strategischen Steuerung Ihres KI-Portfolios.' },
    assessmentWizard:       { label: 'EUKI Assessment',              description: 'Geführte Bewertung nach EU AI Act Risikokategorien.' },
    extendedOrgSettings:    { label: 'Erweiterte Org-Einstellungen', description: 'RACI-Matrix, Incident-Prozesse und Review-Standards zentral konfigurieren.' },
    governanceWizard:       { label: 'Governance-Wizard',            description: 'Geführter Aufbau Ihres organisationsweiten Governance-Frameworks.' },
    policyEngine:           { label: 'Policy-Generator',             description: 'Richtlinien für den KI-Einsatz generieren und verwalten.' },
    auditExport:            { label: 'Audit-Export',                 description: 'Governance-Dokumentation als PDF oder strukturiertes Dossier exportieren.' },
    isoAlignmentPack:       { label: 'ISO-Alignment',               description: 'Mapping auf ISO 27001 / ISO 42001 Anforderungen.' },
    competencyMatrix:       { label: 'Kompetenz-Matrix',             description: 'Schulungsanforderungen und Kompetenznachweise nachverfolgen.' },
    reviewWorkflow:         { label: 'Review-Workflows',             description: 'Formale Prüfungen dokumentieren und Fristen automatisch überwachen.' },
    trustPortal:            { label: 'Trust Portal',                 description: 'Öffentlicher Governance-Nachweis für externe Stakeholder.' },
    benchmarkInsights:      { label: 'Benchmark-Insights',           description: 'Anonymisierte Vergleichsdaten aus der Branche.' },
    apiAccess:              { label: 'API-Zugang',                   description: 'Programmatischer Zugriff auf Register und Governance-Daten.' },
    executiveReporting:     { label: 'Executive Reporting',          description: 'Vorstandsgerechte Berichte und Dashboards.' },
    multiOrgStructure:      { label: 'Multi-Organisation',           description: 'Mehrere Organisationseinheiten zentral verwalten.' },
    supplyChainAssessment:  { label: 'Lieferketten-Bewertung',       description: 'KI-Governance-Anforderungen in der Lieferkette prüfen.' },
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
