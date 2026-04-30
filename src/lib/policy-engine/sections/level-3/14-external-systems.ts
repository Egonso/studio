/**
 * Level 3, Section 14: External & Customer-Facing AI Systems
 *
 * Conditional: included when >= 1 use case has usageContexts containing
 * CUSTOMERS, PUBLIC, CUSTOMER_FACING (legacy) or EXTERNAL_PUBLIC (legacy).
 *
 * Legally defensive: subjunctive, "should", not "must"
 * Sprint: PE-2b Level 3
 */

import type { SectionDefinition } from '../section-definition';
import type { UseCaseCard, CaptureUsageContext } from '@/lib/register-first/types';
import { resolveGovernanceCopyLocale } from '@/lib/i18n/governance-copy';

/** Usage contexts that indicate external/customer-facing systems */
const EXTERNAL_CONTEXTS: CaptureUsageContext[] = [
    'CUSTOMERS',
    'PUBLIC',
    'CUSTOMER_FACING',  // legacy
    'EXTERNAL_PUBLIC',  // legacy
];

/** Check if a use case is external/customer-facing */
function isExternalFacing(uc: UseCaseCard): boolean {
    return uc.usageContexts?.some((ctx) => EXTERNAL_CONTEXTS.includes(ctx)) ?? false;
}

export const externalSystemsSection: SectionDefinition = {
    sectionId: 'l3-external-systems',
    title: 'External & Customer-Facing AI Systems',
    order: 1500,
    level: 3,

    shouldInclude(context) {
        return context.useCases.some(isExternalFacing);
    },

    buildContent(context) {
        const locale = resolveGovernanceCopyLocale(context.locale);
        const isGerman = locale === 'de';
        const orgName =
            context.orgSettings.organisationName ||
            (isGerman ? '[Firmenname]' : '[Company Name]');
        const affected = context.useCases.filter(isExternalFacing);

        const lines: string[] = isGerman
            ? [
                `${orgName} setzt ${affected.length} KI-System${affected.length > 1 ? 'e' : ''} ein, ` +
                `die direkt mit Kundinnen und Kunden, der Öffentlichkeit oder externen Stakeholdern interagieren. ` +
                `Für diese Systeme gelten erweiterte Anforderungen.`,
                ``,
                `### Betroffene Systeme`,
                ``,
            ]
            : [
                `${orgName} deploys ${affected.length} AI system${affected.length > 1 ? 's' : ''} ` +
                `that interact directly with customers, the public or external stakeholders. ` +
                `Extended requirements apply to these systems.`,
                ``,
                `### Affected Systems`,
                ``,
            ];

        for (const uc of affected) {
            const contexts = uc.usageContexts
                ?.filter((ctx) => EXTERNAL_CONTEXTS.includes(ctx))
                .map((ctx) => {
                    switch (ctx) {
                        case 'CUSTOMERS':
                        case 'CUSTOMER_FACING':
                            return isGerman ? 'Kundinnen und Kunden' : 'Customers';
                        case 'PUBLIC':
                        case 'EXTERNAL_PUBLIC':
                            return isGerman ? 'Öffentlichkeit' : 'Public';
                        default:
                            return ctx;
                    }
                }) ?? [];
            const uniqueContexts = [...new Set(contexts)];
            lines.push(isGerman
                ? `- **${uc.purpose}** – Wirkbereich: ${uniqueContexts.join(', ')}`
                : `- **${uc.purpose}** – Scope of impact: ${uniqueContexts.join(', ')}`);
        }
        lines.push(``);

        lines.push(isGerman ? `### Erweiterte Anforderungen` : `### Extended Requirements`);
        lines.push(``);
        if (isGerman) {
            lines.push(`1. **KI-Offenlegung:** Externe Nutzerinnen und Nutzer sollten klar informiert werden, wenn sie mit einem KI-System interagieren (Art. 50 AI Act).`);
            lines.push(`2. **Beschwerdemanagement:** Ein zugänglicher Kanal für Beschwerden und Anfragen zu KI-gestützten Entscheidungen sollte eingerichtet werden.`);
            lines.push(`3. **Begrenzung automatisierter Entscheidungen:** Entscheidungen mit wesentlicher Auswirkung auf externe Personen sollten menschlicher Überprüfung unterliegen (Art. 22 DSGVO, Art. 14 AI Act).`);
            lines.push(`4. **Datenschutzinformationen:** Werden personenbezogene Daten externer Personen verarbeitet, sollten transparente Datenschutzinformationen bereitgestellt werden (Art. 13/14 DSGVO).`);
            lines.push(`5. **Service Level:** Verfügbarkeit und Zuverlässigkeit kundenbezogener KI-Systeme sollten überwacht und dokumentiert werden.`);
        } else {
            lines.push(`1. **AI Disclosure:** External users should be clearly informed ` +
                `that they are interacting with an AI system (Art. 50 AI Act).`);
            lines.push(`2. **Complaints Management:** An accessible channel for complaints ` +
                `and enquiries regarding AI-supported decisions should be established.`);
            lines.push(`3. **Restriction of Automated Decisions:** Decisions with a ` +
                `material impact on external persons should be subject to human review ` +
                `(Art. 22 GDPR, Art. 14 AI Act).`);
            lines.push(`4. **Data Protection Information:** Where personal data of ` +
                `external persons is processed, transparent data protection information should be provided ` +
                `(Art. 13/14 GDPR).`);
            lines.push(`5. **Service Level:** The availability and reliability of customer-facing ` +
                `AI systems should be monitored and documented.`);
        }
        lines.push(``);
        lines.push(
            isGerman
                ? `Bei extern eingesetzten Hochrisiko-Systemen sollten zusätzlich die Anforderungen aus ` +
                `dem Abschnitt "Anforderungen an Hochrisiko-KI-Systeme" beachtet werden.`
                : `For externally deployed high-risk systems, the requirements from ` +
                `the "Requirements for High-Risk AI Systems" section should also be observed.`,
        );

        return lines.join('\n');
    },
};
