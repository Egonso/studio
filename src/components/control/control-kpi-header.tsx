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
        <h2 className="text-lg font-semibold">10-Sekunden-Ueberblick</h2>
        <p className="text-xs text-muted-foreground">
          Stand: {capturedAt.toLocaleString("de-DE")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          title="Systeme gesamt"
          value={String(snapshot.totalSystems)}
          description="Aktiv dokumentierte Systeme im Register."
        />
        <KpiCard
          title="Hochrisiko"
          value={`${snapshot.highRiskCount} (${snapshot.highRiskPercent}%)`}
          description="Anteil mit Einstufung Hochrisiko."
        />
        <KpiCard
          title="Reviews faellig / ueberfaellig"
          value={`${snapshot.reviewsDue} / ${snapshot.reviewsOverdue}`}
          description="Faellig in 30 Tagen / bereits ueberfaellig."
        />
        <KpiCard
          title="Systeme ohne Owner"
          value={String(snapshot.systemsWithoutOwner)}
          description="Ohne klare Verantwortlichkeitszuordnung."
        />
        <KpiCard
          title="Governance Score"
          value={`${snapshot.governanceScore}%`}
          description="Dokumentation, Ownership, Review, Aufsicht, Policy-Mapping."
        />
        <KpiCard
          title="ISO-Readiness"
          value={`${snapshot.isoReadinessPercent}%`}
          description="Review-Struktur, Dokumentationslevel, Aufsicht und Audit-Historie."
        />
      </div>
    </section>
  );
}
