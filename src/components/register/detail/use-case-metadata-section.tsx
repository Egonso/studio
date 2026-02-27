import { useState } from "react";
import {
  Check,
  ExternalLink,
  FileBadge,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { ControlFocusTarget } from "@/lib/control/deep-link";
import type { DecisionImpact, UseCaseCard } from "@/lib/register-first/types";
import {
  DATA_CATEGORY_LABELS,
  DECISION_INFLUENCE_LABELS,
  USAGE_CONTEXT_LABELS,
} from "@/lib/register-first/types";
import {
  createAiToolsRegistryService,
  riskLevelColors,
  riskLevelLabels,
} from "@/lib/register-first";

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

  const decisionLabel = card.decisionInfluence
    ? DECISION_INFLUENCE_LABELS[card.decisionInfluence]
    : decisionImpactLabels[card.decisionImpact];
  const policyLinks = (card.governanceAssessment?.flex?.policyLinks ?? []).filter(
    (entry) => entry.trim().length > 0
  );
  const oversightModel = card.governanceAssessment?.flex?.iso?.oversightModel;
  const oversightDefined =
    card.governanceAssessment?.core?.oversightDefined === true ||
    Boolean(oversightModel && oversightModel !== "unknown");
  const oversightLabel =
    oversightModel && oversightModel !== "unknown"
      ? oversightModel
      : oversightDefined
        ? "Definiert (ohne Modellangabe)"
        : "Nicht dokumentiert";
  const focusClassName = "rounded-md border border-slate-300 bg-slate-50/70 p-2";

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
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 border-b pb-4">
        <CardTitle className="text-base">Use-Case-Stammdokumentation</CardTitle>
        {!isEditing && (
          <div className="flex flex-col items-end gap-1">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-primary/5 text-primary hover:bg-primary/10 border-primary/20"
                onClick={() => router.push(`/pass/${card.useCaseId}`)}
              >
                <FileBadge className="mr-2 h-4 w-4" />
                Use-Case Pass
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/control?useCaseId=${card.useCaseId}`)}
              >
                Im AI Governance Control anzeigen
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Organisation steuern und Audit-Fähigkeit herstellen
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {!isEditing && (
          <div className="rounded-md border border-blue-100 bg-blue-50/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-blue-500" /> Smart Hint
              </h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-blue-600 hover:text-blue-800"
                onClick={runComplianceCheck}
                disabled={isCheckingCompliance}
              >
                {isCheckingCompliance ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Search className="mr-1 h-3 w-3" />
                )}
                {card.publicInfo ? "Aktualisieren" : "Prüfen"}
              </Button>
            </div>

            {card.publicInfo ? (
              <div className="text-sm">
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className={
                      card.publicInfo.flags.gdprClaim === "yes"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "text-muted-foreground border-slate-200"
                    }
                  >
                    DSGVO {card.publicInfo.flags.gdprClaim === "yes" ? "✓" : "?"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      card.publicInfo.flags.aiActClaim === "yes"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "text-muted-foreground border-slate-200"
                    }
                  >
                    AI Act {card.publicInfo.flags.aiActClaim === "yes" ? "✓" : "?"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {card.publicInfo.summary}
                </p>
                {card.publicInfo.sources && card.publicInfo.sources.length > 0 && (
                  <div className="mt-2 flex gap-3">
                    {card.publicInfo.sources.slice(0, 2).map((source, index) => (
                      <a
                        key={`${source.url}-${index}`}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Quelle {index + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Lassen Sie öffentlich verfügbare Compliance-Informationen für dieses Tool prüfen.
              </p>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Zweck</Label>
          {isEditing ? (
            <Textarea
              value={editDraft.purpose}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, purpose: e.target.value }))}
              rows={3}
            />
          ) : (
            <p className="text-sm">{card.purpose}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">KI-Tool</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{toolDisplayName}</span>
            {toolEntry && (
              <>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-normal ${riskLevelColors[toolEntry.riskLevel]}`}
                >
                  {riskLevelLabels[toolEntry.riskLevel]}
                </Badge>
                {toolEntry.gdprCompliant && (
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-[10px] font-normal text-blue-700"
                  >
                    DSGVO
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Verwendungskontext</Label>
          <div className="flex flex-wrap gap-1.5">
            {card.usageContexts.map((ctx) => (
              <Badge key={ctx} variant="outline" className="text-[10px] font-normal">
                {USAGE_CONTEXT_LABELS[ctx]}
              </Badge>
            ))}
            {card.usageContexts.length === 0 && (
              <span className="text-xs text-muted-foreground">Nicht angegeben</span>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Beeinflusst Entscheidungen</Label>
          <span className="text-sm">{decisionLabel}</span>
        </div>

        {card.dataCategory && (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Datenkategorie</Label>
            <Badge variant="outline" className="text-[10px] font-normal">
              {DATA_CATEGORY_LABELS[card.dataCategory] ?? card.dataCategory}
            </Badge>
          </div>
        )}

        <div
          id="usecase-focus-owner"
          className={focusTarget === "owner" ? focusClassName : undefined}
        >
          <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Verantwortliche Person</Label>
          {isEditing ? (
            <Input
              value={editDraft.responsibleParty}
              onChange={(e) =>
                setEditDraft((prev) => ({ ...prev, responsibleParty: e.target.value }))
              }
              placeholder="z. B. Max Mustermann"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {card.responsibility.isCurrentlyResponsible
                ? "Erfasser:in (selbst)"
                : card.responsibility.responsibleParty || "Nicht zugewiesen"}
            </p>
          )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Organisationseinheit</Label>
          {isEditing ? (
            <Input
              value={editDraft.organisation}
              onChange={(e) =>
                setEditDraft((prev) => ({ ...prev, organisation: e.target.value }))
              }
              placeholder="z. B. Marketing"
            />
          ) : (
            <p className="text-sm text-muted-foreground">{card.organisation || "Nicht angegeben"}</p>
          )}
        </div>

        <div
          id="usecase-focus-oversight"
          className={focusTarget === "oversight" ? focusClassName : undefined}
        >
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Aufsichtsmodell</Label>
            <p className="text-sm text-muted-foreground">{oversightLabel}</p>
          </div>
        </div>

        <div
          id="usecase-focus-policy"
          className={focusTarget === "policy" ? focusClassName : undefined}
        >
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Policy-Zuordnung</Label>
            <p className="text-sm text-muted-foreground">
              {policyLinks.length > 0
                ? `${policyLinks.length} Policy-Verknuepfung(en) hinterlegt`
                : "Keine Policy-Verknuepfung dokumentiert"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t pt-4">
          <div className="space-y-1">
            <Label className="text-[10px] font-medium text-muted-foreground">Erstellt</Label>
            <p className="text-xs">{formatDate(card.createdAt)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-medium text-muted-foreground">Aktualisiert</Label>
            <p className="text-xs">{formatDate(card.updatedAt)}</p>
          </div>
        </div>

        {isEditing && (
          <div className="mt-2 flex justify-end pt-2">
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
      </CardContent>
    </Card>
  );
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "unbekannt";
  return date.toLocaleString("de-DE");
}
