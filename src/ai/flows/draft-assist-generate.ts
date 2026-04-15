'use server';

import { z } from 'zod';

import { ai } from '@/ai/genkit';

import { buildDraftAssistCaptureHandoff } from '@/lib/draft-assist/build-capture-handoff';
import {
  DraftAssistAssistResultSchema,
  normalizeDraftAssistResult,
  normalizeDraftAssistAssistResult,
  parseDraftAssistInput,
  DraftAssistInputSchema,
  DraftAssistResultSchema,
  type DraftAssistAssistResult,
  type DraftAssistInput,
  type DraftAssistResult,
} from '@/lib/draft-assist/types';
import { formatDraftAssistContext } from '@/lib/draft-assist/context-resolver';
import { verifyDraftAssistArtifact } from '@/lib/draft-assist/artifact-verifier';

const DraftAssistPromptInputSchema = z.object({
  description: z.string().trim().min(50).max(2000),
  contextSummary: z.string().trim().min(1).max(5000),
});

type DraftAssistPromptInput = z.infer<typeof DraftAssistPromptInputSchema>;

export type DraftAssistPromptRunner = (
  input: DraftAssistPromptInput,
) => Promise<DraftAssistResult>;

function buildPromptInput(input: DraftAssistInput): DraftAssistPromptInput {
  return DraftAssistPromptInputSchema.parse({
    description: input.description,
    contextSummary:
      formatDraftAssistContext(input.context) ??
      'Kein zusaetzlicher Register-Kontext vorhanden.',
  });
}

const draftAssistGeneratePrompt = ai.definePrompt({
  name: 'draftAssistGeneratePromptV1',
  input: { schema: DraftAssistPromptInputSchema },
  output: { schema: DraftAssistResultSchema },
  prompt: `Du bist Draft Assist fuer KI-Register.

Deine Aufgabe:
Erzeuge aus einer kurzen Beschreibung einen knappen, reviewbaren, manifest-nahen Erstentwurf fuer einen KI-Use-Case.

Wichtige Leitplanken:
- Nutze den Use Case als Haupteinheit, nicht das Tool.
- Tools sind nur System-/Risikokontext, nicht der eigentliche Governance-Gegenstand.
- Schreibe knapp, konkret und reviewbar.
- Erfinde keine fehlenden Governance-Fakten.
- Setze keine finale Risikoklasse.
- Setze keinen finalen Registerstatus.
- Gib keine Felder fuer proof, governanceAssessment, status, reviews oder andere finale Governance-Entscheidungen aus.
- Wenn etwas unklar bleibt, markiere es offen in meta.missingFacts statt es frei zu erfinden.
- meta.missingFacts darf hoechstens 3 wirklich blockierende Rueckfragen enthalten.
- meta.assumptions darf hoechstens 3 vorsichtige Annahmen enthalten.
- Wenn die verantwortliche Rolle aus Team oder Fachbereich ableitbar ist, leite sie ab:
  Support-Team -> Support Lead
  Marketing-Team -> Marketing Lead
  Recruiting / Recruiter -> People Lead oder Recruiting Lead
  Einkauf / Procurement -> Procurement Lead
  IT -> IT Lead
  Finance -> Finance Lead
- Wenn die verantwortliche Rolle nicht ableitbar ist, nutze "Unklar / fachliche Leitung".
- Wenn ein konkretes System genannt ist, uebernimm diesen Namen.
- Wenn eine interne Eigenentwicklung genannt ist, uebernimm genau diese Bezeichnung.
- Wenn kein konkretes System genannt ist, nutze "Nicht spezifiziertes KI-System".
- systems muss in Ausfuehrungsreihenfolge sortiert sein.
- workflow nur setzen, wenn mehrere Schritte oder Systeme klar erkennbar sind.
- providerType nur setzen, wenn es klar ist. Verwende dann einen dieser Werte:
  TOOL, API, MODEL, CONNECTOR, INTERNAL, OTHER
- usageContexts darf nur enthalten:
  INTERNAL_ONLY, EMPLOYEES, CUSTOMERS, APPLICANTS, PUBLIC
- INTERNAL_ONLY bedeutet: Ergebnis bleibt intern und wirkt nicht direkt nach aussen.
- EMPLOYEES bedeutet: Mitarbeitende sind vom Ergebnis direkt betroffen, nicht nur Nutzer des Tools.
- CUSTOMERS bedeutet: Kunden sehen oder erhalten die AI-Ausgabe direkt.
- APPLICANTS bedeutet: Bewerber werden bewertet, gerankt, kontaktiert oder disponiert.
- PUBLIC bedeutet: Oeffentlichkeit sieht die AI-Ausgabe direkt.
- decisionInfluence bedeutet:
  ASSISTANCE = reine Assistenz
  PREPARATION = Vorbereitung fuer menschliche Entscheidung
  AUTOMATED = Ergebnis wirkt ohne sinnvollen menschlichen Zwischenschritt direkt
- Nutze confidence=medium, wenn Use Case, System und Kontext grob klar sind.
- Nutze confidence=low nur, wenn zentrale Fakten offen bleiben.

Umgang mit Register-Kontext:
- Der Kontext ist optional, read-only und moeglicherweise unvollstaendig.
- Nutze ihn nur als schwaches Organisationssignal fuer Terminologie, Owner-Rollen, bestehende Prozesse oder moegliche Aehnlichkeiten.
- Uebernimm aus dem Kontext keine Governance-Fakten automatisch auf den neuen Use Case.
- Policy-Titel im Kontext sind nur Hinweise, kein Nachweis der Abdeckung.
- Wenn bestehende Use Cases aehnlich klingen, formuliere den neuen Draft trotzdem nur aus der vorliegenden Beschreibung.

Register-Kontext:
{{{contextSummary}}}

Beschreibung:
{{{description}}}

Gib nur JSON gemaess Schema zurueck:
- draft: manifest-naher Erstentwurf
- meta: confidence, missingFacts, assumptions`,
});

async function runDefaultPrompt(
  input: DraftAssistPromptInput,
): Promise<DraftAssistResult> {
  const result = await draftAssistGeneratePrompt(input);
  return result.output!;
}

export async function generateDraftAssistDraftWith(
  input: DraftAssistInput,
  runPrompt: DraftAssistPromptRunner,
): Promise<DraftAssistResult> {
  const parsedInput = parseDraftAssistInput(input);
  const promptInput = buildPromptInput(parsedInput);
  const rawResult = await runPrompt(promptInput);
  return normalizeDraftAssistResult(rawResult);
}

export async function generateDraftAssistWith(
  input: DraftAssistInput,
  runPrompt: DraftAssistPromptRunner,
): Promise<DraftAssistAssistResult> {
  const parsedInput = parseDraftAssistInput(input);
  const draftResult = await generateDraftAssistDraftWith(parsedInput, runPrompt);
  const verifier = verifyDraftAssistArtifact({
    draft: draftResult.draft,
    meta: draftResult.meta,
    context: parsedInput.context ?? null,
  });

  let handoff = null;
  if (verifier.captureMappingValid) {
    handoff = buildDraftAssistCaptureHandoff(draftResult.draft);
  }

  return normalizeDraftAssistAssistResult({
    draft: draftResult.draft,
    meta: draftResult.meta,
    verifier,
    questions: verifier.openQuestions,
    handoff,
  });
}

const draftAssistGenerateFlow = ai.defineFlow(
  {
    name: 'draftAssistGenerateFlow',
    inputSchema: DraftAssistInputSchema,
    outputSchema: DraftAssistAssistResultSchema,
  },
  async (input) => generateDraftAssistWith(input, runDefaultPrompt),
);

export async function generateDraftAssist(
  input: DraftAssistInput,
): Promise<DraftAssistAssistResult> {
  return draftAssistGenerateFlow(input);
}
