
'use server';

/**
 * @fileOverview An AI-powered advisor that reviews compliance data and provides actionable recommendations for conforming with the EU AI Act.
 *
 * - aiComplianceAdvisor - A function that handles the compliance advising process.
 * - AiComplianceAdvisorInput - The input type for the aiComplianceAdvisor function.
 * - AiComplianceAdvisorOutput - The return type for the aiComplianceAdvisor function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiComplianceAdvisorInputSchema = z.object({
  companyDescription: z
    .string()
    .describe('A description of the company and its activities.'),
  existingAuditData: z
    .string()
    .describe(
      'Existing audit and compliance information for the company.  Include information about data collection and data processing.'
    ),
  riskProfile: z
    .string()
    .describe(
      'The risk profile of the company, including the areas of highest compliance risk.'
    ),
});
export type AiComplianceAdvisorInput = z.infer<typeof AiComplianceAdvisorInputSchema>;

const AiComplianceAdvisorOutputSchema = z.object({
  recommendations: z
    .string()
    .describe(
      'Actionable recommendations for conforming with the EU AI Act, considering the company’s current operations and risk profile.'
    ),
});
export type AiComplianceAdvisorOutput = z.infer<typeof AiComplianceAdvisorOutputSchema>;

export async function aiComplianceAdvisor(
  input: AiComplianceAdvisorInput
): Promise<AiComplianceAdvisorOutput> {
  return complianceAdvisorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiComplianceAdvisorPrompt',
  input: {schema: AiComplianceAdvisorInputSchema},
  output: {schema: AiComplianceAdvisorOutputSchema},
  prompt: `You are an AI compliance advisor. Review the following information about a company and provide actionable recommendations for conforming with the EU AI Act.

Company Description: {{{companyDescription}}}
Existing Audit Data: {{{existingAuditData}}}
Risk Profile: {{{riskProfile}}}

Consider the company’s current operations and risk profile when generating the recommendations. Focus on practical steps the company can take to improve its compliance posture.`,
});

const complianceAdvisorFlow = ai.defineFlow(
  {
    name: 'complianceAdvisorFlow',
    inputSchema: AiComplianceAdvisorInputSchema,
    outputSchema: AiComplianceAdvisorOutputSchema,
  },
  async input => {
    const isOverLimit = await isUserOverTokenLimit();
    if (isOverLimit) {
      throw new Error('Monthly token limit exceeded. Please upgrade your plan.');
    }

    const result = await prompt(input);

    if (result.usage?.totalTokens) {
      await updateTokenUsage(result.usage.totalTokens);
    }

    return result.output!;
  }
);
