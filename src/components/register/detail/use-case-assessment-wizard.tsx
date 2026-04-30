"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
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

const SIGNAL_STRENGTH_LABELS_DE = {
  low: "wenige Signale",
  medium: "mehrere Signale",
  high: "starke Signale",
} as const;

const SIGNAL_STRENGTH_LABELS_EN = {
  low: "few signals",
  medium: "several signals",
  high: "strong signals",
} as const;

const REVIEW_BOOLEAN_OPTIONS_DE: Array<{
  value: RiskReviewBooleanChoice;
  label: string;
}> = [
  { value: "yes", label: "Ja" },
  { value: "no", label: "Nein" },
  { value: "unknown", label: "Noch offen" },
];

const REVIEW_BOOLEAN_OPTIONS_EN: Array<{
  value: RiskReviewBooleanChoice;
  label: string;
}> = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unknown", label: "Still open" },
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
  options,
}: {
  label: string;
  description: string;
  value: RiskReviewBooleanChoice;
  onValueChange: (nextValue: RiskReviewBooleanChoice) => void;
  options: Array<{ value: RiskReviewBooleanChoice; label: string }>;
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
        {options.map((option) => (
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
  const locale = useLocale();
  const isGerman = locale === "de";
  const signalStrengthLabels = isGerman
    ? SIGNAL_STRENGTH_LABELS_DE
    : SIGNAL_STRENGTH_LABELS_EN;
  const booleanOptions = isGerman
    ? REVIEW_BOOLEAN_OPTIONS_DE
    : REVIEW_BOOLEAN_OPTIONS_EN;
  const copy = {
    title: isGerman
      ? "Kurze Pruefung zur Risikoklasse"
      : "Short risk-class review",
    description: isGerman
      ? "Diese Pruefung dokumentiert eine menschliche Einordnung. Sie setzt keine Risikoklasse automatisch und ersetzt keine umfassendere Governance-Pruefung."
      : "This review documents a human classification. It does not set a risk class automatically and does not replace a broader governance review.",
    useCase: isGerman ? "Einsatzfall" : "Use case",
    startingPoint: isGerman ? "Ausgangspunkt" : "Starting point",
    signalsTitle: isGerman ? "Signale und Einordnung" : "Signals and classification",
    signalsBody: isGerman
      ? "Der Vorschlag bleibt ein Entwurf. Entscheidend ist, was Sie fuer diesen Einsatzfall tatsaechlich dokumentieren wollen."
      : "The suggestion remains a draft. What matters is what you actually want to document for this use case.",
    currentClassification: isGerman ? "Aktuelle Einstufung" : "Current classification",
    noCurrentClassification: isGerman
      ? "Noch kein dokumentierter Eintrag"
      : "No documented entry yet",
    suggestion: isGerman ? "Vorschlag" : "Suggestion",
    signalStrength: isGerman ? "Signalstaerke" : "Signal strength",
    shortReviewRecommended: isGerman
      ? "Kurze Pruefung empfohlen."
      : "Short review recommended.",
    shortReviewOptional: isGerman
      ? "Kurze Pruefung optional."
      : "Short review optional.",
    whyDirection: isGerman
      ? "Warum diese Richtung naheliegt"
      : "Why this direction is plausible",
    noSignals: isGerman
      ? "Noch keine begruendenden Signale sichtbar."
      : "No supporting signals visible yet.",
    openItems: isGerman ? "Was noch offen sein kann" : "What may still be open",
    noOpenQuestions: isGerman
      ? "Aktuell sind keine offenen Rueckfragen markiert."
      : "No open follow-up questions are currently marked.",
    classificationEyebrow: isGerman ? "Einordnung" : "Classification",
    classificationTitle: isGerman
      ? "Risikoklasse bestaetigen oder anpassen"
      : "Confirm or adjust risk class",
    classificationBody: isGerman
      ? "Waehlen Sie die derzeit tragfaehigste Klasse. Wenn Sie nichts aendern, bleibt ein bestehender Eintrag erhalten."
      : "Choose the currently most defensible class. If you do not change anything, an existing entry remains in place.",
    customNoteTitle: isGerman
      ? "Bestehender Freitext-Vermerk"
      : "Existing free-text note",
    customNoteBody: (value: string) =>
      isGerman
        ? `"${value}" bleibt erhalten, bis Sie unten bewusst eine kanonische Klasse auswaehlen.`
        : `"${value}" remains in place until you deliberately select a canonical class below.`,
    suggestionForReview: isGerman
      ? "Vorschlag fuer diese Pruefung"
      : "Suggestion for this review",
    suggestionCanBeAdopted: (value: string) =>
      isGerman
        ? `${value} kann als Entwurf uebernommen und danach bei Bedarf angepasst werden.`
        : `${value} can be adopted as a draft and adjusted afterwards if needed.`,
    adoptSuggestion: isGerman ? "Vorschlag uebernehmen" : "Adopt suggestion",
    unassessedNote: isGerman
      ? '"Noch nicht eingestuft" ist zulaessig, wenn die Einordnung derzeit bewusst offen bleiben soll.'
      : '"Unassessed" is allowed if the classification should deliberately remain open for now.',
    governanceEyebrow: isGerman ? "Pruefbedarf" : "Review need",
    governanceTitle: isGerman
      ? "Begleitende Governance-Fakten festhalten"
      : "Record accompanying governance facts",
    governanceBody: isGerman
      ? "Nur soweit derzeit belastbar dokumentierbar. Offene Punkte koennen offen bleiben."
      : "Only as far as currently documentable with confidence. Open points can remain open.",
    humanOversight: isGerman ? "Menschliche Aufsicht" : "Human oversight",
    humanOversightDescription: isGerman
      ? "Ist derzeit dokumentiert, wie Outputs oder entscheidungsnahe Effekte menschlich ueberwacht werden?"
      : "Is it documented how outputs or decision-adjacent effects are monitored by humans?",
    reviewCycle: isGerman ? "Review-Zyklus" : "Review cycle",
    reviewCycleDescription: isGerman
      ? "Ist ein nachvollziehbarer Turnus fuer erneute Pruefung oder Aktualisierung festgelegt?"
      : "Is a traceable interval for re-review or updating defined?",
    documentationStatus: isGerman ? "Dokumentationsstand" : "Documentation status",
    documentationStatusDescription: isGerman
      ? "Sind Zweck, Grenzen und Einsatzparameter derzeit in ausreichender Form beschrieben?"
      : "Are purpose, boundaries, and usage parameters currently described sufficiently?",
    noteEyebrow: isGerman ? "Vermerk" : "Note",
    noteTitle: isGerman
      ? "Zusaetzlichen Hinweis dokumentieren"
      : "Document an additional note",
    noteBody: isGerman
      ? "Optional. Fuer kurze Begruendung, offene Punkte oder einen bestehenden Draft-Vermerk. AI dient hier nur als Formulierungshilfe."
      : "Optional. For a short rationale, open points, or an existing draft note. AI is used only as writing assistance here.",
    aiDraftTitle: isGerman ? "AI-Formulierungshilfe" : "AI writing assistance",
    aiDraftBody: isGerman
      ? "AI kann einen sachlichen Begruendungsentwurf formulieren. Die Auswahl der Risikoklasse bleibt eine menschliche Entscheidung."
      : "AI can draft a factual rationale. Selecting the risk class remains a human decision.",
    generating: isGerman ? "Formuliert" : "Drafting",
    regenerate: isGerman ? "Neu formulieren" : "Draft again",
    generate: isGerman ? "Begruendung formulieren" : "Draft rationale",
    restorePrevious: isGerman
      ? "Vorherigen Vermerk wiederherstellen"
      : "Restore previous note",
    replacingNote: isGerman
      ? "Beim Formulieren wird der aktuelle Vermerk im Feld ersetzt. Falls er manuell war, koennen Sie ihn danach wiederherstellen."
      : "Drafting replaces the current note in the field. If it was manual, you can restore it afterwards.",
    draftNotSaved: isGerman
      ? "Der Entwurf wird nicht automatisch gespeichert und bleibt voll editierbar."
      : "The draft is not saved automatically and remains fully editable.",
    draftedByAi: "Drafted by AI - Needs Human Review",
    notePlaceholder: isGerman
      ? "Optionaler Vermerk zur Einordnung, zu offenen Punkten oder zum naechsten Review."
      : "Optional note on classification, open points, or the next review.",
    existingTextRemains: isGerman
      ? "Bestehender Text bleibt erhalten, bis Sie ihn anpassen oder leeren."
      : "Existing text remains until you edit or clear it.",
    step: isGerman ? "Schritt" : "Step",
    of: isGerman ? "von" : "of",
    back: isGerman ? "Zurueck" : "Back",
    next: isGerman ? "Weiter" : "Next",
    saving: isGerman ? "Speichere" : "Saving",
    saveReview: isGerman ? "Pruefung speichern" : "Save review",
    draftError: isGerman
      ? "Fehler beim Formulieren des Entwurfs."
      : "Error while drafting rationale.",
    emptyDraft: isGerman
      ? "Es konnte kein verwertbarer Entwurf erzeugt werden."
      : "No usable draft could be generated.",
    fallbackDraftError: isGerman
      ? "Der Entwurf konnte gerade nicht erzeugt werden."
      : "The draft could not be generated right now.",
  };
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
      buildRiskReviewLaunchContextFromUseCase(card, fallbackToolRiskLevel, locale),
    [card, fallbackToolRiskLevel, launchContext, locale],
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
    locale,
  );
  const currentRiskLabel =
    reviewContext.currentRiskDisplayLabel ?? copy.noCurrentClassification;

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
            locale,
          }),
        ),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? copy.draftError);
      }

      const nextDraft = typeof data?.draft === "string" ? data.draft.trim() : "";
      if (!nextDraft) {
        throw new Error(copy.emptyDraft);
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
          : copy.fallbackDraftError,
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
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription className="max-w-[62ch] leading-6">
            {copy.description}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-slate-200 bg-slate-50/60 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            {copy.useCase}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {reviewContext.purpose}
          </p>
        </div>

        <div className="min-h-[360px] py-2">
          {currentStep === "summary" ? (
            <div className="space-y-5">
              <StepLead
                eyebrow={copy.startingPoint}
                title={copy.signalsTitle}
                body={copy.signalsBody}
              />

              <div className="grid gap-3 md:grid-cols-2">
                <SummaryBlock
                  label={copy.currentClassification}
                  value={currentRiskLabel}
                />
                <SummaryBlock
                  label={copy.suggestion}
                  value={suggestionLabel}
                  detail={[
                    `${copy.signalStrength}: ${
                      signalStrengthLabels[
                        reviewContext.suggestion.signalStrength
                      ]
                    }.`,
                    reviewContext.suggestion.reviewRecommended
                      ? copy.shortReviewRecommended
                      : copy.shortReviewOptional,
                  ].join(" ")}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <SummaryList
                  label={copy.whyDirection}
                  items={reviewContext.suggestion.reasons}
                  emptyLabel={copy.noSignals}
                />
                <SummaryList
                  label={copy.openItems}
                  items={reviewContext.suggestion.openQuestions}
                  emptyLabel={copy.noOpenQuestions}
                />
              </div>
            </div>
          ) : null}

          {currentStep === "classification" ? (
            <div className="space-y-5">
              <StepLead
                eyebrow={copy.classificationEyebrow}
                title={copy.classificationTitle}
                body={copy.classificationBody}
              />

              {reviewContext.hasCustomRiskValue &&
              reviewContext.currentRiskDisplayLabel ? (
                <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm font-medium text-slate-900">
                    {copy.customNoteTitle}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {copy.customNoteBody(reviewContext.currentRiskDisplayLabel)}
                  </p>
                </div>
              ) : null}

              {reviewContext.suggestion.suggestedRiskClass !== "UNASSESSED" ? (
                <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
                  <p className="text-sm font-medium text-slate-900">
                    {copy.suggestionForReview}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {copy.suggestionCanBeAdopted(suggestionLabel)}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={handleApplySuggestion}
                  >
                    {copy.adoptSuggestion}
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
                          {getRiskManualOptionLabel(option, locale)}
                        </p>
                        <p className="text-sm leading-6 text-slate-600">
                          {getRiskManualOptionDescription(option, locale)}
                        </p>
                      </div>
                    </Label>
                  );
                })}
              </RadioGroup>

              <p className="text-xs leading-5 text-slate-500">
                {copy.unassessedNote}
              </p>
            </div>
          ) : null}

          {currentStep === "governance" ? (
            <div className="space-y-5">
              <StepLead
                eyebrow={copy.governanceEyebrow}
                title={copy.governanceTitle}
                body={copy.governanceBody}
              />

              <div className="space-y-3">
                <BooleanChoiceField
                  label={copy.humanOversight}
                  description={copy.humanOversightDescription}
                  value={formState.oversightDefined}
                  options={booleanOptions}
                  onValueChange={(nextValue) =>
                    setFormState((prev) => ({
                      ...prev,
                      oversightDefined: nextValue,
                    }))
                  }
                />
                <BooleanChoiceField
                  label={copy.reviewCycle}
                  description={copy.reviewCycleDescription}
                  value={formState.reviewCycleDefined}
                  options={booleanOptions}
                  onValueChange={(nextValue) =>
                    setFormState((prev) => ({
                      ...prev,
                      reviewCycleDefined: nextValue,
                    }))
                  }
                />
                <BooleanChoiceField
                  label={copy.documentationStatus}
                  description={copy.documentationStatusDescription}
                  value={formState.documentationLevelDefined}
                  options={booleanOptions}
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
                eyebrow={copy.noteEyebrow}
                title={copy.noteTitle}
                body={copy.noteBody}
              />

              <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm font-medium text-slate-900">
                  {copy.aiDraftTitle}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {copy.aiDraftBody}
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
                        {copy.generating}
                      </>
                    ) : formState.customAssessmentSource === "AI_DRAFT" ? (
                      copy.regenerate
                    ) : (
                      copy.generate
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
                      {copy.restorePrevious}
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
                    {copy.replacingNote}
                  </p>
                ) : (
                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    {copy.draftNotSaved}
                  </p>
                )}
              </div>

              <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
                {formState.customAssessmentSource === "AI_DRAFT" ? (
                  <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                    {copy.draftedByAi}
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
                  placeholder={copy.notePlaceholder}
                />
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  {copy.existingTextRemains}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            {copy.step} {stepIndex + 1} {copy.of} {steps.length}
          </p>

          <div className="flex items-center justify-end gap-2">
            {stepIndex > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStepIndex((current) => Math.max(current - 1, 0))}
                disabled={isSubmitting}
              >
                {copy.back}
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
                {copy.next}
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
                    {copy.saving}
                  </>
                ) : (
                  copy.saveReview
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
