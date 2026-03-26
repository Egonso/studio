"use client";

import {
  ShieldCheck,
  FileCheck2,
  ClipboardList,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PortalKpis } from "@/lib/register-first/trust-portal-aggregator";

interface PortalKpiSectionProps {
  kpis: PortalKpis;
}

interface KpiDef {
  label: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
}

export function PortalKpiSection({ kpis }: PortalKpiSectionProps) {
  const cards: KpiDef[] = [
    {
      label: "KI-Systeme gesamt",
      value: String(kpis.totalSystems),
      subtitle: "Öffentlich dokumentiert",
      icon: ClipboardList,
      color: "text-gray-600",
    },
    {
      label: "Geprüfte Systeme",
      value: `${Math.round(kpis.reviewRate * 100)}%`,
      subtitle: `${kpis.reviewedCount} von ${kpis.totalSystems}`,
      icon: ShieldCheck,
      color:
        kpis.reviewRate >= 1
          ? "text-gray-600"
          : kpis.reviewRate >= 0.5
            ? "text-yellow-600"
            : "text-slate-500",
    },
    {
      label: "Nachweisfähig",
      value: `${Math.round(kpis.proofReadyRate * 100)}%`,
      subtitle: `${kpis.proofReadyCount} System${kpis.proofReadyCount !== 1 ? "e" : ""}`,
      icon: FileCheck2,
      color: kpis.proofReadyRate >= 1 ? "text-gray-600" : "text-slate-500",
    },
    {
      label: "Verifizierte Nachweise",
      value: String(kpis.verifiedProofCount),
      subtitle: kpis.hasVerifiedProofs ? "Unabhängig verifiziert" : "Noch keine",
      icon: BadgeCheck,
      color: kpis.hasVerifiedProofs ? "text-gray-600" : "text-slate-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-xl border border-slate-200 p-4 hover:border-gray-200 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {card.label}
            </span>
            <card.icon className={cn("h-4 w-4", card.color)} />
          </div>
          <div className={cn("text-2xl font-bold", card.color)}>
            {card.value}
          </div>
          <p className="text-xs text-slate-500 mt-1">{card.subtitle}</p>
        </div>
      ))}
    </div>
  );
}
