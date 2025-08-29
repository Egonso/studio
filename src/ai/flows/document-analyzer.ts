'use server';

/**
 * @fileOverview An AI-powered flow that analyzes user-provided documentation against a specific compliance topic.
 *
 * - analyzeDocument - A function that handles the document analysis process.
 * - AnalyzeDocumentInput - The input type for the analyzeDocument function.
 * - AnalyzeDocumentOutput - The return type for the analyzeDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeDocumentInputSchema = z.object({
  documentText: z
    .string()
    .describe('The full text content of the document to be analyzed.'),
  complianceTopic: z
    .string()
    .describe('The specific compliance requirement or task the document should fulfill. For example: "Technical Documentation" or "Data Governance Policy".'),
  taskDescription: z
    .string()
    .describe('The detailed description of the task from the checklist that the document is being evaluated against.'),
});
export type AnalyzeDocumentInput = z.infer<typeof AnalyzeDocumentInputSchema>;

const AnalyzeDocumentOutputSchema = z.object({
  summary: z.string().describe("A brief, neutral summary of the document's content and relevance to the task."),
  strengths: z.array(z.string()).describe("A list of points where the document effectively addresses the compliance task."),
  weaknesses: z.array(z.string()).describe("A list of gaps, missing information, or areas for improvement in the document."),
  isFulfilled: z.boolean().describe("A final verdict on whether the document appears to fulfill the specific task requirement based on the analysis."),
});
export type AnalyzeDocumentOutput = z.infer<typeof AnalyzeDocumentOutputSchema>;

export async function analyzeDocument(
  input: AnalyzeDocumentInput
): Promise<AnalyzeDocumentOutput> {
  return documentAnalyzerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'documentAnalyzerPrompt',
  input: {schema: AnalyzeDocumentInputSchema},
  output: {schema: AnalyzeDocumentOutputSchema},
  prompt: `You are an expert EU AI Act compliance consultant. A user has provided a document to see if it fulfills a specific requirement.

Your task is to analyze the provided document text in the context of the given compliance topic and task description.

**Compliance Topic:** {{{complianceTopic}}}
**Task Description:** "{{{taskDescription}}}"

**Document Text to Analyze:**
---
{{{documentText}}}
---

Please provide a structured analysis in German.
- **Summary:** Summarize neutrally what the document is about.
- **Strengths:** List the specific points where the document's content directly and effectively addresses the requirements of the task. Be specific.
- **Weaknesses:** Identify concrete gaps, missing information, or areas that do not meet the requirements of the task. Provide actionable feedback on what needs to be added or clarified.
- **isFulfilled:** Based *only* on the analysis of the document against the task description, make a final boolean judgment. If there are significant weaknesses, set this to 'false'. Set it to 'true' only if the document appears to comprehensively address the task.

Focus solely on the provided text and the specific task. Do not invent information. If the document is irrelevant to the task, state this in the summary and leave strengths and weaknesses empty and set isFulfilled to false.`,
});

const documentAnalyzerFlow = ai.defineFlow(
  {
    name: 'documentAnalyzerFlow',
    inputSchema: AnalyzeDocumentInputSchema,
    outputSchema: AnalyzeDocumentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
