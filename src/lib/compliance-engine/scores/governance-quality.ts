import type { UseCaseCard } from '@/lib/register-first/types';

/**
 * Governance Quality Score – measures how well-governed a use case is.
 * NOT how risky or exposed. Purely: completeness, consistency, traceability.
 *
 * Range: 0–100
 *
 * Scoring logic (from Sprint Plan S4-DUALSCORE):
 *   purpose vorhanden: +15
 *   responsibility zugewiesen: +15
 *   usageContexts.length > 0: +10
 *   status !== UNREVIEWED: +20
 *   governanceAssessment.core vorhanden: +15
 *   iso.reviewCycle !== 'unknown': +10
 *   Maßnahmen / measures defined: +15
 */

// ── Criterion Definition ────────────────────────────────────────────────────

interface QualityCriterion {
    key: string;
    label: string;
    weight: number;
    evaluate: (card: UseCaseCard) => boolean;
}

const QUALITY_CRITERIA: readonly QualityCriterion[] = [
    {
        key: 'purposeDefined',
        label: 'Zweck definiert',
        weight: 15,
        evaluate: (card) => card.purpose?.trim().length > 0,
    },
    {
        key: 'responsibilityAssigned',
        label: 'Verantwortlichkeit zugewiesen',
        weight: 15,
        evaluate: (card) =>
            card.responsibility?.isCurrentlyResponsible ||
            (card.responsibility?.responsibleParty?.trim().length ?? 0) > 0,
    },
    {
        key: 'usageContextDefined',
        label: 'Verwendungskontext angegeben',
        weight: 10,
        evaluate: (card) => (card.usageContexts?.length ?? 0) > 0,
    },
    {
        key: 'reviewed',
        label: 'Review durchgeführt',
        weight: 20,
        evaluate: (card) => card.status != null && card.status !== 'UNREVIEWED',
    },
    {
        key: 'coreAssessment',
        label: 'Governance Assessment (Core)',
        weight: 15,
        evaluate: (card) => card.governanceAssessment?.core != null,
    },
    {
        key: 'reviewCycleDefined',
        label: 'Review-Zyklus festgelegt',
        weight: 10,
        evaluate: (card) => {
            const rc = card.governanceAssessment?.flex?.iso?.reviewCycle;
            return rc != null && rc !== 'unknown';
        },
    },
    {
        key: 'measuresDefined',
        label: 'Maßnahmen definiert',
        weight: 15,
        evaluate: (card) => {
            const flex = card.governanceAssessment?.flex;
            if (!flex) return false;
            return (
                (flex.riskControls != null && flex.riskControls.length > 0) ||
                (flex.policyLinks != null && flex.policyLinks.length > 0) ||
                flex.incidentProcessDefined === true
            );
        },
    },
];

// ── Result Types ────────────────────────────────────────────────────────────

export interface QualityBreakdownEntry {
    key: string;
    label: string;
    weight: number;
    passed: boolean;
}

export interface GovernanceQualityResult {
    /** Total score 0–100 */
    score: number;
    /** Human-readable tier */
    label: string;
    /** Individual criterion results (for dashboard drill-down) */
    breakdown: QualityBreakdownEntry[];
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Calculate governance quality with full breakdown.
 */
export function calculateGovernanceQualityDetailed(useCase: UseCaseCard): GovernanceQualityResult {
    let score = 0;
    const breakdown: QualityBreakdownEntry[] = [];

    for (const criterion of QUALITY_CRITERIA) {
        const passed = criterion.evaluate(useCase);
        if (passed) score += criterion.weight;
        breakdown.push({
            key: criterion.key,
            label: criterion.label,
            weight: criterion.weight,
            passed,
        });
    }

    score = Math.min(score, 100);

    return {
        score,
        label: getGovernanceQualityLabel(score),
        breakdown,
    };
}

/**
 * Calculate governance quality (numeric score only).
 * Backwards-compatible – used by aggregator and existing code.
 */
export function calculateGovernanceQuality(useCase: UseCaseCard): number {
    return calculateGovernanceQualityDetailed(useCase).score;
}

/**
 * Get a qualitative label for governance quality.
 */
export function getGovernanceQualityLabel(score: number): string {
    if (score >= 80) return 'Strong';
    if (score >= 60) return 'Solid';
    if (score >= 40) return 'Developing';
    if (score >= 20) return 'Incomplete';
    return 'Not assessed';
}
