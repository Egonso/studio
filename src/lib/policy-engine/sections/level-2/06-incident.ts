/**
 * Level 2, Section 06: Incident Management
 *
 * Describes how AI-related incidents are handled.
 * Conditional: only if orgSettings.incidentProcess or incidentConfig exists.
 *
 * Legally defensive: subjunctive, "should", not "must"
 * Sprint: PE-2b Level 2
 */

import type { SectionDefinition } from '../section-definition';
import { resolveGovernanceCopyLocale } from '@/lib/i18n/governance-copy';

export const incidentSection: SectionDefinition = {
    sectionId: 'l2-incident',
    title: 'Incident Management',
    order: 500,
    level: 2,

    shouldInclude(context) {
        return !!(context.orgSettings.incidentProcess || context.orgSettings.incidentConfig);
    },

    buildContent(context) {
        const locale = resolveGovernanceCopyLocale(context.locale);
        const isGerman = locale === 'de';
        const orgName =
            context.orgSettings.organisationName ||
            (isGerman ? '[Firmenname]' : '[Company Name]');
        const incidentUrl = context.orgSettings.incidentProcess?.url;
        const config = context.orgSettings.incidentConfig;
        const incidentOwner = context.orgSettings.raci?.incidentOwner;

        const lines: string[] = isGerman
            ? [
                `${orgName} verfügt über einen definierten Prozess zur Behandlung KI-bezogener ` +
                `Vorfälle. Ziel ist die zeitnahe Erkennung, Dokumentation und Bearbeitung von ` +
                `Fehlfunktionen, Sicherheitslücken oder unerwarteten Ausgaben von KI-Systemen.`,
                ``,
                `### Meldeprozess`,
                ``,
            ]
            : [
                `${orgName} has a defined process for handling AI-related incidents. ` +
                `The objective is the prompt detection, documentation and resolution of malfunctions, ` +
                `security vulnerabilities or unexpected outputs from AI systems.`,
                ``,
                `### Reporting Process`,
                ``,
            ];

        if (incidentUrl) {
            lines.push(isGerman
                ? `Der dokumentierte Incident-Prozess ist verfügbar unter: ${incidentUrl}`
                : `The documented incident process is available at: ${incidentUrl}`);
            lines.push(``);
        }

        if (config) {
            if (config.reportingPath) {
                lines.push(`${isGerman ? '**Meldekanal:**' : '**Reporting Channel:**'} ${config.reportingPath}`);
                lines.push(``);
            }
            if (config.escalationLevel) {
                lines.push(`${isGerman ? '**Eskalationsstufe:**' : '**Escalation Level:**'} ${config.escalationLevel}`);
                lines.push(``);
            }
            if (config.responseTimeframe) {
                lines.push(`${isGerman ? '**Reaktionszeit:**' : '**Response Timeframe:**'} ${config.responseTimeframe}`);
                lines.push(``);
            }
            if (config.documentationRequired) {
                lines.push(
                    isGerman
                        ? `Jeder Vorfall sollte vollständig dokumentiert werden, einschließlich ` +
                        `Ursachenanalyse, ergriffener Maßnahmen und Präventionsempfehlungen.`
                        : `Each incident should be fully documented, including ` +
                        `root cause analysis, measures taken and prevention recommendations.`,
                );
                lines.push(``);
            }
        }

        if (incidentOwner?.name) {
            lines.push(
                `${isGerman ? '**Incident-Owner:**' : '**Incident Owner:**'} ${incidentOwner.name}` +
                `${incidentOwner.department ? ` (${incidentOwner.department})` : ''}`,
            );
            lines.push(``);
        }

        lines.push(isGerman
            ? `Alle Mitarbeitenden sollten KI-bezogene Vorfälle zeitnah über den definierten ` +
            `Meldekanal melden können. Bei Hochrisiko-Systemen nach Art. 72 AI Act ` +
            `(Meldung schwerwiegender Vorfälle) sollten schwerwiegende Vorfälle innerhalb ` +
            `der vorgesehenen Fristen an die zuständige Marktüberwachungsbehörde gemeldet werden.`
            : `All employees should be able to report AI-related incidents ` +
            `promptly via the defined reporting channel. ` +
            `For high-risk systems under Art. 72 of the AI Act (Reporting of Serious Incidents), serious incidents ` +
            `should be reported to the competent market surveillance authority ` +
            `within the prescribed timeframes.`);

        return lines.join('\n');
    },
};
