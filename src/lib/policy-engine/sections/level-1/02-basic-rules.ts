/**
 * Level 1, Section 02: Basic Rules for AI Use
 *
 * References Art. 5 AI Act (Prohibited AI Practices).
 * Core principles for all employees.
 * Always included.
 *
 * Content reference: policy-editor.tsx Level 1 Template (line 55–67)
 * Legally defensive: subjunctive, "should", not "must"
 *
 * Sprint: PE-2a Level 1
 */

import type { SectionDefinition } from '../section-definition';

export const basicRulesSection: SectionDefinition = {
    sectionId: 'l1-basic-rules',
    title: 'Basic Rules for AI Use',
    order: 200,
    level: 1,

    shouldInclude: () => true,

    buildContent(context) {
        const orgName = context.orgSettings.organisationName || '[Company Name]';

        return [
            `**Section A: Core Principles (for all employees)**`,
            ``,
            `The following core principles apply to all employees of ${orgName} ` +
            `who use AI systems or are involved in AI-supported processes:`,
            ``,
            `1. AI systems should only be deployed where they do not contravene prohibited practices ` +
            `under Art. 5 of the AI Act (e.g. manipulation, social scoring, ` +
            `indiscriminate biometric mass surveillance).`,
            ``,
            `2. Employees should use AI tools with awareness of data protection and security. ` +
            `The input of sensitive personal data into public AI services should be avoided ` +
            `unless explicit authorisation has been granted.`,
            ``,
            `3. AI-based decisions that may have an impact on natural persons ` +
            `should be supplemented by human review.`,
            ``,
            `4. Employees should stay informed about internal guidelines, updates and ` +
            `organisation-specific requirements regarding AI use.`,
            ``,
            `---`,
            ``,
            `**Section B: Training & Awareness**`,
            ``,
            `- Employees who regularly work with AI tools should participate in an ` +
            `awareness training session.`,
            `- Individuals who are responsible for or introduce AI systems should complete ` +
            `an in-depth training course (internal or external).`,
            `- Training records should be documented.`,
        ].join('\n');
    },
};
