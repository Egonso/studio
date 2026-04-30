'use client';

import Link from "next/link";
import { useLocale } from "next-intl";
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
import { getRegisterUseCaseStatusLabel } from "@/lib/register-first/status-flow";
import type { RegisterUseCaseStatus } from "@/lib/register-first/types";
import { appendWorkspaceScope } from "@/lib/navigation/workspace-scope";
import { useWorkspaceScope } from "@/lib/navigation/use-workspace-scope";
import {
  formatGovernanceDateTime,
  getGovernanceCommonCopy,
  resolveGovernanceCopyLocale,
} from "@/lib/i18n/governance-copy";

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
  locale,
}: {
  status: RegisterUseCaseStatus;
  value: number;
  locale?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
      <span className="inline-flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${STATUS_DOT_CLASSES[status]}`} aria-hidden />
        {getRegisterUseCaseStatusLabel(status, locale)}
      </span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

export function ControlAuditLayer({ snapshot }: ControlAuditLayerProps) {
  const locale = useLocale();
  const resolvedLocale = resolveGovernanceCopyLocale(locale);
  const common = getGovernanceCommonCopy(locale);
  const workspaceScope = useWorkspaceScope();
  const historyRows = snapshot.immutableReviewHistory.slice(0, 100);
  const copy =
    resolvedLocale === "de"
      ? {
        description:
          "Organisationsweite Lifecycle-Sicht, Gap-Analyse und unveränderliche Historie.",
        governanceScore: "Governance-Score",
        maturityLevel: "Reifegrad",
        totalSystems: "Systeme gesamt",
        lifecycleTitle: "ISO Lifecycle Management",
        lifecycleDescription:
          "Lifecycle- und Review-Status auf Organisationsebene.",
        lifecycleActive: "Lifecycle: Aktiv",
        lifecyclePilot: "Lifecycle: Pilot",
        lifecycleRetired: "Lifecycle: Stillgelegt",
        lifecycleUnknown: "Lifecycle: Unbekannt",
        reviewsOverdue: "Reviews überfällig",
        reviewsDueSoon: "Reviews bald fällig",
        reviewCycle: "Review-Zyklus definiert",
        oversightModel: "Aufsichtsmodell definiert",
        documentationLevel: "Dokumentationslevel definiert",
        statusDistribution: "Statusverteilung",
        statusDescription:
          "Formaler Workflow-Status über alle dokumentierten Systeme.",
        clauseView: "ISO-Klauselansicht",
        clauseDescription:
          "Dokumentationsstatus pro ISO-Klausel auf Basis der Registerdaten.",
        clause: "Klausel",
        area: "Bereich",
        documented: "Dokumentiert",
        coverage: "Abdeckung",
        evidence: "Nachweis",
        gapAnalysis: "Gap-Analyse",
        gapDescription:
          "Priorisierte Lücken für Audit-Readiness auf Organisationsebene.",
        noGaps: "Keine offenen Audit-Lücken erkannt.",
        affectedSystems: "Betroffene Systeme",
        recommendation: "Empfehlung",
        openUseCase: "Use Case öffnen",
        history: "Unveränderliche Review-Historie",
        historyDescription:
          "Aggregierte Review- und Statushistorie mit unveränderlicher Referenz.",
        noHistory: "Noch keine Review- oder Statushistorie dokumentiert.",
        timestamp: "Zeitpunkt",
        type: "Typ",
        system: "System",
        detail: "Detail",
        actor: "Akteur",
        reference: "Referenz",
        link: "Link",
        goToEntry: "Zum Eintrag",
        truncated: "Anzeige gekürzt auf {count} Einträge.",
        yes: "Ja",
      }
      : {
        description:
          "Organisation-wide lifecycle view, gap analysis and immutable history.",
        governanceScore: "Governance Score",
        maturityLevel: "Maturity Level",
        totalSystems: "Total systems",
        lifecycleTitle: "ISO Lifecycle Management",
        lifecycleDescription:
          "Lifecycle and review status at organisation level.",
        lifecycleActive: "Lifecycle: Active",
        lifecyclePilot: "Lifecycle: Pilot",
        lifecycleRetired: "Lifecycle: Retired",
        lifecycleUnknown: "Lifecycle: Unknown",
        reviewsOverdue: "Reviews overdue",
        reviewsDueSoon: "Reviews due soon",
        reviewCycle: "Review cycle defined",
        oversightModel: "Oversight model defined",
        documentationLevel: "Documentation level defined",
        statusDistribution: "Status Distribution",
        statusDescription:
          "Formal workflow status across all documented systems.",
        clauseView: "ISO Clause View",
        clauseDescription:
          "Documentation status per ISO clause based on register data.",
        clause: "Clause",
        area: "Area",
        documented: "Documented",
        coverage: "Coverage",
        evidence: "Evidence",
        gapAnalysis: "Gap Analysis",
        gapDescription:
          "Prioritised gaps for audit readiness at organisation level.",
        noGaps: "No open audit gaps detected.",
        affectedSystems: "Affected systems",
        recommendation: "Recommendation",
        openUseCase: "Open use case",
        history: "Immutable Review History",
        historyDescription:
          "Aggregated review and status history with immutable reference.",
        noHistory: "No review or status history documented yet.",
        timestamp: "Timestamp",
        type: "Type",
        system: "System",
        detail: "Detail",
        actor: "Actor",
        reference: "Reference",
        link: "Link",
        goToEntry: "Go to entry",
        truncated: "Display truncated to {count} entries.",
        yes: "Yes",
      };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>ISO & Audit Layer</CardTitle>
          <CardDescription>
            {copy.description} {common.asOf}:{" "}
            {formatGovernanceDateTime(snapshot.generatedAt, locale)}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{copy.governanceScore}</p>
            <p className="mt-1 text-2xl font-semibold">{snapshot.governanceScore}%</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">ISO-Readiness</p>
            <p className="mt-1 text-2xl font-semibold">{snapshot.isoReadinessPercent}%</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{copy.maturityLevel}</p>
            <p className="mt-1 text-2xl font-semibold">{snapshot.maturityLevel}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{copy.totalSystems}</p>
            <p className="mt-1 text-2xl font-semibold">{snapshot.lifecycle.totalSystems}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{copy.lifecycleTitle}</CardTitle>
            <CardDescription>
              {copy.lifecycleDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">{copy.lifecycleActive}</p>
                <p className="mt-1 font-mono text-lg">{snapshot.lifecycle.active}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">{copy.lifecyclePilot}</p>
                <p className="mt-1 font-mono text-lg">{snapshot.lifecycle.pilot}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">{copy.lifecycleRetired}</p>
                <p className="mt-1 font-mono text-lg">{snapshot.lifecycle.retired}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">{copy.lifecycleUnknown}</p>
                <p className="mt-1 font-mono text-lg">{snapshot.lifecycle.unknown}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">{copy.reviewsOverdue}</p>
                <p className="mt-1 font-mono text-lg">{snapshot.lifecycle.overdueReviews}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">{copy.reviewsDueSoon}</p>
                <p className="mt-1 font-mono text-lg">{snapshot.lifecycle.dueSoonReviews}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p className="rounded-md border px-3 py-2">
                {copy.reviewCycle}: {snapshot.lifecycle.withReviewCycle}/{snapshot.lifecycle.totalSystems}
              </p>
              <p className="rounded-md border px-3 py-2">
                {copy.oversightModel}: {snapshot.lifecycle.withOversightModel}/{snapshot.lifecycle.totalSystems}
              </p>
              <p className="rounded-md border px-3 py-2">
                {copy.documentationLevel}: {snapshot.lifecycle.withDocumentationLevel}/{snapshot.lifecycle.totalSystems}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{copy.statusDistribution}</CardTitle>
            <CardDescription>
              {copy.statusDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <StatusRow status="UNREVIEWED" value={snapshot.statusDistribution.UNREVIEWED} locale={locale} />
            <StatusRow
              status="REVIEW_RECOMMENDED"
              value={snapshot.statusDistribution.REVIEW_RECOMMENDED}
              locale={locale}
            />
            <StatusRow status="REVIEWED" value={snapshot.statusDistribution.REVIEWED} locale={locale} />
            <StatusRow status="PROOF_READY" value={snapshot.statusDistribution.PROOF_READY} locale={locale} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{copy.clauseView}</CardTitle>
          <CardDescription>
            {copy.clauseDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">{copy.clause}</th>
                  <th className="px-3 py-2 text-left font-medium">{copy.area}</th>
                  <th className="px-3 py-2 text-left font-medium">{copy.documented}</th>
                  <th className="px-3 py-2 text-right font-medium">{copy.coverage}</th>
                  <th className="px-3 py-2 text-left font-medium">{copy.evidence}</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.isoClauseProgress.map((entry) => (
                  <tr key={entry.clause} className="border-t">
                    <td className="px-3 py-2 font-mono">{entry.clause}</td>
                    <td className="px-3 py-2">{entry.title}</td>
                    <td className="px-3 py-2">{entry.documented ? copy.yes : common.open}</td>
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
          <CardTitle>{copy.gapAnalysis}</CardTitle>
          <CardDescription>
            {copy.gapDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {snapshot.gapAnalysis.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              {copy.noGaps}
            </p>
          ) : (
            snapshot.gapAnalysis.map((gap) => (
              <div key={gap.id} className="rounded-md border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{gap.title}</p>
                    <p className="text-xs text-muted-foreground">{gap.impact}</p>
                    <p className="text-xs text-muted-foreground">
                      {copy.affectedSystems}: {gap.affectedSystems} | {copy.coverage}: {gap.coveragePercent}%
                    </p>
                    <p className="text-xs">{copy.recommendation}: {gap.recommendedAction}</p>
                  </div>
                  {gap.deepLink && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={appendWorkspaceScope(gap.deepLink, workspaceScope)}>
                        {copy.openUseCase}
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
          <CardTitle>{copy.history}</CardTitle>
          <CardDescription>
            {copy.historyDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyRows.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              {copy.noHistory}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-xs">
                <thead className="bg-slate-50/70">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">{copy.timestamp}</th>
                    <th className="px-3 py-2 text-left font-medium">{copy.type}</th>
                    <th className="px-3 py-2 text-left font-medium">{copy.system}</th>
                    <th className="px-3 py-2 text-left font-medium">{copy.detail}</th>
                    <th className="px-3 py-2 text-left font-medium">{copy.actor}</th>
                    <th className="px-3 py-2 text-left font-medium">{copy.reference}</th>
                    <th className="px-3 py-2 text-left font-medium">{copy.link}</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((entry) => (
                    <tr key={entry.eventId} className="border-t align-top">
                      <td className="px-3 py-2 whitespace-nowrap">
                        {formatGovernanceDateTime(entry.timestamp, locale)}
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
                            {copy.goToEntry}
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
              {copy.truncated.replace("{count}", String(historyRows.length))}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
