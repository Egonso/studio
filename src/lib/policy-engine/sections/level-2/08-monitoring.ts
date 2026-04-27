/**
 * Level 2, Section 08: Monitoring & Audit
 *
 * Describes the review cycle and audit approach of the organisation.
 * References orgSettings.reviewStandard and orgSettings.reviewCycle.
 * Always included at Level 2.
 *
 * Legally defensive: subjunctive, "should", not "must"
 * Sprint: PE-2b Level 2
 */

import type { SectionDefinition } from '../section-definition';
import { resolveGovernanceCopyLocale } from '@/lib/i18n/governance-copy';

/** Map review standard values to English labels */
const REVIEW_STANDARD_LABELS: Record<string, string> = {
    annual: 'annual',
    semiannual: 'semi-annual',
    'risk-based': 'risk-based',
};

const REVIEW_STANDARD_LABELS_DE: Record<string, string> = {
    annual: 'jährlich',
    semiannual: 'halbjährlich',
    'risk-based': 'risikobasiert',
};

/** Map review cycle types to English labels */
const REVIEW_CYCLE_TYPE_LABELS: Record<string, string> = {
    fixed: 'Fixed cycle',
    risk_based: 'Risk-based',
    event_based: 'Event-driven',
};

const REVIEW_CYCLE_TYPE_LABELS_DE: Record<string, string> = {
    fixed: 'Fester Zyklus',
    risk_based: 'Risikobasiert',
    event_based: 'Ereignisbasiert',
};

export const monitoringSection: SectionDefinition = {
    sectionId: 'l2-monitoring',
    title: 'Monitoring & Audit',
    order: 700,
    level: 2,

    shouldInclude: () => true,

    buildContent(context) {
        const locale = resolveGovernanceCopyLocale(context.locale);
        const isGerman = locale === 'de';
        const orgName =
            context.orgSettings.organisationName ||
            (isGerman ? '[Firmenname]' : '[Company Name]');
        const reviewStandard = context.orgSettings.reviewStandard;
        const reviewCycle = context.orgSettings.reviewCycle;
        const reviewOwner = context.orgSettings.raci?.reviewOwner;

        const lines: string[] = isGerman
            ? [
                `${orgName} sollte KI-Systeme regelmäßig überprüfen, um ihre Übereinstimmung ` +
                `mit internen Richtlinien und regulatorischen Anforderungen sicherzustellen.`,
                ``,
                `### Review-Zyklus`,
                ``,
            ]
            : [
                `${orgName} should review AI systems on a regular basis to ensure their conformity with ` +
                `internal policies and regulatory requirements.`,
                ``,
                `### Review Cycle`,
                ``,
            ];

        if (reviewStandard) {
            const label = (isGerman ? REVIEW_STANDARD_LABELS_DE[reviewStandard] : REVIEW_STANDARD_LABELS[reviewStandard]) || reviewStandard;
            lines.push(`${isGerman ? '**Review-Standard:**' : '**Review Standard:**'} ${label}`);
            lines.push(``);
        }

        if (reviewCycle) {
            const typeLabel = (isGerman ? REVIEW_CYCLE_TYPE_LABELS_DE[reviewCycle.type] : REVIEW_CYCLE_TYPE_LABELS[reviewCycle.type]) || reviewCycle.type;
            lines.push(`${isGerman ? '**Review-Typ:**' : '**Review Type:**'} ${typeLabel}`);
            if (reviewCycle.interval) {
                lines.push(`${isGerman ? '**Intervall:**' : '**Interval:**'} ${reviewCycle.interval}`);
            }
            lines.push(``);
        }

        if (!reviewStandard && !reviewCycle) {
            lines.push(
                isGerman
                    ? `> *Es wurde noch kein formaler Review-Zyklus definiert. ` +
                    `Eine Überprüfung mindestens einmal jährlich wird empfohlen.*`
                    : `> *No formal review cycle has been defined yet. ` +
                    `A review at least once per year is recommended.*`,
            );
            lines.push(``);
        }

        if (reviewOwner?.name) {
            lines.push(
                `${isGerman ? '**Review-Owner:**' : '**Review Owner:**'} ${reviewOwner.name}` +
                `${reviewOwner.department ? ` (${reviewOwner.department})` : ''}`,
            );
            lines.push(``);
        }

        lines.push(isGerman ? `### Review-Umfang` : `### Review Scope`);
        lines.push(``);
        lines.push(isGerman
            ? `Jeder Review sollte mindestens die folgenden Aspekte abdecken:`
            : `Each review should cover at least the following aspects:`);
        lines.push(``);
        if (isGerman) {
            lines.push(`- Vollständigkeit und Richtigkeit des KI-Registers`);
            lines.push(`- Korrektheit der Risikobewertungen (AI-Act-Kategorie)`);
            lines.push(`- Wirksamkeit der definierten Kontrollmaßnahmen`);
            lines.push(`- Einhaltung von Datenschutzanforderungen`);
            lines.push(`- Dokumentation von Vorfällen und Korrekturmaßnahmen`);
        } else {
            lines.push(`- Completeness and accuracy of the AI register`);
            lines.push(`- Correctness of risk assessments (AI Act category)`);
            lines.push(`- Effectiveness of the defined control measures`);
            lines.push(`- Compliance with data protection requirements`);
            lines.push(`- Documentation of incidents and corrective actions`);
        }
        lines.push(``);
        lines.push(
            isGerman
                ? `Die Ergebnisse jedes Reviews sollten dokumentiert und den relevanten Stakeholdern ` +
                `zugänglich gemacht werden.`
                : `The results of each review should be documented and made available to the relevant ` +
                `stakeholders.`,
        );

        return lines.join('\n');
    },
};
