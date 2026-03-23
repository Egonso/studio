"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  createAiToolsRegistryService,
  getRiskClassDisplayLabel,
  type UseCaseCard,
} from "@/lib/register-first";
import { registerService } from "@/lib/register-first/register-service";
import { cn } from "@/lib/utils";
import {
  applyRiskManualSelection,
  CUSTOM_RISK_SELECTION,
  getRiskManualOptionDescription,
  getRiskManualOptionLabel,
  getRiskManualSelectionValue,
  RISK_CLASS_MANUAL_OPTIONS,
} from "./risk-class-assist-model";
import {
  buildDraftAssessmentRequestPayload,
  buildRiskReviewAssessmentPayload,
  buildRiskReviewLaunchContextFromUseCase,
  createInitialRiskReviewFormState,
  shouldShowGovernanceReviewStep,
  type RiskReviewBooleanChoice,
  type RiskReviewLaunchContext,
} from "./use-case-assessment-wizard-model";

const aiRegistry = createAiToolsRegistryService();

const SIGNAL_STRENGTH_LABELS = {
  low: "wenige Signale",
  medium: "mehrere Signale",
  high: "starke Signale",
} as const;

const REVIEW_BOOLEAN_OPTIONS: Array<{
  value: RiskReviewBooleanChoice;
  label: string;
}> = [
  { value: "yes", label: "Ja" },
  { value: "no", label: "Nein" },
  { value: "unknown", label: "Noch offen" },
];

interface UseCaseAssessmentWizardProps {
  card: UseCaseCard;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => Promise<void>;
  launchContext?: RiskReviewLaunchContext | null;
}

function StepLead({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
        {eyebrow}
      </p>
      <h3 className="text-[17px] font-semibold tracking-tight text-slate-950">
        {title}
      </h3>
      <p className="max-w-[62ch] text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

function SummaryBlock({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string | null;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-[15px] font-semibold text-slate-950">{value}</p>
      {detail ? <p className="mt-1 text-sm text-slate-600">{detail}</p> : null}
    </div>
  );
}

function SummaryList({
  label,
  items,
  emptyLabel,
}: {
  label: string;
  items: string[];
  emptyLabel: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      {items.length ? (
        <ul className="mt-3 space-y-2 pl-5 text-sm leading-6 text-slate-700 marker:text-slate-400 list-disc">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-600">{emptyLabel}</p>
      )}
    </div>
  );
}

function BooleanChoiceField({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description: string;
  value: RiskReviewBooleanChoice;
  onValueChange: (nextValue: RiskReviewBooleanChoice) => void;
}) {
  const fieldId = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </div>

      <RadioGroup
        value={value}
        onValueChange={(nextValue) =>
          onValueChange(nextValue as RiskReviewBooleanChoice)
        }
        className="mt-4 flex flex-col gap-2 sm:flex-row"
      >
        {REVIEW_BOOLEAN_OPTIONS.map((option) => (
          <Label
            key={option.value}
            htmlFor={`${fieldId}-${option.value}`}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 transition-colors",
              value === option.value && "border-slate-900 bg-slate-50",
            )}
          >
            <RadioGroupItem
              id={`${fieldId}-${option.value}`}
              value={option.value}
            />
            {option.label}
          </Label>
        ))}
      </RadioGroup>
    </div>
  );
}

export function UseCaseAssessmentWizard({
  card,
  open,
  onOpenChange,
  onComplete,
  launchContext = null,
}: UseCaseAssessmentWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [previousManualNote, setPreviousManualNote] = useState<string | null>(null);

  const fallbackToolRiskLevel = useMemo(
    () => (card.toolId ? aiRegistry.getById(card.toolId)?.riskLevel ?? null : null),
    [card.toolId],
  );
  const toolEntry = useMemo(
    () => (card.toolId ? aiRegistry.getById(card.toolId) ?? null : null),
    [card.toolId],
  );

  const reviewContext = useMemo(
    () =>
      launchContext ??
      buildRiskReviewLaunchContextFromUseCase(card, fallbackToolRiskLevel),
    [card, fallbackToolRiskLevel, launchContext],
  );

  const [formState, setFormState] = useState(() =>
    createInitialRiskReviewFormState(card, reviewContext),
  );

  useEffect(() => {
    if (!open) return;
    setFormState(createInitialRiskReviewFormState(card, reviewContext));
    setStepIndex(0);
    setDraftError(null);
    setPreviousManualNote(null);
  }, [card, open, reviewContext]);

  const manualRiskSelectionValue = getRiskManualSelectionValue(
    formState.aiActCategory,
  );
  const showGovernanceStep = shouldShowGovernanceReviewStep({
    suggestion: reviewContext.suggestion,
    aiActCategory: formState.aiActCategory,
    oversightDefined: formState.oversightDefined,
    reviewCycleDefined: formState.reviewCycleDefined,
    documentationLevelDefined: formState.documentationLevelDefined,
  });
  const steps = useMemo(
    () =>
      [
        "summary",
        "classification",
        ...(showGovernanceStep ? ["governance"] : []),
        "note",
      ] as const,
    [showGovernanceStep],
  );

  useEffect(() => {
    setStepIndex((current) => Math.min(current, steps.length - 1));
  }, [steps.length]);

  const currentStep = steps[stepIndex];
  const suggestionLabel = getRiskClassDisplayLabel(
    reviewContext.suggestion.suggestedRiskClass,
  );
  const currentRiskLabel =
    reviewContext.currentRiskDisplayLabel ?? "Noch kein dokumentierter Eintrag";

  const handleApplySuggestion = () => {
    if (reviewContext.suggestion.suggestedRiskClass === "UNASSESSED") {
      return;
    }

    setFormState((prev) => ({
      ...prev,
      aiActCategory: applyRiskManualSelection(
        reviewContext.suggestion.suggestedRiskClass,
      ),
    }));
  };

  const handleGenerateDraft = async () => {
    setIsGeneratingDraft(true);
    setDraftError(null);

    const manualBackup =
      formState.customAssessmentText.trim().length > 0 &&
      formState.customAssessmentSource !== "AI_DRAFT"
        ? formState.customAssessmentText
        : null;

    if (manualBackup) {
      setPreviousManualNote(manualBackup);
    }

    try {
      const { getFirebaseAuth } = await import("@/lib/firebase");
      const auth = await getFirebaseAuth();
      const token = await auth.currentUser?.getIdToken();

      const response = await fetch("/api/draft-assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(
          buildDraftAssessmentRequestPayload({
            systemName: toolEntry?.productName ?? card.toolFreeText ?? null,
            vendor: toolEntry?.vendor ?? null,
            launchContext: reviewContext,
            formState,
          }),
        ),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Fehler beim Formulieren des Entwurfs.");
      }

      const nextDraft = typeof data?.draft === "string" ? data.draft.trim() : "";
      if (!nextDraft) {
        throw new Error("Es konnte kein verwertbarer Entwurf erzeugt werden.");
      }

      setFormState((prev) => ({
        ...prev,
        customAssessmentText: nextDraft,
        customAssessmentSource: "AI_DRAFT",
      }));
    } catch (error) {
      console.error(error);
      setDraftError(
        error instanceof Error
          ? error.message
          : "Der Entwurf konnte gerade nicht erzeugt werden.",
      );
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleRestorePreviousNote = () => {
    if (!previousManualNote) return;

    setFormState((prev) => ({
      ...prev,
      customAssessmentText: previousManualNote,
      customAssessmentSource: "MANUAL",
    }));
    setPreviousManualNote(null);
    setDraftError(null);
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const payload = buildRiskReviewAssessmentPayload(card, formState);

      await registerService.updateAssessmentManual({
        useCaseId: card.useCaseId,
        ...payload,
      });

      onOpenChange(false);
      await onComplete();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSubmitting && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="space-y-2">
          <DialogTitle>Kurze Pruefung zur Risikoklasse</DialogTitle>
          <DialogDescription className="max-w-[62ch] leading-6">
            Diese Pruefung dokumentiert eine menschliche Einordnung. Sie setzt
            keine Risikoklasse automatisch und ersetzt keine umfassendere
            Governance-Pruefung.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-slate-200 bg-slate-50/60 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            Einsatzfall
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {reviewContext.purpose}
          </p>
        </div>

        <div className="min-h-[360px] py-2">
          {currentStep === "summary" ? (
            <div className="space-y-5">
              <StepLead
                eyebrow="Ausgangspunkt"
                title="Signale und Einordnung"
                body="Der Vorschlag bleibt ein Entwurf. Entscheidend ist, was Sie fuer diesen Einsatzfall tatsaechlich dokumentieren wollen."
              />

              <div className="grid gap-3 md:grid-cols-2">
                <SummaryBlock
                  label="Aktuelle Einstufung"
                  value={currentRiskLabel}
                />
                <SummaryBlock
                  label="Vorschlag"
                  value={suggestionLabel}
                  detail={[
                    `Signalstaerke: ${SIGNAL_STRENGTH_LABELS[reviewContext.suggestion.signalStrength]}.`,
                    reviewContext.suggestion.reviewRecommended
                      ? "Kurze Pruefung empfohlen."
                      : "Kurze Pruefung optional.",
                  ].join(" ")}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <SummaryList
                  label="Warum diese Richtung naheliegt"
                  items={reviewContext.suggestion.reasons}
                  emptyLabel="Noch keine begruendenden Signale sichtbar."
                />
                <SummaryList
                  label="Was noch offen sein kann"
                  items={reviewContext.suggestion.openQuestions}
                  emptyLabel="Aktuell sind keine offenen Rueckfragen markiert."
                />
              </div>
            </div>
          ) : null}

          {currentStep === "classification" ? (
            <div className="space-y-5">
              <StepLead
                eyebrow="Einordnung"
                title="Risikoklasse bestaetigen oder anpassen"
                body="Waehlen Sie die derzeit tragfaehigste Klasse. Wenn Sie nichts aendern, bleibt ein bestehender Eintrag erhalten."
              />

              {reviewContext.hasCustomRiskValue &&
              reviewContext.currentRiskDisplayLabel ? (
                <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm font-medium text-slate-900">
                    Bestehender Freitext-Vermerk
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    "{reviewContext.currentRiskDisplayLabel}" bleibt erhalten,
                    bis Sie unten bewusst eine kanonische Klasse auswaehlen.
                  </p>
                </div>
              ) : null}

              {reviewContext.suggestion.suggestedRiskClass !== "UNASSESSED" ? (
                <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
                  <p className="text-sm font-medium text-slate-900">
                    Vorschlag fuer diese Pruefung
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {suggestionLabel} kann als Entwurf uebernommen und danach
                    bei Bedarf angepasst werden.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={handleApplySuggestion}
                  >
                    Vorschlag uebernehmen
                  </Button>
                </div>
              ) : null}

              <RadioGroup
                value={
                  manualRiskSelectionValue === CUSTOM_RISK_SELECTION
                    ? ""
                    : manualRiskSelectionValue
                }
                onValueChange={(nextValue) =>
                  setFormState((prev) => ({
                    ...prev,
                    aiActCategory: applyRiskManualSelection(
                      nextValue as (typeof RISK_CLASS_MANUAL_OPTIONS)[number],
                    ),
                  }))
                }
                className="gap-2"
              >
                {RISK_CLASS_MANUAL_OPTIONS.map((option) => {
                  const isSelected = manualRiskSelectionValue === option;
                  return (
                    <Label
                      key={option}
                      htmlFor={`wizard-risk-class-${option}`}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 bg-white px-4 py-4 transition-colors",
                        isSelected && "border-slate-900 bg-slate-50",
                      )}
                    >
                      <RadioGroupItem
                        id={`wizard-risk-class-${option}`}
                        value={option}
                        className="mt-0.5"
                      />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-900">
                          {getRiskManualOptionLabel(option)}
                        </p>
                        <p className="text-sm leading-6 text-slate-600">
                          {getRiskManualOptionDescription(option)}
                        </p>
                      </div>
                    </Label>
                  );
                })}
              </RadioGroup>

              <p className="text-xs leading-5 text-slate-500">
                "Noch nicht eingestuft" ist zulaessig, wenn die Einordnung
                derzeit bewusst offen bleiben soll.
              </p>
            </div>
          ) : null}

          {currentStep === "governance" ? (
            <div className="space-y-5">
              <StepLead
                eyebrow="Pruefbedarf"
                title="Begleitende Governance-Fakten festhalten"
                body="Nur soweit derzeit belastbar dokumentierbar. Offene Punkte koennen offen bleiben."
              />

              <div className="space-y-3">
                <BooleanChoiceField
                  label="Menschliche Aufsicht"
                  description="Ist derzeit dokumentiert, wie Outputs oder entscheidungsnahe Effekte menschlich ueberwacht werden?"
                  value={formState.oversightDefined}
                  onValueChange={(nextValue) =>
                    setFormState((prev) => ({
                      ...prev,
                      oversightDefined: nextValue,
                    }))
                  }
                />
                <BooleanChoiceField
                  label="Review-Zyklus"
                  description="Ist ein nachvollziehbarer Turnus fuer erneute Pruefung oder Aktualisierung festgelegt?"
                  value={formState.reviewCycleDefined}
                  onValueChange={(nextValue) =>
                    setFormState((prev) => ({
                      ...prev,
                      reviewCycleDefined: nextValue,
                    }))
                  }
                />
                <BooleanChoiceField
                  label="Dokumentationsstand"
                  description="Sind Zweck, Grenzen und Einsatzparameter derzeit in ausreichender Form beschrieben?"
                  value={formState.documentationLevelDefined}
                  onValueChange={(nextValue) =>
                    setFormState((prev) => ({
                      ...prev,
                      documentationLevelDefined: nextValue,
                    }))
                  }
                />
              </div>
            </div>
          ) : null}

          {currentStep === "note" ? (
            <div className="space-y-5">
              <StepLead
                eyebrow="Vermerk"
                title="Zusaetzlichen Hinweis dokumentieren"
                body="Optional. Fuer kurze Begruendung, offene Punkte oder einen bestehenden Draft-Vermerk. AI dient hier nur als Formulierungshilfe."
              />

              <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm font-medium text-slate-900">
                  AI-Formulierungshilfe
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  AI kann einen sachlichen Begruendungsentwurf formulieren. Die
                  Auswahl der Risikoklasse bleibt eine menschliche Entscheidung.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateDraft}
                    disabled={isGeneratingDraft}
                  >
                    {isGeneratingDraft ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Formuliert
                      </>
                    ) : formState.customAssessmentSource === "AI_DRAFT" ? (
                      "Neu formulieren"
                    ) : (
                      "Begruendung formulieren"
                    )}
                  </Button>

                  {previousManualNote ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-slate-700"
                      onClick={handleRestorePreviousNote}
                    >
                      Vorherigen Vermerk wiederherstellen
                    </Button>
                  ) : null}
                </div>

                {draftError ? (
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {draftError}
                  </p>
                ) : null}

                {formState.customAssessmentText.trim() &&
                formState.customAssessmentSource !== "AI_DRAFT" ? (
                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    Beim Formulieren wird der aktuelle Vermerk im Feld ersetzt.
                    Falls er manuell war, koennen Sie ihn danach wiederherstellen.
                  </p>
                ) : (
                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    Der Entwurf wird nicht automatisch gespeichert und bleibt
                    voll editierbar.
                  </p>
                )}
              </div>

              <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
                {formState.customAssessmentSource === "AI_DRAFT" ? (
                  <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                    Drafted by AI - Needs Human Review
                  </p>
                ) : null}
                <Textarea
                  value={formState.customAssessmentText}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      customAssessmentText: event.target.value,
                      customAssessmentSource: event.target.value.trim()
                        ? prev.customAssessmentSource ?? "MANUAL"
                        : null,
                    }))
                  }
                  rows={8}
                  placeholder="Optionaler Vermerk zur Einordnung, zu offenen Punkten oder zum naechsten Review."
                />
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Bestehender Text bleibt erhalten, bis Sie ihn anpassen oder
                  leeren.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            Schritt {stepIndex + 1} von {steps.length}
          </p>

          <div className="flex items-center justify-end gap-2">
            {stepIndex > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStepIndex((current) => Math.max(current - 1, 0))}
                disabled={isSubmitting}
              >
                Zurueck
              </Button>
            ) : null}

            {stepIndex < steps.length - 1 ? (
              <Button
                type="button"
                onClick={() =>
                  setStepIndex((current) => Math.min(current + 1, steps.length - 1))
                }
                disabled={isSubmitting}
              >
                Weiter
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleComplete}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Speichere
                  </>
                ) : (
                  "Pruefung speichern"
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
