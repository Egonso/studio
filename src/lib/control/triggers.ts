import { calculateReviewDeadline } from "@/lib/compliance-engine/reminders/review-deadline";
import { calculateControlOverview } from "@/lib/control/maturity-calculator";
import { resolveGovernanceCopyLocale } from "@/lib/i18n/governance-copy";
import {
  isHighRiskClass,
  parseStoredAiActCategory,
} from "@/lib/register-first/risk-taxonomy";
import type { OrgSettings, UseCaseCard } from "@/lib/register-first/types";

export const CONTROL_UPGRADE_MESSAGE =
  "Sie dokumentieren. Jetzt sollten Sie steuern.";
export const CONTROL_UPGRADE_CTA_LABEL = "Governance professionalisieren";
export const CONTROL_UPGRADE_MESSAGE_EN =
  "You are documenting. Now you should govern.";
export const CONTROL_UPGRADE_CTA_LABEL_EN = "Professionalise governance";
export const CONTROL_UPGRADE_ISO_THRESHOLD = 70;

export type ControlUpgradeTriggerId =
  | "use_cases_over_ten"
  | "review_overdue"
  | "high_risk_without_oversight"
  | "iso_readiness_below_70"
  | "external_stakeholder_proof_needed";

export interface ControlUpgradeTrigger {
  id: ControlUpgradeTriggerId;
  label: string;
  value: number;
  evidence: string;
}

export interface ControlUpgradeDecision {
  shouldPrompt: boolean;
  message: string;
  ctaLabel: string;
  triggers: ControlUpgradeTrigger[];
}

function hasOversight(useCase: UseCaseCard): boolean {
  if (useCase.governanceAssessment?.core?.oversightDefined === true) return true;
  const model = useCase.governanceAssessment?.flex?.iso?.oversightModel;
  return Boolean(model && model !== "unknown");
}

function isHighRisk(useCase: UseCaseCard): boolean {
  return isHighRiskClass(
    parseStoredAiActCategory(useCase.governanceAssessment?.core?.aiActCategory)
  );
}

function isExternalFacing(useCase: UseCaseCard): boolean {
  const externalContexts = new Set([
    "CUSTOMERS",
    "APPLICANTS",
    "PUBLIC",
    "CUSTOMER_FACING",
    "EXTERNAL_PUBLIC",
  ]);

  return useCase.usageContexts.some((context) => externalContexts.has(context));
}

function hasVerifiedProof(useCase: UseCaseCard): boolean {
  return Boolean(
    useCase.proof?.verification?.isReal && useCase.proof?.verification?.isCurrent
  );
}

function getControlUpgradeCopy(locale?: string | null) {
  if (resolveGovernanceCopyLocale(locale) === "en") {
    return {
      message: CONTROL_UPGRADE_MESSAGE_EN,
      ctaLabel: CONTROL_UPGRADE_CTA_LABEL_EN,
      useCasesOverTen: (count: number) =>
        `More than 10 use cases documented (${count})`,
      useCasesOverTenEvidence:
        "The register size requires organisation-wide control.",
      reviewsOverdue: (count: number) => `${count} reviews overdue`,
      reviewsOverdueEvidence: "Review deadlines are in the past.",
      highRiskWithoutOversight: (count: number) =>
        `${count} high-risk system${count === 1 ? "" : "s"} without oversight`,
      highRiskWithoutOversightEvidence:
        "The oversight model is not fully documented for high-risk systems.",
      isoReadinessBelowThreshold: (threshold: number, value: number) =>
        `ISO readiness below ${threshold}% (${value}%)`,
      isoReadinessEvidence:
        "ISO-related evidence is still incomplete across the organisation.",
      externalProofNeeded: (count: number) =>
        `${count} system${count === 1 ? "" : "s"} with external stakeholder evidence needs`,
      externalProofEvidence:
        "External impact areas without verified evidence.",
    } as const;
  }

  return {
    message: CONTROL_UPGRADE_MESSAGE,
    ctaLabel: CONTROL_UPGRADE_CTA_LABEL,
    useCasesOverTen: (count: number) =>
      `Mehr als 10 Einsatzfälle dokumentiert (${count})`,
    useCasesOverTenEvidence:
      "Die Registergröße erfordert organisationsweite Steuerung.",
    reviewsOverdue: (count: number) => `${count} Reviews überfällig`,
    reviewsOverdueEvidence: "Review-Fristen liegen in der Vergangenheit.",
    highRiskWithoutOversight: (count: number) =>
      `${count} Hochrisiko-Systeme ohne Aufsicht`,
    highRiskWithoutOversightEvidence:
      "Aufsichtsmodell ist für Hochrisiko-Systeme nicht vollständig dokumentiert.",
    isoReadinessBelowThreshold: (threshold: number, value: number) =>
      `ISO-Readiness unter ${threshold}% (${value}%)`,
    isoReadinessEvidence:
      "ISO-bezogene Nachweise sind organisationsweit noch unvollständig.",
    externalProofNeeded: (count: number) =>
      `${count} Systeme mit externem Stakeholder-Nachweisbedarf`,
    externalProofEvidence:
      "Externe Wirkungsbereiche ohne verifizierten Nachweis.",
  } as const;
}

export function evaluateControlUpgradeTriggers(
  useCases: UseCaseCard[],
  orgSettings?: OrgSettings | null,
  now: Date = new Date(),
  locale?: string | null
): ControlUpgradeDecision {
  const triggers: ControlUpgradeTrigger[] = [];
  const copy = getControlUpgradeCopy(locale);

  if (useCases.length > 10) {
    triggers.push({
      id: "use_cases_over_ten",
      label: copy.useCasesOverTen(useCases.length),
      value: useCases.length,
      evidence: copy.useCasesOverTenEvidence,
    });
  }

  const overdueReviews = useCases.filter(
    (useCase) => calculateReviewDeadline(useCase, now).status === "overdue"
  ).length;
  if (overdueReviews > 0) {
    triggers.push({
      id: "review_overdue",
      label: copy.reviewsOverdue(overdueReviews),
      value: overdueReviews,
      evidence: copy.reviewsOverdueEvidence,
    });
  }

  const highRiskWithoutOversight = useCases.filter(
    (useCase) => isHighRisk(useCase) && !hasOversight(useCase)
  ).length;
  if (highRiskWithoutOversight > 0) {
    triggers.push({
      id: "high_risk_without_oversight",
      label: copy.highRiskWithoutOversight(highRiskWithoutOversight),
      value: highRiskWithoutOversight,
      evidence: copy.highRiskWithoutOversightEvidence,
    });
  }

  const overview = calculateControlOverview(
    useCases,
    orgSettings,
    now,
    locale ?? undefined
  );
  if (overview.kpis.isoReadinessPercent < CONTROL_UPGRADE_ISO_THRESHOLD) {
    triggers.push({
      id: "iso_readiness_below_70",
      label: copy.isoReadinessBelowThreshold(
        CONTROL_UPGRADE_ISO_THRESHOLD,
        overview.kpis.isoReadinessPercent
      ),
      value: overview.kpis.isoReadinessPercent,
      evidence: copy.isoReadinessEvidence,
    });
  }

  const externalProofNeeded = useCases.filter(
    (useCase) => isExternalFacing(useCase) && !hasVerifiedProof(useCase)
  ).length;
  if (externalProofNeeded > 0) {
    triggers.push({
      id: "external_stakeholder_proof_needed",
      label: copy.externalProofNeeded(externalProofNeeded),
      value: externalProofNeeded,
      evidence: copy.externalProofEvidence,
    });
  }

  return {
    shouldPrompt: triggers.length > 0,
    message: copy.message,
    ctaLabel: copy.ctaLabel,
    triggers,
  };
}
