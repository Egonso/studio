"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { ControlPolicyEngine } from "@/components/control/control-policy-engine";
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
  buildControlPolicyCoverage,
  buildDeterministicPolicyPreview,
} from "@/lib/control/policy/coverage";
import { policyService } from "@/lib/policy-engine";
import type { PolicyDocument, PolicyLevel } from "@/lib/policy-engine/types";
import { registerFirstFlags } from "@/lib/register-first/flags";
import { registerService } from "@/lib/register-first/register-service";
import type { OrgSettings, Register, UseCaseCard } from "@/lib/register-first/types";

interface PolicySnapshot {
  register: Register;
  useCases: UseCaseCard[];
  policies: PolicyDocument[];
  orgSettings: OrgSettings;
  capturedAt: Date;
}

function downloadMarkdown(content: string, fileName: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
}

function fallbackOrgSettings(register: Register): OrgSettings {
  return (
    register.orgSettings ?? {
      organisationName: register.organisationName || "Nicht hinterlegt",
      industry: "Nicht hinterlegt",
      contactPerson: {
        name: "Nicht hinterlegt",
        email: "not-configured@example.invalid",
      },
    }
  );
}

export default function ControlPoliciesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [snapshot, setSnapshot] = useState<PolicySnapshot | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<PolicyLevel>(2);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user && registerFirstFlags.controlShell && registerFirstFlags.controlAnalytics) {
      trackControlOpened({ route: "control_policies", entry: "direct" });
    }
  }, [loading, user]);

  const loadPolicyData = useCallback(async () => {
    setIsDataLoading(true);
    setDataError(null);

    try {
      const registers = await registerService.listRegisters().catch(() => []);
      const register = registers[0] ?? null;

      if (!register) {
        setSnapshot(null);
        return;
      }

      const [useCases, policies] = await Promise.all([
        registerService.listUseCases(register.registerId, { includeDeleted: false }).catch(() => []),
        policyService.listPolicies(register.registerId).catch(() => []),
      ]);

      setSnapshot({
        register,
        useCases,
        policies,
        orgSettings: fallbackOrgSettings(register),
        capturedAt: new Date(),
      });
    } catch (error) {
      console.error("Failed to load control policy data", error);
      setDataError(
        "Policy-Daten konnten nicht geladen werden. Bitte oeffnen Sie ein Register und versuchen Sie es erneut."
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
      registerFirstFlags.controlPolicyEngine
    ) {
      void loadPolicyData();
    }
  }, [loading, user, loadPolicyData]);

  const coverage = useMemo(() => {
    if (!snapshot) return null;
    return buildControlPolicyCoverage(snapshot.useCases, snapshot.policies);
  }, [snapshot]);

  const preview = useMemo(() => {
    if (!snapshot) return null;
    return buildDeterministicPolicyPreview(
      snapshot.register,
      snapshot.useCases,
      snapshot.orgSettings,
      selectedLevel,
      snapshot.capturedAt
    );
  }, [snapshot, selectedLevel]);

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
                  Der Policy-Bereich ist vorbereitet und bleibt bis zur Freigabe verborgen.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/my-register">Zurueck zum Register</Link>
                </Button>
              </CardContent>
            </Card>
          ) : !registerFirstFlags.controlPolicyEngine ? (
            <Card>
              <CardHeader>
                <CardTitle>Policy Engine ist vorbereitet</CardTitle>
                <CardDescription>
                  Der Bereich kann ueber das Feature-Flag `controlPolicyEngine` aktiviert werden.
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
                    <CardTitle>Control Bereich: Policy Engine</CardTitle>
                    <CardDescription>
                      {snapshot?.register.organisationName
                        ? `Policy-Steuerung fuer ${snapshot.register.organisationName}.`
                        : "Policy-Steuerung auf Organisationsebene."}
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

              {isDataLoading && !snapshot && (
                <Card>
                  <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Policy-Daten werden geladen.
                  </CardContent>
                </Card>
              )}

              {dataError && (
                <Card>
                  <CardContent className="py-6 text-sm text-muted-foreground">{dataError}</CardContent>
                </Card>
              )}

              {coverage && preview && (
                <ControlPolicyEngine
                  coverage={coverage}
                  preview={preview}
                  selectedLevel={selectedLevel}
                  onLevelChange={setSelectedLevel}
                  onExportPreview={() => {
                    const datePart = snapshot?.capturedAt.toISOString().slice(0, 10) ?? "policy";
                    downloadMarkdown(
                      preview.markdown,
                      `policy-preview-level-${selectedLevel}-${datePart}.md`
                    );
                  }}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
