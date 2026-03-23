import {
  getRiskClassDisplayLabel,
  getRiskClassShortLabel,
  parseStoredAiActCategory,
  suggestRiskClass,
  type CanonicalAiActRiskClass,
  type RiskSuggestionResult,
  type EuAiActRiskLevel,
} from "@/lib/register-first";
import type {
  CaptureUsageContext,
  DataCategory,
  DecisionInfluence,
} from "@/lib/register-first/types";

export const CUSTOM_RISK_SELECTION = "__CUSTOM__" as const;

export type RiskManualSelectionValue =
  | CanonicalAiActRiskClass
  | typeof CUSTOM_RISK_SELECTION;

export const RISK_CLASS_MANUAL_OPTIONS: CanonicalAiActRiskClass[] = [
  "UNASSESSED",
  "MINIMAL",
  "LIMITED",
  "HIGH",
  "PROHIBITED",
];

export interface RiskAssistEditDraftInput {
  purpose: string;
  usageContexts: CaptureUsageContext[];
  decisionInfluence: DecisionInfluence | null;
  dataCategories: DataCategory[];
  toolId: string;
  toolFreeText: string;
  aiActCategory: string;
}

const RISK_CLASS_MANUAL_DESCRIPTIONS: Record<CanonicalAiActRiskClass, string> =
  {
    UNASSESSED: "Noch offen. Erst nach kurzer Pruefung festlegen.",
    MINIMAL:
      "Enger, rein assistiver Einsatz ohne erkennbare Transparenz- oder Hochrisikosignale.",
    LIMITED:
      "Typischer Transparenz- oder GPAI-Fall mit klarer Assistenz- oder Kommunikationslogik.",
    HIGH:
      "Entscheidungsnahe oder besonders sensible Nutzung mit deutlichem Review-Bedarf.",
    PROHIBITED:
      "Potenziell unzulaessige Praxis. Nicht ohne klare menschliche und rechtliche Pruefung einsetzen.",
  };

export function getRiskManualSelectionValue(
  aiActCategory: string | null | undefined,
): RiskManualSelectionValue {
  const trimmed = aiActCategory?.trim() ?? "";
  if (!trimmed) return "UNASSESSED";

  const parsed = parseStoredAiActCategory(trimmed);
  if (parsed !== "UNASSESSED") {
    return parsed;
  }

  return CUSTOM_RISK_SELECTION;
}

export function hasCustomRiskSelection(
  aiActCategory: string | null | undefined,
): boolean {
  return getRiskManualSelectionValue(aiActCategory) === CUSTOM_RISK_SELECTION;
}

export function applyRiskManualSelection(
  riskClass: CanonicalAiActRiskClass,
): string {
  return riskClass === "UNASSESSED" ? "" : getRiskClassShortLabel(riskClass);
}

export function getRiskManualOptionLabel(
  riskClass: CanonicalAiActRiskClass,
): string {
  return getRiskClassDisplayLabel(riskClass);
}

export function getRiskManualOptionDescription(
  riskClass: CanonicalAiActRiskClass,
): string {
  return RISK_CLASS_MANUAL_DESCRIPTIONS[riskClass];
}

export function getRiskAssistCurrentDisplayLabel(
  aiActCategory: string | null | undefined,
): string | null {
  const trimmed = aiActCategory?.trim() ?? "";
  if (!trimmed) return null;

  const parsed = parseStoredAiActCategory(trimmed);
  if (parsed !== "UNASSESSED") {
    return getRiskClassShortLabel(parsed);
  }

  return trimmed;
}

export function buildRiskSuggestionForEditDraft(
  draft: RiskAssistEditDraftInput,
  toolRiskLevel: EuAiActRiskLevel | null,
): RiskSuggestionResult {
  return suggestRiskClass({
    purpose: draft.purpose,
    usageContexts: draft.usageContexts,
    decisionInfluence: draft.decisionInfluence,
    dataCategories: draft.dataCategories,
    toolId: draft.toolId === "other" ? null : draft.toolId,
    toolFreeText: draft.toolFreeText,
    toolRiskLevel,
    aiActCategory: draft.aiActCategory,
  });
}
