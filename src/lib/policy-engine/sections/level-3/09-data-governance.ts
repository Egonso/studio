/**
 * Level 3, Section 09: Data Governance
 *
 * Conditional: included when >= 1 use case processes personal or sensitive data.
 * Checks resolveDataCategories() for PERSONAL_DATA, PERSONAL, SPECIAL_PERSONAL,
 * SENSITIVE, HEALTH_DATA, BIOMETRIC_DATA.
 *
 * conditionLabel: "Applies to systems processing personal/sensitive data"
 * Legally defensive: subjunctive, "should", not "must"
 * Sprint: PE-2b Level 3
 */

import type { SectionDefinition } from '../section-definition';
import type { UseCaseCard, DataCategory } from '@/lib/register-first/types';
import {
    getDataCategoryLabel,
    resolveDataCategories,
} from '@/lib/register-first/types';
import { resolveGovernanceCopyLocale } from '@/lib/i18n/governance-copy';

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
    title: 'Data Governance & Data Protection',
    order: 1000,
    level: 3,

    shouldInclude(context) {
        return context.useCases.some(hasPersonalData);
    },

    buildContent(context) {
        const locale = resolveGovernanceCopyLocale(context.locale);
        const isGerman = locale === 'de';
        const orgName =
            context.orgSettings.organisationName ||
            (isGerman ? '[Firmenname]' : '[Company Name]');
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

        const lines: string[] = isGerman
            ? [
                `${orgName} verarbeitet personenbezogene oder sensible Daten in ${affected.length} dokumentierten ` +
                `KI-System${affected.length > 1 ? 'en' : ''}. Die folgenden Anforderungen gelten ergänzend ` +
                `zu den allgemeinen Datenschutzvorgaben der DSGVO.`,
                ``,
                `### Betroffene Datenkategorien`,
                ``,
            ]
            : [
                `${orgName} processes personal or sensitive data in ${affected.length} recorded AI system${affected.length > 1 ? 's' : ''}. ` +
                `The following requirements apply in addition to the general data protection ` +
                `provisions of the GDPR.`,
                ``,
                `### Affected Data Categories`,
                ``,
            ];

        for (const cat of allCats) {
            const label = getDataCategoryLabel(cat, locale) || cat;
            lines.push(`- ${label}`);
        }
        lines.push(``);

        lines.push(isGerman ? `### Betroffene Systeme` : `### Affected Systems`);
        lines.push(``);
        for (const uc of affected) {
            const cats = resolveDataCategories(uc)
                .filter((c) => PERSONAL_CATEGORIES.includes(c))
                .map((c) => getDataCategoryLabel(c, locale) || c);
            lines.push(`- **${uc.purpose}** – ${cats.join(', ')}`);
        }
        lines.push(``);

        if (dpo?.name) {
            lines.push(`${isGerman ? '**Datenschutzbeauftragte/r:**' : '**Data Protection Officer:**'} ${dpo.name}${dpo.department ? ` (${dpo.department})` : ''}`);
            lines.push(``);
        }

        lines.push(isGerman ? `### Anforderungen` : `### Requirements`);
        lines.push(``);
        if (isGerman) {
            lines.push(`- Vor dem Einsatz eines KI-Systems mit personenbezogenen Daten sollte eine Datenschutz-Folgenabschätzung (DSFA) geprüft werden (Art. 35 DSGVO).`);
            lines.push(`- Die Rechtsgrundlage der Datenverarbeitung sollte dokumentiert werden.`);
            lines.push(`- Betroffenenrechte (Auskunft, Löschung, Widerspruch) sollten auch in KI-gestützter Verarbeitung gewahrt bleiben.`);
            lines.push(`- Für Systeme mit besonders sensiblen Daten (Gesundheit, Biometrie) sollten zusätzliche technische und organisatorische Maßnahmen umgesetzt werden.`);
        } else {
            lines.push(`- Before deploying an AI system that processes personal data, a ` +
                `Data Protection Impact Assessment (DPIA) should be considered (Art. 35 GDPR).`);
            lines.push(`- The legal basis for the data processing should be documented.`);
            lines.push(`- Data subject rights (access, erasure, objection) should ` +
                `remain safeguarded even in AI-supported processing.`);
            lines.push(`- For systems handling particularly sensitive data (health, biometrics), ` +
                `additional technical and organisational measures should be implemented.`);
        }

        return lines.join('\n');
    },
};
