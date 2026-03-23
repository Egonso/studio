import {
  resolveDataCategories,
  resolveDecisionInfluence,
  type CaptureUsageContext,
  type DataCategory,
  type DecisionImpact,
  type DecisionInfluence,
  type UseCaseCard,
} from "./types";
import {
  parseStoredAiActCategory,
  type CanonicalAiActRiskClass,
} from "./risk-taxonomy";
import type { EuAiActRiskLevel } from "./tool-registry-types";

export type RiskSuggestionSignalStrength = "low" | "medium" | "high";

export interface RiskSuggestionInput {
  purpose: string;
  usageContexts: CaptureUsageContext[];
  decisionInfluence?: DecisionInfluence | null;
  dataCategories?: DataCategory[] | null;
  toolId?: string | null;
  toolFreeText?: string | null;
  toolRiskLevel?: EuAiActRiskLevel | null;
  aiActCategory?: string | null;
}

export interface RiskSuggestionResult {
  suggestedRiskClass: CanonicalAiActRiskClass;
  signalStrength: RiskSuggestionSignalStrength;
  reviewRecommended: boolean;
  reasons: string[];
  openQuestions: string[];
  sourceSignals: string[];
}

export interface RiskSuggestionUseCaseOptions {
  toolRiskLevel?: EuAiActRiskLevel | null;
  resolveToolRiskLevel?: ((toolId: string) => EuAiActRiskLevel | null | undefined) | null;
}

const PROHIBITED_TERMS = [
  "social scoring",
  "sozialbewertung",
  "emotion recognition",
  "emotionserkennung",
  "biometric categorization",
  "biometrische kategorisierung",
  "predictive policing",
  "subliminal",
  "manipulation vulnerabler",
  "untargeted scraping",
  "gesichtserkennung im oeffentlichen raum",
  "gesichtserkennung im offentlichen raum",
] as const;

const HIGH_RISK_DECISION_TERMS = [
  "scoring",
  "score",
  "ranking",
  "shortlist",
  "shortlisting",
  "screening",
  "selection",
  "vorauswahl",
  "auswahl",
  "profiling",
  "profilbildung",
  "eligibility",
  "approval",
  "ablehnung",
  "freigabe",
  "admission",
  "bonitaet",
  "bonitat",
] as const;

const RECRUITMENT_TERMS = [
  "bewerber",
  "recruit",
  "recruiting",
  "hiring",
  "candidate",
  "talent acquisition",
] as const;

const TRANSPARENCY_TERMS = [
  "chatbot",
  "assistant",
  "assistent",
  "copilot",
  "faq",
  "support",
  "kundensupport",
  "kommunikation",
  "helpdesk",
  "generative",
  "textgenerierung",
  "bildgenerierung",
  "content generation",
  "voicebot",
  "service bot",
] as const;

function normalizeText(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findMatchedTerms(
  text: string,
  terms: readonly string[],
): string[] {
  if (!text) return [];

  const haystack = ` ${text} `;
  const matches = new Set<string>();

  for (const term of terms) {
    const normalizedTerm = normalizeText(term);
    if (!normalizedTerm) continue;

    if (
      haystack.includes(` ${normalizedTerm} `) ||
      haystack.includes(` ${normalizedTerm}`) ||
      haystack.includes(`${normalizedTerm} `)
    ) {
      matches.add(normalizedTerm);
    }
  }

  return [...matches];
}

function toUniqueArray(values: Iterable<string>): string[] {
  return [...new Set([...values].filter((value) => value.trim().length > 0))];
}

function hasAnyDataCategory(
  dataCategories: readonly DataCategory[],
  candidates: readonly DataCategory[],
): boolean {
  return candidates.some((candidate) => dataCategories.includes(candidate));
}

function isMeaningfulPurpose(text: string): boolean {
  return text.replace(/\s+/g, "").length >= 18;
}

function deriveSignalStrength(
  suggestedRiskClass: CanonicalAiActRiskClass,
  supportCount: number,
  openQuestionCount: number,
): RiskSuggestionSignalStrength {
  if (suggestedRiskClass === "PROHIBITED") {
    return "high";
  }

  if (suggestedRiskClass === "HIGH") {
    return supportCount >= 3 ? "high" : "medium";
  }

  if (suggestedRiskClass === "LIMITED") {
    if (supportCount >= 3 && openQuestionCount === 0) {
      return "high";
    }
    if (supportCount >= 2) {
      return "medium";
    }
    return "low";
  }

  if (suggestedRiskClass === "MINIMAL") {
    return supportCount >= 3 ? "medium" : "low";
  }

  return "low";
}

function resolveToolRiskLevel(
  input: Pick<RiskSuggestionInput, "toolId" | "toolRiskLevel">,
  options?: RiskSuggestionUseCaseOptions,
): EuAiActRiskLevel | null {
  if (input.toolRiskLevel) {
    return input.toolRiskLevel;
  }

  if (options?.toolRiskLevel) {
    return options.toolRiskLevel;
  }

  if (input.toolId && options?.resolveToolRiskLevel) {
    return options.resolveToolRiskLevel(input.toolId) ?? null;
  }

  return null;
}

export function suggestRiskClass(
  input: RiskSuggestionInput,
): RiskSuggestionResult {
  const purposeText = normalizeText(
    [input.purpose, input.toolFreeText].filter(Boolean).join(" "),
  );
  const usageContexts = input.usageContexts ?? [];
  const dataCategories = toUniqueArray(input.dataCategories ?? []) as DataCategory[];
  const decisionInfluence = input.decisionInfluence ?? null;
  const toolRiskLevel = input.toolRiskLevel ?? null;

  const hasApplicants = usageContexts.includes("APPLICANTS");
  const hasCustomers = usageContexts.includes("CUSTOMERS");
  const hasPublic = usageContexts.includes("PUBLIC");
  const hasEmployees = usageContexts.includes("EMPLOYEES");
  const hasInternalOnly = usageContexts.includes("INTERNAL_ONLY");
  const hasExternalFacingContext = hasApplicants || hasCustomers || hasPublic;
  const isPurelyInternal =
    usageContexts.length > 0 &&
    hasInternalOnly &&
    !hasApplicants &&
    !hasCustomers &&
    !hasPublic &&
    !hasEmployees;

  const hasPersonalData = hasAnyDataCategory(dataCategories, [
    "PERSONAL_DATA",
    "SPECIAL_PERSONAL",
    "HEALTH_DATA",
    "BIOMETRIC_DATA",
    "POLITICAL_RELIGIOUS",
    "OTHER_SENSITIVE",
    "PERSONAL",
    "SENSITIVE",
  ]);
  const hasSensitiveData = hasAnyDataCategory(dataCategories, [
    "SPECIAL_PERSONAL",
    "HEALTH_DATA",
    "BIOMETRIC_DATA",
    "POLITICAL_RELIGIOUS",
    "OTHER_SENSITIVE",
    "SENSITIVE",
  ]);
  const hasNoPersonalData = hasAnyDataCategory(dataCategories, [
    "NO_PERSONAL_DATA",
    "NONE",
  ]);

  const prohibitedMatches = findMatchedTerms(purposeText, PROHIBITED_TERMS);
  const decisionMatches = findMatchedTerms(purposeText, HIGH_RISK_DECISION_TERMS);
  const recruitmentMatches = findMatchedTerms(purposeText, RECRUITMENT_TERMS);
  const transparencyMatches = findMatchedTerms(purposeText, TRANSPARENCY_TERMS);

  const hasRecruitmentSignal = hasApplicants || recruitmentMatches.length > 0;
  const hasDecisionPreparation =
    decisionInfluence === "PREPARATION" || decisionInfluence === "AUTOMATED";
  const hasDecisionKeyword = decisionMatches.length > 0;
  const hasTransparencyKeyword = transparencyMatches.length > 0;

  const sourceSignals = new Set<string>();
  const reasons = new Set<string>();
  const openQuestions = new Set<string>();

  if (hasApplicants) sourceSignals.add("usage:APPLICANTS");
  if (hasCustomers) sourceSignals.add("usage:CUSTOMERS");
  if (hasPublic) sourceSignals.add("usage:PUBLIC");
  if (hasEmployees) sourceSignals.add("usage:EMPLOYEES");
  if (hasInternalOnly) sourceSignals.add("usage:INTERNAL_ONLY");
  if (decisionInfluence) sourceSignals.add(`decision:${decisionInfluence}`);
  if (hasPersonalData) sourceSignals.add("data:PERSONAL");
  if (hasSensitiveData) sourceSignals.add("data:SENSITIVE");
  if (hasNoPersonalData) sourceSignals.add("data:NO_PERSONAL_DATA");
  if (toolRiskLevel) sourceSignals.add(`tool-risk:${toolRiskLevel}`);
  if (prohibitedMatches.length > 0) sourceSignals.add("purpose:PROHIBITED_PATTERN");
  if (hasDecisionKeyword) sourceSignals.add("purpose:DECISION_EFFECT");
  if (hasTransparencyKeyword) sourceSignals.add("purpose:TRANSPARENCY_USE");
  if (hasRecruitmentSignal) sourceSignals.add("purpose:RECRUITMENT_CONTEXT");

  const existingRiskClass = parseStoredAiActCategory(input.aiActCategory);
  if (existingRiskClass !== "UNASSESSED") {
    sourceSignals.add(`existing-category:${existingRiskClass}`);
  }

  if (usageContexts.length === 0) {
    openQuestions.add(
      "Betrifft der Einsatzfall nur interne Prozesse oder auch Kund*innen, Bewerber*innen oder die Oeffentlichkeit?",
    );
  }

  if (!decisionInfluence) {
    openQuestions.add(
      "Beeinflusst das System Entscheidungen nur assistiv, vorbereitend oder automatisiert?",
    );
  }

  if (dataCategories.length === 0) {
    openQuestions.add(
      "Werden personenbezogene oder besondere sensible Daten verarbeitet?",
    );
  }

  if (!isMeaningfulPurpose(purposeText)) {
    openQuestions.add(
      "Welche konkrete Aufgabe uebernimmt das System: Kommunikation, Recherche, Bewertung, Auswahl oder Automatisierung?",
    );
  }

  if (hasApplicants && !hasDecisionKeyword) {
    openQuestions.add(
      "Unterstuetzt der Einsatzfall nur die Kommunikation mit Bewerber*innen oder auch Auswahl, Ranking oder Scoring?",
    );
  }

  if (
    (hasCustomers || hasPublic) &&
    toolRiskLevel === "limited" &&
    !hasTransparencyKeyword
  ) {
    openQuestions.add(
      "Interagieren externe Personen direkt mit KI-Ausgaben oder sehen sie KI-generierte Inhalte?",
    );
  }

  let suggestedRiskClass: CanonicalAiActRiskClass = "UNASSESSED";
  let supportCount = 0;

  const highRiskRecruitmentPattern =
    hasRecruitmentSignal && hasDecisionPreparation && hasDecisionKeyword;
  const highRiskExternalDecisionPattern =
    hasDecisionPreparation &&
    hasDecisionKeyword &&
    (hasCustomers || hasPublic || hasSensitiveData);

  if (prohibitedMatches.length > 0) {
    suggestedRiskClass = "PROHIBITED";
    supportCount = 3 + Number(hasDecisionPreparation) + Number(hasSensitiveData);
    reasons.add("Der beschriebene Zweck deutet auf eine potenziell verbotene Praxis hin.");
    if (hasDecisionPreparation) {
      reasons.add("Der Einsatzfall greift in Entscheidungen ueber Personen ein.");
    }
    if (hasSensitiveData) {
      reasons.add("Es werden sensible oder besondere Daten verarbeitet.");
    }
  } else if (
    highRiskRecruitmentPattern ||
    highRiskExternalDecisionPattern ||
    (toolRiskLevel === "high" && hasDecisionPreparation && hasDecisionKeyword)
  ) {
    suggestedRiskClass = "HIGH";
    supportCount =
      Number(hasRecruitmentSignal) +
      Number(hasDecisionPreparation) +
      Number(hasDecisionKeyword) +
      Number(hasSensitiveData || hasCustomers || hasPublic) +
      Number(toolRiskLevel === "high");
    if (hasRecruitmentSignal) {
      reasons.add("Bewerber*innen oder ein erkennbarer Recruiting-Kontext sind betroffen.");
    } else if (hasCustomers || hasPublic) {
      reasons.add("Der Einsatzfall betrifft externe Personen oder die Oeffentlichkeit.");
    }
    reasons.add("Der Einsatzfall beeinflusst Entscheidungen ueber Personen.");
    reasons.add("Der Zweck deutet auf Scoring, Ranking, Auswahl oder aehnliche Entscheidungseffekte hin.");
    if (hasSensitiveData) {
      reasons.add("Es werden besondere oder sensible Daten verarbeitet.");
    }
  } else if (
    isPurelyInternal &&
    decisionInfluence === "ASSISTANCE" &&
    !hasPersonalData &&
    !hasSensitiveData &&
    !hasDecisionKeyword
  ) {
    suggestedRiskClass = "MINIMAL";
    supportCount =
      Number(isPurelyInternal) +
      Number(decisionInfluence === "ASSISTANCE") +
      Number(hasNoPersonalData || dataCategories.length === 0) +
      Number(!hasDecisionKeyword);
    reasons.add("Der Einsatzfall wirkt rein intern und assistiv.");
    reasons.add("Es gibt keine Signale fuer Auswahl-, Scoring- oder Automatisierungslogik.");
    if (hasNoPersonalData) {
      reasons.add("Es sind keine personenbezogenen Daten angegeben.");
    }
    if (toolRiskLevel === "limited") {
      reasons.add(
        "Das Tool ist zwar generisch als begrenztes Risiko hinterlegt, der konkrete Einsatz wirkt aber eng und intern.",
      );
    } else if (toolRiskLevel === "minimal") {
      reasons.add("Das hinterlegte Tool ist im Katalog als minimaler Risiko-Fall verzeichnet.");
    }
  } else if (
    hasTransparencyKeyword ||
    toolRiskLevel === "limited" ||
    hasExternalFacingContext ||
    hasPersonalData ||
    hasSensitiveData
  ) {
    suggestedRiskClass = "LIMITED";
    supportCount =
      Number(hasTransparencyKeyword) +
      Number(toolRiskLevel === "limited") +
      Number(hasExternalFacingContext) +
      Number(hasPersonalData) +
      Number(hasSensitiveData);
    if (hasExternalFacingContext) {
      reasons.add("Der Einsatzfall betrifft externe Personen, Bewerber*innen oder die Oeffentlichkeit.");
    }
    if (hasTransparencyKeyword) {
      reasons.add("Der Zweck deutet auf einen Chatbot-, Kommunikations- oder Assistenzfall hin.");
    }
    if (toolRiskLevel === "limited") {
      reasons.add("Das hinterlegte Tool ist im Katalog als GPAI-/Transparenzfall mit begrenztem Risiko hinterlegt.");
    }
    if (hasPersonalData) {
      reasons.add("Es werden personenbezogene Daten verarbeitet.");
    }
    if (hasApplicants && !hasDecisionKeyword) {
      reasons.add("Es gibt Bewerber*innen-Kontext, aber noch keine klaren Signale fuer Scoring oder Auswahl.");
    }
  } else {
    suggestedRiskClass = "UNASSESSED";
    supportCount = 0;
    reasons.add("Es liegen noch zu wenige belastbare Signale fuer eine klare Risikorichtung vor.");
    if (toolRiskLevel === "high" || toolRiskLevel === "unacceptable") {
      reasons.add(
        "Der Tool-Katalog signalisiert erhoehtes Risiko, das allein aber keine finale Einstufung tragen sollte.",
      );
      supportCount += 1;
    }
  }

  const reviewRecommended =
    suggestedRiskClass === "PROHIBITED" ||
    suggestedRiskClass === "HIGH" ||
    hasSensitiveData ||
    (hasApplicants && (suggestedRiskClass !== "MINIMAL" || openQuestions.size > 0)) ||
    ((hasCustomers || hasPublic) &&
      (suggestedRiskClass === "LIMITED" || hasPersonalData)) ||
    (suggestedRiskClass === "UNASSESSED" &&
      (hasExternalFacingContext || hasDecisionPreparation || toolRiskLevel !== null));

  return {
    suggestedRiskClass,
    signalStrength: deriveSignalStrength(
      suggestedRiskClass,
      supportCount,
      openQuestions.size,
    ),
    reviewRecommended,
    reasons: toUniqueArray(reasons).slice(0, 4),
    openQuestions: toUniqueArray(openQuestions).slice(0, 4),
    sourceSignals: toUniqueArray(sourceSignals),
  };
}

export function suggestRiskClassForUseCase(
  useCase: Pick<
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
  options: RiskSuggestionUseCaseOptions = {},
): RiskSuggestionResult {
  const toolRiskLevel = resolveToolRiskLevel(
    {
      toolId: useCase.toolId ?? null,
      toolRiskLevel: options.toolRiskLevel ?? null,
    },
    options,
  );

  return suggestRiskClass({
    purpose: useCase.purpose,
    usageContexts: useCase.usageContexts,
    decisionInfluence: resolveDecisionInfluence({
      decisionInfluence: useCase.decisionInfluence,
      decisionImpact: useCase.decisionImpact as DecisionImpact | undefined,
    }),
    dataCategories: resolveDataCategories({
      dataCategories: useCase.dataCategories,
      dataCategory: useCase.dataCategory,
    }),
    toolId: useCase.toolId ?? null,
    toolFreeText: useCase.toolFreeText ?? null,
    toolRiskLevel,
    aiActCategory: useCase.governanceAssessment?.core?.aiActCategory ?? null,
  });
}
