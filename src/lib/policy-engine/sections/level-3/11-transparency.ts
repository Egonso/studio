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
import { resolveGovernanceCopyLocale } from '@/lib/i18n/governance-copy';

/** Check if a use case has transparency obligations */
function hasTransparencyObligation(uc: UseCaseCard): boolean {
    return isLimitedRiskClass(
        parseStoredAiActCategory(uc.governanceAssessment?.core?.aiActCategory)
    );
}

export const transparencySection: SectionDefinition = {
    sectionId: 'l3-transparency',
    title: 'Transparenzpflichten',
    order: 1200,
    level: 3,

    shouldInclude(context) {
        return context.useCases.some(hasTransparencyObligation);
    },

    buildContent(context) {
        const locale = resolveGovernanceCopyLocale(context.locale);
        const isGerman = locale === 'de';
        const orgName =
            context.orgSettings.organisationName ||
            (isGerman ? '[Firmenname]' : '[Company Name]');
        const affected = context.useCases.filter(hasTransparencyObligation);

        const lines: string[] = isGerman
            ? [
                `Transparenzpflichten nach Art. 50 des EU AI Act gelten für ` +
                `${affected.length} KI-System${affected.length > 1 ? 'e' : ''} von ${orgName}.`,
                ``,
                `### Betroffene Systeme`,
                ``,
            ]
            : [
                `Transparency obligations under Art. 50 of the EU AI Act apply to ` +
                `${affected.length} AI system${affected.length > 1 ? 's' : ''} operated by ${orgName}.`,
                ``,
                `### Affected Systems`,
                ``,
            ];

        for (const uc of affected) {
            const category = getDisplayedRiskClassLabel({
                aiActCategory: uc.governanceAssessment?.core?.aiActCategory,
                short: true,
                locale,
            });
            lines.push(isGerman
                ? `- **${uc.purpose}** – Kategorie: ${category}`
                : `- **${uc.purpose}** – Category: ${category}`);
        }
        lines.push(``);

        lines.push(isGerman ? `### Anforderungen nach Art. 50 AI Act` : `### Requirements under Art. 50 AI Act`);
        lines.push(``);
        lines.push(isGerman
            ? `Für die aufgeführten Systeme sollten insbesondere folgende Transparenzpflichten umgesetzt werden:`
            : `For the listed systems, the following transparency obligations should in particular be implemented:`);
        lines.push(``);
        if (isGerman) {
            lines.push(`1. **Interaktionspflicht** (Art. 50 Abs. 1): Personen, die mit einem KI-System interagieren, sollten darüber informiert werden, sofern dies nicht offensichtlich ist.`);
            lines.push(`2. **Kennzeichnung synthetischer Inhalte** (Art. 50 Abs. 2): KI-generierte Inhalte wie Text, Audio, Bild oder Video sollten maschinenlesbar als künstlich erzeugt oder manipuliert gekennzeichnet werden.`);
            lines.push(`3. **Deep-Fake-Kennzeichnung** (Art. 50 Abs. 4): Werden Bild-, Ton- oder Videoinhalte erzeugt oder manipuliert, die realen Personen, Orten oder Ereignissen ähneln, sollte dies offengelegt werden.`);
            lines.push(`4. **Emotionserkennung / Biometrie** (Art. 50 Abs. 3): Werden Emotionen erkannt oder biometrische Kategorien gebildet, sollten betroffene Personen darüber informiert werden.`);
        } else {
            lines.push(`1. **Interaction disclosure** (Art. 50(1)): Persons interacting with an AI system should be informed where this is not obvious.`);
            lines.push(`2. **Labelling synthetic content** (Art. 50(2)): AI-generated text, audio, image or video content should be machine-readable as artificially generated or manipulated.`);
            lines.push(`3. **Deep fake disclosure** (Art. 50(4)): Generated or manipulated image, audio or video content resembling real persons, places or events should be disclosed.`);
            lines.push(`4. **Emotion recognition / biometrics** (Art. 50(3)): Where emotions are recognised or biometric categories are inferred, affected persons should be informed.`);
        }
        lines.push(``);
        lines.push(
            isGerman
                ? `Die Umsetzung der Transparenzpflichten sollte dokumentiert und im Rahmen der regelmäßigen Reviews überprüft werden.`
                : `Implementation of the transparency obligations should be documented and reviewed as part of the regular review cycle.`,
        );

        return lines.join('\n');
    },
};
