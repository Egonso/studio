/**
 * Level 1, Section 03: Signature Block
 *
 * Closing section of the commitment statement with date and signature fields.
 * Name from orgSettings.contactPerson.name.
 * Always included.
 *
 * Content reference: policy-editor.tsx Level 1 Template (line 70–74)
 * Legally defensive: "documented current state"
 *
 * Sprint: PE-2a Level 1
 */

import type { SectionDefinition } from '../section-definition';
import {
    formatGovernanceDate,
    resolveGovernanceCopyLocale,
} from '@/lib/i18n/governance-copy';

export const signatureSection: SectionDefinition = {
    sectionId: 'l1-signature',
    title: 'Effective Date & Signatures',
    order: 900,
    level: 1,

    shouldInclude: () => true,

    buildContent(context) {
        const locale = resolveGovernanceCopyLocale(context.locale);
        const contactName =
            context.orgSettings.contactPerson?.name ||
            (locale === 'de' ? '[Verantwortliche Person]' : '[Responsible Person]');
        const orgName =
            context.orgSettings.organisationName ||
            (locale === 'de' ? '[Firmenname]' : '[Company Name]');
        const today = formatGovernanceDate(new Date(), locale);

        if (locale === 'de') {
            return [
                `*Diese Erklärung dokumentiert den aktuellen Stand der KI-Governance-` +
                `Grundsätze von ${orgName}. Sie ersetzt keine Rechtsberatung und stellt ` +
                `keine Compliance-Zertifizierung dar.*`,
                ``,
                `---`,
                ``,
                `**Organisation:** ${orgName}`,
                ``,
                `**Verantwortliche Person:** ${contactName}`,
                ``,
                `**Datum:** ${today}`,
                ``,
                `**Ort:** ____________________`,
                ``,
                `**Unterschrift (verantwortliche Person):** ____________________`,
                ``,
                `**Unterschrift (Mitarbeitende/r):** ____________________`,
            ].join('\n');
        }

        return [
            `*This statement documents the current state of the AI governance principles ` +
            `of ${orgName}. It does not replace legal advice and does not constitute ` +
            `a compliance certification.*`,
            ``,
            `---`,
            ``,
            `**Organisation:** ${orgName}`,
            ``,
            `**Responsible Person:** ${contactName}`,
            ``,
            `**Date:** ${today}`,
            ``,
            `**Location:** ____________________`,
            ``,
            `**Signature (Responsible Person):** ____________________`,
            ``,
            `**Signature (Employee):** ____________________`,
        ].join('\n');
    },
};
