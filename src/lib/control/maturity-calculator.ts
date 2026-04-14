import type { OrgSettings, UseCaseCard } from '@/lib/register-first/types';
import {
  buildUseCaseDetailLink,
  buildUseCaseFocusLink,
} from '@/lib/control/deep-link';
import { ROUTE_HREFS } from '@/lib/navigation/route-manifest';
import {
  isHighRiskClass,
  parseStoredAiActCategory,
} from '@/lib/register-first/risk-taxonomy';

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
  actionHref?: string | null;
  actionLabel?: string | null;
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
  reviewWindow: 'NONE' | 'DUE' | 'OVERDUE';
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
  const coreDefined =
    useCase.governanceAssessment?.core?.reviewCycleDefined === true;
  const isoReviewCycle = useCase.governanceAssessment?.flex?.iso?.reviewCycle;
  const hasIsoCycle = Boolean(isoReviewCycle && isoReviewCycle !== 'unknown');
  const hasNextReviewDate = Boolean(
    useCase.governanceAssessment?.flex?.iso?.nextReviewAt,
  );
  return coreDefined || hasIsoCycle || hasNextReviewDate;
}

function hasDefinedOversight(useCase: UseCaseCard): boolean {
  const coreDefined =
    useCase.governanceAssessment?.core?.oversightDefined === true;
  const isoOversight = useCase.governanceAssessment?.flex?.iso?.oversightModel;
  return coreDefined || Boolean(isoOversight && isoOversight !== 'unknown');
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
  const coreDefined =
    useCase.governanceAssessment?.core?.documentationLevelDefined === true;
  const isoDocumentationLevel =
    useCase.governanceAssessment?.flex?.iso?.documentationLevel;
  return (
    coreDefined ||
    Boolean(isoDocumentationLevel && isoDocumentationLevel !== 'unknown')
  );
}

function isDocumented(useCase: UseCaseCard): boolean {
  const hasPurpose = useCase.purpose.trim().length > 0;
  const hasUsageContext = useCase.usageContexts.length > 0;
  return hasPurpose && hasUsageContext;
}

function isHighRisk(useCase: UseCaseCard): boolean {
  return isHighRiskClass(
    parseStoredAiActCategory(useCase.governanceAssessment?.core?.aiActCategory),
  );
}

function getReviewWindow(
  useCase: UseCaseCard,
  now: Date,
): 'NONE' | 'DUE' | 'OVERDUE' {
  const nextReviewAt = useCase.governanceAssessment?.flex?.iso?.nextReviewAt;
  if (!nextReviewAt) return 'NONE';

  const nextReviewTimestamp = Date.parse(nextReviewAt);
  if (Number.isNaN(nextReviewTimestamp)) return 'NONE';

  const nowTimestamp = now.getTime();
  if (nextReviewTimestamp < nowTimestamp) return 'OVERDUE';

  const dueThreshold =
    nowTimestamp + CONTROL_REVIEW_DUE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  if (nextReviewTimestamp <= dueThreshold) return 'DUE';

  return 'NONE';
}

function deriveControlState(
  useCase: UseCaseCard,
  now: Date,
): UseCaseControlState {
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
      return 'Level 1 - Documented';
    case 2:
      return 'Level 2 - Responsibilities defined';
    case 3:
      return 'Level 3 - Reviews structured';
    case 4:
      return 'Level 4 - Policies consistently mapped';
    case 5:
      return 'Level 5 - Audit-ready';
  }
}

function buildLevel(
  level: 1 | 2 | 3 | 4 | 5,
  criteria: MaturityCriterionResult[],
): MaturityLevelResult {
  const achievedCriteria = criteria.filter(
    (criterion) => criterion.fulfilled,
  ).length;
  return {
    level,
    title: levelLabel(level),
    fulfilled: achievedCriteria === criteria.length,
    achievedCriteria,
    totalCriteria: criteria.length,
    criteria,
  };
}

function buildUseCaseRepairAction(
  useCases: UseCaseCard[],
  predicate: (useCase: UseCaseCard) => boolean,
  focus: Parameters<typeof buildUseCaseFocusLink>[1],
  label: string,
  options?: Parameters<typeof buildUseCaseFocusLink>[2],
): Pick<MaturityCriterionResult, 'actionHref' | 'actionLabel'> {
  const match = useCases.find(predicate);
  if (!match) {
    return {};
  }

  return {
    actionHref: buildUseCaseFocusLink(match.useCaseId, focus, options),
    actionLabel: label,
  };
}

function buildUseCaseViewAction(
  useCases: UseCaseCard[],
  predicate: (useCase: UseCaseCard) => boolean,
  label: string,
): Pick<MaturityCriterionResult, 'actionHref' | 'actionLabel'> {
  const match = useCases.find(predicate);
  if (!match) {
    return {};
  }

  return {
    actionHref: buildUseCaseDetailLink(match.useCaseId),
    actionLabel: label,
  };
}

export function calculateControlOverview(
  useCases: UseCaseCard[],
  orgSettings?: OrgSettings | null,
  now: Date = new Date(),
): ControlOverview {
  const states = useCases.map((useCase) => deriveControlState(useCase, now));
  const totalSystems = states.length;

  const documentedSystems = states.filter((state) => state.isDocumented).length;
  const systemsWithOwner = states.filter((state) => state.hasOwner).length;
  const systemsWithReviewStructure = states.filter(
    (state) => state.hasReviewStructure,
  ).length;
  const systemsWithPolicyMapping = states.filter(
    (state) => state.hasPolicyMapping,
  ).length;
  const systemsWithAuditHistory = states.filter(
    (state) => state.hasAuditHistory,
  ).length;
  const systemsWithDocumentationLevel = states.filter(
    (state) => state.hasDocumentationLevel,
  ).length;
  const highRiskSystems = states.filter((state) => state.isHighRisk).length;
  const highRiskWithOversight = states.filter(
    (state) => state.isHighRisk && state.hasOversight,
  ).length;
  const reviewsDue = states.filter(
    (state) => state.reviewWindow === 'DUE',
  ).length;
  const reviewsOverdue = states.filter(
    (state) => state.reviewWindow === 'OVERDUE',
  ).length;
  const systemsWithoutOwner = totalSystems - systemsWithOwner;

  const documentationCoverage = percentage(documentedSystems, totalSystems);
  const ownerCoverage = percentage(systemsWithOwner, totalSystems);
  const reviewCoverage = percentage(systemsWithReviewStructure, totalSystems);
  const policyCoverage = percentage(systemsWithPolicyMapping, totalSystems);
  const oversightCoverage = percentage(
    states.filter((state) => state.hasOversight).length,
    totalSystems,
  );
  const auditCoverage = percentage(systemsWithAuditHistory, totalSystems);
  const documentationLevelCoverage = percentage(
    systemsWithDocumentationLevel,
    totalSystems,
  );
  const highRiskOversightCoverage = percentage(
    highRiskWithOversight,
    highRiskSystems,
  );

  const governanceScore = Math.round(
    documentationCoverage * 0.3 +
      ownerCoverage * 0.2 +
      reviewCoverage * 0.2 +
      oversightCoverage * 0.15 +
      policyCoverage * 0.15,
  );

  const isoReadinessPercent = Math.round(
    reviewCoverage * 0.35 +
      documentationLevelCoverage * 0.25 +
      oversightCoverage * 0.25 +
      auditCoverage * 0.15,
  );

  const hasAnySystems = totalSystems > 0;
  const hasOrgPolicyBaseline = Boolean(
    orgSettings?.aiPolicy?.url || orgSettings?.incidentProcess?.url,
  );

  const level1 = buildLevel(1, [
    {
      id: 'systems-documented',
      label: 'Systems documented in register',
      fulfilled: hasAnySystems,
      evidence: `${totalSystems} documented systems`,
      missing: 'Document at least one use case in the register.',
      actionHref: '/capture',
      actionLabel: 'Capture use case',
    },
    {
      id: 'documentation-coverage',
      label: 'Core documentation largely complete',
      fulfilled:
        documentationCoverage >=
        CONTROL_MATURITY_THRESHOLDS.documentationCoverage,
      evidence: `${documentedSystems}/${totalSystems} systems (${documentationCoverage}%)`,
      missing: 'Add purpose and usage context to incomplete use cases.',
      ...buildUseCaseViewAction(
        useCases,
        (useCase) => !isDocumented(useCase),
        'Open incomplete use case',
      ),
    },
  ]);

  const level2 = buildLevel(2, [
    {
      id: 'level-1-prerequisite',
      label: 'Level 1 fully achieved',
      fulfilled: level1.fulfilled,
      evidence: level1.fulfilled ? 'Yes' : 'No',
      missing: 'Complete the documentation baseline from Level 1.',
    },
    {
      id: 'owner-coverage',
      label: 'Responsibilities clearly assigned',
      fulfilled: ownerCoverage >= CONTROL_MATURITY_THRESHOLDS.ownerCoverage,
      evidence: `${systemsWithOwner}/${totalSystems} systems (${ownerCoverage}%)`,
      missing: 'Add an owner for systems without one.',
      ...buildUseCaseRepairAction(
        useCases,
        (useCase) => !hasResponsibleOwner(useCase),
        'owner',
        'Add owner',
        { edit: true },
      ),
    },
  ]);

  const level3 = buildLevel(3, [
    {
      id: 'level-2-prerequisite',
      label: 'Level 2 fully achieved',
      fulfilled: level2.fulfilled,
      evidence: level2.fulfilled ? 'Yes' : 'No',
      missing: 'Consolidate responsibilities first.',
    },
    {
      id: 'review-structure',
      label: 'Review cycles structured',
      fulfilled: reviewCoverage >= CONTROL_MATURITY_THRESHOLDS.reviewCoverage,
      evidence: `${systemsWithReviewStructure}/${totalSystems} systems (${reviewCoverage}%)`,
      missing: 'Set a review cycle or next review date.',
      ...buildUseCaseRepairAction(
        useCases,
        (useCase) => !hasStructuredReview(useCase),
        'governance',
        'Set review cycle',
        { edit: true, field: 'reviewCycle' },
      ),
    },
    {
      id: 'high-risk-oversight',
      label: 'High-risk systems covered by oversight',
      fulfilled:
        highRiskOversightCoverage >=
        CONTROL_MATURITY_THRESHOLDS.highRiskOversightCoverage,
      evidence:
        highRiskSystems === 0
          ? 'No high-risk system in the register'
          : `${highRiskWithOversight}/${highRiskSystems} systems (${highRiskOversightCoverage}%)`,
      missing: 'Document an oversight model for every high-risk system.',
      ...buildUseCaseRepairAction(
        useCases,
        (useCase) => isHighRisk(useCase) && !hasDefinedOversight(useCase),
        'governance',
        'Set oversight model',
        { edit: true, field: 'oversight' },
      ),
    },
  ]);

  const level4 = buildLevel(4, [
    {
      id: 'level-3-prerequisite',
      label: 'Level 3 fully achieved',
      fulfilled: level3.fulfilled,
      evidence: level3.fulfilled ? 'Yes' : 'No',
      missing: 'Stabilise review structure and high-risk oversight first.',
    },
    {
      id: 'policy-mapping',
      label: 'Policies consistently mapped to systems',
      fulfilled: policyCoverage >= CONTROL_MATURITY_THRESHOLDS.policyCoverage,
      evidence: `${systemsWithPolicyMapping}/${totalSystems} systems (${policyCoverage}%)`,
      missing: 'Add policy links per use case.',
    },
    {
      id: 'org-policy-baseline',
      label: 'Organisation-wide policy baseline available',
      fulfilled: hasOrgPolicyBaseline,
      evidence: hasOrgPolicyBaseline ? 'Yes' : 'No',
      missing:
        'Add at least an AI policy or incident process to the register profile.',
      actionHref: ROUTE_HREFS.governanceSettings,
      actionLabel: 'Open Governance Settings',
    },
  ]);

  const level5 = buildLevel(5, [
    {
      id: 'level-4-prerequisite',
      label: 'Level 4 fully achieved',
      fulfilled: level4.fulfilled,
      evidence: level4.fulfilled ? 'Yes' : 'No',
      missing: 'Complete policy mapping and organisation baseline first.',
    },
    {
      id: 'audit-history',
      label: 'Audit history broadly available',
      fulfilled: auditCoverage >= CONTROL_MATURITY_THRESHOLDS.auditCoverage,
      evidence: `${systemsWithAuditHistory}/${totalSystems} systems (${auditCoverage}%)`,
      missing: 'Systematically complete review history and evidence.',
      ...buildUseCaseRepairAction(
        useCases,
        (useCase) => !hasAuditHistory(useCase),
        'governance',
        'Build review history',
        { field: 'history' },
      ),
    },
    {
      id: 'iso-readiness-threshold',
      label: 'ISO readiness reaches threshold',
      fulfilled:
        isoReadinessPercent >= CONTROL_MATURITY_THRESHOLDS.isoReadiness,
      evidence: `${isoReadinessPercent}%`,
      missing: 'Continue closing review, documentation and audit data gaps.',
    },
  ]);

  const levels: MaturityLevelResult[] = [
    level1,
    level2,
    level3,
    level4,
    level5,
  ];

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

export function calculateRiskConcentrationIndex(
  useCases: UseCaseCard[],
): number {
  if (useCases.length === 0) return 0;

  const highRiskCount = useCases.filter((useCase) =>
    isHighRisk(useCase),
  ).length;
  const highRiskRatio = toRatio(highRiskCount, useCases.length);
  return Math.round(highRiskRatio * 100);
}
