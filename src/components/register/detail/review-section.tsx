"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RegisterStatusPill } from "@/components/register/detail/status-pill";
import { buildUseCaseFocusLink } from "@/lib/control/deep-link";
import { buildScopedUseCasePassHref } from "@/lib/navigation/workspace-scope";
import {
  type UseCaseReadinessResult,
  getNextManualStatuses,
  registerUseCaseStatusLabels,
} from "@/lib/register-first";
import type { RegisterUseCaseStatus, UseCaseCard } from "@/lib/register-first/types";
import { cn } from "@/lib/utils";

interface ReviewSectionProps {
  card: UseCaseCard;
  readiness: UseCaseReadinessResult;
  useCaseId: string;
  workspaceScope?: string | null;
  onStatusChange: (nextStatus: RegisterUseCaseStatus, reason?: string) => Promise<void>;
}

function getReviewContext(
  card: UseCaseCard,
  readiness: UseCaseReadinessResult,
): {
  title: string;
  description: string;
} {
  if (readiness.phase === "proof_ready") {
    return {
      title: "Nachweisstatus: erreicht",
      description: "Dieser Einsatzfall ist formal nachweisfaehig dokumentiert.",
    };
  }

  if (readiness.phase === "review_pending") {
    return {
      title: "Formale Pruefung jetzt dokumentierbar",
      description: "Grundnachweise und Systemnachweis sind dokumentiert.",
    };
  }

  if (readiness.nextStep?.key === "systemEvidence") {
    return {
      title: "Formale Pruefung noch nicht abschliessbar",
      description: "Der Systemnachweis ist noch nicht vollstaendig dokumentiert.",
    };
  }

  return {
    title: "Formale Pruefung noch nicht abschliessbar",
    description: "Es fehlen noch Grundnachweise.",
  };
}

function getReviewNextHint(readiness: UseCaseReadinessResult): string {
  if (readiness.phase === "proof_ready") {
    return "Use-Case-Pass oeffnen oder Status neu bewerten.";
  }

  if (readiness.nextStep?.key === "groundProofs") {
    return "Erst 1. Grundnachweise abschliessen.";
  }

  if (readiness.nextStep?.key === "systemEvidence") {
    return "Erst 2. Systemnachweis abschliessen.";
  }

  return "Formale Pruefung jetzt dokumentieren.";
}

export function ReviewSection({
  card,
  readiness,
  useCaseId,
  workspaceScope = null,
  onStatusChange,
}: ReviewSectionProps) {
  const nextStatuses = getNextManualStatuses(card.status);
  const availableStatuses = useMemo(
    () =>
      nextStatuses.filter(
        (status) => status !== "PROOF_READY" || readiness.canMarkProofReady,
      ),
    [nextStatuses, readiness.canMarkProofReady],
  );
  const proofReadyBlocked =
    nextStatuses.includes("PROOF_READY") && !readiness.canMarkProofReady;
  const reviewContext = getReviewContext(card, readiness);
  const reviewNextHint = getReviewNextHint(readiness);
  const blockingSteps = readiness.steps.filter(
    (step) => !step.complete && step.key !== "formalReview",
  );
  const [selectedStatus, setSelectedStatus] = useState<RegisterUseCaseStatus | "">("");
  const [reason, setReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReassessmentForm, setShowReassessmentForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedStatus === "PROOF_READY" && !readiness.canMarkProofReady) {
      setSelectedStatus("");
    }
  }, [readiness.canMarkProofReady, selectedStatus]);

  useEffect(() => {
    if (readiness.phase !== "proof_ready") {
      setShowReassessmentForm(false);
    }
  }, [readiness.phase]);

  const shouldShowStatusForm =
    readiness.phase !== "proof_ready" || showReassessmentForm;
  const statusFieldLabel =
    readiness.phase === "proof_ready"
      ? "Status neu bewerten"
      : "Formalen Status dokumentieren";
  const statusTriggerPlaceholder =
    readiness.phase === "proof_ready"
      ? "Status fuer Neubewertung waehlen"
      : "Naechsten formalen Status waehlen";
  const submitLabel =
    readiness.phase === "proof_ready"
      ? "Neubewertung dokumentieren"
      : selectedStatus === "PROOF_READY"
        ? "Formale Pruefung dokumentieren"
        : "Statusaenderung dokumentieren";
  const confirmTitle =
    selectedStatus === "PROOF_READY"
      ? "Formale Pruefung bestaetigen"
      : readiness.phase === "proof_ready"
        ? "Neubewertung bestaetigen"
        : "Statusaenderung bestaetigen";

  const handleConfirm = async () => {
    if (!selectedStatus) return;
    setIsUpdating(true);
    setError(null);
    try {
      await onStatusChange(selectedStatus as RegisterUseCaseStatus, reason || undefined);
      setSelectedStatus("");
      setReason("");
    } catch (_err) {
      setError("Statuswechsel fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setIsUpdating(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <section className="border-t border-slate-200 pt-8">
        <div className="space-y-2">
          <h2 className="text-[18px] font-semibold tracking-tight">
            3. Formale Pruefung
          </h2>
          <p className="text-sm text-muted-foreground">Letzter Baustein zur Nachweisfaehigkeit.</p>
        </div>

        <div className="mt-6 space-y-5">
          <div
            className={cn(
              "rounded-md border px-4 py-4",
              readiness.phase === "proof_ready"
                ? "border-slate-200 bg-slate-50/50"
                : readiness.phase === "review_pending"
                  ? "border-slate-300 bg-white"
                  : "border-slate-200 bg-slate-50/60",
            )}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-900">
                  {reviewContext.title}
                </p>
                <p className="text-sm leading-6 text-slate-600">
                  {reviewContext.description}
                </p>
                <div className="pt-1">
                  <p className="text-xs uppercase tracking-[0.08em] text-slate-500">
                    Als Naechstes
                  </p>
                  <p className="text-sm leading-6 text-slate-600">
                    {reviewNextHint}
                  </p>
                </div>
              </div>
              {readiness.phase === "proof_ready" ? (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link
                      href={buildScopedUseCasePassHref(useCaseId, workspaceScope)}
                    >
                      Use-Case-Pass oeffnen
                    </Link>
                  </Button>
                  {availableStatuses.length > 0 ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setShowReassessmentForm((current) => !current)
                      }
                    >
                      {showReassessmentForm
                        ? "Neubewertung ausblenden"
                        : "Status neu bewerten"}
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>

            {!readiness.canMarkProofReady ? (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <p className="text-xs uppercase tracking-[0.08em] text-slate-500">
                  Vor dem formalen Abschluss fehlt noch
                </p>
                <ul className="mt-3 space-y-2">
                  {blockingSteps.map((step) => (
                    <li key={step.key} className="flex items-start gap-2 text-sm">
                      <span className="mt-[7px] inline-block h-2 w-2 rounded-full border border-slate-300 bg-white" />
                      <Link
                        href={buildUseCaseFocusLink(useCaseId, step.target.focus, {
                          workspaceScope,
                          edit: step.target.edit,
                          field: step.target.field,
                        })}
                        className="text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950"
                      >
                        {step.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">Aktueller Status:</span>
            <RegisterStatusPill status={card.status} />
          </div>

          {availableStatuses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Der aktuelle Status ist formal abgeschlossen.
            </p>
          ) : shouldShowStatusForm ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">
                  {statusFieldLabel}
                </label>
                <Select
                  value={selectedStatus}
                  onValueChange={(v) => setSelectedStatus(v as RegisterUseCaseStatus)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder={statusTriggerPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {registerUseCaseStatusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {proofReadyBlocked ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Der Status Nachweisfaehig wird erst verfuegbar, wenn die
                    fehlenden Nachweisbausteine dokumentiert sind.
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">
                  Begruendung der Statusaenderung (optional)
                </label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Begruendung eingeben..."
                  rows={3}
                  className="text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setShowConfirm(true)}
                  disabled={!selectedStatus || isUpdating}
                >
                  {isUpdating && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  {submitLabel}
                </Button>
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Neubewertung bleibt optional verfuegbar.
            </p>
          )}

          {card.reviewHints.length > 0 && (
            <div className="space-y-1.5 border-t border-slate-200 pt-4">
              <span className="text-xs text-muted-foreground">Review-Hinweise</span>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {card.reviewHints.map((hint, i) => (
                  <li key={i}>• {hint}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              Status von{" "}
              <strong>{registerUseCaseStatusLabels[card.status]}</strong> zu{" "}
              <strong>
                {selectedStatus
                  ? registerUseCaseStatusLabels[selectedStatus as RegisterUseCaseStatus]
                  : ""}
              </strong>{" "}
              aendern? Diese Aktion dokumentiert eine formale Entscheidung.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleConfirm()}
              disabled={isUpdating}
            >
              {isUpdating ? "Wird gesetzt..." : "Bestaetigen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
