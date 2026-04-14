/**
 * Level 3, Section 10: High-Risk AI Systems
 *
 * Conditional: included when >= 1 use case has aiActCategory 'High-risk'
 * OR resolveDecisionInfluence(uc) === 'AUTOMATED'.
 *
 * Lists affected use cases by name.
 * Reference: AI Act Chapter III (Art. 6–49), Annex III
 *
 * Legally defensive: subjunctive, "should", not "must"
 * Sprint: PE-2b Level 3
 */

import type { SectionDefinition } from '../section-definition';
import {
    getDisplayedRiskClassLabel,
    isHighRiskClass,
    parseStoredAiActCategory,
} from '@/lib/register-first/risk-taxonomy';
import type { UseCaseCard } from '@/lib/register-first/types';
import { resolveDecisionInfluence, DECISION_INFLUENCE_LABELS } from '@/lib/register-first/types';

/** Check if a use case qualifies as high-risk */
function isHighRisk(uc: UseCaseCard): boolean {
    const isHochrisiko = isHighRiskClass(
        parseStoredAiActCategory(uc.governanceAssessment?.core?.aiActCategory)
    );
    const isAutomated = resolveDecisionInfluence(uc) === 'AUTOMATED';
    return isHochrisiko || isAutomated;
}

export const highRiskSection: SectionDefinition = {
    sectionId: 'l3-high-risk',
    title: 'Requirements for High-Risk AI Systems',
    order: 1100,
    level: 3,

    shouldInclude(context) {
        return context.useCases.some(isHighRisk);
    },

    buildContent(context) {
        const orgName = context.orgSettings.organisationName || '[Company Name]';
        const affected = context.useCases.filter(isHighRisk);

        const lines: string[] = [
            `${orgName} operates ${affected.length} AI system${affected.length > 1 ? 's' : ''} ` +
            `classified as high-risk or making automated decisions. ` +
            `Extended requirements under Chapter III of the AI Act apply to these.`,
            ``,
            `### Affected Systems`,
            ``,
        ];

        for (const uc of affected) {
            const cat = getDisplayedRiskClassLabel({
                aiActCategory: uc.governanceAssessment?.core?.aiActCategory,
                short: true,
            });
            const influence = resolveDecisionInfluence(uc);
            const influenceLabel = influence ? DECISION_INFLUENCE_LABELS[influence] : '–';
            lines.push(
                `- **${uc.purpose}** – Category: ${cat}, Decision influence: ${influenceLabel}`,
            );
        }
        lines.push(``);

        lines.push(`### Obligations under AI Act Chapter III`);
        lines.push(``);
        lines.push(`The following requirements should be implemented for the systems listed above:`);
        lines.push(``);
        lines.push(`1. **Risk Management System** (Art. 9): A documented risk management system ` +
            `should be maintained throughout the entire lifecycle of the system.`);
        lines.push(`2. **Data and Data Governance** (Art. 10): Training, validation and test data ` +
            `should meet defined quality criteria.`);
        lines.push(`3. **Technical Documentation** (Art. 11): The functioning, limitations and ` +
            `risks of the system should be fully documented.`);
        lines.push(`4. **Record-Keeping Obligations** (Art. 12): Automatic logging ` +
            `of relevant system events should be implemented.`);
        lines.push(`5. **Transparency and Provision of Information to Deployers** (Art. 13): Deployers should have sufficient information ` +
            `to be able to use the system appropriately.`);
        lines.push(`6. **Human Oversight** (Art. 14): Appropriate human ` +
            `oversight should be ensured.`);
        lines.push(`7. **Accuracy, Robustness, Cybersecurity** (Art. 15): The system ` +
            `should be appropriately accurate, robust and secure throughout its lifecycle.`);

        return lines.join('\n');
    },
};
