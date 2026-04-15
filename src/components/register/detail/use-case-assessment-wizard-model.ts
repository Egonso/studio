import {
  getRiskClassEditorValue,
  getRiskClassDisplayLabel,
  normalizeStoredAiActCategory,
  resolveDataCategories,
  resolveDecisionInfluence,
  suggestRiskClassForUseCase,
  type CanonicalAiActRiskClass,
  type RiskSuggestionResult,
  type UseCaseCard,
  type EuAiActRiskLevel,
} from "@/lib/register-first";
import type {
  CaptureUsageContext,
  DataCategory,
  DecisionInfluence,
} from "@/lib/register-first/types";
import {
  CUSTOM_RISK_SELECTION,
  buildRiskSuggestionForEditDraft,
  getRiskAssistCurrentDisplayLabel,
  getRiskManualSelectionValue,
  hasCustomRiskSelection,
  type RiskAssistEditDraftInput,
} from "./risk-class-assist-model";

export type RiskReviewBooleanChoice = "yes" | "no" | "unknown";
export type CustomAssessmentSource = "AI_DRAFT" | "MANUAL" | null;

export interface RiskReviewLaunchContext {
  purpose: string;
  usageContexts: CaptureUsageContext[];
  decisionInfluence: DecisionInfluence | null;
  dataCategories: DataCategory[];
  toolRiskLevel: EuAiActRiskLevel | null;
  aiActCategory: string;
  currentRiskDisplayLabel: string | null;
  currentRiskClass: CanonicalAiActRiskClass | null;
  hasCustomRiskValue: boolean;
  suggestion: RiskSuggestionResult;
}

export interface RiskReviewFormState {
  aiActCategory: string;
  oversightDefined: RiskReviewBooleanChoice;
  reviewCycleDefined: RiskReviewBooleanChoice;
  documentationLevelDefined: RiskReviewBooleanChoice;
  customAssessmentText: string;
  customAssessmentSource: CustomAssessmentSource;
}

export interface DraftAssessmentRequestPayload {
  systemName?: string;
  vendor?: string;
  purpose: string;
  usageContexts: string[];
  dataCategories: string[];
  selectedRiskClass?: string;
  suggestedRiskClass?: string;
  reasons: string[];
  openQuestions: string[];
}

function booleanToChoice(
  value: boolean | null | undefined,
): RiskReviewBooleanChoice {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "unknown";
}

function documentedValueToChoice(input: {
  explicit: boolean | null | undefined;
  documented: boolean;
}): RiskReviewBooleanChoice {
  if (input.explicit !== undefined && input.explicit !== null) {
    return booleanToChoice(input.explicit);
  }

  return input.documented ? "yes" : "unknown";
}

function choiceToBoolean(
  value: RiskReviewBooleanChoice,
): boolean | undefined {
  if (value === "yes") return true;
  if (value === "no") return false;
  return undefined;
}

function normalizeCustomAssessmentSource(
  source: string | null | undefined,
): CustomAssessmentSource {
  if (source === "AI_DRAFT" || source === "MANUAL") {
    return source;
  }
  return null;
}

export function buildRiskReviewLaunchContext(
  draft: RiskAssistEditDraftInput,
  toolRiskLevel: EuAiActRiskLevel | null,
): RiskReviewLaunchContext {
  const manualRiskSelectionValue = getRiskManualSelectionValue(
    draft.aiActCategory,
  );

  return {
    purpose: draft.purpose,
    usageContexts: draft.usageContexts,
    decisionInfluence: draft.decisionInfluence,
    dataCategories: draft.dataCategories,
    toolRiskLevel,
    aiActCategory: draft.aiActCategory,
    currentRiskDisplayLabel: getRiskAssistCurrentDisplayLabel(
      draft.aiActCategory,
    ),
    currentRiskClass:
      manualRiskSelectionValue !== CUSTOM_RISK_SELECTION
        ? manualRiskSelectionValue
        : null,
    hasCustomRiskValue: hasCustomRiskSelection(draft.aiActCategory),
    suggestion: buildRiskSuggestionForEditDraft(draft, toolRiskLevel),
  };
}

export function buildRiskReviewLaunchContextFromUseCase(
  card: Pick<
    UseCaseCard,
    | "purpose"
    | "usageContexts"
    | "decisionImpact"
    | "decisionInfluence"
    | "toolId"
    | "toolFreeText"
    | "dataCategory"
    | "dataCategories"
    | "governanceAssessment"
  >,
  toolRiskLevel: EuAiActRiskLevel | null,
): RiskReviewLaunchContext {
  const aiActCategory = getRiskClassEditorValue(
    card.governanceAssessment?.core?.aiActCategory,
  );
  const manualRiskSelectionValue = getRiskManualSelectionValue(aiActCategory);

  return {
    purpose: card.purpose,
    usageContexts: card.usageContexts,
    decisionInfluence: resolveDecisionInfluence(card) ?? null,
    dataCategories: resolveDataCategories(card),
    toolRiskLevel,
    aiActCategory,
    currentRiskDisplayLabel: getRiskAssistCurrentDisplayLabel(aiActCategory),
    currentRiskClass:
      manualRiskSelectionValue !== CUSTOM_RISK_SELECTION
        ? manualRiskSelectionValue
        : null,
    hasCustomRiskValue: hasCustomRiskSelection(aiActCategory),
    suggestion: suggestRiskClassForUseCase(card, { toolRiskLevel }),
  };
}

export function createInitialRiskReviewFormState(
  card: Pick<UseCaseCard, "governanceAssessment">,
  launchContext: RiskReviewLaunchContext | null | undefined,
): RiskReviewFormState {
  const core = card.governanceAssessment?.core;
  const flex = card.governanceAssessment?.flex;
  const iso = flex?.iso;

  return {
    aiActCategory:
      launchContext?.aiActCategory ??
      getRiskClassEditorValue(core?.aiActCategory),
    oversightDefined: documentedValueToChoice({
      explicit: core?.oversightDefined,
      documented:
        (typeof flex?.oversightModel === "string" &&
          flex.oversightModel.trim().length > 0) ||
        (iso?.oversightModel != null && iso.oversightModel !== "unknown"),
    }),
    reviewCycleDefined: documentedValueToChoice({
      explicit: core?.reviewCycleDefined,
      documented:
        (typeof flex?.reviewFrequency === "string" &&
          flex.reviewFrequency.trim().length > 0) ||
        (iso?.reviewCycle != null && iso.reviewCycle !== "unknown"),
    }),
    documentationLevelDefined: documentedValueToChoice({
      explicit: core?.documentationLevelDefined,
      documented:
        iso?.documentationLevel != null && iso.documentationLevel !== "unknown",
    }),
    customAssessmentText: flex?.customAssessmentText ?? "",
    customAssessmentSource: normalizeCustomAssessmentSource(
      flex?.customAssessmentSource,
    ),
  };
}

export function shouldShowGovernanceReviewStep(input: {
  suggestion: RiskSuggestionResult | null | undefined;
  aiActCategory: string;
  oversightDefined: RiskReviewBooleanChoice;
  reviewCycleDefined: RiskReviewBooleanChoice;
  documentationLevelDefined: RiskReviewBooleanChoice;
}): boolean {
  const manualRiskSelectionValue = getRiskManualSelectionValue(input.aiActCategory);
  const hasExistingReviewSignal =
    input.oversightDefined !== "unknown" ||
    input.reviewCycleDefined !== "unknown" ||
    input.documentationLevelDefined !== "unknown";

  return (
    hasExistingReviewSignal ||
    input.suggestion?.reviewRecommended === true ||
    manualRiskSelectionValue === "HIGH" ||
    manualRiskSelectionValue === "PROHIBITED"
  );
}

export function buildRiskReviewAssessmentPayload(
  card: Pick<UseCaseCard, "governanceAssessment">,
  formState: RiskReviewFormState,
) {
  const existingCore = card.governanceAssessment?.core ?? {};
  const existingFlex = card.governanceAssessment?.flex ?? {};

  return {
    core: {
      ...existingCore,
      aiActCategory: normalizeStoredAiActCategory(formState.aiActCategory),
      oversightDefined: choiceToBoolean(formState.oversightDefined),
      reviewCycleDefined: choiceToBoolean(formState.reviewCycleDefined),
      documentationLevelDefined: choiceToBoolean(
        formState.documentationLevelDefined,
      ),
      coreVersion: existingCore.coreVersion ?? "EUKI-GOV-1.0",
      assessedAt: new Date().toISOString(),
    },
    flex: {
      ...existingFlex,
      customAssessmentText: formState.customAssessmentText.trim() || null,
      customAssessmentSource: formState.customAssessmentText.trim()
        ? formState.customAssessmentSource ?? "MANUAL"
        : null,
    },
  };
}

export function buildDraftAssessmentRequestPayload(input: {
  systemName?: string | null;
  vendor?: string | null;
  launchContext: RiskReviewLaunchContext;
  formState: Pick<RiskReviewFormState, "aiActCategory">;
}): DraftAssessmentRequestPayload {
  const selectedRiskClass = normalizeStoredAiActCategory(input.formState.aiActCategory);

  return {
    systemName: input.systemName?.trim() || undefined,
    vendor: input.vendor?.trim() || undefined,
    purpose: input.launchContext.purpose,
    usageContexts: input.launchContext.usageContexts,
    dataCategories: input.launchContext.dataCategories,
    selectedRiskClass:
      selectedRiskClass && getRiskAssistCurrentDisplayLabel(selectedRiskClass)
        ? getRiskAssistCurrentDisplayLabel(selectedRiskClass) ?? undefined
        : undefined,
    suggestedRiskClass:
      input.launchContext.suggestion.suggestedRiskClass !== "UNASSESSED"
        ? getRiskClassDisplayLabel(input.launchContext.suggestion.suggestedRiskClass)
        : undefined,
    reasons: input.launchContext.suggestion.reasons,
    openQuestions: input.launchContext.suggestion.openQuestions,
  };
}
