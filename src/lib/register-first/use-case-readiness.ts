import type {
  ControlFocusTarget,
  GovernanceRepairField,
} from "@/lib/control/deep-link";
import {
  resolvePrimaryDataCategory,
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

function isProofReady(status: RegisterUseCaseStatus): boolean {
  return status === "PROOF_READY";
}

export function computeUseCaseReadiness(
  card: UseCaseCard,
  orgSettings: OrgSettings | null = null,
): UseCaseReadinessResult {
  const iso = card.governanceAssessment?.flex?.iso;

  const items: Array<UseCaseReadinessItem & { complete: boolean }> = [
    {
      key: "risk",
      label: "Risikoklasse festlegen",
      target: {
        focus: "metadata",
        edit: true,
      },
      complete:
        Boolean(card.governanceAssessment?.core?.aiActCategory) ||
        Boolean(resolvePrimaryDataCategory(card)),
    },
    {
      key: "owner",
      label: "Verantwortliche Rolle festlegen",
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
      label: "Aufsichtsmodell festlegen",
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
      label: "Review-Zyklus festlegen",
      target: {
        focus: "governance",
        edit: true,
        field: "reviewCycle",
      },
      complete:
        (Boolean(iso?.reviewCycle) && iso?.reviewCycle !== "unknown") ||
        Boolean(orgSettings?.reviewStandard),
    },
  ];

  const missingItems = items.filter((item) => !item.complete);
  const completedItems = items.filter((item) => item.complete);
  const groundProofsComplete = missingItems.length === 0;
  const uniqueSystems = resolveUniqueSystemsForCompliance(card, {
    emptyLabel: "Kein System",
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
      label: "Grundnachweise",
      detail:
        groundProofsComplete
          ? `${completedItems.length} von ${items.length} dokumentiert`
          : missingItems.map((item) => item.label).join(", "),
      complete: groundProofsComplete,
      target: {
        focus: "governance",
      },
    },
    {
      key: "systemEvidence",
      label: "Systemnachweis",
      detail: !hasDocumentedSystem
        ? "Noch kein System dokumentiert"
        : `${systemsReadyCount} von ${uniqueSystems.length} Systemen fuer den Nachweis eingeordnet`,
      complete: systemEvidenceComplete,
      target: {
        focus: "systems",
      },
    },
    {
      key: "formalReview",
      label: "Formale Pruefung",
      detail: isProofReady(card.status)
        ? "Formal abgeschlossen"
        : "Letzter Baustein noch offen",
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
