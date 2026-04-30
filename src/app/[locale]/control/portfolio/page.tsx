"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { PortfolioIntelligence } from "@/components/control/portfolio-intelligence";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trackControlOpened } from "@/lib/analytics/control-events";
import { buildPortfolioMetrics } from "@/lib/control/portfolio-metrics";
import { useScopedRouteHrefs } from "@/lib/navigation/use-scoped-route-hrefs";
import { registerFirstFlags } from "@/lib/register-first/flags";
import { registerService } from "@/lib/register-first/register-service";
import type { UseCaseCard } from "@/lib/register-first/types";

interface PortfolioSnapshot {
  useCases: UseCaseCard[];
  capturedAt: Date;
  organisationName: string | null;
}

export default function ControlPortfolioPage() {
  const { user, loading } = useAuth();
  const locale = useLocale();
  const router = useRouter();
  const scopedHrefs = useScopedRouteHrefs();

  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!registerFirstFlags.controlAnalytics) return;
    if (loading || !user || !registerFirstFlags.controlShell) return;
    trackControlOpened({
      route: "control_portfolio",
      entry: "direct",
    });
  }, [loading, user]);

  const loadPortfolioData = useCallback(async () => {
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
        capturedAt: new Date(),
        organisationName: register?.organisationName ?? null,
      });
    } catch (error) {
      console.error("Failed to load portfolio intelligence data", error);
      setDataError(
        locale === "de"
          ? "Portfolio Intelligence konnte nicht geladen werden. Bitte öffnen Sie ein Register und versuchen Sie es erneut."
          : "Portfolio Intelligence could not be loaded. Please open a register and try again."
      );
    } finally {
      setIsDataLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    if (!loading && user && registerFirstFlags.controlShell) {
      void loadPortfolioData();
    }
  }, [loading, user, loadPortfolioData]);

  const metrics = useMemo(() => {
    if (!snapshot) return null;
    return buildPortfolioMetrics(snapshot.useCases, snapshot.capturedAt, locale);
  }, [snapshot, locale]);

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
                <CardTitle>{locale === "de" ? "AI Governance Control ist nicht freigeschaltet" : "AI Governance Control is not enabled"}</CardTitle>
                <CardDescription>
                  {locale === "de"
                    ? "Die Portfolio-Ansicht ist für diesen Workspace noch nicht freigeschaltet."
                    : "The portfolio view is not enabled for this workspace yet."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href={scopedHrefs.register}>{locale === "de" ? "Zurück zum Register" : "Back to register"}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : !registerFirstFlags.controlPortfolioIntelligence ? (
            <Card>
              <CardHeader>
                <CardTitle>{locale === "de" ? "Portfolio Intelligence folgt in Kürze" : "Portfolio Intelligence coming soon"}</CardTitle>
                <CardDescription>
                  {locale === "de"
                    ? "Die Portfolio-Ansicht wird aktuell erweitert und steht bald bereit."
                    : "The portfolio view is being extended and will be available soon."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <Link href={scopedHrefs.control}>{locale === "de" ? "Zurück zu Control" : "Back to Control"}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={scopedHrefs.register}>{locale === "de" ? "Zurück zum Register" : "Back to register"}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle>{locale === "de" ? "Control Bereich: Portfolio Intelligence" : "Control Area: Portfolio Intelligence"}</CardTitle>
                    <CardDescription>
                      {snapshot?.organisationName
                        ? locale === "de"
                          ? `Org-weite Analyse für ${snapshot.organisationName}.`
                          : `Organisation-wide analysis for ${snapshot.organisationName}.`
                        : locale === "de"
                          ? "Org-weite Risiko-, Owner- und Statusanalyse."
                          : "Organisation-wide risk, owner and status analysis."}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={scopedHrefs.control}>{locale === "de" ? "Zurück zu Control" : "Back to Control"}</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={scopedHrefs.register}>{locale === "de" ? "Zurück zum Register" : "Back to register"}</Link>
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {isDataLoading && !metrics && (
                <Card>
                  <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {locale === "de" ? "Portfolio-Daten werden geladen." : "Loading portfolio data."}
                  </CardContent>
                </Card>
              )}

              {dataError && (
                <Card>
                  <CardContent className="py-6 text-sm text-muted-foreground">{dataError}</CardContent>
                </Card>
              )}

              {metrics && snapshot && (
                <PortfolioIntelligence metrics={metrics} capturedAt={snapshot.capturedAt} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
