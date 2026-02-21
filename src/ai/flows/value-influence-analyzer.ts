
'use server';

/**
 * @fileOverview An AI-powered flow that analyzes stakeholder concerns and maps them to the 10 principles of trustworthy intelligence.
 *
 * - analyzeValueInfluence - The main function to run the analysis.
 * - ValueInfluenceAnalysisInput - The input type for the function.
 * - ValueInfluenceAnalysisOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { principlesData } from '@/lib/design-thinking-data';

const StakeholderSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['internal', 'external', 'societal']),
  concerns: z.string().describe("A textual description of the stakeholder's concerns, interests, and how they are affected by the AI system."),
});

const ValueInfluenceAnalysisInputSchema = z.object({
  projectContext: z.string().describe('A brief description of the user\'s project or idea.'),
  stakeholders: z.array(StakeholderSchema).describe("The list of stakeholders to be analyzed."),
});
export type ValueInfluenceAnalysisInput = z.infer<typeof ValueInfluenceAnalysisInputSchema>;

const AnalysisResultSchema = z.object({
  principleId: z.string().describe("The ID of the principle being analyzed (e.g., 'p1', 'p2')."),
  priority: z.enum(['High', 'Medium', 'Low', 'None']).describe("The assessed priority of this principle for the stakeholder."),
  rationale: z.string().describe("A brief, clear rationale for the assigned priority, based on the stakeholder's concerns."),
});

const ValueInfluenceAnalysisOutputSchema = z.object({
  results: z.array(z.object({
    stakeholderId: z.string(),
    stakeholderName: z.string(),
    analysis: z.array(AnalysisResultSchema),
  })),
});
export type ValueInfluenceAnalysisOutput = z.infer<typeof ValueInfluenceAnalysisOutputSchema>;


export async function analyzeValueInfluence(
  input: ValueInfluenceAnalysisInput
): Promise<ValueInfluenceAnalysisOutput> {
  return valueInfluenceAnalyzerFlow(input);
}


const prompt = ai.definePrompt({
  name: 'valueInfluenceAnalyzerPrompt',
  input: { schema: z.any() },
  output: { schema: ValueInfluenceAnalysisOutputSchema },
  prompt: `You are an expert ethics and compliance consultant, specialized in mapping stakeholder needs to the principles of trustworthy AI according to the EU AI Act.

Your task is to analyze a list of stakeholders for a given project and determine the priority of each of the 10 core ethical principles for each stakeholder.

**Project Context:**
"{{{projectContext}}}"

**The 10 Core Principles of Trustworthy Intelligence:**
---
{{#each principles}}
- **{{id}} ({{title}}):** {{description}}
{{/each}}
---

**Stakeholders to Analyze:**
---
{{#each stakeholders}}
- **Stakeholder ID: {{id}}**
  - Name: {{name}}
  - Type: {{type}}
  - Concerns: "{{concerns}}"
{{/each}}
---

For each stakeholder, analyze their stated 'Concerns' and assign a priority ('High', 'Medium', 'Low', 'None') to each of the 10 principles. Provide a short, precise rationale for each priority assignment.

**Example for a single stakeholder analysis:**
If a stakeholder's concern is "I want to know when I am talking to a bot versus a human", the analysis for the principle 'p2 (Transparenz als Waffe)' should have a 'High' priority with a rationale like "The stakeholder explicitly demands transparency about the nature of the interaction." The priority for 'p9 (Gesellschaft & Erde zuerst)' might be 'Low' or 'None' if their concerns are purely operational.

Generate a structured output with the results for all stakeholders. Your response must be in German.
`,
});

const valueInfluenceAnalyzerFlow = ai.defineFlow(
  {
    name: 'valueInfluenceAnalyzerFlow',
    inputSchema: ValueInfluenceAnalysisInputSchema,
    outputSchema: ValueInfluenceAnalysisOutputSchema,
  },
  async (input) => {
    const result = await prompt({
      ...input,
      principles: principlesData
    });
    return result.output!;
  }
);
