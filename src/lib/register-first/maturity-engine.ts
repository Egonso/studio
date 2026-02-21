/**
 * Maturity Level Engine
 *
 * Evaluates whether a Register and its Use Cases meet the requirements
 * for a given governance maturity level (1, 2, or 3).
 *
 * Level 1 – Basis-Dokumentation:
 *   All use cases captured with purpose, contexts, responsibility assigned.
 *
 * Level 2 – Erweiterte Governance:
 *   All Level 1 + all use cases reviewed, data categories assigned,
 *   tool information documented.
 *
 * Level 3 – Audit-Ready:
 *   All Level 2 + all use cases PROOF_READY, proof metadata present,
 *   public visibility configured where applicable.
 */

import type {
  Register,
  UseCaseCard,
  RegisterUseCaseStatus,
  DataCategory,
} from "./types";

// ── Types ────────────────────────────────────────────────────────────────────

export type MaturityLevel = 1 | 2 | 3;

export interface MaturityCriterion {
  /** Unique key for this criterion */
  id: string;
  /** Human-readable label */
  label: string;
  /** The level this criterion belongs to */
  level: MaturityLevel;
  /** Whether this criterion is currently satisfied */
  fulfilled: boolean;
  /** IDs of use cases that violate this criterion (empty = OK) */
  violatingUseCaseIds: string[];
  /** Human-readable gap description (only if not fulfilled) */
  gap?: string;
}

export interface MaturityResult {
  /** The target level that was evaluated */
  targetLevel: MaturityLevel;
  /** Whether the target level is fully met */
  levelMet: boolean;
  /** The highest level that IS fully met (0 if none) */
  currentLevel: 0 | 1 | 2 | 3;
  /** Overall fulfilment ratio (0..1) */
  fulfilmentRatio: number;
  /** All criteria evaluated, grouped by level */
  criteria: MaturityCriterion[];
  /** Aggregated KPIs for the dashboard */
  kpis: MaturityKpis;
  /** Action items = criteria that are not yet fulfilled */
  actionItems: MaturityCriterion[];
}

export interface MaturityKpis {
  totalUseCases: number;
  /** Non-deleted, active use cases */
  activeUseCases: number;
  /** Percentage of use cases with purpose, contexts, responsibility (core fields) */
  coreFieldCoverage: number;
  /** Count per status */
  statusDistribution: Record<RegisterUseCaseStatus, number>;
  /** Use cases with status REVIEWED or PROOF_READY */
  reviewedCount: number;
  /** % reviewed (REVIEWED + PROOF_READY) / active */
  reviewRate: number;
  /** Use cases in PROOF_READY status */
  proofReadyCount: number;
  /** % proof-ready / active */
  proofReadyRate: number;
  /** Use cases with decisionImpact YES but no review */
  highImpactWithoutReview: number;
  /** Use cases with CUSTOMER_FACING or EXTERNAL_PUBLIC context but no proof */
  externalFacingWithoutProof: number;
  /** Use cases missing tool documentation */
  missingToolInfo: number;
  /** Use cases missing data category */
  missingDataCategory: number;
}

// ── Evaluation ───────────────────────────────────────────────────────────────

function getActiveUseCases(useCases: UseCaseCard[]): UseCaseCard[] {
  return useCases.filter((uc) => !uc.isDeleted);
}

function computeKpis(useCases: UseCaseCard[]): MaturityKpis {
  const active = getActiveUseCases(useCases);
  const total = active.length;

  const statusDistribution: Record<RegisterUseCaseStatus, number> = {
    UNREVIEWED: 0,
    REVIEW_RECOMMENDED: 0,
    REVIEWED: 0,
    PROOF_READY: 0,
  };
  for (const uc of active) {
    statusDistribution[uc.status]++;
  }

  const coreComplete = active.filter(
    (uc) =>
      uc.purpose?.trim().length > 0 &&
      uc.usageContexts?.length > 0 &&
      (uc.responsibility?.isCurrentlyResponsible ||
        uc.responsibility?.responsibleParty?.trim())
  ).length;

  const reviewedCount =
    statusDistribution.REVIEWED + statusDistribution.PROOF_READY;
  const proofReadyCount = statusDistribution.PROOF_READY;

  const highImpactWithoutReview = active.filter(
    (uc) =>
      uc.decisionImpact === "YES" &&
      uc.status !== "REVIEWED" &&
      uc.status !== "PROOF_READY"
  ).length;

  const externalFacingWithoutProof = active.filter(
    (uc) =>
      (uc.usageContexts?.includes("CUSTOMER_FACING") ||
        uc.usageContexts?.includes("EXTERNAL_PUBLIC")) &&
      uc.status !== "PROOF_READY"
  ).length;

  const missingToolInfo = active.filter(
    (uc) => !uc.toolId && !uc.toolFreeText
  ).length;

  const missingDataCategory = active.filter(
    (uc) => !uc.dataCategory || uc.dataCategory === "NONE"
  ).length;

  return {
    totalUseCases: useCases.length,
    activeUseCases: total,
    coreFieldCoverage: total > 0 ? coreComplete / total : 0,
    statusDistribution,
    reviewedCount,
    reviewRate: total > 0 ? reviewedCount / total : 0,
    proofReadyCount,
    proofReadyRate: total > 0 ? proofReadyCount / total : 0,
    highImpactWithoutReview,
    externalFacingWithoutProof,
    missingToolInfo,
    missingDataCategory,
  };
}

// ── Level 1 Criteria ─────────────────────────────────────────────────────────

function evaluateLevel1(
  active: UseCaseCard[]
): MaturityCriterion[] {
  const criteria: MaturityCriterion[] = [];

  // 1.1: At least one use case captured
  criteria.push({
    id: "L1_HAS_USE_CASES",
    label: "Mindestens ein Use Case erfasst",
    level: 1,
    fulfilled: active.length > 0,
    violatingUseCaseIds: [],
    gap: active.length === 0
      ? "Noch kein Use Case im Register erfasst."
      : undefined,
  });

  // 1.2: All use cases have purpose filled
  const missingPurpose = active.filter((uc) => !uc.purpose?.trim());
  criteria.push({
    id: "L1_PURPOSE_COMPLETE",
    label: "Alle Use Cases haben einen definierten Zweck",
    level: 1,
    fulfilled: missingPurpose.length === 0 && active.length > 0,
    violatingUseCaseIds: missingPurpose.map((uc) => uc.useCaseId),
    gap: missingPurpose.length > 0
      ? `${missingPurpose.length} Use Case(s) ohne definierten Zweck.`
      : undefined,
  });

  // 1.3: All use cases have usage contexts
  const missingContexts = active.filter(
    (uc) => !uc.usageContexts || uc.usageContexts.length === 0
  );
  criteria.push({
    id: "L1_CONTEXTS_COMPLETE",
    label: "Alle Use Cases haben Nutzungskontexte",
    level: 1,
    fulfilled: missingContexts.length === 0 && active.length > 0,
    violatingUseCaseIds: missingContexts.map((uc) => uc.useCaseId),
    gap: missingContexts.length > 0
      ? `${missingContexts.length} Use Case(s) ohne Nutzungskontext.`
      : undefined,
  });

  // 1.4: All use cases have responsibility assigned
  const missingResponsibility = active.filter(
    (uc) =>
      !uc.responsibility?.isCurrentlyResponsible &&
      !uc.responsibility?.responsibleParty?.trim()
  );
  criteria.push({
    id: "L1_RESPONSIBILITY_ASSIGNED",
    label: "Alle Use Cases haben eine zugewiesene Verantwortlichkeit",
    level: 1,
    fulfilled: missingResponsibility.length === 0 && active.length > 0,
    violatingUseCaseIds: missingResponsibility.map((uc) => uc.useCaseId),
    gap: missingResponsibility.length > 0
      ? `${missingResponsibility.length} Use Case(s) ohne zugewiesene Verantwortlichkeit.`
      : undefined,
  });

  return criteria;
}

// ── Level 2 Criteria ─────────────────────────────────────────────────────────

function evaluateLevel2(
  active: UseCaseCard[]
): MaturityCriterion[] {
  const criteria: MaturityCriterion[] = [];

  // 2.1: All use cases reviewed (status >= REVIEWED)
  const unreviewed = active.filter(
    (uc) => uc.status === "UNREVIEWED" || uc.status === "REVIEW_RECOMMENDED"
  );
  criteria.push({
    id: "L2_ALL_REVIEWED",
    label: "Alle Use Cases wurden geprüft (min. REVIEWED)",
    level: 2,
    fulfilled: unreviewed.length === 0 && active.length > 0,
    violatingUseCaseIds: unreviewed.map((uc) => uc.useCaseId),
    gap: unreviewed.length > 0
      ? `${unreviewed.length} Use Case(s) noch nicht geprüft.`
      : undefined,
  });

  // 2.2: All use cases have tool info
  const missingTool = active.filter(
    (uc) => !uc.toolId && !uc.toolFreeText
  );
  criteria.push({
    id: "L2_TOOL_DOCUMENTED",
    label: "Alle Use Cases haben Tool-Informationen",
    level: 2,
    fulfilled: missingTool.length === 0 && active.length > 0,
    violatingUseCaseIds: missingTool.map((uc) => uc.useCaseId),
    gap: missingTool.length > 0
      ? `${missingTool.length} Use Case(s) ohne Tool-Dokumentation.`
      : undefined,
  });

  // 2.3: All use cases have data category
  const missingCategory = active.filter(
    (uc) => !uc.dataCategory || uc.dataCategory === "NONE"
  );
  criteria.push({
    id: "L2_DATA_CATEGORY",
    label: "Alle Use Cases haben eine Datenkategorie",
    level: 2,
    fulfilled: missingCategory.length === 0 && active.length > 0,
    violatingUseCaseIds: missingCategory.map((uc) => uc.useCaseId),
    gap: missingCategory.length > 0
      ? `${missingCategory.length} Use Case(s) ohne Datenkategorie.`
      : undefined,
  });

  // 2.4: High-impact use cases must be reviewed
  const highImpactUnreviewed = active.filter(
    (uc) =>
      uc.decisionImpact === "YES" &&
      uc.status !== "REVIEWED" &&
      uc.status !== "PROOF_READY"
  );
  criteria.push({
    id: "L2_HIGH_IMPACT_REVIEWED",
    label: "Hochrisiko-Systeme (Decision Impact) sind geprüft",
    level: 2,
    fulfilled: highImpactUnreviewed.length === 0,
    violatingUseCaseIds: highImpactUnreviewed.map((uc) => uc.useCaseId),
    gap: highImpactUnreviewed.length > 0
      ? `${highImpactUnreviewed.length} Hochrisiko-System(e) ohne abgeschlossene Prüfung.`
      : undefined,
  });

  return criteria;
}

// ── Level 3 Criteria ─────────────────────────────────────────────────────────

function evaluateLevel3(
  active: UseCaseCard[]
): MaturityCriterion[] {
  const criteria: MaturityCriterion[] = [];

  // 3.1: All use cases are PROOF_READY
  const notProofReady = active.filter((uc) => uc.status !== "PROOF_READY");
  criteria.push({
    id: "L3_ALL_PROOF_READY",
    label: "Alle Use Cases sind nachweisfähig (PROOF_READY)",
    level: 3,
    fulfilled: notProofReady.length === 0 && active.length > 0,
    violatingUseCaseIds: notProofReady.map((uc) => uc.useCaseId),
    gap: notProofReady.length > 0
      ? `${notProofReady.length} Use Case(s) noch nicht nachweisfähig.`
      : undefined,
  });

  // 3.2: All PROOF_READY use cases have proof metadata
  const proofReadyWithoutMeta = active.filter(
    (uc) => uc.status === "PROOF_READY" && !uc.proof
  );
  criteria.push({
    id: "L3_PROOF_META_PRESENT",
    label: "Alle nachweisfähigen Use Cases haben Proof-Metadaten",
    level: 3,
    fulfilled: proofReadyWithoutMeta.length === 0 && active.length > 0,
    violatingUseCaseIds: proofReadyWithoutMeta.map((uc) => uc.useCaseId),
    gap: proofReadyWithoutMeta.length > 0
      ? `${proofReadyWithoutMeta.length} nachweisfähige(r) Use Case(s) ohne Proof-Metadaten.`
      : undefined,
  });

  // 3.3: External-facing use cases must have proof
  const externalWithoutProof = active.filter(
    (uc) =>
      (uc.usageContexts?.includes("CUSTOMER_FACING") ||
        uc.usageContexts?.includes("EXTERNAL_PUBLIC")) &&
      uc.status !== "PROOF_READY"
  );
  criteria.push({
    id: "L3_EXTERNAL_PROOF",
    label: "Extern sichtbare Systeme sind nachweisfähig",
    level: 3,
    fulfilled: externalWithoutProof.length === 0,
    violatingUseCaseIds: externalWithoutProof.map((uc) => uc.useCaseId),
    gap: externalWithoutProof.length > 0
      ? `${externalWithoutProof.length} extern sichtbare(s) System(e) ohne Nachweis.`
      : undefined,
  });

  // 3.4: All v1.1 use cases have public visibility configured
  const v11WithoutVisibility = active.filter(
    (uc) =>
      uc.cardVersion === "1.1" && uc.isPublicVisible === undefined
  );
  criteria.push({
    id: "L3_VISIBILITY_CONFIGURED",
    label: "Öffentliche Sichtbarkeit für alle v1.1-Karten konfiguriert",
    level: 3,
    fulfilled: v11WithoutVisibility.length === 0,
    violatingUseCaseIds: v11WithoutVisibility.map((uc) => uc.useCaseId),
    gap: v11WithoutVisibility.length > 0
      ? `${v11WithoutVisibility.length} Use Case(s) ohne Sichtbarkeits-Konfiguration.`
      : undefined,
  });

  return criteria;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Evaluate a Register + its Use Cases against a target maturity level.
 *
 * @param register - The Register metadata (currently used for future extensions)
 * @param useCases - All use cases belonging to this register
 * @param targetLevel - The desired maturity level (1, 2, or 3)
 */
export function evaluateMaturityCompliance(
  _register: Register | null,
  useCases: UseCaseCard[],
  targetLevel: MaturityLevel = 2
): MaturityResult {
  const active = getActiveUseCases(useCases);
  const kpis = computeKpis(useCases);

  // Always evaluate all levels up to targetLevel
  const allCriteria: MaturityCriterion[] = [];

  const l1 = evaluateLevel1(active);
  allCriteria.push(...l1);

  if (targetLevel >= 2) {
    allCriteria.push(...evaluateLevel2(active));
  }
  if (targetLevel >= 3) {
    allCriteria.push(...evaluateLevel3(active));
  }

  const fulfilled = allCriteria.filter((c) => c.fulfilled).length;
  const fulfilmentRatio =
    allCriteria.length > 0 ? fulfilled / allCriteria.length : 0;
  const levelMet = allCriteria.every((c) => c.fulfilled);

  // Determine current level: the highest level where ALL criteria are met
  const l1Met = l1.every((c) => c.fulfilled);
  const l2Met =
    l1Met && (targetLevel >= 2 ? evaluateLevel2(active).every((c) => c.fulfilled) : true);
  const l3Met =
    l2Met && (targetLevel >= 3 ? evaluateLevel3(active).every((c) => c.fulfilled) : true);

  let currentLevel: 0 | 1 | 2 | 3 = 0;
  if (l3Met && targetLevel >= 3) currentLevel = 3;
  else if (l2Met && targetLevel >= 2) currentLevel = 2;
  else if (l1Met) currentLevel = 1;

  const actionItems = allCriteria.filter((c) => !c.fulfilled);

  return {
    targetLevel,
    levelMet,
    currentLevel,
    fulfilmentRatio,
    criteria: allCriteria,
    kpis,
    actionItems,
  };
}

/**
 * Convenience: evaluate all three levels and return the highest met.
 */
export function determineCurrentMaturityLevel(
  register: Register | null,
  useCases: UseCaseCard[]
): 0 | 1 | 2 | 3 {
  return evaluateMaturityCompliance(register, useCases, 3).currentLevel;
}
