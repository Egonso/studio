import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { ControlFocusTarget } from "@/lib/control/deep-link";
import type { DecisionImpact, UseCaseCard } from "@/lib/register-first/types";
import {
  DATA_CATEGORY_LABELS,
  DECISION_INFLUENCE_LABELS,
  resolveDataCategories,
  resolveDecisionInfluence,
  USAGE_CONTEXT_LABELS,
} from "@/lib/register-first/types";
import {
  createAiToolsRegistryService,
  riskLevelLabels,
} from "@/lib/register-first";
import { cn } from "@/lib/utils";

const aiRegistry = createAiToolsRegistryService();

const decisionImpactLabels: Record<DecisionImpact, string> = {
  YES: "Ja",
  NO: "Nein",
  UNSURE: "Unsicher",
};

interface UseCaseMetadataSectionProps {
  card: UseCaseCard;
  isEditing: boolean;
  onSave: (updates: Partial<UseCaseCard>) => Promise<void>;
  focusTarget?: ControlFocusTarget | null;
}

export function UseCaseMetadataSection({
  card,
  isEditing,
  onSave,
  focusTarget = null,
}: UseCaseMetadataSectionProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [editDraft, setEditDraft] = useState({
    purpose: card.purpose,
    responsibleParty: card.responsibility.responsibleParty ?? "",
    organisation: card.organisation ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingCompliance, setIsCheckingCompliance] = useState(false);

  const toolEntry = card.toolId ? aiRegistry.getById(card.toolId) : null;
  const toolDisplayName =
    card.toolId === "other"
      ? card.toolFreeText ?? "Anderes Tool"
      : toolEntry?.productName ?? card.toolId ?? "Kein Tool";
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
  const gdprLabel = getFlagLabel(card.publicInfo?.flags.gdprClaim, Boolean(toolEntry?.gdprCompliant));
  const aiActLabel = getFlagLabel(card.publicInfo?.flags.aiActClaim, false);
  const ownerLabel = card.responsibility.isCurrentlyResponsible
    ? "Erfasser:in (selbst)"
    : card.responsibility.responsibleParty || "Nicht zugewiesen";
  const publicSources = card.publicInfo?.sources ?? [];
  const focusClassName = "border-l-2 border-slate-300 pl-3";

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        purpose: editDraft.purpose,
        responsibility: {
          ...card.responsibility,
          responsibleParty: editDraft.responsibleParty || null,
        },
        organisation: editDraft.organisation || null,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const runComplianceCheck = async () => {
    setIsCheckingCompliance(true);
    try {
      const { getFirebaseAuth } = await import("@/lib/firebase");
      const auth = await getFirebaseAuth();
      const token = await auth.currentUser?.getIdToken();

      if (!token) throw new Error("Nicht eingeloggt");

      const response = await fetch("/api/tools/public-info-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          toolName: toolDisplayName,
          toolVendor: toolEntry?.vendor || "Unknown / Generic",
          force: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Check failed");
      if (!data.result) throw new Error("Keine Ergebnisse vom Server empfangen.");

      await onSave({ publicInfo: data.result });

      toast({
        title: "Smart Hint bereit",
        description: `Compliance-Daten für ${toolDisplayName} gespeichert.`,
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: e.message || "Smart Hint konnte nicht aktualisiert werden.",
      });
    } finally {
      setIsCheckingCompliance(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-slate-200 bg-slate-50/40 p-5 md:p-6">
        <h2 className="text-[18px] font-semibold tracking-tight">Kontext & Risiko</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <FieldBlock label="Zweck" className="rounded-md border border-slate-200 bg-white px-4 py-3">
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
          <FieldBlock label="Wirkungsbereich" className="rounded-md border border-slate-200 bg-white px-4 py-3">
            <p className="text-[15px] font-medium text-slate-900">{usageScope}</p>
          </FieldBlock>
          <FieldBlock
            label="Einfluss auf Entscheidungen"
            className="rounded-md border border-slate-200 bg-white px-4 py-3"
          >
            <p className="text-[15px] font-medium text-slate-900">{decisionLabel}</p>
          </FieldBlock>
          <FieldBlock label="Risikoklasse" className="rounded-md border border-slate-200 bg-white px-4 py-3">
            <p className="text-[15px] font-medium text-slate-900">{riskClass}</p>
          </FieldBlock>
          <FieldBlock label="Datenkategorien" className="rounded-md border border-slate-200 bg-white px-4 py-3">
            <p className="text-[15px] font-medium text-slate-900">{dataCategoryLabel}</p>
          </FieldBlock>
          <FieldBlock label="DSGVO" className="rounded-md border border-slate-200 bg-white px-4 py-3">
            <p className="text-[15px] font-medium text-slate-900">{gdprLabel}</p>
          </FieldBlock>
          <FieldBlock label="AI Act" className="rounded-md border border-slate-200 bg-white px-4 py-3">
            <p className="text-[15px] font-medium text-slate-900">{aiActLabel}</p>
          </FieldBlock>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[18px] font-semibold tracking-tight">Eingesetztes KI-System</h2>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={runComplianceCheck}
            disabled={isCheckingCompliance}
          >
            {isCheckingCompliance ? "Prüfung läuft..." : "Compliance-Information prüfen"}
          </Button>
        </div>

        <p className="mt-4 text-[18px] font-semibold text-slate-900">{toolDisplayName}</p>

        <div className="mt-4 rounded-sm border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
          {card.publicInfo ? (
            <>
              <p>{card.publicInfo.summary}</p>
              {publicSources.length > 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  Quellen:{" "}
                  {publicSources.slice(0, 3).map((source, index) => (
                    <span key={`${source.url}-${index}`}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-700 underline underline-offset-2"
                      >
                        {source.title || `Quelle ${index + 1}`}
                      </a>
                      {index < Math.min(publicSources.length, 3) - 1 ? ", " : ""}
                    </span>
                  ))}
                </p>
              )}
            </>
          ) : (
            <p>
              Smart Hint: Für dieses System liegen derzeit keine dokumentierten
              Compliance-Informationen vor.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 md:p-6">
        <h2 className="text-[18px] font-semibold tracking-tight">Verantwortlich</h2>
        <div
          id="usecase-focus-owner"
          className={cn("mt-5", focusTarget === "owner" && focusClassName)}
        >
          <FieldBlock label="Verantwortliche Person" className="rounded-md border border-slate-200 bg-slate-50/30 px-4 py-3">
            {isEditing ? (
              <Input
                value={editDraft.responsibleParty}
                onChange={(event) =>
                  setEditDraft((prev) => ({
                    ...prev,
                    responsibleParty: event.target.value,
                  }))
                }
                placeholder="z. B. Max Mustermann"
              />
            ) : (
              <p className="text-[15px] font-medium text-slate-900">{ownerLabel}</p>
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
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function getFlagLabel(
  flag: "yes" | "no" | "not_found" | undefined,
  fallbackHint: boolean
): string {
  if (flag === "yes") return "Ja";
  if (flag === "no") return "Nein";
  if (fallbackHint) return "Hinweis vorhanden";
  return "Nicht geprüft";
}
