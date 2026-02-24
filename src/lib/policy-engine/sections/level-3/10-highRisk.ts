/**
 * Level 3, Section 10: Hochrisiko-Systeme
 *
 * Conditional: inkludiert wenn ≥1 UseCase mit aiActCategory 'Hochrisiko'
 * ODER resolveDecisionInfluence(uc) === 'AUTOMATED'.
 *
 * Listet betroffene Use Cases namentlich auf.
 * Referenz: AI Act Kapitel III (Art. 6–49), Anhang III
 *
 * Juristisch defensiv: Konjunktiv, "sollte" nicht "muss"
 * Sprint: PE-2b Level 3
 */

import type { SectionDefinition } from '../section-definition';
import type { UseCaseCard } from '@/lib/register-first/types';
import { resolveDecisionInfluence, DECISION_INFLUENCE_LABELS } from '@/lib/register-first/types';

/** Check if a use case qualifies as high-risk */
function isHighRisk(uc: UseCaseCard): boolean {
    const isHochrisiko = uc.governanceAssessment?.core?.aiActCategory === 'Hochrisiko';
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
        const orgName = context.orgSettings.organisationName || '[Firmenname]';
        const affected = context.useCases.filter(isHighRisk);

        const lines: string[] = [
            `${orgName} betreibt ${affected.length} KI-System${affected.length > 1 ? 'e' : ''}, ` +
            `die als Hochrisiko-Systeme eingestuft sind oder automatisierte Entscheidungen treffen. ` +
            `Für diese gelten erweiterte Anforderungen gemäß Kapitel III des AI Act.`,
            ``,
            `### Betroffene Systeme`,
            ``,
        ];

        for (const uc of affected) {
            const cat = uc.governanceAssessment?.core?.aiActCategory || '–';
            const influence = resolveDecisionInfluence(uc);
            const influenceLabel = influence ? DECISION_INFLUENCE_LABELS[influence] : '–';
            lines.push(
                `- **${uc.purpose}** – Kategorie: ${cat}, Entscheidungseinfluss: ${influenceLabel}`,
            );
        }
        lines.push(``);

        lines.push(`### Pflichten gemäß AI Act Kapitel III`);
        lines.push(``);
        lines.push(`Für die oben genannten Systeme sollten folgende Anforderungen umgesetzt werden:`);
        lines.push(``);
        lines.push(`1. **Risikomanagementsystem** (Art. 9): Ein dokumentiertes Risikomanagementsystem ` +
            `sollte über den gesamten Lebenszyklus des Systems aufrechterhalten werden.`);
        lines.push(`2. **Daten-Governance** (Art. 10): Trainings-, Validierungs- und Testdaten ` +
            `sollten definierten Qualitätskriterien genügen.`);
        lines.push(`3. **Technische Dokumentation** (Art. 11): Die Funktionsweise, Grenzen und ` +
            `Risiken des Systems sollten vollständig dokumentiert sein.`);
        lines.push(`4. **Aufzeichnungspflichten** (Art. 12): Automatische Protokollierung ` +
            `relevanter Systemereignisse sollte implementiert werden.`);
        lines.push(`5. **Transparenz** (Art. 13): Betreiber sollten über ausreichende Informationen ` +
            `verfügen, um das System sachgemäß einsetzen zu können.`);
        lines.push(`6. **Menschliche Aufsicht** (Art. 14): Eine angemessene menschliche ` +
            `Überwachung sollte sichergestellt sein.`);
        lines.push(`7. **Genauigkeit, Robustheit, Cybersicherheit** (Art. 15): Das System ` +
            `sollte über seinen Lebenszyklus hinweg angemessen genau, robust und sicher sein.`);

        return lines.join('\n');
    },
};
