import type { OrgSettings, UseCaseCard } from "@/lib/register-first/types";

export const CONTROL_REVIEW_DUE_WINDOW_DAYS = 30;

export const CONTROL_MATURITY_THRESHOLDS = Object.freeze({
  documentationCoverage: 90,
  ownerCoverage: 80,
  reviewCoverage: 80,
  highRiskOversightCoverage: 100,
  policyCoverage: 70,
  auditCoverage: 80,
  isoReadiness: 80,
});

export interface ControlKpiSnapshot {
  totalSystems: number;
  highRiskCount: number;
  highRiskPercent: number;
  reviewsDue: number;
  reviewsOverdue: number;
  systemsWithoutOwner: number;
  governanceScore: number;
  isoReadinessPercent: number;
}

export interface ControlDataBasis {
  totalSystems: number;
  documentedSystems: number;
  systemsWithOwner: number;
  systemsWithReviewStructure: number;
  systemsWithPolicyMapping: number;
  systemsWithAuditHistory: number;
  systemsWithDocumentationLevel: number;
  highRiskSystems: number;
  highRiskWithOversight: number;
}

export interface MaturityCriterionResult {
  id: string;
  label: string;
  fulfilled: boolean;
  evidence: string;
  missing: string;
}

export interface MaturityLevelResult {
  level: 1 | 2 | 3 | 4 | 5;
  title: string;
  fulfilled: boolean;
  achievedCriteria: number;
  totalCriteria: number;
  criteria: MaturityCriterionResult[];
}

export interface ControlMaturityResult {
  currentLevel: 1 | 2 | 3 | 4 | 5;
  currentLabel: string;
  levels: MaturityLevelResult[];
  dataBasis: ControlDataBasis;
}

export interface ControlOverview {
  kpis: ControlKpiSnapshot;
  maturity: ControlMaturityResult;
}

interface UseCaseControlState {
  isDocumented: boolean;
  hasOwner: boolean;
  hasReviewStructure: boolean;
  hasOversight: boolean;
  hasPolicyMapping: boolean;
  hasAuditHistory: boolean;
  hasDocumentationLevel: boolean;
  isHighRisk: boolean;
  reviewWindow: "NONE" | "DUE" | "OVERDUE";
}

function percentage(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function toRatio(part: number, total: number): number {
  if (total <= 0) return 0;
  return part / total;
}

function hasResponsibleOwner(useCase: UseCaseCard): boolean {
  if (useCase.responsibility.isCurrentlyResponsible) return true;
  return Boolean(useCase.responsibility.responsibleParty?.trim());
}

function hasStructuredReview(useCase: UseCaseCard): boolean {
  const coreDefined = useCase.governanceAssessment?.core?.reviewCycleDefined === true;
  const isoReviewCycle = useCase.governanceAssessment?.flex?.iso?.reviewCycle;
  const hasIsoCycle = Boolean(isoReviewCycle && isoReviewCycle !== "unknown");
  const hasNextReviewDate = Boolean(useCase.governanceAssessment?.flex?.iso?.nextReviewAt);
  return coreDefined || hasIsoCycle || hasNextReviewDate;
}

function hasDefinedOversight(useCase: UseCaseCard): boolean {
  const coreDefined = useCase.governanceAssessment?.core?.oversightDefined === true;
  const isoOversight = useCase.governanceAssessment?.flex?.iso?.oversightModel;
  return coreDefined || Boolean(isoOversight && isoOversight !== "unknown");
}

function hasPolicyMapping(useCase: UseCaseCard): boolean {
  const links = useCase.governanceAssessment?.flex?.policyLinks ?? [];
  return links.some((entry) => entry.trim().length > 0);
}

function hasAuditHistory(useCase: UseCaseCard): boolean {
  const reviewEvents = useCase.reviews?.length ?? 0;
  const statusHistoryEvents = useCase.statusHistory?.length ?? 0;
  const hasProof = Boolean(useCase.proof?.verification);
  return reviewEvents > 0 || statusHistoryEvents > 0 || hasProof;
}

function hasDocumentationLevel(useCase: UseCaseCard): boolean {
  const coreDefined = useCase.governanceAssessment?.core?.documentationLevelDefined === true;
  const isoDocumentationLevel = useCase.governanceAssessment?.flex?.iso?.documentationLevel;
  return coreDefined || Boolean(isoDocumentationLevel && isoDocumentationLevel !== "unknown");
}

function isDocumented(useCase: UseCaseCard): boolean {
  const hasPurpose = useCase.purpose.trim().length > 0;
  const hasUsageContext = useCase.usageContexts.length > 0;
  return hasPurpose && hasUsageContext;
}

function isHighRisk(useCase: UseCaseCard): boolean {
  const category = useCase.governanceAssessment?.core?.aiActCategory?.toLowerCase() ?? "";
  return category.includes("hochrisiko") || category.includes("high risk");
}

function getReviewWindow(useCase: UseCaseCard, now: Date): "NONE" | "DUE" | "OVERDUE" {
  const nextReviewAt = useCase.governanceAssessment?.flex?.iso?.nextReviewAt;
  if (!nextReviewAt) return "NONE";

  const nextReviewTimestamp = Date.parse(nextReviewAt);
  if (Number.isNaN(nextReviewTimestamp)) return "NONE";

  const nowTimestamp = now.getTime();
  if (nextReviewTimestamp < nowTimestamp) return "OVERDUE";

  const dueThreshold = nowTimestamp + CONTROL_REVIEW_DUE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  if (nextReviewTimestamp <= dueThreshold) return "DUE";

  return "NONE";
}

function deriveControlState(useCase: UseCaseCard, now: Date): UseCaseControlState {
  return {
    isDocumented: isDocumented(useCase),
    hasOwner: hasResponsibleOwner(useCase),
    hasReviewStructure: hasStructuredReview(useCase),
    hasOversight: hasDefinedOversight(useCase),
    hasPolicyMapping: hasPolicyMapping(useCase),
    hasAuditHistory: hasAuditHistory(useCase),
    hasDocumentationLevel: hasDocumentationLevel(useCase),
    isHighRisk: isHighRisk(useCase),
    reviewWindow: getReviewWindow(useCase, now),
  };
}

function levelLabel(level: 1 | 2 | 3 | 4 | 5): string {
  switch (level) {
    case 1:
      return "Level 1 - Dokumentiert";
    case 2:
      return "Level 2 - Verantwortlichkeiten definiert";
    case 3:
      return "Level 3 - Reviews strukturiert";
    case 4:
      return "Level 4 - Policies konsistent gemappt";
    case 5:
      return "Level 5 - Audit-ready";
  }
}

function buildLevel(
  level: 1 | 2 | 3 | 4 | 5,
  criteria: MaturityCriterionResult[]
): MaturityLevelResult {
  const achievedCriteria = criteria.filter((criterion) => criterion.fulfilled).length;
  return {
    level,
    title: levelLabel(level),
    fulfilled: achievedCriteria === criteria.length,
    achievedCriteria,
    totalCriteria: criteria.length,
    criteria,
  };
}

export function calculateControlOverview(
  useCases: UseCaseCard[],
  orgSettings?: OrgSettings | null,
  now: Date = new Date()
): ControlOverview {
  const states = useCases.map((useCase) => deriveControlState(useCase, now));
  const totalSystems = states.length;

  const documentedSystems = states.filter((state) => state.isDocumented).length;
  const systemsWithOwner = states.filter((state) => state.hasOwner).length;
  const systemsWithReviewStructure = states.filter((state) => state.hasReviewStructure).length;
  const systemsWithPolicyMapping = states.filter((state) => state.hasPolicyMapping).length;
  const systemsWithAuditHistory = states.filter((state) => state.hasAuditHistory).length;
  const systemsWithDocumentationLevel = states.filter(
    (state) => state.hasDocumentationLevel
  ).length;
  const highRiskSystems = states.filter((state) => state.isHighRisk).length;
  const highRiskWithOversight = states.filter(
    (state) => state.isHighRisk && state.hasOversight
  ).length;
  const reviewsDue = states.filter((state) => state.reviewWindow === "DUE").length;
  const reviewsOverdue = states.filter((state) => state.reviewWindow === "OVERDUE").length;
  const systemsWithoutOwner = totalSystems - systemsWithOwner;

  const documentationCoverage = percentage(documentedSystems, totalSystems);
  const ownerCoverage = percentage(systemsWithOwner, totalSystems);
  const reviewCoverage = percentage(systemsWithReviewStructure, totalSystems);
  const policyCoverage = percentage(systemsWithPolicyMapping, totalSystems);
  const oversightCoverage = percentage(
    states.filter((state) => state.hasOversight).length,
    totalSystems
  );
  const auditCoverage = percentage(systemsWithAuditHistory, totalSystems);
  const documentationLevelCoverage = percentage(systemsWithDocumentationLevel, totalSystems);
  const highRiskOversightCoverage = percentage(highRiskWithOversight, highRiskSystems);

  const governanceScore = Math.round(
    documentationCoverage * 0.3 +
      ownerCoverage * 0.2 +
      reviewCoverage * 0.2 +
      oversightCoverage * 0.15 +
      policyCoverage * 0.15
  );

  const isoReadinessPercent = Math.round(
    reviewCoverage * 0.35 +
      documentationLevelCoverage * 0.25 +
      oversightCoverage * 0.25 +
      auditCoverage * 0.15
  );

  const hasAnySystems = totalSystems > 0;
  const hasOrgPolicyBaseline = Boolean(
    orgSettings?.aiPolicy?.url || orgSettings?.incidentProcess?.url
  );

  const level1 = buildLevel(1, [
    {
      id: "systems-documented",
      label: "Systeme im Register dokumentiert",
      fulfilled: hasAnySystems,
      evidence: `${totalSystems} dokumentierte Systeme`,
      missing: "Mindestens einen Einsatzfall im Register dokumentieren.",
    },
    {
      id: "documentation-coverage",
      label: "Stammdokumentation weitgehend vollständig",
      fulfilled:
        documentationCoverage >= CONTROL_MATURITY_THRESHOLDS.documentationCoverage,
      evidence: `${documentedSystems}/${totalSystems} Systeme (${documentationCoverage}%)`,
      missing: "Zweck und Verwendungskontext in offenen Use Cases nachziehen.",
    },
  ]);

  const level2 = buildLevel(2, [
    {
      id: "level-1-prerequisite",
      label: "Level 1 vollständig erfüllt",
      fulfilled: level1.fulfilled,
      evidence: level1.fulfilled ? "Ja" : "Nein",
      missing: "Dokumentationsbasis aus Level 1 abschließen.",
    },
    {
      id: "owner-coverage",
      label: "Verantwortlichkeiten klar zugeordnet",
      fulfilled: ownerCoverage >= CONTROL_MATURITY_THRESHOLDS.ownerCoverage,
      evidence: `${systemsWithOwner}/${totalSystems} Systeme (${ownerCoverage}%)`,
      missing: "Owner-Feld für offene Systeme ergänzen.",
    },
  ]);

  const level3 = buildLevel(3, [
    {
      id: "level-2-prerequisite",
      label: "Level 2 vollständig erfüllt",
      fulfilled: level2.fulfilled,
      evidence: level2.fulfilled ? "Ja" : "Nein",
      missing: "Verantwortlichkeiten zuerst konsolidieren.",
    },
    {
      id: "review-structure",
      label: "Review-Zyklen strukturiert hinterlegt",
      fulfilled: reviewCoverage >= CONTROL_MATURITY_THRESHOLDS.reviewCoverage,
      evidence: `${systemsWithReviewStructure}/${totalSystems} Systeme (${reviewCoverage}%)`,
      missing: "Review-Zyklus oder nächstes Review-Datum erfassen.",
    },
    {
      id: "high-risk-oversight",
      label: "Hochrisiko-Systeme mit Aufsicht abgedeckt",
      fulfilled:
        highRiskOversightCoverage >=
        CONTROL_MATURITY_THRESHOLDS.highRiskOversightCoverage,
      evidence:
        highRiskSystems === 0
          ? "Kein Hochrisiko-System im Register"
          : `${highRiskWithOversight}/${highRiskSystems} Systeme (${highRiskOversightCoverage}%)`,
      missing: "Für jedes Hochrisiko-System ein Aufsichtsmodell dokumentieren.",
    },
  ]);

  const level4 = buildLevel(4, [
    {
      id: "level-3-prerequisite",
      label: "Level 3 vollständig erfüllt",
      fulfilled: level3.fulfilled,
      evidence: level3.fulfilled ? "Ja" : "Nein",
      missing: "Review-Struktur und Hochrisiko-Aufsicht zuerst stabilisieren.",
    },
    {
      id: "policy-mapping",
      label: "Policies konsistent auf Systeme gemappt",
      fulfilled: policyCoverage >= CONTROL_MATURITY_THRESHOLDS.policyCoverage,
      evidence: `${systemsWithPolicyMapping}/${totalSystems} Systeme (${policyCoverage}%)`,
      missing: "Policy-Links pro Use Case ergänzen.",
    },
    {
      id: "org-policy-baseline",
      label: "Organisationsweite Policy-Basis vorhanden",
      fulfilled: hasOrgPolicyBaseline,
      evidence: hasOrgPolicyBaseline ? "Ja" : "Nein",
      missing: "Mindestens AI-Policy oder Incident-Prozess im Registerprofil hinterlegen.",
    },
  ]);

  const level5 = buildLevel(5, [
    {
      id: "level-4-prerequisite",
      label: "Level 4 vollständig erfüllt",
      fulfilled: level4.fulfilled,
      evidence: level4.fulfilled ? "Ja" : "Nein",
      missing: "Policy-Mapping und Organisationsbasis zuerst schließen.",
    },
    {
      id: "audit-history",
      label: "Audit-Historie ist breit vorhanden",
      fulfilled: auditCoverage >= CONTROL_MATURITY_THRESHOLDS.auditCoverage,
      evidence: `${systemsWithAuditHistory}/${totalSystems} Systeme (${auditCoverage}%)`,
      missing: "Review-Historie und Nachweise systematisch vervollständigen.",
    },
    {
      id: "iso-readiness-threshold",
      label: "ISO-Readiness erreicht Schwellwert",
      fulfilled: isoReadinessPercent >= CONTROL_MATURITY_THRESHOLDS.isoReadiness,
      evidence: `${isoReadinessPercent}%`,
      missing: "Review-, Dokumentations- und Auditdaten weiter schließen.",
    },
  ]);

  const levels: MaturityLevelResult[] = [level1, level2, level3, level4, level5];

  let currentLevel: 1 | 2 | 3 | 4 | 5 = 1;
  for (const level of levels) {
    if (level.fulfilled) {
      currentLevel = level.level;
    }
  }

  const dataBasis: ControlDataBasis = {
    totalSystems,
    documentedSystems,
    systemsWithOwner,
    systemsWithReviewStructure,
    systemsWithPolicyMapping,
    systemsWithAuditHistory,
    systemsWithDocumentationLevel,
    highRiskSystems,
    highRiskWithOversight,
  };

  return {
    kpis: {
      totalSystems,
      highRiskCount: highRiskSystems,
      highRiskPercent: percentage(highRiskSystems, totalSystems),
      reviewsDue,
      reviewsOverdue,
      systemsWithoutOwner,
      governanceScore,
      isoReadinessPercent,
    },
    maturity: {
      currentLevel,
      currentLabel: levelLabel(currentLevel),
      levels,
      dataBasis,
    },
  };
}

export function calculateRiskConcentrationIndex(useCases: UseCaseCard[]): number {
  if (useCases.length === 0) return 0;

  const highRiskCount = useCases.filter((useCase) => isHighRisk(useCase)).length;
  const highRiskRatio = toRatio(highRiskCount, useCases.length);
  return Math.round(highRiskRatio * 100);
}
