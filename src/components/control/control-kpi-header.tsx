import { useLocale } from "next-intl";
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

function getControlKpiHeaderCopy(locale: string) {
  if (locale === "de") {
    return {
      overview: "Überblick",
      asOf: "Stand",
      dateLocale: "de-DE",
      documentedSystems: "Dokumentierte Systeme",
      documentedSystemsDesc: "Aktiv dokumentierte Systeme im Register.",
      highRisk: "Hochrisiko",
      highRiskDesc: "Anteil mit Einstufung Hochrisiko.",
      reviewsDue: "Reviews fällig / überfällig",
      reviewsDueDesc: "Fällig in 30 Tagen / bereits überfällig.",
      systemsWithoutOwner: "Systeme ohne Owner",
      systemsWithoutOwnerDesc: "Ohne klare Verantwortlichkeitszuordnung.",
      governanceScore: "Governance-Score",
      governanceScoreDesc:
        "Dokumentation, Ownership, Review, Aufsicht, Policy-Mapping.",
      isoReadiness: "ISO-Readiness",
      isoReadinessDesc:
        "Review-Struktur, Dokumentationslevel, Aufsicht und Audit-Historie.",
    } as const;
  }

  return {
    overview: "Overview",
    asOf: "As of",
    dateLocale: "en-GB",
    documentedSystems: "Documented Systems",
    documentedSystemsDesc: "Actively documented systems in the register.",
    highRisk: "High Risk",
    highRiskDesc: "Proportion classified as high risk.",
    reviewsDue: "Reviews due / overdue",
    reviewsDueDesc: "Due within 30 days / already overdue.",
    systemsWithoutOwner: "Systems without owner",
    systemsWithoutOwnerDesc: "Without clear accountability assignment.",
    governanceScore: "Governance Score",
    governanceScoreDesc:
      "Documentation, ownership, review, oversight, policy mapping.",
    isoReadiness: "ISO Readiness",
    isoReadinessDesc:
      "Review structure, documentation level, oversight, and audit history.",
  } as const;
}

export function ControlKpiHeader({ snapshot, capturedAt }: ControlKpiHeaderProps) {
  const locale = useLocale();
  const copy = getControlKpiHeaderCopy(locale);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-lg font-semibold">{copy.overview}</h2>
        <p className="text-xs text-muted-foreground">
          {copy.asOf}: {capturedAt.toLocaleString(copy.dateLocale)}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          title={copy.documentedSystems}
          value={String(snapshot.totalSystems)}
          description={copy.documentedSystemsDesc}
        />
        <KpiCard
          title={copy.highRisk}
          value={`${snapshot.highRiskCount} (${snapshot.highRiskPercent}%)`}
          description={copy.highRiskDesc}
        />
        <KpiCard
          title={copy.reviewsDue}
          value={`${snapshot.reviewsDue} / ${snapshot.reviewsOverdue}`}
          description={copy.reviewsDueDesc}
        />
        <KpiCard
          title={copy.systemsWithoutOwner}
          value={String(snapshot.systemsWithoutOwner)}
          description={copy.systemsWithoutOwnerDesc}
        />
        <KpiCard
          title={copy.governanceScore}
          value={`${snapshot.governanceScore}%`}
          description={copy.governanceScoreDesc}
        />
        <KpiCard
          title={copy.isoReadiness}
          value={`${snapshot.isoReadinessPercent}%`}
          description={copy.isoReadinessDesc}
        />
      </div>
    </section>
  );
}
