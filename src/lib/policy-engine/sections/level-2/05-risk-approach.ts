/**
 * Level 2, Section 05: Risk-Based Use of AI Systems
 *
 * Counts AI Act risk categories from the register and presents
 * the organisation's risk-based approach.
 *
 * Always included at Level 2.
 * Legally defensive: subjunctive, "should", not "must"
 * Sprint: PE-2b Level 2
 */

import type { SectionDefinition } from '../section-definition';
import {
    getRiskClassDisplayLabel,
    parseStoredAiActCategory,
} from '@/lib/register-first/risk-taxonomy';
import type { UseCaseCard } from '@/lib/register-first/types';

/** Count AI Act categories from registered use cases */
function countAiActCategories(useCases: UseCaseCard[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const uc of useCases) {
        const cat = parseStoredAiActCategory(uc.governanceAssessment?.core?.aiActCategory);
        counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
}

export const riskApproachSection: SectionDefinition = {
    sectionId: 'l2-risk-approach',
    title: 'Risk-Based Use of AI Systems',
    order: 400,
    level: 2,

    shouldInclude: () => true,

    buildContent(context) {
        const orgName = context.orgSettings.organisationName || '[Company Name]';
        const counts = countAiActCategories(context.useCases);

        const hochrisiko = counts['HIGH'] || 0;
        const transparenz = counts['LIMITED'] || 0;
        const minimal = counts['MINIMAL'] || 0;
        const verboten = counts['PROHIBITED'] || 0;
        const total = context.useCases.length;
        const unbewertet = counts['UNASSESSED'] || 0;

        const lines: string[] = [
            `${orgName} follows a risk-based approach to the introduction and operation ` +
            `of AI systems, as envisaged by the EU AI Act (Regulation (EU) 2024/1689).`,
            ``,
            `### Current Risk Distribution in the Register`,
            ``,
            `Based on the current AI register (${total} recorded systems), the following ` +
            `distribution applies:`,
            ``,
        ];

        if (total > 0) {
            lines.push(`| Risk Category | Count |`);
            lines.push(`|---------------|-------|`);
            if (verboten > 0) lines.push(`| ${getRiskClassDisplayLabel('PROHIBITED')} | ${verboten} |`);
            if (hochrisiko > 0) lines.push(`| ${getRiskClassDisplayLabel('HIGH')} | ${hochrisiko} |`);
            if (transparenz > 0) lines.push(`| ${getRiskClassDisplayLabel('LIMITED')} | ${transparenz} |`);
            if (minimal > 0) lines.push(`| ${getRiskClassDisplayLabel('MINIMAL')} | ${minimal} |`);
            if (unbewertet > 0) lines.push(`| ${getRiskClassDisplayLabel('UNASSESSED')} | ${unbewertet} |`);
            lines.push(``);
        } else {
            lines.push(
                `> *No AI systems have been recorded in the register yet. The risk assessment ` +
                `should be carried out once the systems have been captured.*`,
            );
            lines.push(``);
        }

        if (hochrisiko > 0) {
            lines.push(
                `**Note:** Your register contains ${hochrisiko} high-risk system${hochrisiko > 1 ? 's' : ''}` +
                `${transparenz > 0 ? ` and ${transparenz} system${transparenz > 1 ? 's' : ''} with limited risk (transparency obligations)` : ''}. ` +
                `Extended requirements under Chapter III of the AI Act apply to these.`,
            );
        } else if (transparenz > 0) {
            lines.push(
                `**Note:** Your register contains ${transparenz} system${transparenz > 1 ? 's' : ''} ` +
                `with limited risk (transparency obligations) under Art. 50 of the AI Act.`,
            );
        }

        lines.push(``);
        lines.push(
            `Each AI system should undergo a risk assessment before deployment. ` +
            `The assessment should cover at least the AI Act categorisation as well as an analysis ` +
            `of the affected groups of persons and data types.`,
        );

        return lines.join('\n');
    },
};
