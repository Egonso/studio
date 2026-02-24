/**
 * Level 3, Section 15: KI im Bewerbungsprozess (HR/Recruitment)
 *
 * Conditional: inkludiert wenn ≥1 UseCase mit usageContexts.includes('APPLICANTS').
 * conditionLabel: "Gilt für KI-Systeme im Bewerbungsprozess (Art. 6 AI Act Hochrisiko)"
 *
 * Referenz: Art. 6 Abs. 2 + Anhang III Nr. 4 EU AI Act
 * "Employment, workers management, access to self-employment"
 *
 * Juristisch defensiv: Konjunktiv, "sollte" nicht "muss"
 * Sprint: PE-2b Level 3
 */

import type { SectionDefinition } from '../section-definition';
import type { UseCaseCard } from '@/lib/register-first/types';

/** Check if a use case involves applicants/recruitment */
function isRecruitmentUseCase(uc: UseCaseCard): boolean {
    return uc.usageContexts?.includes('APPLICANTS') ?? false;
}

export const hrRecruitmentSection: SectionDefinition = {
    sectionId: 'l3-hr-recruitment',
    title: 'KI-Systeme im Bewerbungs- und HR-Prozess',
    order: 1600,
    level: 3,

    shouldInclude(context) {
        return context.useCases.some(isRecruitmentUseCase);
    },

    buildContent(context) {
        const orgName = context.orgSettings.organisationName || '[Firmenname]';
        const affected = context.useCases.filter(isRecruitmentUseCase);

        const lines: string[] = [
            `${orgName} setzt ${affected.length} KI-System${affected.length > 1 ? 'e' : ''} ein, ` +
            `die im Bewerbungs- oder Personalauswahlprozess Anwendung finden. ` +
            `Gemäß Art. 6 Abs. 2 in Verbindung mit Anhang III Nr. 4 des EU AI Act ` +
            `gelten KI-Systeme in den Bereichen Beschäftigung, Arbeitnehmersteuerung ` +
            `und Zugang zur Selbständigkeit als **Hochrisiko-Systeme**.`,
            ``,
            `### Betroffene Systeme`,
            ``,
        ];

        for (const uc of affected) {
            const cat = uc.governanceAssessment?.core?.aiActCategory || 'Noch nicht bewertet';
            lines.push(`- **${uc.purpose}** – AI-Act-Kategorie: ${cat}`);
        }
        lines.push(``);

        lines.push(`### Besondere Anforderungen für HR/Recruitment-KI`);
        lines.push(``);
        lines.push(`1. **Hochrisiko-Einstufung:** KI-Systeme, die für die Einstellung, ` +
            `das Screening oder die Filterung von Bewerbungen verwendet werden, fallen ` +
            `unter die Hochrisiko-Kategorie des AI Act (Anhang III, Nr. 4a).`);
        lines.push(`2. **Nicht-Diskriminierung:** Das System sollte regelmäßig auf ` +
            `Bias und Diskriminierung geprüft werden, insbesondere hinsichtlich Geschlecht, ` +
            `Alter, Herkunft, Behinderung und weiterer geschützter Merkmale (AGG, Art. 10 AI Act).`);
        lines.push(`3. **Transparenz gegenüber Bewerber*innen:** Bewerber*innen sollten ` +
            `darüber informiert werden, dass KI im Auswahlprozess eingesetzt wird. ` +
            `Art und Umfang der KI-Nutzung sollten verständlich kommuniziert werden.`);
        lines.push(`4. **Menschliche Aufsicht:** Endgültige Personalentscheidungen ` +
            `(Einladung zum Gespräch, Absage, Einstellung) sollten immer durch einen ` +
            `Menschen getroffen oder bestätigt werden.`);
        lines.push(`5. **Datenschutz:** Bewerberdaten unterliegen besonderen ` +
            `Datenschutzanforderungen (§ 26 BDSG / Art. 88 DSGVO). Die Rechtsgrundlage ` +
            `und Speicherfristen sollten klar definiert sein.`);
        lines.push(`6. **Löschfristen:** Bewerberdaten sollten nach Abschluss des ` +
            `Verfahrens und Ablauf der AGG-Klagefrist (in der Regel 6 Monate) ` +
            `gelöscht werden, sofern keine anderslautende Einwilligung vorliegt.`);
        lines.push(``);
        lines.push(
            `> *Hinweis: Die Anforderungen an Hochrisiko-Systeme gemäß Kapitel III AI Act ` +
            `(Art. 9–15) gelten für diese Systeme vollumfänglich. ` +
            `Siehe auch Abschnitt „Anforderungen an Hochrisiko-KI-Systeme".*`,
        );

        return lines.join('\n');
    },
};
