'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ActionQueue } from '@/components/control/action-queue';
import { ControlKpiHeader } from '@/components/control/control-kpi-header';
import { ControlMaturityPanel } from '@/components/control/control-maturity-panel';
import { PageStatePanel, SignedInAreaFrame } from '@/components/product-shells';
import { useAuth } from '@/context/auth-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  syncMaturityLevel,
  syncRecommendationProgress,
  trackControlConversion,
  trackControlOpened,
} from '@/lib/analytics/control-events';
import { buildControlActionQueue } from '@/lib/control/action-queue-engine';
import { buildAcademyProgressSnapshot } from '@/lib/course-progress';
import {
  checkCapability,
  useCapability,
} from '@/lib/compliance-engine/capability/useCapability';
import {
  calculateControlOverview,
  CONTROL_MATURITY_THRESHOLDS,
  CONTROL_REVIEW_DUE_WINDOW_DAYS,
} from '@/lib/control/maturity-calculator';
import { getCourseProgress } from '@/lib/data-service';
import { useScopedRouteHrefs } from '@/lib/navigation/use-scoped-route-hrefs';
import { registerFirstFlags } from '@/lib/register-first/flags';
import { registerService } from '@/lib/register-first/register-service';
import type { OrgSettings, UseCaseCard } from '@/lib/register-first/types';

interface ControlSnapshot {
  useCases: UseCaseCard[];
  orgSettings: OrgSettings | null;
  organisationName: string | null;
  capturedAt: Date;
}

function getControlPageCopy(locale: string) {
  if (locale === 'de') {
    return {
      title: 'Governance-Kontrollzentrum',
      reportTitle: 'Bericht',
      loadingFrameDescriptionReport: 'Ihr Bericht wird vorbereitet.',
      loadingFrameDescriptionControl:
        'Strukturierte Governance-Ebene für Reviews, Richtlinien, Exporte, Trust Portal und Academy.',
      loadingNextStepReport: 'Wir bereiten Ihren aktuellen Bericht vor.',
      loadingNextStepControl: 'Wir bereiten Ihre Governance-Ansicht vor.',
      loadingPanelTitleReport: 'Bericht wird geladen',
      loadingPanelTitleControl: 'Governance wird geladen',
      loadingPanelDescriptionReport:
        'Kennzahlen, Prioritäten und Reifegrad werden vorbereitet.',
      loadingPanelDescriptionControl:
        'Governance-Kennzahlen, Action Queue und Reifegrad werden vorbereitet.',
      frameDescriptionReportWithOrg:
        'Der aktuelle Bericht für {organisation}. Kennzahlen, Prioritäten und Reifegrad basieren direkt auf Ihrem Register.',
      frameDescriptionControlWithOrg:
        'Governance steuern für {organisation}. Reviews, Richtlinien, Exporte und Trust-Signale laufen hier zusammen.',
      frameDescriptionReport:
        'Ihr aktueller Bericht. Kennzahlen, Prioritäten und Reifegrad basieren direkt auf Ihrem Register.',
      frameDescriptionControl:
        'Governance steuern. Reviews, Richtlinien, Exporte und Trust-Signale laufen hier zusammen.',
      nextStepWithItemsReport:
        'Arbeiten Sie zuerst die offenen Punkte in Ihrem Register ab.',
      nextStepWithItemsControl:
        'Arbeiten Sie zuerst die priorisierten Governance-Aufgaben ab.',
      nextStepEmptyReport:
        'Halten Sie Dokumentation, Verantwortlichkeiten und Governance-Grundlagen aktuell.',
      nextStepEmptyControl:
        'Prüfen Sie Richtlinien, Exporte oder das Trust Portal als nächsten Governance-Schritt.',
      disabledTitleReport: 'Bericht ist noch nicht freigeschaltet',
      disabledTitleControl: 'Governance ist noch nicht freigeschaltet',
      disabledDescriptionReport:
        'Dieser Bericht ist für diesen Workspace noch nicht aktiviert.',
      disabledDescriptionControl:
        'Die Governance-Ebene ist für diesen Workspace noch nicht aktiviert.',
      inheritedContextTitle: 'Kontext aus dem Register übernommen',
      inheritedContextReport:
        'Einsatzfall {id} wurde als Kontext in den Bericht übernommen.',
      inheritedContextControl:
        'Einsatzfall {id} wurde als Kontext in Governance geöffnet.',
      loadingDataTitleReport: 'Berichtsdaten werden geladen',
      loadingDataTitleControl: 'Governance-Daten werden geladen',
      loadingDataDescription:
        'Kennzahlen, Aufgaben und Reifegrad werden geladen.',
      loadFailedTitleReport: 'Bericht konnte nicht geladen werden',
      loadFailedTitleControl: 'Governance konnte nicht geladen werden',
      fallbackKpiTitle: 'Kennzahlen',
      fallbackKpiDescription:
        'Kennzahlen erscheinen hier, sobald dieser Bereich verfügbar ist.',
      fallbackMaturityTitle: 'Governance-Reifegradmodell',
      fallbackMaturityDescription:
        'Die Reifegradübersicht erscheint hier, sobald dieser Bereich verfügbar ist.',
      prioritiesFromRegister: 'Prioritäten aus dem Register',
      reviewsAndQueue: 'Reviews / Action Queue',
      prioritiesDescription:
        'Was im Bericht als Nächstes Aufmerksamkeit braucht.',
      queueDescription:
        'Priorisierte Governance-Aufgaben und fällige Reviews an einem Ort.',
      priorities: 'Prioritäten',
      actionQueue: 'Action Queue',
      due: 'Fällig',
      overdue: 'Überfällig',
      keepReportCurrent: 'Bericht aktuell halten',
      academyProgress: 'Academy-Fortschritt',
      keepReportCurrentDescription:
        'Der Bericht bleibt belastbar, wenn Dokumentation und Zuständigkeiten laufend gepflegt werden.',
      academyProgressDescription:
        'Kurs- und Zertifizierungsfortschritt direkt aus der Governance-Ebene.',
      totalSystems: 'Systeme gesamt',
      withoutOwner: 'Ohne Owner',
      highRisk: 'Hochrisiko',
      completedLearningVideos: 'Abgeschlossene Lernvideos',
      academyStarted:
        '{percent}% abgeschlossen. Kurs und Prüfung bleiben aus Governance in einem Klick erreichbar.',
      academyNotStarted:
        'Noch kein Kursstart. Academy ist direkt erreichbar, sobald Ihr Team Governance-Training aufnimmt.',
      fallbackQueueDescription:
        'Die priorisierte Maßnahmenliste erscheint hier, sobald dieser Bereich verfügbar ist.',
      formulaTitle: 'Formel und Datengrundlage',
      formulaDescription:
        'Transparente, deterministische Berechnung ohne Blackbox.',
      governanceScoreFormula: 'Governance-Score (0-100)',
      governanceScoreFormulaDesc:
        '30% Dokumentation, 20% Owner-Coverage, 20% Review-Struktur, 15% Aufsichtsabdeckung, 15% Policy-Mapping.',
      isoReadinessFormula: 'ISO-Readiness (0-100)',
      isoReadinessFormulaDesc:
        '35% Review-Struktur, 25% Dokumentationslevel, 25% Aufsicht, 15% Audit-Historie.',
      levelThresholds: 'Level-Schwellenwerte',
      levelThresholdsLine:
        'Dokumentation {documentation}%, Owner {owner}%, Review {review}%, Policy {policy}%, Audit {audit}%, ISO-Readiness {iso}%.',
      currentSnapshot: 'Datengrundlage (aktueller Snapshot)',
      snapshotLine:
        'Systeme gesamt: {total}, mit Owner: {owner}, mit Review-Struktur: {review}, mit Policy-Mapping: {policy}, mit Audit-Historie: {audit}.',
      reviewWindowExplanation:
        'Review-Logik: "fällig" bedeutet nächstes Review innerhalb von {days} Tagen, "überfällig" bedeutet Datum in der Vergangenheit.',
    } as const;
  }

  return {
    title: 'Governance Control Center',
    reportTitle: 'Report',
    loadingFrameDescriptionReport: 'Your report is being prepared.',
    loadingFrameDescriptionControl:
      'Structured governance layer for reviews, policies, exports, Trust Portal and Academy.',
    loadingNextStepReport: 'We are preparing your current report.',
    loadingNextStepControl: 'We are preparing your governance view.',
    loadingPanelTitleReport: 'Loading report',
    loadingPanelTitleControl: 'Loading governance',
    loadingPanelDescriptionReport:
      'Metrics, priorities and maturity are being prepared.',
    loadingPanelDescriptionControl:
      'Governance metrics, action queue and maturity are being prepared.',
    frameDescriptionReportWithOrg:
      'The current report for {organisation}. Metrics, priorities and maturity are based directly on your register.',
    frameDescriptionControlWithOrg:
      'Governance for {organisation}. Reviews, policies, exports and trust signals come together here.',
    frameDescriptionReport:
      'Your current report. Metrics, priorities and maturity are based directly on your register.',
    frameDescriptionControl:
      'Governance in one place. Reviews, policies, exports and trust signals come together here.',
    nextStepWithItemsReport:
      'Work through the open points in your register first.',
    nextStepWithItemsControl:
      'Handle the prioritised governance tasks first.',
    nextStepEmptyReport:
      'Keep documentation, ownership and governance basics up to date.',
    nextStepEmptyControl:
      'Review policies, exports or the Trust Portal as your next governance step.',
    disabledTitleReport: 'Report not enabled yet',
    disabledTitleControl: 'Governance not enabled yet',
    disabledDescriptionReport:
      'This report is not yet enabled for this workspace.',
    disabledDescriptionControl:
      'The governance layer is not yet enabled for this workspace.',
    inheritedContextTitle: 'Context inherited from register',
    inheritedContextReport:
      'Use case {id} was carried into the report as context.',
    inheritedContextControl:
      'Use case {id} was opened in governance as context.',
    loadingDataTitleReport: 'Loading report data',
    loadingDataTitleControl: 'Loading governance data',
    loadingDataDescription: 'Loading metrics, tasks and maturity.',
    loadFailedTitleReport: 'Report could not be loaded',
    loadFailedTitleControl: 'Governance could not be loaded',
    fallbackKpiTitle: 'KPIs',
    fallbackKpiDescription:
      'Metrics will appear here once this section becomes available.',
    fallbackMaturityTitle: 'Governance Maturity Model',
    fallbackMaturityDescription:
      'The maturity overview will appear here once this section becomes available.',
    prioritiesFromRegister: 'Priorities from register',
    reviewsAndQueue: 'Reviews / Action Queue',
    prioritiesDescription: 'What needs attention next in the report.',
    queueDescription:
      'Prioritised governance tasks and due reviews in one place.',
    priorities: 'Priorities',
    actionQueue: 'Action Queue',
    due: 'Due',
    overdue: 'Overdue',
    keepReportCurrent: 'Keep report current',
    academyProgress: 'Academy progress',
    keepReportCurrentDescription:
      'The report stays reliable when documentation and ownership are maintained continuously.',
    academyProgressDescription:
      'Course and certification progress directly from the governance layer.',
    totalSystems: 'Total systems',
    withoutOwner: 'Without owner',
    highRisk: 'High risk',
    completedLearningVideos: 'Completed learning videos',
    academyStarted:
      '{percent}% completed. Course and assessment remain one click away from governance.',
    academyNotStarted:
      'No course started yet. The Academy is directly available as soon as your team begins governance training.',
    fallbackQueueDescription:
      'The prioritised action list will appear here once this section becomes available.',
    formulaTitle: 'Formula and data basis',
    formulaDescription:
      'Transparent, deterministic calculation without a black box.',
    governanceScoreFormula: 'Governance Score (0-100)',
    governanceScoreFormulaDesc:
      '30% documentation, 20% owner coverage, 20% review structure, 15% oversight coverage, 15% policy mapping.',
    isoReadinessFormula: 'ISO Readiness (0-100)',
    isoReadinessFormulaDesc:
      '35% review structure, 25% documentation level, 25% oversight, 15% audit history.',
    levelThresholds: 'Level thresholds',
    levelThresholdsLine:
      'Documentation {documentation}%, owner {owner}%, review {review}%, policy {policy}%, audit {audit}%, ISO Readiness {iso}%.',
    currentSnapshot: 'Data basis (current snapshot)',
    snapshotLine:
      'Total systems: {total}, with owner: {owner}, with review structure: {review}, with policy mapping: {policy}, with audit history: {audit}.',
    reviewWindowExplanation:
      'Review logic: "due" means next review within {days} days, "overdue" means the date is in the past.',
  } as const;
}

export default function ControlPage() {
  const locale = useLocale();
  const t = useTranslations();
  const copy = useMemo(() => getControlPageCopy(locale), [locale]);
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopedHrefs = useScopedRouteHrefs();
  const { plan, allowed: canOpenReviews, loading: entitlementLoading } =
    useCapability('reviewWorkflow');
  const canOpenExports = checkCapability(plan, 'auditExport');
  const canOpenAcademy = checkCapability(plan, 'competencyMatrix');
  const isReportOnlyMode = !entitlementLoading && !canOpenReviews;
  const frameArea = isReportOnlyMode
    ? 'signed_in_free_register'
    : 'paid_governance_control';
  // Report mode still lives on /control, but the brand should return to the source register.
  const headerBrandHref = isReportOnlyMode ? scopedHrefs.register : undefined;

  const [snapshot, setSnapshot] = useState<ControlSnapshot | null>(null);
  const [academyProgress, setAcademyProgress] = useState(() =>
    buildAcademyProgressSnapshot([]),
  );
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  const loadControlSnapshot = useCallback(async () => {
    setIsDataLoading(true);
    setDataError(null);

    try {
      const [useCases, registers, completedCourseVideos] = await Promise.all([
        registerService.listUseCases(undefined, { includeDeleted: false }),
        registerService.listRegisters().catch(() => []),
        getCourseProgress().catch(() => []),
      ]);

      const register = registers[0] ?? null;
      setSnapshot({
        useCases,
        orgSettings: register?.orgSettings ?? null,
        organisationName: register?.organisationName ?? null,
        capturedAt: new Date(),
      });
      setAcademyProgress(buildAcademyProgressSnapshot(completedCourseVideos));
    } catch (error) {
      console.error('Failed to load control snapshot', error);
      setDataError(t('control.errors.reportLoadFailed'));
    } finally {
      setIsDataLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!loading && user && registerFirstFlags.controlShell) {
      void loadControlSnapshot();
    }
  }, [loading, user, loadControlSnapshot]);

  const overview = useMemo(() => {
    if (!snapshot) return null;
    return calculateControlOverview(
      snapshot.useCases,
      snapshot.orgSettings,
      snapshot.capturedAt,
      locale,
    );
  }, [locale, snapshot]);

  const actionQueue = useMemo(() => {
    if (!snapshot) return [];
    return buildControlActionQueue(snapshot.useCases, snapshot.capturedAt);
  }, [snapshot]);

  const focusedUseCaseId = searchParams?.get('useCaseId') ?? null;
  const entry = searchParams?.get('entry') ?? 'direct';
  const triggerIds = useMemo(() => {
    const value = searchParams?.get('triggerIds');
    if (!value) return [];
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }, [searchParams]);

  useEffect(() => {
    if (!registerFirstFlags.controlAnalytics) return;
    if (loading || !user || !registerFirstFlags.controlShell) return;

    trackControlOpened({
      route: 'control_overview',
      entry,
    });

    if (entry === 'trigger') {
      trackControlConversion({
        source: 'register_trigger',
        triggerIds,
      });
    }
  }, [loading, user, entry, triggerIds]);

  useEffect(() => {
    if (!registerFirstFlags.controlAnalytics) return;
    if (!overview || !registerFirstFlags.controlShell) return;

    syncMaturityLevel(overview.maturity.currentLevel, {
      route: 'control_overview',
    });
  }, [overview]);

  useEffect(() => {
    if (!registerFirstFlags.controlAnalytics) return;
    if (!registerFirstFlags.controlShell) return;

    syncRecommendationProgress(
      actionQueue.map((item) => item.id),
      { route: 'control_overview' },
    );
  }, [actionQueue]);

  if (loading || entitlementLoading) {
    return (
      <SignedInAreaFrame
        area={frameArea}
        brandHref={headerBrandHref}
        title={isReportOnlyMode ? copy.reportTitle : copy.title}
        description={
          isReportOnlyMode
            ? copy.loadingFrameDescriptionReport
            : copy.loadingFrameDescriptionControl
        }
        nextStep={
          isReportOnlyMode
            ? copy.loadingNextStepReport
            : copy.loadingNextStepControl
        }
      >
        <PageStatePanel
          tone="loading"
          area={frameArea}
          title={
            isReportOnlyMode
              ? copy.loadingPanelTitleReport
              : copy.loadingPanelTitleControl
          }
          description={
            isReportOnlyMode
              ? copy.loadingPanelDescriptionReport
              : copy.loadingPanelDescriptionControl
          }
        />
      </SignedInAreaFrame>
    );
  }

  if (!user) return null;

  return (
    <SignedInAreaFrame
      area={frameArea}
      brandHref={headerBrandHref}
      title={isReportOnlyMode ? copy.reportTitle : copy.title}
      description={
        snapshot?.organisationName
          ? isReportOnlyMode
            ? copy.frameDescriptionReportWithOrg.replace(
                '{organisation}',
                snapshot.organisationName,
              )
            : copy.frameDescriptionControlWithOrg.replace(
                '{organisation}',
                snapshot.organisationName,
              )
          : isReportOnlyMode
            ? copy.frameDescriptionReport
            : copy.frameDescriptionControl
      }
      nextStep={
        actionQueue.length > 0
          ? isReportOnlyMode
            ? copy.nextStepWithItemsReport
            : copy.nextStepWithItemsControl
          : isReportOnlyMode
            ? copy.nextStepEmptyReport
            : copy.nextStepEmptyControl
      }
    >
      <div className="space-y-6">
        {!registerFirstFlags.controlShell ? (
          <PageStatePanel
            area={frameArea}
            title={
              isReportOnlyMode
                ? copy.disabledTitleReport
                : copy.disabledTitleControl
            }
            description={
              isReportOnlyMode
                ? copy.disabledDescriptionReport
                : copy.disabledDescriptionControl
            }
            actions={
              <Button asChild>
                <Link href={scopedHrefs.register}>{t('settings.toRegister')}</Link>
              </Button>
            }
          />
        ) : (
          <>
            {focusedUseCaseId && (
              <PageStatePanel
                area={frameArea}
                title={copy.inheritedContextTitle}
                description={
                  isReportOnlyMode
                    ? copy.inheritedContextReport.replace(
                        '{id}',
                        focusedUseCaseId,
                      )
                    : copy.inheritedContextControl.replace(
                        '{id}',
                        focusedUseCaseId,
                      )
                }
              />
            )}

            {isDataLoading && !overview && (
              <PageStatePanel
                tone="loading"
                area={frameArea}
                title={
                  isReportOnlyMode
                    ? copy.loadingDataTitleReport
                    : copy.loadingDataTitleControl
                }
                description={copy.loadingDataDescription}
              />
            )}

            {dataError && (
              <PageStatePanel
                tone="error"
                area={frameArea}
                title={
                  isReportOnlyMode
                    ? copy.loadFailedTitleReport
                    : copy.loadFailedTitleControl
                }
                description={dataError}
              />
            )}

            {overview && (
              <>
                {registerFirstFlags.controlKpiHeader ? (
                  <ControlKpiHeader
                    snapshot={overview.kpis}
                    capturedAt={snapshot?.capturedAt ?? new Date()}
                  />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>{copy.fallbackKpiTitle}</CardTitle>
                      <CardDescription>
                        {copy.fallbackKpiDescription}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )}

                {registerFirstFlags.controlMaturityModel ? (
                  <ControlMaturityPanel maturity={overview.maturity} />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>{copy.fallbackMaturityTitle}</CardTitle>
                      <CardDescription>
                        {copy.fallbackMaturityDescription}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )}

                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {isReportOnlyMode
                          ? copy.prioritiesFromRegister
                          : copy.reviewsAndQueue}
                      </CardTitle>
                      <CardDescription>
                        {isReportOnlyMode
                          ? copy.prioritiesDescription
                          : copy.queueDescription}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-md border p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            {isReportOnlyMode
                              ? copy.priorities
                              : copy.actionQueue}
                          </p>
                          <p className="mt-1 text-2xl font-semibold">
                            {actionQueue.length}
                          </p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            {copy.due}
                          </p>
                          <p className="mt-1 text-2xl font-semibold">
                            {overview.kpis.reviewsDue}
                          </p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            {copy.overdue}
                          </p>
                          <p className="mt-1 text-2xl font-semibold">
                            {overview.kpis.reviewsOverdue}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {canOpenReviews ? (
                          <Button asChild>
                            <Link href={scopedHrefs.controlReviews}>
                              {t('control.reviews')}
                            </Link>
                          </Button>
                        ) : (
                          <Button asChild>
                            <Link href={scopedHrefs.register}>
                              {t('settings.toRegister')}
                            </Link>
                          </Button>
                        )}
                        <Button asChild variant="outline">
                          <Link href={scopedHrefs.governanceSettings}>
                            {t('governance.settings')}
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {isReportOnlyMode
                          ? copy.keepReportCurrent
                          : copy.academyProgress}
                      </CardTitle>
                      <CardDescription>
                        {isReportOnlyMode
                          ? copy.keepReportCurrentDescription
                          : copy.academyProgressDescription}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {isReportOnlyMode ? (
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-md border p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              {copy.totalSystems}
                            </p>
                            <p className="mt-1 text-2xl font-semibold">
                              {overview.kpis.totalSystems}
                            </p>
                          </div>
                          <div className="rounded-md border p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              {copy.withoutOwner}
                            </p>
                            <p className="mt-1 text-2xl font-semibold">
                              {overview.kpis.systemsWithoutOwner}
                            </p>
                          </div>
                          <div className="rounded-md border p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              {copy.highRisk}
                            </p>
                            <p className="mt-1 text-2xl font-semibold">
                              {overview.kpis.highRiskCount}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {copy.completedLearningVideos}
                            </span>
                            <span className="font-medium">
                              {academyProgress.completedVideos}/
                              {academyProgress.totalVideos}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100">
                            <div
                              className="h-2 rounded-full bg-slate-900 transition-all"
                              style={{
                                width: `${academyProgress.completionPercent}%`,
                              }}
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {academyProgress.started
                              ? copy.academyStarted.replace(
                                  '{percent}',
                                  String(academyProgress.completionPercent),
                                )
                              : copy.academyNotStarted}
                          </p>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {canOpenAcademy ? (
                          <Button asChild>
                            <Link href={scopedHrefs.academy}>
                              {t('control.academy')}
                            </Link>
                          </Button>
                        ) : (
                          <Button asChild>
                            <Link href={scopedHrefs.register}>
                              {t('settings.toRegister')}
                            </Link>
                          </Button>
                        )}
                        {canOpenExports ? (
                          <Button asChild variant="outline">
                            <Link href={scopedHrefs.controlExports}>
                              {t('control.exports')}
                            </Link>
                          </Button>
                        ) : (
                          <Button asChild variant="outline">
                            <Link href={scopedHrefs.governanceSettings}>
                              {t('governance.settings')}
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {registerFirstFlags.controlActionQueue ? (
                  <ActionQueue recommendations={actionQueue} />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {isReportOnlyMode
                          ? copy.priorities
                          : copy.actionQueue}
                      </CardTitle>
                      <CardDescription>
                        {copy.fallbackQueueDescription}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>{copy.formulaTitle}</CardTitle>
                    <CardDescription>
                      {copy.formulaDescription}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-md border p-3 text-sm">
                        <p className="font-medium">
                          {copy.governanceScoreFormula}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {copy.governanceScoreFormulaDesc}
                        </p>
                      </div>
                      <div className="rounded-md border p-3 text-sm">
                        <p className="font-medium">
                          {copy.isoReadinessFormula}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {copy.isoReadinessFormulaDesc}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-md border p-3 text-sm">
                      <p className="font-medium">{copy.levelThresholds}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {copy.levelThresholdsLine
                          .replace(
                            '{documentation}',
                            String(
                              CONTROL_MATURITY_THRESHOLDS.documentationCoverage,
                            ),
                          )
                          .replace(
                            '{owner}',
                            String(CONTROL_MATURITY_THRESHOLDS.ownerCoverage),
                          )
                          .replace(
                            '{review}',
                            String(CONTROL_MATURITY_THRESHOLDS.reviewCoverage),
                          )
                          .replace(
                            '{policy}',
                            String(CONTROL_MATURITY_THRESHOLDS.policyCoverage),
                          )
                          .replace(
                            '{audit}',
                            String(CONTROL_MATURITY_THRESHOLDS.auditCoverage),
                          )
                          .replace(
                            '{iso}',
                            String(CONTROL_MATURITY_THRESHOLDS.isoReadiness),
                          )}
                      </p>
                    </div>

                    <div className="rounded-md border p-3 text-sm">
                      <p className="font-medium">{copy.currentSnapshot}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {copy.snapshotLine
                          .replace(
                            '{total}',
                            String(overview.maturity.dataBasis.totalSystems),
                          )
                          .replace(
                            '{owner}',
                            String(overview.maturity.dataBasis.systemsWithOwner),
                          )
                          .replace(
                            '{review}',
                            String(
                              overview.maturity.dataBasis
                                .systemsWithReviewStructure,
                            ),
                          )
                          .replace(
                            '{policy}',
                            String(
                              overview.maturity.dataBasis
                                .systemsWithPolicyMapping,
                            ),
                          )
                          .replace(
                            '{audit}',
                            String(
                              overview.maturity.dataBasis.systemsWithAuditHistory,
                            ),
                          )}
                      </p>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {copy.reviewWindowExplanation.replace(
                        '{days}',
                        String(CONTROL_REVIEW_DUE_WINDOW_DAYS),
                      )}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </SignedInAreaFrame>
  );
}
