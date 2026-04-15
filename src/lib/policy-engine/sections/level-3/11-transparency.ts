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
    title: 'Transparenzpflichten',
    order: 1200,
    level: 3,

    shouldInclude(context) {
        return context.useCases.some(hasTransparencyObligation);
    },

    buildContent(context) {
        const orgName = context.orgSettings.organisationName || '[Company Name]';
        const affected = context.useCases.filter(hasTransparencyObligation);

        const lines: string[] = [
            `Transparenzpflichten nach Art. 50 des EU AI Act gelten für ` +
            `${affected.length} KI-System${affected.length > 1 ? 'e' : ''} von ${orgName}.`,
            ``,
            `### Betroffene Systeme`,
            ``,
        ];

        for (const uc of affected) {
            const category = getDisplayedRiskClassLabel({
                aiActCategory: uc.governanceAssessment?.core?.aiActCategory,
                short: true,
            });
            lines.push(`- **${uc.purpose}** – Kategorie: ${category}`);
        }
        lines.push(``);

        lines.push(`### Anforderungen nach Art. 50 AI Act`);
        lines.push(``);
        lines.push(`Für die aufgeführten Systeme sollten insbesondere folgende Transparenzpflichten umgesetzt werden:`);
        lines.push(``);
        lines.push(`1. **Interaktionspflicht** (Art. 50 Abs. 1): Personen, die mit einem KI-System interagieren, sollten darüber informiert werden, sofern dies nicht offensichtlich ist.`);
        lines.push(`2. **Kennzeichnung synthetischer Inhalte** (Art. 50 Abs. 2): KI-generierte Inhalte wie Text, Audio, Bild oder Video sollten maschinenlesbar als künstlich erzeugt oder manipuliert gekennzeichnet werden.`);
        lines.push(`3. **Deep-Fake-Kennzeichnung** (Art. 50 Abs. 4): Werden Bild-, Ton- oder Videoinhalte erzeugt oder manipuliert, die realen Personen, Orten oder Ereignissen ähneln, sollte dies offengelegt werden.`);
        lines.push(`4. **Emotionserkennung / Biometrie** (Art. 50 Abs. 3): Werden Emotionen erkannt oder biometrische Kategorien gebildet, sollten betroffene Personen darüber informiert werden.`);
        lines.push(``);
        lines.push(
            `Die Umsetzung der Transparenzpflichten sollte dokumentiert und im Rahmen der regelmäßigen Reviews überprüft werden.`,
        );

        return lines.join('\n');
    },
};
