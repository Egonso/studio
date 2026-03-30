"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buildScopedUseCasePassHref } from "@/lib/navigation/workspace-scope";
import type { UseCaseReadinessResult } from "@/lib/register-first";

interface ProofReadinessSummaryProps {
  readiness: UseCaseReadinessResult;
  useCaseId: string;
  workspaceScope?: string | null;
}

export function ProofReadinessSummary({
  readiness,
  useCaseId,
  workspaceScope,
}: ProofReadinessSummaryProps) {
  const isAllComplete =
    readiness.completedStepCount === readiness.steps.length;
  const standLabel = `${readiness.completedStepCount} von ${readiness.steps.length} Bausteinen abgeschlossen`;

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
          Nachweisstatus
        </p>
        <h2 className="text-[20px] font-semibold tracking-tight text-slate-950">
          {standLabel}
        </h2>
        {isAllComplete ? (
          <p className="text-sm text-slate-600">
            Dieser Einsatzfall ist vollstaendig nachweisfaehig dokumentiert.
          </p>
        ) : null}
      </div>
      {isAllComplete ? (
        <Button asChild size="sm">
          <Link href={buildScopedUseCasePassHref(useCaseId, workspaceScope)}>
            Use-Case-Pass oeffnen
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
