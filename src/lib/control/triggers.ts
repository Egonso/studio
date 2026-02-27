import { calculateReviewDeadline } from "@/lib/compliance-engine/reminders/review-deadline";
import { calculateControlOverview } from "@/lib/control/maturity-calculator";
import type { OrgSettings, UseCaseCard } from "@/lib/register-first/types";

export const CONTROL_UPGRADE_MESSAGE =
  "Sie dokumentieren. Jetzt sollten Sie steuern.";
export const CONTROL_UPGRADE_CTA_LABEL = "Governance professionalisieren";
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
  const category = useCase.governanceAssessment?.core?.aiActCategory?.toLowerCase() ?? "";
  return category.includes("hochrisiko") || category.includes("high risk");
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

export function evaluateControlUpgradeTriggers(
  useCases: UseCaseCard[],
  orgSettings?: OrgSettings | null,
  now: Date = new Date()
): ControlUpgradeDecision {
  const triggers: ControlUpgradeTrigger[] = [];

  if (useCases.length > 10) {
    triggers.push({
      id: "use_cases_over_ten",
      label: `Mehr als 10 Einsatzfaelle dokumentiert (${useCases.length})`,
      value: useCases.length,
      evidence: "Die Registergroesse erfordert organisationsweite Steuerung.",
    });
  }

  const overdueReviews = useCases.filter(
    (useCase) => calculateReviewDeadline(useCase, now).status === "overdue"
  ).length;
  if (overdueReviews > 0) {
    triggers.push({
      id: "review_overdue",
      label: `${overdueReviews} Reviews ueberfaellig`,
      value: overdueReviews,
      evidence: "Review-Fristen liegen in der Vergangenheit.",
    });
  }

  const highRiskWithoutOversight = useCases.filter(
    (useCase) => isHighRisk(useCase) && !hasOversight(useCase)
  ).length;
  if (highRiskWithoutOversight > 0) {
    triggers.push({
      id: "high_risk_without_oversight",
      label: `${highRiskWithoutOversight} Hochrisiko-Systeme ohne Aufsicht`,
      value: highRiskWithoutOversight,
      evidence: "Aufsichtsmodell ist fuer Hochrisiko-Systeme nicht vollstaendig dokumentiert.",
    });
  }

  const overview = calculateControlOverview(useCases, orgSettings, now);
  if (overview.kpis.isoReadinessPercent < CONTROL_UPGRADE_ISO_THRESHOLD) {
    triggers.push({
      id: "iso_readiness_below_70",
      label: `ISO-Readiness unter ${CONTROL_UPGRADE_ISO_THRESHOLD}% (${overview.kpis.isoReadinessPercent}%)`,
      value: overview.kpis.isoReadinessPercent,
      evidence: "ISO-bezogene Nachweise sind organisationsweit noch unvollstaendig.",
    });
  }

  const externalProofNeeded = useCases.filter(
    (useCase) => isExternalFacing(useCase) && !hasVerifiedProof(useCase)
  ).length;
  if (externalProofNeeded > 0) {
    triggers.push({
      id: "external_stakeholder_proof_needed",
      label: `${externalProofNeeded} Systeme mit externem Stakeholder-Nachweisbedarf`,
      value: externalProofNeeded,
      evidence: "Externe Wirkungsbereiche ohne verifizierten Nachweis.",
    });
  }

  return {
    shouldPrompt: triggers.length > 0,
    message: CONTROL_UPGRADE_MESSAGE,
    ctaLabel: CONTROL_UPGRADE_CTA_LABEL,
    triggers,
  };
}
