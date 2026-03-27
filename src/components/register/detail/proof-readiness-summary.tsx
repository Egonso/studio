"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buildUseCaseFocusLink } from "@/lib/control/deep-link";
import { buildScopedUseCasePassHref } from "@/lib/navigation/workspace-scope";
import type { UseCaseReadinessResult } from "@/lib/register-first";

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
  if (readiness.phase === "proof_ready") {
    return buildScopedUseCasePassHref(useCaseId, workspaceScope);
  }

  if (readiness.phase === "review_pending") {
    return buildUseCaseFocusLink(useCaseId, "review", { workspaceScope });
  }

  if (!readiness.nextItem) {
    return buildUseCaseFocusLink(useCaseId, "governance", { workspaceScope });
  }

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

function getPrimaryLabel(readiness: UseCaseReadinessResult): string {
  if (readiness.phase === "proof_ready") {
    return "Use-Case-Pass oeffnen";
  }

  if (readiness.phase === "review_pending") {
    return "Pruefstatus dokumentieren";
  }

  return "Naechsten Nachweis ergaenzen";
}

function getTitle(readiness: UseCaseReadinessResult): string {
  if (readiness.phase === "proof_ready") {
    return "Nachweisfaehig dokumentiert";
  }

  if (readiness.phase === "review_pending") {
    return "Grundnachweise vollstaendig";
  }

  return "Noch nicht nachweisfaehig";
}

function getDescription(readiness: UseCaseReadinessResult): string {
  if (readiness.phase === "proof_ready") {
    return "Dieser Einsatzfall ist formal nachweisbar dokumentiert.";
  }

  if (readiness.phase === "review_pending") {
    return "Alle Grundnachweise sind dokumentiert. Als naechstes kann der Pruefstatus dokumentiert werden.";
  }

  const count = readiness.missingItems.length;
  return count === 1
    ? "Fuer die formale Nachweisfaehigkeit fehlt noch 1 Grundnachweis."
    : `Fuer die formale Nachweisfaehigkeit fehlen noch ${count} Grundnachweise.`;
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
          Prueffaehigkeit
        </p>
        <h2 className="text-[20px] font-semibold tracking-tight text-slate-950">
          {getTitle(readiness)}
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          {getDescription(readiness)}
        </p>
      </div>

      {readiness.phase === "incomplete" ? (
        <ul className="mt-5 space-y-2 text-sm text-slate-700">
          {readiness.missingItems.map((item) => {
            const href = buildUseCaseFocusLink(useCaseId, item.target.focus, {
              workspaceScope,
              edit: item.target.edit,
              field: item.target.field,
            });

            return (
              <li key={item.key} className="flex items-start gap-2">
                <span className="mt-[7px] inline-block h-2 w-2 rounded-full border border-slate-300 bg-white" />
                <Link
                  href={href}
                  className="underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-950"
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button asChild size="sm">
          <Link href={primaryHref}>{primaryLabel}</Link>
        </Button>
      </div>
    </section>
  );
}
