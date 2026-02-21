import type { UseCaseCard } from "./types";
import { generateGlobalUseCaseId, generatePublicHashId } from "./id-generation";

/**
 * Migrates a v1.0 UseCaseCard to v1.1 by filling in default values
 * for the new fields. Idempotent: calling on a v1.1 card is a no-op.
 *
 * Does NOT persist – caller must save via repository.
 */
export function migrateCardToV1_1(
  card: UseCaseCard,
  now: Date = new Date()
): UseCaseCard {
  // Already v1.1 (or higher) – return as-is
  if (card.cardVersion !== "1.0") {
    return card;
  }

  return {
    ...card,
    cardVersion: "1.1",
    globalUseCaseId: card.globalUseCaseId ?? generateGlobalUseCaseId(now),
    formatVersion: card.formatVersion ?? "v1.1",
    dataCategory: card.dataCategory ?? "INTERNAL",
    publicHashId: card.publicHashId ?? generatePublicHashId(),
    isPublicVisible: card.isPublicVisible ?? false,
    // toolId and toolFreeText remain undefined if not set – no default tool
  };
}

/**
 * Checks if a card needs migration to v1.1.
 */
export function needsMigrationToV1_1(card: UseCaseCard): boolean {
  return card.cardVersion === "1.0";
}

/**
 * Ensures a card read from Firestore has all v1.1 fields populated
 * (in-memory only, for display/export). Useful in read paths where
 * you want to guarantee v1.1 shape without writing back.
 */
export function ensureV1_1Shape(card: UseCaseCard): UseCaseCard {
  if (card.cardVersion === "1.1" && card.globalUseCaseId && card.publicHashId) {
    return card;
  }
  return migrateCardToV1_1(card);
}
