import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RiskClassAssist } from "@/components/register/detail/risk-class-assist";
import { useToast } from "@/hooks/use-toast";
import type { ControlFocusTarget } from "@/lib/control/deep-link";
import type {
  CaptureUsageContext,
  DataCategory,
  DecisionImpact,
  DecisionInfluence,
  UseCaseCard,
} from "@/lib/register-first/types";
import {
  DATA_CATEGORY_MAIN_OPTIONS,
  DATA_CATEGORY_LABELS,
  DATA_CATEGORY_SPECIAL_OPTIONS,
  DECISION_INFLUENCE_OPTIONS,
  DECISION_INFLUENCE_LABELS,
  resolveDataCategories,
  resolveDecisionInfluence,
  USAGE_CONTEXT_OPTIONS,
  USAGE_CONTEXT_LABELS,
} from "@/lib/register-first/types";
import {
  getRiskClassShortLabel,
  registerFirstFlags,
  createAiToolsRegistryService,
  getDisplayedRiskClassLabel,
  getRiskClassEditorValue,
  normalizeStoredAiActCategory,
} from "@/lib/register-first";
import {
  applyDataCategoryLogic,
  toggleMultiSelect,
} from "@/lib/register-first/capture-selections";
import {
  applyRiskManualSelection,
  buildRiskSuggestionForEditDraft,
  CUSTOM_RISK_SELECTION,
  getRiskAssistCurrentDisplayLabel,
  getRiskManualOptionDescription,
  getRiskManualOptionLabel,
  getRiskManualSelectionValue,
  hasCustomRiskSelection,
  RISK_CLASS_MANUAL_OPTIONS,
} from "./risk-class-assist-model";
import {
  buildRiskReviewLaunchContext,
  type RiskReviewLaunchContext,
} from "./use-case-assessment-wizard-model";
import { cn } from "@/lib/utils";

const aiRegistry = createAiToolsRegistryService();

const decisionImpactLabels: Record<DecisionImpact, string> = {
  YES: "Ja",
  NO: "Nein",
  UNSURE: "Unsicher",
};

function mapDecisionInfluenceToImpact(
  value: DecisionInfluence | null
): DecisionImpact {
  if (value === "ASSISTANCE") return "NO";
  if (value === "PREPARATION" || value === "AUTOMATED") return "YES";
  return "UNSURE";
}

interface UseCaseMetadataSectionProps {
  card: UseCaseCard;
  isEditing: boolean;
  onSave: (updates: Partial<UseCaseCard>) => Promise<void>;
  focusTarget?: ControlFocusTarget | null;
  onOpenRiskReview?: (context: RiskReviewLaunchContext) => void;
}

interface UseCaseEditDraft {
  purpose: string;
  responsibleParty: string;
  contactPersonName: string;
  organisation: string;
  toolId: string;
  toolFreeText: string;
  usageContexts: CaptureUsageContext[];
  dataCategories: DataCategory[];
  decisionInfluence: DecisionInfluence | null;
  aiActCategory: string;
}

export function UseCaseMetadataSection({
  card,
  isEditing,
  onSave,
  focusTarget = null,
  onOpenRiskReview,
}: UseCaseMetadataSectionProps) {
  const router = useRouter();
  const { toast } = useToast();
  const readOnlyHintAtRef = useRef(0);
  const riskSelectionRef = useRef<HTMLDivElement | null>(null);

  const [editDraft, setEditDraft] = useState<UseCaseEditDraft>(() => ({
    purpose: card.purpose,
    responsibleParty: card.responsibility.responsibleParty ?? "",
    contactPersonName: card.responsibility.contactPersonName ?? "",
    organisation: card.organisation ?? "",
    toolId: card.toolId === "other" ? "other" : card.toolId ?? "other",
    toolFreeText: card.toolId === "other" ? card.toolFreeText ?? "" : card.toolId ?? "",
    usageContexts: card.usageContexts.length
      ? [...card.usageContexts]
      : (["INTERNAL_ONLY"] as CaptureUsageContext[]),
    dataCategories: resolveDataCategories(card),
    decisionInfluence: resolveDecisionInfluence(card) ?? null,
    aiActCategory: getRiskClassEditorValue(
      card.governanceAssessment?.core?.aiActCategory
    ),
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [specialOpen, setSpecialOpen] = useState(false);

  const toolEntry = card.toolId ? aiRegistry.getById(card.toolId) : null;
  const draftToolEntry =
    editDraft.toolId && editDraft.toolId !== "other"
      ? aiRegistry.getById(editDraft.toolId)
      : null;
  const riskAssistEnabled = registerFirstFlags.riskAssistDetail;
  const riskClass = getDisplayedRiskClassLabel({
    aiActCategory: card.governanceAssessment?.core?.aiActCategory,
    toolRiskLevel: toolEntry?.riskLevel ?? null,
    short: true,
  });
  const usageScope = card.usageContexts.length
    ? card.usageContexts.map((ctx) => USAGE_CONTEXT_LABELS[ctx]).join(", ")
    : "Nicht angegeben";
  const dataCategories = resolveDataCategories(card);
  const dataCategoryLabel = dataCategories.length
    ? dataCategories.map((cat) => DATA_CATEGORY_LABELS[cat] ?? cat).join(", ")
    : "Nicht angegeben";

  const decisionInfluence = resolveDecisionInfluence(card);
  const decisionLabel = decisionInfluence
    ? DECISION_INFLUENCE_LABELS[decisionInfluence]
    : decisionImpactLabels[card.decisionImpact];
  const ownerLabel = card.responsibility.isCurrentlyResponsible
    ? "Erfasser:in (selbst)"
    : card.responsibility.responsibleParty || "Nicht zugewiesen";
  const contactPersonLabel =
    card.responsibility.contactPersonName?.trim() || "Nicht hinterlegt";
  const focusClassName = "border-l-2 border-slate-300 pl-3";
  const riskSuggestion = useMemo(
    () =>
      buildRiskSuggestionForEditDraft(editDraft, draftToolEntry?.riskLevel ?? null),
    [draftToolEntry?.riskLevel, editDraft],
  );
  const manualRiskSelectionValue = getRiskManualSelectionValue(
    editDraft.aiActCategory,
  );
  const hasCustomRiskValue = hasCustomRiskSelection(editDraft.aiActCategory);
  const currentRiskDisplayLabel = getRiskAssistCurrentDisplayLabel(
    editDraft.aiActCategory,
  );
  const currentRiskClassForAssist =
    manualRiskSelectionValue !== CUSTOM_RISK_SELECTION
      ? manualRiskSelectionValue
      : null;

  useEffect(() => {
    setEditDraft({
      purpose: card.purpose,
      responsibleParty: card.responsibility.responsibleParty ?? "",
      contactPersonName: card.responsibility.contactPersonName ?? "",
      organisation: card.organisation ?? "",
      toolId: card.toolId === "other" ? "other" : card.toolId ?? "other",
      toolFreeText: card.toolId === "other" ? card.toolFreeText ?? "" : card.toolId ?? "",
      usageContexts: card.usageContexts.length
        ? [...card.usageContexts]
        : (["INTERNAL_ONLY"] as CaptureUsageContext[]),
      dataCategories: resolveDataCategories(card),
      decisionInfluence: resolveDecisionInfluence(card) ?? null,
      aiActCategory: getRiskClassEditorValue(
        card.governanceAssessment?.core?.aiActCategory
      ),
    });
  }, [card]);

  const showReadOnlyHint = useCallback(() => {
    const now = Date.now();
    if (now - readOnlyHintAtRef.current < 1600) return;
    readOnlyHintAtRef.current = now;
    toast({
      title: "Stammdaten sind schreibgeschützt",
      description:
        'Zum Ändern zuerst "Stammdaten bearbeiten" klicken.',
    });
  }, [toast]);

  const focusManualSelection = useCallback(() => {
    riskSelectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, []);

  const handleAdoptRiskSuggestion = useCallback(() => {
    setEditDraft((prev) => ({
      ...prev,
      aiActCategory: applyRiskManualSelection(riskSuggestion.suggestedRiskClass),
    }));
    focusManualSelection();
  }, [focusManualSelection, riskSuggestion.suggestedRiskClass]);

  const handleSelectManualRiskClass = useCallback(
    (nextValue: string) => {
      if (!RISK_CLASS_MANUAL_OPTIONS.includes(nextValue as (typeof RISK_CLASS_MANUAL_OPTIONS)[number])) {
        return;
      }

      setEditDraft((prev) => ({
        ...prev,
        aiActCategory: applyRiskManualSelection(
          nextValue as (typeof RISK_CLASS_MANUAL_OPTIONS)[number],
        ),
      }));
    },
    [],
  );

  const handleOpenRiskReview = useCallback(() => {
    onOpenRiskReview?.(
      buildRiskReviewLaunchContext(editDraft, draftToolEntry?.riskLevel ?? null),
    );
  }, [draftToolEntry?.riskLevel, editDraft, onOpenRiskReview]);

  const handleSave = async () => {
    if (isSaving) {
      return;
    }
    setIsSaving(true);
    try {
      const normalizedDataCategories =
        editDraft.dataCategories.length > 0
          ? editDraft.dataCategories
          : (["NO_PERSONAL_DATA"] as DataCategory[]);
      const usesCustomTool = editDraft.toolId === "other";
      const normalizedToolText = editDraft.toolFreeText.trim();
      const normalizedResponsibleParty = editDraft.responsibleParty.trim();
      const normalizedContactPersonName = editDraft.contactPersonName.trim();
      const normalizedOrganisation = editDraft.organisation.trim();
      const normalizedAiActCategory = normalizeStoredAiActCategory(
        editDraft.aiActCategory
      );

      await onSave({
        purpose: editDraft.purpose.trim(),
        usageContexts:
          editDraft.usageContexts.length > 0
            ? editDraft.usageContexts
            : (["INTERNAL_ONLY"] as CaptureUsageContext[]),
        decisionInfluence: editDraft.decisionInfluence ?? undefined,
        decisionImpact: mapDecisionInfluenceToImpact(editDraft.decisionInfluence),
        dataCategories: normalizedDataCategories,
        dataCategory: normalizedDataCategories[0],
        toolId: usesCustomTool ? "other" : editDraft.toolId,
        toolFreeText: usesCustomTool ? normalizedToolText || undefined : undefined,
        responsibility: {
          ...card.responsibility,
          responsibleParty: normalizedResponsibleParty || null,
          contactPersonName: normalizedContactPersonName || null,
        },
        organisation: normalizedOrganisation || null,
        governanceAssessment: {
          ...card.governanceAssessment,
          core: {
            ...card.governanceAssessment?.core,
            aiActCategory: normalizedAiActCategory,
          },
          flex: {
            ...card.governanceAssessment?.flex,
          },
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {!isEditing && (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p className="font-medium text-slate-700">Stammdaten sind schreibgeschützt.</p>
          <p>Zum Ändern zuerst "Stammdaten bearbeiten" wählen.</p>
        </div>
      )}

      <form
        id="use-case-metadata-form"
        className="space-y-8"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSave();
        }}
      >
        <section className="rounded-lg border border-slate-200 bg-slate-50/40 p-5 md:p-6">
          <h2 className="text-[18px] font-semibold tracking-tight">Kontext & Risiko</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <FieldBlock
              label="Zweck"
              className="rounded-md border border-slate-200 bg-white px-4 py-3"
              onReadOnlyInteract={!isEditing ? showReadOnlyHint : undefined}
            >
              {isEditing ? (
                <Textarea
                  value={editDraft.purpose}
                  onChange={(event) =>
                    setEditDraft((prev) => ({ ...prev, purpose: event.target.value }))
                  }
                  rows={3}
                />
              ) : (
                <p className="text-[15px] font-medium text-slate-900">{card.purpose}</p>
              )}
            </FieldBlock>
            <FieldBlock
              label="Wirkungsbereich"
              className="rounded-md border border-slate-200 bg-white px-4 py-3"
              onReadOnlyInteract={!isEditing ? showReadOnlyHint : undefined}
            >
              {isEditing ? (
                <div className="space-y-2">
                  {USAGE_CONTEXT_OPTIONS.map((option) => (
                    <label key={option} className="flex items-center gap-2 text-sm text-slate-800">
                      <Checkbox
                        checked={editDraft.usageContexts.includes(option)}
                        onCheckedChange={() =>
                          setEditDraft((prev) => ({
                            ...prev,
                            usageContexts: toggleMultiSelect(prev.usageContexts, option),
                          }))
                        }
                      />
                      {USAGE_CONTEXT_LABELS[option]}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-[15px] font-medium text-slate-900">{usageScope}</p>
              )}
            </FieldBlock>
            <FieldBlock
              label="Einfluss auf Entscheidungen"
              className="rounded-md border border-slate-200 bg-white px-4 py-3"
              onReadOnlyInteract={!isEditing ? showReadOnlyHint : undefined}
            >
              {isEditing ? (
                <div className="space-y-2">
                  {DECISION_INFLUENCE_OPTIONS.map((option) => (
                    <label key={option} className="flex items-center gap-2 text-sm text-slate-800">
                      <input
                        type="radio"
                        name="decisionInfluence"
                        checked={editDraft.decisionInfluence === option}
                        onChange={() =>
                          setEditDraft((prev) => ({ ...prev, decisionInfluence: option }))
                        }
                        className="h-4 w-4"
                      />
                      {DECISION_INFLUENCE_LABELS[option]}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-[15px] font-medium text-slate-900">{decisionLabel}</p>
              )}
            </FieldBlock>
            <FieldBlock
              label="Risikoklasse"
              className="rounded-md border border-slate-200 bg-white px-4 py-3"
              onReadOnlyInteract={!isEditing ? showReadOnlyHint : undefined}
            >
              {isEditing && !riskAssistEnabled ? (
                <Input
                  value={editDraft.aiActCategory}
                  onChange={(event) =>
                    setEditDraft((prev) => ({
                      ...prev,
                      aiActCategory: event.target.value,
                    }))
                  }
                  placeholder="z. B. Begrenztes Risiko oder Hochrisiko"
                />
              ) : isEditing ? (
                <div className="space-y-4">
                  <RiskClassAssist
                    currentRiskClass={currentRiskClassForAssist}
                    currentDisplayLabel={currentRiskDisplayLabel}
                    isHumanConfirmed={Boolean(currentRiskDisplayLabel)}
                    suggestion={riskSuggestion}
                    onAdoptSuggestion={handleAdoptRiskSuggestion}
                    onStartManualSelection={focusManualSelection}
                    onOpenReview={handleOpenRiskReview}
                  />

                  {hasCustomRiskValue && (
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <p className="font-medium text-slate-900">Bestehende Freitext-Einstufung</p>
                      <p className="mt-1">
                        Aktuell ist "{editDraft.aiActCategory.trim()}" hinterlegt.
                        Eine neue Auswahl ersetzt diesen Wert durch eine kanonische Klasse.
                      </p>
                    </div>
                  )}

                  <div
                    ref={riskSelectionRef}
                    className="rounded-md border border-slate-200 bg-white px-4 py-4"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-800">
                        Finale sichtbare Einstufung
                      </p>
                      <p className="text-sm text-slate-600">
                        Nur Vorschlag. Die finale Einstufung bleibt eine menschliche Entscheidung.
                      </p>
                    </div>

                    <RadioGroup
                      value={
                        manualRiskSelectionValue === CUSTOM_RISK_SELECTION
                          ? ""
                          : manualRiskSelectionValue
                      }
                      onValueChange={handleSelectManualRiskClass}
                      className="mt-4 gap-2"
                    >
                      {RISK_CLASS_MANUAL_OPTIONS.map((option) => {
                        const isSelected = manualRiskSelectionValue === option;
                        return (
                          <Label
                            key={option}
                            htmlFor={`risk-class-${option}`}
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 px-3 py-3 transition-colors",
                              isSelected && "border-slate-900 bg-slate-50",
                            )}
                          >
                            <RadioGroupItem
                              id={`risk-class-${option}`}
                              value={option}
                              className="mt-0.5"
                            />
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-slate-900">
                                {option === "UNASSESSED"
                                  ? getRiskClassShortLabel(option)
                                  : getRiskManualOptionLabel(option)}
                              </p>
                              <p className="text-sm text-slate-600">
                                {getRiskManualOptionDescription(option)}
                              </p>
                            </div>
                          </Label>
                        );
                      })}
                    </RadioGroup>

                    <p className="mt-4 text-xs text-slate-500">
                      Gespeichert wird weiter im bestehenden Feld
                      {" "}
                      <code>governanceAssessment.core.aiActCategory</code>
                      , aber normalisiert auf die kanonische Darstellung.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-[15px] font-medium text-slate-900">{riskClass}</p>
              )}
            </FieldBlock>
            <FieldBlock
              label="Datenkategorien"
              className="rounded-md border border-slate-200 bg-white px-4 py-3"
              onReadOnlyInteract={!isEditing ? showReadOnlyHint : undefined}
            >
              {isEditing ? (
                <div className="space-y-2">
                  {DATA_CATEGORY_MAIN_OPTIONS.map((option) => (
                    <div key={option}>
                      <label className="flex items-center gap-2 text-sm text-slate-800">
                        <Checkbox
                          checked={editDraft.dataCategories.includes(option)}
                          onCheckedChange={() =>
                            setEditDraft((prev) => ({
                              ...prev,
                              dataCategories: applyDataCategoryLogic(prev.dataCategories, option),
                            }))
                          }
                        />
                        <span>{DATA_CATEGORY_LABELS[option]}</span>
                      </label>

                      {option === "SPECIAL_PERSONAL" &&
                        editDraft.dataCategories.includes("SPECIAL_PERSONAL") && (
                          <div className="ml-6 mt-2 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-2">
                            <button
                              type="button"
                              className="text-xs text-muted-foreground underline underline-offset-2"
                              onClick={() => setSpecialOpen((prev) => !prev)}
                            >
                              {specialOpen
                                ? "Unterkategorien ausblenden"
                                : "Unterkategorien bearbeiten"}
                            </button>

                            {specialOpen &&
                              DATA_CATEGORY_SPECIAL_OPTIONS.map((sub) => (
                                <label key={sub} className="flex items-center gap-2 text-sm text-slate-800">
                                  <Checkbox
                                    checked={editDraft.dataCategories.includes(sub)}
                                    onCheckedChange={() =>
                                      setEditDraft((prev) => ({
                                        ...prev,
                                        dataCategories: applyDataCategoryLogic(prev.dataCategories, sub),
                                      }))
                                    }
                                  />
                                  {DATA_CATEGORY_LABELS[sub]}
                                </label>
                              ))}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[15px] font-medium text-slate-900">{dataCategoryLabel}</p>
              )}
            </FieldBlock>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 md:p-6">
          <h2 className="text-[18px] font-semibold tracking-tight">Owner & Organisation</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div
              id="usecase-focus-owner"
              className={cn(focusTarget === "owner" && focusClassName)}
            >
              <FieldBlock
                label="Owner-Rolle (funktional)"
                className="rounded-md border border-slate-200 bg-slate-50/30 px-4 py-3"
                onReadOnlyInteract={!isEditing ? showReadOnlyHint : undefined}
              >
                {isEditing ? (
                  <Input
                    value={editDraft.responsibleParty}
                    onChange={(event) =>
                      setEditDraft((prev) => ({
                        ...prev,
                        responsibleParty: event.target.value,
                      }))
                    }
                    placeholder="z. B. Head of Marketing / HR Lead / IT Security"
                  />
                ) : (
                  <p className="text-[15px] font-medium text-slate-900">{ownerLabel}</p>
                )}
              </FieldBlock>
            </div>
            <FieldBlock
              label="Kontaktperson (optional)"
              className="rounded-md border border-slate-200 bg-slate-50/30 px-4 py-3"
              onReadOnlyInteract={!isEditing ? showReadOnlyHint : undefined}
            >
              {isEditing ? (
                <Input
                  value={editDraft.contactPersonName}
                  onChange={(event) =>
                    setEditDraft((prev) => ({
                      ...prev,
                      contactPersonName: event.target.value,
                    }))
                  }
                  placeholder="z. B. Max Mustermann"
                />
              ) : (
                <p className="text-[15px] font-medium text-slate-900">{contactPersonLabel}</p>
              )}
            </FieldBlock>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <FieldBlock
              label="Organisation"
              className="rounded-md border border-slate-200 bg-slate-50/30 px-4 py-3"
              onReadOnlyInteract={!isEditing ? showReadOnlyHint : undefined}
            >
              {isEditing ? (
                <Input
                  value={editDraft.organisation}
                  onChange={(event) =>
                    setEditDraft((prev) => ({
                      ...prev,
                      organisation: event.target.value,
                    }))
                  }
                  placeholder="z. B. KI-Register GmbH"
                />
              ) : (
                <p className="text-[15px] font-medium text-slate-900">
                  {card.organisation?.trim() || "Nicht hinterlegt"}
                </p>
              )}
            </FieldBlock>
          </div>

          <div
            id="usecase-focus-oversight"
            className={cn(
              "mt-6 rounded-md border border-slate-200 bg-slate-50/30 px-4 py-3 space-y-1 text-xs text-muted-foreground",
              (focusTarget === "oversight" || focusTarget === "policy") && focusClassName
            )}
          >
            <div id="usecase-focus-policy" className="h-px w-px" />
            <p className="font-medium text-slate-600">Organisation KI-gerecht steuern</p>
            <p>
              Zuständigkeiten, Prüfmodelle und Policies werden in der
              Organisationssteuerung verwaltet.
            </p>
            <button
              type="button"
              className="underline underline-offset-2"
              onClick={() => router.push(`/control?useCaseId=${card.useCaseId}`)}
            >
              Im AI Governance Control anzeigen
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}

function FieldBlock({
  label,
  children,
  className,
  onReadOnlyInteract,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  onReadOnlyInteract?: (() => void) | undefined;
}) {
  const commonClassName = cn(
    "space-y-1.5 text-left",
    onReadOnlyInteract &&
      "cursor-pointer transition-colors hover:border-slate-300 hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2",
    className
  );

  if (onReadOnlyInteract) {
    return (
      <button type="button" onClick={onReadOnlyInteract} className={commonClassName}>
        <p className="text-xs text-muted-foreground">{label}</p>
        {children}
      </button>
    );
  }

  return (
    <div className={commonClassName}>
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
