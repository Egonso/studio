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

export const loggingSection: SectionDefinition = {
    sectionId: 'l3-logging',
    title: 'Logging & Alerting',
    order: 1400,
    level: 3,

    shouldInclude: () => true,

    buildContent(context) {
        const orgName = context.orgSettings.organisationName || '[Company Name]';
        const securityOfficer = context.orgSettings.raci?.securityOfficer;

        const lines: string[] = [
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
                `**IT Security Officer:** ${securityOfficer.name}` +
                `${securityOfficer.department ? ` (${securityOfficer.department})` : ''}`,
            );
            lines.push(``);
        }

        lines.push(
            `Alerts should be forwarded to the responsible persons ` +
            `and integrated into the incident management process.`,
        );

        return lines.join('\n');
    },
};
