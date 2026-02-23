/**
 * Frist-Engine – Pure deadline calculation for review cycles.
 *
 * Responsibilities:
 *   - Map ISO review cycles to month intervals
 *   - Calculate the next review deadline from last review date + cycle
 *   - Determine overdue / upcoming status for dashboards
 *
 * Design:
 *   - NUR .ts, KEIN JSX, KEIN React, KEINE Komponenten
 *   - Pure functions, no side effects, no Firestore
 *   - All dates as ISO strings (input/output), Date objects only internally
 *   - ad_hoc and unknown cycles return null deadlines (no automatic schedule)
 *
 * Sprint: S5-FRIST-ENGINE
 */

import type { UseCaseCard } from '@/lib/register-first/types';

// ── Types ───────────────────────────────────────────────────────────────────

/** ISO review cycle values from the UseCaseCard schema */
export type ReviewCycle = 'annual' | 'semiannual' | 'quarterly' | 'monthly' | 'ad_hoc' | 'unknown';

/** Deadline urgency status for UI badges */
export type DeadlineStatus = 'overdue' | 'due_soon' | 'on_track' | 'no_deadline';

/** Result of a deadline calculation */
export interface ReviewDeadlineResult {
    /** Next review deadline as ISO string, or null if no cycle / ad_hoc / unknown */
    nextReviewAt: string | null;
    /** Days remaining until deadline (negative = overdue) */
    daysRemaining: number | null;
    /** Urgency status for UI rendering */
    status: DeadlineStatus;
    /** The review cycle used for calculation */
    cycle: ReviewCycle;
    /** The last review date used as basis, or null */
    lastReviewedAt: string | null;
}

// ── Cycle-to-Months Mapping ─────────────────────────────────────────────────

/**
 * Review cycle to month interval mapping.
 *
 * @example
 *   cycleToMonths('monthly');     // → 1
 *   cycleToMonths('quarterly');   // → 3
 *   cycleToMonths('semiannual');  // → 6
 *   cycleToMonths('annual');      // → 12
 *   cycleToMonths('ad_hoc');      // → null (no fixed schedule)
 *   cycleToMonths('unknown');     // → null (not configured)
 */
export function cycleToMonths(cycle: ReviewCycle): number | null {
    switch (cycle) {
        case 'monthly': return 1;
        case 'quarterly': return 3;
        case 'semiannual': return 6;
        case 'annual': return 12;
        case 'ad_hoc': return null;
        case 'unknown': return null;
    }
}

// ── Date Arithmetic (Pure) ──────────────────────────────────────────────────

/**
 * Add months to a date, handling month-end rollover correctly.
 * Pure function – returns a new Date, does not mutate input.
 *
 * @example
 *   addMonths(new Date('2026-01-31'), 1);  // → 2026-02-28 (clamped)
 *   addMonths(new Date('2026-03-15'), 3);  // → 2026-06-15
 *   addMonths(new Date('2026-01-15'), 12); // → 2027-01-15
 */
export function addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    const targetMonth = result.getMonth() + months;
    const dayOfMonth = result.getDate();

    // Set to first of target month to avoid premature rollover
    result.setDate(1);
    result.setMonth(targetMonth);

    // Clamp day to last day of target month
    const lastDayOfTargetMonth = new Date(
        result.getFullYear(),
        result.getMonth() + 1,
        0,
    ).getDate();
    result.setDate(Math.min(dayOfMonth, lastDayOfTargetMonth));

    return result;
}

/**
 * Calculate the difference in calendar days between two dates.
 * Positive = future is ahead, negative = future is in the past.
 *
 * @example
 *   daysBetween(new Date('2026-01-01'), new Date('2026-01-15')); // → 14
 *   daysBetween(new Date('2026-01-15'), new Date('2026-01-01')); // → -14
 */
export function daysBetween(from: Date, to: Date): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    // Use UTC to avoid DST issues
    const utcFrom = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
    const utcTo = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
    return Math.round((utcTo - utcFrom) / msPerDay);
}

// ── Deadline Status Classification ──────────────────────────────────────────

/** Days threshold for "due_soon" – within 30 days by default */
const DUE_SOON_THRESHOLD_DAYS = 30;

/**
 * Classify a deadline into a UI-friendly status.
 *
 * @param daysRemaining  Days until deadline (negative = overdue)
 * @returns DeadlineStatus for badge/color rendering
 *
 * @example
 *   classifyDeadlineStatus(-5);   // → 'overdue'
 *   classifyDeadlineStatus(0);    // → 'due_soon'
 *   classifyDeadlineStatus(15);   // → 'due_soon'
 *   classifyDeadlineStatus(31);   // → 'on_track'
 *   classifyDeadlineStatus(null); // → 'no_deadline'
 */
export function classifyDeadlineStatus(daysRemaining: number | null): DeadlineStatus {
    if (daysRemaining === null) return 'no_deadline';
    if (daysRemaining < 0) return 'overdue';
    if (daysRemaining <= DUE_SOON_THRESHOLD_DAYS) return 'due_soon';
    return 'on_track';
}

/**
 * Get a German label for a deadline status.
 *
 * @example
 *   getDeadlineStatusLabel('overdue');     // → 'Überfällig'
 *   getDeadlineStatusLabel('due_soon');    // → 'Bald fällig'
 *   getDeadlineStatusLabel('on_track');    // → 'Im Zeitplan'
 *   getDeadlineStatusLabel('no_deadline'); // → 'Keine Frist'
 */
export function getDeadlineStatusLabel(status: DeadlineStatus): string {
    switch (status) {
        case 'overdue': return 'Überfällig';
        case 'due_soon': return 'Bald fällig';
        case 'on_track': return 'Im Zeitplan';
        case 'no_deadline': return 'Keine Frist';
    }
}

/**
 * Get a color for a deadline status (for badges/cards).
 *
 * @example
 *   getDeadlineStatusColor('overdue');     // → '#ef4444' (red)
 *   getDeadlineStatusColor('due_soon');    // → '#f97316' (orange)
 *   getDeadlineStatusColor('on_track');    // → '#22c55e' (green)
 *   getDeadlineStatusColor('no_deadline'); // → '#94a3b8' (gray)
 */
export function getDeadlineStatusColor(status: DeadlineStatus): string {
    switch (status) {
        case 'overdue': return '#ef4444';
        case 'due_soon': return '#f97316';
        case 'on_track': return '#22c55e';
        case 'no_deadline': return '#94a3b8';
    }
}

// ── Main Calculation ────────────────────────────────────────────────────────

/**
 * Calculate the next review deadline for a use case.
 *
 * Logic:
 *   1. Read reviewCycle from governanceAssessment.flex.iso
 *   2. If cycle is 'ad_hoc' or 'unknown' → return no_deadline
 *   3. Read lastReviewedAt from iso block, or fall back to last review event
 *   4. If no last review date → use card createdAt as fallback
 *   5. Add cycle months to last review date → nextReviewAt
 *   6. Calculate daysRemaining relative to `today`
 *   7. Classify into DeadlineStatus
 *
 * @param card   UseCaseCard to calculate deadline for
 * @param today  Optional clock override for testing (defaults to now)
 * @returns ReviewDeadlineResult with deadline, days remaining, and status
 *
 * @example
 *   // ── Card with annual cycle, last reviewed 6 months ago ──
 *   // card.governanceAssessment.flex.iso.reviewCycle = 'annual'
 *   // card.governanceAssessment.flex.iso.lastReviewedAt = '2025-08-23'
 *   // today = 2026-02-23
 *   calculateReviewDeadline(card);
 *   // → { nextReviewAt: '2026-08-23', daysRemaining: 181, status: 'on_track', ... }
 *
 *   // ── Card with quarterly cycle, last reviewed 4 months ago (overdue) ──
 *   // card.governanceAssessment.flex.iso.reviewCycle = 'quarterly'
 *   // card.governanceAssessment.flex.iso.lastReviewedAt = '2025-10-01'
 *   // today = 2026-02-23
 *   calculateReviewDeadline(card);
 *   // → { nextReviewAt: '2026-01-01', daysRemaining: -53, status: 'overdue', ... }
 *
 *   // ── Card with ad_hoc cycle ──
 *   // card.governanceAssessment.flex.iso.reviewCycle = 'ad_hoc'
 *   calculateReviewDeadline(card);
 *   // → { nextReviewAt: null, daysRemaining: null, status: 'no_deadline', ... }
 *
 *   // ── Card without ISO block ──
 *   // card.governanceAssessment = undefined
 *   calculateReviewDeadline(card);
 *   // → { nextReviewAt: null, daysRemaining: null, status: 'no_deadline', cycle: 'unknown', ... }
 *
 *   // ── Card with no reviews, falls back to createdAt ──
 *   // card.governanceAssessment.flex.iso.reviewCycle = 'monthly'
 *   // card.governanceAssessment.flex.iso.lastReviewedAt = null
 *   // card.reviews = []
 *   // card.createdAt = '2026-01-15'
 *   // today = 2026-02-23
 *   calculateReviewDeadline(card);
 *   // → { nextReviewAt: '2026-02-15', daysRemaining: -8, status: 'overdue', ... }
 */
export function calculateReviewDeadline(
    card: UseCaseCard,
    today: Date = new Date(),
): ReviewDeadlineResult {
    // 1. Extract review cycle
    const cycle: ReviewCycle = card.governanceAssessment?.flex?.iso?.reviewCycle ?? 'unknown';

    // 2. Map cycle to months
    const months = cycleToMonths(cycle);
    if (months === null) {
        return {
            nextReviewAt: null,
            daysRemaining: null,
            status: 'no_deadline',
            cycle,
            lastReviewedAt: card.governanceAssessment?.flex?.iso?.lastReviewedAt ?? null,
        };
    }

    // 3. Determine last review date (ISO block → last review event → createdAt)
    let lastReviewedAt: string | null =
        card.governanceAssessment?.flex?.iso?.lastReviewedAt ?? null;

    if (!lastReviewedAt && card.reviews.length > 0) {
        // Fall back to most recent review event timestamp
        const sorted = [...card.reviews].sort(
            (a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime(),
        );
        lastReviewedAt = sorted[0].reviewedAt;
    }

    if (!lastReviewedAt) {
        // Fall back to card creation date
        lastReviewedAt = card.createdAt;
    }

    // 4. Calculate next deadline
    const lastDate = new Date(lastReviewedAt);
    const nextDate = addMonths(lastDate, months);
    const nextReviewAt = nextDate.toISOString();

    // 5. Calculate days remaining
    const daysRemaining = daysBetween(today, nextDate);

    // 6. Classify status
    const status = classifyDeadlineStatus(daysRemaining);

    return {
        nextReviewAt,
        daysRemaining,
        status,
        cycle,
        lastReviewedAt,
    };
}

// ── Batch Operations ────────────────────────────────────────────────────────

/**
 * Calculate deadlines for multiple use cases at once.
 * Useful for dashboard overview / org-level deadline summary.
 *
 * @param cards  Array of UseCaseCards
 * @param today  Optional clock override
 * @returns Array of { useCaseId, purpose, ...deadline } objects
 *
 * @example
 *   const deadlines = calculateBatchDeadlines(useCases);
 *   const overdue = deadlines.filter(d => d.status === 'overdue');
 *   // → all use cases that need immediate review attention
 */
export function calculateBatchDeadlines(
    cards: UseCaseCard[],
    today: Date = new Date(),
): (ReviewDeadlineResult & { useCaseId: string; purpose: string })[] {
    return cards.map((card) => ({
        useCaseId: card.useCaseId,
        purpose: card.purpose,
        ...calculateReviewDeadline(card, today),
    }));
}

/**
 * Aggregate deadline statistics across multiple use cases.
 * For org-level dashboard widgets.
 *
 * @example
 *   const stats = aggregateDeadlineStats(useCases);
 *   // → { overdue: 3, dueSoon: 5, onTrack: 12, noDeadline: 2, total: 22 }
 */
export interface DeadlineAggregation {
    overdue: number;
    dueSoon: number;
    onTrack: number;
    noDeadline: number;
    total: number;
    /** Nearest upcoming deadline (excluding overdue), or null */
    nearestDeadline: string | null;
    /** Most overdue use case ID, or null */
    mostOverdueUseCaseId: string | null;
}

export function aggregateDeadlineStats(
    cards: UseCaseCard[],
    today: Date = new Date(),
): DeadlineAggregation {
    const result: DeadlineAggregation = {
        overdue: 0,
        dueSoon: 0,
        onTrack: 0,
        noDeadline: 0,
        total: cards.length,
        nearestDeadline: null,
        mostOverdueUseCaseId: null,
    };

    let mostOverdueDays = 0;
    let nearestUpcomingDays = Infinity;

    for (const card of cards) {
        const deadline = calculateReviewDeadline(card, today);

        switch (deadline.status) {
            case 'overdue':
                result.overdue++;
                if (deadline.daysRemaining !== null && deadline.daysRemaining < mostOverdueDays) {
                    mostOverdueDays = deadline.daysRemaining;
                    result.mostOverdueUseCaseId = card.useCaseId;
                }
                break;
            case 'due_soon':
                result.dueSoon++;
                if (deadline.daysRemaining !== null && deadline.daysRemaining < nearestUpcomingDays) {
                    nearestUpcomingDays = deadline.daysRemaining;
                    result.nearestDeadline = deadline.nextReviewAt;
                }
                break;
            case 'on_track':
                result.onTrack++;
                if (deadline.daysRemaining !== null && deadline.daysRemaining < nearestUpcomingDays) {
                    nearestUpcomingDays = deadline.daysRemaining;
                    result.nearestDeadline = deadline.nextReviewAt;
                }
                break;
            case 'no_deadline':
                result.noDeadline++;
                break;
        }
    }

    return result;
}
