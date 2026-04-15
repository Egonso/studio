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

function getControlMaturityCopy(locale?: string) {
  if (locale?.toLowerCase().startsWith('de')) {
    return {
      levelTitles: {
        1: 'Level 1 - Dokumentiert',
        2: 'Level 2 - Verantwortlichkeiten definiert',
        3: 'Level 3 - Reviews strukturiert',
        4: 'Level 4 - Richtlinien konsistent verknüpft',
        5: 'Level 5 - Audit-ready',
      } as const,
      yes: 'Ja',
      no: 'Nein',
      noHighRiskSystem: 'Kein Hochrisiko-System im Register',
      systemsDocumented: 'Systeme im Register dokumentiert',
      documentedSystems: 'dokumentierte Systeme',
      systems: 'Systeme',
      documentAtLeastOne:
        'Dokumentieren Sie mindestens einen Einsatzfall im Register.',
      captureUseCase: 'Einsatzfall erfassen',
      coreDocumentationComplete:
        'Kerndokumentation weitgehend vollständig',
      addPurposeAndUsageContext:
        'Ergänzen Sie Zweck und Wirkungsbereich bei unvollständigen Einsatzfällen.',
      openIncompleteUseCase: 'Unvollständigen Einsatzfall öffnen',
      level1Achieved: 'Level 1 vollständig erreicht',
      completeLevel1Baseline:
        'Schließen Sie zuerst die Dokumentationsbasis aus Level 1 ab.',
      responsibilitiesAssigned:
        'Verantwortlichkeiten klar zugewiesen',
      addOwner: 'Ergänzen Sie fehlende Owner-Rollen.',
      addOwnerAction: 'Owner ergänzen',
      level2Achieved: 'Level 2 vollständig erreicht',
      consolidateResponsibilities:
        'Stabilisieren Sie zuerst die Verantwortlichkeiten.',
      reviewCyclesStructured: 'Review-Zyklen strukturiert',
      setReviewCycleOrDate:
        'Legen Sie einen Review-Zyklus oder ein nächstes Review-Datum fest.',
      setReviewCycleAction: 'Review-Zyklus festlegen',
      highRiskOversight:
        'Hochrisiko-Systeme mit Aufsicht abgedeckt',
      documentOversight:
        'Dokumentieren Sie für jedes Hochrisiko-System ein Aufsichtsmodell.',
      setOversightAction: 'Aufsichtsmodell festlegen',
      level3Achieved: 'Level 3 vollständig erreicht',
      stabiliseReviewAndOversight:
        'Stabilisieren Sie zuerst Review-Struktur und Hochrisiko-Aufsicht.',
      policyMapping: 'Richtlinien konsistent mit Systemen verknüpft',
      addPolicyLinks: 'Ergänzen Sie Richtlinien-Verknüpfungen pro Einsatzfall.',
      orgPolicyBaseline:
        'Organisationsweite Richtlinienbasis vorhanden',
      addOrgPolicyBaseline:
        'Hinterlegen Sie mindestens eine KI-Richtlinie oder einen Incident-Prozess im Registerprofil.',
      openGovernanceSettings: 'Governance-Einstellungen öffnen',
      level4Achieved: 'Level 4 vollständig erreicht',
      completePolicyAndBaseline:
        'Schließen Sie zuerst Policy-Mapping und Organisationsbasis ab.',
      auditHistoryAvailable: 'Audit-Historie breit verfügbar',
      completeAuditHistory:
        'Vervollständigen Sie systematisch Review-Historie und Nachweise.',
      buildReviewHistory: 'Review-Historie aufbauen',
      isoThreshold: 'ISO-Readiness erreicht den Zielwert',
      closeGovernanceGaps:
        'Schließen Sie weitere Lücken bei Review, Dokumentation und Audit-Daten.',
    } as const;
  }

  return {
    levelTitles: {
      1: 'Level 1 - Documented',
      2: 'Level 2 - Responsibilities defined',
      3: 'Level 3 - Reviews structured',
      4: 'Level 4 - Policies consistently mapped',
      5: 'Level 5 - Audit-ready',
    } as const,
    yes: 'Yes',
    no: 'No',
    noHighRiskSystem: 'No high-risk system in the register',
    systemsDocumented: 'Systems documented in register',
    documentedSystems: 'documented systems',
    systems: 'systems',
    documentAtLeastOne: 'Document at least one use case in the register.',
    captureUseCase: 'Capture use case',
    coreDocumentationComplete: 'Core documentation largely complete',
    addPurposeAndUsageContext:
      'Add purpose and usage context to incomplete use cases.',
    openIncompleteUseCase: 'Open incomplete use case',
    level1Achieved: 'Level 1 fully achieved',
    completeLevel1Baseline:
      'Complete the documentation baseline from Level 1.',
    responsibilitiesAssigned: 'Responsibilities clearly assigned',
    addOwner: 'Add an owner for systems without one.',
    addOwnerAction: 'Add owner',
    level2Achieved: 'Level 2 fully achieved',
    consolidateResponsibilities: 'Consolidate responsibilities first.',
    reviewCyclesStructured: 'Review cycles structured',
    setReviewCycleOrDate: 'Set a review cycle or next review date.',
    setReviewCycleAction: 'Set review cycle',
    highRiskOversight: 'High-risk systems covered by oversight',
    documentOversight:
      'Document an oversight model for every high-risk system.',
    setOversightAction: 'Set oversight model',
    level3Achieved: 'Level 3 fully achieved',
    stabiliseReviewAndOversight:
      'Stabilise review structure and high-risk oversight first.',
    policyMapping: 'Policies consistently mapped to systems',
    addPolicyLinks: 'Add policy links per use case.',
    orgPolicyBaseline: 'Organisation-wide policy baseline available',
    addOrgPolicyBaseline:
      'Add at least an AI policy or incident process to the register profile.',
    openGovernanceSettings: 'Open Governance Settings',
    level4Achieved: 'Level 4 fully achieved',
    completePolicyAndBaseline:
      'Complete policy mapping and organisation baseline first.',
    auditHistoryAvailable: 'Audit history broadly available',
    completeAuditHistory:
      'Systematically complete review history and evidence.',
    buildReviewHistory: 'Build review history',
    isoThreshold: 'ISO readiness reaches threshold',
    closeGovernanceGaps:
      'Continue closing review, documentation and audit data gaps.',
  } as const;
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

function levelLabel(level: 1 | 2 | 3 | 4 | 5, locale?: string): string {
  return getControlMaturityCopy(locale).levelTitles[level];
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
  locale?: string,
): ControlOverview {
  const copy = getControlMaturityCopy(locale);
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
      label: copy.systemsDocumented,
      fulfilled: hasAnySystems,
      evidence: `${totalSystems} ${copy.documentedSystems}`,
      missing: copy.documentAtLeastOne,
      actionHref: '/capture',
      actionLabel: copy.captureUseCase,
    },
    {
      id: 'documentation-coverage',
      label: copy.coreDocumentationComplete,
      fulfilled:
        documentationCoverage >=
        CONTROL_MATURITY_THRESHOLDS.documentationCoverage,
      evidence: `${documentedSystems}/${totalSystems} ${copy.systems} (${documentationCoverage}%)`,
      missing: copy.addPurposeAndUsageContext,
      ...buildUseCaseViewAction(
        useCases,
        (useCase) => !isDocumented(useCase),
        copy.openIncompleteUseCase,
      ),
    },
  ]);

  const level2 = buildLevel(2, [
    {
      id: 'level-1-prerequisite',
      label: copy.level1Achieved,
      fulfilled: level1.fulfilled,
      evidence: level1.fulfilled ? copy.yes : copy.no,
      missing: copy.completeLevel1Baseline,
    },
    {
      id: 'owner-coverage',
      label: copy.responsibilitiesAssigned,
      fulfilled: ownerCoverage >= CONTROL_MATURITY_THRESHOLDS.ownerCoverage,
      evidence: `${systemsWithOwner}/${totalSystems} ${copy.systems} (${ownerCoverage}%)`,
      missing: copy.addOwner,
      ...buildUseCaseRepairAction(
        useCases,
        (useCase) => !hasResponsibleOwner(useCase),
        'owner',
        copy.addOwnerAction,
        { edit: true },
      ),
    },
  ]);

  const level3 = buildLevel(3, [
    {
      id: 'level-2-prerequisite',
      label: copy.level2Achieved,
      fulfilled: level2.fulfilled,
      evidence: level2.fulfilled ? copy.yes : copy.no,
      missing: copy.consolidateResponsibilities,
    },
    {
      id: 'review-structure',
      label: copy.reviewCyclesStructured,
      fulfilled: reviewCoverage >= CONTROL_MATURITY_THRESHOLDS.reviewCoverage,
      evidence: `${systemsWithReviewStructure}/${totalSystems} ${copy.systems} (${reviewCoverage}%)`,
      missing: copy.setReviewCycleOrDate,
      ...buildUseCaseRepairAction(
        useCases,
        (useCase) => !hasStructuredReview(useCase),
        'governance',
        copy.setReviewCycleAction,
        { edit: true, field: 'reviewCycle' },
      ),
    },
    {
      id: 'high-risk-oversight',
      label: copy.highRiskOversight,
      fulfilled:
        highRiskOversightCoverage >=
        CONTROL_MATURITY_THRESHOLDS.highRiskOversightCoverage,
      evidence:
        highRiskSystems === 0
          ? copy.noHighRiskSystem
          : `${highRiskWithOversight}/${highRiskSystems} ${copy.systems} (${highRiskOversightCoverage}%)`,
      missing: copy.documentOversight,
      ...buildUseCaseRepairAction(
        useCases,
        (useCase) => isHighRisk(useCase) && !hasDefinedOversight(useCase),
        'governance',
        copy.setOversightAction,
        { edit: true, field: 'oversight' },
      ),
    },
  ]);

  const level4 = buildLevel(4, [
    {
      id: 'level-3-prerequisite',
      label: copy.level3Achieved,
      fulfilled: level3.fulfilled,
      evidence: level3.fulfilled ? copy.yes : copy.no,
      missing: copy.stabiliseReviewAndOversight,
    },
    {
      id: 'policy-mapping',
      label: copy.policyMapping,
      fulfilled: policyCoverage >= CONTROL_MATURITY_THRESHOLDS.policyCoverage,
      evidence: `${systemsWithPolicyMapping}/${totalSystems} ${copy.systems} (${policyCoverage}%)`,
      missing: copy.addPolicyLinks,
    },
    {
      id: 'org-policy-baseline',
      label: copy.orgPolicyBaseline,
      fulfilled: hasOrgPolicyBaseline,
      evidence: hasOrgPolicyBaseline ? copy.yes : copy.no,
      missing: copy.addOrgPolicyBaseline,
      actionHref: ROUTE_HREFS.governanceSettings,
      actionLabel: copy.openGovernanceSettings,
    },
  ]);

  const level5 = buildLevel(5, [
    {
      id: 'level-4-prerequisite',
      label: copy.level4Achieved,
      fulfilled: level4.fulfilled,
      evidence: level4.fulfilled ? copy.yes : copy.no,
      missing: copy.completePolicyAndBaseline,
    },
    {
      id: 'audit-history',
      label: copy.auditHistoryAvailable,
      fulfilled: auditCoverage >= CONTROL_MATURITY_THRESHOLDS.auditCoverage,
      evidence: `${systemsWithAuditHistory}/${totalSystems} ${copy.systems} (${auditCoverage}%)`,
      missing: copy.completeAuditHistory,
      ...buildUseCaseRepairAction(
        useCases,
        (useCase) => !hasAuditHistory(useCase),
        'governance',
        copy.buildReviewHistory,
        { field: 'history' },
      ),
    },
    {
      id: 'iso-readiness-threshold',
      label: copy.isoThreshold,
      fulfilled:
        isoReadinessPercent >= CONTROL_MATURITY_THRESHOLDS.isoReadiness,
      evidence: `${isoReadinessPercent}%`,
      missing: copy.closeGovernanceGaps,
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
      currentLabel: levelLabel(currentLevel, locale),
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
