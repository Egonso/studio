
'use server';

/**
 * @fileOverview An AI-powered advisor that suggests KI use cases for SMEs based on their challenges.
 *
 * - aiImplementationAdvisor - A function that handles the use case suggestion process.
 * - AiImplementationAdvisorInput - The input type for the function.
 * - AiImplementationAdvisorOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AiImplementationAdvisorInputSchema = z.object({
  companyDescription: z.string().min(10, "Eine Beschreibung des Unternehmens, seiner Branche und seiner Hauptaktivitäten. Kann auch den Inhalt von hochgeladenen Dokumenten enthalten.").describe("Eine Beschreibung des Unternehmens, seiner Branche und seiner Hauptaktivitäten. Kann auch den Inhalt von hochgeladenen Dokumenten enthalten."),
  challenge: z.string().min(10, "Eine konkrete Herausforderung oder ein Problem, bei dem KI helfen könnte, z.B. 'Wir verbringen zu viel Zeit mit der Beantwortung von wiederkehrenden Kundenanfragen per E-Mail'.").describe("Eine konkrete Herausforderung oder ein Problem, bei dem KI helfen könnte, z.B. 'Wir verbringen zu viel Zeit mit der Beantwortung von wiederkehrenden Kundenanfragen per E-Mail'."),
});
export type AiImplementationAdvisorInput = z.infer<typeof AiImplementationAdvisorInputSchema>;

const AiImplementationAdvisorOutputSchema = z.object({
  suggestions: z.array(z.object({
    title: z.string().describe("Ein kurzer, prägnanter Titel für den Lösungsvorschlag, z.B. 'Intelligentes E-Mail-Ticket-System'."),
    description: z.string().describe("Eine klare Beschreibung der vorgeschlagenen KI-Lösung und wie sie die Herausforderung adressiert. Inklusive einer kurzen Erwähnung der benötigten Technologie (z.B. 'Sprachmodell zur Klassifizierung')."),
    potentialBenefit: z.string().describe("Eine qualitative, aber konkrete Einschätzung des potenziellen Nutzens oder ROI, z.B. 'Reduziert die manuelle Bearbeitungszeit für Standardanfragen um schätzungsweise 40-50% und erhöht die Antwortgeschwindigkeit.' oder 'Steigert die Genauigkeit der Bedarfsprognosen und kann Lagerkosten um bis zu 15% senken.'"),
  })).describe("Eine Liste von 2-3 konkreten KI-Lösungsvorschlägen."),
});
export type AiImplementationAdvisorOutput = z.infer<typeof AiImplementationAdvisorOutputSchema>;


export async function aiImplementationAdvisor(
  input: AiImplementationAdvisorInput
): Promise<AiImplementationAdvisorOutput> {
  return implementationAdvisorFlow(input);
}


const prompt = ai.definePrompt({
  name: 'implementationAdvisorPrompt',
  input: { schema: AiImplementationAdvisorInputSchema },
  output: { schema: AiImplementationAdvisorOutputSchema },
  prompt: `Du bist ein erfahrener Digitalisierungsberater, der sich auf die Einführung von KI in kleinen und mittleren Unternehmen (KMU) spezialisiert hat. Deine Aufgabe ist es, basierend auf einer Unternehmensbeschreibung und einer spezifischen Herausforderung, 2-3 konkrete, realistische und wertorientierte KI-Lösungsideen vorzuschlagen.

**Unternehmenskontext:**
- Beschreibung: {{{companyDescription}}}
- Herausforderung: {{{challenge}}}

**Deine Aufgabe:**
Analysiere die bereitgestellten Informationen und generiere 2-3 umsetzbare Vorschläge. Konzentriere dich auf Lösungen, die für KMUs mit begrenzten Ressourcen machbar sind (z.B. Nutzung von APIs, Open-Source-Modellen oder No-Code-Plattformen anstelle von kompletter Eigenentwicklung).

Für jeden Vorschlag, fülle die folgenden Felder aus:
1.  **title:** Ein kurzer, verständlicher Titel für die Lösung.
2.  **description:** Eine klare Beschreibung, was die KI-Lösung tut und wie sie das Problem löst.
3.  **potentialBenefit:** Eine realistische, qualitative Einschätzung des Nutzens (ROI). Sei dabei so spezifisch wie möglich (z.B. "Reduziert den manuellen Aufwand um X%", "Steigert die Lead-Qualität durch Y", "Ermöglicht schnellere Reaktionszeiten").

Formuliere deine Antworten auf Deutsch. Sei ermutigend, aber realistisch.`,
});

const implementationAdvisorFlow = ai.defineFlow(
  {
    name: 'implementationAdvisorFlow',
    inputSchema: AiImplementationAdvisorInputSchema,
    outputSchema: AiImplementationAdvisorOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

    