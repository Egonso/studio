/**
 * Level 2, Section 04: Roles & Responsibilities
 *
 * Lists all defined RACI roles from orgSettings.raci.
 * Always included at Level >= 2.
 *
 * Legally defensive: subjunctive, "should", not "must"
 * Sprint: PE-2b Level 2
 */

import type { SectionDefinition } from '../section-definition';
import type { RoleEntry } from '@/lib/register-first/types';

/** Human-readable English labels for RACI role keys */
const ROLE_LABELS: Record<string, string> = {
    aiOwner: 'AI Owner',
    complianceOwner: 'Compliance Owner',
    technicalOwner: 'Technical Owner',
    incidentOwner: 'Incident Owner',
    reviewOwner: 'Review Owner',
    dpo: 'Data Protection Officer (DPO)',
    securityOfficer: 'IT Security Officer',
    productOwner: 'Product Owner',
};

export const rolesSection: SectionDefinition = {
    sectionId: 'l2-roles',
    title: 'Roles & Responsibilities',
    order: 300,
    level: 2,

    shouldInclude: () => true,

    buildContent(context) {
        const orgName = context.orgSettings.organisationName || '[Company Name]';
        const raci = context.orgSettings.raci;

        const lines: string[] = [
            `For the governance, oversight and responsible use of AI systems, ` +
            `${orgName} should define clear responsibilities. The following roles form ` +
            `the governance structure:`,
            ``,
        ];

        if (raci && Object.keys(raci).length > 0) {
            lines.push(`| Role | Person | Department |`);
            lines.push(`|------|--------|------------|`);

            for (const [key, entry] of Object.entries(raci)) {
                if (!entry) continue;
                const role = entry as RoleEntry;
                const label = ROLE_LABELS[key] || key;
                const name = role.name || '–';
                const dept = role.department || '–';
                lines.push(`| ${label} | ${name} | ${dept} |`);
            }
            lines.push(``);
        } else {
            lines.push(
                `> *Note: No roles have been defined in the organisation settings yet. ` +
                `The role matrix should be completed promptly.*`,
            );
            lines.push(``);
        }

        lines.push(
            `The responsible persons should receive regular training and be informed about their obligations ` +
            `under the AI Act (in particular Art. 4 – AI Literacy).`,
        );
        lines.push(``);
        lines.push(
            `Changes in role assignments should be documented and communicated to the ` +
            `designated Review Owner.`,
        );

        return lines.join('\n');
    },
};
