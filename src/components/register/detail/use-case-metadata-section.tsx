import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RiskClassAssist } from "@/components/register/detail/risk-class-assist";
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
  DATA_CATEGORY_SPECIAL_OPTIONS,
  DECISION_INFLUENCE_OPTIONS,
  getDataCategoryLabel,
  getDecisionInfluenceLabel,
  getUsageContextLabel,
  resolveDataCategories,
  resolveDecisionInfluence,
  USAGE_CONTEXT_OPTIONS,
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

export type EditableMetadataField =
  | "purpose"
  | "usageContexts"
  | "decisionInfluence"
  | "aiActCategory"
  | "dataCategories"
  | "responsibleParty"
  | "contactPersonName"
  | "organisation";

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
  onSave: (updates: Partial<UseCaseCard>) => Promise<void>;
  focusTarget?: ControlFocusTarget | null;
  onOpenRiskReview?: (context: RiskReviewLaunchContext) => void;
  /** When set, auto-opens and scrolls to this field for editing */
  requestedEditField?: EditableMetadataField | null;
  /** Called after the requested edit field has been consumed */
  onEditFieldConsumed?: () => void;
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

function buildDraftFromCard(card: UseCaseCard): UseCaseEditDraft {
  return {
    purpose: card.purpose,
    responsibleParty: card.responsibility.responsibleParty ?? "",
    contactPersonName: card.responsibility.contactPersonName ?? "",
    organisation: card.organisation ?? "",
    toolId: card.toolId === "other" ? "other" : card.toolId ?? "other",
    toolFreeText:
      card.toolId === "other" ? card.toolFreeText ?? "" : card.toolId ?? "",
    usageContexts: card.usageContexts.length
      ? [...card.usageContexts]
      : (["INTERNAL_ONLY"] as CaptureUsageContext[]),
    dataCategories: resolveDataCategories(card),
    decisionInfluence: resolveDecisionInfluence(card) ?? null,
    aiActCategory: getRiskClassEditorValue(
      card.governanceAssessment?.core?.aiActCategory
    ),
  };
}

export function UseCaseMetadataSection({
  card,
  onSave,
  focusTarget = null,
  onOpenRiskReview,
  requestedEditField,
  onEditFieldConsumed,
}: UseCaseMetadataSectionProps) {
  const locale = useLocale();
  const router = useRouter();
  const riskSelectionRef = useRef<HTMLDivElement | null>(null);

  const [editDraft, setEditDraft] = useState<UseCaseEditDraft>(() =>
    buildDraftFromCard(card)
  );
  const [editingField, setEditingField] = useState<EditableMetadataField | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [specialOpen, setSpecialOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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
    ? card.usageContexts
        .map((ctx) => getUsageContextLabel(ctx, locale))
        .join(", ")
    : "Nicht angegeben";
  const dataCategories = resolveDataCategories(card);
  const dataCategoryLabel = dataCategories.length
    ? dataCategories
        .map((cat) => getDataCategoryLabel(cat, locale) ?? cat)
        .join(", ")
    : "Nicht angegeben";

  const decisionInfluence = resolveDecisionInfluence(card);
  const decisionLabel = decisionInfluence
    ? getDecisionInfluenceLabel(decisionInfluence, locale)
    : decisionImpactLabels[card.decisionImpact];
  const ownerLabel = card.responsibility.isCurrentlyResponsible
    ? "Erfasser:in (selbst)"
    : card.responsibility.responsibleParty || "Nicht zugewiesen";
  const contactPersonLabel =
    card.responsibility.contactPersonName?.trim() || "Nicht hinterlegt";
  const organisationLabel = card.organisation?.trim() || "Nicht hinterlegt";
  const focusClassName = "border-l-2 border-slate-300 pl-3";
  const riskSuggestion = useMemo(
    () =>
      buildRiskSuggestionForEditDraft(
        editDraft,
        draftToolEntry?.riskLevel ?? null
      ),
    [draftToolEntry?.riskLevel, editDraft]
  );
  const manualRiskSelectionValue = getRiskManualSelectionValue(
    editDraft.aiActCategory
  );
  const hasCustomRiskValue = hasCustomRiskSelection(editDraft.aiActCategory);
  const currentRiskDisplayLabel = getRiskAssistCurrentDisplayLabel(
    editDraft.aiActCategory
  );
  const currentRiskClassForAssist =
    manualRiskSelectionValue !== CUSTOM_RISK_SELECTION
      ? manualRiskSelectionValue
      : null;

  useEffect(() => {
    setEditDraft(buildDraftFromCard(card));
  }, [card]);

  useEffect(() => {
    if (focusTarget) {
      setIsExpanded(true);
    }
  }, [card.useCaseId, focusTarget]);

  // Handle external edit requests (from header MetaItems)
  useEffect(() => {
    if (!requestedEditField) return;
    setIsExpanded(true);
    setEditingField(requestedEditField);
    onEditFieldConsumed?.();

    // Scroll to the field after expansion
    const frameId = window.requestAnimationFrame(() => {
      const el = document.getElementById(
        `metadata-field-${requestedEditField}`
      );
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [requestedEditField, onEditFieldConsumed]);

  const startEditing = useCallback((field: EditableMetadataField) => {
    setEditDraft((prev) => prev); // keep current draft
    setEditingField(field);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditDraft(buildDraftFromCard(card));
    setEditingField(null);
  }, [card]);

  const focusManualSelection = useCallback(() => {
    riskSelectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, []);

  const handleAdoptRiskSuggestion = useCallback(() => {
    setEditDraft((prev) => ({
      ...prev,
      aiActCategory: applyRiskManualSelection(
        riskSuggestion.suggestedRiskClass
      ),
    }));
    focusManualSelection();
  }, [focusManualSelection, riskSuggestion.suggestedRiskClass]);

  const handleSelectManualRiskClass = useCallback((nextValue: string) => {
    if (
      !RISK_CLASS_MANUAL_OPTIONS.includes(
        nextValue as (typeof RISK_CLASS_MANUAL_OPTIONS)[number]
      )
    ) {
      return;
    }

    setEditDraft((prev) => ({
      ...prev,
      aiActCategory: applyRiskManualSelection(
        nextValue as (typeof RISK_CLASS_MANUAL_OPTIONS)[number]
      ),
    }));
  }, []);

  const handleOpenRiskReview = useCallback(() => {
    onOpenRiskReview?.(
      buildRiskReviewLaunchContext(
        editDraft,
        draftToolEntry?.riskLevel ?? null
      )
    );
  }, [draftToolEntry?.riskLevel, editDraft, onOpenRiskReview]);

  const handleSaveField = async () => {
    if (isSaving || !editingField) return;
    setIsSaving(true);
    try {
      const updates: Partial<UseCaseCard> = {};

      switch (editingField) {
        case "purpose":
          updates.purpose = editDraft.purpose.trim();
          break;
        case "usageContexts":
          updates.usageContexts =
            editDraft.usageContexts.length > 0
              ? editDraft.usageContexts
              : (["INTERNAL_ONLY"] as CaptureUsageContext[]);
          break;
        case "decisionInfluence":
          updates.decisionInfluence =
            editDraft.decisionInfluence ?? undefined;
          updates.decisionImpact = mapDecisionInfluenceToImpact(
            editDraft.decisionInfluence
          );
          break;
        case "aiActCategory": {
          const normalizedAiActCategory = normalizeStoredAiActCategory(
            editDraft.aiActCategory
          );
          updates.governanceAssessment = {
            ...card.governanceAssessment,
            core: {
              ...card.governanceAssessment?.core,
              aiActCategory: normalizedAiActCategory,
            },
            flex: { ...card.governanceAssessment?.flex },
          };
          break;
        }
        case "dataCategories": {
          const normalizedDataCategories =
            editDraft.dataCategories.length > 0
              ? editDraft.dataCategories
              : (["NO_PERSONAL_DATA"] as DataCategory[]);
          updates.dataCategories = normalizedDataCategories;
          updates.dataCategory = normalizedDataCategories[0];
          break;
        }
        case "responsibleParty":
          updates.responsibility = {
            ...card.responsibility,
            responsibleParty:
              editDraft.responsibleParty.trim() || null,
          };
          break;
        case "contactPersonName":
          updates.responsibility = {
            ...card.responsibility,
            contactPersonName:
              editDraft.contactPersonName.trim() || null,
          };
          break;
        case "organisation":
          updates.organisation =
            editDraft.organisation.trim() || null;
          break;
      }

      await onSave(updates);
      setEditingField(null);
    } finally {
      setIsSaving(false);
    }
  };

  const metadataOpen = editingField !== null || isExpanded;

  const isFieldEditing = (field: EditableMetadataField) =>
    editingField === field;

  const fieldEditTrigger = (field: EditableMetadataField) => (
    <button
      type="button"
      onClick={() => startEditing(field)}
      className="ml-auto shrink-0 rounded p-1 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-slate-700 hover:bg-slate-100"
      title="Bearbeiten"
    >
      <Pencil className="h-3.5 w-3.5" />
    </button>
  );

  const fieldSaveCancel = (
    <div className="mt-3 flex items-center gap-2">
      <Button
        size="sm"
        onClick={() => void handleSaveField()}
        disabled={isSaving}
      >
        {isSaving ? "Speichern..." : "Speichern"}
      </Button>
      <Button size="sm" variant="outline" onClick={cancelEditing}>
        Abbrechen
      </Button>
    </div>
  );

  return (
    <Collapsible
      open={metadataOpen}
      onOpenChange={(open) => {
        if (!editingField) {
          setIsExpanded(open);
        }
      }}
      className="rounded-lg border border-slate-200 bg-white"
    >
      <div className="p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <h2 className="text-[18px] font-semibold tracking-tight">
              Details & Stammdaten
            </h2>
            <p className="text-sm text-slate-600">
              Nachrangige Stammdaten zum Einsatzfall.
            </p>
          </div>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              disabled={editingField !== null}
            >
              {metadataOpen ? (
                <>
                  Stammdaten ausblenden
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  Stammdaten anzeigen
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetadataSummaryItem label="Zweck" value={card.purpose} />
          <MetadataSummaryItem
            label="Datenkategorien"
            value={dataCategoryLabel}
          />
          <MetadataSummaryItem
            label="Kontaktperson (optional)"
            value={contactPersonLabel}
          />
          <MetadataSummaryItem
            label="Organisation (optional)"
            value={organisationLabel}
          />
        </div>
      </div>

      <CollapsibleContent className="border-t border-slate-200">
        <div className="space-y-8 p-5 md:p-6">
          <section className="rounded-lg border border-slate-200 bg-slate-50/40 p-5 md:p-6">
            <h2 className="text-[18px] font-semibold tracking-tight">
              Kontext & Risiko
            </h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {/* Zweck */}
              <div
                id="metadata-field-purpose"
                className="group rounded-md border border-slate-200 bg-white px-4 py-3 space-y-1.5"
              >
                <div className="flex items-center">
                  <p className="text-xs text-muted-foreground">Zweck</p>
                  {!isFieldEditing("purpose") && fieldEditTrigger("purpose")}
                </div>
                {isFieldEditing("purpose") ? (
                  <>
                    <Textarea
                      value={editDraft.purpose}
                      onChange={(event) =>
                        setEditDraft((prev) => ({
                          ...prev,
                          purpose: event.target.value,
                        }))
                      }
                      rows={3}
                      autoFocus
                    />
                    {fieldSaveCancel}
                  </>
                ) : (
                  <p className="text-[15px] font-medium text-slate-900">
                    {card.purpose}
                  </p>
                )}
              </div>

              {/* Wirkungsbereich */}
              <div
                id="metadata-field-usageContexts"
                className="group rounded-md border border-slate-200 bg-white px-4 py-3 space-y-1.5"
              >
                <div className="flex items-center">
                  <p className="text-xs text-muted-foreground">
                    Wirkungsbereich
                  </p>
                  {!isFieldEditing("usageContexts") &&
                    fieldEditTrigger("usageContexts")}
                </div>
                {isFieldEditing("usageContexts") ? (
                  <>
                    <div className="space-y-2">
                      {USAGE_CONTEXT_OPTIONS.map((option) => (
                        <label
                          key={option}
                          className="flex items-center gap-2 text-sm text-slate-800"
                        >
                          <Checkbox
                            checked={editDraft.usageContexts.includes(option)}
                            onCheckedChange={() =>
                              setEditDraft((prev) => ({
                                ...prev,
                                usageContexts: toggleMultiSelect(
                                  prev.usageContexts,
                                  option
                                ),
                              }))
                            }
                          />
                          {getUsageContextLabel(option, locale)}
                        </label>
                      ))}
                    </div>
                    {fieldSaveCancel}
                  </>
                ) : (
                  <p className="text-[15px] font-medium text-slate-900">
                    {usageScope}
                  </p>
                )}
              </div>

              {/* Einfluss auf Entscheidungen */}
              <div
                id="metadata-field-decisionInfluence"
                className="group rounded-md border border-slate-200 bg-white px-4 py-3 space-y-1.5"
              >
                <div className="flex items-center">
                  <p className="text-xs text-muted-foreground">
                    Einfluss auf Entscheidungen
                  </p>
                  {!isFieldEditing("decisionInfluence") &&
                    fieldEditTrigger("decisionInfluence")}
                </div>
                {isFieldEditing("decisionInfluence") ? (
                  <>
                    <div className="space-y-2">
                      {DECISION_INFLUENCE_OPTIONS.map((option) => (
                        <label
                          key={option}
                          className="flex items-center gap-2 text-sm text-slate-800"
                        >
                          <input
                            type="radio"
                            name="decisionInfluence"
                            checked={editDraft.decisionInfluence === option}
                            onChange={() =>
                              setEditDraft((prev) => ({
                                ...prev,
                                decisionInfluence: option,
                              }))
                            }
                            className="h-4 w-4"
                          />
                          {getDecisionInfluenceLabel(option, locale)}
                        </label>
                      ))}
                    </div>
                    {fieldSaveCancel}
                  </>
                ) : (
                  <p className="text-[15px] font-medium text-slate-900">
                    {decisionLabel}
                  </p>
                )}
              </div>

              {/* Risikoklasse */}
              <div
                id="metadata-field-aiActCategory"
                className="group rounded-md border border-slate-200 bg-white px-4 py-3 space-y-1.5"
              >
                <div className="flex items-center">
                  <p className="text-xs text-muted-foreground">Risikoklasse</p>
                  {!isFieldEditing("aiActCategory") &&
                    fieldEditTrigger("aiActCategory")}
                </div>
                {isFieldEditing("aiActCategory") ? (
                  <>
                    {!riskAssistEnabled ? (
                      <Input
                        value={editDraft.aiActCategory}
                        onChange={(event) =>
                          setEditDraft((prev) => ({
                            ...prev,
                            aiActCategory: event.target.value,
                          }))
                        }
                        placeholder="z. B. Begrenztes Risiko oder Hochrisiko"
                        autoFocus
                      />
                    ) : (
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
                            <p className="font-medium text-slate-900">
                              Bestehende Freitext-Einstufung
                            </p>
                            <p className="mt-1">
                              Aktuell ist &quot;{editDraft.aiActCategory.trim()}
                              &quot; hinterlegt. Eine neue Auswahl ersetzt
                              diesen Wert durch eine kanonische Klasse.
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
                              Nur Vorschlag. Die finale Einstufung bleibt eine
                              menschliche Entscheidung.
                            </p>
                          </div>

                          <RadioGroup
                            value={
                              manualRiskSelectionValue ===
                              CUSTOM_RISK_SELECTION
                                ? ""
                                : manualRiskSelectionValue
                            }
                            onValueChange={handleSelectManualRiskClass}
                            className="mt-4 gap-2"
                          >
                            {RISK_CLASS_MANUAL_OPTIONS.map((option) => {
                              const isSelected =
                                manualRiskSelectionValue === option;
                              return (
                                <Label
                                  key={option}
                                  htmlFor={`risk-class-${option}`}
                                  className={cn(
                                    "flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 px-3 py-3 transition-colors",
                                    isSelected &&
                                      "border-slate-900 bg-slate-50"
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
                            Gespeichert wird weiter im bestehenden Feld{" "}
                            <code>
                              governanceAssessment.core.aiActCategory
                            </code>
                            , aber normalisiert auf die kanonische Darstellung.
                          </p>
                        </div>
                      </div>
                    )}
                    {fieldSaveCancel}
                  </>
                ) : (
                  <p className="text-[15px] font-medium text-slate-900">
                    {riskClass}
                  </p>
                )}
              </div>

              {/* Datenkategorien */}
              <div
                id="metadata-field-dataCategories"
                className="group rounded-md border border-slate-200 bg-white px-4 py-3 space-y-1.5"
              >
                <div className="flex items-center">
                  <p className="text-xs text-muted-foreground">
                    Datenkategorien
                  </p>
                  {!isFieldEditing("dataCategories") &&
                    fieldEditTrigger("dataCategories")}
                </div>
                {isFieldEditing("dataCategories") ? (
                  <>
                    <div className="space-y-2">
                      {DATA_CATEGORY_MAIN_OPTIONS.map((option) => (
                        <div key={option}>
                          <label className="flex items-center gap-2 text-sm text-slate-800">
                            <Checkbox
                              checked={editDraft.dataCategories.includes(
                                option
                              )}
                              onCheckedChange={() =>
                                setEditDraft((prev) => ({
                                  ...prev,
                                  dataCategories: applyDataCategoryLogic(
                                    prev.dataCategories,
                                    option
                                  ),
                                }))
                              }
                            />
                            <span>{getDataCategoryLabel(option, locale)}</span>
                          </label>

                          {option === "SPECIAL_PERSONAL" &&
                            editDraft.dataCategories.includes(
                              "SPECIAL_PERSONAL"
                            ) && (
                              <div className="ml-6 mt-2 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-2">
                                <button
                                  type="button"
                                  className="text-xs text-muted-foreground underline underline-offset-2"
                                  onClick={() =>
                                    setSpecialOpen((prev) => !prev)
                                  }
                                >
                                  {specialOpen
                                    ? "Unterkategorien ausblenden"
                                    : "Unterkategorien bearbeiten"}
                                </button>

                                {specialOpen &&
                                  DATA_CATEGORY_SPECIAL_OPTIONS.map((sub) => (
                                    <label
                                      key={sub}
                                      className="flex items-center gap-2 text-sm text-slate-800"
                                    >
                                      <Checkbox
                                        checked={editDraft.dataCategories.includes(
                                          sub
                                        )}
                                        onCheckedChange={() =>
                                          setEditDraft((prev) => ({
                                            ...prev,
                                            dataCategories:
                                              applyDataCategoryLogic(
                                                prev.dataCategories,
                                                sub
                                              ),
                                          }))
                                        }
                                      />
                                      {getDataCategoryLabel(sub, locale)}
                                    </label>
                                  ))}
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                    {fieldSaveCancel}
                  </>
                ) : (
                  <p className="text-[15px] font-medium text-slate-900">
                    {dataCategoryLabel}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 md:p-6">
            <h2 className="text-[18px] font-semibold tracking-tight">
              Owner & Organisation
            </h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {/* Owner-Rolle */}
              <div
                id="metadata-field-responsibleParty"
                className={cn(
                  "group rounded-md border border-slate-200 bg-slate-50/30 px-4 py-3 space-y-1.5",
                  focusTarget === "owner" && focusClassName
                )}
              >
                <div className="flex items-center" id="usecase-focus-owner">
                  <p className="text-xs text-muted-foreground">
                    Owner-Rolle (funktional)
                  </p>
                  {!isFieldEditing("responsibleParty") &&
                    fieldEditTrigger("responsibleParty")}
                </div>
                {isFieldEditing("responsibleParty") ? (
                  <>
                    <Input
                      value={editDraft.responsibleParty}
                      onChange={(event) =>
                        setEditDraft((prev) => ({
                          ...prev,
                          responsibleParty: event.target.value,
                        }))
                      }
                      placeholder="z. B. Head of Marketing / HR Lead / IT Security"
                      autoFocus
                    />
                    {fieldSaveCancel}
                  </>
                ) : (
                  <p className="text-[15px] font-medium text-slate-900">
                    {ownerLabel}
                  </p>
                )}
              </div>

              {/* Kontaktperson */}
              <div
                id="metadata-field-contactPersonName"
                className="group rounded-md border border-slate-200 bg-slate-50/30 px-4 py-3 space-y-1.5"
              >
                <div className="flex items-center">
                  <p className="text-xs text-muted-foreground">
                    Kontaktperson (optional)
                  </p>
                  {!isFieldEditing("contactPersonName") &&
                    fieldEditTrigger("contactPersonName")}
                </div>
                {isFieldEditing("contactPersonName") ? (
                  <>
                    <Input
                      value={editDraft.contactPersonName}
                      onChange={(event) =>
                        setEditDraft((prev) => ({
                          ...prev,
                          contactPersonName: event.target.value,
                        }))
                      }
                      placeholder="z. B. Max Mustermann"
                      autoFocus
                    />
                    {fieldSaveCancel}
                  </>
                ) : (
                  <p className="text-[15px] font-medium text-slate-900">
                    {contactPersonLabel}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {/* Organisation */}
              <div
                id="metadata-field-organisation"
                className="group rounded-md border border-slate-200 bg-slate-50/30 px-4 py-3 space-y-1.5"
              >
                <div className="flex items-center">
                  <p className="text-xs text-muted-foreground">
                    Organisation (optional)
                  </p>
                  {!isFieldEditing("organisation") &&
                    fieldEditTrigger("organisation")}
                </div>
                {isFieldEditing("organisation") ? (
                  <>
                    <Input
                      value={editDraft.organisation}
                      onChange={(event) =>
                        setEditDraft((prev) => ({
                          ...prev,
                          organisation: event.target.value,
                        }))
                      }
                      placeholder="z. B. KI-Register GmbH"
                      autoFocus
                    />
                    {fieldSaveCancel}
                  </>
                ) : (
                  <p className="text-[15px] font-medium text-slate-900">
                    {organisationLabel}
                  </p>
                )}
              </div>
            </div>

            <div
              id="usecase-focus-oversight"
              className={cn(
                "mt-6 rounded-md border border-slate-200 bg-slate-50/30 px-4 py-3 space-y-1 text-xs text-muted-foreground",
                (focusTarget === "oversight" || focusTarget === "policy") &&
                  focusClassName
              )}
            >
              <div id="usecase-focus-policy" className="h-px w-px" />
              <p className="font-medium text-slate-600">
                Organisation KI-gerecht steuern
              </p>
              <p>
                Zustaendigkeiten, Pruefmodelle und Policies werden in der
                Organisationssteuerung verwaltet.
              </p>
              <button
                type="button"
                className="underline underline-offset-2"
                onClick={() =>
                  router.push(`/control?useCaseId=${card.useCaseId}`)
                }
              >
                Im AI Governance Control anzeigen
              </button>
            </div>
          </section>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function MetadataSummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50/50 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium leading-6 text-slate-900">
        {value}
      </p>
    </div>
  );
}
