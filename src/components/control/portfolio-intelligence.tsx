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
  UNREVIEWED: "Ungeprueft",
  REVIEW_RECOMMENDED: "Empfohlen",
  REVIEWED: "Geprueft",
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
}: {
  link: string | null;
  label?: string;
}) {
  if (!link) return <span className="text-xs text-muted-foreground">-</span>;
  return (
    <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
      <Link href={link}>
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
    return <EmptyState text="Keine Risikodaten vorhanden." />;
  }

  const maxValue = Math.max(...rows.map((row) => row.total), 0);

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-slate-50/70">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Risikoklasse</th>
            {STATUS_COLUMNS.map((status) => (
              <th key={status} className="px-2 py-2 text-right font-medium">
                {STATUS_SHORT_LABELS[status]}
              </th>
            ))}
            <th className="px-2 py-2 text-right font-medium">Gesamt</th>
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
    return <EmptyState text="Keine Fachbereichsdaten vorhanden." />;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-slate-50/70">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Fachbereich</th>
            <th className="px-2 py-2 text-right font-medium">Systeme</th>
            <th className="px-2 py-2 text-right font-medium">Hochrisiko</th>
            <th className="px-2 py-2 text-right font-medium">Geprueft %</th>
            <th className="px-2 py-2 text-right font-medium">Review ueberfaellig</th>
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
    return <EmptyState text="Keine Owner-Daten vorhanden." />;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-slate-50/70">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Owner</th>
            <th className="px-2 py-2 text-right font-medium">Systeme</th>
            <th className="px-2 py-2 text-right font-medium">Hochrisiko</th>
            <th className="px-2 py-2 text-right font-medium">Geprueft %</th>
            <th className="px-2 py-2 text-right font-medium">Review ueberfaellig</th>
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
    return <EmptyState text="Keine Statusdaten vorhanden." />;
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
            Org-weite Analyse fuer Risiko, Verantwortlichkeiten und Status. Stand:{" "}
            {capturedAt.toLocaleString("de-DE")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Systeme gesamt</p>
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
              Kritische Systeme
            </p>
            <p className="mt-1 text-2xl font-semibold">{rci.assessedSystems}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Konzentration</p>
            <p className="mt-1 text-2xl font-semibold">{bandLabel}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Risikoverteilung</CardTitle>
          <CardDescription>
            Matrix nach Risikoklasse und Workflow-Status (ruhige Heatmap-Logik in Grau).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RiskMatrix rows={metrics.riskStatusMatrix} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fachbereichsanalyse</CardTitle>
            <CardDescription>
              Verteilung nach Organisationseinheit mit Drilldown auf konkrete Use Cases.
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
              Owner-Portfolio mit Review-Abdeckung und ueberfaelligen Reviews.
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
            <CardTitle>Status-Verteilung</CardTitle>
            <CardDescription>
              Steuerungsstand je Workflow-Status mit direktem Einstieg pro Segment.
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
              <EmptyState text="Keine Hochrisiko- oder Verbotssegmente dokumentiert." />
            ) : (
              rci.topConcentrations.map((entry) => (
                <div
                  key={entry.group}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="text-sm">{entry.group}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.count} kritische Systeme ({entry.sharePercent}%)
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

