/**
 * Level 3, Section 12: Validation & Testing
 *
 * Describes requirements for testing and validation of AI systems.
 * Always included at Level 3.
 *
 * Legally defensive: subjunctive, "should", not "must"
 * Sprint: PE-2b Level 3
 */

import type { SectionDefinition } from '../section-definition';
import { resolveGovernanceCopyLocale } from '@/lib/i18n/governance-copy';

export const validationSection: SectionDefinition = {
    sectionId: 'l3-validation',
    title: 'Validation & Testing',
    order: 1300,
    level: 3,

    shouldInclude: () => true,

    buildContent(context) {
        const locale = resolveGovernanceCopyLocale(context.locale);
        const isGerman = locale === 'de';
        const orgName =
            context.orgSettings.organisationName ||
            (isGerman ? '[Firmenname]' : '[Company Name]');
        const totalSystems = context.useCases.length;

        if (isGerman) {
            return [
                `${orgName} sollte einen strukturierten Validierungs- und Testprozess ` +
                `für alle KI-Systeme einrichten. Dies gilt insbesondere vor dem Ersteinsatz ` +
                `und nach wesentlichen Änderungen am System.`,
                ``,
                `### Testanforderungen`,
                ``,
                `Für die derzeit ${totalSystems} dokumentierten KI-Systeme sollten insbesondere ` +
                `folgende Testaspekte berücksichtigt werden:`,
                ``,
                `1. **Funktionale Validierung:** Prüfung, ob das System seine vorgesehene Funktion korrekt und zuverlässig erfüllt.`,
                `2. **Bias- und Fairness-Tests:** Analyse systematischer Verzerrungen, insbesondere bei Systemen mit Einfluss auf Entscheidungen über natürliche Personen.`,
                `3. **Robustheitstests:** Bewertung des Systemverhaltens bei unerwarteten, fehlerhaften oder adversarialen Eingaben.`,
                `4. **Performance-Monitoring:** Laufende Überwachung der Systemleistung im Betrieb (Model-Drift-Erkennung).`,
                `5. **Integrationstests:** Validierung der korrekten Einbindung in bestehende Geschäftsprozesse und IT-Systeme.`,
                ``,
                `### Dokumentation`,
                ``,
                `Testergebnisse sollten nachvollziehbar dokumentiert werden, einschließlich:`,
                ``,
                `- Testdatum und testende Person`,
                `- Testmethodik und Testdaten`,
                `- Ergebnisse und festgestellte Abweichungen`,
                `- Empfohlene Maßnahmen und Umsetzungsstand`,
                ``,
                `Bei Hochrisiko-Systemen sollte die Testdokumentation Bestandteil der technischen ` +
                `Dokumentation nach Art. 11 AI Act sein.`,
            ].join('\n');
        }

        const lines: string[] = [
            `${orgName} should implement a structured validation and testing process ` +
            `for all AI systems. This applies in particular before initial deployment ` +
            `and after material changes to the system.`,
            ``,
            `### Testing Requirements`,
            ``,
            `For the currently ${totalSystems} recorded AI systems, the following ` +
            `testing aspects should be considered:`,
            ``,
            `1. **Functional Validation:** Verification that the system performs its intended ` +
            `function correctly and reliably.`,
            `2. **Bias & Fairness Testing:** Analysis for systematic biases, ` +
            `particularly in systems that influence decisions about natural persons.`,
            `3. **Robustness Testing:** Assessment of system behaviour with unexpected, ` +
            `erroneous or adversarial inputs.`,
            `4. **Performance Monitoring:** Continuous monitoring of system performance ` +
            `in production (model drift detection).`,
            `5. **Integration Testing:** Validation of correct integration into existing ` +
            `business processes and IT systems.`,
            ``,
            `### Documentation`,
            ``,
            `Test results should be documented in a traceable manner, including:`,
            ``,
            `- Test date and tester`,
            `- Test methodology and test data`,
            `- Results and identified deviations`,
            `- Recommended measures and their implementation status`,
            ``,
            `For high-risk systems, the test documentation should form part of the technical ` +
            `documentation pursuant to Art. 11 of the AI Act.`,
        ];

        return lines.join('\n');
    },
};
