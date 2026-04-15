import { z } from "genkit";

import { ai } from "@/ai/genkit";

const documentationTypeSchema = z.enum(["application", "process", "workflow"]);
const usageContextSchema = z.enum([
  "INTERNAL_ONLY",
  "EMPLOYEES",
  "CUSTOMERS",
  "APPLICANTS",
  "PUBLIC",
]);
const decisionInfluenceSchema = z.enum([
  "ASSISTANCE",
  "PREPARATION",
  "AUTOMATED",
]);
const dataCategorySchema = z.enum([
  "NO_PERSONAL_DATA",
  "PERSONAL_DATA",
  "SPECIAL_PERSONAL",
  "INTERNAL_CONFIDENTIAL",
  "PUBLIC_DATA",
  "HEALTH_DATA",
  "BIOMETRIC_DATA",
  "POLITICAL_RELIGIOUS",
  "OTHER_SENSITIVE",
]);
const connectionModeSchema = z.enum([
  "MANUAL_SEQUENCE",
  "SEMI_AUTOMATED",
  "FULLY_AUTOMATED",
]);

export const DraftAssistSpikeInputSchema = z.object({
  description: z.string().min(50).max(2000),
});

export const DraftAssistSpikeDraftSchema = z.object({
  documentationType: documentationTypeSchema,
  title: z.string().min(3).max(300),
  summary: z.string().min(1).max(300).optional(),
  purpose: z.string().min(3).max(500),
  ownerRole: z.string().min(2).max(120),
  isCurrentlyResponsible: z.boolean().optional(),
  responsibleParty: z.string().min(1).max(120).optional().nullable(),
  usageContexts: z.array(usageContextSchema).min(1).max(8),
  decisionInfluence: decisionInfluenceSchema.optional(),
  dataCategories: z.array(dataCategorySchema).max(13).optional(),
  systems: z
    .array(
      z.object({
        position: z.number().int().min(1).max(20),
        name: z.string().min(1).max(300),
        providerType: z.string().min(1).max(80).optional(),
      }),
    )
    .min(1)
    .max(8),
  workflow: z
    .object({
      connectionMode: connectionModeSchema.optional(),
      summary: z.string().min(1).max(300).optional(),
    })
    .optional(),
  triggers: z.array(z.string().min(1).max(200)).max(6).optional(),
  steps: z.array(z.string().min(1).max(300)).max(8).optional(),
  humansInLoop: z.array(z.string().min(1).max(300)).max(6).optional(),
  risks: z.array(z.string().min(1).max(300)).max(6).optional(),
  controls: z.array(z.string().min(1).max(300)).max(6).optional(),
  artifacts: z.array(z.string().min(1).max(200)).max(6).optional(),
  tags: z.array(z.string().min(1).max(60)).max(8).optional(),
  missingFacts: z.array(z.string().min(1).max(200)).max(3).optional(),
  assumptions: z.array(z.string().min(1).max(200)).max(3).optional(),
  confidence: z.enum(["low", "medium", "high"]),
});

export type DraftAssistSpikeDraft = z.infer<typeof DraftAssistSpikeDraftSchema>;

function trimToLength(value: string | undefined, maxLength: number): string | undefined {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd() + "…";
}

function normalizeDraft(
  draft: DraftAssistSpikeDraft,
): DraftAssistSpikeDraft {
  return {
    ...draft,
    title: trimToLength(draft.title, 300) ?? draft.title,
    summary: trimToLength(draft.summary, 300),
    purpose: trimToLength(draft.purpose, 500) ?? draft.purpose,
    ownerRole: trimToLength(draft.ownerRole, 120) ?? draft.ownerRole,
    missingFacts: draft.missingFacts?.map((entry) => trimToLength(entry, 200) ?? entry),
    assumptions: draft.assumptions?.map((entry) => trimToLength(entry, 200) ?? entry),
    systems: draft.systems.map((system, index) => ({
      ...system,
      position: index + 1,
      name: trimToLength(system.name, 300) ?? system.name,
      providerType: trimToLength(system.providerType, 80),
    })),
    workflow: draft.workflow
      ? {
          ...draft.workflow,
          summary: trimToLength(draft.workflow.summary, 300),
        }
      : undefined,
  };
}

const draftAssistSpikePrompt = ai.definePrompt({
  name: "draftAssistSpikePromptV3",
  input: { schema: DraftAssistSpikeInputSchema },
  output: { schema: DraftAssistSpikeDraftSchema },
  prompt: `Du bist ein vorsichtiger Dokumentations-Assistent fuer KI-Register.

Deine Aufgabe:
Erzeuge aus einer kurzen Beschreibung einen manifest-nahen Erstentwurf fuer einen KI-Use-Case.

Wichtige Regeln:
- Nutze den Use Case als Haupteinheit, nicht das Tool.
- Erzeuge einen reviewbaren Erstentwurf fuer Quick Capture, keine Vollanalyse.
- Bleibe knapp, reviewbar und konkret.
- Erfinde keine kritischen Fakten.
- Wenn etwas nicht klar ist, schreibe es in "missingFacts" statt es frei zu erfinden.
- "missingFacts" ist optional und darf hoechstens 3 wirklich blockierende Rueckfragen enthalten.
- Nenne in "missingFacts" nur fehlende Informationen, die fuer Review, Risikosignal oder Capture-Handoff wirklich relevant sind.
- Nenne NICHT standardmaessig Detailfragen zu Prompt-Engineering, API-Integration, Modellversion, Systemarchitektur oder Konfiguration, ausser sie sind fuer den Fall offensichtlich zentral.
- Wenn die verantwortliche Rolle aus Team oder Fachbereich ableitbar ist, leite sie ab:
  Support-Team -> Support Lead
  Marketing-Team -> Marketing Lead
  Recruiting / Recruiter -> People Lead oder Recruiting Lead
  Einkauf / Procurement -> Procurement Lead
  IT -> IT Lead
  Finance Analyst / Finanzbereich -> Finance Lead
- Wenn die verantwortliche Rolle trotz Beschreibung nicht ableitbar ist, nutze "Unklar / fachliche Leitung".
- Wenn ein konkretes System im Text genannt ist, uebernimm diesen Namen in "systems" statt einen Platzhalter zu verwenden.
- Wenn eine interne Eigenentwicklung genannt ist, uebernimm genau diese Bezeichnung, z.B. "Eigenentwicklung RAG-Pipeline".
- Wenn kein konkretes System genannt ist, nutze als Systemname "Nicht spezifiziertes KI-System".
- Setze keine finale Risikoklasse.
- "systems" muss in Ausfuehrungsreihenfolge sortiert sein.
- Nutze "workflow" nur, wenn mehrere Systeme oder mehrere klar getrennte Schritte erkennbar sind.
- "usageContexts" muss eine oder mehrere dieser kanonischen Werte enthalten:
  INTERNAL_ONLY, EMPLOYEES, CUSTOMERS, APPLICANTS, PUBLIC
- Leite "usageContexts" semantisch ab:
  INTERNAL_ONLY = Ergebnis bleibt intern und wird nicht direkt von externen Personen gesehen oder genutzt
  EMPLOYEES = Mitarbeitende sind durch das Ergebnis direkt betroffen, nicht nur Nutzer des Tools
  CUSTOMERS = Kunden sehen die AI-Ausgabe direkt oder werden durch sie direkt bedient / beeinflusst
  APPLICANTS = Bewerber werden bewertet, kontaktiert, gerankt oder terminlich disponiert
  PUBLIC = Oeffentlichkeit sieht die AI-Ausgabe direkt
- Setze EMPLOYEES NICHT nur deshalb, weil Mitarbeitende das Tool bedienen.
- "decisionInfluence" bedeutet:
  ASSISTANCE = reine Assistenz
  PREPARATION = Vorbereitung fuer menschliche Entscheidung
  AUTOMATED = Ergebnis wirkt direkt entscheidungsnah oder automatisiert
- Nutze fuer "decisionInfluence" diese Heuristik:
  ASSISTANCE fuer Entwuerfe, Zusammenfassungen, Erklaerungen, Agenda-Skizzen, Textarbeit, Recherchehilfe, Policy-Drafts
  PREPARATION fuer Priorisierung, Triage, Due-Diligence-Vorbereitung, Antwortvorschlaege, Shortlist-Vorbereitung
  AUTOMATED nur wenn das Ergebnis ohne sinnvolle menschliche Zwischenschritte direkt wirkt
- Nutze "confidence: medium", wenn Use Case, System, betroffene Kontexte und menschliche Kontrolle grob klar sind.
- Nutze "confidence: low" nur wenn zentrale Governance-Fakten oder betroffene Kontexte unklar bleiben.

Mini-Beispiele:
- "Marketing-Team nutzt ChatGPT fuer Newsletter-Entwuerfe, Mensch prueft" -> eher ASSISTANCE, System = ChatGPT, fehlende Fakten meist 0-2
- "KI rankt Bewerbungen fuer Vorauswahl" -> APPLICANTS, starkes Hochrisiko-Signal, fehlende Fakten nur die wichtigsten Blocker
- "IT nutzt eigene RAG-Pipeline fuer interne Wissenssuche" -> Systemname aus Text uebernehmen, nicht generisch machen

Beschreibung:
{{{description}}}

Gib nur das JSON gemaess Schema zurueck.`,
});

export async function generateDraftAssistSpike(
  input: z.infer<typeof DraftAssistSpikeInputSchema>,
): Promise<DraftAssistSpikeDraft> {
  const result = await draftAssistSpikePrompt(input);
  return normalizeDraft(result.output!);
}
