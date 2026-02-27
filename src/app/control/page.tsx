"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Shield } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { ActionQueue } from "@/components/control/action-queue";
import { ControlKpiHeader } from "@/components/control/control-kpi-header";
import { ControlMaturityPanel } from "@/components/control/control-maturity-panel";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildControlActionQueue } from "@/lib/control/action-queue-engine";
import {
  calculateControlOverview,
  CONTROL_MATURITY_THRESHOLDS,
  CONTROL_REVIEW_DUE_WINDOW_DAYS,
} from "@/lib/control/maturity-calculator";
import { registerFirstFlags } from "@/lib/register-first/flags";
import { registerService } from "@/lib/register-first/register-service";
import type { OrgSettings, UseCaseCard } from "@/lib/register-first/types";

interface ControlSnapshot {
  useCases: UseCaseCard[];
  orgSettings: OrgSettings | null;
  organisationName: string | null;
  capturedAt: Date;
}

export default function ControlPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [snapshot, setSnapshot] = useState<ControlSnapshot | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  const loadControlSnapshot = useCallback(async () => {
    setIsDataLoading(true);
    setDataError(null);

    try {
      const [useCases, registers] = await Promise.all([
        registerService.listUseCases(undefined, { includeDeleted: false }),
        registerService.listRegisters().catch(() => []),
      ]);

      const register = registers[0] ?? null;
      setSnapshot({
        useCases,
        orgSettings: register?.orgSettings ?? null,
        organisationName: register?.organisationName ?? null,
        capturedAt: new Date(),
      });
    } catch (error) {
      console.error("Failed to load control snapshot", error);
      setDataError(
        "Control-Daten konnten nicht geladen werden. Bitte oeffnen Sie zuerst ein Register und versuchen Sie es erneut."
      );
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
    return calculateControlOverview(snapshot.useCases, snapshot.orgSettings, snapshot.capturedAt);
  }, [snapshot]);

  const actionQueue = useMemo(() => {
    if (!snapshot) return [];
    return buildControlActionQueue(snapshot.useCases, snapshot.capturedAt);
  }, [snapshot]);

  const focusedUseCaseId = searchParams.get("useCaseId");

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col">
        <AppHeader />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {!registerFirstFlags.controlShell ? (
            <Card>
              <CardHeader>
                <CardTitle>AI Governance Control ist noch nicht freigeschaltet</CardTitle>
                <CardDescription>
                  Die technische Route ist vorbereitet. Bis zur Freigabe arbeiten Sie weiter im AI Governance Register.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/dashboard">Zurück zum Register</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/my-register">Register öffnen</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      AI Governance Control
                    </CardTitle>
                    <CardDescription>
                      {snapshot?.organisationName
                        ? `System of Control fuer ${snapshot.organisationName}.`
                        : "System of Control fuer organisationsweite Governance-Steuerung."}
                    </CardDescription>
                  </div>
                  <Button asChild variant="outline">
                    <Link href="/dashboard">Zurueck zum Register</Link>
                  </Button>
                </CardHeader>
                {focusedUseCaseId && (
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground">
                      Kontext aus Register uebernommen: Use Case `{focusedUseCaseId}`.
                    </p>
                  </CardContent>
                )}
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Control-Bereiche</CardTitle>
                  <CardDescription>
                    Bereichsnavigation fuer organisationsweite Steuerungsansichten.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {registerFirstFlags.controlPortfolioIntelligence ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href="/control/portfolio">Portfolio Intelligence</Link>
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Portfolio Intelligence ist vorbereitet und per Feature-Flag aktivierbar.
                    </p>
                  )}
                </CardContent>
              </Card>

              {isDataLoading && !overview && (
                <Card>
                  <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Control-Daten werden geladen.
                  </CardContent>
                </Card>
              )}

              {dataError && (
                <Card>
                  <CardContent className="py-6 text-sm text-muted-foreground">{dataError}</CardContent>
                </Card>
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
                          Die KPI-Ansicht ist vorbereitet und kann per Feature-Flag aktiviert werden.
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
                          Das Maturity-Panel ist vorbereitet und kann per Feature-Flag aktiviert werden.
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  )}

                  {registerFirstFlags.controlActionQueue ? (
                    <ActionQueue recommendations={actionQueue} />
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>Action Queue</CardTitle>
                        <CardDescription>
                          Die priorisierte Maßnahmenliste ist vorbereitet und kann per
                          Feature-Flag aktiviert werden.
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
                            30% Dokumentation, 20% Owner-Coverage, 20% Review-Struktur,
                            15% Aufsichtsabdeckung, 15% Policy-Mapping.
                          </p>
                        </div>
                        <div className="rounded-md border p-3 text-sm">
                          <p className="font-medium">ISO-Readiness (0-100)</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            35% Review-Struktur, 25% Dokumentationslevel, 25% Aufsicht,
                            15% Audit-Historie.
                          </p>
                        </div>
                      </div>

                      <div className="rounded-md border p-3 text-sm">
                        <p className="font-medium">Level-Schwellenwerte</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Dokumentation {CONTROL_MATURITY_THRESHOLDS.documentationCoverage}%,
                          Owner {CONTROL_MATURITY_THRESHOLDS.ownerCoverage}%,
                          Review {CONTROL_MATURITY_THRESHOLDS.reviewCoverage}%,
                          Policy {CONTROL_MATURITY_THRESHOLDS.policyCoverage}%,
                          Audit {CONTROL_MATURITY_THRESHOLDS.auditCoverage}%,
                          ISO-Readiness {CONTROL_MATURITY_THRESHOLDS.isoReadiness}%.
                        </p>
                      </div>

                      <div className="rounded-md border p-3 text-sm">
                        <p className="font-medium">Datengrundlage (aktueller Snapshot)</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Systeme gesamt: {overview.maturity.dataBasis.totalSystems}, mit Owner:{" "}
                          {overview.maturity.dataBasis.systemsWithOwner}, mit Review-Struktur:{" "}
                          {overview.maturity.dataBasis.systemsWithReviewStructure}, mit Policy-Mapping:{" "}
                          {overview.maturity.dataBasis.systemsWithPolicyMapping}, mit Audit-Historie:{" "}
                          {overview.maturity.dataBasis.systemsWithAuditHistory}.
                        </p>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Review-Logik: "faellig" bedeutet naechstes Review innerhalb von{" "}
                        {CONTROL_REVIEW_DUE_WINDOW_DAYS} Tagen, "ueberfaellig" bedeutet Datum in der
                        Vergangenheit.
                      </p>
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
