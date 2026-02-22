import { EngineContext, ActionItem } from '../types';

/**
 * Calculates the Regulatory Exposure Index (0-100)
 * 0 = Minimal regulatory exposure / risk
 * 100 = Maximum regulatory exposure (e.g. unassessed high-risk systems, prohibited use cases)
 * 
 * Also returns related ActionItems to reduce exposure.
 */
export function evaluateRegulatoryExposure(context: EngineContext): { index: number; actions: ActionItem[] } {
    let exposureScore = 0;
    const actions: ActionItem[] = [];

    context.useCases.forEach(useCase => {
        const aiActClass = useCase.governanceAssessment?.core?.aiActCategory || '';
        const systemName = useCase.toolFreeText || useCase.toolId || useCase.purpose;

        // 1. Unmitigated High-Risk Systems
        if (aiActClass.includes('Hochrisiko') || aiActClass.includes('High')) {
            const hasAssessment = useCase.governanceAssessment?.core?.assessedAt;
            if (!hasAssessment) {
                exposureScore += 40; // High penalty
                actions.push({
                    id: `assessment_missing_${useCase.useCaseId}`,
                    type: 'risk_assessment_missing',
                    targetId: useCase.useCaseId,
                    title: `Risk Assessment fehlt: ${systemName}`,
                    description: 'Für Hochrisiko-Systeme ist ein Assessment gesetzlich zwingend vorgeschrieben.',
                    impactReductionEstimate: 40,
                    severity: 'critical',
                    href: `/my-register/${useCase.useCaseId}?tab=governance_core`
                });
            }

            // High risk without human oversight
            const hasOversight = useCase.governanceAssessment?.core?.oversightDefined;
            if (!hasOversight) {
                exposureScore += 20; // Medium-high penalty
                actions.push({
                    id: `oversight_missing_${useCase.useCaseId}`,
                    type: 'human_oversight_missing',
                    targetId: useCase.useCaseId,
                    title: `Menschliche Aufsicht fehlt: ${systemName}`,
                    description: 'Hochrisiko-Systeme erfordern eine definierte menschliche Aufsicht (Human-in-the-loop).',
                    impactReductionEstimate: 20,
                    severity: 'high',
                    href: `/my-register/${useCase.useCaseId}?tab=governance_core`
                });
            }
        }

        // 2. Prohibited AI Systems
        if (aiActClass.includes('Verboten') || aiActClass.includes('Unacceptable')) {
            exposureScore += 100; // Immediate full risk
            actions.push({
                id: `prohibited_${useCase.useCaseId}`,
                type: 'risk_assessment_missing',
                targetId: useCase.useCaseId,
                title: `Verbotenes KI-System erkannt: ${systemName}`,
                description: 'Dieses System fällt unter inakzeptables Risiko und verstößt sehr wahrscheinlich gegen EU-Recht.',
                impactReductionEstimate: 100,
                severity: 'critical',
                href: `/my-register/${useCase.useCaseId}`
            });
        }

        // 3. GPAI without Transparency
        // Check heuristics for GPAI
        if (useCase.purpose.toLowerCase().includes('chatgpt') || useCase.purpose.toLowerCase().includes('llm') || useCase.purpose.toLowerCase().includes('generativ')) {
            const isDocumented = useCase.governanceAssessment?.core?.documentationLevelDefined;
            if (!isDocumented) {
                exposureScore += 10;
                actions.push({
                    id: `gpai_transparency_${useCase.useCaseId}`,
                    type: 'gpai_transparency_missing',
                    targetId: useCase.useCaseId,
                    title: `GPAI Transparenz fehlt: ${systemName}`,
                    description: 'Generative KI (z.B. ChatGPT) erfordert Dokumentation zur Information der Endnutzer.',
                    impactReductionEstimate: 10,
                    severity: 'medium',
                    href: `/my-register/${useCase.useCaseId}?tab=governance_core`
                });
            }
        }
    });

    return {
        index: Math.min(100, Math.max(0, exposureScore)), // Clamp 0-100
        actions
    };
}
