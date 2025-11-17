
'use server';

/**
 * @fileOverview A flow that generates a detailed, task-specific implementation guide for a given EU AI Act compliance checklist item.
 *
 * - getImplementationGuide - A function that returns a detailed guide.
 * - GetImplementationGuideInput - The input type for the function.
 * - GetImplementationGuideOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { updateTokenUsage, isUserOverTokenLimit } from '@/lib/data-service';

const GetImplementationGuideInputSchema = z.object({
  taskDescription: z
    .string()
    .describe('Die spezifische Aufgabe aus einer EU AI Act Compliance-Checkliste, für die eine Anleitung benötigt wird. Z.B. "Stellen Sie sicher, dass Ihre Datensätze für das Training, die Validierung und das Testen Ihres KI-Systems relevant, repräsentativ, fehlerfrei und vollständig sind."'),
  companyDescription: z
    .string()
    .optional()
    .describe('Eine Beschreibung des Unternehmens und seiner Aktivitäten.'),
  riskProfile: z
    .string()
    .optional()
    .describe('Die Selbsteinschätzung des Risikoprofils des Unternehmens.'),
  existingAuditData: z
    .string()
    .optional()
    .describe('Der Textinhalt relevanter, vom Benutzer hochgeladener Dokumente.'),
});
export type GetImplementationGuideInput = z.infer<typeof GetImplementationGuideInputSchema>;

const GetImplementationGuideOutputSchema = z.object({
  guide: z.array(z.object({
    title: z.string().describe("Der Titel des Abschnitts, z.B. 'Empfohlene nächste Schritte' oder 'Leitfragen für Ihr Team'."),
    steps: z.array(z.string()).describe("Eine Liste von konkreten Schritten, Fragen oder Empfehlungen. Verwende Markdown für die Formatierung: `**fett**` für Fettdruck, `*kursiv*` für Kursivschrift und `<code>` für Code/Tools."),
  })).describe("Eine Reihe von Anleitungs-Abschnitten."),
});
export type GetImplementationGuideOutput = z.infer<typeof GetImplementationGuideOutputSchema>;

export async function getImplementationGuide(
  input: GetImplementationGuideInput
): Promise<GetImplementationGuideOutput> {
  return getImplementationGuideFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getImplementationGuidePrompt',
  input: {schema: GetImplementationGuideInputSchema},
  output: {schema: GetImplementationGuideOutputSchema},
  prompt: `Du bist ein Experte für den EU AI Act und ein hilfreicher Compliance-Berater für KMU und Startups.
Ein Benutzer benötigt eine detaillierte, umsetzbare Anleitung für die folgende spezifische Aufgabe:

**Aufgabe:** "{{{taskDescription}}}"

{{#if companyDescription}}
**Berücksichtige bei deiner Antwort den folgenden Unternehmenskontext:**
*   **Unternehmensbeschreibung:** {{{companyDescription}}}
{{#if riskProfile}}
*   **Selbsteingeschätztes Risiko:** {{{riskProfile}}}
{{/if}}
{{#if existingAuditData}}
*   **Vom Benutzer bereitgestelltes Dokument:**
    ---
    {{{existingAuditData}}}
    ---
    Beziehe dich bei deinen Empfehlungen explizit auf Inhalte aus diesem Dokument, wenn es relevant ist.
{{/if}}
Passe deine Empfehlungen so an, dass sie für dieses spezifische Unternehmen besonders relevant sind.
{{/if}}


Erstelle eine präzise, leicht verständliche Anleitung in deutscher Sprache, die genau auf diese Aufgabe zugeschnitten ist. Die Anleitung soll aus zwei Abschnitten bestehen:

1.  **Empfohlene nächste Schritte:** Gib eine Liste von 3-4 konkreten, umsetzbaren Schritten, die ein kleines Unternehmen unternehmen kann, um diese Anforderung zu erfüllen.
2.  **Leitfragen für Ihr Team:** Formuliere 3-4 präzise Fragen, die sich das Team stellen kann, um zu überprüfen, ob sie die Anforderung wirklich verstanden haben und erfüllen.

**FORMATIERUNGSREGELN:**
- Verwende Markdown für die Formatierung.
- Für **Fettdruck** nutze doppelte Sternchen: \`**Wichtiger Text**\`.
- Für *Kursivschrift* nutze einfache Sternchen: \`*Betonung*\`.
- Für Tool-Namen oder Code-Schnipsel nutze Backticks: \`<code>mein-tool</code>\`. Schlage, wo sinnvoll, konkrete Open-Source-Tools oder Bibliotheken vor und gib auch Links zu relevanten Vorlagen oder Standards, falls zutreffend.

Sei sehr spezifisch und praxisorientiert. Vermeide allgemeines Gerede. Der Output muss direkt auf die gegebene Aufgabe anwendbar sein.`,
});

const getImplementationGuideFlow = ai.defineFlow(
  {
    name: 'getImplementationGuideFlow',
    inputSchema: GetImplementationGuideInputSchema,
    outputSchema: GetImplementationGuideOutputSchema,
  },
  async input => {
    const result = await prompt(input);
    // TODO: Re-implement token counting on the server-side
    return result.output!;
  }
);
