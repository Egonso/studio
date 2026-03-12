/**
 * Shared UseCase Builder – Single Source of Truth for card creation logic.
 * Used by BOTH registerFirstService (Dashboard/Legacy) and registerService (Standalone).
 */
import {
  parseCaptureInput,
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
 * All new writes use the canonical v1.1 card shape.
 */
export function prepareUseCaseForStorage(
  input: unknown,
  options: PrepareUseCaseOptions
): UseCaseCard {
  const currentTime = options.now ?? new Date();
  parseCaptureInput(input);

  return createUseCaseCardV11Draft(input, {
    useCaseId: options.useCaseId,
    globalUseCaseId: generateGlobalUseCaseId(currentTime),
    publicHashId: generatePublicHashId(),
    now: currentTime,
    status: "UNREVIEWED",
  });
}
