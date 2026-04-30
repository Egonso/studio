"use client";

import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
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
  const locale = useLocale();
  const isGerman = locale === "de";
  const isAllComplete =
    readiness.completedStepCount === readiness.steps.length;
  const standLabel = isGerman
    ? `${readiness.completedStepCount} von ${readiness.steps.length} Bausteinen abgeschlossen`
    : `${readiness.completedStepCount} of ${readiness.steps.length} evidence blocks complete`;

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
          {isGerman ? "Nachweisstatus" : "Evidence status"}
        </p>
        <h2 className="text-[20px] font-semibold tracking-tight text-slate-950">
          {standLabel}
        </h2>
        {isAllComplete ? (
          <p className="text-sm text-slate-600">
            {isGerman
              ? "Dieser Einsatzfall ist vollstaendig nachweisfaehig dokumentiert."
              : "This use case is fully documented as evidence-ready."}
          </p>
        ) : null}
      </div>
      {isAllComplete ? (
        <Button asChild size="sm">
          <Link href={buildScopedUseCasePassHref(useCaseId, workspaceScope)}>
            {isGerman ? "Use-Case-Pass oeffnen" : "Open use case pass"}
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
