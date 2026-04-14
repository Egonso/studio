'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
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

export default function ControlPage() {
  const t = useTranslations();
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
  }, []);

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
    );
  }, [snapshot]);

  const actionQueue = useMemo(() => {
    if (!snapshot) return [];
    return buildControlActionQueue(snapshot.useCases, snapshot.capturedAt);
  }, [snapshot]);

  const focusedUseCaseId = searchParams.get('useCaseId');
  const entry = searchParams.get('entry') ?? 'direct';
  const triggerIds = useMemo(() => {
    const value = searchParams.get('triggerIds');
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
        title={isReportOnlyMode ? t('nav.report') : t('control.title')}
        description={
          isReportOnlyMode
            ? 'Ihr Bericht wird vorbereitet.'
            : 'Strukturierte Governance-Ebene für Reviews, Policies, Exporte, Trust Portal und Academy.'
        }
        nextStep={
          isReportOnlyMode
            ? 'Wir bereiten Ihren aktuellen Bericht vor.'
            : 'Wir bereiten Ihre Governance-Ansicht vor.'
        }
      >
        <PageStatePanel
          tone="loading"
          area={frameArea}
          title={isReportOnlyMode ? 'Bericht wird geladen' : 'Control wird geladen'}
          description={
            isReportOnlyMode
              ? 'Kennzahlen, Prioritäten und Reifegrad werden vorbereitet.'
              : 'Governance-Kennzahlen, Action Queue und Reifegrad werden vorbereitet.'
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
      title={isReportOnlyMode ? t('nav.report') : t('control.title')}
      description={
        snapshot?.organisationName
          ? isReportOnlyMode
            ? `Der aktuelle Bericht für ${snapshot.organisationName}. Kennzahlen, Prioritäten und Reifegrad basieren direkt auf Ihrem Register.`
            : `Governance steuern für ${snapshot.organisationName}. Reviews, Policies, Exporte und Trust-Signale laufen hier zusammen.`
          : isReportOnlyMode
            ? 'Ihr aktueller Bericht. Kennzahlen, Prioritäten und Reifegrad basieren direkt auf Ihrem Register.'
            : 'Governance steuern. Reviews, Policies, Exporte und Trust-Signale laufen hier zusammen.'
      }
      nextStep={
        actionQueue.length > 0
          ? isReportOnlyMode
            ? 'Arbeiten Sie zuerst die offenen Punkte in Ihrem Register ab.'
            : 'Arbeiten Sie zuerst die priorisierten Governance-Aufgaben ab.'
          : isReportOnlyMode
            ? 'Halten Sie Dokumentation, Verantwortlichkeiten und Governance-Grundlagen aktuell.'
            : 'Prüfen Sie Policies, Exporte oder Trust Portal als nächsten Governance-Schritt.'
      }
    >
      <div className="space-y-6">
        {!registerFirstFlags.controlShell ? (
          <PageStatePanel
            area={frameArea}
            title={
              isReportOnlyMode
                ? 'Bericht ist noch nicht freigeschaltet'
                : 'Control ist noch nicht freigeschaltet'
            }
            description={
              isReportOnlyMode
                ? 'Dieser Bericht ist für diesen Workspace noch nicht aktiviert.'
                : 'Die Governance-Ebene ist für diesen Workspace noch nicht aktiviert.'
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
                title="Kontext aus dem Register übernommen"
                description={
                  isReportOnlyMode
                    ? `Use Case ${focusedUseCaseId} wurde als Kontext in den Bericht übernommen.`
                    : `Use Case ${focusedUseCaseId} wurde als Kontext in Control geöffnet.`
                }
              />
            )}

            {isDataLoading && !overview && (
              <PageStatePanel
                tone="loading"
                area={frameArea}
                title={
                  isReportOnlyMode
                    ? 'Berichtsdaten werden geladen'
                    : 'Governance-Daten werden geladen'
                }
                description="Kennzahlen, Aufgaben und Reifegrad werden geladen."
              />
            )}

            {dataError && (
              <PageStatePanel
                tone="error"
                area={frameArea}
                title={
                  isReportOnlyMode
                    ? 'Bericht konnte nicht geladen werden'
                    : 'Control konnte nicht geladen werden'
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
                      <CardTitle>KPI Header</CardTitle>
                      <CardDescription>
                        Kennzahlen erscheinen hier, sobald dieser Bereich
                        verfügbar ist.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )}

                {registerFirstFlags.controlMaturityModel ? (
                  <ControlMaturityPanel maturity={overview.maturity} />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Governance Maturity Model</CardTitle>
                      <CardDescription>
                        Die Reifegradübersicht erscheint hier, sobald dieser
                        Bereich verfügbar ist.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )}

                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {isReportOnlyMode
                          ? 'Prioritäten aus dem Register'
                          : 'Reviews / Action Queue'}
                      </CardTitle>
                      <CardDescription>
                        {isReportOnlyMode
                          ? 'Was im Bericht als Nächstes Aufmerksamkeit braucht.'
                          : 'Priorisierte Governance-Aufgaben und fällige Reviews an einem Ort.'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-md border p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            {isReportOnlyMode ? 'Prioritäten' : 'Action Queue'}
                          </p>
                          <p className="mt-1 text-2xl font-semibold">
                            {actionQueue.length}
                          </p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Fällig
                          </p>
                          <p className="mt-1 text-2xl font-semibold">
                            {overview.kpis.reviewsDue}
                          </p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Überfällig
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
                          ? 'Bericht aktuell halten'
                          : 'Academy-Fortschritt'}
                      </CardTitle>
                      <CardDescription>
                        {isReportOnlyMode
                          ? 'Der Bericht bleibt belastbar, wenn Dokumentation und Zuständigkeiten laufend gepflegt werden.'
                          : 'Kurs- und Zertifizierungsfortschritt direkt aus der Governance-Ebene.'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {isReportOnlyMode ? (
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-md border p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              Systeme gesamt
                            </p>
                            <p className="mt-1 text-2xl font-semibold">
                              {overview.kpis.totalSystems}
                            </p>
                          </div>
                          <div className="rounded-md border p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              Ohne Owner
                            </p>
                            <p className="mt-1 text-2xl font-semibold">
                              {overview.kpis.systemsWithoutOwner}
                            </p>
                          </div>
                          <div className="rounded-md border p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              Hochrisiko
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
                              Abgeschlossene Lernvideos
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
                              ? `${academyProgress.completionPercent}% abgeschlossen. Kurs und Prüfung bleiben aus Control in einem Klick erreichbar.`
                              : 'Noch kein Kursstart. Academy ist direkt erreichbar, sobald Ihr Team Governance-Training aufnimmt.'}
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
                        {isReportOnlyMode ? 'Prioritäten' : 'Action Queue'}
                      </CardTitle>
                      <CardDescription>
                        Die priorisierte Maßnahmenliste erscheint hier, sobald
                        dieser Bereich verfügbar ist.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Formel und Datengrundlage</CardTitle>
                    <CardDescription>
                      Transparente, deterministische Berechnung ohne Blackbox.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-md border p-3 text-sm">
                        <p className="font-medium">Governance Score (0-100)</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          30% Dokumentation, 20% Owner-Coverage, 20%
                          Review-Struktur, 15% Aufsichtsabdeckung, 15%
                          Policy-Mapping.
                        </p>
                      </div>
                      <div className="rounded-md border p-3 text-sm">
                        <p className="font-medium">ISO-Readiness (0-100)</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          35% Review-Struktur, 25% Dokumentationslevel, 25%
                          Aufsicht, 15% Audit-Historie.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-md border p-3 text-sm">
                      <p className="font-medium">Level-Schwellenwerte</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Dokumentation{' '}
                        {CONTROL_MATURITY_THRESHOLDS.documentationCoverage}%,
                        Owner {CONTROL_MATURITY_THRESHOLDS.ownerCoverage}%,
                        Review {CONTROL_MATURITY_THRESHOLDS.reviewCoverage}%,
                        Policy {CONTROL_MATURITY_THRESHOLDS.policyCoverage}%,
                        Audit {CONTROL_MATURITY_THRESHOLDS.auditCoverage}%,
                        ISO-Readiness {CONTROL_MATURITY_THRESHOLDS.isoReadiness}
                        %.
                      </p>
                    </div>

                    <div className="rounded-md border p-3 text-sm">
                      <p className="font-medium">
                        Datengrundlage (aktueller Snapshot)
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Systeme gesamt:{' '}
                        {overview.maturity.dataBasis.totalSystems}, mit Owner:{' '}
                        {overview.maturity.dataBasis.systemsWithOwner}, mit
                        Review-Struktur:{' '}
                        {overview.maturity.dataBasis.systemsWithReviewStructure}
                        , mit Policy-Mapping:{' '}
                        {overview.maturity.dataBasis.systemsWithPolicyMapping},
                        mit Audit-Historie:{' '}
                        {overview.maturity.dataBasis.systemsWithAuditHistory}.
                      </p>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Review-Logik: "faellig" bedeutet naechstes Review
                      innerhalb von {CONTROL_REVIEW_DUE_WINDOW_DAYS} Tagen,
                      "ueberfaellig" bedeutet Datum in der Vergangenheit.
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
