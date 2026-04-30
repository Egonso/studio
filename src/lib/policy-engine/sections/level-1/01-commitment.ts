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
import {
    formatGovernanceDate,
    resolveGovernanceCopyLocale,
} from '@/lib/i18n/governance-copy';

export const commitmentSection: SectionDefinition = {
    sectionId: 'l1-commitment',
    title: 'Commitment to Responsible Use of AI Systems',
    order: 100,
    level: 1,

    shouldInclude: () => true,

    buildContent(context) {
        const locale = resolveGovernanceCopyLocale(context.locale);
        const orgName =
            context.orgSettings.organisationName ||
            (locale === 'de' ? '[Firmenname]' : '[Company Name]');
        const industry =
            context.orgSettings.industry ||
            (locale === 'de' ? '[Branche]' : '[Industry]');
        const today = formatGovernanceDate(new Date(), locale);

        if (locale === 'de') {
            return [
                `**Einleitung / Präambel**`,
                ``,
                `${orgName} (Branche: ${industry}) erkennt an, dass der EU AI Act ` +
                `(Verordnung (EU) 2024/1689) neue Anforderungen an den Einsatz ` +
                `Künstlicher Intelligenz stellt. Diese Erklärung dokumentiert, dass KI ` +
                `verantwortungsvoll, nachvollziehbar und im Einklang mit europäischen ` +
                `Werten eingesetzt werden soll.`,
                ``,
                `Wir verpflichten uns, den Einsatz von KI-Systemen innerhalb unserer ` +
                `Organisation transparent zu gestalten und die Rechte betroffener Personen ` +
                `zu wahren. Diese Erklärung hält den aktuellen Stand unserer Grundprinzipien ` +
                `fest und sollte regelmäßig überprüft werden.`,
                ``,
                `*Erstellt am: ${today}*`,
            ].join('\n');
        }

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
