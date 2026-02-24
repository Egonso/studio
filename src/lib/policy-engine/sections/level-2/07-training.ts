/**
 * Level 2, Section 07: Schulung & Qualifizierung
 *
 * Beschreibt Schulungsanforderungen für KI-Kompetenz.
 * Immer inkludiert bei Level >= 2.
 * Befüllt aus orgSettings.competencyMatrix falls vorhanden.
 *
 * Referenz: Art. 4 AI Act (AI Literacy / KI-Kompetenz)
 * Juristisch defensiv: Konjunktiv, "sollte" nicht "muss"
 * Sprint: PE-2b Level 2
 */

import type { SectionDefinition } from '../section-definition';

export const trainingSection: SectionDefinition = {
    sectionId: 'l2-training',
    title: 'Schulung & Qualifizierung',
    order: 600,
    level: 2,

    shouldInclude: () => true,

    buildContent(context) {
        const orgName = context.orgSettings.organisationName || '[Firmenname]';
        const matrix = context.orgSettings.competencyMatrix;

        const lines: string[] = [
            `Gemäß Art. 4 des EU AI Act sollten Anbieter und Betreiber von KI-Systemen ` +
            `sicherstellen, dass ihr Personal über eine ausreichende KI-Kompetenz verfügt. ` +
            `${orgName} verfolgt hierzu folgenden Ansatz:`,
            ``,
            `### Schulungsbereiche`,
            ``,
        ];

        if (matrix) {
            const items: string[] = [];

            if (matrix.euAiActTrainingRequired) {
                items.push(
                    `- **EU AI Act Grundlagenschulung:** Erforderlich – Mitarbeitende mit KI-Bezug ` +
                    `sollten die wesentlichen Anforderungen des AI Act kennen.`,
                );
            }
            if (matrix.technicalAiCompetency) {
                items.push(
                    `- **Technische KI-Kompetenz:** Erforderlich – Technische Teams sollten über ` +
                    `vertiefte Kenntnisse zu KI-Risiken, Bias und Modellvalidierung verfügen.`,
                );
            }
            if (matrix.dataPrivacyTraining) {
                items.push(
                    `- **Datenschutz-Schulung:** Erforderlich – Schulung zu DSGVO-Anforderungen ` +
                    `im Kontext von KI-Systemen, insbesondere bei Verarbeitung personenbezogener Daten.`,
                );
            }
            if (matrix.incidentTraining) {
                items.push(
                    `- **Vorfall-Schulung:** Erforderlich – Mitarbeitende sollten den Meldeprozess ` +
                    `für KI-bezogene Vorfälle kennen und anwenden können.`,
                );
            }

            if (items.length > 0) {
                lines.push(...items);
            } else {
                lines.push(
                    `Die Kompetenzmatrix ist definiert, es wurden jedoch noch keine konkreten ` +
                    `Schulungsanforderungen aktiviert.`,
                );
            }
        } else {
            lines.push(
                `- Alle Mitarbeitenden mit KI-Bezug sollten eine Grundlagenschulung zum ` +
                `verantwortungsvollen Umgang mit KI-Systemen erhalten.`,
            );
            lines.push(
                `- Personen in Governance-Rollen sollten vertiefende Schulungen zum ` +
                `EU AI Act und zur Risikoklassifizierung absolvieren.`,
            );
            lines.push(
                `- Schulungsnachweise sollten dokumentiert und regelmäßig aktualisiert werden.`,
            );
        }

        lines.push(``);
        lines.push(
            `> *Hinweis: Die Kompetenzanforderungen gemäß Art. 4 AI Act gelten ab dem ` +
            `2. Februar 2025. Organisationen sollten rechtzeitig geeignete Maßnahmen ergreifen.*`,
        );

        return lines.join('\n');
    },
};
