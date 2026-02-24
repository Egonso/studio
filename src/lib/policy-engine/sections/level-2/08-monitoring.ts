/**
 * Level 2, Section 08: Monitoring & Audit
 *
 * Beschreibt den Review-Zyklus und Audit-Ansatz der Organisation.
 * Referenziert orgSettings.reviewStandard und orgSettings.reviewCycle.
 * Immer inkludiert bei Level 2.
 *
 * Juristisch defensiv: Konjunktiv, "sollte" nicht "muss"
 * Sprint: PE-2b Level 2
 */

import type { SectionDefinition } from '../section-definition';

/** Map review standard values to German labels */
const REVIEW_STANDARD_LABELS: Record<string, string> = {
    annual: 'jährlich',
    semiannual: 'halbjährlich',
    'risk-based': 'risikobasiert',
};

/** Map review cycle types to German labels */
const REVIEW_CYCLE_TYPE_LABELS: Record<string, string> = {
    fixed: 'Fester Zyklus',
    risk_based: 'Risikobasiert',
    event_based: 'Anlassbezogen',
};

export const monitoringSection: SectionDefinition = {
    sectionId: 'l2-monitoring',
    title: 'Monitoring & Audit',
    order: 700,
    level: 2,

    shouldInclude: () => true,

    buildContent(context) {
        const orgName = context.orgSettings.organisationName || '[Firmenname]';
        const reviewStandard = context.orgSettings.reviewStandard;
        const reviewCycle = context.orgSettings.reviewCycle;
        const reviewOwner = context.orgSettings.raci?.reviewOwner;

        const lines: string[] = [
            `${orgName} sollte KI-Systeme regelmäßig überprüfen, um deren Konformität mit ` +
            `internen Richtlinien und regulatorischen Anforderungen sicherzustellen.`,
            ``,
            `### Review-Zyklus`,
            ``,
        ];

        if (reviewStandard) {
            const label = REVIEW_STANDARD_LABELS[reviewStandard] || reviewStandard;
            lines.push(`**Review-Standard:** ${label}`);
            lines.push(``);
        }

        if (reviewCycle) {
            const typeLabel = REVIEW_CYCLE_TYPE_LABELS[reviewCycle.type] || reviewCycle.type;
            lines.push(`**Review-Typ:** ${typeLabel}`);
            if (reviewCycle.interval) {
                lines.push(`**Intervall:** ${reviewCycle.interval}`);
            }
            lines.push(``);
        }

        if (!reviewStandard && !reviewCycle) {
            lines.push(
                `> *Es wurde noch kein formaler Review-Zyklus definiert. ` +
                `Eine mindestens jährliche Überprüfung wird empfohlen.*`,
            );
            lines.push(``);
        }

        if (reviewOwner?.name) {
            lines.push(
                `**Review-Verantwortliche:r:** ${reviewOwner.name}` +
                `${reviewOwner.department ? ` (${reviewOwner.department})` : ''}`,
            );
            lines.push(``);
        }

        lines.push(`### Prüfungsinhalte`);
        lines.push(``);
        lines.push(`Jede Überprüfung sollte mindestens folgende Aspekte umfassen:`);
        lines.push(``);
        lines.push(`- Aktualität und Vollständigkeit des KI-Registers`);
        lines.push(`- Korrektheit der Risikobewertungen (AI-Act-Kategorie)`);
        lines.push(`- Wirksamkeit der definierten Kontrollmaßnahmen`);
        lines.push(`- Einhaltung der Datenschutzanforderungen`);
        lines.push(`- Dokumentation von Vorfällen und Korrekturmaßnahmen`);
        lines.push(``);
        lines.push(
            `Die Ergebnisse jeder Überprüfung sollten dokumentiert und den relevanten ` +
            `Stakeholdern zugänglich gemacht werden.`,
        );

        return lines.join('\n');
    },
};
