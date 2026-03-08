import type {
  CaptureUsageContext,
  DataCategory,
  DecisionInfluence,
} from "@/lib/register-first/types";
import {
  DATA_CATEGORY_LABELS,
  USAGE_CONTEXT_LABELS,
  DECISION_INFLUENCE_OPTIONS,
} from "@/lib/register-first/types";

interface CaptureByCodeSelectionInput {
  usageContext?: unknown;
  usageContexts?: unknown;
  dataCategory?: unknown;
  dataCategories?: unknown;
  decisionInfluence?: unknown;
}

export interface NormalizedCaptureByCodeSelections {
  usageContexts: CaptureUsageContext[];
  dataCategory?: DataCategory;
  dataCategories?: DataCategory[];
  decisionInfluence?: DecisionInfluence;
}

function isUsageContext(value: string): value is CaptureUsageContext {
  return value in USAGE_CONTEXT_LABELS;
}

function isDataCategory(value: string): value is DataCategory {
  return value in DATA_CATEGORY_LABELS;
}

function isDecisionInfluence(value: string): value is DecisionInfluence {
  return DECISION_INFLUENCE_OPTIONS.includes(value as DecisionInfluence);
}

function normalizeEnumArray<T extends string>(
  value: unknown,
  isValid: (candidate: string) => candidate is T
): T[] {
  if (!Array.isArray(value)) return [];

  const normalized = value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry): entry is string => entry.length > 0)
    .filter(isValid);

  return [...new Set(normalized)];
}

export function normalizeCaptureByCodeSelections(
  input: CaptureByCodeSelectionInput
): NormalizedCaptureByCodeSelections {
  const normalizedUsageContexts = normalizeEnumArray(
    input.usageContexts,
    isUsageContext
  );
  const singleUsageContext =
    typeof input.usageContext === "string" ? input.usageContext.trim() : "";
  const usageContexts: CaptureUsageContext[] =
    normalizedUsageContexts.length > 0
      ? normalizedUsageContexts
      : isUsageContext(singleUsageContext)
        ? [singleUsageContext]
        : ["INTERNAL_ONLY"];

  const normalizedDataCategories = normalizeEnumArray(
    input.dataCategories,
    isDataCategory
  );
  const singleDataCategory =
    typeof input.dataCategory === "string" ? input.dataCategory.trim() : "";
  const fallbackDataCategory: DataCategory | undefined = isDataCategory(
    singleDataCategory
  )
    ? singleDataCategory
    : undefined;
  const singleDecisionInfluence =
    typeof input.decisionInfluence === "string"
      ? input.decisionInfluence.trim()
      : "";
  const decisionInfluence: DecisionInfluence | undefined = isDecisionInfluence(
    singleDecisionInfluence
  )
    ? singleDecisionInfluence
    : undefined;

  if (normalizedDataCategories.length > 0) {
    return {
      usageContexts,
      dataCategory: normalizedDataCategories[0],
      dataCategories: normalizedDataCategories,
      decisionInfluence,
    };
  }

  return {
    usageContexts,
    dataCategory: fallbackDataCategory,
    dataCategories: fallbackDataCategory ? [fallbackDataCategory] : undefined,
    decisionInfluence,
  };
}
