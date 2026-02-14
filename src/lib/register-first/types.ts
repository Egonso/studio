export const CAPTURE_STEP_3_LABEL = "Bist du aktuell dafür verantwortlich?" as const;

export type RegisterUseCaseStatus =
  | "UNREVIEWED"
  | "REVIEW_RECOMMENDED"
  | "REVIEWED"
  | "PROOF_READY";

export type GovernanceDecisionActor = "HUMAN" | "SYSTEM" | "AUTOMATION";

export type CaptureUsageContext =
  | "INTERNAL_ONLY"
  | "CUSTOMER_FACING"
  | "EMPLOYEE_FACING"
  | "EXTERNAL_PUBLIC";

export type DecisionImpact = "YES" | "NO" | "UNSURE";

export type AffectedParty =
  | "INDIVIDUALS"
  | "GROUPS_OR_TEAMS"
  | "EXTERNAL_PEOPLE"
  | "INTERNAL_PROCESSES";

export interface CaptureInput {
  purpose: string;
  usageContexts: CaptureUsageContext[];
  isCurrentlyResponsible: boolean;
  responsibleParty?: string | null;
  decisionImpact: DecisionImpact;
  affectedParties?: AffectedParty[];
  // v1.1 fields (optional for backward compat with v1.0 capture flows)
  toolId?: string;
  toolFreeText?: string;
  dataCategory?: DataCategory;
}

export type DataCategory = "NONE" | "INTERNAL" | "PERSONAL" | "SENSITIVE";

export interface ReviewEvent {
  reviewId: string;
  reviewedAt: string;
  reviewedBy: string;
  nextStatus: Exclude<RegisterUseCaseStatus, "UNREVIEWED">;
  notes?: string;
}

export interface ProofMeta {
  verifyUrl: string;
  generatedAt: string;
  verification: {
    isReal: boolean;
    isCurrent: boolean;
    scope: string;
  };
}

export interface EvidenceReference {
  evidenceId: string;
  label: string;
  type: "NOTE" | "DOCUMENT" | "LINK";
  uri?: string;
}

export type CardVersion = "1.0" | "1.1";

export interface UseCaseCard {
  cardVersion: CardVersion;
  useCaseId: string;
  createdAt: string;
  updatedAt: string;
  purpose: string;
  usageContexts: CaptureUsageContext[];
  responsibility: {
    isCurrentlyResponsible: boolean;
    responsibleParty?: string | null;
  };
  decisionImpact: DecisionImpact;
  affectedParties: AffectedParty[];
  status: RegisterUseCaseStatus;
  reviewHints: string[];
  evidences: EvidenceReference[];
  reviews: ReviewEvent[];
  proof: ProofMeta | null;
  // ── v1.1 fields (optional so v1.0 cards remain valid) ───────────────
  globalUseCaseId?: string;
  formatVersion?: string;
  toolId?: string;
  toolFreeText?: string;
  dataCategory?: DataCategory;
  publicHashId?: string;
  isPublicVisible?: boolean;
}

export const REGISTER_FIRST_GOVERNANCE_POLICY = Object.freeze({
  automatedReviewRequired: false,
  automatedEscalation: false,
  automatedPolicyGeneration: false,
  decisionMode: "MANUAL_ONLY" as const,
});

// ── Standalone Register (User-Scoped) ───────────────────────────────────────

export interface Register {
  registerId: string;
  name: string;
  createdAt: string;
  linkedProjectId?: string | null;
}

export interface PublicUseCaseIndexEntry {
  publicHashId: string;
  globalUseCaseId: string;
  formatVersion: string;
  purpose: string;
  toolName: string;
  dataCategory: string;
  status: RegisterUseCaseStatus;
  createdAt: string;
  ownerId: string;
  verification: { isReal: boolean; isCurrent: boolean; scope: string } | null;
}
