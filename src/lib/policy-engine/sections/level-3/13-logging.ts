/**
 * Level 3, Section 13: Logging & Alerting
 *
 * Describes requirements for automatic logging
 * and alerting for AI systems.
 * Always included at Level 3.
 *
 * Reference: Art. 12 AI Act (Record-Keeping Obligations)
 * Legally defensive: subjunctive, "should", not "must"
 * Sprint: PE-2b Level 3
 */

import type { SectionDefinition } from '../section-definition';
import { resolveGovernanceCopyLocale } from '@/lib/i18n/governance-copy';

export const loggingSection: SectionDefinition = {
    sectionId: 'l3-logging',
    title: 'Logging & Alerting',
    order: 1400,
    level: 3,

    shouldInclude: () => true,

    buildContent(context) {
        const locale = resolveGovernanceCopyLocale(context.locale);
        const isGerman = locale === 'de';
        const orgName =
            context.orgSettings.organisationName ||
            (isGerman ? '[Firmenname]' : '[Company Name]');
        const securityOfficer = context.orgSettings.raci?.securityOfficer;

        const lines: string[] = isGerman
            ? [
                `Nach Art. 12 AI Act (Aufzeichnungspflichten) sollten Hochrisiko-KI-Systeme ` +
                `über automatische Logging-Funktionen verfügen. ${orgName} sollte dieses Prinzip ` +
                `auf alle im Register dokumentierten KI-Systeme anwenden.`,
                ``,
                `### Logging-Anforderungen`,
                ``,
                `- **Nutzungslogs:** Wer welches System wann und mit welchen Parametern genutzt hat.`,
                `- **Entscheidungslogs:** Bei entscheidungsunterstützenden Systemen sollte die Grundlage der Empfehlung oder Entscheidung nachvollziehbar sein.`,
                `- **Fehlerlogs:** Systemfehler, Timeouts und unerwartetes Verhalten sollten automatisch erfasst werden.`,
                `- **Änderungslogs:** Modellupdates, Konfigurationsänderungen und Datenaktualisierungen sollten versioniert dokumentiert werden.`,
                ``,
                `### Aufbewahrung`,
                ``,
                `Logs sollten für einen angemessenen Zeitraum aufbewahrt werden ` +
                `(empfohlen: mindestens 12 Monate; bei Hochrisiko-Systemen länger nach regulatorischen Anforderungen).`,
                ``,
                `### Alarmierung`,
                ``,
                `Für kritische Ereignisse sollte ein automatisches Alarmierungssystem eingerichtet werden:`,
                ``,
                `- Wesentliche Performance-Abweichungen (Performance Drift)`,
                `- Unerwartete Fehlerraten oberhalb eines definierten Schwellwerts`,
                `- Sicherheitsrelevante Ereignisse (unberechtigter Zugriff, Datenabfluss)`,
                `- Systemausfall oder Nichtverfügbarkeit`,
                ``,
            ]
            : [
                `Pursuant to Art. 12 of the AI Act (Record-Keeping Obligations), high-risk AI systems should have automatic ` +
                `logging capabilities. ${orgName} should apply this ` +
                `principle to all AI systems in the register.`,
                ``,
                `### Logging Requirements`,
                ``,
                `- **Usage Logs:** Who used which system, when and with what ` +
                `parameters.`,
                `- **Decision Logs:** For decision-support systems, ` +
                `the basis of the recommendation or decision should be traceable.`,
                `- **Error Logs:** System errors, timeouts and unexpected behaviour ` +
                `should be captured automatically.`,
                `- **Change Logs:** Model updates, configuration changes and ` +
                `data updates should be documented with version control.`,
                ``,
                `### Retention`,
                ``,
                `Logs should be retained for an appropriate period ` +
                `(recommended: at least 12 months; longer for high-risk systems in accordance ` +
                `with regulatory requirements).`,
                ``,
                `### Alerting`,
                ``,
                `An automatic alerting system should be set up for critical events:`,
                ``,
                `- Significant performance deviations (performance drift)`,
                `- Unexpected error rates above a defined threshold`,
                `- Security-relevant events (unauthorised access, data exfiltration)`,
                `- System outage or unavailability`,
                ``,
            ];

        if (securityOfficer?.name) {
            lines.push(
                `${isGerman ? '**IT-Sicherheitsbeauftragte/r:**' : '**IT Security Officer:**'} ${securityOfficer.name}` +
                `${securityOfficer.department ? ` (${securityOfficer.department})` : ''}`,
            );
            lines.push(``);
        }

        lines.push(
            isGerman
                ? `Alarme sollten an die verantwortlichen Personen weitergeleitet und in den ` +
                `Incident-Management-Prozess eingebunden werden.`
                : `Alerts should be forwarded to the responsible persons ` +
                `and integrated into the incident management process.`,
        );

        return lines.join('\n');
    },
};
