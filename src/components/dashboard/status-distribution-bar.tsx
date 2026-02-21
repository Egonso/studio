"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RegisterUseCaseStatus } from "@/lib/register-first/types";
import { registerUseCaseStatusLabels } from "@/lib/register-first/status-flow";

interface StatusDistributionBarProps {
  distribution: Record<RegisterUseCaseStatus, number>;
  total: number;
}

const statusColors: Record<RegisterUseCaseStatus, string> = {
  UNREVIEWED: "bg-slate-400",
  REVIEW_RECOMMENDED: "bg-yellow-500",
  REVIEWED: "bg-blue-500",
  PROOF_READY: "bg-green-500",
};

const statusDotColors: Record<RegisterUseCaseStatus, string> = {
  UNREVIEWED: "bg-slate-400",
  REVIEW_RECOMMENDED: "bg-yellow-500",
  REVIEWED: "bg-blue-500",
  PROOF_READY: "bg-green-500",
};

const statusOrder: RegisterUseCaseStatus[] = [
  "UNREVIEWED",
  "REVIEW_RECOMMENDED",
  "REVIEWED",
  "PROOF_READY",
];

export function StatusDistributionBar({
  distribution,
  total,
}: StatusDistributionBarProps) {
  if (total === 0) return null;

  return (
    <Card className="shadow-sm border-slate-200 dark:border-slate-800">
      <CardContent className="py-4 px-6">
        <div className="flex items-center gap-3 mb-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Status-Verteilung
          </p>
          <span className="text-xs text-muted-foreground">
            ({total} Use Case{total !== 1 ? "s" : ""})
          </span>
        </div>

        {/* Bar */}
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
          {statusOrder.map((status) => {
            const count = distribution[status];
            if (count === 0) return null;
            const pct = (count / total) * 100;
            return (
              <div
                key={status}
                className={cn(
                  "transition-all duration-500 first:rounded-l-full last:rounded-r-full",
                  statusColors[status]
                )}
                style={{ width: `${pct}%` }}
                title={`${registerUseCaseStatusLabels[status]}: ${count}`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
          {statusOrder.map((status) => {
            const count = distribution[status];
            if (count === 0) return null;
            const pct = Math.round((count / total) * 100);
            return (
              <div key={status} className="flex items-center gap-1.5 text-xs">
                <div
                  className={cn("w-2 h-2 rounded-full", statusDotColors[status])}
                />
                <span className="text-muted-foreground">
                  {registerUseCaseStatusLabels[status]}
                </span>
                <span className="font-medium tabular-nums">
                  {count} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
