import type {
  ApprovalWorkflow,
} from '@/lib/enterprise/workspace';
import type { CaptureAssistContext } from "@/lib/coverage-assist/types";

export const CAPTURE_STEP_3_LABEL =
  'Bist du aktuell dafür verantwortlich?' as const;

export type {
  AffectedParty,
  CardVersion,
  CaptureUsageContext,
  DataCategory,
  DecisionImpact,
  DecisionInfluence,
  RegisterUseCaseStatus,
  UseCaseOriginSource,
} from './card-model';

export {
  CANONICAL_CARD_VERSION,
  DATA_CATEGORIES,
  DATA_CATEGORY_LABELS,
  DATA_CATEGORY_MAIN_OPTIONS,
  DATA_CATEGORY_SPECIAL_OPTIONS,
  DECISION_IMPACT_VALUES,
  DECISION_INFLUENCE_LABELS,
  DECISION_INFLUENCE_OPTIONS,
  DECISION_INFLUENCE_VALUES,
  AFFECTED_PARTY_VALUES,
  USAGE_CONTEXT_LABELS,
  USAGE_CONTEXT_OPTIONS,
  REGISTER_USE_CASE_STATUS_VALUES,
  normalizeCaptureUsageContexts,
  normalizeDataCategories,
  normalizeDataCategory,
} from './card-model';

import { normalizeDataCategories } from './card-model';
import type {
  CardVersion,
  CaptureUsageContext,
  DataCategory,
  DecisionImpact,
  DecisionInfluence,
  RegisterUseCaseStatus,
  UseCaseOriginSource,
  AffectedParty,
} from './card-model';

export type GovernanceDecisionActor = 'HUMAN' | 'SYSTEM' | 'AUTOMATION';

// ── Decision Influence (replaces DecisionImpact) ─────────────────────────────

/** Map legacy DecisionImpact to DecisionInfluence */
export function mapLegacyDecisionImpact(
  impact: DecisionImpact | undefined,
): DecisionInfluence | undefined {
  if (!impact) return undefined;
  switch (impact) {
    case 'NO':
      return 'ASSISTANCE';
    case 'YES':
      return 'PREPARATION';
    case 'UNSURE':
      return 'PREPARATION';
  }
}

export interface CaptureInput {
  purpose: string;
  usageContexts: CaptureUsageContext[];
  isCurrentlyResponsible: boolean;
  responsibleParty?: string | null;
  contactPersonName?: string | null;
  /** @deprecated Use decisionInfluence instead */
  decisionImpact?: DecisionImpact;
  decisionInfluence?: DecisionInfluence;
  /** @deprecated Redundant with Wirkungsbereich (usageContexts) */
  affectedParties?: AffectedParty[];
  // v1.1 fields (optional for backward compat with v1.0 capture flows)
  toolId?: string;
  toolFreeText?: string;
  workflow?: UseCaseWorkflow;
  /** @deprecated Use dataCategories[] instead */
  dataCategory?: DataCategory;
  dataCategories?: DataCategory[];
  // v1.2 fields (Register-First: flat metadata)
  /** @deprecated Organisation comes from OrgSettings now */
  organisation?: string | null;
}

/** Read helper: get dataCategories from card (with backward compat) */
export function resolveDataCategories(card: {
  dataCategories?: DataCategory[];
  dataCategory?: DataCategory;
}): DataCategory[] {
  return normalizeDataCategories(card.dataCategories, card.dataCategory);
}

/** Read helper: get decisionInfluence from card (with backward compat) */
export function resolveDecisionInfluence(card: {
  decisionInfluence?: DecisionInfluence;
  decisionImpact?: DecisionImpact;
}): DecisionInfluence | undefined {
  return card.decisionInfluence ?? mapLegacyDecisionImpact(card.decisionImpact);
}

export type WorkflowConnectionMode =
  | 'MANUAL_SEQUENCE'
  | 'SEMI_AUTOMATED'
  | 'FULLY_AUTOMATED';

/**
 * Generic system reference used for tools, APIs, models, connectors,
 * and internal services.
 */
export interface OrderedUseCaseSystem {
  entryId: string;
  position: number;
  toolId?: string;
  toolFreeText?: string;
}

export interface UseCaseWorkflow {
  additionalSystems: OrderedUseCaseSystem[];
  connectionMode?: WorkflowConnectionMode;
  summary?: string;
}

export type UseCaseSystemProviderType =
  | 'TOOL'
  | 'API'
  | 'MODEL'
  | 'CONNECTOR'
  | 'INTERNAL'
  | 'OTHER';

export function resolvePrimaryDataCategory(card: {
  dataCategories?: DataCategory[];
  dataCategory?: DataCategory;
}): DataCategory | undefined {
  return resolveDataCategories(card)[0];
}

export interface ReviewEvent {
  reviewId: string;
  reviewedAt: string;
  reviewedBy: string;
  nextStatus: Exclude<RegisterUseCaseStatus, 'UNREVIEWED'>;
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
  type: 'NOTE' | 'DOCUMENT' | 'LINK';
  uri?: string;
}

export interface StatusChange {
  from: RegisterUseCaseStatus;
  to: RegisterUseCaseStatus;
  changedAt: string;
  changedBy: string;
  changedByName: string;
  reason?: string;
}

export interface ManualEditEvent {
  editId: string;
  editedAt: string;
  editedBy: string;
  editedByName?: string | null;
  summary: string;
  changedFields: string[];
}

export type ExternalIntakeSource = 'ACCESS_CODE' | 'SUPPLIER_REQUEST_LINK';

export type ExternalSubmissionSourceType =
  | 'supplier_request'
  | 'access_code'
  | 'manual_import';

export type ExternalSubmissionStatus =
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'merged';

export interface ExternalIntakeTrace {
  source: ExternalIntakeSource;
  submittedAt: string;
  registerId: string;
  ownerId?: string | null;
  submissionId?: string | null;
  sourceType?: ExternalSubmissionSourceType | null;
  submittedByName?: string | null;
  submittedByEmail?: string | null;
  submittedByRole?: string | null;
  requestPath?: string | null;
  requestTokenId?: string | null;
  requestCode?: string | null;
  accessCodeId?: string | null;
  accessCode?: string | null;
  accessCodeLabel?: string | null;
}

export interface SupplierRequestTokenRecord {
  tokenId: string;
  registerId: string;
  ownerId: string;
  tokenHash: string;
  createdAt: string;
  createdBy: string;
  createdByEmail?: string | null;
  expiresAt: string;
  revokedAt?: string | null;
  revokedBy?: string | null;
  revokedByEmail?: string | null;
  revocationReason?: 'manual' | 'replaced' | 'register_deleted' | null;
  lastUsedAt?: string | null;
  firstUsedAt?: string | null;
  lastUsedIpHash?: string | null;
  submissionCount?: number;
  maxSubmissions?: number | null;
}

export interface ExternalSubmission {
  submissionId: string;
  registerId: string;
  ownerId: string;
  sourceType: ExternalSubmissionSourceType;
  requestTokenId?: string | null;
  accessCodeId?: string | null;
  submittedByName?: string | null;
  submittedByEmail?: string | null;
  submittedAt: string;
  rawPayloadSnapshot: Record<string, unknown>;
  status: ExternalSubmissionStatus;
  linkedUseCaseId?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  reviewNote?: string | null;
  approvalWorkflow?: ApprovalWorkflow | null;
}

export interface UseCaseOrigin {
  source: UseCaseOriginSource;
  submittedByName?: string | null;
  submittedByEmail?: string | null;
  sourceRequestId?: string | null;
  capturedByUserId?: string | null;
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
    contactPersonName?: string | null;
  };
  /** @deprecated Use decisionInfluence instead */
  decisionImpact: DecisionImpact;
  decisionInfluence?: DecisionInfluence;
  /** @deprecated Redundant with Wirkungsbereich (usageContexts) */
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
  workflow?: UseCaseWorkflow;
  /** @deprecated Use dataCategories[] instead */
  dataCategory?: DataCategory;
  dataCategories?: DataCategory[];
  publicHashId?: string;
  isPublicVisible?: boolean;
  publicInfo?: ToolPublicInfo | null;
  systemPublicInfo?: UseCaseSystemPublicInfo[];
  // ── v1.2 fields (Register-First: flat metadata & generic tags) ────────
  organisation?: string | null;
  labels?: { key: string; value: string }[];
  standardVersion?: string;
  isDeleted?: boolean;

  // ── Officer Seal ──────────────────────────────────────────────────────────
  sealedAt?: string | null;
  sealedBy?: string | null;
  sealedByName?: string | null;
  sealHash?: string | null;

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
      maturityLevel?: 'Level 1' | 'Level 2' | 'Level 3' | null;
      oversightModel?: string | null;
      reviewFrequency?: string | null;
      riskControls?: string[];
      trainingRequired?: boolean;
      policyLinks?: string[];
      incidentProcessDefined?: boolean;
      customAssessmentText?: string | null; // Assessment note, optionally AI-assisted
      customAssessmentSource?: 'AI_DRAFT' | 'MANUAL' | null;

      // Sprint 18: Strict ISO-Micro Schema (Registers-First)
      iso?: {
        reviewCycle:
          | 'annual'
          | 'semiannual'
          | 'quarterly'
          | 'monthly'
          | 'ad_hoc'
          | 'unknown';
        oversightModel:
          | 'HITL'
          | 'HOTL'
          | 'HUMAN_REVIEW'
          | 'NO_HUMAN'
          | 'unknown';
        documentationLevel: 'minimal' | 'standard' | 'extended' | 'unknown';
        lifecycleStatus: 'pilot' | 'active' | 'retired' | 'unknown';
        lastReviewedAt?: string | null;
        nextReviewAt?: string | null;
      };

      // Sprint 18: Strict Portfolio-Micro Schema
      portfolio?: {
        valueScore: 0 | 1 | 2 | 3 | 4 | 5 | null;
        valueRationale: string | null; // max 300 chars
        riskScore: 0 | 1 | 2 | 3 | 4 | 5 | null;
        riskRationale: string | null; // max 300 chars
        strategyTag: 'pilot' | 'scale' | 'monitor' | 'stop' | null;
      };
    };
  };

  // ── Inheritance Provenance (Sprint S3) ────────────────────────────────────
  fieldProvenance?: Record<
    string,
    {
      source: 'inherit' | 'override';
      overrideReason?: string;
      approvedBy?: string;
      timestamp: string;
    }
  >;

  // ── Audit Trail (Sprint 4) ──────────────────────────────────────────────
  statusHistory?: StatusChange[];
  manualEdits?: ManualEditEvent[];
  origin?: UseCaseOrigin | null;
  /**
   * Additive provenance for assistive prefill only.
   * The canonical origin remains human-confirmed.
   */
  assistContext?: CaptureAssistContext | null;
  capturedBy?: string;
  capturedByName?: string;
  capturedViaCode?: boolean;
  accessCodeLabel?: string;
  externalIntake?: ExternalIntakeTrace | null;
}

export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type FlagStatus = 'yes' | 'no' | 'not_found';

export interface PublicInfoSource {
  title: string;
  url: string;
  type: 'trust_center' | 'privacy' | 'terms' | 'dpa' | 'scc' | 'blog' | 'other';
  accessedAt: string; // ISO Date
}

export interface ToolPublicInfo {
  lastCheckedAt: string | null; // ISO Date
  checker: 'perplexity' | 'manual' | 'web' | null;
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

export interface UseCaseSystemPublicInfo {
  systemKey: string;
  toolId?: string;
  toolFreeText?: string;
  displayName: string;
  vendor?: string | null;
  providerType?: UseCaseSystemProviderType;
  publicInfo: ToolPublicInfo;
}

export const REGISTER_FIRST_GOVERNANCE_POLICY = Object.freeze({
  automatedReviewRequired: false,
  automatedEscalation: false,
  automatedPolicyGeneration: false,
  decisionMode: 'MANUAL_ONLY' as const,
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

  reviewStandard?: 'annual' | 'semiannual' | 'risk-based' | null;

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

export type RegisterEntitlementStatus = 'active' | 'inactive';

export type RegisterEntitlementSource =
  | 'default_free'
  | 'legacy_plan_field'
  | 'customer_entitlement_sync'
  | 'stripe_checkout'
  | 'stripe_webhook'
  | 'billing_repair'
  | 'legacy_purchase_import'
  | 'manual';

export type BillingProductKey =
  | 'free_register'
  | 'governance_control_center'
  | 'enterprise_suite';

export interface RegisterEntitlement {
  plan: SubscriptionPlan;
  status: RegisterEntitlementStatus;
  source: RegisterEntitlementSource;
  updatedAt: string;
  customerEmail?: string | null;
  productId?: string | null;
  billingProductKey?: BillingProductKey | null;
  checkoutSessionId?: string | null;
  stripeCustomerId?: string | null;
  subscriptionId?: string | null;
}

export type RegisterScopeKind = 'personal' | 'workspace';

export interface RegisterScopeContext {
  kind: RegisterScopeKind;
  workspaceId?: string | null;
}

// ── Standalone Register (User-Scoped) ───────────────────────────────────────

export interface Register {
  registerId: string;
  ownerId?: string | null;
  name: string;
  createdAt: string;
  workspaceId?: string | null;
  linkedProjectId?: string | null;
  organisationName?: string | null;
  organisationUnit?: string | null;
  publicOrganisationDisclosure?: boolean;
  orgSettings?: OrgSettings | null;

  // ── Subscription & Feature Gating ─────────────────────────────────────────
  plan?: SubscriptionPlan; // 'free' (default) | 'pro' | 'enterprise'
  entitlement?: RegisterEntitlement | null;

  // ── Register-First Architecture: Org Baseline ─────────────────────────────
  governanceMaturityLevel?: 1 | 2 | 3; // Baseline Level for all enclosed Use Cases
  isDeleted?: boolean;
  deletionState?: RegisterDeletionState | null;
}

export interface RegisterDeletionState {
  strategy: 'SOFT_DELETE';
  deletedAt: string;
  deletedBy: string;
  totalUseCaseCount: number;
  activeUseCaseCount: number;
  publicUseCaseCount: number;
  totalAccessCodeCount: number;
  deactivatedAccessCodeCount: number;
  supplierRequestLinkDisabled: boolean;
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
  deactivatedReason?: 'MANUAL' | 'REGISTER_DELETED' | null;
  deactivatedAt?: string | null;
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
