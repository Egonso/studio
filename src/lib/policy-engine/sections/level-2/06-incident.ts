/**
 * Level 2, Section 06: Vorfallmanagement
 *
 * Beschreibt den Umgang mit KI-bezogenen Vorfällen.
 * Conditional: nur wenn orgSettings.incidentProcess oder incidentConfig existiert.
 *
 * Juristisch defensiv: Konjunktiv, "sollte" nicht "muss"
 * Sprint: PE-2b Level 2
 */

import type { SectionDefinition } from '../section-definition';

export const incidentSection: SectionDefinition = {
    sectionId: 'l2-incident',
    title: 'Vorfallmanagement',
    order: 500,
    level: 2,

    shouldInclude(context) {
        return !!(context.orgSettings.incidentProcess || context.orgSettings.incidentConfig);
    },

    buildContent(context) {
        const orgName = context.orgSettings.organisationName || '[Firmenname]';
        const incidentUrl = context.orgSettings.incidentProcess?.url;
        const config = context.orgSettings.incidentConfig;
        const incidentOwner = context.orgSettings.raci?.incidentOwner;

        const lines: string[] = [
            `${orgName} verfügt über einen definierten Prozess zum Umgang mit KI-bezogenen Vorfällen. ` +
            `Ziel ist die schnelle Erkennung, Dokumentation und Behebung von Fehlverhalten, ` +
            `Sicherheitslücken oder unerwarteten Ergebnissen von KI-Systemen.`,
            ``,
            `### Meldeprozess`,
            ``,
        ];

        if (incidentUrl) {
            lines.push(`Der dokumentierte Vorfallprozess ist hinterlegt unter: ${incidentUrl}`);
            lines.push(``);
        }

        if (config) {
            if (config.reportingPath) {
                lines.push(`**Meldeweg:** ${config.reportingPath}`);
                lines.push(``);
            }
            if (config.escalationLevel) {
                lines.push(`**Eskalationsstufe:** ${config.escalationLevel}`);
                lines.push(``);
            }
            if (config.responseTimeframe) {
                lines.push(`**Reaktionszeitraum:** ${config.responseTimeframe}`);
                lines.push(``);
            }
            if (config.documentationRequired) {
                lines.push(
                    `Jeder Vorfall sollte vollständig dokumentiert werden, einschließlich ` +
                    `Ursachenanalyse, ergriffener Maßnahmen und Präventionsempfehlungen.`,
                );
                lines.push(``);
            }
        }

        if (incidentOwner?.name) {
            lines.push(
                `**Vorfallverantwortliche:r:** ${incidentOwner.name}` +
                `${incidentOwner.department ? ` (${incidentOwner.department})` : ''}`,
            );
            lines.push(``);
        }

        lines.push(
            `Alle Mitarbeitenden sollten in der Lage sein, KI-bezogene Vorfälle ` +
            `zeitnah über den definierten Meldeweg zu melden. ` +
            `Bei Hochrisiko-Systemen gemäß Art. 62 AI Act sollten schwerwiegende Vorfälle ` +
            `innerhalb der vorgeschriebenen Fristen an die zuständige Marktüberwachungsbehörde ` +
            `gemeldet werden.`,
        );

        return lines.join('\n');
    },
};
