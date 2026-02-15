import type { RegisterUseCaseStatus } from "./types";

export const registerUseCaseStatusOrder: RegisterUseCaseStatus[] = [
  "UNREVIEWED",
  "REVIEW_RECOMMENDED",
  "REVIEWED",
  "PROOF_READY",
];

export const registerUseCaseStatusLabels: Record<RegisterUseCaseStatus, string> =
  Object.freeze({
    UNREVIEWED: "Formale Prüfung ausstehend",
    REVIEW_RECOMMENDED: "Prüfung empfohlen",
    REVIEWED: "Prüfung abgeschlossen",
    PROOF_READY: "Nachweisfähig",
  });

const statusTransitions: Record<RegisterUseCaseStatus, RegisterUseCaseStatus[]> =
  Object.freeze({
    UNREVIEWED: ["REVIEW_RECOMMENDED", "REVIEWED"],
    REVIEW_RECOMMENDED: ["REVIEWED"],
    REVIEWED: ["REVIEW_RECOMMENDED", "PROOF_READY"],
    PROOF_READY: ["REVIEWED"],
  });

export interface RegisterOutputProfile {
  artifactName: string;
  description: string;
  requiresManualDecision: boolean;
}

const outputProfiles: Record<RegisterUseCaseStatus, RegisterOutputProfile> =
  Object.freeze({
    UNREVIEWED: {
      artifactName: "Raw Register Card",
      description: "Frueher Register-Eintrag ohne Review-Zwang.",
      requiresManualDecision: false,
    },
    REVIEW_RECOMMENDED: {
      artifactName: "Register Card mit Review-Hinweis",
      description: "Hinweis vorhanden, aber kein automatischer Governance-Zwang.",
      requiresManualDecision: true,
    },
    REVIEWED: {
      artifactName: "Erweiterte Register Card",
      description: "Manuell gepruefter Zustand fuer belastbarere Kommunikation.",
      requiresManualDecision: true,
    },
    PROOF_READY: {
      artifactName: "Proof-Pack-bereiter Zustand",
      description: "Freigegeben fuer Nachweis-/Proof-Paket-Erstellung.",
      requiresManualDecision: true,
    },
  });

export function getNextManualStatuses(
  currentStatus: RegisterUseCaseStatus
): RegisterUseCaseStatus[] {
  return [...statusTransitions[currentStatus]];
}

export function isStatusTransitionAllowed(
  currentStatus: RegisterUseCaseStatus,
  nextStatus: RegisterUseCaseStatus
): boolean {
  if (currentStatus === nextStatus) {
    return true;
  }
  return statusTransitions[currentStatus].includes(nextStatus);
}

export function getOutputProfileByStatus(
  status: RegisterUseCaseStatus
): RegisterOutputProfile {
  return outputProfiles[status];
}
