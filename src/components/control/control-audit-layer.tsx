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
            Organisation-wide lifecycle view, gap analysis, and immutable history. As of: {" "}
            {new Date(snapshot.generatedAt).toLocaleString("en-GB")}
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
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total systems</p>
            <p className="mt-1 text-2xl font-semibold">{snapshot.lifecycle.totalSystems}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>ISO Lifecycle Management</CardTitle>
            <CardDescription>
              Lifecycle and review status at organisation level.
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
                <p className="text-xs text-muted-foreground">Reviews overdue</p>
                <p className="mt-1 font-mono text-lg">{snapshot.lifecycle.overdueReviews}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Reviews due soon</p>
                <p className="mt-1 font-mono text-lg">{snapshot.lifecycle.dueSoonReviews}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p className="rounded-md border px-3 py-2">
                Review cycle defined: {snapshot.lifecycle.withReviewCycle}/{snapshot.lifecycle.totalSystems}
              </p>
              <p className="rounded-md border px-3 py-2">
                Oversight model defined: {snapshot.lifecycle.withOversightModel}/{snapshot.lifecycle.totalSystems}
              </p>
              <p className="rounded-md border px-3 py-2">
                Documentation level defined: {snapshot.lifecycle.withDocumentationLevel}/{snapshot.lifecycle.totalSystems}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>
              Formal workflow status across all documented systems.
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
          <CardTitle>ISO Clause View</CardTitle>
          <CardDescription>
            Documentation status per ISO clause based on register data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Clause</th>
                  <th className="px-3 py-2 text-left font-medium">Area</th>
                  <th className="px-3 py-2 text-left font-medium">Documented</th>
                  <th className="px-3 py-2 text-right font-medium">Coverage</th>
                  <th className="px-3 py-2 text-left font-medium">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.isoClauseProgress.map((entry) => (
                  <tr key={entry.clause} className="border-t">
                    <td className="px-3 py-2 font-mono">{entry.clause}</td>
                    <td className="px-3 py-2">{entry.title}</td>
                    <td className="px-3 py-2">{entry.documented ? "Yes" : "Open"}</td>
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
          <CardTitle>Gap Analysis</CardTitle>
          <CardDescription>
            Prioritised gaps for audit readiness at organisation level.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {snapshot.gapAnalysis.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No open audit gaps detected.
            </p>
          ) : (
            snapshot.gapAnalysis.map((gap) => (
              <div key={gap.id} className="rounded-md border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{gap.title}</p>
                    <p className="text-xs text-muted-foreground">{gap.impact}</p>
                    <p className="text-xs text-muted-foreground">
                      Affected systems: {gap.affectedSystems} | Coverage: {gap.coveragePercent}%
                    </p>
                    <p className="text-xs">Recommendation: {gap.recommendedAction}</p>
                  </div>
                  {gap.deepLink && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={appendWorkspaceScope(gap.deepLink, workspaceScope)}>
                        Open use case
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
            Aggregated review and status history with immutable reference.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyRows.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No review or status history documented yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-xs">
                <thead className="bg-slate-50/70">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Timestamp</th>
                    <th className="px-3 py-2 text-left font-medium">Type</th>
                    <th className="px-3 py-2 text-left font-medium">System</th>
                    <th className="px-3 py-2 text-left font-medium">Detail</th>
                    <th className="px-3 py-2 text-left font-medium">Actor</th>
                    <th className="px-3 py-2 text-left font-medium">Reference</th>
                    <th className="px-3 py-2 text-left font-medium">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((entry) => (
                    <tr key={entry.eventId} className="border-t align-top">
                      <td className="px-3 py-2 whitespace-nowrap">
                        {new Date(entry.timestamp).toLocaleString("en-GB")}
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
                            Go to entry
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
              Display truncated to {historyRows.length} entries.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
