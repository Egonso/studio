"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MaturityLevel } from "@/lib/register-first/maturity-engine";

interface MaturityIndicatorProps {
  currentLevel: 0 | 1 | 2 | 3;
  targetLevel: MaturityLevel;
  fulfilmentRatio: number;
}

const levels = [
  { level: 1, label: "Basis", description: "Dokumentation" },
  { level: 2, label: "Erweitert", description: "Governance" },
  { level: 3, label: "Audit-Ready", description: "Nachweisfähig" },
] as const;

export function MaturityIndicator({
  currentLevel,
  targetLevel,
  fulfilmentRatio,
}: MaturityIndicatorProps) {
  return (
    <Card className="shadow-sm border-slate-200 dark:border-slate-800">
      <CardContent className="py-5 px-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
          {/* Level label */}
          <div className="shrink-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
              Governance-Reifegrad
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums">
                {currentLevel}
              </span>
              <span className="text-sm text-muted-foreground">/ {targetLevel}</span>
            </div>
          </div>

          {/* Level steps */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {levels.map(({ level, label, description }) => {
                const isTarget = level === targetLevel;
                const isMet = level <= currentLevel;
                const isCurrent = level === currentLevel;

                return (
                  <div key={level} className="flex items-center gap-2 flex-1">
                    <div
                      className={cn(
                        "flex flex-col items-center text-center flex-1 py-2 px-1 rounded-lg border transition-all",
                        isMet
                          ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                          : isTarget
                            ? "bg-slate-100 dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-700"
                            : "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800",
                        isCurrent && "ring-2 ring-green-500/50"
                      )}
                    >
                      <span
                        className={cn(
                          "text-xs font-bold",
                          isMet
                            ? "text-green-700 dark:text-green-300"
                            : "text-slate-500"
                        )}
                      >
                        Level {level}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] leading-tight mt-0.5",
                          isMet
                            ? "text-green-600 dark:text-green-400"
                            : "text-muted-foreground"
                        )}
                      >
                        {label}
                      </span>
                    </div>
                    {level < 3 && (
                      <div
                        className={cn(
                          "w-4 h-0.5 shrink-0",
                          level < currentLevel
                            ? "bg-green-400"
                            : "bg-slate-200 dark:bg-slate-700"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    fulfilmentRatio >= 1
                      ? "bg-green-500"
                      : fulfilmentRatio >= 0.6
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  )}
                  style={{ width: `${Math.round(fulfilmentRatio * 100)}%` }}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground tabular-nums w-10 text-right">
                {Math.round(fulfilmentRatio * 100)}%
              </span>
            </div>
          </div>

          {/* Target badge */}
          <div className="shrink-0 hidden sm:block">
            <Badge
              variant={currentLevel >= targetLevel ? "default" : "outline"}
              className={cn(
                "text-xs",
                currentLevel >= targetLevel
                  ? "bg-green-600 hover:bg-green-700"
                  : ""
              )}
            >
              {currentLevel >= targetLevel ? "Ziel erreicht" : `Ziel: Level ${targetLevel}`}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
