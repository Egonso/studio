/**
 * Level 2, Section 05: Risikobasierter Einsatz
 *
 * Zählt AI Act Risiko-Kategorien aus dem Register und stellt
 * den risikobasierten Ansatz der Organisation dar.
 *
 * Immer inkludiert bei Level 2.
 * Juristisch defensiv: Konjunktiv, "sollte" nicht "muss"
 * Sprint: PE-2b Level 2
 */

import type { SectionDefinition } from '../section-definition';
import type { UseCaseCard } from '@/lib/register-first/types';

/** Count AI Act categories from registered use cases */
function countAiActCategories(useCases: UseCaseCard[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const uc of useCases) {
        const cat = uc.governanceAssessment?.core?.aiActCategory;
        if (cat) {
            counts[cat] = (counts[cat] || 0) + 1;
        }
    }
    return counts;
}

export const riskApproachSection: SectionDefinition = {
    sectionId: 'l2-risk-approach',
    title: 'Risikobasierter Einsatz von KI-Systemen',
    order: 400,
    level: 2,

    shouldInclude: () => true,

    buildContent(context) {
        const orgName = context.orgSettings.organisationName || '[Firmenname]';
        const counts = countAiActCategories(context.useCases);

        const hochrisiko = counts['Hochrisiko'] || 0;
        const transparenz = counts['Transparenzpflichten'] || 0;
        const minimal = counts['Minimalrisiko'] || 0;
        const verboten = counts['Verbotene Praktiken'] || 0;
        const total = context.useCases.length;
        const unbewertet = total - Object.values(counts).reduce((a, b) => a + b, 0);

        const lines: string[] = [
            `${orgName} verfolgt einen risikobasierten Ansatz bei der Einführung und dem ` +
            `Betrieb von KI-Systemen, wie es der EU AI Act (Verordnung (EU) 2024/1689) vorsieht.`,
            ``,
            `### Aktuelle Risikoverteilung im Register`,
            ``,
            `Basierend auf dem aktuellen KI-Register (${total} erfasste Systeme) ergibt sich ` +
            `folgende Verteilung:`,
            ``,
        ];

        if (total > 0) {
            lines.push(`| Risikokategorie | Anzahl |`);
            lines.push(`|-----------------|--------|`);
            if (verboten > 0) lines.push(`| Verbotene Praktiken | ${verboten} |`);
            if (hochrisiko > 0) lines.push(`| Hochrisiko-Systeme | ${hochrisiko} |`);
            if (transparenz > 0) lines.push(`| Systeme mit Transparenzpflichten | ${transparenz} |`);
            if (minimal > 0) lines.push(`| Minimalrisiko-Systeme | ${minimal} |`);
            if (unbewertet > 0) lines.push(`| Noch nicht bewertet | ${unbewertet} |`);
            lines.push(``);
        } else {
            lines.push(
                `> *Es sind noch keine KI-Systeme im Register erfasst. Die Risikobewertung ` +
                `sollte nach Erfassung der Systeme durchgeführt werden.*`,
            );
            lines.push(``);
        }

        if (hochrisiko > 0) {
            lines.push(
                `**Hinweis:** Ihr Register enthält ${hochrisiko} Hochrisiko-System${hochrisiko > 1 ? 'e' : ''}` +
                `${transparenz > 0 ? ` und ${transparenz} System${transparenz > 1 ? 'e' : ''} mit Transparenzpflichten` : ''}. ` +
                `Für diese gelten erweiterte Anforderungen gemäß Kapitel III des AI Act.`,
            );
        } else if (transparenz > 0) {
            lines.push(
                `**Hinweis:** Ihr Register enthält ${transparenz} System${transparenz > 1 ? 'e' : ''} ` +
                `mit Transparenzpflichten gemäß Art. 50 AI Act.`,
            );
        }

        lines.push(``);
        lines.push(
            `Jedes KI-System sollte vor Inbetriebnahme einer Risikobewertung unterzogen werden. ` +
            `Die Bewertung sollte mindestens die AI-Act-Kategorisierung sowie eine Analyse ` +
            `der betroffenen Personengruppen und Datenarten umfassen.`,
        );

        return lines.join('\n');
    },
};
