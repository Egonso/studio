
'use server';

/**
 * @fileOverview A flow that generates a detailed, task-specific implementation guide for a given EU AI Act compliance checklist item.
 *
 * - getImplementationGuide - A function that returns a detailed guide.
 * - GetImplementationGuideInput - The input type for the function.
 * - GetImplementationGuideOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GetImplementationGuideInputSchema = z.object({
  taskDescription: z
    .string()
    .describe('Die spezifische Aufgabe aus einer EU AI Act Compliance-Checkliste, ISO 42001 Norm oder Portfolio-Strategie, für die eine Anleitung benötigt wird. Z.B. "Stellen Sie sicher, dass Ihre Datensätze für das Training... relevant sind."'),
  pillar: z
    .enum(['ai-act', 'iso-42001', 'portfolio'])
    .optional()
    .describe('Der Kontext der Aufgabe: EU AI Act, ISO 42001 oder Portfolio-Strategie.'),
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
  isIso42001: z.boolean().optional().describe('Flag indicating if pillar is iso-42001.'),
  isPortfolio: z.boolean().optional().describe('Flag indicating if pillar is portfolio.'),
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
  input: { schema: GetImplementationGuideInputSchema },
  output: { schema: GetImplementationGuideOutputSchema },
  prompt: `
  {{#if isIso42001}}
  Du bist ein zertifizierter Auditor für ISO 42001 (AI Management Systems).
  {{else}}
  {{#if isPortfolio}}
  Du bist ein Strategieberater für KI-Portfolio-Management und ROI-Optimierung.
  {{else}}
  Du bist ein Experte für den EU AI Act und ein hilfreicher Compliance-Berater für KMU und Startups.
  {{/if}}
  {{/if}}

  Ein Benutzer benötigt eine detaillierte, umsetzbare Anleitung für die folgende spezifische Aufgabe im Kontext von {{pillar}}:
  
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
  
  1.  **Empfohlene nächste Schritte:** Gib eine Liste von 3-4 konkreten Meilensteinen oder Schritten, die das Unternehmen unternehmen kann.
  2.  {{#if isIso42001}}**Audit-Checkliste:** Welche Nachweise würde ein Auditor verlangen?{{else}}**Leitfragen für Ihr Team:** Formuliere Fragen zur Selbstüberprüfung.{{/if}}
  
  **FORMATIERUNGSREGELN:**
  - Verwende Markdown für die Formatierung.
  - Für **Fettdruck** nutze doppelte Sternchen: \`**Wichtiger Text**\`.
  - Für *Kursivschrift* nutze einfache Sternchen: \`*Betonung*\`.
  - Für Tool-Namen oder Code-Schnipsel nutze Backticks: \`<code>mein-tool</code>\`.
  
  Sei sehr spezifisch und praxisorientiert. Der Output muss direkt auf die gegebene Aufgabe anwendbar sein.`,
});

const getImplementationGuideFlow = ai.defineFlow(
  {
    name: 'getImplementationGuideFlow',
    inputSchema: GetImplementationGuideInputSchema,
    outputSchema: GetImplementationGuideOutputSchema,
  },
  async input => {
    // Compute boolean flags for Handlebars template (workaround for knownHelpersOnly)
    const promptInput = {
      ...input,
      isIso42001: input.pillar === 'iso-42001',
      isPortfolio: input.pillar === 'portfolio',
    };
    const result = await prompt(promptInput);
    // TODO: Re-implement token counting on the server-side
    return result.output!;
  }
);
