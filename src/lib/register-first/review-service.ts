/**
 * Review-Service – Pure business logic for review operations on UseCaseCards.
 *
 * Responsibilities:
 *   - Add a review event (append-only, never mutates existing reviews)
 *   - Retrieve review history for a use case
 *   - Get the last review for quick-access (dashboard, deadline calculations)
 *
 * Design:
 *   - NUR .ts, KEIN JSX, KEIN React, KEINE Komponenten
 *   - ReviewEvents sind append-only (werden nie geändert oder gelöscht)
 *   - Governance darf nie automatisiert werden → assertManualGovernanceDecision
 *   - Pure functions + thin service wrapper using registerService
 *
 * Sprint: S5-REVIEW-SERVICE
 */

import type {
    UseCaseCard,
    ReviewEvent,
    RegisterUseCaseStatus,
    GovernanceDecisionActor,
} from './types';
import { REGISTER_FIRST_GOVERNANCE_POLICY } from './types';

// ── Error Types ─────────────────────────────────────────────────────────────

export class ReviewServiceError extends Error {
    public readonly code: ReviewServiceErrorCode;
    public readonly details?: unknown;

    constructor(code: ReviewServiceErrorCode, message: string, details?: unknown) {
        super(message);
        this.name = 'ReviewServiceError';
        this.code = code;
        this.details = details;
    }
}

export type ReviewServiceErrorCode =
    | 'EMPTY_REVIEWER'
    | 'INVALID_STATUS'
    | 'AUTOMATION_FORBIDDEN'
    | 'NO_REVIEWS_FOUND';

// ── Input Types ─────────────────────────────────────────────────────────────

export interface AddReviewInput {
    /** Who performed the review (user ID or name) */
    reviewedBy: string;
    /** Target status after review */
    nextStatus: Exclude<RegisterUseCaseStatus, 'UNREVIEWED'>;
    /** Optional notes (max 500 chars, truncated) */
    notes?: string;
    /** Actor type – defaults to HUMAN. System/Automation will be rejected. */
    actor?: GovernanceDecisionActor;
}

// ── Pure Functions ──────────────────────────────────────────────────────────

/**
 * Generate a unique review ID.
 * Format: "rev_<timestamp>_<random>" to ensure sortability + uniqueness.
 */
export function generateReviewId(): string {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).substring(2, 8);
    return `rev_${ts}_${rand}`;
}

/**
 * Assert that the actor is HUMAN (manual governance only).
 * Throws ReviewServiceError if automated.
 *
 * @example
 *   assertManualActor('HUMAN');     // ✅ ok
 *   assertManualActor('SYSTEM');    // ❌ throws
 *   assertManualActor('AUTOMATION'); // ❌ throws
 *   assertManualActor(undefined);   // ✅ defaults to HUMAN
 */
export function assertManualActor(actor?: GovernanceDecisionActor): void {
    const resolved = actor ?? 'HUMAN';
    if (resolved !== 'HUMAN') {
        throw new ReviewServiceError(
            'AUTOMATION_FORBIDDEN',
            `Governance-Entscheidungen dürfen nicht automatisiert werden. ` +
            `Actor "${resolved}" ist nicht erlaubt. ` +
            `Policy: decisionMode=${REGISTER_FIRST_GOVERNANCE_POLICY.decisionMode}`,
        );
    }
}

/**
 * Validate AddReviewInput and return a clean ReviewEvent.
 * Does NOT persist – pure transformation.
 *
 * @param input  User-provided review data
 * @param now    Optional clock override for testing
 * @returns A fully formed ReviewEvent ready to append
 *
 * @example
 *   // ✅ Valid input
 *   createReviewEvent({
 *     reviewedBy: 'alice@example.com',
 *     nextStatus: 'REVIEWED',
 *     notes: 'Alles geprüft',
 *   });
 *   // → { reviewId: 'rev_...', reviewedAt: '2026-...', reviewedBy: 'alice@example.com', nextStatus: 'REVIEWED', notes: 'Alles geprüft' }
 *
 *   // ❌ Empty reviewer
 *   createReviewEvent({ reviewedBy: '', nextStatus: 'REVIEWED' });
 *   // → throws ReviewServiceError('EMPTY_REVIEWER')
 *
 *   // ❌ Invalid status (UNREVIEWED not allowed)
 *   createReviewEvent({ reviewedBy: 'bob', nextStatus: 'UNREVIEWED' });
 *   // → TypeScript compile error (type constraint)
 *
 *   // ❌ Automation forbidden
 *   createReviewEvent({ reviewedBy: 'system', nextStatus: 'REVIEWED', actor: 'SYSTEM' });
 *   // → throws ReviewServiceError('AUTOMATION_FORBIDDEN')
 */
export function createReviewEvent(
    input: AddReviewInput,
    now: () => Date = () => new Date(),
): ReviewEvent {
    // 1. Assert manual governance
    assertManualActor(input.actor);

    // 2. Validate reviewer
    const reviewedBy = input.reviewedBy?.trim();
    if (!reviewedBy || reviewedBy.length === 0) {
        throw new ReviewServiceError(
            'EMPTY_REVIEWER',
            'reviewedBy darf nicht leer sein.',
        );
    }

    // 3. Validate nextStatus (type-level already excludes UNREVIEWED, runtime guard)
    const validStatuses: RegisterUseCaseStatus[] = ['REVIEW_RECOMMENDED', 'REVIEWED', 'PROOF_READY'];
    if (!validStatuses.includes(input.nextStatus)) {
        throw new ReviewServiceError(
            'INVALID_STATUS',
            `nextStatus "${input.nextStatus}" ist ungültig. Erlaubt: ${validStatuses.join(', ')}`,
        );
    }

    // 4. Build event (notes truncated to 500 chars)
    return {
        reviewId: generateReviewId(),
        reviewedAt: now().toISOString(),
        reviewedBy,
        nextStatus: input.nextStatus,
        notes: input.notes?.trim().slice(0, 500) || undefined,
    };
}

/**
 * Append a ReviewEvent to a UseCaseCard's reviews array.
 * Returns a NEW card – never mutates the original (immutable pattern).
 *
 * @param card   Existing UseCaseCard
 * @param event  ReviewEvent to append
 * @returns New UseCaseCard with the event appended and timestamps updated
 *
 * @example
 *   const event = createReviewEvent({ reviewedBy: 'alice', nextStatus: 'REVIEWED' });
 *   const updated = appendReviewToCard(existingCard, event);
 *   // updated.reviews.length === existingCard.reviews.length + 1
 *   // updated.reviews[updated.reviews.length - 1] === event
 *   // updated.governanceAssessment.flex.iso.lastReviewedAt === event.reviewedAt
 */
export function appendReviewToCard(
    card: UseCaseCard,
    event: ReviewEvent,
): UseCaseCard {
    return {
        ...card,
        status: event.nextStatus,
        updatedAt: event.reviewedAt,
        reviews: [...card.reviews, event],
        statusHistory: [
            ...(card.statusHistory ?? []),
            {
                from: card.status,
                to: event.nextStatus,
                changedAt: event.reviewedAt,
                changedBy: event.reviewedBy,
                changedByName: event.reviewedBy,
                reason: event.notes,
            },
        ],
        // Update ISO lastReviewedAt if iso block exists
        governanceAssessment: card.governanceAssessment
            ? {
                ...card.governanceAssessment,
                flex: {
                    ...card.governanceAssessment.flex,
                    iso: card.governanceAssessment.flex?.iso
                        ? {
                            ...card.governanceAssessment.flex.iso,
                            lastReviewedAt: event.reviewedAt,
                        }
                        : card.governanceAssessment.flex?.iso,
                },
            }
            : card.governanceAssessment,
    };
}

// ── Query Functions (Pure) ──────────────────────────────────────────────────

/**
 * Get the full review history for a use case, sorted chronologically (oldest first).
 *
 * @param card  UseCaseCard to extract history from
 * @returns Array of ReviewEvents, sorted by reviewedAt ascending
 *
 * @example
 *   const history = getReviewHistory(card);
 *   // history[0] is the oldest review
 *   // history[history.length - 1] is the most recent review
 *
 *   // Empty reviews array:
 *   getReviewHistory(emptyCard); // → []
 */
export function getReviewHistory(card: UseCaseCard): ReviewEvent[] {
    if (!card.reviews || card.reviews.length === 0) return [];
    // Sort chronologically (oldest first) – reviews should already be ordered,
    // but we sort defensively for data loaded from external sources
    return [...card.reviews].sort(
        (a, b) => new Date(a.reviewedAt).getTime() - new Date(b.reviewedAt).getTime(),
    );
}

/**
 * Get the most recent review for a use case.
 * Returns null if no reviews exist.
 *
 * @param card  UseCaseCard to check
 * @returns The most recent ReviewEvent, or null
 *
 * @example
 *   // Card with reviews:
 *   const last = getLastReview(card);
 *   // last?.reviewedAt is the most recent timestamp
 *   // last?.nextStatus is the current review status
 *
 *   // Card without reviews:
 *   getLastReview(emptyCard); // → null
 */
export function getLastReview(card: UseCaseCard): ReviewEvent | null {
    if (!card.reviews || card.reviews.length === 0) return null;
    const sorted = getReviewHistory(card);
    return sorted[sorted.length - 1];
}

/**
 * Count reviews by target status.
 * Useful for dashboard statistics.
 *
 * @example
 *   countReviewsByStatus(card);
 *   // → { REVIEW_RECOMMENDED: 1, REVIEWED: 3, PROOF_READY: 1 }
 */
export function countReviewsByStatus(
    card: UseCaseCard,
): Partial<Record<Exclude<RegisterUseCaseStatus, 'UNREVIEWED'>, number>> {
    const counts: Partial<Record<Exclude<RegisterUseCaseStatus, 'UNREVIEWED'>, number>> = {};
    for (const review of card.reviews) {
        counts[review.nextStatus] = (counts[review.nextStatus] ?? 0) + 1;
    }
    return counts;
}

/**
 * Check if a use case has ever been reviewed.
 *
 * @example
 *   hasBeenReviewed(newCard);       // → false
 *   hasBeenReviewed(reviewedCard);  // → true
 */
export function hasBeenReviewed(card: UseCaseCard): boolean {
    return card.reviews.length > 0;
}

// ── Composite: addReview ────────────────────────────────────────────────────

/**
 * Full review flow: validate input → create event → append to card.
 * Returns the updated card (immutable).
 *
 * This is the main entry point for adding reviews.
 * Use this in combination with registerService.updateUseCase() to persist.
 *
 * @param card   Existing UseCaseCard
 * @param input  Review input from the user
 * @param now    Optional clock override
 * @returns Updated UseCaseCard with the new review appended
 *
 * @example
 *   // Full flow:
 *   const updated = addReview(card, {
 *     reviewedBy: 'alice@example.com',
 *     nextStatus: 'REVIEWED',
 *     notes: 'ISO 42001 Konformität geprüft',
 *   });
 *
 *   // Then persist:
 *   await registerService.updateUseCase(card.useCaseId, {
 *     status: updated.status,
 *     reviews: updated.reviews,
 *     statusHistory: updated.statusHistory,
 *     updatedAt: updated.updatedAt,
 *     governanceAssessment: updated.governanceAssessment,
 *   });
 */
export function addReview(
    card: UseCaseCard,
    input: AddReviewInput,
    now: () => Date = () => new Date(),
): UseCaseCard {
    const event = createReviewEvent(input, now);
    return appendReviewToCard(card, event);
}
