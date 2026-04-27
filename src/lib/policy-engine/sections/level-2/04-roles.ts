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
import { resolveGovernanceCopyLocale } from '@/lib/i18n/governance-copy';

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

const ROLE_LABELS_DE: Record<string, string> = {
    aiOwner: 'KI-Owner',
    complianceOwner: 'Compliance-Owner',
    technicalOwner: 'Technischer Owner',
    incidentOwner: 'Incident-Owner',
    reviewOwner: 'Review-Owner',
    dpo: 'Datenschutzbeauftragte/r',
    securityOfficer: 'IT-Sicherheitsbeauftragte/r',
    productOwner: 'Product Owner',
};

export const rolesSection: SectionDefinition = {
    sectionId: 'l2-roles',
    title: 'Roles & Responsibilities',
    order: 300,
    level: 2,

    shouldInclude: () => true,

    buildContent(context) {
        const locale = resolveGovernanceCopyLocale(context.locale);
        const isGerman = locale === 'de';
        const orgName =
            context.orgSettings.organisationName ||
            (isGerman ? '[Firmenname]' : '[Company Name]');
        const raci = context.orgSettings.raci;

        const lines: string[] = isGerman
            ? [
                `Für Governance, Aufsicht und verantwortungsvolle Nutzung von KI-Systemen ` +
                `sollte ${orgName} klare Zuständigkeiten definieren. Die folgenden Rollen ` +
                `bilden die Governance-Struktur:`,
                ``,
            ]
            : [
                `For the governance, oversight and responsible use of AI systems, ` +
                `${orgName} should define clear responsibilities. The following roles form ` +
                `the governance structure:`,
                ``,
            ];

        if (raci && Object.keys(raci).length > 0) {
            lines.push(isGerman ? `| Rolle | Person | Bereich |` : `| Role | Person | Department |`);
            lines.push(`|------|--------|------------|`);

            for (const [key, entry] of Object.entries(raci)) {
                if (!entry) continue;
                const role = entry as RoleEntry;
                const label = (isGerman ? ROLE_LABELS_DE[key] : ROLE_LABELS[key]) || key;
                const name = role.name || '–';
                const dept = role.department || '–';
                lines.push(`| ${label} | ${name} | ${dept} |`);
            }
            lines.push(``);
        } else {
            lines.push(
                isGerman
                    ? `> *Hinweis: In den Organisationseinstellungen wurden noch keine Rollen ` +
                    `definiert. Die Rollenmatrix sollte zeitnah ergänzt werden.*`
                    : `> *Note: No roles have been defined in the organisation settings yet. ` +
                    `The role matrix should be completed promptly.*`,
            );
            lines.push(``);
        }

        lines.push(isGerman
            ? `Die verantwortlichen Personen sollten regelmäßig geschult und über ihre Pflichten ` +
            `nach dem AI Act informiert werden (insbesondere Art. 4 - KI-Kompetenz).`
            : `The responsible persons should receive regular training and be informed about their obligations ` +
            `under the AI Act (in particular Art. 4 - AI Literacy).`);
        lines.push(``);
        lines.push(isGerman
            ? `Änderungen an Rollenzuweisungen sollten dokumentiert und dem benannten Review-Owner ` +
            `kommuniziert werden.`
            : `Changes in role assignments should be documented and communicated to the ` +
            `designated Review Owner.`);

        return lines.join('\n');
    },
};
