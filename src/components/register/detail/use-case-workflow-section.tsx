"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";

import { ToolAutocomplete } from "@/components/tool-autocomplete";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { registerFirstFlags } from "@/lib/register-first/flags";
import {
  buildUseCaseWorkflowUpdates,
  resolveUseCaseWorkflowDisplay,
} from "@/lib/register-first/systems";
import { createAiToolsRegistryService } from "@/lib/register-first/tool-registry-service";
import type {
  OrderedUseCaseSystem,
  UseCaseCard,
  WorkflowConnectionMode,
} from "@/lib/register-first/types";

const aiRegistry = createAiToolsRegistryService();

const CONNECTION_MODE_OPTIONS: Array<{
  value: WorkflowConnectionMode;
  label: string;
}> = [
  { value: "MANUAL_SEQUENCE", label: "Manuell nacheinander" },
  { value: "SEMI_AUTOMATED", label: "Teilweise automatisiert" },
  { value: "FULLY_AUTOMATED", label: "Weitgehend automatisiert" },
];

interface WorkflowDraftSystem extends OrderedUseCaseSystem {
  inputValue: string;
  preserveExisting: boolean;
}

interface UseCaseWorkflowSectionProps {
  card: UseCaseCard;
  onSave: (updates: Partial<UseCaseCard>) => Promise<void>;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function resolveToolDisplay(toolId?: string | null): string | null {
  const normalizedToolId = normalizeOptionalText(toolId);
  if (!normalizedToolId || normalizedToolId === "other") {
    return null;
  }

  return aiRegistry.getById(normalizedToolId)?.productName ?? null;
}

function createDraftSystem(
  input?: Partial<OrderedUseCaseSystem>,
  fallbackPosition = 1
): WorkflowDraftSystem {
  const toolId = normalizeOptionalText(input?.toolId) ?? undefined;
  const toolFreeText = normalizeOptionalText(input?.toolFreeText) ?? undefined;
  const inputValue =
    toolFreeText ?? resolveToolDisplay(toolId) ?? toolId ?? "";

  return {
    entryId:
      normalizeOptionalText(input?.entryId) ??
      `workflow_draft_${Math.random().toString(36).slice(2, 10)}`,
    position: input?.position ?? fallbackPosition,
    toolId,
    toolFreeText,
    inputValue,
    preserveExisting: true,
  };
}

function normalizeDraftSystems(card: UseCaseCard): WorkflowDraftSystem[] {
  const workflow = resolveUseCaseWorkflowDisplay(card, {
    resolveToolName: resolveToolDisplay,
  });

  if (workflow.systems.length === 0) {
    return [createDraftSystem(undefined, 1)];
  }

  return workflow.systems.map((system, index) =>
    createDraftSystem(system, index + 1)
  );
}

function withNormalizedPositions(
  systems: ReadonlyArray<WorkflowDraftSystem>
): WorkflowDraftSystem[] {
  return systems.map((system, index) => ({
    ...system,
    position: index + 1,
  }));
}

export function UseCaseWorkflowSection({
  card,
  onSave,
}: UseCaseWorkflowSectionProps) {
  const workflow = useMemo(
    () =>
      resolveUseCaseWorkflowDisplay(card, {
        resolveToolName: resolveToolDisplay,
      }),
    [card]
  );
  const canEditWorkflow =
    registerFirstFlags.multisystemCapture ||
    workflow.hasMultipleSystems ||
    Boolean(workflow.connectionModeLabel || workflow.summary);

  const [isEditing, setIsEditing] = useState(false);
  const [draftSystems, setDraftSystems] = useState<WorkflowDraftSystem[]>(() =>
    normalizeDraftSystems(card)
  );
  const [draftConnectionMode, setDraftConnectionMode] = useState<
    WorkflowConnectionMode | ""
  >(card.workflow?.connectionMode ?? "");
  const [draftSummary, setDraftSummary] = useState(card.workflow?.summary ?? "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setDraftSystems(normalizeDraftSystems(card));
      setDraftConnectionMode(card.workflow?.connectionMode ?? "");
      setDraftSummary(card.workflow?.summary ?? "");
    }
  }, [card, isEditing]);

  const resetDraft = () => {
    setDraftSystems(normalizeDraftSystems(card));
    setDraftConnectionMode(card.workflow?.connectionMode ?? "");
    setDraftSummary(card.workflow?.summary ?? "");
  };

  const updateSystem = (
    index: number,
    patch: Partial<WorkflowDraftSystem>
  ) => {
    setDraftSystems((current) =>
      withNormalizedPositions(
        current.map((system, systemIndex) =>
          systemIndex === index
            ? {
                ...system,
                ...patch,
              }
            : system
        )
      )
    );
  };

  const addSystem = () => {
    setDraftSystems((current) =>
      withNormalizedPositions([
        ...current,
        createDraftSystem(undefined, current.length + 1),
      ])
    );
  };

  const removeSystem = (index: number) => {
    setDraftSystems((current) => {
      const nextSystems = current.filter(
        (_system, systemIndex) => systemIndex !== index
      );
      return withNormalizedPositions(
        nextSystems.length > 0 ? nextSystems : [createDraftSystem(undefined, 1)]
      );
    });
  };

  const moveSystem = (index: number, direction: -1 | 1) => {
    setDraftSystems((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const nextSystems = [...current];
      const [movedSystem] = nextSystems.splice(index, 1);
      nextSystems.splice(nextIndex, 0, movedSystem);
      return withNormalizedPositions(nextSystems);
    });
  };

  const handleCancel = () => {
    resetDraft();
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const connectionMode: WorkflowConnectionMode | undefined =
        draftConnectionMode === "" ? undefined : draftConnectionMode;
      const hasWorkflowMetadata =
        draftSystems.filter(
          (system) => normalizeOptionalText(system.inputValue)?.length
        ).length >= 2 ||
        Boolean(connectionMode) ||
        draftSummary.trim().length > 0;

      const updates = buildUseCaseWorkflowUpdates({
        orderedSystems: draftSystems.map((system) =>
          system.preserveExisting
            ? {
                entryId: system.entryId,
                position: system.position,
                toolId: system.toolId,
                toolFreeText: system.toolFreeText,
              }
            : {
                entryId: system.entryId,
                position: system.position,
                toolId: system.toolId,
                toolFreeText: normalizeOptionalText(system.toolFreeText) ?? undefined,
              }
        ),
        workflow: hasWorkflowMetadata
          ? {
              ...(connectionMode ? { connectionMode } : {}),
              summary: draftSummary,
            }
          : undefined,
      });

      await onSave(updates);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-[18px] font-semibold tracking-tight">
            Ablauf & Systeme
          </h2>
          <p className="text-xs text-muted-foreground">
            Dokumentiert die beteiligten Systeme in Reihenfolge, inklusive APIs
            und optionalem Ablaufhinweis.
          </p>
        </div>

        {canEditWorkflow && !isEditing ? (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Ablauf bearbeiten
          </Button>
        ) : null}
      </div>

      {isEditing ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Änderungen bleiben lokal, bis Sie diesen Abschnitt speichern.
          </div>

          <div className="space-y-3">
            {draftSystems.map((system, index) => (
              <div
                key={system.entryId}
                className="rounded-md border border-slate-200 bg-slate-50/50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Label htmlFor={`workflow-system-${system.entryId}`}>
                      System {index + 1}
                    </Label>
                    <ToolAutocomplete
                      inputId={`workflow-system-${system.entryId}`}
                      value={system.inputValue}
                      placeholder="z. B. ChatGPT, Perplexity API, Gemini API"
                      onChange={(value, toolData) => {
                        if (toolData?.name) {
                          updateSystem(index, {
                            inputValue: toolData.name,
                            toolId: toolData.name,
                            toolFreeText: toolData.name,
                            preserveExisting: false,
                          });
                          return;
                        }

                        updateSystem(index, {
                          inputValue: value,
                          toolId: "other",
                          toolFreeText: value,
                          preserveExisting: false,
                        });
                      }}
                    />
                  </div>

                  <div className="flex shrink-0 items-center gap-1 pt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveSystem(index, -1)}
                      disabled={index === 0}
                      aria-label={`System ${index + 1} nach oben verschieben`}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveSystem(index, 1)}
                      disabled={index === draftSystems.length - 1}
                      aria-label={`System ${index + 1} nach unten verschieben`}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSystem(index)}
                      aria-label={`System ${index + 1} entfernen`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={addSystem}>
            <Plus className="mr-2 h-4 w-4" />
            System hinzufügen
          </Button>

          {(draftSystems.filter((system) => system.inputValue.trim().length > 0)
            .length >= 2 ||
            draftConnectionMode ||
            draftSummary.trim().length > 0) && (
            <div className="grid gap-4 rounded-md border border-slate-200 bg-slate-50/40 p-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Wie hängen die Systeme zusammen?</Label>
                <Select
                  value={draftConnectionMode || "__none__"}
                  onValueChange={(value) =>
                    setDraftConnectionMode(
                      value === "__none__" ? "" : (value as WorkflowConnectionMode)
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Kein Ablaufhinweis</SelectItem>
                    {CONNECTION_MODE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Kurze Ablaufbeschreibung (optional)</Label>
                <Textarea
                  value={draftSummary}
                  onChange={(event) =>
                    setDraftSummary(event.target.value.slice(0, 300))
                  }
                  rows={3}
                  placeholder="z. B. Recherche -> Entwurf -> Bild -> Freigabe"
                />
                <p className="text-right text-xs text-muted-foreground">
                  {draftSummary.length}/300
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => void handleSave()} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Speichern
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="mr-2 h-4 w-4" />
              Abbrechen
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={resetDraft}
              disabled={isSaving}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Zurücksetzen
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {workflow.systemCount > 0 ? (
            <ol className="space-y-2">
              {workflow.systems.map((system) => (
                <li
                  key={system.entryId}
                  className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50/40 px-4 py-3"
                >
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700">
                    {system.position}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {system.displayName}
                    </p>
                    {system.toolId && system.toolId !== "other" ? (
                      <p className="text-xs text-muted-foreground">
                        Referenz: {system.toolId}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="rounded-md border border-dashed border-slate-200 px-4 py-6 text-sm text-muted-foreground">
              Noch keine beteiligten Systeme dokumentiert.
            </div>
          )}

          {(workflow.connectionModeLabel || workflow.summary) && (
            <div className="grid gap-3 md:grid-cols-2">
              {workflow.connectionModeLabel ? (
                <div className="rounded-md border border-slate-200 bg-slate-50/30 px-4 py-3">
                  <p className="text-xs text-muted-foreground">Ablaufart</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {workflow.connectionModeLabel}
                  </p>
                </div>
              ) : null}
              {workflow.summary ? (
                <div className="rounded-md border border-slate-200 bg-slate-50/30 px-4 py-3 md:col-span-2">
                  <p className="text-xs text-muted-foreground">
                    Kurze Ablaufbeschreibung
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    {workflow.summary}
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
