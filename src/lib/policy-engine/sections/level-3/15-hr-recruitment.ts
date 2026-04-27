/**
 * Level 3, Section 15: AI in the Recruitment Process (HR/Recruitment)
 *
 * Conditional: included when >= 1 use case has usageContexts.includes('APPLICANTS').
 * conditionLabel: "Applies to AI systems in the recruitment process (Art. 6 AI Act – High-risk)"
 *
 * Reference: Art. 6(2) + Annex III No. 4 EU AI Act
 * "Employment, workers management, access to self-employment"
 *
 * Legally defensive: subjunctive, "should", not "must"
 * Sprint: PE-2b Level 3
 */

import type { SectionDefinition } from '../section-definition';
import type { UseCaseCard } from '@/lib/register-first/types';
import { resolveGovernanceCopyLocale } from '@/lib/i18n/governance-copy';

/** Check if a use case involves applicants/recruitment */
function isRecruitmentUseCase(uc: UseCaseCard): boolean {
    return uc.usageContexts?.includes('APPLICANTS') ?? false;
}

export const hrRecruitmentSection: SectionDefinition = {
    sectionId: 'l3-hr-recruitment',
    title: 'AI Systems in the Recruitment & HR Process',
    order: 1600,
    level: 3,

    shouldInclude(context) {
        return context.useCases.some(isRecruitmentUseCase);
    },

    buildContent(context) {
        const locale = resolveGovernanceCopyLocale(context.locale);
        const isGerman = locale === 'de';
        const orgName =
            context.orgSettings.organisationName ||
            (isGerman ? '[Firmenname]' : '[Company Name]');
        const affected = context.useCases.filter(isRecruitmentUseCase);

        const lines: string[] = isGerman
            ? [
                `${orgName} setzt ${affected.length} KI-System${affected.length > 1 ? 'e' : ''} ein, ` +
                `die im Bewerbungs- oder Personalauswahlprozess genutzt werden. ` +
                `Nach Art. 6 Abs. 2 in Verbindung mit Anhang III Nr. 4 des EU AI Act ` +
                `sind KI-Systeme in Beschäftigung, Personalmanagement und Zugang zur Selbständigkeit ` +
                `als **Hochrisiko-Systeme** einzuordnen.`,
                ``,
                `### Betroffene Systeme`,
                ``,
            ]
            : [
                `${orgName} deploys ${affected.length} AI system${affected.length > 1 ? 's' : ''} ` +
                `used in the recruitment or personnel selection process. ` +
                `Pursuant to Art. 6(2) in conjunction with Annex III No. 4 of the EU AI Act, ` +
                `AI systems in the areas of employment, workers management ` +
                `and access to self-employment are classified as **high-risk systems**.`,
                ``,
                `### Affected Systems`,
                ``,
            ];

        for (const uc of affected) {
            const cat = uc.governanceAssessment?.core?.aiActCategory || (isGerman ? 'Noch nicht bewertet' : 'Not yet assessed');
            lines.push(isGerman
                ? `- **${uc.purpose}** – AI-Act-Kategorie: ${cat}`
                : `- **${uc.purpose}** – AI Act category: ${cat}`);
        }
        lines.push(``);

        lines.push(isGerman ? `### Besondere Anforderungen für HR-/Recruiting-KI` : `### Special Requirements for HR/Recruitment AI`);
        lines.push(``);
        if (isGerman) {
            lines.push(`1. **Hochrisiko-Klassifizierung:** KI-Systeme für Einstellung, Screening oder Filterung von Bewerbungen fallen in die Hochrisiko-Kategorie des AI Act (Anhang III Nr. 4a).`);
            lines.push(`2. **Nichtdiskriminierung:** Das System sollte regelmäßig auf Bias und Diskriminierung geprüft werden, insbesondere hinsichtlich Geschlecht, Alter, Herkunft, Behinderung und anderer geschützter Merkmale (Art. 10 AI Act - Daten und Data Governance).`);
            lines.push(`3. **Transparenz gegenüber Bewerbenden:** Bewerbende sollten darüber informiert werden, dass KI im Auswahlprozess eingesetzt wird. Art und Umfang der KI-Nutzung sollten verständlich kommuniziert werden.`);
            lines.push(`4. **Menschliche Aufsicht:** Finale Personalentscheidungen (Einladung, Ablehnung, Einstellung) sollten stets von einem Menschen getroffen oder bestätigt werden.`);
            lines.push(`5. **Datenschutz:** Bewerberdaten unterliegen besonderen Datenschutzanforderungen (Art. 88 DSGVO). Rechtsgrundlage und Aufbewahrungsfristen sollten klar definiert werden.`);
            lines.push(`6. **Löschfristen:** Bewerberdaten sollten nach Abschluss des Prozesses und Ablauf der anwendbaren Verjährungsfrist gelöscht werden (typischerweise 6 Monate), sofern keine gesonderte Einwilligung vorliegt.`);
        } else {
            lines.push(`1. **High-Risk Classification:** AI systems used for hiring, ` +
                `screening or filtering applications fall under the high-risk category ` +
                `of the AI Act (Annex III, No. 4a).`);
            lines.push(`2. **Non-Discrimination:** The system should be regularly tested for ` +
                `bias and discrimination, particularly with regard to gender, ` +
                `age, origin, disability and other protected characteristics (Art. 10 AI Act - Data and Data Governance).`);
            lines.push(`3. **Transparency towards Applicants:** Applicants should ` +
                `be informed that AI is used in the selection process. ` +
                `The nature and extent of AI use should be communicated in an understandable manner.`);
            lines.push(`4. **Human Oversight:** Final personnel decisions ` +
                `(invitation to interview, rejection, hiring) should always be made or ` +
                `confirmed by a human.`);
            lines.push(`5. **Data Protection:** Applicant data is subject to specific ` +
                `data protection requirements (Art. 88 GDPR). The legal basis ` +
                `and retention periods should be clearly defined.`);
            lines.push(`6. **Deletion Periods:** Applicant data should be deleted after completion of ` +
                `the process and expiry of the applicable limitation period ` +
                `(typically 6 months), unless separate consent has been obtained.`);
        }
        lines.push(``);
        lines.push(
            isGerman
                ? `> *Hinweis: Die Anforderungen für Hochrisiko-Systeme nach Kapitel III des AI Act ` +
                `(Art. 9-15) gelten für diese Systeme vollständig. Siehe auch den Abschnitt ` +
                `"Anforderungen an Hochrisiko-KI-Systeme".*`
                : `> *Note: The requirements for high-risk systems under Chapter III of the AI Act ` +
                `(Art. 9-15) apply in full to these systems. ` +
                `See also the section "Requirements for High-Risk AI Systems".*`,
        );

        return lines.join('\n');
    },
};
