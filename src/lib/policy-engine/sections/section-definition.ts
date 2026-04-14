/**
 * SectionDefinition – Interface for deterministic policy section builders.
 *
 * Every section (Level 1, 2, 3) implements this interface.
 * The Assembler collects all SectionDefinitions, filters by shouldInclude(),
 * sorts by order, and builds content via buildContent().
 *
 * Design:
 *   - .ts only, NO JSX, NO React, NO components
 *   - No LLM calls, everything deterministic
 *   - All policy text in ENGLISH
 *   - Legally defensive: subjunctive, "should", not "must"
 *   - Markdown format for all contents
 *
 * Sprint: PE-2a Section Registry
 */

import type { PolicyContext } from '../types';

// ── Interface ────────────────────────────────────────────────────────────────

export interface SectionDefinition {
    /** Unique section identifier, e.g. "l1-commitment", "l2-inventory" */
    sectionId: string;

    /** Human-readable section title (English) */
    title: string;

    /** Sort order within the policy document (lower = earlier) */
    order: number;

    /** Which policy level(s) this section belongs to */
    level: 1 | 2 | 3;

    /**
     * Determine whether this section should be included in the output.
     * Called with the full PolicyContext for conditional sections.
     *
     * @example
     *   // Always included (e.g. commitment statement)
     *   shouldInclude: () => true
     *
     *   // Only if personal data is processed
     *   shouldInclude: (ctx) => hasPersonalData(ctx.useCases)
     */
    shouldInclude(context: PolicyContext): boolean;

    /**
     * Build the Markdown content for this section.
     * Receives the full PolicyContext for data interpolation.
     *
     * @returns Markdown string (no frontmatter, no title – title is separate)
     */
    buildContent(context: PolicyContext): string;
}
