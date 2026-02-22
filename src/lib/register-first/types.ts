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
  // v1.2 fields (Register-First: flat metadata)
  organisation?: string | null;
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

export interface StatusChange {
  from: RegisterUseCaseStatus;
  to: RegisterUseCaseStatus;
  changedAt: string;
  changedBy: string;
  changedByName: string;
  reason?: string;
}

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
  publicInfo?: ToolPublicInfo | null;
  // ── v1.2 fields (Register-First: flat metadata & generic tags) ────────
  organisation?: string | null;
  labels?: { key: string; value: string }[];
  standardVersion?: string;
  isDeleted?: boolean;

  // ── Register-First Architecture: Assessment ─────────────────────────────
  governanceAssessment?: {
    core: {
      aiActCategory?: string | null;
      oversightDefined?: boolean;
      reviewCycleDefined?: boolean;
      documentationLevelDefined?: boolean;
      coreVersion?: string;
      assessedAt?: string;
    };
    flex: {
      maturityLevel?: "Level 1" | "Level 2" | "Level 3" | null;
      oversightModel?: string | null;
      reviewFrequency?: string | null;
      riskControls?: string[];
      trainingRequired?: boolean;
      policyLinks?: string[];
      incidentProcessDefined?: boolean;

      // Sprint 18: Strict ISO-Micro Schema (Registers-First)
      iso?: {
        reviewCycle: "annual" | "semiannual" | "quarterly" | "monthly" | "ad_hoc" | "unknown";
        oversightModel: "HITL" | "HOTL" | "HUMAN_REVIEW" | "NO_HUMAN" | "unknown";
        documentationLevel: "minimal" | "standard" | "extended" | "unknown";
        lifecycleStatus: "pilot" | "active" | "retired" | "unknown";
        lastReviewedAt?: string | null;
        nextReviewAt?: string | null;
      };

      // Sprint 18: Strict Portfolio-Micro Schema
      portfolio?: {
        valueScore: 0 | 1 | 2 | 3 | 4 | 5 | null;
        valueRationale: string | null; // max 300 chars
        riskScore: 0 | 1 | 2 | 3 | 4 | 5 | null;
        riskRationale: string | null; // max 300 chars
        strategyTag: "pilot" | "scale" | "monitor" | "stop" | null;
      };
    };
  };

  // ── Audit Trail (Sprint 4) ──────────────────────────────────────────────
  statusHistory?: StatusChange[];
  capturedBy?: string;
  capturedByName?: string;
  capturedViaCode?: boolean;
  accessCodeLabel?: string;
}

export type ConfidenceLevel = "low" | "medium" | "high";
export type FlagStatus = "yes" | "no" | "not_found";

export interface PublicInfoSource {
  title: string;
  url: string;
  type: "trust_center" | "privacy" | "terms" | "dpa" | "scc" | "blog" | "other";
  accessedAt: string; // ISO Date
}

export interface ToolPublicInfo {
  lastCheckedAt: string | null; // ISO Date
  checker: "perplexity" | "manual" | "web" | null;
  summary: string | null; // Max 300 chars, neutral
  flags: {
    gdprClaim: FlagStatus;
    aiActClaim: FlagStatus;
    trustCenterFound: FlagStatus;
    privacyPolicyFound: FlagStatus;
    dpaOrSccMention: FlagStatus;
  };
  confidence: ConfidenceLevel;
  sources: PublicInfoSource[];
  disclaimerVersion: string; // e.g. "v1"
}

export const REGISTER_FIRST_GOVERNANCE_POLICY = Object.freeze({
  automatedReviewRequired: false,
  automatedEscalation: false,
  automatedPolicyGeneration: false,
  decisionMode: "MANUAL_ONLY" as const,
});

// ── Company Profile (Organisation Onboarding) ───────────────────────────────

export interface CompanyProfile {
  firmenname: string;
  branche: string;
  mitarbeiterAnzahl: string;
  ansprechpartner: { name: string; email: string };
  abteilung: string;
  bestehendeKiNutzung: boolean;
  euAiActRelevant: "ja" | "nein" | "unsicher";
  datenschutzbeauftragter?: string | null;
}

// ── Standalone Register (User-Scoped) ───────────────────────────────────────

export interface Register {
  registerId: string;
  name: string;
  createdAt: string;
  linkedProjectId?: string | null;
  organisationName?: string | null;
  organisationUnit?: string | null;
  publicOrganisationDisclosure?: boolean;
  companyProfile?: CompanyProfile | null;

  // ── Register-First Architecture: Org Baseline ─────────────────────────────
  governanceMaturityLevel?: 1 | 2 | 3; // Baseline Level for all enclosed Use Cases
}

// ── Access Codes (Hybrid Auth) ───────────────────────────────────────────────

export interface RegisterAccessCode {
  code: string;
  registerId: string;
  ownerId: string;
  createdAt: string;
  expiresAt: string | null;
  label: string;
  usageCount: number;
  maxUsageCount?: number | null;
  isActive: boolean;
}

// ── Public Index ─────────────────────────────────────────────────────────────

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
  organisationName?: string | null;
}

// ── Dashboard Metrics ────────────────────────────────────────────────────────

export interface RegisterMetrics {
  totalUseCases: number;
  activeUseCases: number;
  publicUseCases: number;
  riskDistribution: {
    prohibited: number;
    high: number;
    limited: number;
    minimal: number;
    unassessed: number;
  };
  maturityScore: number;
  actionItemsCount: number;
}
