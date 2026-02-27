import { calculateReviewDeadline } from "@/lib/compliance-engine/reminders/review-deadline";
import { buildUseCaseFocusLink } from "@/lib/control/deep-link";
import { calculateControlOverview } from "@/lib/control/maturity-calculator";
import { registerUseCaseStatusLabels } from "@/lib/register-first/status-flow";
import type {
  OrgSettings,
  RegisterUseCaseStatus,
  UseCaseCard,
} from "@/lib/register-first/types";

export interface AuditIsoLifecycleSummary {
  totalSystems: number;
  active: number;
  pilot: number;
  retired: number;
  unknown: number;
  withReviewCycle: number;
  withOversightModel: number;
  withDocumentationLevel: number;
  overdueReviews: number;
  dueSoonReviews: number;
  noDeadlineSystems: number;
}

export interface AuditIsoClauseProgress {
  clause: "4" | "5" | "6" | "8" | "9" | "10";
  title: string;
  documented: boolean;
  coveragePercent: number;
  evidence: string;
}

export interface AuditGapItem {
  id: string;
  title: string;
  impact: string;
  recommendedAction: string;
  affectedSystems: number;
  coveragePercent: number;
  deepLink: string | null;
}

export interface ImmutableHistoryEntry {
  eventId: string;
  immutableReference: string;
  source: "reviews" | "statusHistory";
  eventType: "REVIEW" | "STATUS_CHANGE";
  timestamp: string;
  actor: string;
  useCaseId: string;
  useCasePurpose: string;
  details: string;
  deepLink: string;
}

export interface OrgAuditLayerSnapshot {
  generatedAt: string;
  governanceScore: number;
  isoReadinessPercent: number;
  maturityLevel: 1 | 2 | 3 | 4 | 5;
  statusDistribution: Record<RegisterUseCaseStatus, number>;
  lifecycle: AuditIsoLifecycleSummary;
  isoClauseProgress: AuditIsoClauseProgress[];
  gapAnalysis: AuditGapItem[];
  immutableReviewHistory: ImmutableHistoryEntry[];
}

function percentage(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function hasOwner(useCase: UseCaseCard): boolean {
  if (useCase.responsibility.isCurrentlyResponsible) return true;
  return Boolean(useCase.responsibility.responsibleParty?.trim());
}

function hasReviewStructure(useCase: UseCaseCard): boolean {
  const isoCycle = useCase.governanceAssessment?.flex?.iso?.reviewCycle;
  return Boolean(isoCycle && isoCycle !== "unknown");
}

function hasOversightModel(useCase: UseCaseCard): boolean {
  const model = useCase.governanceAssessment?.flex?.iso?.oversightModel;
  return Boolean(model && model !== "unknown");
}

function hasPolicyMapping(useCase: UseCaseCard): boolean {
  const links = useCase.governanceAssessment?.flex?.policyLinks ?? [];
  return links.some((entry) => entry.trim().length > 0);
}

function hasAuditHistory(useCase: UseCaseCard): boolean {
  const reviewCount = useCase.reviews.length;
  const statusHistoryCount = useCase.statusHistory?.length ?? 0;
  const hasProof = Boolean(useCase.proof?.verification);
  return reviewCount > 0 || statusHistoryCount > 0 || hasProof;
}

function hasDocumentationLevel(useCase: UseCaseCard): boolean {
  const level = useCase.governanceAssessment?.flex?.iso?.documentationLevel;
  return Boolean(level && level !== "unknown");
}

function isHighRisk(useCase: UseCaseCard): boolean {
  const category = useCase.governanceAssessment?.core?.aiActCategory?.toLowerCase() ?? "";
  return category.includes("hochrisiko") || category.includes("high risk");
}

function pickDeepLink(
  useCases: UseCaseCard[],
  predicate: (useCase: UseCaseCard) => boolean,
  focus: "owner" | "review" | "oversight" | "policy" | "audit"
): string | null {
  const match = useCases.find(predicate);
  if (!match) return null;
  return buildUseCaseFocusLink(match.useCaseId, focus);
}

function fnv1aHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function createImmutableReference(payload: string): string {
  return `IMM-${fnv1aHash(payload).toUpperCase()}`;
}

function buildImmutableHistoryEntries(useCases: UseCaseCard[]): ImmutableHistoryEntry[] {
  const entries: ImmutableHistoryEntry[] = [];

  for (const useCase of useCases) {
    for (const review of useCase.reviews) {
      const payload = [
        useCase.useCaseId,
        "review",
        review.reviewId,
        review.reviewedAt,
        review.reviewedBy,
        review.nextStatus,
        review.notes ?? "",
      ].join("|");

      entries.push({
        eventId: `${useCase.useCaseId}:review:${review.reviewId}`,
        immutableReference: createImmutableReference(payload),
        source: "reviews",
        eventType: "REVIEW",
        timestamp: review.reviewedAt,
        actor: review.reviewedBy,
        useCaseId: useCase.useCaseId,
        useCasePurpose: useCase.purpose,
        details: `Status dokumentiert: ${
          registerUseCaseStatusLabels[review.nextStatus] ?? review.nextStatus
        }${review.notes ? ` (${review.notes})` : ""}`,
        deepLink: buildUseCaseFocusLink(useCase.useCaseId, "audit"),
      });
    }

    for (const [index, change] of (useCase.statusHistory ?? []).entries()) {
      const payload = [
        useCase.useCaseId,
        "status",
        change.from,
        change.to,
        change.changedAt,
        change.changedBy,
        change.changedByName,
        change.reason ?? "",
      ].join("|");

      const fromLabel = registerUseCaseStatusLabels[change.from] ?? change.from;
      const toLabel = registerUseCaseStatusLabels[change.to] ?? change.to;

      entries.push({
        eventId: `${useCase.useCaseId}:status:${index}`,
        immutableReference: createImmutableReference(payload),
        source: "statusHistory",
        eventType: "STATUS_CHANGE",
        timestamp: change.changedAt,
        actor: change.changedByName || change.changedBy,
        useCaseId: useCase.useCaseId,
        useCasePurpose: useCase.purpose,
        details: `Statuswechsel: ${fromLabel} -> ${toLabel}${
          change.reason ? ` (${change.reason})` : ""
        }`,
        deepLink: buildUseCaseFocusLink(useCase.useCaseId, "audit"),
      });
    }
  }

  return entries.sort((left, right) => {
    const leftTs = Date.parse(left.timestamp);
    const rightTs = Date.parse(right.timestamp);
    if (!Number.isNaN(rightTs - leftTs)) {
      return rightTs - leftTs;
    }
    return right.timestamp.localeCompare(left.timestamp);
  });
}

function buildGapAnalysis(
  useCases: UseCaseCard[],
  orgSettings: OrgSettings | null | undefined,
  now: Date
): AuditGapItem[] {
  const overview = calculateControlOverview(useCases, orgSettings, now);
  const dataBasis = overview.maturity.dataBasis;
  const totalSystems = Math.max(dataBasis.totalSystems, 0);
  const items: AuditGapItem[] = [];

  const ownerCoverage = percentage(dataBasis.systemsWithOwner, totalSystems);
  if (dataBasis.systemsWithOwner < totalSystems) {
    items.push({
      id: "owner-coverage",
      title: "Verantwortlichkeiten nachziehen",
      impact: "Systeme ohne Owner erschweren die Nachweisfuehrung im Audit.",
      recommendedAction: "Owner fuer offene Einsatzfaelle dokumentieren.",
      affectedSystems: totalSystems - dataBasis.systemsWithOwner,
      coveragePercent: ownerCoverage,
      deepLink: pickDeepLink(useCases, (useCase) => !hasOwner(useCase), "owner"),
    });
  }

  const reviewCoverage = percentage(dataBasis.systemsWithReviewStructure, totalSystems);
  if (dataBasis.systemsWithReviewStructure < totalSystems) {
    items.push({
      id: "review-coverage",
      title: "Review-Zyklen strukturieren",
      impact: "Ohne Review-Zyklus fehlt ein formaler Lifecycle-Nachweis.",
      recommendedAction: "Review-Frequenz und naechsten Review-Termin erfassen.",
      affectedSystems: totalSystems - dataBasis.systemsWithReviewStructure,
      coveragePercent: reviewCoverage,
      deepLink: pickDeepLink(
        useCases,
        (useCase) => !hasReviewStructure(useCase),
        "review"
      ),
    });
  }

  const highRiskCoverage = percentage(
    dataBasis.highRiskWithOversight,
    dataBasis.highRiskSystems
  );
  if (dataBasis.highRiskSystems > dataBasis.highRiskWithOversight) {
    items.push({
      id: "high-risk-oversight",
      title: "Aufsichtsmodell fuer Hochrisiko faelle vervollstaendigen",
      impact: "Hochrisiko-Einsatzfaelle ohne Aufsicht erzeugen Audit-Luecken.",
      recommendedAction: "Aufsichtsmodell pro Hochrisiko-Einsatzfall festlegen.",
      affectedSystems: dataBasis.highRiskSystems - dataBasis.highRiskWithOversight,
      coveragePercent: highRiskCoverage,
      deepLink: pickDeepLink(
        useCases,
        (useCase) => isHighRisk(useCase) && !hasOversightModel(useCase),
        "oversight"
      ),
    });
  }

  const policyCoverage = percentage(dataBasis.systemsWithPolicyMapping, totalSystems);
  if (dataBasis.systemsWithPolicyMapping < totalSystems) {
    items.push({
      id: "policy-coverage",
      title: "Policy-Zuordnung erweitern",
      impact: "Ohne Policy-Mapping sind organisationsweite Nachweise unvollstaendig.",
      recommendedAction: "Policy-Links in der Governance-Bewertung pflegen.",
      affectedSystems: totalSystems - dataBasis.systemsWithPolicyMapping,
      coveragePercent: policyCoverage,
      deepLink: pickDeepLink(
        useCases,
        (useCase) => !hasPolicyMapping(useCase),
        "policy"
      ),
    });
  }

  const auditCoverage = percentage(dataBasis.systemsWithAuditHistory, totalSystems);
  if (dataBasis.systemsWithAuditHistory < totalSystems) {
    items.push({
      id: "audit-history",
      title: "Immutable Historie ausbauen",
      impact: "Fehlende Review-/Statushistorie reduziert Audit-Transparenz.",
      recommendedAction: "Reviews und Statuswechsel begruendet dokumentieren.",
      affectedSystems: totalSystems - dataBasis.systemsWithAuditHistory,
      coveragePercent: auditCoverage,
      deepLink: pickDeepLink(
        useCases,
        (useCase) => !hasAuditHistory(useCase),
        "audit"
      ),
    });
  }

  const documentationCoverage = percentage(
    dataBasis.systemsWithDocumentationLevel,
    totalSystems
  );
  if (dataBasis.systemsWithDocumentationLevel < totalSystems) {
    items.push({
      id: "documentation-level",
      title: "Dokumentationsniveau harmonisieren",
      impact: "Uneinheitliche Dokumentation erschwert org-weite Lifecycle-Steuerung.",
      recommendedAction: "Dokumentationslevel je Einsatzfall auf minimal/standard/extended festlegen.",
      affectedSystems: totalSystems - dataBasis.systemsWithDocumentationLevel,
      coveragePercent: documentationCoverage,
      deepLink: pickDeepLink(
        useCases,
        (useCase) => !hasDocumentationLevel(useCase),
        "audit"
      ),
    });
  }

  if (!orgSettings?.aiPolicy?.url?.trim()) {
    items.push({
      id: "org-policy-baseline",
      title: "Org-Richtlinie dokumentieren",
      impact: "Ohne Organisationsrichtlinie bleibt Clause 5 unvollstaendig.",
      recommendedAction: "Org-Einstellungen um eine gueltige KI-Richtlinie ergaenzen.",
      affectedSystems: totalSystems,
      coveragePercent: 0,
      deepLink: null,
    });
  }

  if (!orgSettings?.incidentProcess?.url?.trim()) {
    items.push({
      id: "incident-process-baseline",
      title: "Incident-Prozess hinterlegen",
      impact: "Fehlende Verbesserungsprozesse reduzieren Audit-Readiness.",
      recommendedAction: "Incident-Prozess in den Org-Einstellungen dokumentieren.",
      affectedSystems: totalSystems,
      coveragePercent: 0,
      deepLink: null,
    });
  }

  return items;
}

function buildIsoClauseProgress(
  useCases: UseCaseCard[],
  orgSettings: OrgSettings | null | undefined,
  now: Date
): AuditIsoClauseProgress[] {
  const totalSystems = useCases.length;
  const withOwner = useCases.filter((useCase) => hasOwner(useCase)).length;
  const withReviewCycle = useCases.filter((useCase) => hasReviewStructure(useCase)).length;
  const withOversight = useCases.filter((useCase) => hasOversightModel(useCase)).length;
  const withPolicyMapping = useCases.filter((useCase) => hasPolicyMapping(useCase)).length;
  const withAuditHistory = useCases.filter((useCase) => hasAuditHistory(useCase)).length;

  const dueOrOverdue = useCases.filter((useCase) => {
    const deadline = calculateReviewDeadline(useCase, now);
    return deadline.status === "due_soon" || deadline.status === "overdue";
  }).length;

  const contextCoverage =
    Boolean(orgSettings?.organisationName?.trim()) &&
    Boolean(orgSettings?.industry?.trim()) &&
    totalSystems > 0
      ? 100
      : totalSystems > 0
        ? 50
        : 0;

  const leadershipCoverage = percentage(
    Number(Boolean(orgSettings?.aiPolicy?.url?.trim())) +
      Number(Boolean(orgSettings?.rolesFramework?.booleanDefined)),
    2
  );

  const planningCoverage = Math.round(
    (percentage(withOwner, totalSystems) + percentage(withOversight, totalSystems)) / 2
  );

  const operationCoverage = Math.round(
    (percentage(withReviewCycle, totalSystems) +
      percentage(useCases.filter((useCase) => hasDocumentationLevel(useCase)).length, totalSystems)) /
      2
  );

  const monitoringCoverage = Math.round(
    (percentage(withAuditHistory, totalSystems) +
      (totalSystems > 0 ? percentage(totalSystems - dueOrOverdue, totalSystems) : 0)) /
      2
  );

  const improvementCoverage = percentage(
    Number(Boolean(orgSettings?.incidentProcess?.url?.trim())) +
      Number(withPolicyMapping > 0),
    2
  );

  return [
    {
      clause: "4",
      title: "Kontext der Organisation",
      documented: contextCoverage >= 100,
      coveragePercent: contextCoverage,
      evidence:
        contextCoverage >= 100
          ? "Organisation und Scope sind dokumentiert."
          : "Organisation/Scope in Org-Einstellungen unvollstaendig.",
    },
    {
      clause: "5",
      title: "Fuehrung und Rollen",
      documented: leadershipCoverage >= 100,
      coveragePercent: leadershipCoverage,
      evidence: `${orgSettings?.aiPolicy?.url ? "KI-Richtlinie vorhanden" : "KI-Richtlinie fehlt"}; ${
        orgSettings?.rolesFramework?.booleanDefined
          ? "Rollenrahmen dokumentiert"
          : "Rollenrahmen offen"
      }`,
    },
    {
      clause: "6",
      title: "Planung und Risikobeherrschung",
      documented: planningCoverage >= 80,
      coveragePercent: planningCoverage,
      evidence: `${withOwner}/${totalSystems} Systeme mit Owner, ${withOversight}/${totalSystems} mit Aufsicht.`,
    },
    {
      clause: "8",
      title: "Operation und Lifecycle",
      documented: operationCoverage >= 80,
      coveragePercent: operationCoverage,
      evidence: `${withReviewCycle}/${totalSystems} Systeme mit Review-Zyklus.`,
    },
    {
      clause: "9",
      title: "Leistungsbewertung",
      documented: monitoringCoverage >= 80,
      coveragePercent: monitoringCoverage,
      evidence: `${withAuditHistory}/${totalSystems} Systeme mit Historie; ${dueOrOverdue} mit kurzfristigem Review-Bedarf.`,
    },
    {
      clause: "10",
      title: "Verbesserung",
      documented: improvementCoverage >= 100,
      coveragePercent: improvementCoverage,
      evidence: orgSettings?.incidentProcess?.url
        ? "Incident-Prozess dokumentiert."
        : "Incident-Prozess nicht dokumentiert.",
    },
  ];
}

function buildLifecycleSummary(useCases: UseCaseCard[], now: Date): AuditIsoLifecycleSummary {
  let active = 0;
  let pilot = 0;
  let retired = 0;
  let unknown = 0;

  let withReviewCycle = 0;
  let withOversightModel = 0;
  let withDocumentationLevel = 0;

  let overdueReviews = 0;
  let dueSoonReviews = 0;
  let noDeadlineSystems = 0;

  for (const useCase of useCases) {
    const lifecycle = useCase.governanceAssessment?.flex?.iso?.lifecycleStatus ?? "unknown";
    switch (lifecycle) {
      case "active":
        active += 1;
        break;
      case "pilot":
        pilot += 1;
        break;
      case "retired":
        retired += 1;
        break;
      default:
        unknown += 1;
        break;
    }

    if (hasReviewStructure(useCase)) withReviewCycle += 1;
    if (hasOversightModel(useCase)) withOversightModel += 1;
    if (hasDocumentationLevel(useCase)) withDocumentationLevel += 1;

    const deadline = calculateReviewDeadline(useCase, now);
    if (deadline.status === "overdue") overdueReviews += 1;
    if (deadline.status === "due_soon") dueSoonReviews += 1;
    if (deadline.status === "no_deadline") noDeadlineSystems += 1;
  }

  return {
    totalSystems: useCases.length,
    active,
    pilot,
    retired,
    unknown,
    withReviewCycle,
    withOversightModel,
    withDocumentationLevel,
    overdueReviews,
    dueSoonReviews,
    noDeadlineSystems,
  };
}

export function buildOrgAuditLayer(
  useCases: UseCaseCard[],
  orgSettings?: OrgSettings | null,
  now: Date = new Date()
): OrgAuditLayerSnapshot {
  const overview = calculateControlOverview(useCases, orgSettings, now);
  const lifecycle = buildLifecycleSummary(useCases, now);

  const statusDistribution: Record<RegisterUseCaseStatus, number> = {
    UNREVIEWED: 0,
    REVIEW_RECOMMENDED: 0,
    REVIEWED: 0,
    PROOF_READY: 0,
  };

  for (const useCase of useCases) {
    statusDistribution[useCase.status] += 1;
  }

  return {
    generatedAt: now.toISOString(),
    governanceScore: overview.kpis.governanceScore,
    isoReadinessPercent: overview.kpis.isoReadinessPercent,
    maturityLevel: overview.maturity.currentLevel,
    statusDistribution,
    lifecycle,
    isoClauseProgress: buildIsoClauseProgress(useCases, orgSettings, now),
    gapAnalysis: buildGapAnalysis(useCases, orgSettings, now),
    immutableReviewHistory: buildImmutableHistoryEntries(useCases),
  };
}
