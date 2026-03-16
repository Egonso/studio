"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { CoverageAssistSeedSuggestion } from "@/lib/coverage-assist/types";

interface CoverageAssistEntryProps {
  toolName: string;
  matchedHost?: string | null;
  suggestions: CoverageAssistSeedSuggestion[];
  onSelectSuggestion: (suggestion: CoverageAssistSeedSuggestion) => void;
  onSubmitCustomPurpose: (purpose: string) => void;
  onContinueWithoutSuggestion: () => void;
}

export function CoverageAssistEntry({
  toolName,
  matchedHost,
  suggestions,
  onSelectSuggestion,
  onSubmitCustomPurpose,
  onContinueWithoutSuggestion,
}: CoverageAssistEntryProps) {
  const [showCustomComposer, setShowCustomComposer] = useState(
    suggestions.length === 0
  );
  const [customPurpose, setCustomPurpose] = useState("");

  const helperCopy = useMemo(() => {
    if (suggestions.length === 0) {
      return "Fuer dieses Tool gibt es noch keine kuratierten Vorschlaege. Sie koennen den Zweck kurz selbst formulieren oder direkt mit Tool-Vorauswahl fortfahren.";
    }

    return "Waehlen Sie einen typischen Startpunkt oder formulieren Sie den Zweck selbst. Gespeichert wird erst nach Ihrer Bestaetigung im Quick Capture.";
  }, [suggestions.length]);

  return (
    <Card className="mx-auto w-full max-w-3xl border-slate-200 shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <span>Coverage Assist</span>
        </div>
        <CardTitle className="text-xl">
          Wobei unterstuetzt dich {toolName} hier gerade?
        </CardTitle>
        <CardDescription>{helperCopy}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Alert>
          <AlertTitle>Nichts wurde automatisch gespeichert</AlertTitle>
          <AlertDescription>
            Dieses Geraet hat lokal erkannt, dass Sie ein bekanntes KI-Tool nutzen.
            Nichts wurde automatisch gespeichert. Sie entscheiden, ob und wie ein
            Einsatzfall angelegt wird.
          </AlertDescription>
        </Alert>

        {matchedHost ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <Badge variant="outline">Lokal erkannt</Badge>
            <span>{matchedHost}</span>
          </div>
        ) : null}

        {suggestions.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.suggestionId}
                type="button"
                className="rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
                onClick={() => onSelectSuggestion(suggestion)}
              >
                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-900">
                    {suggestion.label}
                  </div>
                  <div className="text-sm text-slate-700">
                    {suggestion.purposeDraft}
                  </div>
                  {suggestion.descriptionHint ? (
                    <div className="text-xs text-slate-500">
                      {suggestion.descriptionHint}
                    </div>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        ) : null}

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium text-slate-900">
                Zweck lieber selbst formulieren?
              </div>
              <div className="text-sm text-slate-600">
                Sinnvoll, wenn keiner der Vorschlaege genau passt.
              </div>
            </div>
            <Button
              type="button"
              variant={showCustomComposer ? "secondary" : "outline"}
              onClick={() => setShowCustomComposer((current) => !current)}
            >
              Selbst formulieren
            </Button>
          </div>

          {showCustomComposer ? (
            <div className="mt-4 space-y-3">
              <Textarea
                value={customPurpose}
                onChange={(event) => setCustomPurpose(event.target.value)}
                placeholder="z. B. E-Mails schneller vorformulieren oder Inhalte fuer Termine zusammenfassen"
                rows={3}
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  onClick={() => onSubmitCustomPurpose(customPurpose)}
                  disabled={customPurpose.trim().length < 3}
                >
                  Mit eigener Formulierung weiter
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onContinueWithoutSuggestion}
                >
                  Ohne Vorschlag fortfahren
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={onContinueWithoutSuggestion}
              >
                Ohne Vorschlag fortfahren
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
