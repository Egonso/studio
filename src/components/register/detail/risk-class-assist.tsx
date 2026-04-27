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
  locale?: string;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onAdoptSuggestion?: () => void;
  onStartManualSelection?: () => void;
  onOpenReview?: () => void;
  className?: string;
}

const signalStrengthLabelDe: Record<
  RiskSuggestionResult["signalStrength"],
  string
> = {
  low: "wenige Signale",
  medium: "mehrere Signale",
  high: "starke Signale",
};

const signalStrengthLabelEn: Record<
  RiskSuggestionResult["signalStrength"],
  string
> = {
  low: "few signals",
  medium: "several signals",
  high: "strong signals",
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
  locale?: string,
): string | null {
  if (typeof currentDisplayLabel === "string" && currentDisplayLabel.trim()) {
    return currentDisplayLabel.trim();
  }

  if (!currentRiskClass || currentRiskClass === "UNASSESSED") {
    return null;
  }

  return getRiskClassShortLabel(currentRiskClass, locale);
}

export function RiskClassAssist({
  currentRiskClass = null,
  currentDisplayLabel = null,
  isHumanConfirmed = false,
  suggestion = null,
  locale,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  onAdoptSuggestion,
  onStartManualSelection,
  onOpenReview,
  className,
}: RiskClassAssistProps) {
  const isGerman = !(locale?.toLowerCase().startsWith("en") ?? false);
  const signalStrengthLabel = isGerman
    ? signalStrengthLabelDe
    : signalStrengthLabelEn;
  const copy = {
    humanConfirmed: isGerman ? "Menschlich bestaetigt" : "Human confirmed",
    openClassification: isGerman ? "Einstufung offen" : "Classification open",
    suggestionAvailable: isGerman
      ? "Ein begruendeter Vorschlag ist verfuegbar. Die finale Einstufung bleibt menschlich."
      : "A reasoned suggestion is available. Final classification remains human.",
    noSuggestion: isGerman
      ? "Noch kein Vorschlag sichtbar. Die Einstufung kann manuell oder spaeter mit Assistenz erfolgen."
      : "No suggestion visible yet. Classification can be completed manually or later with assistance.",
    suggestion: isGerman ? "Vorschlag" : "Suggestion",
    signalStrength: isGerman ? "Signalstaerke" : "Signal strength",
    shortReviewRecommended: isGerman
      ? "Kurze Pruefung empfohlen"
      : "Short review recommended",
    hideSuggestion: isGerman ? "Vorschlag ausblenden" : "Hide suggestion",
    showSuggestion: isGerman ? "Vorschlag ansehen" : "View suggestion",
    startReview: isGerman ? "Kurze Pruefung starten" : "Start short review",
    direction: isGerman ? "Richtung" : "Direction",
    noSuggestionAvailable: isGerman
      ? "Noch kein Vorschlag verfuegbar"
      : "No suggestion available yet",
    shortReviewOptional: isGerman
      ? "Kurze Pruefung optional."
      : "Short review optional.",
    proposalOnly: isGerman
      ? "Nur Vorschlag. Keine automatische Einstufung."
      : "Suggestion only. No automatic classification.",
    whyDirection: isGerman
      ? "Warum diese Richtung naheliegt"
      : "Why this direction is plausible",
    noSignalBasis: isGerman
      ? "Noch keine gruendende Signalbasis sichtbar."
      : "No supporting signal basis visible yet.",
    openQuestion: isGerman
      ? "Welche Frage noch offen ist"
      : "Which question is still open",
    noOpenQuestions: isGerman
      ? "Aktuell sind keine offenen Rueckfragen markiert."
      : "No open follow-up questions are currently marked.",
    adoptDraft: isGerman ? "Als Entwurf uebernehmen" : "Adopt as draft",
    classifySelf: isGerman ? "Selbst einstufen" : "Classify manually",
  };
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isControlled = typeof expanded === "boolean";
  const isOpen = isControlled ? expanded : internalExpanded;

  const handleExpandedChange = (nextValue: boolean) => {
    if (!isControlled) {
      setInternalExpanded(nextValue);
    }
    onExpandedChange?.(nextValue);
  };

  const currentLabel = resolveCurrentLabel(
    currentRiskClass,
    currentDisplayLabel,
    locale,
  );
  const statusLabel = currentLabel
    ? isHumanConfirmed
      ? `${copy.humanConfirmed}: ${currentLabel}`
      : currentLabel
    : copy.openClassification;

  const suggestedLabel = suggestion
    ? getRiskClassDisplayLabel(suggestion.suggestedRiskClass, locale)
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
                  ? copy.suggestionAvailable
                  : copy.noSuggestion}
              </p>
            </div>
          </div>

          <div className="space-y-1 pl-6 text-xs text-slate-600">
            {suggestion && suggestedLabel && (
              <p>
                {copy.suggestion}: {suggestedLabel}
              </p>
            )}
            {suggestion && (
              <p className={cn(signalStrengthClassName[suggestion.signalStrength])}>
                {copy.signalStrength}: {signalStrengthLabel[suggestion.signalStrength]}
              </p>
            )}
            {suggestion?.reviewRecommended && (
              <p>{copy.shortReviewRecommended}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="text-slate-700">
              {isOpen ? copy.hideSuggestion : copy.showSuggestion}
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
            {copy.startReview}
          </Button>
        </div>
      </div>

      <CollapsibleContent className="border-t border-slate-200 px-4 py-4 sm:px-5">
        <div className="space-y-4">
          <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-700">
                  {copy.direction}
                </p>
                <p className="text-base font-semibold text-slate-950">
                  {suggestedLabel
                    ? `${copy.suggestion}: ${suggestedLabel}`
                    : copy.noSuggestionAvailable}
                </p>
                {suggestion ? (
                  <p
                    className={cn(
                      "text-sm text-slate-600",
                      signalStrengthClassName[suggestion.signalStrength],
                    )}
                  >
                    {copy.signalStrength}: {signalStrengthLabel[suggestion.signalStrength]}.{" "}
                    {suggestion.reviewRecommended
                      ? `${copy.shortReviewRecommended}.`
                      : copy.shortReviewOptional}
                  </p>
                ) : null}
              </div>
            </div>

            <p className="mt-3 text-sm text-slate-600">
              {copy.proposalOnly}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
              <div className="flex items-center gap-2">
                <FileSearch className="h-4 w-4 text-slate-600" />
                <p className="text-sm font-medium text-slate-800">
                  {copy.whyDirection}
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
                  {copy.noSignalBasis}
                </p>
              )}
            </div>

            <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
              <div className="flex items-center gap-2">
                <PencilLine className="h-4 w-4 text-slate-600" />
                <p className="text-sm font-medium text-slate-800">
                  {copy.openQuestion}
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
                  {copy.noOpenQuestions}
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
              {copy.adoptDraft}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onStartManualSelection}
            >
              {copy.classifySelf}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-slate-700"
              onClick={onOpenReview}
            >
              {copy.startReview}
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
