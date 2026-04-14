/**
 * Level 2, Section 07: Training & Qualification
 *
 * Describes training requirements for AI literacy.
 * Always included at Level >= 2.
 * Populated from orgSettings.competencyMatrix if available.
 *
 * Reference: Art. 4 AI Act (AI Literacy)
 * Legally defensive: subjunctive, "should", not "must"
 * Sprint: PE-2b Level 2
 */

import type { SectionDefinition } from '../section-definition';

export const trainingSection: SectionDefinition = {
    sectionId: 'l2-training',
    title: 'Training & Qualification',
    order: 600,
    level: 2,

    shouldInclude: () => true,

    buildContent(context) {
        const orgName = context.orgSettings.organisationName || '[Company Name]';
        const matrix = context.orgSettings.competencyMatrix;

        const lines: string[] = [
            `In accordance with Art. 4 of the EU AI Act (AI Literacy), providers and deployers of AI systems ` +
            `should ensure that their staff possess sufficient AI competence. ` +
            `${orgName} pursues the following approach:`,
            ``,
            `### Training Areas`,
            ``,
        ];

        if (matrix) {
            const items: string[] = [];

            if (matrix.euAiActTrainingRequired) {
                items.push(
                    `- **EU AI Act Fundamentals Training:** Required – Employees involved with AI ` +
                    `should be familiar with the key requirements of the AI Act.`,
                );
            }
            if (matrix.technicalAiCompetency) {
                items.push(
                    `- **Technical AI Competence:** Required – Technical teams should have ` +
                    `in-depth knowledge of AI risks, bias and model validation.`,
                );
            }
            if (matrix.dataPrivacyTraining) {
                items.push(
                    `- **Data Protection Training:** Required – Training on GDPR requirements ` +
                    `in the context of AI systems, particularly where personal data is processed.`,
                );
            }
            if (matrix.incidentTraining) {
                items.push(
                    `- **Incident Training:** Required – Employees should know and be able to apply ` +
                    `the reporting process for AI-related incidents.`,
                );
            }

            if (items.length > 0) {
                lines.push(...items);
            } else {
                lines.push(
                    `The competency matrix is defined; however, no specific ` +
                    `training requirements have been activated yet.`,
                );
            }
        } else {
            lines.push(
                `- All employees involved with AI should receive foundational training on ` +
                `the responsible use of AI systems.`,
            );
            lines.push(
                `- Individuals in governance roles should complete advanced training on ` +
                `the EU AI Act and risk classification.`,
            );
            lines.push(
                `- Training records should be documented and updated regularly.`,
            );
        }

        lines.push(``);
        lines.push(
            `> *Note: The competence requirements under Art. 4 of the AI Act (AI Literacy) apply from ` +
            `2 February 2025. Organisations should take appropriate measures in good time.*`,
        );

        return lines.join('\n');
    },
};
