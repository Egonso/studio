"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart3, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  evaluateMaturityCompliance,
  type MaturityLevel,
  type MaturityResult,
} from "@/lib/register-first/maturity-engine";
import type { Register, UseCaseCard } from "@/lib/register-first/types";

import { MaturityIndicator } from "./maturity-indicator";
import { KpiCards } from "./kpi-cards";
import { ActionItems } from "./action-items";
import { StatusDistributionBar } from "./status-distribution-bar";

interface MaturityDashboardProps {
  register: Register | null;
  useCases: UseCaseCard[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function MaturityDashboard({
  register,
  useCases,
  isLoading = false,
  onRefresh,
}: MaturityDashboardProps) {
  const [targetLevel, setTargetLevel] = useState<MaturityLevel>(2);

  const result: MaturityResult = useMemo(
    () => evaluateMaturityCompliance(register, useCases, targetLevel),
    [register, useCases, targetLevel]
  );

  const activeCount = result.kpis.activeUseCases;

  if (activeCount === 0 && !isLoading) {
    return (
      <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
        <CardContent className="py-10 text-center">
          <BarChart3 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            Noch keine Use Cases im Register. Erfassen Sie KI-Anwendungen, um
            den Governance-Reifegrad zu berechnen.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header row with level selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Governance-Reifegrad
          </h2>
          <p className="text-sm text-muted-foreground">
            Live-Auswertung über{" "}
            <span className="font-medium">{activeCount} aktive Use Case{activeCount !== 1 ? "s" : ""}</span>
            {register?.organisationName && (
              <> der Organisation <span className="font-medium">{register.organisationName}</span></>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(targetLevel)}
            onValueChange={(v) => setTargetLevel(Number(v) as MaturityLevel)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ziel-Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Level 1 – Basis</SelectItem>
              <SelectItem value="2">Level 2 – Erweitert</SelectItem>
              <SelectItem value="3">Level 3 – Audit-Ready</SelectItem>
            </SelectContent>
          </Select>
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
              title="Daten aktualisieren"
            >
              <RefreshCw
                className={cn("h-4 w-4", isLoading && "animate-spin")}
              />
            </Button>
          )}
        </div>
      </div>

      {/* Maturity indicator */}
      <MaturityIndicator
        currentLevel={result.currentLevel}
        targetLevel={targetLevel}
        fulfilmentRatio={result.fulfilmentRatio}
      />

      {/* Status distribution bar */}
      <StatusDistributionBar
        distribution={result.kpis.statusDistribution}
        total={result.kpis.activeUseCases}
      />

      {/* KPI Cards */}
      <KpiCards kpis={result.kpis} />

      {/* Action Items */}
      <ActionItems
        actionItems={result.actionItems}
        targetLevel={targetLevel}
      />
    </div>
  );
}
