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

export const signatureSection: SectionDefinition = {
    sectionId: 'l1-signature',
    title: 'Effective Date & Signatures',
    order: 900,
    level: 1,

    shouldInclude: () => true,

    buildContent(context) {
        const contactName = context.orgSettings.contactPerson?.name || '[Responsible Person]';
        const orgName = context.orgSettings.organisationName || '[Company Name]';
        const today = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });

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
