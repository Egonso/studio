import { useMemo } from 'react';
import type { UseCaseCard, Register } from '@/lib/register-first/types';
import { calculateDiagnosticReport } from '@/lib/compliance-engine/index/calculator';
import type { EngineContext } from '@/lib/compliance-engine/types';
import { aggregateOrgScores } from '@/lib/compliance-engine/scores';

export type DashboardLensFilter =
    | 'missing_history'
    | 'high_risk_missing_history'
    | 'external_missing_dossier'
    | null;

export interface DashboardAnalytics {
    totalUseCases: number;

    // Diagnostic indices (0-100)
    maturityIndex: number;
    exposureIndex: number;
    transparencyIndex: number;

    // Dual Scores from Sprint 4
    avgQuality: number;
    avgQualityLabel: string;
    maxExposureLabel: string;

    metric1: {
        count: number;
        filterKey: DashboardLensFilter;
        title: string;
        description: string;
        primaryAction: string;
    };

    metric2: {
        count: number;
        filterKey: DashboardLensFilter;
        title: string;
        description: string;
        primaryAction: string;
    };

    metric3: {
        count: number;
        filterKey: DashboardLensFilter;
        title: string;
        description: string;
        primaryAction: string;
    };
}

/**
 * Dashboard analytics hook – powered by the Compliance Engine
 * (calculateDiagnosticReport) as single source of truth.
 */
export function useDashboardAnalytics(useCases: UseCaseCard[], register: Register | null): DashboardAnalytics {
    return useMemo(() => {
        const totalUseCases = useCases.length;

        // Build engine context from register data
        const orgStatus = {
            hasPolicy: Boolean(register?.orgSettings?.aiPolicy?.url),
            hasIncidentProcess: Boolean(register?.orgSettings?.incidentProcess?.url),
            hasRaciDefined: Boolean(register?.orgSettings?.rolesFramework?.booleanDefined),
            trustPortalActive: Boolean(register?.publicOrganisationDisclosure),
        };

        const context: EngineContext = { useCases, orgStatus };

        // Run the compliance engine
        const report = calculateDiagnosticReport(context);
        const scores = aggregateOrgScores(useCases);

        // Derive metric counts from ActionItems instead of mock values
        const maturityActions = report.recommendations.secondaryActions.filter(
            a => a.type === 'policy_missing' || a.type === 'incident_process_missing' ||
                a.type === 'raci_missing' || a.type === 'first_use_case_missing'
        );
        const exposureActions = report.recommendations.secondaryActions.filter(
            a => a.type === 'risk_assessment_missing' || a.type === 'human_oversight_missing'
        );
        const transparencyActions = report.recommendations.secondaryActions.filter(
            a => a.type === 'gpai_transparency_missing' || a.type === 'trust_portal_offline'
        );

        // Include primary action in the appropriate bucket
        const primary = report.recommendations.primaryAction;
        if (primary) {
            if (['policy_missing', 'incident_process_missing', 'raci_missing', 'first_use_case_missing'].includes(primary.type)) {
                maturityActions.unshift(primary);
            } else if (['risk_assessment_missing', 'human_oversight_missing'].includes(primary.type)) {
                exposureActions.unshift(primary);
            } else {
                transparencyActions.unshift(primary);
            }
        }

        return {
            totalUseCases,
            maturityIndex: report.indices.maturity,
            exposureIndex: report.indices.exposure,
            transparencyIndex: report.indices.transparency,
            avgQuality: scores.avgQuality,
            avgQualityLabel: scores.avgQualityLabel,
            maxExposureLabel: scores.maxExposureLabel,

            metric1: {
                count: maturityActions.length,
                filterKey: maturityActions.length > 0 ? 'missing_history' : null,
                title: "Governance Reife",
                description: maturityActions.length > 0
                    ? `${maturityActions.length} organisatorische Lücken erkannt.`
                    : "Alle Governance-Strukturen vorhanden.",
                primaryAction: maturityActions.length > 0
                    ? maturityActions[0].title
                    : "Vollständig aufgestellt",
            },
            metric2: {
                count: exposureActions.length,
                filterKey: exposureActions.length > 0 ? 'high_risk_missing_history' : null,
                title: "Regulatorisches Risiko",
                description: exposureActions.length > 0
                    ? `${exposureActions.length} Hochrisiko-Lücken offen.`
                    : "Keine kritischen Haftungslücken.",
                primaryAction: exposureActions.length > 0
                    ? exposureActions[0].title
                    : "Keine Lücken",
            },
            metric3: {
                count: transparencyActions.length,
                filterKey: transparencyActions.length > 0 ? 'external_missing_dossier' : null,
                title: "Transparenzpflichten",
                description: transparencyActions.length > 0
                    ? `${transparencyActions.length} Transparenz-Lücken erkannt.`
                    : "Transparenzpflichten erfüllt.",
                primaryAction: transparencyActions.length > 0
                    ? transparencyActions[0].title
                    : "Voll transparent",
            },
        };
    }, [useCases, register]);
}
