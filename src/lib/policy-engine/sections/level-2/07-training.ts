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
import { resolveGovernanceCopyLocale } from '@/lib/i18n/governance-copy';

export const trainingSection: SectionDefinition = {
    sectionId: 'l2-training',
    title: 'Training & Qualification',
    order: 600,
    level: 2,

    shouldInclude: () => true,

    buildContent(context) {
        const locale = resolveGovernanceCopyLocale(context.locale);
        const isGerman = locale === 'de';
        const orgName =
            context.orgSettings.organisationName ||
            (isGerman ? '[Firmenname]' : '[Company Name]');
        const matrix = context.orgSettings.competencyMatrix;

        const lines: string[] = isGerman
            ? [
                `Nach Art. 4 des EU AI Act (KI-Kompetenz) sollten Anbieter und Betreiber ` +
                `von KI-Systemen sicherstellen, dass ihr Personal über ausreichende ` +
                `KI-Kompetenz verfügt. ${orgName} verfolgt dazu den folgenden Ansatz:`,
                ``,
                `### Schulungsbereiche`,
                ``,
            ]
            : [
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
                    isGerman
                        ? `- **EU-AI-Act-Grundlagenschulung:** Erforderlich - Mitarbeitende mit KI-Bezug ` +
                        `sollten mit den zentralen Anforderungen des AI Act vertraut sein.`
                        : `- **EU AI Act Fundamentals Training:** Required - Employees involved with AI ` +
                        `should be familiar with the key requirements of the AI Act.`,
                );
            }
            if (matrix.technicalAiCompetency) {
                items.push(
                    isGerman
                        ? `- **Technische KI-Kompetenz:** Erforderlich - Technische Teams sollten ` +
                        `vertiefte Kenntnisse zu KI-Risiken, Bias und Modellvalidierung besitzen.`
                        : `- **Technical AI Competence:** Required - Technical teams should have ` +
                        `in-depth knowledge of AI risks, bias and model validation.`,
                );
            }
            if (matrix.dataPrivacyTraining) {
                items.push(
                    isGerman
                        ? `- **Datenschutzschulung:** Erforderlich - Schulung zu DSGVO-Anforderungen ` +
                        `im Kontext von KI-Systemen, insbesondere bei personenbezogenen Daten.`
                        : `- **Data Protection Training:** Required - Training on GDPR requirements ` +
                        `in the context of AI systems, particularly where personal data is processed.`,
                );
            }
            if (matrix.incidentTraining) {
                items.push(
                    isGerman
                        ? `- **Incident-Schulung:** Erforderlich - Mitarbeitende sollten den Meldeprozess ` +
                        `für KI-bezogene Vorfälle kennen und anwenden können.`
                        : `- **Incident Training:** Required - Employees should know and be able to apply ` +
                        `the reporting process for AI-related incidents.`,
                );
            }

            if (items.length > 0) {
                lines.push(...items);
            } else {
                lines.push(
                    isGerman
                        ? `Die Kompetenzmatrix ist definiert; es wurden jedoch noch keine spezifischen ` +
                        `Schulungsanforderungen aktiviert.`
                        : `The competency matrix is defined; however, no specific ` +
                        `training requirements have been activated yet.`,
                );
            }
        } else {
            if (isGerman) {
                lines.push(`- Alle Mitarbeitenden mit KI-Bezug sollten eine Grundlagenschulung zur verantwortungsvollen Nutzung von KI-Systemen erhalten.`);
                lines.push(`- Personen in Governance-Rollen sollten eine vertiefte Schulung zum EU AI Act und zur Risikoklassifizierung absolvieren.`);
                lines.push(`- Schulungsnachweise sollten dokumentiert und regelmäßig aktualisiert werden.`);
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
        }

        lines.push(``);
        lines.push(
            isGerman
                ? `> *Hinweis: Die Kompetenzanforderungen nach Art. 4 AI Act (KI-Kompetenz) gelten ab ` +
                `dem 2. Februar 2025. Organisationen sollten rechtzeitig geeignete Maßnahmen treffen.*`
                : `> *Note: The competence requirements under Art. 4 of the AI Act (AI Literacy) apply from ` +
                `2 February 2025. Organisations should take appropriate measures in good time.*`,
        );

        return lines.join('\n');
    },
};
