import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ControlKpiSnapshot } from "@/lib/control/maturity-calculator";

interface ControlKpiHeaderProps {
  snapshot: ControlKpiSnapshot;
  capturedAt: Date;
}

interface KpiCardProps {
  title: string;
  value: string;
  description: string;
}

function KpiCard({ title, value, description }: KpiCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="space-y-1 pb-3">
        <CardDescription className="text-xs uppercase tracking-wide">{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold">{value}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export function ControlKpiHeader({ snapshot, capturedAt }: ControlKpiHeaderProps) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-lg font-semibold">Overview</h2>
        <p className="text-xs text-muted-foreground">
          As of: {capturedAt.toLocaleString("en-GB")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          title="Documented Systems"
          value={String(snapshot.totalSystems)}
          description="Actively documented systems in the register."
        />
        <KpiCard
          title="High Risk"
          value={`${snapshot.highRiskCount} (${snapshot.highRiskPercent}%)`}
          description="Proportion classified as high risk."
        />
        <KpiCard
          title="Reviews due / overdue"
          value={`${snapshot.reviewsDue} / ${snapshot.reviewsOverdue}`}
          description="Due within 30 days / already overdue."
        />
        <KpiCard
          title="Systems without owner"
          value={String(snapshot.systemsWithoutOwner)}
          description="Without clear accountability assignment."
        />
        <KpiCard
          title="Governance Score"
          value={`${snapshot.governanceScore}%`}
          description="Documentation, ownership, review, oversight, policy mapping."
        />
        <KpiCard
          title="ISO Readiness"
          value={`${snapshot.isoReadinessPercent}%`}
          description="Review structure, documentation level, oversight, and audit history."
        />
      </div>
    </section>
  );
}
