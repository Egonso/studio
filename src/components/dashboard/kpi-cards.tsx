"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  ClipboardList,
  Eye,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MaturityKpis } from "@/lib/register-first/maturity-engine";

interface KpiCardsProps {
  kpis: MaturityKpis;
}

interface KpiCardDef {
  label: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

export function KpiCards({ kpis }: KpiCardsProps) {
  const cards: KpiCardDef[] = [
    {
      label: "Core-Abdeckung",
      value: `${Math.round(kpis.coreFieldCoverage * 100)}%`,
      subtitle: `${kpis.activeUseCases} aktive Use Cases`,
      icon: ClipboardList,
      color: kpis.coreFieldCoverage >= 1 ? "text-green-600" : "text-yellow-600",
      bgColor: kpis.coreFieldCoverage >= 1 ? "bg-green-50 dark:bg-green-950/20" : "bg-yellow-50 dark:bg-yellow-950/20",
    },
    {
      label: "Review-Quote",
      value: `${Math.round(kpis.reviewRate * 100)}%`,
      subtitle: `${kpis.reviewedCount} von ${kpis.activeUseCases} geprüft`,
      icon: ShieldCheck,
      color: kpis.reviewRate >= 1 ? "text-green-600" : kpis.reviewRate >= 0.5 ? "text-yellow-600" : "text-red-600",
      bgColor: kpis.reviewRate >= 1 ? "bg-green-50 dark:bg-green-950/20" : kpis.reviewRate >= 0.5 ? "bg-yellow-50 dark:bg-yellow-950/20" : "bg-red-50 dark:bg-red-950/20",
    },
    {
      label: "Nachweisfähig",
      value: `${Math.round(kpis.proofReadyRate * 100)}%`,
      subtitle: `${kpis.proofReadyCount} Use Case${kpis.proofReadyCount !== 1 ? "s" : ""}`,
      icon: FileCheck2,
      color: kpis.proofReadyRate >= 1 ? "text-green-600" : "text-slate-600",
      bgColor: kpis.proofReadyRate >= 1 ? "bg-green-50 dark:bg-green-950/20" : "bg-slate-50 dark:bg-slate-950/20",
    },
    {
      label: "Hochrisiko ohne Prüfung",
      value: String(kpis.highImpactWithoutReview),
      subtitle: kpis.highImpactWithoutReview === 0 ? "Alles geprüft" : "Aktion erforderlich",
      icon: AlertTriangle,
      color: kpis.highImpactWithoutReview === 0 ? "text-green-600" : "text-red-600",
      bgColor: kpis.highImpactWithoutReview === 0 ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20",
    },
    {
      label: "Extern ohne Nachweis",
      value: String(kpis.externalFacingWithoutProof),
      subtitle: kpis.externalFacingWithoutProof === 0 ? "Alle abgesichert" : "Nachweise fehlen",
      icon: Eye,
      color: kpis.externalFacingWithoutProof === 0 ? "text-green-600" : "text-yellow-600",
      bgColor: kpis.externalFacingWithoutProof === 0 ? "bg-green-50 dark:bg-green-950/20" : "bg-yellow-50 dark:bg-yellow-950/20",
    },
    {
      label: "Fehlende Dokumentation",
      value: String(kpis.missingToolInfo + kpis.missingDataCategory),
      subtitle: `${kpis.missingToolInfo} Tool, ${kpis.missingDataCategory} Kategorie`,
      icon: Database,
      color: kpis.missingToolInfo + kpis.missingDataCategory === 0 ? "text-green-600" : "text-yellow-600",
      bgColor: kpis.missingToolInfo + kpis.missingDataCategory === 0 ? "bg-green-50 dark:bg-green-950/20" : "bg-yellow-50 dark:bg-yellow-950/20",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card
          key={card.label}
          className={cn(
            "shadow-sm border-slate-200 dark:border-slate-800 transition-colors",
            card.bgColor
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {card.label}
            </CardTitle>
            <card.icon className={cn("h-4 w-4", card.color)} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", card.color)}>
              {card.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.subtitle}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
