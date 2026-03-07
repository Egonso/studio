"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UseCaseCard } from "@/lib/register-first";
import { RegisterStatusBadge } from "./status-badge";

interface UseCasePassCardProps {
  card: UseCaseCard;
  /** Optional resolved tool name (from registry lookup) */
  resolvedToolName?: string | null;
}

const dataCategoryLabels: Record<string, string> = {
  NONE: "Keine besonderen Daten",
  INTERNAL: "Interne Daten",
  PERSONAL: "Personenbezogene Daten",
  SENSITIVE: "Sensible Daten",
};

const dataCategoryColors: Record<string, string> = {
  NONE: "",
  INTERNAL: "",
  PERSONAL: "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-100/80",
  SENSITIVE: "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-100/80",
};

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) {
    return null;
  }

  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <span className="shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-right text-sm">{value}</span>
    </div>
  );
}

export function UseCasePassCard({ card, resolvedToolName }: UseCasePassCardProps) {
  const isV11 = card.cardVersion === "1.1";
  const toolDisplay = card.toolId === "other"
    ? card.toolFreeText ?? "Anderes Tool"
    : resolvedToolName ?? card.toolId ?? null;

  const responsibleDisplay = card.responsibility.isCurrentlyResponsible
    ? "Erfasser (selbst)"
    : card.responsibility.responsibleParty ?? "Nicht angegeben";

  const contextDisplay = card.usageContexts.join(", ");

  return (
    <Card className="w-full max-w-md border-2">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base leading-tight">{card.purpose}</CardTitle>
            {isV11 && card.globalUseCaseId && (
              <CardDescription className="font-mono text-xs">
                {card.globalUseCaseId}
              </CardDescription>
            )}
          </div>
          <RegisterStatusBadge status={card.status} />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-xs">
            v{card.cardVersion}
          </Badge>
          {isV11 && card.dataCategory && (
            <Badge
              variant="outline"
              className={dataCategoryColors[card.dataCategory] ?? ""}
            >
              {dataCategoryLabels[card.dataCategory] ?? card.dataCategory}
            </Badge>
          )}
          {isV11 && card.isPublicVisible && (
            <Badge variant="secondary" className="text-xs">
              Oeffentlich
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="divide-y text-sm">
        {isV11 && toolDisplay && (
          <InfoRow label="Tool" value={toolDisplay} />
        )}
        <InfoRow label="Wirkungsbereich" value={contextDisplay} />
        <InfoRow label="Owner-Rolle" value={responsibleDisplay} />
        {card.decisionImpact && (
          <InfoRow
            label="Entscheidungsrelevanz"
            value={
              card.decisionImpact === "YES"
                ? "Ja"
                : card.decisionImpact === "NO"
                  ? "Nein"
                  : "Unsicher"
            }
          />
        )}
        {isV11 && card.publicHashId && (
          <InfoRow label="Public Hash" value={card.publicHashId} />
        )}
        <InfoRow label="Erstellt" value={new Date(card.createdAt).toLocaleDateString("de-DE")} />
      </CardContent>
    </Card>
  );
}
