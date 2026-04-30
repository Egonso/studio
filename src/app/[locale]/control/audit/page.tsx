"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { ControlAuditLayer } from "@/components/control/control-audit-layer";
import { useAuth } from "@/context/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trackControlOpened } from "@/lib/analytics/control-events";
import { buildOrgAuditLayer } from "@/lib/control/audit/org-audit-layer";
import { useScopedRouteHrefs } from "@/lib/navigation/use-scoped-route-hrefs";
import { registerFirstFlags } from "@/lib/register-first/flags";
import { registerService } from "@/lib/register-first/register-service";
import type { OrgSettings, UseCaseCard } from "@/lib/register-first/types";

interface AuditSnapshot {
  useCases: UseCaseCard[];
  orgSettings: OrgSettings | null;
  organisationName: string | null;
  capturedAt: Date;
}

export default function ControlAuditPage() {
  const { user, loading } = useAuth();
  const locale = useLocale();
  const router = useRouter();
  const scopedHrefs = useScopedRouteHrefs();

  const [snapshot, setSnapshot] = useState<AuditSnapshot | null>(null);
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
      route: "control_audit",
      entry: "direct",
    });
  }, [loading, user]);

  const loadAuditData = useCallback(async () => {
    setIsDataLoading(true);
    setDataError(null);

    try {
      const registers = await registerService.listRegisters().catch(() => []);
      const register = registers[0] ?? null;
      const registerId = register?.registerId;

      const useCases = registerId
        ? await registerService.listUseCases(registerId, { includeDeleted: false }).catch(() => [])
        : [];

      setSnapshot({
        useCases,
        orgSettings: register?.orgSettings ?? null,
        organisationName: register?.organisationName ?? null,
        capturedAt: new Date(),
      });
    } catch (error) {
      console.error("Failed to load control audit data", error);
      setDataError(
        locale === "de"
          ? "Audit-Daten konnten nicht geladen werden. Bitte öffnen Sie ein Register und versuchen Sie es erneut."
          : "Audit data could not be loaded. Please open a register and try again."
      );
    } finally {
      setIsDataLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    if (
      !loading &&
      user &&
      registerFirstFlags.controlShell &&
      registerFirstFlags.controlIsoAudit
    ) {
      void loadAuditData();
    }
  }, [loading, user, loadAuditData]);

  const auditLayer = useMemo(() => {
    if (!snapshot) return null;
    return buildOrgAuditLayer(
      snapshot.useCases,
      snapshot.orgSettings,
      snapshot.capturedAt,
      locale
    );
  }, [locale, snapshot]);

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
                    ? "Der Audit-Bereich ist für diesen Workspace noch nicht freigeschaltet."
                    : "The audit area is not enabled for this workspace yet."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href={scopedHrefs.register}>{locale === "de" ? "Zurück zum Register" : "Back to register"}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : !registerFirstFlags.controlIsoAudit ? (
            <Card>
              <CardHeader>
                <CardTitle>{locale === "de" ? "ISO & Audit Layer folgt in Kürze" : "ISO & Audit Layer coming soon"}</CardTitle>
                <CardDescription>
                  {locale === "de"
                    ? "Die Audit-Ansicht wird aktuell erweitert und steht bald bereit."
                    : "The audit view is being extended and will be available soon."}
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
                    <CardTitle>{locale === "de" ? "Control Bereich: ISO & Audit Layer" : "Control Area: ISO & Audit Layer"}</CardTitle>
                    <CardDescription>
                      {snapshot?.organisationName
                        ? locale === "de"
                          ? `Org-weite Auditsteuerung für ${snapshot.organisationName}.`
                          : `Organisation-wide audit controls for ${snapshot.organisationName}.`
                        : locale === "de"
                          ? "Org-weite Auditsteuerung und revisionssichere Historie."
                          : "Organisation-wide audit controls and immutable history."}
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

              {isDataLoading && !auditLayer && (
                <Card>
                  <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {locale === "de" ? "Audit-Daten werden geladen." : "Loading audit data."}
                  </CardContent>
                </Card>
              )}

              {dataError && (
                <Card>
                  <CardContent className="py-6 text-sm text-muted-foreground">{dataError}</CardContent>
                </Card>
              )}

              {auditLayer && <ControlAuditLayer snapshot={auditLayer} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
