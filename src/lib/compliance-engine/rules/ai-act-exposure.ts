import { EngineContext, ActionItem } from '../types';
import {
    isHighRiskClass,
    isProhibitedRiskClass,
    parseStoredAiActCategory,
} from '@/lib/register-first/risk-taxonomy';

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
        const canonicalRiskClass = parseStoredAiActCategory(aiActClass);
        const systemName = useCase.toolFreeText || useCase.toolId || useCase.purpose;

        // 1. Unmitigated High-Risk Systems
        if (isHighRiskClass(canonicalRiskClass)) {
            const hasAssessment = useCase.governanceAssessment?.core?.assessedAt;
            if (!hasAssessment) {
                exposureScore += 40; // High penalty
                actions.push({
                    id: `assessment_missing_${useCase.useCaseId}`,
                    type: 'risk_assessment_missing',
                    targetId: useCase.useCaseId,
                    title: `Risk assessment missing: ${systemName}`,
                    description: 'A risk assessment is legally mandatory for high-risk AI systems under the EU AI Act.',
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
                    title: `Human oversight missing: ${systemName}`,
                    description: 'High-risk AI systems require defined human oversight (human-in-the-loop).',
                    impactReductionEstimate: 20,
                    severity: 'high',
                    href: `/my-register/${useCase.useCaseId}?tab=governance_core`
                });
            }
        }

        // 2. Prohibited AI Systems
        if (isProhibitedRiskClass(canonicalRiskClass)) {
            exposureScore += 100; // Immediate full risk
            actions.push({
                id: `prohibited_${useCase.useCaseId}`,
                type: 'risk_assessment_missing',
                targetId: useCase.useCaseId,
                title: `Prohibited AI system detected: ${systemName}`,
                description: 'This system falls under unacceptable risk and very likely violates EU law.',
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
