"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { policyService } from "@/lib/policy-engine/policy-service";
import type { PolicyDocument } from "@/lib/policy-engine/types";
import type { UseCaseCard } from "@/lib/register-first/types";
import {
  getWorkflowLinkReferences,
  removeWorkflowLinkReference,
  resolveWorkflowLinkEntries,
  toggleWorkflowLinkReference,
} from "@/lib/register-first/workflow-links";
import { cn } from "@/lib/utils";

interface UseCaseWorkflowLinkSectionProps {
  card: UseCaseCard;
  registerId: string | null;
  highlighted?: boolean;
  autoOpen?: boolean;
  onSave: (updates: Partial<UseCaseCard>) => Promise<void>;
}

export function UseCaseWorkflowLinkSection({
  card,
  registerId,
  highlighted = false,
  autoOpen = false,
  onSave,
}: UseCaseWorkflowLinkSectionProps) {
  const { toast } = useToast();
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReferences, setSelectedReferences] = useState<string[]>(() =>
    getWorkflowLinkReferences(card)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [autoOpenApplied, setAutoOpenApplied] = useState(false);
  const workflowReferenceKey = getWorkflowLinkReferences(card).join("|");

  const currentEntries = useMemo(
    () => resolveWorkflowLinkEntries(card, policies),
    [card, policies]
  );
  const draftEntries = useMemo(
    () => resolveWorkflowLinkEntries(selectedReferences, policies),
    [selectedReferences, policies]
  );
  const selectedPolicyIds = useMemo(
    () =>
      new Set(
        getWorkflowLinkReferences(selectedReferences).map((reference) =>
          reference.toLowerCase()
        )
      ),
    [selectedReferences]
  );
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredPolicies = useMemo(() => {
    const sorted = [...policies].sort((left, right) =>
      left.title.localeCompare(right.title, "de")
    );

    if (normalizedQuery.length === 0) {
      return sorted;
    }

    return sorted.filter((policy) => {
      const haystack = `${policy.title} ${policy.policyId}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, policies]);

  useEffect(() => {
    setSelectedReferences(getWorkflowLinkReferences(card));
    setSearchQuery("");
  }, [card.useCaseId, workflowReferenceKey]);

  useEffect(() => {
    if (!registerId) {
      setPolicies([]);
      setIsLoadingPolicies(false);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setIsLoadingPolicies(true);
    setLoadError(null);

    void policyService
      .listPolicies(registerId)
      .then((result) => {
        if (cancelled) return;
        setPolicies(result);
      })
      .catch((error: unknown) => {
        console.error("Failed to load workflow link candidates", error);
        if (cancelled) return;
        setPolicies([]);
        setLoadError("Vorhandene Dokumente konnten nicht geladen werden.");
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingPolicies(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [registerId]);

  useEffect(() => {
    setAutoOpenApplied(false);
  }, [autoOpen, card.useCaseId]);

  useEffect(() => {
    if (!autoOpen || autoOpenApplied) return;
    setSelectedReferences(getWorkflowLinkReferences(card));
    setIsEditorOpen(true);
    setAutoOpenApplied(true);
  }, [autoOpen, autoOpenApplied, card, workflowReferenceKey]);

  const openEditor = () => {
    setSelectedReferences(getWorkflowLinkReferences(card));
    setSearchQuery("");
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setSelectedReferences(getWorkflowLinkReferences(card));
    setSearchQuery("");
    setIsEditorOpen(false);
  };

  const handleTogglePolicy = (policyId: string) => {
    setSelectedReferences((current) =>
      toggleWorkflowLinkReference(current, policyId)
    );
  };

  const handleRemoveReference = (reference: string) => {
    setSelectedReferences((current) =>
      removeWorkflowLinkReference(current, reference)
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        governanceAssessment: {
          ...card.governanceAssessment,
          core: {
            ...card.governanceAssessment?.core,
          },
          flex: {
            ...card.governanceAssessment?.flex,
            policyLinks: selectedReferences,
          },
        },
      });

      toast({
        title: "Verknüpfung aktualisiert",
        description:
          selectedReferences.length > 0
            ? "Der Einsatzfall ist jetzt mit dem gewählten Dokument verknüpft."
            : "Die Prozess- oder Workflow-Verknüpfung wurde entfernt.",
      });
      setIsEditorOpen(false);
    } catch (error) {
      console.error("Failed to save workflow links", error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Die Verknüpfung konnte nicht gespeichert werden.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section
      id="usecase-focus-policy"
      className={cn(
        "rounded-lg border border-slate-200 bg-white p-5 md:p-6",
        highlighted && "border-l-2 border-slate-300 pl-5 md:pl-6"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-[18px] font-semibold tracking-tight">
            Interne Prozesse & Workflows
          </h2>
          <p className="text-xs text-muted-foreground">
            Ordnet diesen Einsatzfall einem vorhandenen internen Dokument,
            Prozess oder Workflow zu.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-slate-700"
          onClick={openEditor}
        >
          {currentEntries.length > 0 ? "Verknüpfung ändern" : "Verknüpfung setzen"}
        </Button>
      </div>

      <div className="mt-5 rounded-md border border-slate-200 bg-slate-50/30">
        {currentEntries.length > 0 ? (
          currentEntries.map((entry, index) => (
            <div
              key={`${entry.reference}-${index}`}
              className={cn(
                "px-4 py-4",
                index > 0 && "border-t border-slate-200"
              )}
            >
              <p className="text-sm font-medium text-slate-900">{entry.title}</p>
              <p className="mt-1 text-xs text-slate-500">{entry.meta}</p>
            </div>
          ))
        ) : (
          <div className="px-4 py-4">
            <p className="text-sm font-medium text-slate-900">
              Keine Verknüpfung dokumentiert.
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Dieser Einsatzfall ist derzeit keinem internen Prozess oder
              Workflow zugeordnet.
            </p>
          </div>
        )}
      </div>

      {isEditorOpen && (
        <div className="mt-4 rounded-md border border-slate-200 bg-white px-4 py-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-900">
              Verknüpfung bearbeiten
            </p>
            <p className="text-xs text-muted-foreground">
              Vorhandene Dokumente durchsuchen und zuordnen. Mehrere
              Verknüpfungen bleiben möglich, wenn der Einsatzfall in mehreren
              Prozessen geregelt ist.
            </p>
          </div>

          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50/40 px-3 py-3">
            <p className="text-xs text-muted-foreground">Aktuelle Auswahl</p>
            {draftEntries.length > 0 ? (
              <div className="mt-3 space-y-2">
                {draftEntries.map((entry, index) => (
                  <div
                    key={`${entry.reference}-${index}`}
                    className="flex items-start justify-between gap-3 rounded-sm border border-slate-200 bg-white px-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {entry.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{entry.meta}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-slate-600"
                      onClick={() => handleRemoveReference(entry.reference)}
                    >
                      Entfernen
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-600">
                Noch keine Verknüpfung ausgewählt.
              </p>
            )}
          </div>

          <div className="mt-4">
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Prozess oder Workflow suchen"
            />
            <div className="mt-3 rounded-md border border-slate-200">
              {isLoadingPolicies ? (
                <div className="flex items-center gap-2 px-4 py-6 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Dokumente werden geladen.
                </div>
              ) : loadError ? (
                <div className="px-4 py-6 text-sm text-slate-600">{loadError}</div>
              ) : filteredPolicies.length === 0 ? (
                <div className="px-4 py-6 text-sm text-slate-600">
                  {policies.length === 0
                    ? "Im Register sind noch keine verknüpfbaren Dokumente vorhanden."
                    : "Keine passenden Dokumente gefunden."}
                </div>
              ) : (
                <ScrollArea className="h-56">
                  <div className="divide-y divide-slate-200">
                    {filteredPolicies.map((policy) => {
                      const isSelected = selectedPolicyIds.has(
                        policy.policyId.toLowerCase()
                      );

                      return (
                        <button
                          key={policy.policyId}
                          type="button"
                          className={cn(
                            "flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50",
                            isSelected && "bg-slate-50"
                          )}
                          onClick={() => handleTogglePolicy(policy.policyId)}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {policy.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {policy.policyId}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs text-slate-500">
                            {isSelected ? "Ausgewählt" : "Zuordnen"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {policies.length > 0
                ? `${policies.length} Dokumente im Register verfügbar`
                : "Die Auswahl basiert auf vorhandenen Register-Dokumenten."}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={closeEditor}
                disabled={isSaving}
              >
                Abbrechen
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void handleSave()}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Übernehmen
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
