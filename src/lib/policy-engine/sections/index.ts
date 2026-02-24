/**
 * Section Registry – Central registry of all policy section definitions.
 *
 * Exports all sections as a flat array and provides getLevelSections()
 * to filter by policy level.
 *
 * New sections are registered here by adding them to ALL_SECTIONS.
 * The Assembler consumes this registry to build policies.
 *
 * Sprint: PE-2a Section Registry
 */

import type { PolicyLevel } from '../types';
import type { SectionDefinition } from './section-definition';

// ── Level 1 Sections ─────────────────────────────────────────────────────────
import { commitmentSection } from './level-1/01-commitment';
import { basicRulesSection } from './level-1/02-basic-rules';
import { signatureSection } from './level-1/03-signature';

// ── Level 2 Sections (PE-2b) ────────────────────────────────────────────────
// import { ... } from './level-2/...';

// ── Level 3 Sections (PE-2c) ────────────────────────────────────────────────
// import { ... } from './level-3/...';

// ── Registry ────────────────────────────────────────────────────────────────

/**
 * All registered section definitions across all levels.
 * Add new sections here to include them in policy generation.
 */
export const ALL_SECTIONS: SectionDefinition[] = [
    // Level 1
    commitmentSection,
    basicRulesSection,
    signatureSection,

    // Level 2 (PE-2b – will be added here)

    // Level 3 (PE-2c – will be added here)
];

/**
 * Get all section definitions for a specific policy level.
 * Sorted by order ascending.
 *
 * @example
 *   const l1Sections = getLevelSections(1);
 *   // → [commitmentSection, basicRulesSection, signatureSection]
 */
export function getLevelSections(level: PolicyLevel): SectionDefinition[] {
    return ALL_SECTIONS
        .filter((s) => s.level === level)
        .sort((a, b) => a.order - b.order);
}

// ── Re-exports ──────────────────────────────────────────────────────────────

export type { SectionDefinition } from './section-definition';
