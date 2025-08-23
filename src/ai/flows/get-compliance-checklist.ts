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
    .describe('The specific compliance topic from the EU AI Act (e.g., "Technical Documentation", "Risk Management System").'),
  currentStatus: z
    .string()
    .describe('The current compliance status for this topic (e.g., "Non-Compliant", "At Risk").'),
  details: z
    .string()
    .describe('The existing details or reasons for the current status.'),
});
export type GetComplianceChecklistInput = z.infer<typeof GetComplianceChecklistInputSchema>;

const GetComplianceChecklistOutputSchema = z.object({
  checklist: z.array(z.object({
    id: z.string().describe("A unique identifier for the task, e.g., 'task-1'"),
    description: z.string().describe("A detailed, actionable task to achieve compliance."),
  })).describe("An array of checklist items."),
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
  prompt: `You are an expert on the EU AI Act. A user needs a detailed, actionable checklist for a specific compliance topic.

Given the topic '{{{topic}}}', which is currently '{{{currentStatus}}}' because '{{{details}}}', generate a list of concrete steps they need to take to become compliant.

The tasks should be clear, concise, and written for a non-legal audience (e.g., a small business owner). Provide practical actions.
Focus only on the tasks, do not add any introductory or concluding text.
Generate between 3 and 5 checklist items.`,
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
