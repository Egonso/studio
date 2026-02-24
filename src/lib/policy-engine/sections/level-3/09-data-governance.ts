/**
 * Level 3, Section 09: Daten-Governance
 *
 * Conditional: inkludiert wenn ≥1 UseCase personenbezogene oder sensible Daten verarbeitet.
 * Prüft resolveDataCategories() auf PERSONAL_DATA, PERSONAL, SPECIAL_PERSONAL,
 * SENSITIVE, HEALTH_DATA, BIOMETRIC_DATA.
 *
 * conditionLabel: "Gilt für Systeme mit personenbezogenen/sensiblen Daten"
 * Juristisch defensiv: Konjunktiv, "sollte" nicht "muss"
 * Sprint: PE-2b Level 3
 */

import type { SectionDefinition } from '../section-definition';
import type { UseCaseCard, DataCategory } from '@/lib/register-first/types';
import { resolveDataCategories, DATA_CATEGORY_LABELS } from '@/lib/register-first/types';

/** Data categories that trigger this section */
const PERSONAL_CATEGORIES: DataCategory[] = [
    'PERSONAL_DATA',
    'PERSONAL',        // legacy
    'SPECIAL_PERSONAL',
    'SENSITIVE',       // legacy
    'HEALTH_DATA',
    'BIOMETRIC_DATA',
    'POLITICAL_RELIGIOUS',
    'OTHER_SENSITIVE',
];

/** Check if a use case processes personal/sensitive data */
function hasPersonalData(uc: UseCaseCard): boolean {
    const cats = resolveDataCategories(uc);
    return cats.some((c) => PERSONAL_CATEGORIES.includes(c));
}

export const dataGovernanceSection: SectionDefinition = {
    sectionId: 'l3-data-governance',
    title: 'Daten-Governance & Datenschutz',
    order: 1000,
    level: 3,

    shouldInclude(context) {
        return context.useCases.some(hasPersonalData);
    },

    buildContent(context) {
        const orgName = context.orgSettings.organisationName || '[Firmenname]';
        const affected = context.useCases.filter(hasPersonalData);
        const dpo = context.orgSettings.raci?.dpo;

        // Collect all unique personal data categories across affected use cases
        const allCats = new Set<DataCategory>();
        for (const uc of affected) {
            for (const cat of resolveDataCategories(uc)) {
                if (PERSONAL_CATEGORIES.includes(cat)) {
                    allCats.add(cat);
                }
            }
        }

        const lines: string[] = [
            `${orgName} verarbeitet in ${affected.length} erfassten KI-System${affected.length > 1 ? 'en' : ''} ` +
            `personenbezogene oder sensible Daten. Die folgenden Anforderungen gelten ` +
            `ergänzend zu den allgemeinen Datenschutzvorgaben der DSGVO.`,
            ``,
            `### Betroffene Datenkategorien`,
            ``,
        ];

        for (const cat of allCats) {
            const label = DATA_CATEGORY_LABELS[cat] || cat;
            lines.push(`- ${label}`);
        }
        lines.push(``);

        lines.push(`### Betroffene Systeme`);
        lines.push(``);
        for (const uc of affected) {
            const cats = resolveDataCategories(uc)
                .filter((c) => PERSONAL_CATEGORIES.includes(c))
                .map((c) => DATA_CATEGORY_LABELS[c] || c);
            lines.push(`- **${uc.purpose}** – ${cats.join(', ')}`);
        }
        lines.push(``);

        if (dpo?.name) {
            lines.push(`**Datenschutzbeauftragte:r:** ${dpo.name}${dpo.department ? ` (${dpo.department})` : ''}`);
            lines.push(``);
        }

        lines.push(`### Anforderungen`);
        lines.push(``);
        lines.push(`- Vor Inbetriebnahme eines KI-Systems mit personenbezogenen Daten sollte eine ` +
            `Datenschutz-Folgenabschätzung (DSFA) geprüft werden (Art. 35 DSGVO).`);
        lines.push(`- Die Rechtsgrundlage für die Datenverarbeitung sollte dokumentiert sein.`);
        lines.push(`- Betroffenenrechte (Auskunft, Löschung, Widerspruch) sollten ` +
            `auch bei KI-gestützter Verarbeitung gewährleistet bleiben.`);
        lines.push(`- Bei Systemen mit besonders sensiblen Daten (Gesundheit, Biometrie) ` +
            `sollten zusätzliche technische und organisatorische Maßnahmen ergriffen werden.`);

        return lines.join('\n');
    },
};
