/**
 * Trust Portal Service – Business logic for public visibility toggle.
 *
 * Responsibilities:
 *   - Activate / deactivate public visibility for a UseCaseCard
 *   - Generate publicHashId on first activation (idempotent – never overwrites existing)
 *   - Query helpers: isPubliclyVerifiable, getVerifyUrl
 *
 * Design:
 *   - NUR .ts, KEIN JSX, KEIN React, KEINE Komponenten
 *   - publicHashId ≠ Firestore-ID (Sicherheit: kein direkter DB-Zugriff via öffentlicher URL)
 *   - Idempotent: doppelter activate-Aufruf → kein neuer hashId
 *   - Pure query functions (isPubliclyVerifiable, getVerifyUrl) brauchen keinen Service-Aufruf
 *   - Persistence über registerService.setPublicVisibility() (Dual-Write: private card + public index)
 *
 * Sprint: GN-B Trust Portal Service
 */

import type { UseCaseCard } from './types';
import { generatePublicHashId } from './id-generation';
import { buildVerifyPassHref, buildVerifyPassAbsoluteUrl } from './entry-links';
import { registerService } from './register-service';

// ── Error Types ─────────────────────────────────────────────────────────────

export class TrustPortalServiceError extends Error {
    public readonly code: TrustPortalErrorCode;
    public readonly details?: unknown;

    constructor(code: TrustPortalErrorCode, message: string, details?: unknown) {
        super(message);
        this.name = 'TrustPortalServiceError';
        this.code = code;
        this.details = details;
    }
}

export type TrustPortalErrorCode =
    | 'USE_CASE_NOT_FOUND'
    | 'CARD_VERSION_MISMATCH'
    | 'ACTIVATION_FAILED'
    | 'DEACTIVATION_FAILED';

// ── Result Types ────────────────────────────────────────────────────────────

export interface ActivationResult {
    /** Updated card after activation */
    card: UseCaseCard;
    /** The public hash ID (existing or newly generated) */
    publicHashId: string;
    /** The relative verify URL: /verify/pass/<hashId> */
    verifyUrl: string;
    /** Whether a new hashId was generated (false if already existed) */
    wasNewlyGenerated: boolean;
}

export interface DeactivationResult {
    /** Updated card after deactivation */
    card: UseCaseCard;
    /** The publicHashId is preserved for potential re-activation */
    publicHashId: string | null;
}

// ── Pure Query Functions ────────────────────────────────────────────────────

/**
 * Check if a use case is currently publicly verifiable.
 * A card is verifiable if BOTH isPublicVisible is true AND a publicHashId exists.
 *
 * @param card  UseCaseCard to check
 * @returns true if the card is publicly accessible via verify URL
 *
 * @example
 *   // ✅ Publicly verifiable
 *   isPubliclyVerifiable({ isPublicVisible: true, publicHashId: 'abc123def456' });
 *   // → true
 *
 *   // ❌ Visibility off
 *   isPubliclyVerifiable({ isPublicVisible: false, publicHashId: 'abc123def456' });
 *   // → false
 *
 *   // ❌ No hash ID
 *   isPubliclyVerifiable({ isPublicVisible: true, publicHashId: undefined });
 *   // → false
 *
 *   // ❌ Both missing
 *   isPubliclyVerifiable({ isPublicVisible: undefined, publicHashId: undefined });
 *   // → false
 */
export function isPubliclyVerifiable(card: UseCaseCard): boolean {
    return card.isPublicVisible === true && !!card.publicHashId;
}

/**
 * Get the relative verify URL for a use case, or null if not publicly verifiable.
 *
 * @param card  UseCaseCard to get URL for
 * @returns Relative URL like "/verify/pass/abc123def456", or null
 *
 * @example
 *   // ✅ Publicly verifiable
 *   getVerifyUrl({ isPublicVisible: true, publicHashId: 'abc123def456' });
 *   // → '/verify/pass/abc123def456'
 *
 *   // ❌ Not verifiable
 *   getVerifyUrl({ isPublicVisible: false, publicHashId: 'abc123def456' });
 *   // → null
 *
 *   // ❌ No hash ID
 *   getVerifyUrl({ isPublicVisible: true });
 *   // → null
 */
export function getVerifyUrl(card: UseCaseCard): string | null {
    if (!isPubliclyVerifiable(card)) return null;
    return buildVerifyPassHref(card.publicHashId!);
}

/**
 * Get the absolute verify URL for sharing (e.g. in emails, QR codes).
 *
 * @param card     UseCaseCard to get URL for
 * @param baseUrl  Optional base URL override (defaults to window.location.origin or production URL)
 * @returns Absolute URL like "https://app.kiregister.com/verify/pass/abc123def456", or null
 *
 * @example
 *   getVerifyAbsoluteUrl({ isPublicVisible: true, publicHashId: 'abc123def456' });
 *   // → 'https://app.kiregister.com/verify/pass/abc123def456'
 */
export function getVerifyAbsoluteUrl(
    card: UseCaseCard,
    baseUrl?: string,
): string | null {
    if (!isPubliclyVerifiable(card)) return null;
    return buildVerifyPassAbsoluteUrl(card.publicHashId!, baseUrl);
}

/**
 * Get the visibility status summary for a use case.
 * Useful for dashboard display.
 *
 * @example
 *   getVisibilityStatus({ isPublicVisible: true, publicHashId: 'abc123' });
 *   // → { isVisible: true, hasHashId: true, isVerifiable: true, label: 'Öffentlich sichtbar' }
 *
 *   getVisibilityStatus({ isPublicVisible: false, publicHashId: 'abc123' });
 *   // → { isVisible: false, hasHashId: true, isVerifiable: false, label: 'Nicht sichtbar (Hash vorhanden)' }
 *
 *   getVisibilityStatus({ isPublicVisible: false, publicHashId: undefined });
 *   // → { isVisible: false, hasHashId: false, isVerifiable: false, label: 'Nicht veröffentlicht' }
 */
export interface VisibilityStatus {
    isVisible: boolean;
    hasHashId: boolean;
    isVerifiable: boolean;
    label: string;
}

export function getVisibilityStatus(card: UseCaseCard): VisibilityStatus {
    const isVisible = card.isPublicVisible === true;
    const hasHashId = !!card.publicHashId;
    const isVerifiable = isVisible && hasHashId;

    let label: string;
    if (isVerifiable) {
        label = 'Öffentlich sichtbar';
    } else if (hasHashId && !isVisible) {
        label = 'Nicht sichtbar (Hash vorhanden)';
    } else {
        label = 'Nicht veröffentlicht';
    }

    return { isVisible, hasHashId, isVerifiable, label };
}

// ── Service Functions (with Persistence) ────────────────────────────────────

/**
 * Activate public visibility for a use case.
 *
 * Idempotent behavior:
 *   - If publicHashId already exists → reuses it (no new generation)
 *   - If publicHashId is missing → generates a new one via generatePublicHashId()
 *   - If already visible with existing hashId → still saves (updates timestamp) but no hashId change
 *
 * Flow:
 *   1. Load existing card via registerService.getUseCase()
 *   2. If no publicHashId → generate one and save via registerService.updateUseCase()
 *   3. Set isPublicVisible = true via registerService.setPublicVisibility() (handles Dual-Write to public index)
 *   4. Return ActivationResult
 *
 * Security:
 *   - publicHashId is NEVER the Firestore document ID
 *   - Generated via crypto.getRandomValues() – 12 chars, URL-safe
 *
 * @param useCaseId     Firestore ID of the use case
 * @param registerId    Optional register ID (resolved from cache if omitted)
 * @param toolName      Optional resolved tool name for public index entry
 * @returns ActivationResult with updated card, hashId, and verify URL
 *
 * @example
 *   // First activation (no hashId yet):
 *   const result = await activatePublicVisibility('uc_123');
 *   // result.wasNewlyGenerated === true
 *   // result.publicHashId === 'abc123def456' (newly generated)
 *   // result.verifyUrl === '/verify/pass/abc123def456'
 *
 *   // Second activation (idempotent – same hashId):
 *   const result2 = await activatePublicVisibility('uc_123');
 *   // result2.wasNewlyGenerated === false
 *   // result2.publicHashId === 'abc123def456' (unchanged)
 */
export async function activatePublicVisibility(
    useCaseId: string,
    registerId?: string,
    toolName?: string,
): Promise<ActivationResult> {
    try {
        // 1. Load existing card
        const existing = await registerService.getUseCase(registerId ?? undefined, useCaseId);
        if (!existing) {
            throw new TrustPortalServiceError(
                'USE_CASE_NOT_FOUND',
                `Use Case '${useCaseId}' nicht gefunden.`,
            );
        }

        // 2. Ensure publicHashId exists (idempotent: generate only if missing)
        let wasNewlyGenerated = false;
        let hashId = existing.publicHashId;

        if (!hashId) {
            hashId = generatePublicHashId();
            wasNewlyGenerated = true;

            // Persist the new hashId first (separate from visibility toggle)
            await registerService.updateUseCase(useCaseId, {
                publicHashId: hashId,
            });
        }

        // 3. Activate visibility via setPublicVisibility (handles Dual-Write to public index)
        const updated = await registerService.setPublicVisibility({
            registerId,
            useCaseId,
            isPublicVisible: true,
            resolvedToolName: toolName,
        });

        // 4. Build result
        const verifyUrl = buildVerifyPassHref(hashId);

        return {
            card: updated,
            publicHashId: hashId,
            verifyUrl,
            wasNewlyGenerated,
        };
    } catch (error) {
        if (error instanceof TrustPortalServiceError) throw error;
        throw new TrustPortalServiceError(
            'ACTIVATION_FAILED',
            `Öffentliche Sichtbarkeit konnte nicht aktiviert werden: ${error instanceof Error ? error.message : String(error)}`,
            { cause: error },
        );
    }
}

/**
 * Deactivate public visibility for a use case.
 *
 * Behavior:
 *   - Sets isPublicVisible = false
 *   - publicHashId is PRESERVED (for potential re-activation)
 *   - Removes entry from public index via setPublicVisibility Dual-Write
 *
 * Idempotent: calling deactivate on an already-hidden card is a no-op
 * (still saves to ensure updatedAt is refreshed).
 *
 * @param useCaseId     Firestore ID of the use case
 * @param registerId    Optional register ID
 * @returns DeactivationResult with updated card
 *
 * @example
 *   const result = await deactivatePublicVisibility('uc_123');
 *   // result.card.isPublicVisible === false
 *   // result.publicHashId === 'abc123def456' (preserved for re-activation)
 */
export async function deactivatePublicVisibility(
    useCaseId: string,
    registerId?: string,
): Promise<DeactivationResult> {
    try {
        const updated = await registerService.setPublicVisibility({
            registerId,
            useCaseId,
            isPublicVisible: false,
        });

        return {
            card: updated,
            publicHashId: updated.publicHashId ?? null,
        };
    } catch (error) {
        if (error instanceof TrustPortalServiceError) throw error;
        throw new TrustPortalServiceError(
            'DEACTIVATION_FAILED',
            `Öffentliche Sichtbarkeit konnte nicht deaktiviert werden: ${error instanceof Error ? error.message : String(error)}`,
            { cause: error },
        );
    }
}

/**
 * Toggle public visibility (convenience function).
 *
 * @param useCaseId   Firestore ID of the use case
 * @param visible     Target visibility state
 * @param registerId  Optional register ID
 * @param toolName    Optional tool name for public index (only relevant when activating)
 * @returns The updated UseCaseCard
 *
 * @example
 *   await togglePublicVisibility('uc_123', true);   // activate
 *   await togglePublicVisibility('uc_123', false);  // deactivate
 */
export async function togglePublicVisibility(
    useCaseId: string,
    visible: boolean,
    registerId?: string,
    toolName?: string,
): Promise<UseCaseCard> {
    if (visible) {
        const result = await activatePublicVisibility(useCaseId, registerId, toolName);
        return result.card;
    } else {
        const result = await deactivatePublicVisibility(useCaseId, registerId);
        return result.card;
    }
}
