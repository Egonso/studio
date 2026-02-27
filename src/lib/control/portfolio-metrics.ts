import { buildUseCaseFocusLink } from "@/lib/control/deep-link";
import type { RegisterUseCaseStatus, UseCaseCard } from "@/lib/register-first/types";

export type PortfolioRiskBucketKey =
  | "PROHIBITED"
  | "HIGH"
  | "LIMITED"
  | "MINIMAL"
  | "UNASSESSED";

interface PortfolioRiskBucketInternal {
  key: PortfolioRiskBucketKey;
  label: string;
  count: number;
  useCaseIds: string[];
  byStatus: Record<RegisterUseCaseStatus, number>;
}

interface PortfolioGroupInternal {
  label: string;
  useCaseIds: string[];
  totalSystems: number;
  highRiskSystems: number;
  reviewedSystems: number;
  overdueReviews: number;
}

interface ConcentrationGroupInternal {
  label: string;
  useCaseIds: string[];
  count: number;
}

export interface PortfolioRiskDistributionItem {
  key: PortfolioRiskBucketKey;
  label: string;
  count: number;
  sharePercent: number;
  drilldownUseCaseId: string | null;
  drilldownLink: string | null;
}

export interface PortfolioRiskMatrixRow {
  key: PortfolioRiskBucketKey;
  label: string;
  total: number;
  byStatus: Record<RegisterUseCaseStatus, number>;
  drilldownUseCaseId: string | null;
  drilldownLink: string | null;
}

export interface PortfolioDepartmentMetric {
  department: string;
  totalSystems: number;
  highRiskSystems: number;
  reviewedPercent: number;
  overdueReviews: number;
  drilldownUseCaseId: string | null;
  drilldownLink: string | null;
}

export interface PortfolioOwnerMetric {
  owner: string;
  totalSystems: number;
  highRiskSystems: number;
  reviewedPercent: number;
  overdueReviews: number;
  drilldownUseCaseId: string | null;
  drilldownLink: string | null;
}

export interface PortfolioStatusMetric {
  status: RegisterUseCaseStatus;
  label: string;
  count: number;
  sharePercent: number;
  drilldownUseCaseId: string | null;
  drilldownLink: string | null;
}

export interface RiskConcentrationGroup {
  group: string;
  count: number;
  sharePercent: number;
  drilldownUseCaseId: string | null;
  drilldownLink: string | null;
}

export interface RiskConcentrationIndex {
  score: number;
  assessedSystems: number;
  groupCount: number;
  concentrationBand: "DIFFUSE" | "BALANCED" | "CLUSTERED";
  methodology: string;
  topConcentrations: RiskConcentrationGroup[];
}

export interface PortfolioMetrics {
  totalSystems: number;
  riskDistribution: PortfolioRiskDistributionItem[];
  riskStatusMatrix: PortfolioRiskMatrixRow[];
  departmentAnalysis: PortfolioDepartmentMetric[];
  ownerPerformance: PortfolioOwnerMetric[];
  statusDistribution: PortfolioStatusMetric[];
  riskConcentrationIndex: RiskConcentrationIndex;
}

const STATUS_ORDER: RegisterUseCaseStatus[] = [
  "UNREVIEWED",
  "REVIEW_RECOMMENDED",
  "REVIEWED",
  "PROOF_READY",
];

const STATUS_LABELS: Record<RegisterUseCaseStatus, string> = {
  UNREVIEWED: "Formale Pruefung ausstehend",
  REVIEW_RECOMMENDED: "Pruefung empfohlen",
  REVIEWED: "Pruefung abgeschlossen",
  PROOF_READY: "Nachweisfaehig",
};

const RISK_BUCKETS: Array<{ key: PortfolioRiskBucketKey; label: string }> = [
  { key: "PROHIBITED", label: "Verboten" },
  { key: "HIGH", label: "Hochrisiko" },
  { key: "LIMITED", label: "Transparenzpflichten" },
  { key: "MINIMAL", label: "Minimales Risiko" },
  { key: "UNASSESSED", label: "Nicht eingestuft" },
];

function parseTimestamp(value: string): number {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return 0;
  return timestamp;
}

function sortUseCaseIdsByAge(ids: string[], useCaseById: Map<string, UseCaseCard>): string[] {
  return [...ids].sort((left, right) => {
    const leftTs = parseTimestamp(useCaseById.get(left)?.updatedAt ?? "");
    const rightTs = parseTimestamp(useCaseById.get(right)?.updatedAt ?? "");
    if (leftTs !== rightTs) return leftTs - rightTs;
    return left.localeCompare(right);
  });
}

function firstIdByAge(ids: string[], useCaseById: Map<string, UseCaseCard>): string | null {
  if (ids.length === 0) return null;
  return sortUseCaseIdsByAge(ids, useCaseById)[0] ?? null;
}

function share(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function normalizeDepartment(useCase: UseCaseCard): string {
  const value = useCase.organisation?.trim();
  if (!value) return "Nicht angegeben";
  return value;
}

function normalizeOwner(useCase: UseCaseCard): string {
  if (useCase.responsibility.isCurrentlyResponsible) {
    return "Erfasser:in (selbst)";
  }
  const value = useCase.responsibility.responsibleParty?.trim();
  if (!value) return "Nicht zugewiesen";
  return value;
}

function isReviewComplete(status: RegisterUseCaseStatus): boolean {
  return status === "REVIEWED" || status === "PROOF_READY";
}

function isReviewOverdue(useCase: UseCaseCard, now: Date): boolean {
  const nextReviewAt = useCase.governanceAssessment?.flex?.iso?.nextReviewAt;
  if (!nextReviewAt) return false;
  const nextReviewTimestamp = Date.parse(nextReviewAt);
  if (Number.isNaN(nextReviewTimestamp)) return false;
  return nextReviewTimestamp < now.getTime();
}

function riskBucketForUseCase(useCase: UseCaseCard): PortfolioRiskBucketKey {
  const category = useCase.governanceAssessment?.core?.aiActCategory?.toLowerCase() ?? "";
  if (category.includes("verbot")) return "PROHIBITED";
  if (category.includes("hochrisiko") || category.includes("high risk")) return "HIGH";
  if (category.includes("transparenz") || category.includes("limited")) return "LIMITED";
  if (category.includes("minimal")) return "MINIMAL";
  return "UNASSESSED";
}

function isConcentrationRisk(bucket: PortfolioRiskBucketKey): boolean {
  return bucket === "HIGH" || bucket === "PROHIBITED";
}

function bandForScore(score: number): "DIFFUSE" | "BALANCED" | "CLUSTERED" {
  if (score >= 67) return "CLUSTERED";
  if (score >= 34) return "BALANCED";
  return "DIFFUSE";
}

function createRiskBucketMap(): Map<PortfolioRiskBucketKey, PortfolioRiskBucketInternal> {
  const map = new Map<PortfolioRiskBucketKey, PortfolioRiskBucketInternal>();
  for (const bucket of RISK_BUCKETS) {
    map.set(bucket.key, {
      key: bucket.key,
      label: bucket.label,
      count: 0,
      useCaseIds: [],
      byStatus: {
        UNREVIEWED: 0,
        REVIEW_RECOMMENDED: 0,
        REVIEWED: 0,
        PROOF_READY: 0,
      },
    });
  }
  return map;
}

function asGroupArray<T extends PortfolioGroupInternal>(
  map: Map<string, T>,
  useCaseById: Map<string, UseCaseCard>,
  focus: "owner" | "oversight"
): Array<
  T & {
    reviewedPercent: number;
    drilldownUseCaseId: string | null;
    drilldownLink: string | null;
  }
> {
  return [...map.values()]
    .map((group) => {
      const firstUseCaseId = firstIdByAge(group.useCaseIds, useCaseById);
      return {
        ...group,
        reviewedPercent: share(group.reviewedSystems, group.totalSystems),
        drilldownUseCaseId: firstUseCaseId,
        drilldownLink: firstUseCaseId ? buildUseCaseFocusLink(firstUseCaseId, focus) : null,
      };
    })
    .sort((left, right) => {
      if (left.totalSystems !== right.totalSystems) {
        return right.totalSystems - left.totalSystems;
      }
      return left.label.localeCompare(right.label);
    });
}

function computeRiskConcentration(
  concentrationGroups: Map<string, ConcentrationGroupInternal>,
  totalCriticalSystems: number,
  useCaseById: Map<string, UseCaseCard>
): RiskConcentrationIndex {
  const groups = [...concentrationGroups.values()].filter((group) => group.count > 0);
  const groupCount = groups.length;

  if (totalCriticalSystems === 0 || groupCount === 0) {
    return {
      score: 0,
      assessedSystems: 0,
      groupCount: 0,
      concentrationBand: "DIFFUSE",
      methodology:
        "HHI-normalisiert auf Hochrisiko/Verboten-Segmente nach Fachbereich.",
      topConcentrations: [],
    };
  }

  const hhi = groups.reduce((sum, group) => {
    const ratio = group.count / totalCriticalSystems;
    return sum + ratio * ratio;
  }, 0);

  let score = 100;
  if (groupCount > 1) {
    const minHhi = 1 / groupCount;
    const normalized = (hhi - minHhi) / (1 - minHhi);
    score = Math.round(Math.max(0, Math.min(1, normalized)) * 100);
  }

  const topConcentrations = groups
    .map((group) => {
      const firstUseCaseId = firstIdByAge(group.useCaseIds, useCaseById);
      return {
        group: group.label,
        count: group.count,
        sharePercent: share(group.count, totalCriticalSystems),
        drilldownUseCaseId: firstUseCaseId,
        drilldownLink: firstUseCaseId
          ? buildUseCaseFocusLink(firstUseCaseId, "oversight")
          : null,
      };
    })
    .sort((left, right) => {
      if (left.count !== right.count) return right.count - left.count;
      return left.group.localeCompare(right.group);
    })
    .slice(0, 5);

  return {
    score,
    assessedSystems: totalCriticalSystems,
    groupCount,
    concentrationBand: bandForScore(score),
    methodology:
      "HHI-normalisiert auf Hochrisiko/Verboten-Segmente nach Fachbereich.",
    topConcentrations,
  };
}

export function buildPortfolioMetrics(
  useCases: UseCaseCard[],
  now: Date = new Date()
): PortfolioMetrics {
  const totalSystems = useCases.length;
  const useCaseById = new Map(useCases.map((useCase) => [useCase.useCaseId, useCase]));

  const riskBuckets = createRiskBucketMap();
  const departmentMap = new Map<string, PortfolioGroupInternal>();
  const ownerMap = new Map<string, PortfolioGroupInternal>();
  const concentrationMap = new Map<string, ConcentrationGroupInternal>();
  const statusMap = new Map<
    RegisterUseCaseStatus,
    { status: RegisterUseCaseStatus; count: number; useCaseIds: string[] }
  >();

  for (const status of STATUS_ORDER) {
    statusMap.set(status, { status, count: 0, useCaseIds: [] });
  }

  let totalCriticalSystems = 0;

  for (const useCase of useCases) {
    const bucketKey = riskBucketForUseCase(useCase);
    const status = useCase.status;
    const department = normalizeDepartment(useCase);
    const owner = normalizeOwner(useCase);
    const reviewed = isReviewComplete(status);
    const overdue = isReviewOverdue(useCase, now);
    const critical = isConcentrationRisk(bucketKey);

    const bucket = riskBuckets.get(bucketKey);
    if (bucket) {
      bucket.count += 1;
      bucket.useCaseIds.push(useCase.useCaseId);
      bucket.byStatus[status] += 1;
    }

    const statusEntry = statusMap.get(status);
    if (statusEntry) {
      statusEntry.count += 1;
      statusEntry.useCaseIds.push(useCase.useCaseId);
    }

    const departmentEntry = departmentMap.get(department) ?? {
      label: department,
      useCaseIds: [],
      totalSystems: 0,
      highRiskSystems: 0,
      reviewedSystems: 0,
      overdueReviews: 0,
    };
    departmentEntry.totalSystems += 1;
    if (critical) departmentEntry.highRiskSystems += 1;
    if (reviewed) departmentEntry.reviewedSystems += 1;
    if (overdue) departmentEntry.overdueReviews += 1;
    departmentEntry.useCaseIds.push(useCase.useCaseId);
    departmentMap.set(department, departmentEntry);

    const ownerEntry = ownerMap.get(owner) ?? {
      label: owner,
      useCaseIds: [],
      totalSystems: 0,
      highRiskSystems: 0,
      reviewedSystems: 0,
      overdueReviews: 0,
    };
    ownerEntry.totalSystems += 1;
    if (critical) ownerEntry.highRiskSystems += 1;
    if (reviewed) ownerEntry.reviewedSystems += 1;
    if (overdue) ownerEntry.overdueReviews += 1;
    ownerEntry.useCaseIds.push(useCase.useCaseId);
    ownerMap.set(owner, ownerEntry);

    if (critical) {
      totalCriticalSystems += 1;
      const concentrationEntry = concentrationMap.get(department) ?? {
        label: department,
        useCaseIds: [],
        count: 0,
      };
      concentrationEntry.count += 1;
      concentrationEntry.useCaseIds.push(useCase.useCaseId);
      concentrationMap.set(department, concentrationEntry);
    }
  }

  const riskDistribution = RISK_BUCKETS.map((bucketMeta) => {
    const bucket = riskBuckets.get(bucketMeta.key)!;
    const firstUseCaseId = firstIdByAge(bucket.useCaseIds, useCaseById);
    return {
      key: bucket.key,
      label: bucket.label,
      count: bucket.count,
      sharePercent: share(bucket.count, totalSystems),
      drilldownUseCaseId: firstUseCaseId,
      drilldownLink: firstUseCaseId
        ? buildUseCaseFocusLink(firstUseCaseId, "oversight")
        : null,
    };
  });

  const riskStatusMatrix = RISK_BUCKETS.map((bucketMeta) => {
    const bucket = riskBuckets.get(bucketMeta.key)!;
    const firstUseCaseId = firstIdByAge(bucket.useCaseIds, useCaseById);
    return {
      key: bucket.key,
      label: bucket.label,
      total: bucket.count,
      byStatus: bucket.byStatus,
      drilldownUseCaseId: firstUseCaseId,
      drilldownLink: firstUseCaseId
        ? buildUseCaseFocusLink(firstUseCaseId, "oversight")
        : null,
    };
  });

  const departmentAnalysis = asGroupArray(departmentMap, useCaseById, "oversight").map(
    (entry) => ({
      department: entry.label,
      totalSystems: entry.totalSystems,
      highRiskSystems: entry.highRiskSystems,
      reviewedPercent: entry.reviewedPercent,
      overdueReviews: entry.overdueReviews,
      drilldownUseCaseId: entry.drilldownUseCaseId,
      drilldownLink: entry.drilldownLink,
    })
  );

  const ownerPerformance = asGroupArray(ownerMap, useCaseById, "owner").map((entry) => ({
    owner: entry.label,
    totalSystems: entry.totalSystems,
    highRiskSystems: entry.highRiskSystems,
    reviewedPercent: entry.reviewedPercent,
    overdueReviews: entry.overdueReviews,
    drilldownUseCaseId: entry.drilldownUseCaseId,
    drilldownLink: entry.drilldownLink,
  }));

  const statusDistribution = STATUS_ORDER.map((status) => {
    const statusEntry = statusMap.get(status)!;
    const firstUseCaseId = firstIdByAge(statusEntry.useCaseIds, useCaseById);
    return {
      status,
      label: STATUS_LABELS[status],
      count: statusEntry.count,
      sharePercent: share(statusEntry.count, totalSystems),
      drilldownUseCaseId: firstUseCaseId,
      drilldownLink: firstUseCaseId
        ? buildUseCaseFocusLink(firstUseCaseId, "review")
        : null,
    };
  });

  const riskConcentrationIndex = computeRiskConcentration(
    concentrationMap,
    totalCriticalSystems,
    useCaseById
  );

  return {
    totalSystems,
    riskDistribution,
    riskStatusMatrix,
    departmentAnalysis,
    ownerPerformance,
    statusDistribution,
    riskConcentrationIndex,
  };
}

