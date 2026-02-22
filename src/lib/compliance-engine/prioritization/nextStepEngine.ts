import { ActionItem } from '../types';

/**
 * Determines the absolute single most important action (primaryAction)
 * and sorts the rest into secondaryActions.
 * 
 * Logic:
 * 1. Hard EU regulatory violations ('critical' severity) win.
 * 2. If multiple criticals exist, the one with highest impactReductionEstimate wins.
 * 3. Then 'high' severity, then 'medium'.
 */
export function determineNextStep(allActions: ActionItem[]): {
    primaryAction: ActionItem | null;
    secondaryActions: ActionItem[];
} {
    if (allActions.length === 0) {
        return { primaryAction: null, secondaryActions: [] };
    }

    // Sort actions based on defined priority logic
    const sortedActions = [...allActions].sort((a, b) => {
        // 1. Severity weight
        const severityWeight = {
            'critical': 1000,
            'high': 100,
            'medium': 10,
            'low': 1
        };

        const weightA = severityWeight[a.severity] || 0;
        const weightB = severityWeight[b.severity] || 0;

        if (weightA !== weightB) {
            return weightB - weightA; // Higher weight first
        }

        // 2. Impact Reduction Estimate (Exposure is primary driver)
        const impactA = a.impactReductionEstimate || 0;
        const impactB = b.impactReductionEstimate || 0;
        if (impactA !== impactB) {
            return impactB - impactA;
        }

        // 3. Impact Increase Estimate (Maturity/Transparency)
        const incA = a.impactIncreaseEstimate || 0;
        const incB = b.impactIncreaseEstimate || 0;
        return incB - incA;
    });

    const primaryAction = sortedActions[0];
    const secondaryActions = sortedActions.slice(1);

    return {
        primaryAction,
        secondaryActions
    };
}
