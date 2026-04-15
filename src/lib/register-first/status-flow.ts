export {
  getRegisterUseCaseStatusLabel,
  registerUseCaseStatusLabels,
  registerUseCaseStatusOrder,
} from "./card-model";
import { registerUseCaseStatusTransitions } from "./card-model";
import type { RegisterUseCaseStatus } from "./types";

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
  return [...registerUseCaseStatusTransitions[currentStatus]];
}

export function isStatusTransitionAllowed(
  currentStatus: RegisterUseCaseStatus,
  nextStatus: RegisterUseCaseStatus
): boolean {
  if (currentStatus === nextStatus) {
    return true;
  }
  return registerUseCaseStatusTransitions[currentStatus].includes(nextStatus);
}

export function getOutputProfileByStatus(
  status: RegisterUseCaseStatus
): RegisterOutputProfile {
  return outputProfiles[status];
}
