"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDashed,
  FileSearch,
  PencilLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  getRiskClassDisplayLabel,
  getRiskClassShortLabel,
  type CanonicalAiActRiskClass,
  type RiskSuggestionResult,
} from "@/lib/register-first";
import { cn } from "@/lib/utils";

interface RiskClassAssistProps {
  currentRiskClass?: CanonicalAiActRiskClass | null;
  currentDisplayLabel?: string | null;
  isHumanConfirmed?: boolean;
  suggestion?: RiskSuggestionResult | null;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onAdoptSuggestion?: () => void;
  onStartManualSelection?: () => void;
  onOpenReview?: () => void;
  className?: string;
}

const signalStrengthLabel: Record<
  RiskSuggestionResult["signalStrength"],
  string
> = {
  low: "wenige Signale",
  medium: "mehrere Signale",
  high: "starke Signale",
};

const signalStrengthClassName: Record<
  RiskSuggestionResult["signalStrength"],
  string
> = {
  low: "text-slate-600",
  medium: "text-slate-600",
  high: "text-slate-700",
};

function resolveCurrentLabel(
  currentRiskClass: CanonicalAiActRiskClass | null | undefined,
  currentDisplayLabel: string | null | undefined,
): string | null {
  if (typeof currentDisplayLabel === "string" && currentDisplayLabel.trim()) {
    return currentDisplayLabel.trim();
  }

  if (!currentRiskClass || currentRiskClass === "UNASSESSED") {
    return null;
  }

  return getRiskClassShortLabel(currentRiskClass);
}

export function RiskClassAssist({
  currentRiskClass = null,
  currentDisplayLabel = null,
  isHumanConfirmed = false,
  suggestion = null,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  onAdoptSuggestion,
  onStartManualSelection,
  onOpenReview,
  className,
}: RiskClassAssistProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isControlled = typeof expanded === "boolean";
  const isOpen = isControlled ? expanded : internalExpanded;

  const handleExpandedChange = (nextValue: boolean) => {
    if (!isControlled) {
      setInternalExpanded(nextValue);
    }
    onExpandedChange?.(nextValue);
  };

  const currentLabel = resolveCurrentLabel(currentRiskClass, currentDisplayLabel);
  const statusLabel = currentLabel
    ? isHumanConfirmed
      ? `Menschlich bestaetigt: ${currentLabel}`
      : currentLabel
    : "Einstufung offen";

  const suggestedLabel = suggestion
    ? getRiskClassDisplayLabel(suggestion.suggestedRiskClass)
    : null;
  const canAdoptSuggestion = Boolean(
    suggestion && suggestion.suggestedRiskClass !== "UNASSESSED",
  );

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={handleExpandedChange}
      className={cn(
        "rounded-lg border border-slate-200 bg-slate-50/70",
        className,
      )}
    >
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div className="min-w-0 space-y-2">
          <div className="flex items-start gap-2">
            {currentLabel ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-slate-700" />
            ) : (
              <CircleDashed className="mt-0.5 h-4 w-4 text-slate-500" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-950">{statusLabel}</p>
              <p className="text-sm text-slate-600">
                {suggestion
                  ? "Ein begruendeter Vorschlag ist verfuegbar. Die finale Einstufung bleibt menschlich."
                  : "Noch kein Vorschlag sichtbar. Die Einstufung kann manuell oder spaeter mit Assistenz erfolgen."}
              </p>
            </div>
          </div>

          <div className="space-y-1 pl-6 text-xs text-slate-600">
            {suggestion && suggestedLabel && (
              <p>Vorschlag: {suggestedLabel}</p>
            )}
            {suggestion && (
              <p className={cn(signalStrengthClassName[suggestion.signalStrength])}>
                Signalstaerke: {signalStrengthLabel[suggestion.signalStrength]}
              </p>
            )}
            {suggestion?.reviewRecommended && (
              <p>Kurze Pruefung empfohlen</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="text-slate-700">
              {isOpen ? "Vorschlag ausblenden" : "Vorschlag ansehen"}
              {isOpen ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </CollapsibleTrigger>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-slate-700"
            onClick={onOpenReview}
          >
            Kurze Pruefung starten
          </Button>
        </div>
      </div>

      <CollapsibleContent className="border-t border-slate-200 px-4 py-4 sm:px-5">
        <div className="space-y-4">
          <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-700">Richtung</p>
                <p className="text-base font-semibold text-slate-950">
                  {suggestedLabel
                    ? `Vorschlag: ${suggestedLabel}`
                    : "Noch kein Vorschlag verfuegbar"}
                </p>
                {suggestion ? (
                  <p
                    className={cn(
                      "text-sm text-slate-600",
                      signalStrengthClassName[suggestion.signalStrength],
                    )}
                  >
                    Signalstaerke: {signalStrengthLabel[suggestion.signalStrength]}.{" "}
                    {suggestion.reviewRecommended
                      ? "Kurze Pruefung empfohlen."
                      : "Kurze Pruefung optional."}
                  </p>
                ) : null}
              </div>
            </div>

            <p className="mt-3 text-sm text-slate-600">
              Nur Vorschlag. Keine automatische Einstufung.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
              <div className="flex items-center gap-2">
                <FileSearch className="h-4 w-4 text-slate-600" />
                <p className="text-sm font-medium text-slate-800">
                  Warum diese Richtung naheliegt
                </p>
              </div>
              {suggestion?.reasons.length ? (
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {suggestion.reasons.map((reason) => (
                    <li key={reason} className="leading-6">
                      {reason}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-600">
                  Noch keine gruendende Signalbasis sichtbar.
                </p>
              )}
            </div>

            <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
              <div className="flex items-center gap-2">
                <PencilLine className="h-4 w-4 text-slate-600" />
                <p className="text-sm font-medium text-slate-800">
                  Welche Frage noch offen ist
                </p>
              </div>
              {suggestion?.openQuestions.length ? (
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {suggestion.openQuestions.map((question) => (
                    <li key={question} className="leading-6">
                      {question}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-600">
                  Aktuell sind keine offenen Rueckfragen markiert.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              size="sm"
              onClick={onAdoptSuggestion}
              disabled={!canAdoptSuggestion}
            >
              Als Entwurf uebernehmen
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onStartManualSelection}
            >
              Selbst einstufen
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-slate-700"
              onClick={onOpenReview}
            >
              Kurze Pruefung starten
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
