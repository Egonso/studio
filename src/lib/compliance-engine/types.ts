export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type ActionType =
    | 'risk_assessment_missing'
    | 'policy_missing'
    | 'trust_portal_offline'
    | 'human_oversight_missing'
    | 'gpai_transparency_missing'
    | 'incident_process_missing'
    | 'raci_missing'
    | 'use_cases_uncategorized'
    | 'first_use_case_missing';

export interface ActionItem {
    id: string;
    type: ActionType;
    targetId?: string; // Optional Use Case ID if this action is specific to one system
    title: string;
    description: string;
    impactReductionEstimate?: number; // How much it decreases Exposure
    impactIncreaseEstimate?: number; // How much it increases Maturity/Transparency
    severity: Severity;
    href: string; // Where does the user click to resolve this?
}

// Minimal organization context required to evaluate the entire engine.
// This ensures the engine acts as a pure function: State -> Engine -> Report.
export interface EngineContext {
    useCases: import('@/lib/register-first/types').UseCaseCard[];
    orgStatus: {
        hasPolicy: boolean; // Keep for backward compat
        policyStatus?: 'draft' | 'review' | 'approved' | 'archived'; // PE-5
        hasIncidentProcess: boolean;
        hasRaciDefined: boolean;
        trustPortalActive: boolean;
    };
}

export interface DiagnosticIndices {
    exposure: number;     // 0 = No Risk exposed, 100 = Maximum liability risk
    maturity: number;     // 0 = Chaotic, 100 = Fully governed (Policies, RACI in place)
    transparency: number; // 0 = Opaque, 100 = Trust portal live and documented
}

export interface DiagnosticReport {
    indices: DiagnosticIndices;
    recommendations: {
        primaryAction: ActionItem | null;
        secondaryActions: ActionItem[];
    };
}
