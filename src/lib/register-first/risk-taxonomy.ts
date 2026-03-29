import type { EuAiActRiskLevel } from "./tool-registry-types";

export const CANONICAL_AI_ACT_RISK_CLASSES = [
  "UNASSESSED",
  "MINIMAL",
  "LIMITED",
  "HIGH",
  "PROHIBITED",
] as const;

export type CanonicalAiActRiskClass =
  (typeof CANONICAL_AI_ACT_RISK_CLASSES)[number];

const RISK_CLASS_DISPLAY_LABELS: Record<CanonicalAiActRiskClass, string> = {
  UNASSESSED: "Noch nicht eingestuft",
  MINIMAL: "Minimales Risiko",
  LIMITED: "Begrenztes Risiko (Transparenzpflichten)",
  HIGH: "Hochrisiko",
  PROHIBITED: "Verboten",
};

const RISK_CLASS_SHORT_LABELS: Record<CanonicalAiActRiskClass, string> = {
  UNASSESSED: "Noch nicht eingestuft",
  MINIMAL: "Minimales Risiko",
  LIMITED: "Begrenztes Risiko",
  HIGH: "Hochrisiko",
  PROHIBITED: "Verboten",
};

const RISK_CLASS_STORED_LABELS: Record<
  Exclude<CanonicalAiActRiskClass, "UNASSESSED">,
  string
> = {
  MINIMAL: "Minimales Risiko",
  LIMITED: "Transparenzpflichten",
  HIGH: "Hochrisiko",
  PROHIBITED: "Verboten",
};

function normalizeRiskClassKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const RISK_CLASS_ALIASES: Record<string, CanonicalAiActRiskClass> =
  Object.freeze({
    unbekannt: "UNASSESSED",
    unknown: "UNASSESSED",
    unassessed: "UNASSESSED",
    nicht_eingestuft: "UNASSESSED",
    not_assessed: "UNASSESSED",

    minimales_risiko: "MINIMAL",
    geringes_risiko: "MINIMAL",
    minimal_risk: "MINIMAL",
    minimal: "MINIMAL",
    low_risk: "MINIMAL",

    begrenztes_risiko: "LIMITED",
    begrenztes_risiko_transparenzpflichten: "LIMITED",
    transparenz_risiko: "LIMITED",
    transparenzpflichten: "LIMITED",
    limited_risk: "LIMITED",
    limited: "LIMITED",

    hohes_risiko: "HIGH",
    hochrisiko: "HIGH",
    high_risk: "HIGH",
    high: "HIGH",

    unannehmbares_risiko: "PROHIBITED",
    unacceptable_risk: "PROHIBITED",
    unacceptable: "PROHIBITED",
    verboten: "PROHIBITED",
    prohibited: "PROHIBITED",
  });

function findMappedRiskClass(
  input: string | null | undefined
): CanonicalAiActRiskClass | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;
  return RISK_CLASS_ALIASES[normalizeRiskClassKey(trimmed)] ?? null;
}

export function parseStoredAiActCategory(
  input: string | null | undefined
): CanonicalAiActRiskClass {
  return findMappedRiskClass(input) ?? "UNASSESSED";
}

export function hasDocumentedAiActCategory(
  input: string | null | undefined
): boolean {
  if (typeof input !== "string") return false;

  const trimmed = input.trim();
  if (trimmed.length === 0) return false;

  const mappedRiskClass = findMappedRiskClass(trimmed);
  if (mappedRiskClass === null) {
    return true;
  }

  return mappedRiskClass !== "UNASSESSED";
}

export function getRiskClassDisplayLabel(
  riskClass: CanonicalAiActRiskClass
): string {
  return RISK_CLASS_DISPLAY_LABELS[riskClass];
}

export function getRiskClassShortLabel(
  riskClass: CanonicalAiActRiskClass
): string {
  return RISK_CLASS_SHORT_LABELS[riskClass];
}

export function getRiskClassStoredLabel(
  riskClass: CanonicalAiActRiskClass
): string | null {
  if (riskClass === "UNASSESSED") return null;
  return RISK_CLASS_STORED_LABELS[riskClass];
}

export function normalizeStoredAiActCategory(
  input: string | null | undefined
): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;

  const mappedRiskClass = findMappedRiskClass(trimmed);
  if (!mappedRiskClass) {
    return trimmed;
  }

  return getRiskClassStoredLabel(mappedRiskClass);
}

export function getCanonicalClassFromToolRiskLevel(
  toolRiskLevel: EuAiActRiskLevel | null | undefined
): CanonicalAiActRiskClass {
  switch (toolRiskLevel) {
    case "minimal":
      return "MINIMAL";
    case "limited":
      return "LIMITED";
    case "high":
      return "HIGH";
    case "unacceptable":
      return "PROHIBITED";
    default:
      return "UNASSESSED";
  }
}

export function resolveRiskClass(input: {
  aiActCategory?: string | null;
  toolRiskLevel?: EuAiActRiskLevel | null;
}): CanonicalAiActRiskClass {
  const mappedRiskClass = findMappedRiskClass(input.aiActCategory);
  if (mappedRiskClass) {
    return mappedRiskClass;
  }

  if (
    typeof input.aiActCategory === "string" &&
    input.aiActCategory.trim().length > 0
  ) {
    return "UNASSESSED";
  }

  return getCanonicalClassFromToolRiskLevel(input.toolRiskLevel);
}

export function getDisplayedRiskClassLabel(input: {
  aiActCategory?: string | null;
  toolRiskLevel?: EuAiActRiskLevel | null;
  short?: boolean;
}): string {
  const { aiActCategory, toolRiskLevel, short = false } = input;
  const mappedRiskClass = findMappedRiskClass(aiActCategory);

  if (mappedRiskClass) {
    return short
      ? getRiskClassShortLabel(mappedRiskClass)
      : getRiskClassDisplayLabel(mappedRiskClass);
  }

  if (typeof aiActCategory === "string" && aiActCategory.trim().length > 0) {
    return aiActCategory.trim();
  }

  const fallbackRiskClass = getCanonicalClassFromToolRiskLevel(toolRiskLevel);
  return short
    ? getRiskClassShortLabel(fallbackRiskClass)
    : getRiskClassDisplayLabel(fallbackRiskClass);
}

export function getRiskClassEditorValue(
  input: string | null | undefined
): string {
  const mappedRiskClass = findMappedRiskClass(input);
  if (mappedRiskClass) {
    return mappedRiskClass === "UNASSESSED"
      ? ""
      : getRiskClassShortLabel(mappedRiskClass);
  }

  return typeof input === "string" ? input.trim() : "";
}

export function isHighRiskClass(
  riskClass: CanonicalAiActRiskClass
): boolean {
  return riskClass === "HIGH";
}

export function isLimitedRiskClass(
  riskClass: CanonicalAiActRiskClass
): boolean {
  return riskClass === "LIMITED";
}

export function isProhibitedRiskClass(
  riskClass: CanonicalAiActRiskClass
): boolean {
  return riskClass === "PROHIBITED";
}
