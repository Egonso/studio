'use client';

import Link from "next/link";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  ControlPolicyCoverageSnapshot,
  DeterministicPolicyPreview,
} from "@/lib/control/policy/coverage";
import type { PolicyLevel } from "@/lib/policy-engine/types";
import { appendWorkspaceScope } from "@/lib/navigation/workspace-scope";
import { useWorkspaceScope } from "@/lib/navigation/use-workspace-scope";

interface ControlPolicyEngineProps {
  coverage: ControlPolicyCoverageSnapshot;
  preview: DeterministicPolicyPreview;
  selectedLevel: PolicyLevel;
  onLevelChange: (level: PolicyLevel) => void;
  onExportPreview: () => void;
}

export function ControlPolicyEngine({
  coverage,
  preview,
  selectedLevel,
  onLevelChange,
  onExportPreview,
}: ControlPolicyEngineProps) {
  const workspaceScope = useWorkspaceScope();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Policy Engine</CardTitle>
          <CardDescription>
            Deterministische Policy-Abdeckung aus Registerdaten und Nachweis-Mapping auf Use Cases.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Policy Coverage</p>
            <p className="mt-1 text-2xl font-semibold">{coverage.coveragePercent}%</p>
            <p className="text-xs text-muted-foreground">
              {coverage.mappedUseCases}/{coverage.totalUseCases} Use Cases gemappt
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Policies gesamt</p>
            <p className="mt-1 text-2xl font-semibold">{coverage.policiesTotal}</p>
            <p className="text-xs text-muted-foreground">Genehmigt: {coverage.approvedPolicies}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Versionierte Policies</p>
            <p className="mt-1 text-2xl font-semibold">{coverage.policiesWithVersionHistory}</p>
            <p className="text-xs text-muted-foreground">mit Historie</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Orphan-Referenzen</p>
            <p className="mt-1 text-2xl font-semibold">{coverage.orphanMappingReferences}</p>
            <p className="text-xs text-muted-foreground">Policy-Links ohne passendes Dokument</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Policy Mapping und Versionierung</CardTitle>
          <CardDescription>
            Mapping von Richtlinien auf Use Cases inkl. Status und Dokumentversion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {coverage.rows.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Keine Policies hinterlegt.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/70">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Policy</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">Level</th>
                    <th className="px-3 py-2 text-right font-medium">Version</th>
                    <th className="px-3 py-2 text-right font-medium">Use Cases</th>
                  </tr>
                </thead>
                <tbody>
                  {coverage.rows.map((row) => (
                    <tr key={row.policyId} className="border-t">
                      <td className="px-3 py-2">
                        <p>{row.title}</p>
                        <p className="font-mono text-xs text-muted-foreground">{row.policyId}</p>
                      </td>
                      <td className="px-3 py-2">{row.status}</td>
                      <td className="px-3 py-2">{row.level}</td>
                      <td className="px-3 py-2 text-right font-mono">{row.version}</td>
                      <td className="px-3 py-2 text-right font-mono">{row.linkedUseCases}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ungemappte Use Cases</CardTitle>
          <CardDescription>
            Einsatzfaelle ohne Policy-Zuordnung fuer gezielte Nachpflege.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {coverage.unmapped.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Alle dokumentierten Use Cases sind einer Policy zugeordnet.
            </p>
          ) : (
            coverage.unmapped.slice(0, 25).map((entry) => (
              <div
                key={entry.useCaseId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2"
              >
                <div>
                  <p className="text-sm">{entry.purpose}</p>
                  <p className="font-mono text-xs text-muted-foreground">{entry.useCaseId}</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={appendWorkspaceScope(entry.deepLink, workspaceScope)}>
                    Mapping oeffnen
                  </Link>
                </Button>
              </div>
            ))
          )}
          {coverage.unmapped.length > 25 && (
            <p className="text-xs text-muted-foreground">
              Anzeige gekuerzt auf 25 Eintraege.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deterministische Policy-Generierung</CardTitle>
          <CardDescription>
            Policy-Preview wird ohne Blackbox aus Registerdaten erzeugt.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-muted-foreground" htmlFor="policy-level-select">
              Policy-Level
            </label>
            <select
              id="policy-level-select"
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={String(selectedLevel)}
              onChange={(event) => onLevelChange(Number(event.target.value) as PolicyLevel)}
            >
              <option value="1">Level 1</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3</option>
            </select>

            <Button type="button" variant="outline" size="sm" onClick={onExportPreview}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Markdown exportieren
            </Button>
          </div>

          <div className="rounded-md border p-3 text-sm">
            <p className="font-medium">{preview.levelLabel}</p>
            <p className="text-xs text-muted-foreground">
              Abschnitte: {preview.sectionCount} | Generiert: {new Date(preview.generatedAt).toLocaleString("de-DE")}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Datengrundlage: {preview.dataBasis.totalUseCases} Use Cases, {preview.dataBasis.mappedUseCases} mit Mapping,
              {" "}{preview.dataBasis.highRiskUseCases} Hochrisiko, {preview.dataBasis.externalFacingUseCases} extern wirksam.
            </p>
            <p className="text-xs text-muted-foreground">
              Modus: {preview.dataBasis.deterministic ? "Deterministisch" : "Unbekannt"}
            </p>
          </div>

          <div className="rounded-md border p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Verwendete Section-IDs</p>
            <p className="mt-1 font-mono break-all">{preview.sectionIds.join(", ") || "(keine Abschnitte)"}</p>
          </div>

          <pre className="max-h-[420px] overflow-auto rounded-md border bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
            {preview.markdown}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
