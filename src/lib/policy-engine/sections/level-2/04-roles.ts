/**
 * Level 2, Section 04: Rollen & Verantwortlichkeiten
 *
 * Listet alle definierten RACI-Rollen aus orgSettings.raci auf.
 * Immer inkludiert bei Level >= 2.
 *
 * Juristisch defensiv: Konjunktiv, "sollte" nicht "muss"
 * Sprint: PE-2b Level 2
 */

import type { SectionDefinition } from '../section-definition';
import type { RoleEntry } from '@/lib/register-first/types';

/** Human-readable German labels for RACI role keys */
const ROLE_LABELS: Record<string, string> = {
    aiOwner: 'KI-Verantwortliche:r (AI Owner)',
    complianceOwner: 'Compliance-Verantwortliche:r',
    technicalOwner: 'Technische:r Verantwortliche:r',
    incidentOwner: 'Vorfallverantwortliche:r',
    reviewOwner: 'Review-Verantwortliche:r',
    dpo: 'Datenschutzbeauftragte:r (DSB)',
    securityOfficer: 'IT-Sicherheitsbeauftragte:r',
    productOwner: 'Product Owner',
};

export const rolesSection: SectionDefinition = {
    sectionId: 'l2-roles',
    title: 'Rollen & Verantwortlichkeiten',
    order: 300,
    level: 2,

    shouldInclude: () => true,

    buildContent(context) {
        const orgName = context.orgSettings.organisationName || '[Firmenname]';
        const raci = context.orgSettings.raci;

        const lines: string[] = [
            `Für die Steuerung, Überwachung und den verantwortungsvollen Einsatz von KI-Systemen ` +
            `sollte ${orgName} klare Zuständigkeiten definieren. Die folgenden Rollen bilden ` +
            `die Governance-Struktur:`,
            ``,
        ];

        if (raci && Object.keys(raci).length > 0) {
            lines.push(`| Rolle | Person | Abteilung |`);
            lines.push(`|-------|--------|-----------|`);

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
                `> *Hinweis: Es wurden noch keine Rollen in den Organisationseinstellungen definiert. ` +
                `Die Rollenmatrix sollte zeitnah ausgefüllt werden.*`,
            );
            lines.push(``);
        }

        lines.push(
            `Die verantwortlichen Personen sollten regelmäßig geschult und über ihre Pflichten ` +
            `im Rahmen des AI Act (insbesondere Art. 4 AI-Kompetenz) informiert werden.`,
        );
        lines.push(``);
        lines.push(
            `Änderungen in der Rollenbesetzung sollten dokumentiert und dem zuständigen ` +
            `Review-Verantwortlichen mitgeteilt werden.`,
        );

        return lines.join('\n');
    },
};
