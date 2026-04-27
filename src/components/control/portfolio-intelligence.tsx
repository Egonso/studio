'use client';

import Link from "next/link";
import { useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type {
  PortfolioDepartmentMetric,
  PortfolioMetrics,
  PortfolioOwnerMetric,
  PortfolioRiskMatrixRow,
  PortfolioStatusMetric,
} from "@/lib/control/portfolio-metrics";
import type { RegisterUseCaseStatus } from "@/lib/register-first/types";
import { appendWorkspaceScope } from "@/lib/navigation/workspace-scope";
import { useWorkspaceScope } from "@/lib/navigation/use-workspace-scope";
import {
  formatGovernanceDateTime,
  getGovernanceCommonCopy,
  resolveGovernanceCopyLocale,
} from "@/lib/i18n/governance-copy";

interface PortfolioIntelligenceProps {
  metrics: PortfolioMetrics;
  capturedAt: Date;
}

const STATUS_COLUMNS: RegisterUseCaseStatus[] = [
  "UNREVIEWED",
  "REVIEW_RECOMMENDED",
  "REVIEWED",
  "PROOF_READY",
];

const STATUS_SHORT_LABELS: Record<RegisterUseCaseStatus, string> = {
  UNREVIEWED: "Unreviewed",
  REVIEW_RECOMMENDED: "Recommended",
  REVIEWED: "Reviewed",
  PROOF_READY: "Proof",
};

const STATUS_SHORT_LABELS_DE: Record<RegisterUseCaseStatus, string> = {
  UNREVIEWED: "Offen",
  REVIEW_RECOMMENDED: "Empfohlen",
  REVIEWED: "Geprüft",
  PROOF_READY: "Nachweis",
};

function matrixCellTone(value: number, maxValue: number): string {
  if (value <= 0 || maxValue <= 0) return "bg-background text-muted-foreground";
  const ratio = value / maxValue;
  if (ratio >= 0.67) return "bg-slate-200 text-foreground";
  if (ratio >= 0.34) return "bg-slate-100 text-foreground";
  return "bg-slate-50 text-foreground";
}

function DrilldownLink({
  link,
  label,
  locale,
}: {
  link: string | null;
  label?: string;
  locale?: string;
}) {
  const workspaceScope = useWorkspaceScope();
  if (!link) return <span className="text-xs text-muted-foreground">-</span>;
  return (
    <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
      <Link href={appendWorkspaceScope(link, workspaceScope)}>
        {label ?? (resolveGovernanceCopyLocale(locale) === "de" ? "Details" : "Details")}
        <ArrowRight className="ml-1 h-3 w-3" />
      </Link>
    </Button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function RiskMatrix({ rows, locale }: { rows: PortfolioRiskMatrixRow[]; locale?: string }) {
  const isGerman = resolveGovernanceCopyLocale(locale) === "de";
  const statusLabels = isGerman ? STATUS_SHORT_LABELS_DE : STATUS_SHORT_LABELS;
  if (rows.length === 0) {
    return <EmptyState text={isGerman ? "Keine Risikodaten verfügbar." : "No risk data available."} />;
  }

  const maxValue = Math.max(...rows.map((row) => row.total), 0);

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-slate-50/70">
          <tr>
            <th className="px-3 py-2 text-left font-medium">{isGerman ? "Risikoklasse" : "Risk class"}</th>
            {STATUS_COLUMNS.map((status) => (
              <th key={status} className="px-2 py-2 text-right font-medium">
                {statusLabels[status]}
              </th>
            ))}
            <th className="px-2 py-2 text-right font-medium">{isGerman ? "Gesamt" : "Total"}</th>
            <th className="px-2 py-2 text-right font-medium">{isGerman ? "Drilldown" : "Drilldown"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t">
              <td className="px-3 py-2">{row.label}</td>
              {STATUS_COLUMNS.map((status) => (
                <td
                  key={`${row.key}-${status}`}
                  className={`px-2 py-2 text-right font-mono ${matrixCellTone(
                    row.byStatus[status],
                    maxValue
                  )}`}
                >
                  {row.byStatus[status]}
                </td>
              ))}
              <td className="px-2 py-2 text-right font-mono">{row.total}</td>
              <td className="px-2 py-2 text-right">
                <DrilldownLink link={row.drilldownLink} locale={locale} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DepartmentTable({ rows, locale }: { rows: PortfolioDepartmentMetric[]; locale?: string }) {
  const isGerman = resolveGovernanceCopyLocale(locale) === "de";
  if (rows.length === 0) {
    return <EmptyState text={isGerman ? "Keine Bereichsdaten verfügbar." : "No department data available."} />;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-slate-50/70">
          <tr>
            <th className="px-3 py-2 text-left font-medium">{isGerman ? "Bereich" : "Department"}</th>
            <th className="px-2 py-2 text-right font-medium">{isGerman ? "Systeme" : "Systems"}</th>
            <th className="px-2 py-2 text-right font-medium">{isGerman ? "Hochrisiko" : "High risk"}</th>
            <th className="px-2 py-2 text-right font-medium">{isGerman ? "Geprüft %" : "Reviewed %"}</th>
            <th className="px-2 py-2 text-right font-medium">{isGerman ? "Reviews überfällig" : "Reviews overdue"}</th>
            <th className="px-2 py-2 text-right font-medium">{isGerman ? "Drilldown" : "Drilldown"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.department} className="border-t">
              <td className="px-3 py-2">{row.department}</td>
              <td className="px-2 py-2 text-right font-mono">{row.totalSystems}</td>
              <td className="px-2 py-2 text-right font-mono">{row.highRiskSystems}</td>
              <td className="px-2 py-2 text-right font-mono">{row.reviewedPercent}%</td>
              <td className="px-2 py-2 text-right font-mono">{row.overdueReviews}</td>
              <td className="px-2 py-2 text-right">
                <DrilldownLink link={row.drilldownLink} locale={locale} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OwnerTable({ rows, locale }: { rows: PortfolioOwnerMetric[]; locale?: string }) {
  const isGerman = resolveGovernanceCopyLocale(locale) === "de";
  if (rows.length === 0) {
    return <EmptyState text={isGerman ? "Keine Owner-Daten verfügbar." : "No owner data available."} />;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-slate-50/70">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Owner</th>
            <th className="px-2 py-2 text-right font-medium">{isGerman ? "Systeme" : "Systems"}</th>
            <th className="px-2 py-2 text-right font-medium">{isGerman ? "Hochrisiko" : "High risk"}</th>
            <th className="px-2 py-2 text-right font-medium">{isGerman ? "Geprüft %" : "Reviewed %"}</th>
            <th className="px-2 py-2 text-right font-medium">{isGerman ? "Reviews überfällig" : "Reviews overdue"}</th>
            <th className="px-2 py-2 text-right font-medium">{isGerman ? "Drilldown" : "Drilldown"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.owner} className="border-t">
              <td className="px-3 py-2">{row.owner}</td>
              <td className="px-2 py-2 text-right font-mono">{row.totalSystems}</td>
              <td className="px-2 py-2 text-right font-mono">{row.highRiskSystems}</td>
              <td className="px-2 py-2 text-right font-mono">{row.reviewedPercent}%</td>
              <td className="px-2 py-2 text-right font-mono">{row.overdueReviews}</td>
              <td className="px-2 py-2 text-right">
                <DrilldownLink link={row.drilldownLink} locale={locale} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusList({ rows, locale }: { rows: PortfolioStatusMetric[]; locale?: string }) {
  const isGerman = resolveGovernanceCopyLocale(locale) === "de";
  if (rows.length === 0) {
    return <EmptyState text={isGerman ? "Keine Statusdaten verfügbar." : "No status data available."} />;
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.status} className="flex items-center justify-between rounded-md border p-3">
          <div>
            <p className="text-sm">{row.label}</p>
            <p className="text-xs text-muted-foreground">
              {row.count} {isGerman ? "Systeme" : "systems"} ({row.sharePercent}%)
            </p>
          </div>
          <DrilldownLink link={row.drilldownLink} locale={locale} />
        </div>
      ))}
    </div>
  );
}

export function PortfolioIntelligence({ metrics, capturedAt }: PortfolioIntelligenceProps) {
  const locale = useLocale();
  const resolvedLocale = resolveGovernanceCopyLocale(locale);
  const common = getGovernanceCommonCopy(locale);
  const rci = metrics.riskConcentrationIndex;
  const bandLabel =
    rci.concentrationBand === "CLUSTERED"
      ? resolvedLocale === "de" ? "Gebündelt" : "Clustered"
      : rci.concentrationBand === "BALANCED"
        ? resolvedLocale === "de" ? "Ausgewogen" : "Balanced"
        : resolvedLocale === "de" ? "Verteilt" : "Diffuse";
  const copy =
    resolvedLocale === "de"
      ? {
        description: "Org-weite Analyse für Risiko, Verantwortlichkeiten und Status.",
        totalSystems: "Systeme gesamt",
        riskConcentration: "Risikokonzentrationsindex",
        criticalSystems: "Kritische Systeme",
        concentration: "Konzentration",
        riskDistribution: "Risikoverteilung",
        riskDistributionDescription:
          "Matrix nach Risikoklasse und Workflow-Status in ruhiger Graulogik.",
        departments: "Bereichsanalyse",
        departmentsDescription:
          "Verteilung nach Organisationseinheit mit Drilldown auf konkrete Use Cases.",
        ownerPerformance: "Owner-Performance",
        ownerDescription:
          "Owner-Portfolio mit Review-Abdeckung und überfälligen Reviews.",
        statusDistribution: "Statusverteilung",
        statusDescription:
          "Control-Status je Workflow-Status mit direktem Zugriff pro Segment.",
        noCritical: "Keine Hochrisiko- oder Verboten-Segmente dokumentiert.",
        criticalSystemsLabel: "kritische Systeme",
      }
      : {
        description: "Org-wide analysis for risk, responsibilities and status.",
        totalSystems: "Total systems",
        riskConcentration: "Risk Concentration Index",
        criticalSystems: "Critical systems",
        concentration: "Concentration",
        riskDistribution: "Risk Distribution",
        riskDistributionDescription:
          "Matrix by risk class and workflow status using a restrained grey heatmap.",
        departments: "Department Analysis",
        departmentsDescription:
          "Distribution by organisational unit with drilldown to specific use cases.",
        ownerPerformance: "Owner Performance",
        ownerDescription:
          "Owner portfolio with review coverage and overdue reviews.",
        statusDistribution: "Status Distribution",
        statusDescription:
          "Control status per workflow status with direct access per segment.",
        noCritical: "No high-risk or prohibited segments documented.",
        criticalSystemsLabel: "critical systems",
      };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Portfolio Intelligence</CardTitle>
          <CardDescription>
            {copy.description} {common.asOf}:{" "}
            {formatGovernanceDateTime(capturedAt, locale)}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{copy.totalSystems}</p>
            <p className="mt-1 text-2xl font-semibold">{metrics.totalSystems}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {copy.riskConcentration}
            </p>
            <p className="mt-1 text-2xl font-semibold">{rci.score}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {copy.criticalSystems}
            </p>
            <p className="mt-1 text-2xl font-semibold">{rci.assessedSystems}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{copy.concentration}</p>
            <p className="mt-1 text-2xl font-semibold">{bandLabel}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{copy.riskDistribution}</CardTitle>
          <CardDescription>
            {copy.riskDistributionDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RiskMatrix rows={metrics.riskStatusMatrix} locale={locale} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{copy.departments}</CardTitle>
            <CardDescription>
              {copy.departmentsDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DepartmentTable rows={metrics.departmentAnalysis} locale={locale} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{copy.ownerPerformance}</CardTitle>
            <CardDescription>
              {copy.ownerDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OwnerTable rows={metrics.ownerPerformance} locale={locale} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{copy.statusDistribution}</CardTitle>
            <CardDescription>
              {copy.statusDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatusList rows={metrics.statusDistribution} locale={locale} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Concentration Index</CardTitle>
            <CardDescription>
              {rci.methodology}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {rci.topConcentrations.length === 0 ? (
              <EmptyState text={copy.noCritical} />
            ) : (
              rci.topConcentrations.map((entry) => (
                <div
                  key={entry.group}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="text-sm">{entry.group}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.count} {copy.criticalSystemsLabel} ({entry.sharePercent}%)
                    </p>
                  </div>
                  <DrilldownLink link={entry.drilldownLink} locale={locale} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
