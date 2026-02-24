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

// ── Level 2 Sections ─────────────────────────────────────────────────────────
import { rolesSection } from './level-2/04-roles';
import { riskApproachSection } from './level-2/05-risk-approach';
import { incidentSection } from './level-2/06-incident';
import { trainingSection } from './level-2/07-training';
import { monitoringSection } from './level-2/08-monitoring';

// ── Level 3 Sections ─────────────────────────────────────────────────────────
import { dataGovernanceSection } from './level-3/09-data-governance';
import { highRiskSection } from './level-3/10-highRisk';
import { transparencySection } from './level-3/11-transparency';
import { validationSection } from './level-3/12-validation';
import { loggingSection } from './level-3/13-logging';
import { externalSystemsSection } from './level-3/14-external-systems';
import { hrRecruitmentSection } from './level-3/15-hr-recruitment';

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

    // Level 2
    rolesSection,
    riskApproachSection,
    incidentSection,
    trainingSection,
    monitoringSection,

    // Level 3
    dataGovernanceSection,
    highRiskSection,
    transparencySection,
    validationSection,
    loggingSection,
    externalSystemsSection,
    hrRecruitmentSection,
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
