/**
 * Trust Portal Aggregator – Live read-only aggregation for the public portal.
 *
 * Fetches public use cases from the `publicUseCases` Firestore collection
 * and computes live KPIs for the Trust Portal vNext.
 *
 * This module is strictly READ-ONLY. It never writes to Firestore.
 */

import type {
  PublicUseCaseIndexEntry,
  RegisterUseCaseStatus,
} from "./types";

// ── Types ────────────────────────────────────────────────────────────────────

export interface PortalKpis {
  /** Total number of public use cases */
  totalSystems: number;
  /** Use cases with status REVIEWED or PROOF_READY */
  reviewedCount: number;
  /** Percentage of reviewed+proof-ready / total */
  reviewRate: number;
  /** Use cases with PROOF_READY status */
  proofReadyCount: number;
  /** Percentage proof-ready / total */
  proofReadyRate: number;
  /** Status distribution */
  statusDistribution: Record<RegisterUseCaseStatus, number>;
  /** Data category distribution */
  dataCategoryDistribution: Record<string, number>;
  /** Whether any verified proofs exist */
  hasVerifiedProofs: boolean;
  /** Count of verified proofs */
  verifiedProofCount: number;
}

export interface PortalAggregation {
  organisationName: string | null;
  kpis: PortalKpis;
  systems: PortalSystemEntry[];
  lastUpdated: string | null;
}

export interface PortalSystemEntry {
  publicHashId: string;
  purpose: string;
  toolName: string;
  dataCategory: string;
  status: RegisterUseCaseStatus;
  isVerified: boolean;
}

// ── Firestore Reader ─────────────────────────────────────────────────────────

/**
 * Fetch all public use cases for a given owner (userId) from the
 * top-level `publicUseCases` collection.
 */
export async function fetchPublicUseCasesByOwner(
  ownerId: string
): Promise<PublicUseCaseIndexEntry[]> {
  const { getFirebaseDb } = await import("@/lib/firebase");
  const db = await getFirebaseDb();
  const { collection, query, where, getDocs } = await import(
    "firebase/firestore"
  );

  const colRef = collection(db, "publicUseCases");
  const q = query(colRef, where("ownerId", "==", ownerId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data() as PublicUseCaseIndexEntry);
}

// ── KPI Computation (Pure) ───────────────────────────────────────────────────

export function computePortalKpis(
  entries: PublicUseCaseIndexEntry[]
): PortalKpis {
  const total = entries.length;

  const statusDistribution: Record<RegisterUseCaseStatus, number> = {
    UNREVIEWED: 0,
    REVIEW_RECOMMENDED: 0,
    REVIEWED: 0,
    PROOF_READY: 0,
  };

  const dataCategoryDistribution: Record<string, number> = {};
  let verifiedProofCount = 0;

  for (const entry of entries) {
    // Status
    if (entry.status in statusDistribution) {
      statusDistribution[entry.status]++;
    }

    // Data category
    const cat = entry.dataCategory || "NONE";
    dataCategoryDistribution[cat] = (dataCategoryDistribution[cat] || 0) + 1;

    // Verified proofs
    if (entry.verification?.isReal && entry.verification?.isCurrent) {
      verifiedProofCount++;
    }
  }

  const reviewedCount =
    statusDistribution.REVIEWED + statusDistribution.PROOF_READY;
  const proofReadyCount = statusDistribution.PROOF_READY;

  return {
    totalSystems: total,
    reviewedCount,
    reviewRate: total > 0 ? reviewedCount / total : 0,
    proofReadyCount,
    proofReadyRate: total > 0 ? proofReadyCount / total : 0,
    statusDistribution,
    dataCategoryDistribution,
    hasVerifiedProofs: verifiedProofCount > 0,
    verifiedProofCount,
  };
}

// ── Full Aggregation ─────────────────────────────────────────────────────────

export function aggregatePortalData(
  entries: PublicUseCaseIndexEntry[]
): PortalAggregation {
  const kpis = computePortalKpis(entries);

  // Derive org name from entries (all should share the same)
  const orgName = entries.find((e) => e.organisationName)?.organisationName ?? null;

  // Map to display-friendly system entries
  const systems: PortalSystemEntry[] = entries.map((e) => ({
    publicHashId: e.publicHashId,
    purpose: e.purpose,
    toolName: e.toolName || "Unbenannt",
    dataCategory: e.dataCategory || "NONE",
    status: e.status,
    isVerified: !!(e.verification?.isReal && e.verification?.isCurrent),
  }));

  // Find most recent entry
  const sortedByDate = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const lastUpdated = sortedByDate[0]?.createdAt ?? null;

  return {
    organisationName: orgName,
    kpis,
    systems,
    lastUpdated,
  };
}

// ── Trust Score (Register-First) ─────────────────────────────────────────────

/**
 * Compute a live Trust Readiness Score based on actual data, not manual toggles.
 *
 * Dimensions (max 100):
 *  - Documentation (25): All systems have purpose + tool name
 *  - Review Coverage (25): % of reviewed systems
 *  - Proof Readiness (25): % of proof-ready systems
 *  - Verification (15): Verified proofs exist
 *  - Org Disclosure (10): Organisation name is publicly disclosed
 */
export function computeLiveTrustScore(
  kpis: PortalKpis,
  hasOrgDisclosure: boolean
): number {
  if (kpis.totalSystems === 0) return 0;

  let score = 0;

  // Documentation (max 25)
  score += Math.min(25, Math.round(25 * (kpis.totalSystems > 0 ? 1 : 0)));

  // Review Coverage (max 25)
  score += Math.round(25 * kpis.reviewRate);

  // Proof Readiness (max 25)
  score += Math.round(25 * kpis.proofReadyRate);

  // Verification (max 15)
  if (kpis.hasVerifiedProofs) {
    const verifiedRatio = kpis.verifiedProofCount / kpis.totalSystems;
    score += Math.round(15 * verifiedRatio);
  }

  // Org Disclosure (max 10)
  if (hasOrgDisclosure) score += 10;

  return Math.min(100, score);
}
