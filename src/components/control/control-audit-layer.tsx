'use client';

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { OrgAuditLayerSnapshot } from "@/lib/control/audit/org-audit-layer";
import { registerUseCaseStatusLabels } from "@/lib/register-first/status-flow";
import type { RegisterUseCaseStatus } from "@/lib/register-first/types";
import { appendWorkspaceScope } from "@/lib/navigation/workspace-scope";
import { useWorkspaceScope } from "@/lib/navigation/use-workspace-scope";

interface ControlAuditLayerProps {
  snapshot: OrgAuditLayerSnapshot;
}

const STATUS_DOT_CLASSES: Record<RegisterUseCaseStatus, string> = {
  UNREVIEWED: "bg-slate-500",
  REVIEW_RECOMMENDED: "bg-slate-500",
  REVIEWED: "bg-blue-600",
  PROOF_READY: "bg-green-600",
};

function StatusRow({
  status,
  value,
}: {
  status: RegisterUseCaseStatus;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
      <span className="inline-flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${STATUS_DOT_CLASSES[status]}`} aria-hidden />
        {registerUseCaseStatusLabels[status]}
      </span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

export function ControlAuditLayer({ snapshot }: ControlAuditLayerProps) {
  const workspaceScope = useWorkspaceScope();
  const historyRows = snapshot.immutableReviewHistory.slice(0, 100);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>ISO & Audit Layer</CardTitle>
          <CardDescription>
            Organisationsweite Lifecycle-Sicht, Gap-Analyse und immutable Historie. Stand: {" "}
            {new Date(snapshot.generatedAt).toLocaleString("de-DE")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Governance Score</p>
            <p className="mt-1 text-2xl font-semibold">{snapshot.governanceScore}%</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">ISO-Readiness</p>
            <p className="mt-1 text-2xl font-semibold">{snapshot.isoReadinessPercent}%</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Maturity Level</p>
            <p className="mt-1 text-2xl font-semibold">{snapshot.maturityLevel}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Systeme gesamt</p>
            <p className="mt-1 text-2xl font-semibold">{snapshot.lifecycle.totalSystems}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>ISO Lifecycle Management</CardTitle>
            <CardDescription>
              Lifecycle- und Review-Stand auf Organisationsebene.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Lifecycle: Active</p>
                <p className="mt-1 font-mono text-lg">{snapshot.lifecycle.active}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Lifecycle: Pilot</p>
                <p className="mt-1 font-mono text-lg">{snapshot.lifecycle.pilot}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Lifecycle: Retired</p>
                <p className="mt-1 font-mono text-lg">{snapshot.lifecycle.retired}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Lifecycle: Unknown</p>
                <p className="mt-1 font-mono text-lg">{snapshot.lifecycle.unknown}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Review ueberfaellig</p>
                <p className="mt-1 font-mono text-lg">{snapshot.lifecycle.overdueReviews}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Review bald faellig</p>
                <p className="mt-1 font-mono text-lg">{snapshot.lifecycle.dueSoonReviews}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p className="rounded-md border px-3 py-2">
                Review-Zyklus definiert: {snapshot.lifecycle.withReviewCycle}/{snapshot.lifecycle.totalSystems}
              </p>
              <p className="rounded-md border px-3 py-2">
                Aufsichtsmodell definiert: {snapshot.lifecycle.withOversightModel}/{snapshot.lifecycle.totalSystems}
              </p>
              <p className="rounded-md border px-3 py-2">
                Dokumentationslevel definiert: {snapshot.lifecycle.withDocumentationLevel}/{snapshot.lifecycle.totalSystems}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status-Verteilung</CardTitle>
            <CardDescription>
              Formaler Workflow-Stand ueber alle dokumentierten Systeme.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <StatusRow status="UNREVIEWED" value={snapshot.statusDistribution.UNREVIEWED} />
            <StatusRow
              status="REVIEW_RECOMMENDED"
              value={snapshot.statusDistribution.REVIEW_RECOMMENDED}
            />
            <StatusRow status="REVIEWED" value={snapshot.statusDistribution.REVIEWED} />
            <StatusRow status="PROOF_READY" value={snapshot.statusDistribution.PROOF_READY} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ISO Clause Sicht</CardTitle>
          <CardDescription>
            Dokumentationsstand je ISO-Klausel auf Basis der Registerdaten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Klausel</th>
                  <th className="px-3 py-2 text-left font-medium">Bereich</th>
                  <th className="px-3 py-2 text-left font-medium">Dokumentiert</th>
                  <th className="px-3 py-2 text-right font-medium">Coverage</th>
                  <th className="px-3 py-2 text-left font-medium">Evidenz</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.isoClauseProgress.map((entry) => (
                  <tr key={entry.clause} className="border-t">
                    <td className="px-3 py-2 font-mono">{entry.clause}</td>
                    <td className="px-3 py-2">{entry.title}</td>
                    <td className="px-3 py-2">{entry.documented ? "Ja" : "Offen"}</td>
                    <td className="px-3 py-2 text-right font-mono">{entry.coveragePercent}%</td>
                    <td className="px-3 py-2 text-muted-foreground">{entry.evidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gap-Analyse</CardTitle>
          <CardDescription>
            Priorisierte Luecken fuer Audit-Readiness auf Organisationsebene.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {snapshot.gapAnalysis.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Keine offenen Audit-Luecken erkannt.
            </p>
          ) : (
            snapshot.gapAnalysis.map((gap) => (
              <div key={gap.id} className="rounded-md border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{gap.title}</p>
                    <p className="text-xs text-muted-foreground">{gap.impact}</p>
                    <p className="text-xs text-muted-foreground">
                      Betroffene Systeme: {gap.affectedSystems} | Coverage: {gap.coveragePercent}%
                    </p>
                    <p className="text-xs">Empfehlung: {gap.recommendedAction}</p>
                  </div>
                  {gap.deepLink && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={appendWorkspaceScope(gap.deepLink, workspaceScope)}>
                        Einsatzfall oeffnen
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Immutable Review History</CardTitle>
          <CardDescription>
            Aggregierte Review- und Statushistorie mit unveraenderlicher Referenz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyRows.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Noch keine Review- oder Statushistorie dokumentiert.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-xs">
                <thead className="bg-slate-50/70">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Zeitpunkt</th>
                    <th className="px-3 py-2 text-left font-medium">Typ</th>
                    <th className="px-3 py-2 text-left font-medium">System</th>
                    <th className="px-3 py-2 text-left font-medium">Detail</th>
                    <th className="px-3 py-2 text-left font-medium">Akteur</th>
                    <th className="px-3 py-2 text-left font-medium">Referenz</th>
                    <th className="px-3 py-2 text-left font-medium">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((entry) => (
                    <tr key={entry.eventId} className="border-t align-top">
                      <td className="px-3 py-2 whitespace-nowrap">
                        {new Date(entry.timestamp).toLocaleString("de-DE")}
                      </td>
                      <td className="px-3 py-2">{entry.eventType === "REVIEW" ? "Review" : "Status"}</td>
                      <td className="px-3 py-2">
                        <p>{entry.useCasePurpose}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {entry.useCaseId}
                        </p>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{entry.details}</td>
                      <td className="px-3 py-2">{entry.actor}</td>
                      <td className="px-3 py-2 font-mono">{entry.immutableReference}</td>
                      <td className="px-3 py-2">
                        <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                          <Link href={appendWorkspaceScope(entry.deepLink, workspaceScope)}>
                            Zum Eintrag
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {snapshot.immutableReviewHistory.length > historyRows.length && (
            <p className="mt-2 text-xs text-muted-foreground">
              Anzeige gekuerzt auf {historyRows.length} Eintraege.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
