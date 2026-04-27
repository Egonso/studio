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
import { resolveGovernanceCopyLocale } from '@/lib/i18n/governance-copy';
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
        const locale = resolveGovernanceCopyLocale(context.locale);
        const isGerman = locale === 'de';
        const orgName =
            context.orgSettings.organisationName ||
            (isGerman ? '[Firmenname]' : '[Company Name]');
        const counts = countAiActCategories(context.useCases);

        const hochrisiko = counts['HIGH'] || 0;
        const transparenz = counts['LIMITED'] || 0;
        const minimal = counts['MINIMAL'] || 0;
        const verboten = counts['PROHIBITED'] || 0;
        const total = context.useCases.length;
        const unbewertet = counts['UNASSESSED'] || 0;

        const lines: string[] = isGerman
            ? [
                `${orgName} verfolgt einen risikobasierten Ansatz für die Einführung und den Betrieb ` +
                `von KI-Systemen im Sinne des EU AI Act (Verordnung (EU) 2024/1689).`,
                ``,
                `### Aktuelle Risikoverteilung im Register`,
                ``,
                `Auf Basis des aktuellen KI-Registers (${total} erfasste Systeme) ergibt sich folgende ` +
                `Verteilung:`,
                ``,
            ]
            : [
                `${orgName} follows a risk-based approach to the introduction and operation ` +
                `of AI systems under the EU AI Act (Regulation (EU) 2024/1689).`,
                ``,
                `### Current Risk Distribution in the Register`,
                ``,
                `Based on the current AI register (${total} recorded systems), the following ` +
                `distribution applies:`,
                ``,
            ];

        if (total > 0) {
            lines.push(isGerman ? `| Risikokategorie | Anzahl |` : `| Risk category | Count |`);
            lines.push(`|-----------------|--------|`);
            if (verboten > 0) lines.push(`| ${getRiskClassDisplayLabel('PROHIBITED', locale)} | ${verboten} |`);
            if (hochrisiko > 0) lines.push(`| ${getRiskClassDisplayLabel('HIGH', locale)} | ${hochrisiko} |`);
            if (transparenz > 0) lines.push(`| ${getRiskClassDisplayLabel('LIMITED', locale)} | ${transparenz} |`);
            if (minimal > 0) lines.push(`| ${getRiskClassDisplayLabel('MINIMAL', locale)} | ${minimal} |`);
            if (unbewertet > 0) lines.push(`| ${getRiskClassDisplayLabel('UNASSESSED', locale)} | ${unbewertet} |`);
            lines.push(``);
        } else {
            lines.push(
                isGerman
                    ? `> *Es wurden noch keine KI-Systeme im Register erfasst. Die Risikoprüfung ` +
                    `sollte erfolgen, sobald die Systeme dokumentiert sind.*`
                    : `> *No AI systems have been recorded in the register yet. The risk review ` +
                    `should be completed as soon as systems are documented.*`,
            );
            lines.push(``);
        }

        if (hochrisiko > 0) {
            lines.push(
                isGerman
                    ? `**Hinweis:** Ihr Register enthält ${hochrisiko} Hochrisiko-System${hochrisiko > 1 ? 'e' : ''}` +
                    `${transparenz > 0 ? ` und ${transparenz} System${transparenz > 1 ? 'e' : ''} mit begrenztem Risiko (Transparenzpflichten)` : ''}. ` +
                    `Für diese gelten die erweiterten Anforderungen aus Kapitel III des AI Act.`
                    : `**Note:** Your register contains ${hochrisiko} high-risk system${hochrisiko > 1 ? 's' : ''}` +
                    `${transparenz > 0 ? ` and ${transparenz} limited-risk system${transparenz > 1 ? 's' : ''} with transparency obligations` : ''}. ` +
                    `The extended requirements under Chapter III of the AI Act apply to these systems.`,
            );
        } else if (transparenz > 0) {
            lines.push(
                isGerman
                    ? `**Hinweis:** Ihr Register enthält ${transparenz} System${transparenz > 1 ? 'e' : ''} ` +
                    `mit begrenztem Risiko (Transparenzpflichten) nach Art. 50 AI Act.`
                    : `**Note:** Your register contains ${transparenz} limited-risk system${transparenz > 1 ? 's' : ''} ` +
                    `with transparency obligations under Art. 50 AI Act.`,
            );
        }

        lines.push(``);
        lines.push(isGerman
            ? `Jedes KI-System sollte vor dem Einsatz risikobasiert bewertet werden. ` +
            `Die Bewertung sollte mindestens die AI-Act-Kategorisierung sowie eine Analyse ` +
            `der betroffenen Personengruppen und Datenarten umfassen.`
            : `Each AI system should be assessed on a risk basis before deployment. ` +
            `The assessment should cover at least the AI Act categorisation as well as ` +
            `an analysis of affected groups of persons and data categories.`);

        return lines.join('\n');
    },
};
