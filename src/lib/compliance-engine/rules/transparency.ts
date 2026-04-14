import { EngineContext, ActionItem } from '../types';
import { parseStoredAiActCategory } from '@/lib/register-first/risk-taxonomy';

/**
 * Calculates the Transparency Index (0-100)
 * Evaluates external trust signaling (Trust Portal) and internal clarity.
 */
export function evaluateTransparency(context: EngineContext): { index: number; actions: ActionItem[] } {
    let transparencyScore = 100;
    const actions: ActionItem[] = [];

    // 1. Trust Portal
    if (!context.orgStatus.trustPortalActive) {
        transparencyScore -= 50;
        actions.push({
            id: 'trust_portal_missing',
            type: 'trust_portal_offline',
            title: 'Trust Portal is disabled',
            description: 'Enable the external portal to demonstrate transparency externally and obtain the AI Governance badge.',
            impactIncreaseEstimate: 50,
            severity: 'medium',
            href: '/trust/config'
        });
    }

    // 2. Uncategorized / Unknown Uses Cases in the Registry reduce Transparency
    const unclassifiedCount = context.useCases.filter(
        (uc) =>
            parseStoredAiActCategory(uc.governanceAssessment?.core?.aiActCategory) ===
            'UNASSESSED',
    ).length;
    if (unclassifiedCount > 0) {
        const penalty = Math.min(50, unclassifiedCount * 10);
        transparencyScore -= penalty;
        actions.push({
            id: 'use_cases_uncategorized',
            type: 'use_cases_uncategorized',
            title: `Classify risk level for ${unclassifiedCount} systems`,
            description: 'Go to the register and classify these systems (risk tab) to ensure audit readiness.',
            impactIncreaseEstimate: penalty,
            severity: 'high',
            href: '/my-register'
        });
    }

    return {
        index: Math.max(0, transparencyScore),
        actions
    };
}
