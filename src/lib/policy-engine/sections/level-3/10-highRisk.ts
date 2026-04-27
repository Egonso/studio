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
import {
    getDecisionInfluenceLabel,
    resolveDecisionInfluence,
} from '@/lib/register-first/types';
import { resolveGovernanceCopyLocale } from '@/lib/i18n/governance-copy';

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
        const locale = resolveGovernanceCopyLocale(context.locale);
        const isGerman = locale === 'de';
        const orgName =
            context.orgSettings.organisationName ||
            (isGerman ? '[Firmenname]' : '[Company Name]');
        const affected = context.useCases.filter(isHighRisk);

        const lines: string[] = isGerman
            ? [
                `${orgName} betreibt ${affected.length} KI-System${affected.length > 1 ? 'e' : ''}, ` +
                `die als Hochrisiko eingestuft sind oder automatisierte Entscheidungen vorbereiten. ` +
                `Für diese gelten die erweiterten Anforderungen aus Kapitel III des AI Act.`,
                ``,
                `### Betroffene Systeme`,
                ``,
            ]
            : [
                `${orgName} operates ${affected.length} AI system${affected.length > 1 ? 's' : ''} ` +
                `that are classified as high-risk or prepare automated decisions. ` +
                `The extended requirements under Chapter III of the AI Act apply to these systems.`,
                ``,
                `### Affected Systems`,
                ``,
            ];

        for (const uc of affected) {
            const cat = getDisplayedRiskClassLabel({
                aiActCategory: uc.governanceAssessment?.core?.aiActCategory,
                short: true,
                locale,
            });
            const influence = resolveDecisionInfluence(uc);
            const influenceLabel = influence ? getDecisionInfluenceLabel(influence, locale) : '–';
            lines.push(
                isGerman
                    ? `- **${uc.purpose}** – Kategorie: ${cat}, Entscheidungseinfluss: ${influenceLabel}`
                    : `- **${uc.purpose}** – Category: ${cat}, decision influence: ${influenceLabel}`,
            );
        }
        lines.push(``);

        lines.push(isGerman ? `### Pflichten nach Kapitel III AI Act` : `### Obligations under Chapter III AI Act`);
        lines.push(``);
        lines.push(isGerman
            ? `Für die oben genannten Systeme sollten insbesondere folgende Anforderungen umgesetzt werden:`
            : `For the systems listed above, the following requirements should in particular be implemented:`);
        lines.push(``);
        if (isGerman) {
            lines.push(`1. **Risikomanagementsystem** (Art. 9): Ein dokumentiertes Risikomanagement sollte über den gesamten Lebenszyklus aufrechterhalten werden.`);
            lines.push(`2. **Daten- und Data-Governance** (Art. 10): Trainings-, Validierungs- und Testdaten sollten definierten Qualitätskriterien genügen.`);
            lines.push(`3. **Technische Dokumentation** (Art. 11): Funktionsweise, Grenzen und Risiken des Systems sollten vollständig dokumentiert werden.`);
            lines.push(`4. **Aufzeichnungspflichten** (Art. 12): Relevante Systemereignisse sollten nachvollziehbar protokolliert werden.`);
            lines.push(`5. **Informationen für Betreiber** (Art. 13): Betreiber sollten ausreichend Informationen erhalten, um das System sachgerecht einsetzen zu können.`);
            lines.push(`6. **Menschliche Aufsicht** (Art. 14): Eine angemessene menschliche Aufsicht sollte sichergestellt werden.`);
            lines.push(`7. **Genauigkeit, Robustheit, Cybersicherheit** (Art. 15): Das System sollte über seinen Lebenszyklus hinweg angemessen genau, robust und sicher sein.`);
        } else {
            lines.push(`1. **Risk management system** (Art. 9): A documented risk management process should be maintained throughout the lifecycle.`);
            lines.push(`2. **Data and data governance** (Art. 10): Training, validation and test data should meet defined quality criteria.`);
            lines.push(`3. **Technical documentation** (Art. 11): Functionality, limitations and risks of the system should be documented completely.`);
            lines.push(`4. **Record-keeping obligations** (Art. 12): Relevant system events should be logged in a traceable manner.`);
            lines.push(`5. **Information for deployers** (Art. 13): Deployers should receive sufficient information to use the system appropriately.`);
            lines.push(`6. **Human oversight** (Art. 14): Appropriate human oversight should be ensured.`);
            lines.push(`7. **Accuracy, robustness and cybersecurity** (Art. 15): The system should remain appropriately accurate, robust and secure throughout its lifecycle.`);
        }

        return lines.join('\n');
    },
};
