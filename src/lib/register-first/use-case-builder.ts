/**
 * Shared UseCase Builder – Single Source of Truth for card creation logic.
 * Used by BOTH registerFirstService (Dashboard/Legacy) and registerService (Standalone).
 */
import {
  parseCaptureInput,
  createUseCaseCardDraft,
  createUseCaseCardV11Draft,
} from "./schema";
import {
  generateGlobalUseCaseId,
  generatePublicHashId,
} from "./id-generation";
import type { UseCaseCard } from "./types";

export interface PrepareUseCaseOptions {
  useCaseId: string;
  now?: Date;
}

/**
 * Parses raw capture input and creates a validated UseCaseCard draft.
 * Automatically detects v1.0 vs v1.1 based on whether toolId/dataCategory are present.
 */
export function prepareUseCaseForStorage(
  input: unknown,
  options: PrepareUseCaseOptions
): UseCaseCard {
  const currentTime = options.now ?? new Date();
  const parsed = parseCaptureInput(input);
  const isV11 = !!(parsed.toolId || parsed.dataCategory);

  if (isV11) {
    return createUseCaseCardV11Draft(input, {
      useCaseId: options.useCaseId,
      globalUseCaseId: generateGlobalUseCaseId(currentTime),
      publicHashId: generatePublicHashId(),
      now: currentTime,
      status: "UNREVIEWED",
    });
  }

  return createUseCaseCardDraft(input, {
    useCaseId: options.useCaseId,
    now: currentTime,
    status: "UNREVIEWED",
  });
}
