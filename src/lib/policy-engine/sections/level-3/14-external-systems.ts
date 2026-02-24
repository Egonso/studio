/**
 * Level 3, Section 14: Externe & kundengerichtete KI-Systeme
 *
 * Conditional: inkludiert wenn ≥1 UseCase mit usageContexts enthält
 * CUSTOMERS, PUBLIC, CUSTOMER_FACING (legacy) oder EXTERNAL_PUBLIC (legacy).
 *
 * Juristisch defensiv: Konjunktiv, "sollte" nicht "muss"
 * Sprint: PE-2b Level 3
 */

import type { SectionDefinition } from '../section-definition';
import type { UseCaseCard, CaptureUsageContext } from '@/lib/register-first/types';

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
    title: 'Externe & kundengerichtete KI-Systeme',
    order: 1500,
    level: 3,

    shouldInclude(context) {
        return context.useCases.some(isExternalFacing);
    },

    buildContent(context) {
        const orgName = context.orgSettings.organisationName || '[Firmenname]';
        const affected = context.useCases.filter(isExternalFacing);

        const lines: string[] = [
            `${orgName} setzt ${affected.length} KI-System${affected.length > 1 ? 'e' : ''} ein, ` +
            `die direkt mit Kund*innen, der Öffentlichkeit oder externen Stakeholdern ` +
            `interagieren. Für diese Systeme gelten erweiterte Anforderungen.`,
            ``,
            `### Betroffene Systeme`,
            ``,
        ];

        for (const uc of affected) {
            const contexts = uc.usageContexts
                ?.filter((ctx) => EXTERNAL_CONTEXTS.includes(ctx))
                .map((ctx) => {
                    switch (ctx) {
                        case 'CUSTOMERS':
                        case 'CUSTOMER_FACING':
                            return 'Kund*innen';
                        case 'PUBLIC':
                        case 'EXTERNAL_PUBLIC':
                            return 'Öffentlichkeit';
                        default:
                            return ctx;
                    }
                }) ?? [];
            const uniqueContexts = [...new Set(contexts)];
            lines.push(`- **${uc.purpose}** – Wirkungsbereich: ${uniqueContexts.join(', ')}`);
        }
        lines.push(``);

        lines.push(`### Erweiterte Anforderungen`);
        lines.push(``);
        lines.push(`1. **KI-Kennzeichnung:** Externe Nutzer*innen sollten klar darüber informiert ` +
            `werden, dass sie mit einem KI-System interagieren (Art. 50 AI Act).`);
        lines.push(`2. **Beschwerdemanagement:** Es sollte ein zugänglicher Kanal für Beschwerden ` +
            `und Rückfragen zu KI-gestützten Entscheidungen eingerichtet werden.`);
        lines.push(`3. **Einschränkung automatisierter Entscheidungen:** Entscheidungen mit ` +
            `wesentlicher Auswirkung auf externe Personen sollten menschlich überprüfbar sein ` +
            `(Art. 22 DSGVO, Art. 14 AI Act).`);
        lines.push(`4. **Datenschutzinformation:** Bei Verarbeitung personenbezogener Daten ` +
            `externer Personen sollte eine transparente Datenschutzinformation bereitgestellt ` +
            `werden (Art. 13/14 DSGVO).`);
        lines.push(`5. **Service Level:** Die Verfügbarkeit und Zuverlässigkeit kundengerichteter ` +
            `KI-Systeme sollte überwacht und dokumentiert werden.`);
        lines.push(``);
        lines.push(
            `Bei extern eingesetzten Hochrisiko-Systemen sollten die Anforderungen aus ` +
            `der Sektion „Hochrisiko-KI-Systeme" zusätzlich beachtet werden.`,
        );

        return lines.join('\n');
    },
};
