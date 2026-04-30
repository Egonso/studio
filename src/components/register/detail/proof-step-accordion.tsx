"use client";

import { type ReactNode, useState } from "react";
import { useLocale } from "next-intl";
import { ChevronDown } from "lucide-react";
import type {
  UseCaseReadinessResult,
  UseCaseReadinessStepKey,
} from "@/lib/register-first";
import { cn } from "@/lib/utils";

export type StepRenderer = (props: { onCollapse: () => void }) => ReactNode;

export type StepPresentation = "active" | "completed" | "upcoming";

export function resolvePresentation(
  readiness: UseCaseReadinessResult,
  stepKey: UseCaseReadinessStepKey,
): StepPresentation {
  const step = readiness.steps.find((s) => s.key === stepKey);
  if (!step) return "upcoming";
  if (step.complete) return "completed";
  if (readiness.nextStep?.key === step.key) return "active";
  return "upcoming";
}

function getStepHint(
  readiness: UseCaseReadinessResult,
  stepKey: UseCaseReadinessStepKey,
  presentation: StepPresentation,
  locale?: string,
): string {
  const isGerman = locale === "de";
  if (stepKey === "groundProofs") {
    if (presentation === "completed") {
      return isGerman ? "Bei Bedarf einsehbar." : "Available when needed.";
    }
    return isGerman
      ? "Erster Baustein des Nachweisstatus."
      : "First evidence-status block.";
  }

  if (stepKey === "systemEvidence") {
    if (presentation === "upcoming")
      return isGerman
        ? "Wird aktiv, sobald Schritt 1 abgeschlossen ist."
        : "Becomes active once step 1 is complete.";
    if (presentation === "completed") {
      return isGerman ? "Bei Bedarf einsehbar." : "Available when needed.";
    }
    return isGerman
      ? "Dokumentiert beteiligte Systeme und ihren Nachweisstand."
      : "Documents involved systems and their evidence status.";
  }

  // formalReview
  if (presentation === "upcoming") {
    if (readiness.nextStep?.key === "groundProofs")
      return isGerman
        ? "Voraussetzung: zuerst Grundnachweise und danach Systemnachweis abschliessen."
        : "Requirement: complete ground evidence first, then system evidence.";
    if (readiness.nextStep?.key === "systemEvidence")
      return isGerman
        ? "Voraussetzung: Systemnachweis abschliessen."
        : "Requirement: complete system evidence.";
    return isGerman
      ? "Dieser Schritt wird verfuegbar, sobald die fehlenden Nachweise abgeschlossen sind."
      : "This step becomes available once the missing evidence blocks are complete.";
  }
  if (presentation === "completed") {
    return isGerman ? "Bei Bedarf neu bewertbar." : "Can be reassessed when needed.";
  }
  return isGerman
    ? "Letzter Baustein zur Nachweisfaehigkeit."
    : "Final block for evidence readiness.";
}

function getStatusLabel(presentation: StepPresentation, locale?: string): string {
  const isGerman = locale === "de";
  if (presentation === "completed") return isGerman ? "abgeschlossen" : "complete";
  if (presentation === "active") return isGerman ? "aktiv" : "active";
  return isGerman ? "noch nicht verfuegbar" : "not yet available";
}

interface ProofStepAccordionProps {
  readiness: UseCaseReadinessResult;
  /** Which step is currently force-expanded via deep-link (?focus=) */
  focusExpandedStep?: UseCaseReadinessStepKey | null;
  /** Render functions for each step's expanded content */
  renderStep: Partial<Record<UseCaseReadinessStepKey, StepRenderer>>;
}

export function ProofStepAccordion({
  readiness,
  focusExpandedStep,
  renderStep,
}: ProofStepAccordionProps) {
  const locale = useLocale();
  const [manualExpand, setManualExpand] = useState<
    Partial<Record<UseCaseReadinessStepKey, boolean>>
  >({});

  return (
    <div className="space-y-3">
      {readiness.steps.map((step, index) => {
        const presentation = resolvePresentation(readiness, step.key);
        const hint = getStepHint(readiness, step.key, presentation, locale);
        const statusLabel = getStatusLabel(presentation, locale);
        const renderer = renderStep[step.key];

        const isFocusForced = focusExpandedStep === step.key;
        const manualState = manualExpand[step.key];
        const isExpanded =
          isFocusForced ||
          (manualState !== undefined
            ? manualState
            : presentation === "active");

        const canExpand =
          presentation !== "upcoming" && renderer !== undefined;

        const handleToggle = () => {
          if (!canExpand) return;
          setManualExpand((prev) => ({
            ...prev,
            [step.key]: !isExpanded,
          }));
        };

        const handleCollapse = () => {
          setManualExpand((prev) => ({
            ...prev,
            [step.key]: false,
          }));
        };

        return (
          <div
            key={step.key}
            id={`usecase-proof-step-${step.key}`}
            className={cn(
              "rounded-xl border bg-white transition-colors",
              isExpanded
                ? "border-slate-300"
                : presentation === "upcoming"
                  ? "border-slate-200 bg-slate-50/50"
                  : "border-slate-200",
            )}
          >
            <button
              type="button"
              className={cn(
                "flex w-full items-center justify-between gap-4 p-5 text-left md:px-6",
                canExpand && "cursor-pointer",
                !canExpand && "cursor-default",
              )}
              onClick={handleToggle}
              disabled={!canExpand}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                    presentation === "completed"
                      ? "border-slate-900 bg-slate-900"
                      : presentation === "active"
                        ? "border-slate-900 bg-white"
                        : "border-slate-300 bg-white",
                  )}
                >
                  {presentation === "completed" ? (
                    <svg
                      className="h-2.5 w-2.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : presentation === "active" ? (
                    <span className="h-2 w-2 rounded-full bg-slate-900" />
                  ) : null}
                </span>

                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-[16px] font-semibold tracking-tight",
                      presentation === "upcoming"
                        ? "text-slate-400"
                        : "text-slate-950",
                    )}
                  >
                    {index + 1}. {step.label}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 text-sm",
                      presentation === "upcoming"
                        ? "text-slate-400"
                        : "text-slate-600",
                    )}
                  >
                    {hint}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <p
                  className={cn(
                    "text-xs uppercase tracking-[0.08em]",
                    presentation === "completed"
                      ? "text-slate-500"
                      : presentation === "active"
                        ? "font-medium text-slate-900"
                        : "text-slate-400",
                  )}
                >
                  {statusLabel}
                </p>
                {canExpand ? (
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-slate-400 transition-transform duration-200",
                      isExpanded && "rotate-180",
                    )}
                  />
                ) : null}
              </div>
            </button>

            {isExpanded && renderer ? (
              <div className="border-t border-slate-200 p-5 md:p-6">
                {renderer({ onCollapse: handleCollapse })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
