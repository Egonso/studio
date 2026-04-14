/**
 * Level 1, Section 01: AI Commitment Statement
 *
 * Preamble and commitment declaration of the organisation.
 * Always included. Populated: company name, industry, date.
 *
 * Content reference: policy-editor.tsx Level 1 Template (line 47–74)
 * Legally defensive: subjunctive, "should", not "must"
 *
 * Sprint: PE-2a Level 1
 */

import type { SectionDefinition } from '../section-definition';

export const commitmentSection: SectionDefinition = {
    sectionId: 'l1-commitment',
    title: 'Commitment to Responsible Use of AI Systems',
    order: 100,
    level: 1,

    shouldInclude: () => true,

    buildContent(context) {
        const orgName = context.orgSettings.organisationName || '[Company Name]';
        const industry = context.orgSettings.industry || '[Industry]';
        const today = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });

        return [
            `**Introduction / Preamble**`,
            ``,
            `${orgName} (Industry: ${industry}) acknowledges that the EU AI Act (Regulation (EU) 2024/1689) ` +
            `introduces new requirements for the use of Artificial Intelligence. ` +
            `This statement communicates to our employees that we intend to deploy AI responsibly, ` +
            `transparently and in accordance with European values.`,
            ``,
            `We are committed to ensuring that the use of AI systems within our organisation ` +
            `is transparent and that the rights of affected persons are safeguarded. ` +
            `This statement documents the current state of our core principles ` +
            `and should be reviewed on a regular basis.`,
            ``,
            `*Created on: ${today}*`,
        ].join('\n');
    },
};
