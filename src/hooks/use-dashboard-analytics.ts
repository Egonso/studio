import { useMemo } from 'react';
import type { UseCaseCard, Register } from '@/lib/register-first/types';

export type DashboardLensFilter =
    | 'missing_ai_act_category'
    | 'critical_ai_act_gaps'
    | 'missing_review_cycle'
    | 'missing_owner'
    | 'iso_micro_gaps'
    | 'high_value_high_risk'
    | 'low_risk_high_value'
    | 'ai_act_ok'
    | null;

export interface DashboardAnalytics {
    totalUseCases: number;

    aiAct: {
        coveragePercent: number;
        criticalCount: number;
        totalNeedsCategory: number;
        primaryAction: string;
        filterKey: DashboardLensFilter;
    };

    iso: {
        macroFlags: {
            aiPolicyExists: boolean;
            incidentProcessExists: boolean;
            raciExists: boolean;
            reviewStandardDefined: boolean;
        };
        microGapsCount: number;
        primaryAction: string;
        // Can be a filter key string or a settings tab routing string
        targetDestination: DashboardLensFilter | 'settings:governance';
    };

    portfolio: {
        quickWinsCount: number;
        highValueHighRiskCount: number;
        primaryAction: string;
        filterKey: DashboardLensFilter;
    };
}

export function useDashboardAnalytics(useCases: UseCaseCard[], register: Register | null): DashboardAnalytics {
    return useMemo(() => {
        const totalUseCases = useCases.length;

        // --- 1. AI Act Lens ---
        let uncategorizedCount = 0;
        let criticalGapsCount = 0; // z.B. Hochrisiko ohne Oversight

        // --- 2. ISO Lens (Micro) ---
        let isoMicroGapsCount = 0; // z.B. kein Review-Zyklus definiert, kein Owner

        // --- 3. Portfolio Lens ---
        let quickWinsCount = 0; // Low Risk / High Value
        let highRiskHighValueCount = 0; // High Risk / High Value

        useCases.forEach(uc => {
            const core = uc.governanceAssessment?.core;

            // AI Act Analysis
            if (!core || !core.aiActCategory) {
                uncategorizedCount++;
            } else if (core.aiActCategory === 'Hochrisiko' && !core.oversightDefined) {
                criticalGapsCount++;
            }

            // ISO Micro Analysis (Focusing on execution per system)
            if (!core?.reviewCycleDefined || !uc.responsibility?.responsibleParty) {
                isoMicroGapsCount++;
            }

            // Portfolio Analysis
            // Fallback logic for when riskScore / valueScore aren't available on the direct type yet
            const risk = (uc as any).riskScore || 0;
            const val = (uc as any).valueScore || 0;
            if (val > 60 && risk < 40) quickWinsCount++;
            if (val > 60 && risk > 60) highRiskHighValueCount++;
        });

        const aiActCoverage = totalUseCases > 0
            ? Math.round(((totalUseCases - uncategorizedCount) / totalUseCases) * 100)
            : 0;

        let aiActFilter: DashboardLensFilter = null;
        let aiActAction = "Status in Ordnung";
        if (criticalGapsCount > 0) {
            aiActFilter = 'critical_ai_act_gaps';
            aiActAction = `${criticalGapsCount} kritische Lücken beheben`;
        } else if (uncategorizedCount > 0) {
            aiActFilter = 'missing_ai_act_category';
            aiActAction = `${uncategorizedCount} Systeme klassifizieren`;
        } else if (totalUseCases > 0) {
            aiActFilter = 'ai_act_ok';
            aiActAction = "Report anzeigen";
        } else {
            aiActAction = "Erste Anwendung erfassen";
        }

        // --- ISO Macro Analysis (from orgSettings directly) ---
        // Extracting from available settings or defaulting for demo purposes until full org settings are synced
        const macroFlags = {
            aiPolicyExists: !!(register?.companyProfile as any)?.aiPolicyUrl,
            incidentProcessExists: !!(register?.companyProfile as any)?.incidentProcessUrl,
            raciExists: !!(register?.companyProfile as any)?.raciDocUrl,
            // Fallback for demo simplicity. Ideally this would be a real field setting the review rhythm globally.
            reviewStandardDefined: true
        };

        let isoAction = "Struktur prüfen";
        let isoTarget: DashboardAnalytics['iso']['targetDestination'] = null;

        if (!macroFlags.aiPolicyExists || !macroFlags.incidentProcessExists || !macroFlags.raciExists) {
            isoAction = "Governance-Fundament schwach";
            isoTarget = 'settings:governance';
        } else if (isoMicroGapsCount > 0) {
            isoAction = `${isoMicroGapsCount} Lücken in Anwendungen`;
            isoTarget = 'iso_micro_gaps';
        } else if (totalUseCases === 0) {
            isoAction = "Erste Anwendung erfassen";
        }

        // --- Portfolio Matrix Analysis ---
        let portfolioAction = "Portfolio-Matrix laden";
        let portfolioTarget: DashboardLensFilter = null;
        if (highRiskHighValueCount > 0) {
            portfolioAction = `${highRiskHighValueCount} High-Risk/High-Value Systeme prüfen`;
            portfolioTarget = 'high_value_high_risk';
        } else if (quickWinsCount > 0) {
            portfolioAction = `${quickWinsCount} Quick-Wins skalieren`;
            portfolioTarget = 'low_risk_high_value';
        } else if (totalUseCases === 0) {
            portfolioAction = "Strategie starten";
        }

        return {
            totalUseCases,
            aiAct: {
                coveragePercent: aiActCoverage,
                criticalCount: criticalGapsCount,
                totalNeedsCategory: uncategorizedCount,
                primaryAction: aiActAction,
                filterKey: aiActFilter
            },
            iso: {
                macroFlags,
                microGapsCount: isoMicroGapsCount,
                primaryAction: isoAction,
                targetDestination: isoTarget
            },
            portfolio: {
                quickWinsCount,
                highValueHighRiskCount: highRiskHighValueCount,
                primaryAction: portfolioAction,
                filterKey: portfolioTarget
            }
        };
    }, [useCases, register]);
}
