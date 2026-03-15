"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Plus, X } from "lucide-react";

import { ToolAutocomplete } from "@/components/tool-autocomplete";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CAPTURE_TOOL_PLACEHOLDER_ID,
  SHARED_CAPTURE_FIELD_IDS,
  type SharedCaptureFieldErrors,
} from "@/lib/register-first/shared-capture-fields";
import { registerFirstFlags } from "@/lib/register-first/flags";
import { applyDataCategoryLogic, toggleMultiSelect } from "@/lib/register-first/capture-selections";
import { splitOrderedSystemsForStorage } from "@/lib/register-first/card-model";
import type {
  CaptureUsageContext,
  DataCategory,
  DecisionInfluence,
  OrderedUseCaseSystem,
  WorkflowConnectionMode,
} from "@/lib/register-first/types";
import {
  DATA_CATEGORY_LABELS,
  DATA_CATEGORY_MAIN_OPTIONS,
  DATA_CATEGORY_SPECIAL_OPTIONS,
  DECISION_INFLUENCE_LABELS,
  DECISION_INFLUENCE_OPTIONS,
  USAGE_CONTEXT_LABELS,
  USAGE_CONTEXT_OPTIONS,
} from "@/lib/register-first/types";

export const TOOL_PLACEHOLDER_ID = CAPTURE_TOOL_PLACEHOLDER_ID;

export interface QuickCaptureFieldsDraft {
  purpose: string;
  ownerRole: string;
  contactPersonName: string;
  toolId: string;
  toolFreeText: string;
  systems: OrderedUseCaseSystem[];
  workflowConnectionMode: WorkflowConnectionMode | null;
  workflowSummary: string;
  usageContexts: CaptureUsageContext[];
  dataCategories: DataCategory[];
  decisionInfluence: DecisionInfluence | null;
  description?: string;
}

interface QuickCaptureFieldsProps {
  draft: QuickCaptureFieldsDraft;
  onChange: (patch: Partial<QuickCaptureFieldsDraft>) => void;
  autoFocusPurpose?: boolean;
  showDescription?: boolean;
  errors?: SharedCaptureFieldErrors;
  multisystemEnabled?: boolean;
  showOwnerRole?: boolean;
  showContactPerson?: boolean;
  showUsageSection?: boolean;
  autoFillPurposeFromSystem?: boolean;
  purposeLabel?: string;
  purposePlaceholder?: string;
  purposeHelperText?: string | null;
  systemLabel?: string;
  systemHelperText?: string | null;
  showSystemOptionalLabel?: boolean;
  forceOpenDataSection?: boolean;
}

export function QuickCaptureFields({
  draft,
  onChange,
  autoFocusPurpose = false,
  showDescription = false,
  errors = {},
  multisystemEnabled: multisystemEnabledOverride,
  showOwnerRole = true,
  showContactPerson = true,
  showUsageSection = true,
  autoFillPurposeFromSystem = true,
  purposeLabel = "Use-Case Name",
  purposePlaceholder = "z. B. Marketing Copy Generator",
  purposeHelperText = null,
  systemLabel,
  systemHelperText,
  showSystemOptionalLabel = true,
  forceOpenDataSection = false,
}: QuickCaptureFieldsProps) {
  const multisystemEnabled =
    multisystemEnabledOverride ?? registerFirstFlags.multisystemCapture;
  const [section1Open, setSection1Open] = useState(
    () => draft.usageContexts.length > 0 || Boolean(draft.decisionInfluence)
  );
  const [section2Open, setSection2Open] = useState(
    () => draft.dataCategories.length > 0
  );
  const [specialOpen, setSpecialOpen] = useState(() =>
    DATA_CATEGORY_SPECIAL_OPTIONS.some((option) =>
      draft.dataCategories.includes(option)
    )
  );
  const [workflowOpen, setWorkflowOpen] = useState(
    () =>
      Boolean(draft.workflowConnectionMode) ||
      draft.workflowSummary.trim().length > 0
  );
  const [isAddingSystem, setIsAddingSystem] = useState(false);
  const [pendingSystemValue, setPendingSystemValue] = useState("");

  const section1Count = draft.usageContexts.length + (draft.decisionInfluence ? 1 : 0);
  const mainDataCategoryCount = draft.dataCategories.filter((category) =>
    DATA_CATEGORY_MAIN_OPTIONS.includes(category)
  ).length;
  const selectedSystems = multisystemEnabled ? draft.systems : [];
  const workflowCount =
    (draft.workflowConnectionMode ? 1 : 0) +
    (draft.workflowSummary.trim().length > 0 ? 1 : 0);
  const resolvedSystemLabel =
    systemLabel ?? (multisystemEnabled ? "Systeme" : "System / Tool");
  const resolvedSystemHelperText =
    systemHelperText ??
    (multisystemEnabled
      ? "Optional. Du kannst Tools, APIs oder andere beteiligte Systeme erfassen."
      : "Optional. Du kannst ein Tool aus dem Katalog wählen oder einen eigenen Namen erfassen.");

  useEffect(() => {
    if (forceOpenDataSection) {
      setSection2Open(true);
    }
  }, [forceOpenDataSection]);

  const syncSystemsPatch = (
    nextSystems: OrderedUseCaseSystem[]
  ): Partial<QuickCaptureFieldsDraft> => {
    const reindexedSystems = nextSystems.map((system, index) => ({
      ...system,
      position: index + 1,
    }));
    const storage = splitOrderedSystemsForStorage(reindexedSystems, {
      workflow:
        reindexedSystems.length >= 2
          ? {
              connectionMode: draft.workflowConnectionMode ?? undefined,
              summary: draft.workflowSummary,
            }
          : undefined,
    });

    return {
      systems: reindexedSystems,
      toolId: storage.toolId ?? TOOL_PLACEHOLDER_ID,
      toolFreeText: storage.toolFreeText ?? "",
    };
  };

  const createSystemDisplayLabel = (system: OrderedUseCaseSystem) => {
    if (system.toolId === "other") {
      return system.toolFreeText ?? "Eigenes System";
    }

    return system.toolFreeText ?? system.toolId ?? "System";
  };

  const addSystem = (value: string, toolData?: { name?: string; category?: string }) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    const nextSystems = [
      ...selectedSystems,
      {
        entryId:
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? `capture_${crypto.randomUUID().replace(/-/g, "")}`
            : `capture_${Date.now().toString(36)}`,
        position: selectedSystems.length + 1,
        toolId: toolData?.name ?? "other",
        toolFreeText: toolData?.name ? undefined : trimmed,
      },
    ];

    onChange({
      ...syncSystemsPatch(nextSystems),
      ...(autoFillPurposeFromSystem
        ? {
            purpose:
              draft.purpose ||
              (toolData?.name
                ? toolData.category
                  ? `Einsatz von ${toolData.name} für ${toolData.category}`
                  : `Einsatz von ${toolData.name}`
                : draft.purpose),
          }
        : {}),
    });
    setPendingSystemValue("");
    setIsAddingSystem(false);
  };

  const removeSystem = (entryId: string) => {
    const nextSystems = selectedSystems.filter((system) => system.entryId !== entryId);
    onChange(syncSystemsPatch(nextSystems));
  };

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label htmlFor={SHARED_CAPTURE_FIELD_IDS.purpose}>
          {purposeLabel} <span className="text-destructive">*</span>
        </Label>
        <Input
          id={SHARED_CAPTURE_FIELD_IDS.purpose}
          placeholder={purposePlaceholder}
          value={draft.purpose}
          onChange={(event) => onChange({ purpose: event.target.value })}
          autoFocus={autoFocusPurpose}
          aria-invalid={Boolean(errors.purpose)}
          aria-describedby={errors.purpose ? "qc-purpose-error" : undefined}
          className={errors.purpose ? "border-destructive focus-visible:ring-destructive" : undefined}
        />
        {errors.purpose && (
          <p id="qc-purpose-error" className="text-xs text-destructive">
            {errors.purpose}
          </p>
        )}
        {purposeHelperText ? (
          <p className="text-xs text-muted-foreground">{purposeHelperText}</p>
        ) : null}
      </div>

      {showOwnerRole ? (
        <div className="space-y-1.5">
          <Label htmlFor={SHARED_CAPTURE_FIELD_IDS.ownerRole}>
            Owner-Rolle (funktional) <span className="text-destructive">*</span>
          </Label>
          <Input
            id={SHARED_CAPTURE_FIELD_IDS.ownerRole}
            placeholder="z. B. Head of Marketing / HR Lead / IT Security"
            value={draft.ownerRole}
            onChange={(event) => onChange({ ownerRole: event.target.value })}
            aria-invalid={Boolean(errors.ownerRole)}
            aria-describedby={errors.ownerRole ? "qc-owner-error" : undefined}
            className={errors.ownerRole ? "border-destructive focus-visible:ring-destructive" : undefined}
          />
          <p className="text-xs text-muted-foreground">
            Rolle oder Funktion erfassen, nicht den wechselnden Personennamen.
          </p>
          {errors.ownerRole && (
            <p id="qc-owner-error" className="text-xs text-destructive">
              {errors.ownerRole}
            </p>
          )}
        </div>
      ) : null}

      {showContactPerson ? (
        <div className="space-y-1.5">
          <Label htmlFor="qc-contact-person">Kontaktperson (optional)</Label>
          <Input
            id="qc-contact-person"
            placeholder="z. B. Max Mustermann"
            value={draft.contactPersonName}
            onChange={(event) =>
              onChange({ contactPersonName: event.target.value })
            }
          />
        </div>
      ) : null}

      {!multisystemEnabled ? (
        <div className="space-y-1.5">
          <Label htmlFor={SHARED_CAPTURE_FIELD_IDS.tool}>
            {resolvedSystemLabel}
            {showSystemOptionalLabel ? (
              <span className="text-muted-foreground"> (optional)</span>
            ) : null}
          </Label>
          <ToolAutocomplete
            inputId={SHARED_CAPTURE_FIELD_IDS.tool}
            value={
              draft.toolId === "other" || draft.toolId === TOOL_PLACEHOLDER_ID
                ? draft.toolFreeText
                : draft.toolId
            }
            inputClassName="pr-10"
            onChange={(value, toolData) => {
              if (toolData) {
                onChange({
                  toolId: toolData.name,
                  toolFreeText: toolData.name,
                  ...(autoFillPurposeFromSystem
                    ? {
                        purpose:
                          draft.purpose ||
                          (toolData.category
                            ? `Einsatz von ${toolData.name} für ${toolData.category}`
                            : `Einsatz von ${toolData.name}`),
                      }
                    : {}),
                });
                return;
              }

              onChange({
                toolId: "other",
                toolFreeText: value,
              });
            }}
          />
          {resolvedSystemHelperText ? (
            <p className="text-xs text-muted-foreground">
              {resolvedSystemHelperText}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor={SHARED_CAPTURE_FIELD_IDS.tool}>
            {resolvedSystemLabel}
            {showSystemOptionalLabel ? (
              <span className="text-muted-foreground"> (optional)</span>
            ) : null}
          </Label>

          {selectedSystems.length > 0 && (
            <div className="space-y-2 rounded-md border bg-muted/20 p-2">
              {selectedSystems.map((system, index) => (
                <div
                  key={system.entryId}
                  className="flex items-center justify-between gap-3 rounded-md bg-background px-2.5 py-2"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {createSystemDisplayLabel(system)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {system.toolId === "other" ? "Eigenes System" : "Katalog-System"}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => removeSystem(system.entryId)}
                    aria-label={`${createSystemDisplayLabel(system)} entfernen`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {(selectedSystems.length === 0 || isAddingSystem) && (
            <div className="space-y-2">
              <ToolAutocomplete
                inputId={SHARED_CAPTURE_FIELD_IDS.tool}
                value={pendingSystemValue}
                placeholder="z. B. ChatGPT, Perplexity API, Gemini API, Sora"
                onChange={() => {}}
                onInputChange={setPendingSystemValue}
                onSelect={addSystem}
              />
              {selectedSystems.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-muted-foreground"
                  onClick={() => {
                    setPendingSystemValue("");
                    setIsAddingSystem(false);
                  }}
                >
                  Abbrechen
                </Button>
              )}
            </div>
          )}

          {selectedSystems.length > 0 && !isAddingSystem && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-fit px-2 text-muted-foreground"
              onClick={() => setIsAddingSystem(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Weiteres System
            </Button>
          )}

          {resolvedSystemHelperText ? (
            <p className="text-xs text-muted-foreground">
              {resolvedSystemHelperText}
            </p>
          ) : null}

          {selectedSystems.length >= 2 && (
            <div className="rounded-md border">
              <button
                type="button"
                onClick={() => setWorkflowOpen((current) => !current)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50"
              >
                <span className="flex items-center gap-2">
                  {workflowOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  Zusammenhang <span className="text-muted-foreground">(optional)</span>
                </span>
                {workflowCount > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {workflowCount} ergänzt
                  </span>
                )}
              </button>

              {workflowOpen && (
                <div className="space-y-4 border-t px-3 py-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Wie laufen die Systeme überwiegend zusammen?
                    </Label>
                    <div className="space-y-1.5">
                      {[
                        {
                          value: "MANUAL_SEQUENCE" as const,
                          label: "Manuell nacheinander",
                        },
                        {
                          value: "SEMI_AUTOMATED" as const,
                          label: "Teilweise automatisiert",
                        },
                        {
                          value: "FULLY_AUTOMATED" as const,
                          label: "Weitgehend automatisiert",
                        },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                          <input
                            type="radio"
                            name="workflowConnectionMode"
                            checked={draft.workflowConnectionMode === option.value}
                            onChange={() =>
                              onChange({ workflowConnectionMode: option.value })
                            }
                            className="h-4 w-4 border-border text-primary"
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="qc-workflow-summary">
                      Kurze Ablaufbeschreibung <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Textarea
                      id="qc-workflow-summary"
                      placeholder="z. B. Perplexity API recherchiert Themen, Gemini API schreibt Text, Sora erstellt Bilder"
                      value={draft.workflowSummary}
                      onChange={(event) =>
                        onChange({
                          workflowSummary: event.target.value.slice(0, 300),
                        })
                      }
                      rows={3}
                      maxLength={300}
                    />
                    <p className="text-right text-[10px] text-muted-foreground">
                      {draft.workflowSummary.length}/300
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showUsageSection ? (
        <div className="rounded-md border">
          <button
            type="button"
            onClick={() => setSection1Open((current) => !current)}
            className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50"
          >
            <span className="flex items-center gap-2">
              {section1Open ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Wirkung &amp; Betroffene
            </span>
            {section1Count > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {section1Count} gewählt
              </span>
            )}
          </button>

          {section1Open && (
            <div className="space-y-4 border-t px-3 py-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Wirkungsbereich (Mehrfachauswahl)
                </Label>
                <div className="space-y-1.5">
                  {USAGE_CONTEXT_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={draft.usageContexts.includes(option)}
                        onCheckedChange={() =>
                          onChange({
                            usageContexts: toggleMultiSelect(draft.usageContexts, option),
                          })
                        }
                      />
                      {USAGE_CONTEXT_LABELS[option]}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Einfluss auf Entscheidungen
                </Label>
                <div className="space-y-1.5">
                  {DECISION_INFLUENCE_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        type="radio"
                        name="decisionInfluence"
                        checked={draft.decisionInfluence === option}
                        onChange={() => onChange({ decisionInfluence: option })}
                        className="h-4 w-4 border-border text-primary"
                      />
                      {DECISION_INFLUENCE_LABELS[option]}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      <div className="rounded-md border">
        <button
          type="button"
          onClick={() => setSection2Open((current) => !current)}
          className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50"
        >
          <span className="flex items-center gap-2">
            {section2Open ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            Daten &amp; Sensitivität
          </span>
          {mainDataCategoryCount > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {mainDataCategoryCount} gewählt
            </span>
          )}
        </button>

        {section2Open && (
          <div className="space-y-1.5 border-t px-3 py-3">
            <Label className="text-xs text-muted-foreground">
              Datenkategorien (Mehrfachauswahl)
            </Label>

            {DATA_CATEGORY_MAIN_OPTIONS.map((option) => (
              <div key={option}>
                <label className="flex cursor-pointer items-center gap-2 py-0.5 text-sm">
                  <Checkbox
                    checked={draft.dataCategories.includes(option)}
                    onCheckedChange={() =>
                      onChange({
                        dataCategories: applyDataCategoryLogic(
                          draft.dataCategories,
                          option
                        ),
                      })
                    }
                  />
                  <span className="flex-1">{DATA_CATEGORY_LABELS[option]}</span>
                  {option === "SPECIAL_PERSONAL" && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setSpecialOpen((current) => !current);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {specialOpen ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </label>

                {option === "SPECIAL_PERSONAL" && specialOpen && (
                  <div className="mb-2 ml-6 mt-1 space-y-1 rounded-md bg-muted/30 p-2">
                    {DATA_CATEGORY_SPECIAL_OPTIONS.map((subOption) => (
                      <label
                        key={subOption}
                        className="flex cursor-pointer items-center gap-2 text-sm"
                      >
                        <Checkbox
                          checked={draft.dataCategories.includes(subOption)}
                          onCheckedChange={() =>
                            onChange({
                              dataCategories: applyDataCategoryLogic(
                                draft.dataCategories,
                                subOption
                              ),
                            })
                          }
                        />
                        {DATA_CATEGORY_LABELS[subOption]}
                      </label>
                    ))}
                    <p className="mt-1.5 text-[10px] leading-tight text-muted-foreground">
                      Art. 9 DSGVO umfasst auch: ethnische Herkunft,
                      Gewerkschaftszugehörigkeit, genetische Daten, sexuelle
                      Orientierung
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showDescription && (
        <div className="space-y-1.5">
          <Label htmlFor="qc-desc">Kurzbeschreibung</Label>
          <Textarea
            id="qc-desc"
            placeholder="Optional, max. 160 Zeichen"
            value={draft.description ?? ""}
            onChange={(event) =>
              onChange({ description: event.target.value.slice(0, 160) })
            }
            rows={2}
            maxLength={160}
          />
          <p className="text-right text-[10px] text-muted-foreground">
            {(draft.description ?? "").length}/160
          </p>
        </div>
      )}
    </div>
  );
}
