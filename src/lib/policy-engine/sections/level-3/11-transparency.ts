/**
 * Level 3, Section 11: Transparency Obligations
 *
 * Conditional: included when >= 1 use case has aiActCategory 'Limited risk'.
 * Lists affected systems and describes Art. 50 AI Act obligations.
 *
 * Legally defensive: subjunctive, "should", not "must"
 * Sprint: PE-2b Level 3
 */

import type { SectionDefinition } from '../section-definition';
import {
    getDisplayedRiskClassLabel,
    isLimitedRiskClass,
    parseStoredAiActCategory,
} from '@/lib/register-first/risk-taxonomy';
import type { UseCaseCard } from '@/lib/register-first/types';

/** Check if a use case has transparency obligations */
function hasTransparencyObligation(uc: UseCaseCard): boolean {
    return isLimitedRiskClass(
        parseStoredAiActCategory(uc.governanceAssessment?.core?.aiActCategory)
    );
}

export const transparencySection: SectionDefinition = {
    sectionId: 'l3-transparency',
    title: 'Transparency Obligations',
    order: 1200,
    level: 3,

    shouldInclude(context) {
        return context.useCases.some(hasTransparencyObligation);
    },

    buildContent(context) {
        const orgName = context.orgSettings.organisationName || '[Company Name]';
        const affected = context.useCases.filter(hasTransparencyObligation);

        const lines: string[] = [
            `Transparency obligations under Art. 50 of the EU AI Act apply to ` +
            `${affected.length} AI system${affected.length > 1 ? 's' : ''} of ${orgName}.`,
            ``,
            `### Affected Systems`,
            ``,
        ];

        for (const uc of affected) {
            const category = getDisplayedRiskClassLabel({
                aiActCategory: uc.governanceAssessment?.core?.aiActCategory,
                short: true,
            });
            lines.push(`- **${uc.purpose}** – Category: ${category}`);
        }
        lines.push(``);

        lines.push(`### Requirements under Art. 50 AI Act`);
        lines.push(``);
        lines.push(`The following transparency obligations should be implemented for the listed systems:`);
        lines.push(``);
        lines.push(`1. **Interaction Obligation** (Art. 50(1)): Persons interacting with an AI system ` +
            `should be informed that they are dealing with an AI system ` +
            `– unless this is obvious from the circumstances.`);
        lines.push(`2. **Labelling of Synthetic Content** (Art. 50(2)): AI-generated content ` +
            `(text, audio, image, video) should be labelled as such in a machine-readable manner.`);
        lines.push(`3. **Deep Fake Labelling** (Art. 50(4)): Where a system generates or manipulates image, audio or ` +
            `video content resembling real persons, places or events ` +
            `("deep fakes"), this should be disclosed.`);
        lines.push(`4. **Emotion Recognition / Biometrics** (Art. 50(3)): Where a system recognises emotions ` +
            `or performs biometric categorisation, affected persons ` +
            `should be informed accordingly.`);
        lines.push(``);
        lines.push(
            `The implementation of transparency obligations should be documented and verified ` +
            `as part of the regular review process.`,
        );

        return lines.join('\n');
    },
};
