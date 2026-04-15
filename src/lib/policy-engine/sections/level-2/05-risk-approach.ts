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
    title: 'Risikobasierter Einsatz von KI-Systemen',
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
            `${orgName} verfolgt einen risikobasierten Ansatz für die Einführung und den Betrieb ` +
            `von KI-Systemen im Sinne des EU AI Act (Verordnung (EU) 2024/1689).`,
            ``,
            `### Aktuelle Risikoverteilung im Register`,
            ``,
            `Auf Basis des aktuellen KI-Registers (${total} erfasste Systeme) ergibt sich folgende ` +
            `Verteilung:`,
            ``,
        ];

        if (total > 0) {
            lines.push(`| Risikokategorie | Anzahl |`);
            lines.push(`|-----------------|--------|`);
            if (verboten > 0) lines.push(`| ${getRiskClassDisplayLabel('PROHIBITED')} | ${verboten} |`);
            if (hochrisiko > 0) lines.push(`| ${getRiskClassDisplayLabel('HIGH')} | ${hochrisiko} |`);
            if (transparenz > 0) lines.push(`| ${getRiskClassDisplayLabel('LIMITED')} | ${transparenz} |`);
            if (minimal > 0) lines.push(`| ${getRiskClassDisplayLabel('MINIMAL')} | ${minimal} |`);
            if (unbewertet > 0) lines.push(`| ${getRiskClassDisplayLabel('UNASSESSED')} | ${unbewertet} |`);
            lines.push(``);
        } else {
            lines.push(
                `> *Es wurden noch keine KI-Systeme im Register erfasst. Die Risikoprüfung ` +
                `sollte erfolgen, sobald die Systeme dokumentiert sind.*`,
            );
            lines.push(``);
        }

        if (hochrisiko > 0) {
            lines.push(
                `**Hinweis:** Ihr Register enthält ${hochrisiko} Hochrisiko-System${hochrisiko > 1 ? 'e' : ''}` +
                `${transparenz > 0 ? ` und ${transparenz} System${transparenz > 1 ? 'e' : ''} mit begrenztem Risiko (Transparenzpflichten)` : ''}. ` +
                `Für diese gelten die erweiterten Anforderungen aus Kapitel III des AI Act.`,
            );
        } else if (transparenz > 0) {
            lines.push(
                `**Hinweis:** Ihr Register enthält ${transparenz} System${transparenz > 1 ? 'e' : ''} ` +
                `mit begrenztem Risiko (Transparenzpflichten) nach Art. 50 AI Act.`,
            );
        }

        lines.push(``);
        lines.push(
            `Jedes KI-System sollte vor dem Einsatz risikobasiert bewertet werden. ` +
            `Die Bewertung sollte mindestens die AI-Act-Kategorisierung sowie eine Analyse ` +
            `der betroffenen Personengruppen und Datenarten umfassen.`,
        );

        return lines.join('\n');
    },
};
