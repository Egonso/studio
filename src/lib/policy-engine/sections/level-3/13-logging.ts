/**
 * Level 3, Section 13: Logging & Alarmierung
 *
 * Beschreibt Anforderungen an automatische Protokollierung
 * und Alarmierung für KI-Systeme.
 * Immer inkludiert bei Level 3.
 *
 * Referenz: Art. 12 AI Act (Aufzeichnungspflichten)
 * Juristisch defensiv: Konjunktiv, "sollte" nicht "muss"
 * Sprint: PE-2b Level 3
 */

import type { SectionDefinition } from '../section-definition';

export const loggingSection: SectionDefinition = {
    sectionId: 'l3-logging',
    title: 'Logging & Alarmierung',
    order: 1400,
    level: 3,

    shouldInclude: () => true,

    buildContent(context) {
        const orgName = context.orgSettings.organisationName || '[Firmenname]';
        const securityOfficer = context.orgSettings.raci?.securityOfficer;

        const lines: string[] = [
            `Gemäß Art. 12 AI Act sollten Hochrisiko-KI-Systeme über automatische ` +
            `Aufzeichnungsfähigkeiten (Logging) verfügen. ${orgName} sollte dieses ` +
            `Prinzip auf alle KI-Systeme im Register anwenden.`,
            ``,
            `### Logging-Anforderungen`,
            ``,
            `- **Nutzungsprotokolle:** Wer hat wann welches System mit welchen ` +
            `Parametern genutzt.`,
            `- **Entscheidungsprotokolle:** Bei entscheidungsunterstützenden Systemen ` +
            `sollte die Grundlage der Empfehlung oder Entscheidung nachvollziehbar sein.`,
            `- **Fehlerprotokolle:** Systemfehler, Timeouts und unerwartetes Verhalten ` +
            `sollten automatisch erfasst werden.`,
            `- **Änderungsprotokolle:** Modellupdates, Konfigurationsänderungen und ` +
            `Datenaktualisierungen sollten versioniert dokumentiert werden.`,
            ``,
            `### Aufbewahrung`,
            ``,
            `Protokolle sollten für einen angemessenen Zeitraum aufbewahrt werden ` +
            `(empfohlen: mindestens 12 Monate, bei Hochrisiko-Systemen gemäß ` +
            `regulatorischen Anforderungen länger).`,
            ``,
            `### Alarmierung`,
            ``,
            `Für kritische Ereignisse sollte ein automatisches Alarmsystem eingerichtet werden:`,
            ``,
            `- Signifikante Leistungsabweichungen (Performance Drift)`,
            `- Unerwartete Fehlerraten über definiertem Schwellwert`,
            `- Sicherheitsrelevante Ereignisse (unauthorisierter Zugriff, Datenexfiltration)`,
            `- Ausfall oder Nicht-Erreichbarkeit eines Systems`,
            ``,
        ];

        if (securityOfficer?.name) {
            lines.push(
                `**IT-Sicherheitsbeauftragte:r:** ${securityOfficer.name}` +
                `${securityOfficer.department ? ` (${securityOfficer.department})` : ''}`,
            );
            lines.push(``);
        }

        lines.push(
            `Alarme sollten an die zuständigen Verantwortlichen weitergeleitet ` +
            `und in den Vorfallmanagement-Prozess eingebunden werden.`,
        );

        return lines.join('\n');
    },
};
