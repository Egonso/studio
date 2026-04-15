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
    title: 'Anforderungen an Hochrisiko-KI-Systeme',
    order: 1100,
    level: 3,

    shouldInclude(context) {
        return context.useCases.some(isHighRisk);
    },

    buildContent(context) {
        const orgName = context.orgSettings.organisationName || '[Company Name]';
        const affected = context.useCases.filter(isHighRisk);

        const lines: string[] = [
            `${orgName} betreibt ${affected.length} KI-System${affected.length > 1 ? 'e' : ''}, ` +
            `die als Hochrisiko eingestuft sind oder automatisierte Entscheidungen vorbereiten. ` +
            `Für diese gelten die erweiterten Anforderungen aus Kapitel III des AI Act.`,
            ``,
            `### Betroffene Systeme`,
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
                `- **${uc.purpose}** – Kategorie: ${cat}, Entscheidungseinfluss: ${influenceLabel}`,
            );
        }
        lines.push(``);

        lines.push(`### Pflichten nach Kapitel III AI Act`);
        lines.push(``);
        lines.push(`Für die oben genannten Systeme sollten insbesondere folgende Anforderungen umgesetzt werden:`);
        lines.push(``);
        lines.push(`1. **Risikomanagementsystem** (Art. 9): Ein dokumentiertes Risikomanagement sollte über den gesamten Lebenszyklus aufrechterhalten werden.`);
        lines.push(`2. **Daten- und Data-Governance** (Art. 10): Trainings-, Validierungs- und Testdaten sollten definierten Qualitätskriterien genügen.`);
        lines.push(`3. **Technische Dokumentation** (Art. 11): Funktionsweise, Grenzen und Risiken des Systems sollten vollständig dokumentiert werden.`);
        lines.push(`4. **Aufzeichnungspflichten** (Art. 12): Relevante Systemereignisse sollten nachvollziehbar protokolliert werden.`);
        lines.push(`5. **Informationen für Betreiber** (Art. 13): Betreiber sollten ausreichend Informationen erhalten, um das System sachgerecht einsetzen zu können.`);
        lines.push(`6. **Menschliche Aufsicht** (Art. 14): Eine angemessene menschliche Aufsicht sollte sichergestellt werden.`);
        lines.push(`7. **Genauigkeit, Robustheit, Cybersicherheit** (Art. 15): Das System sollte über seinen Lebenszyklus hinweg angemessen genau, robust und sicher sein.`);

        return lines.join('\n');
    },
};
