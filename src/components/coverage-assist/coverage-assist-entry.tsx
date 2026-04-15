'use client';

import { useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { Sparkles } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import type { CoverageAssistSeedSuggestion } from '@/lib/coverage-assist/types';

interface CoverageAssistEntryProps {
  toolName: string;
  matchedHost?: string | null;
  suggestions: CoverageAssistSeedSuggestion[];
  onSelectSuggestion: (suggestion: CoverageAssistSeedSuggestion) => void;
  onSubmitCustomPurpose: (purpose: string) => void;
  onContinueWithoutSuggestion: () => void;
}

function getCoverageAssistCopy(locale: string) {
  if (locale === 'de') {
    return {
      label: 'Coverage Assist',
      title: 'Wobei unterstützt dich {toolName} hier gerade?',
      helperWithSuggestions:
        'Wähle einen typischen Startpunkt oder formuliere den Zweck selbst. Gespeichert wird erst nach deiner Bestätigung im Quick Capture.',
      helperWithoutSuggestions:
        'Für dieses Tool gibt es noch keine kuratierten Vorschläge. Du kannst den Zweck kurz selbst formulieren oder direkt mit Tool-Vorauswahl fortfahren.',
      alertTitle: 'Nichts wurde automatisch gespeichert',
      alertDescription:
        'Dieses Gerät hat lokal erkannt, dass du ein bekanntes KI-Tool nutzt. Nichts wurde automatisch gespeichert. Du entscheidest, ob und wie ein Einsatzfall angelegt wird.',
      localMatch: 'Lokal erkannt',
      customTitle: 'Zweck lieber selbst formulieren?',
      customDescription:
        'Sinnvoll, wenn keiner der Vorschläge genau passt.',
      customToggle: 'Selbst formulieren',
      placeholder:
        'z. B. E-Mails schneller vorformulieren oder Inhalte für Termine zusammenfassen',
      continueWithCustom: 'Mit eigener Formulierung weiter',
      continueWithout: 'Ohne Vorschlag fortfahren',
    } as const;
  }

  return {
    label: 'Coverage Assist',
    title: 'What is {toolName} helping you with here right now?',
    helperWithSuggestions:
      'Choose a typical starting point or phrase the purpose yourself. Nothing is saved until you confirm it in Quick Capture.',
    helperWithoutSuggestions:
      'There are no curated suggestions for this tool yet. You can phrase the purpose yourself or continue directly with the selected tool.',
    alertTitle: 'Nothing was saved automatically',
    alertDescription:
      'This device detected locally that you are using a known AI tool. Nothing was saved automatically. You decide whether and how a use case should be created.',
    localMatch: 'Detected locally',
    customTitle: 'Prefer to phrase the purpose yourself?',
    customDescription:
      'Useful when none of the suggestions fits exactly.',
    customToggle: 'Write it myself',
    placeholder:
      'e.g. draft emails faster or summarise material for upcoming meetings',
    continueWithCustom: 'Continue with custom wording',
    continueWithout: 'Continue without suggestion',
  } as const;
}

export function CoverageAssistEntry({
  toolName,
  matchedHost,
  suggestions,
  onSelectSuggestion,
  onSubmitCustomPurpose,
  onContinueWithoutSuggestion,
}: CoverageAssistEntryProps) {
  const locale = useLocale();
  const copy = useMemo(() => getCoverageAssistCopy(locale), [locale]);
  const [showCustomComposer, setShowCustomComposer] = useState(
    suggestions.length === 0,
  );
  const [customPurpose, setCustomPurpose] = useState('');

  const helperCopy = useMemo(() => {
    if (suggestions.length === 0) {
      return copy.helperWithoutSuggestions;
    }

    return copy.helperWithSuggestions;
  }, [copy.helperWithSuggestions, copy.helperWithoutSuggestions, suggestions.length]);

  return (
    <Card className="mx-auto w-full max-w-3xl border-slate-200 shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <span>{copy.label}</span>
        </div>
        <CardTitle className="text-xl">
          {copy.title.replace('{toolName}', toolName)}
        </CardTitle>
        <CardDescription>{helperCopy}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Alert>
          <AlertTitle>{copy.alertTitle}</AlertTitle>
          <AlertDescription>{copy.alertDescription}</AlertDescription>
        </Alert>

        {matchedHost ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <Badge variant="outline">{copy.localMatch}</Badge>
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
                {copy.customTitle}
              </div>
              <div className="text-sm text-slate-600">
                {copy.customDescription}
              </div>
            </div>
            <Button
              type="button"
              variant={showCustomComposer ? 'secondary' : 'outline'}
              onClick={() => setShowCustomComposer((current) => !current)}
            >
              {copy.customToggle}
            </Button>
          </div>

          {showCustomComposer ? (
            <div className="mt-4 space-y-3">
              <Textarea
                value={customPurpose}
                onChange={(event) => setCustomPurpose(event.target.value)}
                placeholder={copy.placeholder}
                rows={3}
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  onClick={() => onSubmitCustomPurpose(customPurpose)}
                  disabled={customPurpose.trim().length < 3}
                >
                  {copy.continueWithCustom}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onContinueWithoutSuggestion}
                >
                  {copy.continueWithout}
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
                {copy.continueWithout}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
