"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

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
        "Audit-Daten konnten nicht geladen werden. Bitte oeffnen Sie ein Register und versuchen Sie es erneut."
      );
    } finally {
      setIsDataLoading(false);
    }
  }, []);

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
    return buildOrgAuditLayer(snapshot.useCases, snapshot.orgSettings, snapshot.capturedAt);
  }, [snapshot]);

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
                <CardTitle>AI Governance Control ist nicht freigeschaltet</CardTitle>
                <CardDescription>
                  Die Audit-Route ist vorbereitet und bleibt bis zur Freigabe verborgen.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/my-register">Zurueck zum Register</Link>
                </Button>
              </CardContent>
            </Card>
          ) : !registerFirstFlags.controlIsoAudit ? (
            <Card>
              <CardHeader>
                <CardTitle>ISO & Audit Layer ist vorbereitet</CardTitle>
                <CardDescription>
                  Der Bereich kann ueber das Feature-Flag `controlIsoAudit` aktiviert werden.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <Link href="/control">Zurueck zu Control</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/my-register">Zurueck zum Register</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle>Control Bereich: ISO & Audit Layer</CardTitle>
                    <CardDescription>
                      {snapshot?.organisationName
                        ? `Org-weite Auditsteuerung fuer ${snapshot.organisationName}.`
                        : "Org-weite Auditsteuerung und revisionssichere Historie."}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href="/control">Zurueck zu Control</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/my-register">Zurueck zum Register</Link>
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {isDataLoading && !auditLayer && (
                <Card>
                  <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Audit-Daten werden geladen.
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
