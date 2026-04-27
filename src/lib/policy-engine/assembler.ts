/**
 * Policy Assembler – Deterministic assembly of policy documents from sections.
 *
 * Flow:
 *   1. Collects all SectionDefinitions for the chosen level
 *   2. Filters with shouldInclude(context)
 *   3. Sorts by order ascending
 *   4. Builds content with buildContent(context)
 *   5. Returns PolicySection[] ready for storage or rendering
 *
 * Design:
 *   - .ts only, no JSX, no React
 *   - No LLM calls, fully deterministic
 *   - Pure function, no side effects
 *   - Error-resilient: sections that throw are skipped with a warning
 *
 * Sprint: PE-2a Policy Assembler
 */

import type { PolicyContext, PolicySection } from './types';
import { getLevelSections } from './sections';
import {
    getConditionalPolicySectionLabel,
    getPolicySectionTitle,
} from '@/lib/i18n/governance-copy';

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Assemble a complete policy document from section definitions.
 *
 * @param context  Full policy context (register, useCases, orgSettings, level)
 * @returns Array of PolicySections, sorted by order, ready for rendering/storage
 *
 * @example
 *   const sections = assemblePolicy({
 *     register: myRegister,
 *     useCases: allUseCases,
 *     orgSettings: settings,
 *     level: 1,
 *   });
 *   // → [{ sectionId: 'l1-commitment', title: '...', content: '...', order: 100, ... }, ...]
 */
export function assemblePolicy(context: PolicyContext): PolicySection[] {
    // 1. Get all definitions for the requested level
    const definitions = getLevelSections(context.level);

    // 2. Filter + build
    const sections: PolicySection[] = [];

    for (const def of definitions) {
        try {
            // 2a. Check if section should be included
            const included = def.shouldInclude(context);
            if (!included) continue;

            // 2b. Build content
            const content = def.buildContent(context);

            // 2c. Determine if conditional (not always-included)
            const isConditional = !isAlwaysIncluded(def, context);

            sections.push({
                sectionId: def.sectionId,
                title: getPolicySectionTitle(
                    def.sectionId,
                    def.title,
                    context.locale,
                ),
                content,
                order: def.order,
                isConditional,
                conditionLabel: isConditional
                    ? deriveConditionLabel(def, context)
                    : undefined,
            });
        } catch (err) {
            // Error-resilient: skip broken sections, log warning
            console.warn(
                `[PolicyAssembler] Section "${def.sectionId}" threw during assembly, skipping:`,
                err,
            );
        }
    }

    // 3. Sort by order (should already be sorted from getLevelSections, but defensive)
    sections.sort((a, b) => a.order - b.order);

    return sections;
}

/**
 * Assemble and return the full policy as a single Markdown string.
 * Useful for preview or export.
 *
 * @param context  Full policy context
 * @returns Complete Markdown document
 */
export function assemblePolicyMarkdown(context: PolicyContext): string {
    const sections = assemblePolicy(context);

    const lines: string[] = [];

    // Document title based on level
    const isGerman = context.locale?.toLowerCase().startsWith('de');
    const levelTitles: Record<1 | 2 | 3, string> = isGerman
        ? {
            1: 'KI-Commitment-Erklärung',
            2: 'KI-Governance- und Nutzungsrichtlinie',
            3: 'Technische und Entwickler-Richtlinie',
        }
        : {
            1: 'AI Commitment Statement',
            2: 'AI Governance & Usage Policy',
            3: 'Technical & Developer Policy',
        };

    const orgName =
        context.orgSettings.organisationName ||
        (isGerman ? '[Organisationsname]' : '[Organisation name]');
    lines.push(`# ${levelTitles[context.level]}`);
    lines.push(`**${orgName}**`);
    lines.push('');

    for (const section of sections) {
        lines.push(`## ${section.title}`);
        lines.push('');
        lines.push(section.content);
        lines.push('');
    }

    return lines.join('\n');
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Check if a section is always included (unconditional).
 * We do this by testing shouldInclude with a minimal context variant.
 * For now, sections that always return true from shouldInclude are unconditional.
 */
function isAlwaysIncluded(
    def: { shouldInclude: (ctx: PolicyContext) => boolean },
    _context: PolicyContext,
): boolean {
    // Heuristic: if shouldInclude is `() => true` (no context dependency),
    // it's always included. We detect this by checking the function body length.
    // More robust: sections can declare this explicitly in the future.
    // For now, Level 1 sections are all always-included.
    try {
        // Test with the actual context — if true, assume always-included
        // (this is a simplification; conditional sections override shouldInclude
        //  with context-dependent logic that may return false for some contexts)
        return def.shouldInclude(_context);
    } catch {
        return false;
    }
}

/**
 * Derive a human-readable condition label for conditional sections.
 * Only called for sections where isConditional = true.
 */
function deriveConditionLabel(
    def: { sectionId: string },
    context: PolicyContext,
): string | undefined {
    // Future: map sectionId patterns to condition descriptions
    // e.g., "l2-data-protection" → "Applies to systems processing personal data"
    return getConditionalPolicySectionLabel(def.sectionId, context.locale);
}
