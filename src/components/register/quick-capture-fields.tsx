"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { ToolAutocomplete } from "@/components/tool-autocomplete";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { applyDataCategoryLogic, toggleMultiSelect } from "@/lib/register-first/capture-selections";
import type {
  CaptureUsageContext,
  DataCategory,
  DecisionInfluence,
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

export const TOOL_PLACEHOLDER_ID = "__placeholder__";

export interface QuickCaptureFieldsDraft {
  purpose: string;
  ownerRole: string;
  contactPersonName: string;
  toolId: string;
  toolFreeText: string;
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
}

export function QuickCaptureFields({
  draft,
  onChange,
  autoFocusPurpose = false,
  showDescription = false,
}: QuickCaptureFieldsProps) {
  const [section1Open, setSection1Open] = useState(false);
  const [section2Open, setSection2Open] = useState(false);
  const [specialOpen, setSpecialOpen] = useState(false);

  const section1Count = draft.usageContexts.length + (draft.decisionInfluence ? 1 : 0);
  const mainDataCategoryCount = draft.dataCategories.filter((category) =>
    DATA_CATEGORY_MAIN_OPTIONS.includes(category)
  ).length;

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label htmlFor="qc-purpose">
          Use-Case Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="qc-purpose"
          placeholder="z. B. Marketing Copy Generator"
          value={draft.purpose}
          onChange={(event) => onChange({ purpose: event.target.value })}
          autoFocus={autoFocusPurpose}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="qc-owner">
          Owner-Rolle (funktional) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="qc-owner"
          placeholder="z. B. Head of Marketing / HR Lead / IT Security"
          value={draft.ownerRole}
          onChange={(event) => onChange({ ownerRole: event.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Rolle oder Funktion erfassen, nicht den wechselnden Personennamen.
        </p>
      </div>

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

      <div className="space-y-1.5">
        <Label>
          System / Tool <span className="text-destructive">*</span>
        </Label>
        <ToolAutocomplete
          value={
            draft.toolId === "other" || draft.toolId === TOOL_PLACEHOLDER_ID
              ? draft.toolFreeText
              : draft.toolId
          }
          onChange={(value, toolData) => {
            if (toolData) {
              onChange({
                toolId: toolData.name,
                toolFreeText: toolData.name,
                purpose:
                  draft.purpose ||
                  (toolData.category
                    ? `Einsatz von ${toolData.name} für ${toolData.category}`
                    : `Einsatz von ${toolData.name}`),
              });
              return;
            }

            onChange({
              toolId: "other",
              toolFreeText: value,
            });
          }}
        />
      </div>

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
