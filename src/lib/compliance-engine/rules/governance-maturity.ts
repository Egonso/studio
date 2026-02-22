import { EngineContext, ActionItem } from '../types';

/**
 * Calculates the Governance Maturity Index (0-100)
 * 100 = Fully mature, all policies and governance structures in place.
 * 0 = Immature, no processes, no policies.
 */
export function evaluateGovernanceMaturity(context: EngineContext): { index: number; actions: ActionItem[] } {
    let maturityScore = 100; // Start at perfect, deduct points for missing
    const actions: ActionItem[] = [];

    // 1. Missing Global AI Policy
    if (!context.orgStatus.hasPolicy) {
        maturityScore -= 40;
        actions.push({
            id: 'policy_missing_org',
            type: 'policy_missing',
            title: 'Fehlende KI-Richtlinie (AI Policy)',
            description: 'Ohne eine zentrale Richtlinie haben Ihre Mitarbeiter keine Handlungssicherheit beim Einsatz von KI.',
            impactIncreaseEstimate: 40,
            severity: 'high',
            href: '/dashboard/cbs' // Example route to policy generation
        });
    }

    // 2. Incident Process
    if (!context.orgStatus.hasIncidentProcess) {
        maturityScore -= 30;
        actions.push({
            id: 'incident_process_missing_org',
            type: 'incident_process_missing',
            title: 'Kein KI-Incident Prozess definiert',
            description: 'Sie müssen festlegen, wer im Fall einer KI-Fehlfunktion (Verletzung der Grundrechte) im Unternehmen entscheidet.',
            impactIncreaseEstimate: 30,
            severity: 'medium',
            href: '/dashboard/incidents' // Placeholder
        });
    }

    // 3. RACI (Roles) not defined
    if (!context.orgStatus.hasRaciDefined) {
        maturityScore -= 30;
        actions.push({
            id: 'raci_missing_org',
            type: 'raci_missing',
            title: 'KI-Rollen & Verantwortlichkeiten fehlen',
            description: 'Weisen Sie klare Rollen (z.B. AI Officer, Legal) für die Freigabe und Überwachung von KI-Systemen zu.',
            impactIncreaseEstimate: 30,
            severity: 'medium',
            href: '/dashboard/settings' // Placeholder
        });
    }

    // 4. Zero Use Cases (Unmature Registry)
    if (context.useCases.length === 0) {
        maturityScore -= 20; // Additional penalty if registry is entirely empty
        actions.push({
            id: 'use_cases_empty',
            type: 'first_use_case_missing',
            title: 'Register ist leer',
            description: 'Eine Governance-Strategie ohne erfasste Systeme (Schatten-IT) ist wirkungslos. Erfassen Sie Ihr erstes KI-Tool.',
            impactIncreaseEstimate: 20,
            severity: 'high',
            href: '/my-register' // Trigger blank state quick-capture
        });
    }

    // Clamp score
    return {
        index: Math.max(0, maturityScore),
        actions
    };
}
