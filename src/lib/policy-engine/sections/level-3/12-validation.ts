/**
 * Level 3, Section 12: Validation & Testing
 *
 * Describes requirements for testing and validation of AI systems.
 * Always included at Level 3.
 *
 * Legally defensive: subjunctive, "should", not "must"
 * Sprint: PE-2b Level 3
 */

import type { SectionDefinition } from '../section-definition';

export const validationSection: SectionDefinition = {
    sectionId: 'l3-validation',
    title: 'Validation & Testing',
    order: 1300,
    level: 3,

    shouldInclude: () => true,

    buildContent(context) {
        const orgName = context.orgSettings.organisationName || '[Company Name]';
        const totalSystems = context.useCases.length;

        const lines: string[] = [
            `${orgName} should implement a structured validation and testing process ` +
            `for all AI systems. This applies in particular before initial deployment ` +
            `and after material changes to the system.`,
            ``,
            `### Testing Requirements`,
            ``,
            `For the currently ${totalSystems} recorded AI systems, the following ` +
            `testing aspects should be considered:`,
            ``,
            `1. **Functional Validation:** Verification that the system performs its intended ` +
            `function correctly and reliably.`,
            `2. **Bias & Fairness Testing:** Analysis for systematic biases, ` +
            `particularly in systems that influence decisions about natural persons.`,
            `3. **Robustness Testing:** Assessment of system behaviour with unexpected, ` +
            `erroneous or adversarial inputs.`,
            `4. **Performance Monitoring:** Continuous monitoring of system performance ` +
            `in production (model drift detection).`,
            `5. **Integration Testing:** Validation of correct integration into existing ` +
            `business processes and IT systems.`,
            ``,
            `### Documentation`,
            ``,
            `Test results should be documented in a traceable manner, including:`,
            ``,
            `- Test date and tester`,
            `- Test methodology and test data`,
            `- Results and identified deviations`,
            `- Recommended measures and their implementation status`,
            ``,
            `For high-risk systems, the test documentation should form part of the technical ` +
            `documentation pursuant to Art. 11 of the AI Act.`,
        ];

        return lines.join('\n');
    },
};
