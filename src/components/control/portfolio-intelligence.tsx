'use client';

import Link from "next/link";
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
}: {
  link: string | null;
  label?: string;
}) {
  const workspaceScope = useWorkspaceScope();
  if (!link) return <span className="text-xs text-muted-foreground">-</span>;
  return (
    <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
      <Link href={appendWorkspaceScope(link, workspaceScope)}>
        {label ?? "Details"}
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

function RiskMatrix({ rows }: { rows: PortfolioRiskMatrixRow[] }) {
  if (rows.length === 0) {
    return <EmptyState text="No risk data available." />;
  }

  const maxValue = Math.max(...rows.map((row) => row.total), 0);

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-slate-50/70">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Risk class</th>
            {STATUS_COLUMNS.map((status) => (
              <th key={status} className="px-2 py-2 text-right font-medium">
                {STATUS_SHORT_LABELS[status]}
              </th>
            ))}
            <th className="px-2 py-2 text-right font-medium">Total</th>
            <th className="px-2 py-2 text-right font-medium">Drilldown</th>
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
                <DrilldownLink link={row.drilldownLink} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DepartmentTable({ rows }: { rows: PortfolioDepartmentMetric[] }) {
  if (rows.length === 0) {
    return <EmptyState text="No department data available." />;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-slate-50/70">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Department</th>
            <th className="px-2 py-2 text-right font-medium">Systems</th>
            <th className="px-2 py-2 text-right font-medium">High risk</th>
            <th className="px-2 py-2 text-right font-medium">Reviewed %</th>
            <th className="px-2 py-2 text-right font-medium">Reviews overdue</th>
            <th className="px-2 py-2 text-right font-medium">Drilldown</th>
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
                <DrilldownLink link={row.drilldownLink} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OwnerTable({ rows }: { rows: PortfolioOwnerMetric[] }) {
  if (rows.length === 0) {
    return <EmptyState text="No owner data available." />;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-slate-50/70">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Owner</th>
            <th className="px-2 py-2 text-right font-medium">Systems</th>
            <th className="px-2 py-2 text-right font-medium">High risk</th>
            <th className="px-2 py-2 text-right font-medium">Reviewed %</th>
            <th className="px-2 py-2 text-right font-medium">Reviews overdue</th>
            <th className="px-2 py-2 text-right font-medium">Drilldown</th>
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
                <DrilldownLink link={row.drilldownLink} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusList({ rows }: { rows: PortfolioStatusMetric[] }) {
  if (rows.length === 0) {
    return <EmptyState text="No status data available." />;
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.status} className="flex items-center justify-between rounded-md border p-3">
          <div>
            <p className="text-sm">{row.label}</p>
            <p className="text-xs text-muted-foreground">
              {row.count} Systeme ({row.sharePercent}%)
            </p>
          </div>
          <DrilldownLink link={row.drilldownLink} />
        </div>
      ))}
    </div>
  );
}

export function PortfolioIntelligence({ metrics, capturedAt }: PortfolioIntelligenceProps) {
  const rci = metrics.riskConcentrationIndex;
  const bandLabel =
    rci.concentrationBand === "CLUSTERED"
      ? "Clustered"
      : rci.concentrationBand === "BALANCED"
        ? "Balanced"
        : "Diffuse";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Portfolio Intelligence</CardTitle>
          <CardDescription>
            Org-wide analysis for risk, responsibilities, and status. Stand:{" "}
            {capturedAt.toLocaleString("en-GB")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total systems</p>
            <p className="mt-1 text-2xl font-semibold">{metrics.totalSystems}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Risk Concentration Index
            </p>
            <p className="mt-1 text-2xl font-semibold">{rci.score}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Critical systems
            </p>
            <p className="mt-1 text-2xl font-semibold">{rci.assessedSystems}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Concentration</p>
            <p className="mt-1 text-2xl font-semibold">{bandLabel}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Risk Distribution</CardTitle>
          <CardDescription>
            Matrix nach Risk class und Workflow-Status (ruhige Heatmap-Logik in Grau).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RiskMatrix rows={metrics.riskStatusMatrix} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Departmentsanalyse</CardTitle>
            <CardDescription>
              Distribution by organisational unit with drilldown to specific use cases.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DepartmentTable rows={metrics.departmentAnalysis} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Owner-Performance</CardTitle>
            <CardDescription>
              Owner portfolio with review coverage and overdue reviews.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OwnerTable rows={metrics.ownerPerformance} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>
              Control status per workflow status with direct access per segment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatusList rows={metrics.statusDistribution} />
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
              <EmptyState text="No high-risk or prohibited segments documented." />
            ) : (
              rci.topConcentrations.map((entry) => (
                <div
                  key={entry.group}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="text-sm">{entry.group}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.count} critical systems ({entry.sharePercent}%)
                    </p>
                  </div>
                  <DrilldownLink link={entry.drilldownLink} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
