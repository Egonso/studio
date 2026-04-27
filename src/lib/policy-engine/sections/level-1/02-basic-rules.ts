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
import { resolveGovernanceCopyLocale } from '@/lib/i18n/governance-copy';

export const basicRulesSection: SectionDefinition = {
    sectionId: 'l1-basic-rules',
    title: 'Basic Rules for AI Use',
    order: 200,
    level: 1,

    shouldInclude: () => true,

    buildContent(context) {
        const locale = resolveGovernanceCopyLocale(context.locale);
        const orgName =
            context.orgSettings.organisationName ||
            (locale === 'de' ? '[Firmenname]' : '[Company Name]');

        if (locale === 'de') {
            return [
                `**Abschnitt A: Grundprinzipien (für alle Mitarbeitenden)**`,
                ``,
                `Die folgenden Grundprinzipien gelten für alle Mitarbeitenden von ${orgName}, ` +
                `die KI-Systeme nutzen oder an KI-gestützten Prozessen beteiligt sind:`,
                ``,
                `1. KI-Systeme sollten nur eingesetzt werden, wenn sie nicht gegen verbotene ` +
                `Praktiken nach Art. 5 des AI Act verstoßen (z. B. Manipulation, Social ` +
                `Scoring oder unterschiedslose biometrische Massenüberwachung).`,
                ``,
                `2. Mitarbeitende sollten KI-Tools mit Bewusstsein für Datenschutz und ` +
                `Sicherheit nutzen. Die Eingabe sensibler personenbezogener Daten in ` +
                `öffentliche KI-Dienste sollte vermieden werden, sofern keine ausdrückliche ` +
                `Freigabe vorliegt.`,
                ``,
                `3. KI-basierte Entscheidungen mit möglicher Auswirkung auf natürliche ` +
                `Personen sollten durch menschliche Überprüfung ergänzt werden.`,
                ``,
                `4. Mitarbeitende sollten sich über interne Leitlinien, Updates und ` +
                `organisationsspezifische Anforderungen zur KI-Nutzung informiert halten.`,
                ``,
                `---`,
                ``,
                `**Abschnitt B: Schulung und Sensibilisierung**`,
                ``,
                `- Mitarbeitende, die regelmäßig mit KI-Tools arbeiten, sollten an einer ` +
                `Sensibilisierungsschulung teilnehmen.`,
                `- Personen, die KI-Systeme verantworten oder einführen, sollten eine ` +
                `vertiefte Schulung absolvieren (intern oder extern).`,
                `- Schulungsnachweise sollten dokumentiert werden.`,
            ].join('\n');
        }

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
