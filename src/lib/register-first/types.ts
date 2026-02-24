export const CAPTURE_STEP_3_LABEL = "Bist du aktuell dafür verantwortlich?" as const;

export type RegisterUseCaseStatus =
  | "UNREVIEWED"
  | "REVIEW_RECOMMENDED"
  | "REVIEWED"
  | "PROOF_READY";

export type GovernanceDecisionActor = "HUMAN" | "SYSTEM" | "AUTOMATION";

export type CaptureUsageContext =
  | "INTERNAL_ONLY"
  | "CUSTOMER_FACING"   // legacy alias for CUSTOMERS
  | "EMPLOYEE_FACING"   // legacy alias for EMPLOYEES
  | "EXTERNAL_PUBLIC"   // legacy alias for PUBLIC
  | "EMPLOYEES"
  | "CUSTOMERS"
  | "APPLICANTS"
  | "PUBLIC";

/** Canonical German labels for the Wirkungsbereich multi-select */
export const USAGE_CONTEXT_LABELS: Record<CaptureUsageContext, string> = {
  INTERNAL_ONLY: "Nur interne Prozesse",
  EMPLOYEES: "Mitarbeitende betroffen",
  CUSTOMERS: "Kund*innen betroffen",
  APPLICANTS: "Bewerber*innen betroffen",
  PUBLIC: "Öffentlichkeit betroffen",
  // Legacy labels (still valid for old data)
  CUSTOMER_FACING: "Kund*innen betroffen",
  EMPLOYEE_FACING: "Mitarbeitende betroffen",
  EXTERNAL_PUBLIC: "Öffentlichkeit betroffen",
};

/** The 5 canonical options shown in the UI */
export const USAGE_CONTEXT_OPTIONS: CaptureUsageContext[] = [
  "INTERNAL_ONLY",
  "EMPLOYEES",
  "CUSTOMERS",
  "APPLICANTS",
  "PUBLIC",
];

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
  /** @deprecated Organisation comes from OrgSettings now */
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

  // ── Inheritance Provenance (Sprint S3) ────────────────────────────────────
  fieldProvenance?: Record<string, {
    source: 'inherit' | 'override';
    overrideReason?: string;
    approvedBy?: string;
    timestamp: string;
  }>;

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

// ── OrgSettings (Global Governance & Identity) ──────────────────────────────

export interface OrgSettings {
  organisationName: string;
  industry: string;
  contactPerson: { name: string; email: string };

  aiPolicy?: {
    url: string;
    owner?: string;
    lastReviewedAt?: string;
  } | null;

  incidentProcess?: {
    url: string;
  } | null;

  rolesFramework?: {
    docUrl?: string;
    booleanDefined?: boolean;
  } | null;

  reviewStandard?: "annual" | "semiannual" | "risk-based" | null;

  // ── Extended Governance Settings (Pro/Enterprise) ─────────────────────────

  /** Organizational scope of AI governance */
  scope?: ('INTERNAL' | 'EXTERNAL' | 'PRODUCT_AI' | 'SUPPLY_CHAIN')[];

  /** Structured RACI roles for AI governance */
  raci?: {
    aiOwner?: RoleEntry | null;
    complianceOwner?: RoleEntry | null;
    technicalOwner?: RoleEntry | null;
    incidentOwner?: RoleEntry | null;
    reviewOwner?: RoleEntry | null;
    dpo?: RoleEntry | null;
    securityOfficer?: RoleEntry | null;
    productOwner?: RoleEntry | null;
  };

  /** Risk assessment methodology */
  riskMethodology?: 'basis' | 'extended';

  /** Detailed incident management configuration */
  incidentConfig?: {
    reportingPath?: string;
    escalationLevel?: string;
    documentationRequired?: boolean;
    responseTimeframe?: string;
  } | null;

  /** Review cycle configuration */
  reviewCycle?: {
    type: 'fixed' | 'risk_based' | 'event_based';
    interval?: string;
  } | null;

  /** Competency and training requirements */
  competencyMatrix?: {
    euAiActTrainingRequired?: boolean;
    technicalAiCompetency?: boolean;
    dataPrivacyTraining?: boolean;
    incidentTraining?: boolean;
  } | null;

  /** ISO standard alignment flags */
  isoFlags?: {
    iso27001Alignment?: boolean;
    iso42001Preparation?: boolean;
  } | null;
}

/** A named role holder in the RACI matrix */
export interface RoleEntry {
  name: string;
  email?: string;
  department?: string;
}

// ── Subscription Plans ──────────────────────────────────────────────────────

export type SubscriptionPlan = 'free' | 'pro' | 'enterprise';

// ── Standalone Register (User-Scoped) ───────────────────────────────────────

export interface Register {
  registerId: string;
  name: string;
  createdAt: string;
  linkedProjectId?: string | null;
  organisationName?: string | null;
  organisationUnit?: string | null;
  publicOrganisationDisclosure?: boolean;
  orgSettings?: OrgSettings | null;

  // ── Subscription & Feature Gating ─────────────────────────────────────────
  plan?: SubscriptionPlan; // 'free' (default) | 'pro' | 'enterprise'

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
