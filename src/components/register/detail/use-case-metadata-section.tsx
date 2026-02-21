"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles, Search, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UseCaseAssessmentWizard } from "./use-case-assessment-wizard";
import { ToolkitUpsellButton } from "../toolkit-upsell-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  UseCaseCard,
  CaptureUsageContext,
  DataCategory,
  DecisionImpact,
} from "@/lib/register-first/types";
import {
  createAiToolsRegistryService,
  riskLevelLabels,
  riskLevelColors,
} from "@/lib/register-first";

const aiRegistry = createAiToolsRegistryService();

const usageContextLabels: Record<CaptureUsageContext, string> = {
  INTERNAL_ONLY: "Nur intern",
  CUSTOMER_FACING: "Fuer Kund:innen",
  EMPLOYEE_FACING: "Fuer Mitarbeitende",
  EXTERNAL_PUBLIC: "Extern / oeffentlich",
};

const dataCategoryLabels: Record<DataCategory, string> = {
  NONE: "Keine besonderen Daten",
  INTERNAL: "Interne Daten",
  PERSONAL: "Personenbezogene Daten",
  SENSITIVE: "Sensible Daten",
};

const decisionImpactLabels: Record<DecisionImpact, string> = {
  YES: "Ja",
  NO: "Nein",
  UNSURE: "Unsicher",
};

interface UseCaseMetadataSectionProps {
  card: UseCaseCard;
  isEditing: boolean;
  onSave: (updates: Partial<UseCaseCard>) => Promise<void>;
}

export function UseCaseMetadataSection({
  card,
  isEditing,
  onSave,
}: UseCaseMetadataSectionProps) {
  const [editDraft, setEditDraft] = useState({
    purpose: card.purpose,
    responsibleParty: card.responsibility.responsibleParty ?? "",
    organisation: card.organisation ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isCheckingCompliance, setIsCheckingCompliance] = useState(false);
  const { toast } = useToast();

  const toolEntry = card.toolId ? aiRegistry.getById(card.toolId) : null;
  const toolDisplayName =
    card.toolId === "other"
      ? card.toolFreeText ?? "Anderes Tool"
      : toolEntry?.productName ?? card.toolId ?? "Kein Tool";

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

      const { getActiveRegisterId } = await import("@/lib/register-first/register-settings-client");
      const activeRegId = getActiveRegisterId();

      const response = await fetch('/api/tools/public-info-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          registerId: activeRegId,
          useCaseId: card.useCaseId,
          force: true
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Check failed');

      toast({
        title: "Smart Hint bereit",
        description: `Compliance-Daten für ${toolDisplayName} ausgelesen.`,
      });
      // Force reload UI by passing empty updates
      await onSave({});
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: e.message || "Failed to fetch smart hint."
      });
    } finally {
      setIsCheckingCompliance(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Metadaten & EUKI Core</CardTitle>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsWizardOpen(true)}>
            EUKI Assessment {card.governanceAssessment?.core ? "wiederholen" : "starten"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4 pt-2">

        {/* Governance Core Alert / Status */}
        {card.governanceAssessment?.core ? (
          <div className="rounded-md border p-3 bg-secondary/30 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              EUKI Governance Core 1.0
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3 border-t border-border/50 pt-3">
              <div>
                <span className="text-muted-foreground block mb-1">Kategorie:</span>
                <strong className={card.governanceAssessment.core.aiActCategory === "Verboten" ? "text-red-600" : ""}>{card.governanceAssessment.core.aiActCategory}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Aufsicht:</span>
                {card.governanceAssessment.core.oversightDefined ? (
                  "Ja"
                ) : (
                  <ToolkitUpsellButton label="Toolkit aktivieren" variant="link" className="text-red-600 h-auto p-0 font-medium whitespace-normal text-left" />
                )}
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Review:</span>
                {card.governanceAssessment.core.reviewCycleDefined ? (
                  "Ja"
                ) : (
                  <ToolkitUpsellButton label="Toolkit aktivieren" variant="link" className="text-red-600 h-auto p-0 font-medium whitespace-normal text-left" />
                )}
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Doku:</span>
                {card.governanceAssessment.core.documentationLevelDefined ? (
                  "Ja"
                ) : (
                  <ToolkitUpsellButton label="Toolkit aktivieren" variant="link" className="text-red-600 h-auto p-0 font-medium whitespace-normal text-left" />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <strong>Action Required:</strong> Noch nicht auf EU AI Act Konformität geprüft. Bitte das Assessment starten.
          </div>
        )}

        {/* Smart Hint (Perplexity) */}
        {!isEditing && (
          <div className="rounded-md border border-blue-100 p-3 bg-blue-50/50 space-y-2 mt-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-500" /> Smart Hint (Perplexity)
              </h4>
              <Button variant="ghost" size="sm" className="h-6 text-xs text-blue-600 hover:text-blue-800" onClick={runComplianceCheck} disabled={isCheckingCompliance}>
                {isCheckingCompliance ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Search className="w-3 h-3 mr-1" />}
                {card.publicInfo ? "Aktualisieren" : "Prüfen"}
              </Button>
            </div>
            {card.publicInfo ? (
              <div className="text-sm">
                <div className="flex gap-2 flex-wrap mb-2">
                  <Badge variant="outline" className={card.publicInfo.flags.gdprClaim === 'yes' ? 'bg-green-50 text-green-700 border-green-200' : 'text-muted-foreground border-slate-200'}>
                    DSGVO {card.publicInfo.flags.gdprClaim === 'yes' ? '✅' : '❓'}
                  </Badge>
                  <Badge variant="outline" className={card.publicInfo.flags.aiActClaim === 'yes' ? 'bg-green-50 text-green-700 border-green-200' : 'text-muted-foreground border-slate-200'}>
                    AI Act {card.publicInfo.flags.aiActClaim === 'yes' ? '✅' : '❓'}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">{card.publicInfo.summary}</p>
                {card.publicInfo.sources && card.publicInfo.sources.length > 0 && (
                  <div className="flex gap-3 mt-2">
                    {card.publicInfo.sources.slice(0, 2).map((s, i) => (
                      <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> Quelle {i + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Lassen Sie die KI nach öffentlich verfügbaren Compliance-Informationen (z.B. AI Act Statements, Privacy Policies) für dieses Tool suchen.</p>
            )}
          </div>
        )}

        {/* Purpose */}
        <div className="space-y-1.5 pt-2">
          <Label className="text-xs font-medium text-muted-foreground">Zweck</Label>
          {isEditing ? (
            <Textarea
              value={editDraft.purpose}
              onChange={(e) =>
                setEditDraft((prev) => ({ ...prev, purpose: e.target.value }))
              }
              rows={3}
            />
          ) : (
            <p className="text-sm">{card.purpose}</p>
          )}
        </div>

        {/* Tool */}
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

        {/* Usage Contexts */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Verwendungskontext</Label>
          <div className="flex flex-wrap gap-1.5">
            {card.usageContexts.map((ctx) => (
              <Badge key={ctx} variant="outline" className="text-[10px] font-normal">
                {usageContextLabels[ctx]}
              </Badge>
            ))}
            {card.usageContexts.length === 0 && (
              <span className="text-xs text-muted-foreground">Nicht angegeben</span>
            )}
          </div>
        </div>

        {/* Decision Impact */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Beeinflusst Entscheidungen
          </Label>
          <span className="text-sm">{decisionImpactLabels[card.decisionImpact]}</span>
        </div>

        {/* Data Category */}
        {card.dataCategory && (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Datenkategorie
            </Label>
            <Badge variant="outline" className="text-[10px] font-normal">
              {dataCategoryLabels[card.dataCategory] ?? card.dataCategory}
            </Badge>
          </div>
        )}

        {/* Responsibility */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Verantwortlich
          </Label>
          {isEditing ? (
            <Input
              value={editDraft.responsibleParty}
              onChange={(e) =>
                setEditDraft((prev) => ({ ...prev, responsibleParty: e.target.value }))
              }
              placeholder="z. B. Teamleitung Marketing"
            />
          ) : (
            <span className="text-sm">
              {card.responsibility.isCurrentlyResponsible
                ? "Erfasser:in (selbst)"
                : card.responsibility.responsibleParty || "Nicht zugewiesen"}
            </span>
          )}
        </div>

        {/* Organisation */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Organisation
          </Label>
          {isEditing ? (
            <Input
              value={editDraft.organisation}
              onChange={(e) =>
                setEditDraft((prev) => ({ ...prev, organisation: e.target.value }))
              }
              placeholder="Organisationseinheit"
            />
          ) : (
            <span className="text-sm">
              {card.organisation || "Nicht angegeben"}
            </span>
          )}
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-2 gap-4 border-t pt-3">
          <div className="space-y-1">
            <Label className="text-[10px] font-medium text-muted-foreground">
              Erstellt
            </Label>
            <p className="text-xs">{formatDate(card.createdAt)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-medium text-muted-foreground">
              Aktualisiert
            </Label>
            <p className="text-xs">{formatDate(card.updatedAt)}</p>
          </div>
        </div>

        {/* Save button */}
        {isEditing && (
          <div className="flex justify-end border-t pt-3">
            <Button size="sm" onClick={() => void handleSave()} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="mr-1.5 h-3.5 w-3.5" />
              )}
              Speichern
            </Button>
          </div>
        )}
      </CardContent>

      <UseCaseAssessmentWizard
        card={card}
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        onComplete={async () => {
          // Trigger a silent save with empty updates just to reload data
          await onSave({});
        }}
      />
    </Card>
  );
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "unbekannt";
  return date.toLocaleString("de-DE");
}
