'use server';

/**
 * @fileOverview A flow that generates a detailed compliance checklist for a specific topic of the EU AI Act.
 *
 * - getComplianceChecklist - A function that returns a checklist.
 * - GetComplianceChecklistInput - The input type for the function.
 * - GetComplianceChecklistOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetComplianceChecklistInputSchema = z.object({
  topic: z
    .string()
    .describe('Das spezifische Compliance-Thema aus dem EU AI Act (z.B. "Technische Dokumentation", "Risikomanagementsystem").'),
  currentStatus: z
    .string()
    .describe('Der aktuelle Compliance-Status für dieses Thema (z.B. "Nicht konform", "Gefährdet", "Compliant").'),
  details: z
    .string()
    .describe('Die vorhandenen Details oder Gründe für den aktuellen Status.'),
});
export type GetComplianceChecklistInput = z.infer<typeof GetComplianceChecklistInputSchema>;

const GetComplianceChecklistOutputSchema = z.object({
  checklist: z.array(z.object({
    id: z.string().describe("Eine eindeutige Kennung für die Aufgabe, z.B. 'task-1'"),
    description: z.string().describe("Eine detaillierte, umsetzbare Aufgabe zur Erreichung der Konformität, inklusive eines Verweises auf den relevanten Artikel des EU AI Acts in Klammern am Ende, z.B. (Art. 11). Wenn der Status 'Compliant' ist, formuliere die Beschreibung als bestätigende Aussage im Präsens (z.B. 'Sie führen regelmäßig Audits durch...')."),
  })).describe("Eine Reihe von Checklistenpunkten."),
});
export type GetComplianceChecklistOutput = z.infer<typeof GetComplianceChecklistOutputSchema>;

export async function getComplianceChecklist(
  input: GetComplianceChecklistInput
): Promise<GetComplianceChecklistOutput> {
  return getComplianceChecklistFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getComplianceChecklistPrompt',
  input: {schema: GetComplianceChecklistInputSchema},
  output: {schema: GetComplianceChecklistOutputSchema},
  prompt: `Du bist ein Experte für den EU AI Act. Ein Benutzer benötigt eine detaillierte, umsetzbare Checkliste für ein bestimmtes Compliance-Thema in deutscher Sprache.

Für das Thema '{{{topic}}}', das aktuell '{{{currentStatus}}}' ist, weil '{{{details}}}', erstelle eine Liste von Schritten.

**WICHTIGE ANWEISUNG:**
- Wenn der 'currentStatus' **'Compliant'** ist, formuliere jeden Punkt als eine **bestätigende Aussage im Präsens**, die beschreibt, was bereits umgesetzt ist (z.B. "Sie stellen sicher, dass...", "Ihre Dokumentation enthält...").
- Wenn der 'currentStatus' **'At Risk'** oder **'Non-Compliant'** ist, formuliere jeden Punkt als eine **umsetzbare Handlungsaufforderung** (z.B. "Stellen Sie sicher, dass...", "Erstellen Sie eine Dokumentation, die...").

Die Aufgaben müssen klar, prägnant und für ein nicht-juristisches Publikum (z.B. einen Kleinunternehmer) verständlich sein.
Füge am Ende jeder Aufgabe in Klammern einen Verweis auf den relevanten Artikel des EU AI Acts hinzu (z.B. "(Art. 11)").
Konzentriere dich nur auf die Aufgaben, füge keinen einleitenden oder abschließenden Text hinzu.
Generiere zwischen 3 und 5 Checklistenpunkte.`,
});

const getComplianceChecklistFlow = ai.defineFlow(
  {
    name: 'getComplianceChecklistFlow',
    inputSchema: GetComplianceChecklistInputSchema,
    outputSchema: GetComplianceChecklistOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
