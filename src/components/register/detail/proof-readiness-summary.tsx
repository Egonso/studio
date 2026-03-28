"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buildUseCaseFocusLink } from "@/lib/control/deep-link";
import { buildScopedUseCasePassHref } from "@/lib/navigation/workspace-scope";
import type { UseCaseReadinessResult } from "@/lib/register-first";
import { cn } from "@/lib/utils";

interface ProofReadinessSummaryProps {
  readiness: UseCaseReadinessResult;
  useCaseId: string;
  workspaceScope?: string | null;
}

function getPrimaryHref({
  readiness,
  useCaseId,
  workspaceScope,
}: ProofReadinessSummaryProps): string {
  if (readiness.completedStepCount === readiness.steps.length) {
    return buildScopedUseCasePassHref(useCaseId, workspaceScope);
  }

  if (readiness.nextStep?.key === "groundProofs" && readiness.nextItem) {
    return buildUseCaseFocusLink(
      useCaseId,
      readiness.nextItem.target.focus,
      {
        workspaceScope,
        edit: readiness.nextItem.target.edit,
        field: readiness.nextItem.target.field,
      },
    );
  }

  if (!readiness.nextStep) {
    return buildUseCaseFocusLink(useCaseId, "governance", { workspaceScope });
  }

  return buildUseCaseFocusLink(
    useCaseId,
    readiness.nextStep.target.focus,
    {
      workspaceScope,
      edit: readiness.nextStep.target.edit,
      field: readiness.nextStep.target.field,
    },
  );
}

function getPrimaryLabel(readiness: UseCaseReadinessResult): string {
  if (readiness.completedStepCount === readiness.steps.length) {
    return "Use-Case-Pass oeffnen";
  }

  if (readiness.nextStep?.key === "formalReview") {
    return "Jetzt formale Pruefung dokumentieren";
  }

  if (readiness.nextStep?.key === "systemEvidence") {
    return "Jetzt Systemnachweis erledigen";
  }

  return "Jetzt Grundnachweise erledigen";
}

function getStandLabel(readiness: UseCaseReadinessResult): string {
  return `${readiness.completedStepCount} von ${readiness.steps.length} Bausteinen dokumentiert`;
}

function getStepStatusLabel(
  readiness: UseCaseReadinessResult,
  stepKey: UseCaseReadinessResult["steps"][number]["key"],
): string {
  const step = readiness.steps.find((candidate) => candidate.key === stepKey);
  if (!step) {
    return "offen";
  }

  if (step.complete) {
    return "dokumentiert";
  }

  if (readiness.nextStep?.key === step.key) {
    return "aktiv";
  }

  return "spaeter";
}

export function ProofReadinessSummary(
  props: ProofReadinessSummaryProps,
) {
  const { readiness, useCaseId, workspaceScope } = props;
  const primaryHref = getPrimaryHref(props);
  const primaryLabel = getPrimaryLabel(readiness);
  const standLabel = getStandLabel(readiness);
  const isComplete = readiness.completedStepCount === readiness.steps.length;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 md:p-6">
      <div className="space-y-1.5">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
          Nachweisstatus
        </p>
        <h2 className="text-[20px] font-semibold tracking-tight text-slate-950">
          {standLabel}
        </h2>
        {isComplete ? (
          <p className="text-sm text-slate-600">Formal nachweisfaehig.</p>
        ) : null}
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
        {readiness.steps.map((step, index) => {
          const isNextStep = readiness.nextStep?.key === step.key;
          const statusLabel = getStepStatusLabel(readiness, step.key);
          return (
            <div
              key={step.key}
              className={cn(
                "flex items-center justify-between gap-4 px-4 py-3",
                index !== readiness.steps.length - 1 && "border-b border-slate-200",
                step.complete
                  ? "bg-white"
                  : isNextStep
                    ? "bg-slate-50/60"
                    : "bg-white",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "flex h-3 w-3 items-center justify-center rounded-full border",
                    step.complete
                      ? "border-slate-900 bg-slate-900"
                      : isNextStep
                        ? "border-slate-900 bg-white"
                        : "border-slate-300 bg-white",
                  )}
                >
                  {isNextStep ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                  ) : null}
                </span>
                <p
                  className={cn(
                    "truncate text-sm",
                    isNextStep ? "font-semibold text-slate-950" : "text-slate-700",
                  )}
                >
                  {index + 1}. {step.label}
                </p>
              </div>
              <p
                className={cn(
                  "shrink-0 text-xs uppercase tracking-[0.08em]",
                  step.complete
                    ? "text-slate-500"
                    : isNextStep
                      ? "font-medium text-slate-900"
                      : "text-slate-400",
                )}
              >
                {statusLabel}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button asChild size="sm">
          <Link href={primaryHref}>{primaryLabel}</Link>
        </Button>
      </div>
    </section>
  );
}
