"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Eye, AlertCircle, CopyPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { PortalSystemEntry } from "@/lib/register-first/trust-portal-aggregator";
import type { RegisterUseCaseStatus } from "@/lib/register-first/types";

interface PortalSystemsTableProps {
  systems: PortalSystemEntry[];
  organizationName?: string | null;
}

const statusConfig: Record<
  RegisterUseCaseStatus,
  { label: string; color: string; bgColor: string; icon: React.ElementType }
> = {
  UNREVIEWED: {
    label: "Erfasst",
    color: "text-slate-600",
    bgColor: "bg-slate-100",
    icon: Clock,
  },
  REVIEW_RECOMMENDED: {
    label: "In Prüfung",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
    icon: AlertCircle,
  },
  REVIEWED: {
    label: "Geprüft",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    icon: Eye,
  },
  PROOF_READY: {
    label: "Nachweisfähig",
    color: "text-green-700",
    bgColor: "bg-green-100",
    icon: CheckCircle2,
  },
};

const dataCategoryLabels: Record<string, string> = {
  NONE: "Keine",
  INTERNAL: "Intern",
  PERSONAL: "Personenbezogen",
  SENSITIVE: "Sensibel",
};

export function PortalSystemsTable({ systems, organizationName }: PortalSystemsTableProps) {
  const router = useRouter();

  if (systems.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p className="italic">Keine KI-Systeme öffentlich gelistet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {systems.map((system) => {
        const config = statusConfig[system.status] || statusConfig.UNREVIEWED;
        const StatusIcon = config.icon;

        return (
          <div
            key={system.publicHashId}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-200 hover:shadow-sm transition-all"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {system.toolName}
                  </h3>
                  {system.isVerified && (
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  )}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mt-1">
                  {system.purpose}
                </p>

                {/* PLG Conversion Call to Action */}
                <div className="mt-4 inline-block">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-indigo-700 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 hover:text-indigo-800 transition-colors"
                    onClick={() => router.push(`/login?importUseCase=${system.publicHashId}`)}
                  >
                    <CopyPlus className="h-3.5 w-3.5 mr-1.5" />
                    {organizationName
                      ? `KI-System von ${organizationName} für eigenes Register übernehmen`
                      : 'Als Grundstein für eigenes Register übernehmen'}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <Badge
                  variant="secondary"
                  className="text-xs bg-slate-100 text-slate-600"
                >
                  {dataCategoryLabels[system.dataCategory] || system.dataCategory}
                </Badge>
                <Badge
                  variant="secondary"
                  className={cn("text-xs", config.bgColor, config.color)}
                >
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
