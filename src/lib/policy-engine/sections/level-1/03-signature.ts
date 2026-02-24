/**
 * Level 1, Section 03: Unterschriftsblock
 *
 * Abschluss des Commitment Statements mit Datum und Unterschriftsfeldern.
 * Name aus orgSettings.contactPerson.name.
 * Immer inkludiert.
 *
 * Inhaltliche Referenz: policy-editor.tsx Level 1 Template (Zeile 70–74)
 * Juristisch defensiv: "dokumentierter IST-Zustand"
 *
 * Sprint: PE-2a Level 1
 */

import type { SectionDefinition } from '../section-definition';

export const signatureSection: SectionDefinition = {
    sectionId: 'l1-signature',
    title: 'Inkrafttreten & Unterschriften',
    order: 900,
    level: 1,

    shouldInclude: () => true,

    buildContent(context) {
        const contactName = context.orgSettings.contactPerson?.name || '[Verantwortliche Person]';
        const orgName = context.orgSettings.organisationName || '[Firmenname]';
        const today = new Date().toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });

        return [
            `*Diese Erklärung dokumentiert den IST-Zustand der KI-Governance-Prinzipien ` +
            `von ${orgName}. Sie ersetzt keine rechtliche Beratung und stellt ` +
            `keine Compliance-Bestätigung dar.*`,
            ``,
            `---`,
            ``,
            `**Organisation:** ${orgName}`,
            ``,
            `**Verantwortliche Person:** ${contactName}`,
            ``,
            `**Datum:** ${today}`,
            ``,
            `**Ort:** ____________________`,
            ``,
            `**Unterschrift Verantwortliche:r:** ____________________`,
            ``,
            `**Unterschrift Mitarbeitende:r:** ____________________`,
        ].join('\n');
    },
};
