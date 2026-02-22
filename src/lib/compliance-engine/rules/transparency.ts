import { EngineContext, ActionItem } from '../types';

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
            title: 'Trust Portal ist deaktiviert',
            description: 'Aktivieren Sie das externe Portal, um Transparenz nach außen zu demonstrieren und das EUKI-Governance-Badge zu erhalten.',
            impactIncreaseEstimate: 50,
            severity: 'medium',
            href: '/trust/config'
        });
    }

    // 2. Uncategorized / Unknown Uses Cases in the Registry reduce Transparency
    const unclassifiedCount = context.useCases.filter(uc => !uc.governanceAssessment?.core?.aiActCategory || uc.governanceAssessment.core.aiActCategory === 'Unbekannt').length;
    if (unclassifiedCount > 0) {
        const penalty = Math.min(50, unclassifiedCount * 10);
        transparencyScore -= penalty;
        actions.push({
            id: 'use_cases_uncategorized',
            type: 'use_cases_uncategorized',
            title: `${unclassifiedCount} Radar-Systeme nicht klassifiziert`,
            description: 'Systeme ohne klare Risikoklasse (High/Minimal/etc.) senken die interne Transparenz und Audit-Fähigkeit.',
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
