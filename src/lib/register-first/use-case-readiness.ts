import type {
  ControlFocusTarget,
  GovernanceRepairField,
} from "@/lib/control/deep-link";
import { hasDocumentedAiActCategory } from "./risk-taxonomy";
import {
  type OrgSettings,
  type RegisterUseCaseStatus,
  type UseCaseCard,
} from "./types";
import { resolveUniqueSystemsForCompliance } from "./systems";

export type UseCaseReadinessPhase =
  | "incomplete"
  | "review_pending"
  | "proof_ready";

export interface UseCaseReadinessTarget {
  focus: ControlFocusTarget;
  edit?: boolean;
  field?: GovernanceRepairField;
}

export interface UseCaseReadinessItem {
  key: "risk" | "owner" | "oversight" | "reviewCycle";
  label: string;
  target: UseCaseReadinessTarget;
}

export type UseCaseReadinessStepKey =
  | "groundProofs"
  | "systemEvidence"
  | "formalReview";

export interface UseCaseReadinessStep {
  key: UseCaseReadinessStepKey;
  label: string;
  detail: string;
  complete: boolean;
  target: UseCaseReadinessTarget;
}

export interface UseCaseReadinessResult {
  phase: UseCaseReadinessPhase;
  missingItems: UseCaseReadinessItem[];
  completedItems: UseCaseReadinessItem[];
  nextItem: UseCaseReadinessItem | null;
  steps: UseCaseReadinessStep[];
  completedStepCount: number;
  nextStep: UseCaseReadinessStep | null;
  canMarkProofReady: boolean;
  nextStatusActionAvailable: boolean;
}

function isGermanLocale(locale: string | null | undefined): boolean {
  return locale?.toLowerCase().startsWith("de") ?? false;
}

function getUseCaseReadinessCopy(locale?: string) {
  if (!isGermanLocale(locale)) {
    return {
      ownerItem: "Assign responsible role",
      oversightItem: "Define oversight model",
      reviewCycleItem: "Define review cycle",
      riskItem: "Review risk class",
      noSystem: "No system",
      groundProofs: "Ground evidence",
      systemEvidence: "System evidence",
      formalReview: "Formal review",
      documented: "documented",
      noSystemDocumented: "No system documented",
      systemsClassified: "systems classified for evidence",
      systemClassified: "system classified for evidence",
      formallyComplete: "Formally completed",
      finalStepOpen: "Final step still open",
    };
  }

  return {
    ownerItem: "Verantwortliche Rolle festlegen",
    oversightItem: "Aufsichtsmodell festlegen",
    reviewCycleItem: "Review-Zyklus festlegen",
    riskItem: "Risikoklasse pruefen",
    noSystem: "Kein System",
    groundProofs: "Grundnachweise",
    systemEvidence: "Systemnachweis",
    formalReview: "Formale Pruefung",
    documented: "dokumentiert",
    noSystemDocumented: "Noch kein System dokumentiert",
    systemsClassified: "Systemen fuer den Nachweis eingeordnet",
    systemClassified: "System fuer den Nachweis eingeordnet",
    formallyComplete: "Formal abgeschlossen",
    finalStepOpen: "Letzter Baustein noch offen",
  };
}

function isProofReady(status: RegisterUseCaseStatus): boolean {
  return status === "PROOF_READY";
}

export function computeUseCaseReadiness(
  card: UseCaseCard,
  orgSettings: OrgSettings | null = null,
  locale?: string,
): UseCaseReadinessResult {
  const copy = getUseCaseReadinessCopy(locale);
  const iso = card.governanceAssessment?.flex?.iso;

  const items: Array<UseCaseReadinessItem & { complete: boolean }> = [
    {
      key: "owner",
      label: copy.ownerItem,
      target: {
        focus: "owner",
        edit: true,
      },
      complete:
        Boolean(card.responsibility?.responsibleParty) ||
        card.responsibility?.isCurrentlyResponsible === true,
    },
    {
      key: "oversight",
      label: copy.oversightItem,
      target: {
        focus: "governance",
        edit: true,
        field: "oversight",
      },
      complete:
        Boolean(iso?.oversightModel) && iso?.oversightModel !== "unknown",
    },
    {
      key: "reviewCycle",
      label: copy.reviewCycleItem,
      target: {
        focus: "governance",
        edit: true,
        field: "reviewCycle",
      },
      complete:
        (Boolean(iso?.reviewCycle) && iso?.reviewCycle !== "unknown") ||
        Boolean(orgSettings?.reviewStandard),
    },
    {
      key: "risk",
      label: copy.riskItem,
      target: {
        focus: "governance",
      },
      complete: hasDocumentedAiActCategory(
        card.governanceAssessment?.core?.aiActCategory,
      ),
    },
  ];

  const missingItems = items.filter((item) => !item.complete);
  const completedItems = items.filter((item) => item.complete);
  const groundProofsComplete = missingItems.length === 0;
  const uniqueSystems = resolveUniqueSystemsForCompliance(card, {
    emptyLabel: copy.noSystem,
  });
  const hasDocumentedSystem = uniqueSystems.some(
    (system) => Boolean(system.toolId) || Boolean(system.toolFreeText),
  );
  const systemsReadyCount = uniqueSystems.filter(
    (system) => Boolean(system.publicInfo) || system.requiresManualDocumentation,
  ).length;
  const systemEvidenceComplete =
    hasDocumentedSystem &&
    uniqueSystems.length > 0 &&
    systemsReadyCount === uniqueSystems.length;
  const canMarkProofReady = groundProofsComplete && systemEvidenceComplete;
  const phase: UseCaseReadinessPhase = isProofReady(card.status)
    ? "proof_ready"
    : canMarkProofReady
      ? "review_pending"
      : "incomplete";

  const steps: UseCaseReadinessStep[] = [
    {
      key: "groundProofs",
      label: copy.groundProofs,
      detail:
        groundProofsComplete
          ? `${completedItems.length} von ${items.length} ${copy.documented}`
          : missingItems.map((item) => item.label).join(", "),
      complete: groundProofsComplete,
      target: {
        focus: "governance",
      },
    },
    {
      key: "systemEvidence",
      label: copy.systemEvidence,
      detail: !hasDocumentedSystem
        ? copy.noSystemDocumented
        : `${systemsReadyCount} von ${uniqueSystems.length} ${
            uniqueSystems.length === 1
              ? copy.systemClassified
              : copy.systemsClassified
          }`,
      complete: systemEvidenceComplete,
      target: {
        focus: "systems",
      },
    },
    {
      key: "formalReview",
      label: copy.formalReview,
      detail: isProofReady(card.status)
        ? copy.formallyComplete
        : copy.finalStepOpen,
      complete: isProofReady(card.status),
      target: {
        focus: "review",
      },
    },
  ];
  const completedStepCount = steps.filter((step) => step.complete).length;
  const nextStep = steps.find((step) => !step.complete) ?? null;

  return {
    phase,
    missingItems,
    completedItems,
    nextItem: missingItems[0] ?? null,
    steps,
    completedStepCount,
    nextStep,
    canMarkProofReady,
    nextStatusActionAvailable: canMarkProofReady && !isProofReady(card.status),
  };
}
