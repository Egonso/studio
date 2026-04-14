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
        const orgName = context.orgSettings.organisationName || '[Company Name]';
        const affected = context.useCases.filter(isRecruitmentUseCase);

        const lines: string[] = [
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
            const cat = uc.governanceAssessment?.core?.aiActCategory || 'Not yet assessed';
            lines.push(`- **${uc.purpose}** – AI Act category: ${cat}`);
        }
        lines.push(``);

        lines.push(`### Special Requirements for HR/Recruitment AI`);
        lines.push(``);
        lines.push(`1. **High-Risk Classification:** AI systems used for hiring, ` +
            `screening or filtering applications fall under the high-risk category ` +
            `of the AI Act (Annex III, No. 4a).`);
        lines.push(`2. **Non-Discrimination:** The system should be regularly tested for ` +
            `bias and discrimination, particularly with regard to gender, ` +
            `age, origin, disability and other protected characteristics (Art. 10 AI Act – Data and Data Governance).`);
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
        lines.push(``);
        lines.push(
            `> *Note: The requirements for high-risk systems under Chapter III of the AI Act ` +
            `(Art. 9–15) apply in full to these systems. ` +
            `See also the section "Requirements for High-Risk AI Systems".*`,
        );

        return lines.join('\n');
    },
};
