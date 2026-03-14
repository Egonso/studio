import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { UseCaseSystemsComplianceSection } from "@/components/register/detail/use-case-systems-compliance-section";
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
  createAiToolsRegistryService,
  riskLevelLabels,
} from "@/lib/register-first";
import {
  applyDataCategoryLogic,
  toggleMultiSelect,
} from "@/lib/register-first/capture-selections";
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
}: UseCaseMetadataSectionProps) {
  const router = useRouter();
  const { toast } = useToast();
  const readOnlyHintAtRef = useRef(0);

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
    aiActCategory: card.governanceAssessment?.core?.aiActCategory ?? "",
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [specialOpen, setSpecialOpen] = useState(false);

  const toolEntry = card.toolId ? aiRegistry.getById(card.toolId) : null;
  const riskClass =
    card.governanceAssessment?.core?.aiActCategory ??
    (toolEntry ? riskLevelLabels[toolEntry.riskLevel] : "Unbekannt");
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
      aiActCategory: card.governanceAssessment?.core?.aiActCategory ?? "",
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

  const handleSave = async () => {
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
            aiActCategory: editDraft.aiActCategory.trim() || null,
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
      {isEditing && (
        <div className="sticky top-3 z-20 flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/75">
          <p className="text-sm text-slate-700">
            Bearbeitungsmodus aktiv. Die Stammdaten dieses Einsatzfalls können jetzt geändert werden.
          </p>
          <Button onClick={() => void handleSave()} disabled={isSaving} size="sm">
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Speichern
          </Button>
        </div>
      )}

      {!isEditing && (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p className="font-medium text-slate-700">Stammdaten sind schreibgeschützt.</p>
          <p>Zum Ändern zuerst "Stammdaten bearbeiten" wählen.</p>
        </div>
      )}

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
            {isEditing ? (
              <Input
                value={editDraft.aiActCategory}
                onChange={(event) =>
                  setEditDraft((prev) => ({
                    ...prev,
                    aiActCategory: event.target.value,
                  }))
                }
                placeholder="z. B. Transparenz-Risiko"
              />
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
          <div className="rounded-md border border-dashed border-slate-200 bg-white px-4 py-4 text-sm text-slate-600 md:col-span-2">
            Systembezogene Compliance-Informationen finden Sie im Abschnitt
            "Beteiligte Systeme & Compliance".
          </div>
        </div>
      </section>

      <UseCaseSystemsComplianceSection
        card={card}
        isEditing={isEditing}
        onSave={onSave}
      />

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

      {isEditing && (
        <div className="flex justify-end border-t border-slate-200 pt-4">
          <Button onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Änderungen speichern
          </Button>
        </div>
      )}
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
