/**
 * Level 3, Section 11: Transparenzpflichten
 *
 * Conditional: inkludiert wenn ≥1 UseCase mit aiActCategory 'Transparenzpflichten'.
 * Listet betroffene Systeme und beschreibt Art. 50 AI Act Pflichten.
 *
 * Juristisch defensiv: Konjunktiv, "sollte" nicht "muss"
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
        const orgName = context.orgSettings.organisationName || '[Firmenname]';
        const affected = context.useCases.filter(hasTransparencyObligation);

        const lines: string[] = [
            `Für ${affected.length} KI-System${affected.length > 1 ? 'e' : ''} von ${orgName} ` +
            `gelten Transparenzpflichten gemäß Art. 50 des EU AI Act.`,
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
        lines.push(`Folgende Transparenzpflichten sollten für die genannten Systeme umgesetzt werden:`);
        lines.push(``);
        lines.push(`1. **Interaktionspflicht** (Art. 50 Abs. 1): Personen, die mit einem KI-System ` +
            `interagieren, sollten darüber informiert werden, dass sie es mit einem KI-System zu tun haben ` +
            `– sofern dies nicht offensichtlich ist.`);
        lines.push(`2. **Kennzeichnung synthetischer Inhalte** (Art. 50 Abs. 2): KI-generierte Inhalte ` +
            `(Text, Audio, Bild, Video) sollten maschinenlesbar als solche gekennzeichnet werden.`);
        lines.push(`3. **Deepfake-Kennzeichnung** (Art. 50 Abs. 4): Wenn ein System Bild-, Audio- oder ` +
            `Videoinhalte erzeugt oder manipuliert, die realen Personen, Orten oder Ereignissen ähneln ` +
            `(„Deepfakes"), sollte dies offengelegt werden.`);
        lines.push(`4. **Emotionserkennung / Biometrie** (Art. 50 Abs. 3): Wenn ein System Emotionen ` +
            `erkennt oder biometrische Kategorisierungen vornimmt, sollten betroffene Personen ` +
            `darüber informiert werden.`);
        lines.push(``);
        lines.push(
            `Die Umsetzung der Transparenzpflichten sollte dokumentiert und im Rahmen ` +
            `der regelmäßigen Überprüfung kontrolliert werden.`,
        );

        return lines.join('\n');
    },
};
