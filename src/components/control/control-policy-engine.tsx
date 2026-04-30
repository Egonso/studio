'use client';

import Link from "next/link";
import { useLocale } from "next-intl";
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
import {
  formatGovernanceDateTime,
  getGovernanceCommonCopy,
  resolveGovernanceCopyLocale,
} from "@/lib/i18n/governance-copy";

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
  const locale = useLocale();
  const resolvedLocale = resolveGovernanceCopyLocale(locale);
  const common = getGovernanceCommonCopy(locale);
  const workspaceScope = useWorkspaceScope();
  const copy =
    resolvedLocale === "de"
      ? {
        description:
          "Deterministische Policy-Abdeckung aus Registerdaten und Evidenz-Mapping auf Use Cases.",
        coverage: "Policy-Abdeckung",
        mapped: "Use Cases zugeordnet",
        totalPolicies: "Richtlinien gesamt",
        approved: "Genehmigt",
        versionedPolicies: "Versionierte Richtlinien",
        withHistory: "mit Historie",
        orphanReferences: "Verwaiste Referenzen",
        orphanDescription: "Policy-Links ohne passendes Dokument",
        mappingTitle: "Policy-Mapping und Versionierung",
        mappingDescription:
          "Mapping von Richtlinien auf Use Cases inkl. Status und Dokumentversion.",
        noPolicies: "Keine Policies hinterlegt.",
        unmappedTitle: "Ungemappte Use Cases",
        unmappedDescription:
          "Einsatzfälle ohne Policy-Zuordnung für gezielte Nachpflege.",
        allMapped: "Alle dokumentierten Use Cases sind einer Policy zugeordnet.",
        openMapping: "Mapping öffnen",
        truncated: "Anzeige gekürzt auf 25 Einträge.",
        generationTitle: "Deterministische Policy-Generierung",
        generationDescription:
          "Policy-Preview wird ohne Blackbox aus Registerdaten erzeugt.",
        policyLevel: "Policy-Level",
        exportMarkdown: "Markdown exportieren",
        sections: "Abschnitte",
        generated: "Generiert",
        dataBasis: "Datengrundlage",
        highRisk: "Hochrisiko",
        externallyEffective: "extern wirksam",
        mode: "Modus",
        deterministic: "Deterministisch",
        unknown: "Unbekannt",
        sectionIds: "Verwendete Section-IDs",
        noSections: "(keine Abschnitte)",
      }
      : {
        description:
          "Deterministic policy coverage from register data and evidence mapping to use cases.",
        coverage: "Policy coverage",
        mapped: "use cases mapped",
        totalPolicies: "Total policies",
        approved: "Approved",
        versionedPolicies: "Versioned policies",
        withHistory: "with history",
        orphanReferences: "Orphan references",
        orphanDescription: "Policy links without a matching document",
        mappingTitle: "Policy Mapping and Versioning",
        mappingDescription:
          "Mapping of policies to use cases including status and document version.",
        noPolicies: "No policies documented.",
        unmappedTitle: "Unmapped use cases",
        unmappedDescription:
          "Use cases without policy mapping for targeted follow-up.",
        allMapped: "All documented use cases are assigned to a policy.",
        openMapping: "Open mapping",
        truncated: "Display truncated to 25 entries.",
        generationTitle: "Deterministic Policy Generation",
        generationDescription:
          "Policy preview is generated from register data without a black box.",
        policyLevel: "Policy level",
        exportMarkdown: "Export Markdown",
        sections: "Sections",
        generated: "Generated",
        dataBasis: "Data basis",
        highRisk: "high-risk",
        externallyEffective: "externally effective",
        mode: "Mode",
        deterministic: "Deterministic",
        unknown: "Unknown",
        sectionIds: "Used section IDs",
        noSections: "(no sections)",
      };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Policy Engine</CardTitle>
          <CardDescription>
            {copy.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{copy.coverage}</p>
            <p className="mt-1 text-2xl font-semibold">{coverage.coveragePercent}%</p>
            <p className="text-xs text-muted-foreground">
              {coverage.mappedUseCases}/{coverage.totalUseCases} {copy.mapped}
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{copy.totalPolicies}</p>
            <p className="mt-1 text-2xl font-semibold">{coverage.policiesTotal}</p>
            <p className="text-xs text-muted-foreground">{copy.approved}: {coverage.approvedPolicies}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{copy.versionedPolicies}</p>
            <p className="mt-1 text-2xl font-semibold">{coverage.policiesWithVersionHistory}</p>
            <p className="text-xs text-muted-foreground">{copy.withHistory}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{copy.orphanReferences}</p>
            <p className="mt-1 text-2xl font-semibold">{coverage.orphanMappingReferences}</p>
            <p className="text-xs text-muted-foreground">{copy.orphanDescription}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{copy.mappingTitle}</CardTitle>
          <CardDescription>
            {copy.mappingDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {coverage.rows.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              {copy.noPolicies}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/70">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Policy</th>
                    <th className="px-3 py-2 text-left font-medium">{common.status}</th>
                    <th className="px-3 py-2 text-left font-medium">{common.level}</th>
                    <th className="px-3 py-2 text-right font-medium">{common.version}</th>
                    <th className="px-3 py-2 text-right font-medium">{common.useCases}</th>
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
          <CardTitle>{copy.unmappedTitle}</CardTitle>
          <CardDescription>
            {copy.unmappedDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {coverage.unmapped.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              {copy.allMapped}
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
                    {copy.openMapping}
                  </Link>
                </Button>
              </div>
            ))
          )}
          {coverage.unmapped.length > 25 && (
            <p className="text-xs text-muted-foreground">
              {copy.truncated}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{copy.generationTitle}</CardTitle>
          <CardDescription>
            {copy.generationDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-muted-foreground" htmlFor="policy-level-select">
              {copy.policyLevel}
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
              {copy.exportMarkdown}
            </Button>
          </div>

          <div className="rounded-md border p-3 text-sm">
            <p className="font-medium">{preview.levelLabel}</p>
            <p className="text-xs text-muted-foreground">
              {copy.sections}: {preview.sectionCount} | {copy.generated}: {formatGovernanceDateTime(preview.generatedAt, locale)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {copy.dataBasis}: {preview.dataBasis.totalUseCases} {common.useCases}, {preview.dataBasis.mappedUseCases} {resolvedLocale === "de" ? "mit Mapping" : "with mapping"},
              {" "}{preview.dataBasis.highRiskUseCases} {copy.highRisk}, {preview.dataBasis.externalFacingUseCases} {copy.externallyEffective}.
            </p>
            <p className="text-xs text-muted-foreground">
              {copy.mode}: {preview.dataBasis.deterministic ? copy.deterministic : copy.unknown}
            </p>
          </div>

          <div className="rounded-md border p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">{copy.sectionIds}</p>
            <p className="mt-1 font-mono break-all">{preview.sectionIds.join(", ") || copy.noSections}</p>
          </div>

          <pre className="max-h-[420px] overflow-auto rounded-md border bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
            {preview.markdown}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
