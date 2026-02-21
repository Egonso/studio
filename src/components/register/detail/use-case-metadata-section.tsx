"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Metadaten</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Purpose */}
        <div className="space-y-1.5">
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
    </Card>
  );
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "unbekannt";
  return date.toLocaleString("de-DE");
}
