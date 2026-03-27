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

export interface UseCaseReadinessResult {
  phase: UseCaseReadinessPhase;
  missingItems: UseCaseReadinessItem[];
  completedItems: UseCaseReadinessItem[];
  nextItem: UseCaseReadinessItem | null;
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
  const canMarkProofReady = missingItems.length === 0;
  const phase: UseCaseReadinessPhase = !canMarkProofReady
    ? "incomplete"
    : isProofReady(card.status)
      ? "proof_ready"
      : "review_pending";

  return {
    phase,
    missingItems,
    completedItems,
    nextItem: missingItems[0] ?? null,
    canMarkProofReady,
    nextStatusActionAvailable: canMarkProofReady && !isProofReady(card.status),
  };
}
