"use client";

import React, { useState } from "react";
import { FileText, Loader2, ShieldCheck, Sparkles } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { getFirebaseIdToken } from "@/lib/firebase";
import {
  trackDraftAssistCompleted,
  trackDraftAssistHandoffAccepted,
  trackDraftAssistHandoffDismissed,
  trackDraftAssistStarted,
} from "@/lib/analytics/draft-assist-events";
import {
  resolveDraftAssistContext,
  type ResolveDraftAssistContextOptions,
} from "@/lib/draft-assist/context-resolver";
import {
  parseDraftAssistAssistResult,
  parseDraftAssistInput,
  type DraftAssistAssistResult,
  type DraftAssistContext,
  type DraftAssistHandoff,
  type DraftAssistInput,
} from "@/lib/draft-assist/types";

export const MIN_DRAFT_ASSIST_DESCRIPTION_LENGTH = 50;
export const MAX_DRAFT_ASSIST_DESCRIPTION_LENGTH = 2000;

export type DraftAssistPanelMode = "register" | "guest";

export interface DraftAssistPanelViewProps {
  description: string;
  mode: DraftAssistPanelMode;
  isSubmitting?: boolean;
  error?: string | null;
  result?: DraftAssistAssistResult | null;
  onDescriptionChange?: (value: string) => void;
  onSubmit?: () => void;
  onStartManualCapture?: () => void;
  onAcceptHandoff?: () => void;
  onReset?: () => void;
}

export interface DraftAssistPanelProps {
  mode?: DraftAssistPanelMode;
  workspaceId?: string | null;
  onStartManualCapture?: () => void;
  onAcceptHandoff?: (handoff: DraftAssistHandoff) => void;
  requestDraftAssist?: (input: DraftAssistInput) => Promise<DraftAssistAssistResult>;
  loadContext?: (
    options?: ResolveDraftAssistContextOptions,
  ) => Promise<DraftAssistContext | null>;
}

interface DraftAssistRequestOptions {
  fetchImpl?: typeof fetch;
  getIdToken?: typeof getFirebaseIdToken;
}

function summarizePrimarySystem(
  result: DraftAssistAssistResult | null | undefined,
): string | null {
  const primarySystem = result?.draft.systems[0]?.name?.trim();
  return primarySystem ? primarySystem : null;
}

function resolveDuplicateHintLabel(count: number): string {
  return count === 1 ? "Moeglicher Doppel-Eintrag" : "Moegliche Doppel-Eintraege";
}

function resolveVerdictLabel(
  verdict: DraftAssistAssistResult["verifier"]["verdict"],
): string {
  switch (verdict) {
    case "ready_for_handoff":
      return "Reviewbar";
    case "needs_input":
      return "Rueckfragen offen";
    default:
      return "Vorlaeufig blockiert";
  }
}

function resolveVerdictDescription(
  verdict: DraftAssistAssistResult["verifier"]["verdict"],
): string {
  switch (verdict) {
    case "ready_for_handoff":
      return "Der Erstentwurf ist sauber genug fuer die Uebernahme ins Quick Capture.";
    case "needs_input":
      return "Der Erstentwurf ist nuetzlich, braucht aber noch einige offene Fakten oder eine bewusste menschliche Einordnung.";
    default:
      return "Der Assist hat Widersprueche oder zu wenig belastbare Grundlage gefunden. Manuell weiter ist hier ehrlicher.";
  }
}

export function validateDraftAssistDescription(
  description: string,
): string | null {
  const normalized = description.trim();

  if (normalized.length < MIN_DRAFT_ASSIST_DESCRIPTION_LENGTH) {
    return "Bitte beschreibe den Einsatz in mindestens 2-5 Saetzen oder ca. 50 Zeichen.";
  }

  if (normalized.length > MAX_DRAFT_ASSIST_DESCRIPTION_LENGTH) {
    return "Bitte kuerze die Beschreibung auf maximal 2000 Zeichen.";
  }

  return null;
}

export async function requestDraftAssistResult(
  input: DraftAssistInput,
  options: DraftAssistRequestOptions = {},
): Promise<DraftAssistAssistResult> {
  const parsedInput = parseDraftAssistInput(input);
  const fetchImpl = options.fetchImpl ?? fetch;
  const getIdToken = options.getIdToken ?? getFirebaseIdToken;
  const token = await getIdToken({ required: false });
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetchImpl("/api/draft-assist", {
    method: "POST",
    headers,
    body: JSON.stringify(parsedInput),
  });

  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Entwurf konnte gerade nicht erzeugt werden.");
  }

  return parseDraftAssistAssistResult(payload);
}

export function DraftAssistPanelView({
  description,
  mode,
  isSubmitting = false,
  error = null,
  result = null,
  onDescriptionChange,
  onSubmit,
  onStartManualCapture,
  onAcceptHandoff,
  onReset,
}: DraftAssistPanelViewProps) {
  const verdict = result?.verifier.verdict ?? null;
  const primarySystem = summarizePrimarySystem(result);
  const canAcceptHandoff = Boolean(result?.handoff) && verdict !== "blocked";
  const acceptLabel =
    verdict === "ready_for_handoff"
      ? "In Quick Capture uebernehmen"
      : "Mit Entwurf in Quick Capture weiter";

  return (
    <Card className="mx-auto w-full max-w-3xl border-slate-200 shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <span>Draft Assist</span>
        </div>
        <CardTitle className="text-xl">
          Erstentwurf aus Freitext erzeugen
        </CardTitle>
        <CardDescription>
          Beschreibe den KI-Einsatz in wenigen Saetzen. Wir erzeugen einen reviewbaren Erstentwurf
          und uebergeben ihn erst nach deiner Bestaetigung ins Quick Capture.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Alert>
          <AlertTitle>Noch nichts gespeichert</AlertTitle>
          <AlertDescription>
            Der Assist erstellt nur einen Entwurf. Gespeichert wird erst, wenn du ihn bewusst ins
            Quick Capture uebernimmst. Die menschliche Review bleibt final.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-900" htmlFor="draft-assist-description">
            Kurzbeschreibung
          </label>
          <Textarea
            id="draft-assist-description"
            value={description}
            onChange={(event) => onDescriptionChange?.(event.target.value)}
            placeholder="z. B. Unser Support-Team nutzt ChatGPT, um erste Antwortentwuerfe fuer Kundenanfragen zu formulieren. Vor dem Versand prueft ein Mensch jede Antwort."
            rows={5}
            disabled={isSubmitting}
          />
          <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>2-5 Saetze reichen fuer v1 meist aus.</span>
            <span>{description.trim().length}/{MAX_DRAFT_ASSIST_DESCRIPTION_LENGTH}</span>
          </div>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Assist gerade nicht verfuegbar</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {result ? (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-500" aria-hidden="true" />
                    <span className="text-sm font-medium text-slate-900">
                      {result.draft.title}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{result.draft.purpose}</p>
                </div>
                <Badge
                  variant={verdict === "blocked" ? "destructive" : "secondary"}
                  className="w-fit"
                >
                  {resolveVerdictLabel(result.verifier.verdict)}
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] uppercase tracking-[0.08em] text-slate-500">
                    Owner
                  </div>
                  <div className="mt-1 text-sm text-slate-900">{result.draft.ownerRole}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] uppercase tracking-[0.08em] text-slate-500">
                    System
                  </div>
                  <div className="mt-1 text-sm text-slate-900">
                    {primarySystem ?? "Nicht spezifiziert"}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] uppercase tracking-[0.08em] text-slate-500">
                    Kontext
                  </div>
                  <div className="mt-1 text-sm text-slate-900">
                    {result.draft.usageContexts.join(", ")}
                  </div>
                </div>
              </div>

              <Alert>
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                <AlertTitle>{resolveVerdictLabel(result.verifier.verdict)}</AlertTitle>
                <AlertDescription>
                  {resolveVerdictDescription(result.verifier.verdict)}
                </AlertDescription>
              </Alert>

              {result.questions.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-900">Offene Rueckfragen</div>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {result.questions.map((question) => (
                      <li key={question} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                        {question}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {result.verifier.duplicateHints.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-900">
                    {resolveDuplicateHintLabel(result.verifier.duplicateHints.length)}
                  </div>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {result.verifier.duplicateHints.map((hint) => (
                      <li
                        key={hint}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
                      >
                        {hint}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {result.verifier.reviewTriggers.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-900">Review-Hinweise</div>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {result.verifier.reviewTriggers.map((trigger) => (
                      <li key={trigger} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        {trigger}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="text-xs text-slate-500">
            {mode === "guest"
              ? "Im Gastmodus bleibt die finale Speicherung lokal im Browser."
              : "Im Registermodus uebernimmst du den Entwurf erst in den bestehenden Erfassungsflow."}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {result ? (
              <Button type="button" variant="outline" onClick={onReset}>
                Neu formulieren
              </Button>
            ) : null}
            <Button
              type="button"
              variant={result ? "outline" : "ghost"}
              onClick={onStartManualCapture}
              disabled={isSubmitting}
            >
              Manuell erfassen
            </Button>
            {result && canAcceptHandoff ? (
              <Button type="button" onClick={onAcceptHandoff} disabled={isSubmitting}>
                {acceptLabel}
              </Button>
            ) : null}
            {!result ? (
              <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entwurf wird erzeugt
                  </>
                ) : (
                  "Entwurf erzeugen"
                )}
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DraftAssistPanel({
  mode = "register",
  workspaceId = null,
  onStartManualCapture,
  onAcceptHandoff,
  requestDraftAssist = requestDraftAssistResult,
  loadContext = resolveDraftAssistContext,
}: DraftAssistPanelProps) {
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<DraftAssistAssistResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const validationError = validateDraftAssistDescription(description);
    if (validationError) {
      setError(validationError);
      setResult(null);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const context =
        mode === "register"
          ? await loadContext({
              scopeContext: workspaceId
                ? { kind: "workspace", workspaceId }
                : null,
            })
          : null;

      trackDraftAssistStarted({
        mode,
        hasContext: Boolean(context),
      });

      const nextResult = await requestDraftAssist({
        description: description.trim(),
        context,
      });

      setResult(nextResult);
      trackDraftAssistCompleted({
        mode,
        verdict: nextResult.verifier.verdict,
        questionCount: nextResult.questions.length,
        hasHandoff: Boolean(nextResult.handoff),
        duplicateHintCount: nextResult.verifier.duplicateHints.length,
        reviewTriggerCount: nextResult.verifier.reviewTriggers.length,
        missingFactCount: nextResult.verifier.missingFacts.length,
      });
    } catch (submissionError) {
      setResult(null);
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Entwurf konnte gerade nicht erzeugt werden.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccept = () => {
    if (!result?.handoff) {
      return;
    }

    trackDraftAssistHandoffAccepted({
      mode,
      verdict: result.verifier.verdict,
    });
    onAcceptHandoff?.(result.handoff);
  };

  const handleManualCapture = () => {
    if (result) {
      trackDraftAssistHandoffDismissed({
        mode,
        verdict: result.verifier.verdict,
      });
    }

    onStartManualCapture?.();
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <DraftAssistPanelView
      description={description}
      mode={mode}
      isSubmitting={isSubmitting}
      error={error}
      result={result}
      onDescriptionChange={setDescription}
      onSubmit={() => void handleSubmit()}
      onStartManualCapture={handleManualCapture}
      onAcceptHandoff={handleAccept}
      onReset={handleReset}
    />
  );
}
