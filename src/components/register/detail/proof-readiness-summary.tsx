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
    return "Pruefung dokumentieren";
  }

  if (readiness.nextStep?.key === "systemEvidence") {
    return "Systemnachweis oeffnen";
  }

  return "Naechsten Baustein ergaenzen";
}

function getTitle(readiness: UseCaseReadinessResult): string {
  if (readiness.completedStepCount === readiness.steps.length) {
    return "Nachweisstatus: erreicht";
  }

  return `Nachweisstatus: ${readiness.completedStepCount} von ${readiness.steps.length} Bausteinen dokumentiert`;
}

function getDescription(readiness: UseCaseReadinessResult): string {
  if (readiness.completedStepCount === readiness.steps.length) {
    return "Grundnachweise, Systemnachweis und formale Pruefung sind dokumentiert. Dieser Einsatzfall ist formal nachweisfaehig.";
  }

  const missingSteps = readiness.steps.filter((step) => !step.complete);
  const missingLabels = missingSteps.map((step) => step.label).join(", ");
  const nextLabel = readiness.nextStep ? ` Als Naechstes: ${readiness.nextStep.label}.` : "";
  return `Fehlt noch: ${missingLabels}.${nextLabel}`;
}

export function ProofReadinessSummary(
  props: ProofReadinessSummaryProps,
) {
  const { readiness, useCaseId, workspaceScope } = props;
  const primaryHref = getPrimaryHref(props);
  const primaryLabel = getPrimaryLabel(readiness);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 md:p-6">
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
          Nachweisstatus
        </p>
        <h2 className="text-[20px] font-semibold tracking-tight text-slate-950">
          {getTitle(readiness)}
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          {getDescription(readiness)}
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {readiness.steps.map((step, index) => {
          const isNextStep = readiness.nextStep?.key === step.key;
          return (
            <div
              key={step.key}
              className={cn(
                "rounded-lg border px-4 py-4",
                step.complete
                  ? "border-slate-200 bg-slate-50/60"
                  : isNextStep
                    ? "border-slate-300 bg-white"
                    : "border-slate-200 bg-white",
              )}
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
                {index + 1}. {step.label}
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {step.complete ? "Dokumentiert" : "Offen"}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {step.detail}
              </p>
              {isNextStep ? (
                <p className="mt-3 text-xs text-slate-500">Als Naechstes</p>
              ) : null}
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
