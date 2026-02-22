import { useMemo } from 'react';
import type { UseCaseCard, Register } from '@/lib/register-first/types';
import { createAiToolsRegistryService } from '@/lib/register-first';

export type DashboardLensFilter =
    | 'missing_history'
    | 'high_risk_missing_history'
    | 'external_missing_dossier'
    | null;

export interface DashboardAnalytics {
    totalUseCases: number;

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

const aiRegistry = createAiToolsRegistryService();

export function useDashboardAnalytics(useCases: UseCaseCard[], register: Register | null): DashboardAnalytics {
    return useMemo(() => {
        const totalUseCases = useCases.length;

        // Metrik 1: Registrierte Systeme ohne Prüfhistorie
        let missingHistoryCount = 0;
        // Metrik 2: Hochrisiko-Systeme ohne belastbare Historie
        let highRiskMissingHistoryCount = 0;
        // Metrik 3: Externe Systeme ohne Beweis-Dossier
        let externalMissingDossierCount = 0;

        useCases.forEach(uc => {
            const toolEntry = uc.toolId ? aiRegistry.getById(uc.toolId) : null;
            const isHighRisk = toolEntry?.riskLevel === "high" || toolEntry?.riskLevel === "unacceptable" || uc.governanceAssessment?.core?.aiActCategory === "Hochrisiko" || uc.governanceAssessment?.core?.aiActCategory === "Verboten";
            const isExternal = uc.usageContexts.includes("CUSTOMER_FACING") || uc.usageContexts.includes("EXTERNAL_PUBLIC");

            const iso = uc.governanceAssessment?.flex?.iso;

            // For now mock checks
            const hasHistory = false; // logic would check uc.reviewHistory?.length > 0
            const hasReminders = false;
            const isPruefhistorie = hasHistory && hasReminders;
            const hasTrustPortal = false; // logic would check trust portal config / published state
            const isExternBelegbar = false && hasTrustPortal; // and hasAuditDossier

            // Metric 1 Check (Systems that are fully registered but lack history)
            // Simplified: just missing history
            if (!isPruefhistorie) {
                missingHistoryCount++;
            }

            // Metric 2 Check
            if (isHighRisk && !isPruefhistorie) {
                highRiskMissingHistoryCount++;
            }

            // Metric 3 Check
            if (isExternal && !isExternBelegbar) {
                externalMissingDossierCount++;
            }
        });

        return {
            totalUseCases,
            metric1: {
                count: missingHistoryCount,
                filterKey: missingHistoryCount > 0 ? 'missing_history' : null,
                title: "Fehlende Prüfhistorie",
                description: "Systeme ohne kontinuierliche Prozessdurchsetzung.",
                primaryAction: missingHistoryCount > 0 ? `${missingHistoryCount} Systeme absichern` : "Alles abgesichert"
            },
            metric2: {
                count: highRiskMissingHistoryCount,
                filterKey: highRiskMissingHistoryCount > 0 ? 'high_risk_missing_history' : null,
                title: "Kritische Haftungslücke",
                description: "Hochrisiko-Systeme ohne menschliche Aufsichtshistorie.",
                primaryAction: highRiskMissingHistoryCount > 0 ? `${highRiskMissingHistoryCount} Lücken schließen` : "Keine Lücken"
            },
            metric3: {
                count: externalMissingDossierCount,
                filterKey: externalMissingDossierCount > 0 ? 'external_missing_dossier' : null,
                title: "Transparenzrisiko",
                description: "Externe Systeme ohne externes Beweis-Dossier.",
                primaryAction: externalMissingDossierCount > 0 ? `${externalMissingDossierCount} Dossiers erstellen` : "Voll transparent"
            }
        };
    }, [useCases, register]);
}
