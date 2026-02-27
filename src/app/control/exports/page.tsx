"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { ControlExportCenter } from "@/components/control/control-export-center";
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
import {
  buildOrgExportArtifacts,
  type OrgExportArtifact,
} from "@/lib/control/exports/org-export-center";
import { policyService } from "@/lib/policy-engine";
import type { PolicyDocument } from "@/lib/policy-engine/types";
import { registerFirstFlags } from "@/lib/register-first/flags";
import { registerService } from "@/lib/register-first/register-service";
import type { OrgSettings, UseCaseCard } from "@/lib/register-first/types";

interface ExportSnapshot {
  useCases: UseCaseCard[];
  registerId: string | null;
  orgSettings: OrgSettings | null;
  organisationName: string | null;
  capturedAt: Date;
}

export default function ControlExportsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [snapshot, setSnapshot] = useState<ExportSnapshot | null>(null);
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
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
      route: "control_exports",
      entry: "direct",
    });
  }, [loading, user]);

  const loadExportData = useCallback(async () => {
    setIsDataLoading(true);
    setDataError(null);

    try {
      const registers = await registerService.listRegisters().catch(() => []);
      const register = registers[0] ?? null;
      const registerId = register?.registerId ?? null;

      const useCases = registerId
        ? await registerService.listUseCases(registerId, { includeDeleted: false }).catch(() => [])
        : [];

      const loadedPolicies = registerId
        ? await policyService.listPolicies(registerId).catch(() => [])
        : [];

      setSnapshot({
        useCases,
        registerId,
        orgSettings: register?.orgSettings ?? null,
        organisationName: register?.organisationName ?? null,
        capturedAt: new Date(),
      });
      setPolicies(loadedPolicies);
    } catch (error) {
      console.error("Failed to load control export data", error);
      setDataError(
        "Export-Daten konnten nicht geladen werden. Bitte oeffnen Sie ein Register und versuchen Sie es erneut."
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
      registerFirstFlags.controlOrgExportCenter
    ) {
      void loadExportData();
    }
  }, [loading, user, loadExportData]);

  const artifacts: OrgExportArtifact[] = useMemo(() => {
    if (!snapshot) return [];
    return buildOrgExportArtifacts({
      useCases: snapshot.useCases,
      orgSettings: snapshot.orgSettings,
      organisationName: snapshot.organisationName,
      policies,
      now: snapshot.capturedAt,
    });
  }, [snapshot, policies]);

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
                  Das Organisations-Export-Center ist vorbereitet und bleibt bis zur Freigabe verborgen.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/dashboard">Zurueck zum Register</Link>
                </Button>
              </CardContent>
            </Card>
          ) : !registerFirstFlags.controlOrgExportCenter ? (
            <Card>
              <CardHeader>
                <CardTitle>Organisations-Export-Center ist vorbereitet</CardTitle>
                <CardDescription>
                  Der Bereich kann ueber das Feature-Flag `controlOrgExportCenter` aktiviert werden.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <Link href="/control">Zurueck zu Control</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/dashboard">Zurueck zum Register</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle>Control Bereich: Organisations-Export-Center</CardTitle>
                    <CardDescription>
                      {snapshot?.organisationName
                        ? `Org-weite Exporte fuer ${snapshot.organisationName}.`
                        : "Org-weite Exporte fuer Audit, Reporting und Nachweis."}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href="/control">Zurueck zu Control</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard">Zurueck zum Register</Link>
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {isDataLoading && !snapshot && (
                <Card>
                  <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Export-Daten werden geladen.
                  </CardContent>
                </Card>
              )}

              {dataError && (
                <Card>
                  <CardContent className="py-6 text-sm text-muted-foreground">{dataError}</CardContent>
                </Card>
              )}

              {snapshot && (
                <ControlExportCenter
                  artifacts={artifacts}
                  generatedAt={snapshot.capturedAt}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
