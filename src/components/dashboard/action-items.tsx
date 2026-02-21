"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MaturityCriterion, MaturityLevel } from "@/lib/register-first/maturity-engine";

interface ActionItemsProps {
  actionItems: MaturityCriterion[];
  targetLevel: MaturityLevel;
}

const levelLabels: Record<MaturityLevel, string> = {
  1: "Basis",
  2: "Erweitert",
  3: "Audit-Ready",
};

const levelColors: Record<MaturityLevel, string> = {
  1: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  2: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  3: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

export function ActionItems({ actionItems, targetLevel }: ActionItemsProps) {
  if (actionItems.length === 0) {
    return (
      <Card className="shadow-sm border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
        <CardContent className="py-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                Alle Anforderungen für Level {targetLevel} erfüllt
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                Ihr Register entspricht dem Ziel-Level "{levelLabels[targetLevel]}".
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group by level
  const grouped = actionItems.reduce<Record<number, MaturityCriterion[]>>(
    (acc, item) => {
      const lvl = item.level;
      if (!acc[lvl]) acc[lvl] = [];
      acc[lvl].push(item);
      return acc;
    },
    {}
  );

  return (
    <Card className="shadow-sm border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Handlungsbedarf
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {actionItems.length} offene{actionItems.length !== 1 ? " Punkte" : "r Punkt"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {([1, 2, 3] as MaturityLevel[]).map((level) => {
          const items = grouped[level];
          if (!items || items.length === 0) return null;

          return (
            <div key={level} className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={cn("text-xs font-medium", levelColors[level])}>
                  Level {level} – {levelLabels[level]}
                </Badge>
              </div>
              <ul className="space-y-1.5">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-2 text-sm rounded-md px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                  >
                    <ChevronRight className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {item.label}
                      </span>
                      {item.gap && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.gap}
                        </p>
                      )}
                    </div>
                    {item.violatingUseCaseIds.length > 0 && (
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {item.violatingUseCaseIds.length} UC{item.violatingUseCaseIds.length !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
