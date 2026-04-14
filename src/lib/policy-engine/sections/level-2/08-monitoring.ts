/**
 * Level 2, Section 08: Monitoring & Audit
 *
 * Describes the review cycle and audit approach of the organisation.
 * References orgSettings.reviewStandard and orgSettings.reviewCycle.
 * Always included at Level 2.
 *
 * Legally defensive: subjunctive, "should", not "must"
 * Sprint: PE-2b Level 2
 */

import type { SectionDefinition } from '../section-definition';

/** Map review standard values to English labels */
const REVIEW_STANDARD_LABELS: Record<string, string> = {
    annual: 'annual',
    semiannual: 'semi-annual',
    'risk-based': 'risk-based',
};

/** Map review cycle types to English labels */
const REVIEW_CYCLE_TYPE_LABELS: Record<string, string> = {
    fixed: 'Fixed cycle',
    risk_based: 'Risk-based',
    event_based: 'Event-driven',
};

export const monitoringSection: SectionDefinition = {
    sectionId: 'l2-monitoring',
    title: 'Monitoring & Audit',
    order: 700,
    level: 2,

    shouldInclude: () => true,

    buildContent(context) {
        const orgName = context.orgSettings.organisationName || '[Company Name]';
        const reviewStandard = context.orgSettings.reviewStandard;
        const reviewCycle = context.orgSettings.reviewCycle;
        const reviewOwner = context.orgSettings.raci?.reviewOwner;

        const lines: string[] = [
            `${orgName} should review AI systems on a regular basis to ensure their conformity with ` +
            `internal policies and regulatory requirements.`,
            ``,
            `### Review Cycle`,
            ``,
        ];

        if (reviewStandard) {
            const label = REVIEW_STANDARD_LABELS[reviewStandard] || reviewStandard;
            lines.push(`**Review Standard:** ${label}`);
            lines.push(``);
        }

        if (reviewCycle) {
            const typeLabel = REVIEW_CYCLE_TYPE_LABELS[reviewCycle.type] || reviewCycle.type;
            lines.push(`**Review Type:** ${typeLabel}`);
            if (reviewCycle.interval) {
                lines.push(`**Interval:** ${reviewCycle.interval}`);
            }
            lines.push(``);
        }

        if (!reviewStandard && !reviewCycle) {
            lines.push(
                `> *No formal review cycle has been defined yet. ` +
                `A review at least once per year is recommended.*`,
            );
            lines.push(``);
        }

        if (reviewOwner?.name) {
            lines.push(
                `**Review Owner:** ${reviewOwner.name}` +
                `${reviewOwner.department ? ` (${reviewOwner.department})` : ''}`,
            );
            lines.push(``);
        }

        lines.push(`### Review Scope`);
        lines.push(``);
        lines.push(`Each review should cover at least the following aspects:`);
        lines.push(``);
        lines.push(`- Completeness and accuracy of the AI register`);
        lines.push(`- Correctness of risk assessments (AI Act category)`);
        lines.push(`- Effectiveness of the defined control measures`);
        lines.push(`- Compliance with data protection requirements`);
        lines.push(`- Documentation of incidents and corrective actions`);
        lines.push(``);
        lines.push(
            `The results of each review should be documented and made available to the relevant ` +
            `stakeholders.`,
        );

        return lines.join('\n');
    },
};
