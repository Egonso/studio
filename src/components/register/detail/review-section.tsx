"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  getRegisterUseCaseStatusLabel,
} from "@/lib/register-first";
import type { RegisterUseCaseStatus, UseCaseCard } from "@/lib/register-first/types";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface ReviewSectionProps {
  card: UseCaseCard;
  readiness: UseCaseReadinessResult;
  useCaseId: string;
  workspaceScope?: string | null;
  onStatusChange: (nextStatus: RegisterUseCaseStatus, reason?: string) => Promise<void>;
  onToggleDetails?: (() => void) | null;
}

function getReviewContext(
  readiness: UseCaseReadinessResult,
  locale: string,
): {
  title: string;
  description: string;
} {
  const isGerman = locale === "de";
  if (readiness.phase === "proof_ready") {
    return {
      title: isGerman ? "Formale Pruefung abgeschlossen" : "Formal review completed",
      description: isGerman
        ? "Der formale Status dieses Einsatzfalls ist dokumentiert."
        : "The formal status of this use case is documented.",
    };
  }

  if (readiness.phase === "review_pending") {
    return {
      title: isGerman
        ? "Formale Pruefung jetzt dokumentierbar"
        : "Formal review can now be documented",
      description: isGerman
        ? "Grundnachweise und Systemnachweis sind dokumentiert."
        : "Ground evidence and system evidence are documented.",
    };
  }

  if (readiness.nextStep?.key === "systemEvidence") {
    return {
      title: isGerman
        ? "Formale Pruefung noch nicht verfuegbar"
        : "Formal review not yet available",
      description: isGerman
        ? "Der Systemnachweis ist noch nicht vollstaendig dokumentiert."
        : "System evidence is not fully documented yet.",
    };
  }

  return {
    title: isGerman
      ? "Formale Pruefung noch nicht verfuegbar"
      : "Formal review not yet available",
    description: isGerman
      ? "Es fehlen noch Grundnachweise."
      : "Ground evidence is still missing.",
  };
}

function getReviewNextHint(
  readiness: UseCaseReadinessResult,
  locale: string,
): string {
  const isGerman = locale === "de";
  if (readiness.phase === "proof_ready") {
    return isGerman ? "Bei Bedarf neu bewertbar." : "Can be reassessed when needed.";
  }

  if (readiness.nextStep?.key === "groundProofs") {
    return isGerman
      ? "Erst 1. Grundnachweise abschliessen."
      : "Complete 1. Ground evidence first.";
  }

  if (readiness.nextStep?.key === "systemEvidence") {
    return isGerman
      ? "Erst 2. Systemnachweis abschliessen."
      : "Complete 2. System evidence first.";
  }

  return isGerman ? "Status jetzt dokumentieren." : "Document status now.";
}

export function ReviewSection({
  card,
  readiness,
  useCaseId,
  workspaceScope = null,
  onStatusChange,
  onToggleDetails = null,
}: ReviewSectionProps) {
  const locale = useLocale();
  const isGerman = locale === "de";
  const copy = {
    title: isGerman ? "3. Formale Pruefung" : "3. Formal review",
    subtitle: isGerman
      ? "Letzter Baustein zur Nachweisfaehigkeit."
      : "Final block for evidence readiness.",
    unavailableTitle: isGerman ? "Noch nicht verfuegbar" : "Not yet available",
    unavailableDescription: isGerman
      ? "Diese formale Pruefung wird erst freigegeben, wenn die fehlenden Nachweisbausteine abgeschlossen sind."
      : "This formal review becomes available once the missing evidence blocks are complete.",
    hideDetails: isGerman ? "Details ausblenden" : "Hide details",
    next: isGerman ? "Als Naechstes" : "Next",
    openPass: isGerman ? "Use-Case-Pass oeffnen" : "Open use case pass",
    hideReassessment: isGerman
      ? "Neubewertung ausblenden"
      : "Hide reassessment",
    reassessStatus: isGerman ? "Status neu bewerten" : "Reassess status",
    beforeFormalCompletionMissing: isGerman
      ? "Vor dem formalen Abschluss fehlt noch"
      : "Still missing before formal completion",
    currentStatus: isGerman ? "Aktueller Status:" : "Current status:",
    completedStatus: isGerman
      ? "Der aktuelle Status ist formal abgeschlossen."
      : "The current status is formally completed.",
    statusFieldReview: isGerman
      ? "Status neu bewerten"
      : "Reassess status",
    statusFieldDocument: isGerman
      ? "Formalen Status dokumentieren"
      : "Document formal status",
    statusPlaceholderReview: isGerman
      ? "Status fuer Neubewertung waehlen"
      : "Select status for reassessment",
    statusPlaceholderDocument: isGerman
      ? "Naechsten formalen Status waehlen"
      : "Select next formal status",
    proofReadyBlocked: isGerman
      ? "Der Status Nachweisfaehig wird erst verfuegbar, wenn die fehlenden Nachweisbausteine abgeschlossen sind."
      : "Evidence-ready becomes available once the missing evidence blocks are complete.",
    reasonLabel: isGerman
      ? "Begruendung der Statusaenderung (optional)"
      : "Reason for status change (optional)",
    reasonPlaceholder: isGerman
      ? "Begruendung eingeben..."
      : "Enter reason...",
    submitReassessment: isGerman
      ? "Neubewertung dokumentieren"
      : "Document reassessment",
    submitFormalReview: isGerman
      ? "Formale Pruefung dokumentieren"
      : "Document formal review",
    submitStatusChange: isGerman
      ? "Statusaenderung dokumentieren"
      : "Document status change",
    updateFailed: isGerman
      ? "Statuswechsel fehlgeschlagen. Bitte erneut versuchen."
      : "Status change failed. Please try again.",
    optionalReassessment: isGerman
      ? "Neubewertung bleibt optional verfuegbar."
      : "Reassessment remains optionally available.",
    reviewHints: isGerman ? "Review-Hinweise" : "Review notes",
    confirmFormalReview: isGerman
      ? "Formale Pruefung bestaetigen"
      : "Confirm formal review",
    confirmReassessment: isGerman
      ? "Neubewertung bestaetigen"
      : "Confirm reassessment",
    confirmStatusChange: isGerman
      ? "Statusaenderung bestaetigen"
      : "Confirm status change",
    confirmFrom: isGerman ? "Status von" : "Change status from",
    confirmTo: isGerman ? "zu" : "to",
    confirmSuffix: isGerman
      ? "aendern? Diese Aktion dokumentiert eine formale Entscheidung."
      : "? This action documents a formal decision.",
    cancel: isGerman ? "Abbrechen" : "Cancel",
    setting: isGerman ? "Wird gesetzt..." : "Setting...",
    confirm: isGerman ? "Bestaetigen" : "Confirm",
  };
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
  const reviewContext = getReviewContext(readiness, locale);
  const reviewNextHint = getReviewNextHint(readiness, locale);
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

  if (readiness.phase === "incomplete") {
    return (
      <Card className="border-slate-300">
        <CardHeader className="border-b border-slate-200 bg-white pb-4">
          <div className="space-y-2">
            <CardTitle className="text-base font-semibold text-slate-900">
              {copy.title}
            </CardTitle>
            <p className="text-sm text-slate-600">
              {copy.subtitle}
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-5 md:p-6 text-sm">
          <div className="rounded-md border border-slate-200 bg-slate-50/60 px-4 py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-900">
                  {copy.unavailableTitle}
                </p>
                <p className="text-sm leading-6 text-slate-600">
                  {copy.unavailableDescription}
                </p>
              </div>
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">
                {copy.unavailableTitle}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const shouldShowStatusForm =
    readiness.phase !== "proof_ready" || showReassessmentForm;
  const statusFieldLabel =
    readiness.phase === "proof_ready"
      ? copy.statusFieldReview
      : copy.statusFieldDocument;
  const statusTriggerPlaceholder =
    readiness.phase === "proof_ready"
      ? copy.statusPlaceholderReview
      : copy.statusPlaceholderDocument;
  const submitLabel =
    readiness.phase === "proof_ready"
      ? copy.submitReassessment
      : selectedStatus === "PROOF_READY"
        ? copy.submitFormalReview
        : copy.submitStatusChange;
  const confirmTitle =
    selectedStatus === "PROOF_READY"
      ? copy.confirmFormalReview
      : readiness.phase === "proof_ready"
        ? copy.confirmReassessment
        : copy.confirmStatusChange;
  const showNextHint = readiness.phase !== "proof_ready";

  const handleConfirm = async () => {
    if (!selectedStatus) return;
    setIsUpdating(true);
    setError(null);
    try {
      await onStatusChange(selectedStatus as RegisterUseCaseStatus, reason || undefined);
      setSelectedStatus("");
      setReason("");
    } catch (_err) {
      setError(copy.updateFailed);
    } finally {
      setIsUpdating(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <Card className="border-slate-300">
        <CardHeader className="border-b border-slate-200 bg-white pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-base font-semibold text-slate-900">
                {copy.title}
              </CardTitle>
              <p className="text-sm text-slate-600">
                {copy.subtitle}
              </p>
            </div>
            {onToggleDetails ? (
              <Button size="sm" variant="outline" onClick={onToggleDetails}>
                {copy.hideDetails}
              </Button>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-5 md:p-6 text-sm">
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
                {showNextHint ? (
                  <div className="pt-1">
                    <p className="text-xs uppercase tracking-[0.08em] text-slate-500">
                      {copy.next}
                    </p>
                    <p className="text-sm leading-6 text-slate-600">
                      {reviewNextHint}
                    </p>
                  </div>
                ) : null}
              </div>
              {readiness.phase === "proof_ready" ? (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link
                      href={buildScopedUseCasePassHref(useCaseId, workspaceScope)}
                    >
                      {copy.openPass}
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
                        ? copy.hideReassessment
                        : copy.reassessStatus}
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>

            {!readiness.canMarkProofReady ? (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <p className="text-xs uppercase tracking-[0.08em] text-slate-500">
                  {copy.beforeFormalCompletionMissing}
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
            <span className="text-sm text-muted-foreground">
              {copy.currentStatus}
            </span>
            <RegisterStatusPill status={card.status} />
          </div>

          {availableStatuses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {copy.completedStatus}
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
                          {getRegisterUseCaseStatusLabel(status, locale)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                </Select>
                {proofReadyBlocked ? (
                  <p className="mt-2 text-xs text-slate-500">
                    {copy.proofReadyBlocked}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">
                  {copy.reasonLabel}
                </label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={copy.reasonPlaceholder}
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
              {copy.optionalReassessment}
            </p>
          )}

          {card.reviewHints.length > 0 && (
            <div className="space-y-1.5 border-t border-slate-200 pt-4">
              <span className="text-xs text-muted-foreground">{copy.reviewHints}</span>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {card.reviewHints.map((hint, i) => (
                  <li key={i}>• {hint}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.confirmFrom}{" "}
              <strong>{getRegisterUseCaseStatusLabel(card.status, locale)}</strong>{" "}
              {copy.confirmTo}{" "}
              <strong>
                {selectedStatus
                  ? getRegisterUseCaseStatusLabel(
                      selectedStatus as RegisterUseCaseStatus,
                      locale,
                    )
                  : ""}
              </strong>{" "}
              {copy.confirmSuffix}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>{copy.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleConfirm()}
              disabled={isUpdating}
            >
              {isUpdating ? copy.setting : copy.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
