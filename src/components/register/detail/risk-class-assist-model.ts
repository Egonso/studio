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

const RISK_CLASS_MANUAL_DESCRIPTIONS_EN: Record<CanonicalAiActRiskClass, string> =
  {
    UNASSESSED: "Still open. Define after a short review.",
    MINIMAL:
      "Narrow, purely assistive use with no visible transparency or high-risk signals.",
    LIMITED:
      "Typical transparency or GPAI case with clear assistance or communication logic.",
    HIGH:
      "Decision-adjacent or especially sensitive use with clear review needs.",
    PROHIBITED:
      "Potentially prohibited practice. Do not use without clear human and legal review.",
  };

const RISK_SUGGESTION_TEXT_EN: Record<string, string> = {
  "Betrifft der Einsatzfall nur interne Prozesse oder auch Kund*innen, Bewerber*innen oder die Oeffentlichkeit?":
    "Does the use case affect only internal processes, or also customers, applicants, or the public?",
  "Beeinflusst das System Entscheidungen nur assistiv, vorbereitend oder automatisiert?":
    "Does the system influence decisions only assistively, preparatorily, or automatically?",
  "Werden personenbezogene oder besondere sensible Daten verarbeitet?":
    "Are personal or special-category sensitive data processed?",
  "Welche konkrete Aufgabe uebernimmt das System: Kommunikation, Recherche, Bewertung, Auswahl oder Automatisierung?":
    "What concrete task does the system perform: communication, research, assessment, selection, or automation?",
  "Unterstuetzt der Einsatzfall nur die Kommunikation mit Bewerber*innen oder auch Auswahl, Ranking oder Scoring?":
    "Does the use case only support applicant communication, or also selection, ranking, or scoring?",
  "Interagieren externe Personen direkt mit KI-Ausgaben oder sehen sie KI-generierte Inhalte?":
    "Do external people interact directly with AI outputs or see AI-generated content?",
  "Der beschriebene Zweck deutet auf eine potenziell verbotene Praxis hin.":
    "The described purpose points to a potentially prohibited practice.",
  "Der Einsatzfall greift in Entscheidungen ueber Personen ein.":
    "The use case affects decisions about people.",
  "Es werden sensible oder besondere Daten verarbeitet.":
    "Sensitive or special-category data are processed.",
  "Bewerber*innen oder ein erkennbarer Recruiting-Kontext sind betroffen.":
    "Applicants or a clear recruiting context are affected.",
  "Der Einsatzfall betrifft externe Personen oder die Oeffentlichkeit.":
    "The use case affects external people or the public.",
  "Der Einsatzfall beeinflusst Entscheidungen ueber Personen.":
    "The use case influences decisions about people.",
  "Der Zweck deutet auf Scoring, Ranking, Auswahl oder aehnliche Entscheidungseffekte hin.":
    "The purpose points to scoring, ranking, selection, or similar decision effects.",
  "Der Einsatzfall wirkt rein intern und assistiv.":
    "The use case appears purely internal and assistive.",
  "Es gibt keine Signale fuer Auswahl-, Scoring- oder Automatisierungslogik.":
    "There are no signals for selection, scoring, or automation logic.",
  "Es sind keine personenbezogenen Daten angegeben.":
    "No personal data are specified.",
  "Das Tool ist zwar generisch als begrenztes Risiko hinterlegt, der konkrete Einsatz wirkt aber eng und intern.":
    "The tool is generally recorded as limited risk, but the concrete use appears narrow and internal.",
  "Das hinterlegte Tool ist im Katalog als minimaler Risiko-Fall verzeichnet.":
    "The recorded tool is listed in the catalog as minimal risk.",
  "Der Einsatzfall betrifft externe Personen, Bewerber*innen oder die Oeffentlichkeit.":
    "The use case affects external people, applicants, or the public.",
  "Der Zweck deutet auf einen Chatbot-, Kommunikations- oder Assistenzfall hin.":
    "The purpose points to a chatbot, communication, or assistance use case.",
  "Das hinterlegte Tool ist im Katalog als GPAI-/Transparenzfall mit begrenztem Risiko hinterlegt.":
    "The recorded tool is listed as a GPAI/transparency case with limited risk.",
  "Es werden personenbezogene Daten verarbeitet.":
    "Personal data are processed.",
  "Es gibt Bewerber*innen-Kontext, aber noch keine klaren Signale fuer Scoring oder Auswahl.":
    "There is an applicant context, but no clear signals for scoring or selection yet.",
  "Es liegen noch zu wenige belastbare Signale fuer eine klare Risikorichtung vor.":
    "There are still too few reliable signals for a clear risk direction.",
  "Der Tool-Katalog signalisiert erhoehtes Risiko, das allein aber keine finale Einstufung tragen sollte.":
    "The tool catalog signals elevated risk, but this alone should not carry the final classification.",
};

function isEnglishLocale(locale: string | null | undefined): boolean {
  return locale?.toLowerCase().startsWith("en") ?? false;
}

function localizeRiskSuggestionText(value: string, locale?: string): string {
  if (!isEnglishLocale(locale)) {
    return value;
  }

  return RISK_SUGGESTION_TEXT_EN[value] ?? value;
}

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
  locale?: string,
): string {
  return getRiskClassDisplayLabel(riskClass, locale);
}

export function getRiskManualOptionDescription(
  riskClass: CanonicalAiActRiskClass,
  locale?: string,
): string {
  return isEnglishLocale(locale)
    ? RISK_CLASS_MANUAL_DESCRIPTIONS_EN[riskClass]
    : RISK_CLASS_MANUAL_DESCRIPTIONS[riskClass];
}

export function getRiskAssistCurrentDisplayLabel(
  aiActCategory: string | null | undefined,
  locale?: string,
): string | null {
  const trimmed = aiActCategory?.trim() ?? "";
  if (!trimmed) return null;

  const parsed = parseStoredAiActCategory(trimmed);
  if (parsed !== "UNASSESSED") {
    return getRiskClassShortLabel(parsed, locale);
  }

  return trimmed;
}

export function buildRiskSuggestionForEditDraft(
  draft: RiskAssistEditDraftInput,
  toolRiskLevel: EuAiActRiskLevel | null,
  locale?: string,
): RiskSuggestionResult {
  const result = suggestRiskClass({
    purpose: draft.purpose,
    usageContexts: draft.usageContexts,
    decisionInfluence: draft.decisionInfluence,
    dataCategories: draft.dataCategories,
    toolId: draft.toolId === "other" ? null : draft.toolId,
    toolFreeText: draft.toolFreeText,
    toolRiskLevel,
    aiActCategory: draft.aiActCategory,
  });

  if (!isEnglishLocale(locale)) {
    return result;
  }

  return {
    ...result,
    reasons: result.reasons.map((reason) =>
      localizeRiskSuggestionText(reason, locale),
    ),
    openQuestions: result.openQuestions.map((question) =>
      localizeRiskSuggestionText(question, locale),
    ),
  };
}
