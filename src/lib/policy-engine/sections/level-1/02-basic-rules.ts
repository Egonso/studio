/**
 * Level 1, Section 02: Grundregeln für KI-Nutzung
 *
 * Referenziert Art. 5 AI Act (verbotene Praktiken).
 * Grundprinzipien für alle Mitarbeitenden.
 * Immer inkludiert.
 *
 * Inhaltliche Referenz: policy-editor.tsx Level 1 Template (Zeile 55–67)
 * Juristisch defensiv: Konjunktiv, "sollte", nicht "muss"
 *
 * Sprint: PE-2a Level 1
 */

import type { SectionDefinition } from '../section-definition';

export const basicRulesSection: SectionDefinition = {
    sectionId: 'l1-basic-rules',
    title: 'Grundregeln für die KI-Nutzung',
    order: 200,
    level: 1,

    shouldInclude: () => true,

    buildContent(context) {
        const orgName = context.orgSettings.organisationName || '[Firmenname]';

        return [
            `**Abschnitt A: Grundprinzipien (für alle Mitarbeitenden)**`,
            ``,
            `Die folgenden Grundprinzipien gelten für alle Mitarbeitenden von ${orgName}, ` +
            `die KI-Systeme nutzen oder mit KI-gestützten Prozessen in Berührung kommen:`,
            ``,
            `1. KI-Systeme sollten nur dann eingesetzt werden, wenn sie nicht gegen verbotene Praktiken ` +
            `gemäß Art. 5 des AI Act verstoßen (z. B. Manipulation, Social Scoring, ` +
            `anlasslose biometrische Massenüberwachung).`,
            ``,
            `2. Mitarbeitende sollten KI-Tools mit Bewusstsein über Datenschutz und Sicherheit nutzen. ` +
            `Die Eingabe sensibler personenbezogener Daten in öffentliche KI-Dienste sollte unterbleiben, ` +
            `sofern keine explizite Freigabe vorliegt.`,
            ``,
            `3. KI-basierte Entscheidungen, die Auswirkungen auf natürliche Personen haben können, ` +
            `sollten durch eine menschliche Überprüfung ergänzt werden.`,
            ``,
            `4. Mitarbeitende sollten sich über interne Leitlinien, Updates und ` +
            `organisationsspezifische Vorgaben zum KI-Einsatz informieren.`,
            ``,
            `---`,
            ``,
            `**Abschnitt B: Schulung & Sensibilisierung**`,
            ``,
            `- Mitarbeitende, die regelmäßig mit KI-Tools arbeiten, sollten an einer ` +
            `Sensibilisierungsschulung teilnehmen.`,
            `- Personen, die KI-Systeme verantworten oder einführen, sollten eine ` +
            `vertiefte Schulung absolvieren (intern oder extern).`,
            `- Schulungsnachweise sollten dokumentiert werden.`,
        ].join('\n');
    },
};
