/**
 * Level 3, Section 12: Validierung & Test
 *
 * Beschreibt Anforderungen an Testing und Validierung von KI-Systemen.
 * Immer inkludiert bei Level 3.
 *
 * Juristisch defensiv: Konjunktiv, "sollte" nicht "muss"
 * Sprint: PE-2b Level 3
 */

import type { SectionDefinition } from '../section-definition';

export const validationSection: SectionDefinition = {
    sectionId: 'l3-validation',
    title: 'Validierung & Test',
    order: 1300,
    level: 3,

    shouldInclude: () => true,

    buildContent(context) {
        const orgName = context.orgSettings.organisationName || '[Firmenname]';
        const totalSystems = context.useCases.length;

        const lines: string[] = [
            `${orgName} sollte für alle KI-Systeme einen strukturierten Validierungs- und ` +
            `Testprozess implementieren. Dies gilt insbesondere vor der Erstinbetriebnahme ` +
            `sowie nach wesentlichen Änderungen am System.`,
            ``,
            `### Testanforderungen`,
            ``,
            `Für die aktuell ${totalSystems} erfassten KI-Systeme sollten folgende ` +
            `Testaspekte berücksichtigt werden:`,
            ``,
            `1. **Funktionale Validierung:** Überprüfung, ob das System seine vorgesehene ` +
            `Funktion korrekt und zuverlässig erfüllt.`,
            `2. **Bias- und Fairness-Prüfung:** Analyse auf systematische Verzerrungen, ` +
            `insbesondere bei Systemen, die Entscheidungen über natürliche Personen beeinflussen.`,
            `3. **Robustheits-Tests:** Prüfung des Systemverhaltens bei unerwarteten, ` +
            `fehlerhaften oder adversarialen Eingaben.`,
            `4. **Performance-Monitoring:** Kontinuierliche Überwachung der Systemleistung ` +
            `im produktiven Betrieb (Model Drift Detection).`,
            `5. **Integrationstests:** Validierung der korrekten Einbindung in bestehende ` +
            `Geschäftsprozesse und IT-Systeme.`,
            ``,
            `### Dokumentation`,
            ``,
            `Testergebnisse sollten nachvollziehbar dokumentiert werden, einschließlich:`,
            ``,
            `- Testdatum und Tester`,
            `- Testmethodik und Testdaten`,
            `- Ergebnisse und identifizierte Abweichungen`,
            `- Empfohlene Maßnahmen und deren Umsetzungsstatus`,
            ``,
            `Bei Hochrisiko-Systemen sollte die Testdokumentation Teil der technischen ` +
            `Dokumentation gemäß Art. 11 AI Act sein.`,
        ];

        return lines.join('\n');
    },
};
