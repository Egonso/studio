/**
 * Level 1, Section 01: AI-Commitment Statement
 *
 * Präambel und Verpflichtungserklärung der Organisation.
 * Immer inkludiert. Befüllt: Firmenname, Branche, Datum.
 *
 * Inhaltliche Referenz: policy-editor.tsx Level 1 Template (Zeile 47–74)
 * Juristisch defensiv: Konjunktiv, "sollte", nicht "muss"
 *
 * Sprint: PE-2a Level 1
 */

import type { SectionDefinition } from '../section-definition';

export const commitmentSection: SectionDefinition = {
    sectionId: 'l1-commitment',
    title: 'Verpflichtung zur verantwortungsbewussten Nutzung von KI-Systemen',
    order: 100,
    level: 1,

    shouldInclude: () => true,

    buildContent(context) {
        const orgName = context.orgSettings.organisationName || '[Firmenname]';
        const industry = context.orgSettings.industry || '[Branche]';
        const today = new Date().toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });

        return [
            `**Einleitung / Präambel**`,
            ``,
            `${orgName} (Branche: ${industry}) erkennt an, dass der EU AI Act (Verordnung (EU) 2024/1689) ` +
            `neue Anforderungen an den Einsatz von Künstlicher Intelligenz stellt. ` +
            `Diese Erklärung verdeutlicht unseren Mitarbeitenden, dass wir KI verantwortungsvoll, ` +
            `nachvollziehbar und im Einklang mit europäischen Werten einsetzen wollen.`,
            ``,
            `Wir verpflichten uns, den Einsatz von KI-Systemen in unserer Organisation ` +
            `transparent zu gestalten und die Rechte betroffener Personen zu wahren. ` +
            `Diese Erklärung bildet den dokumentierten IST-Zustand unserer Grundprinzipien ` +
            `und sollte regelmäßig überprüft werden.`,
            ``,
            `*Erstellt am: ${today}*`,
        ].join('\n');
    },
};
