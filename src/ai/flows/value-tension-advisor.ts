
'use server';

/**
 * @fileOverview An AI-powered flow that helps resolve tensions between two ethical principles.
 *
 * - getValueTensionAdvice - The main function to analyze the tension.
 * - GetValueTensionAdviceInput - The input type for the function.
 * - GetValueTensionAdviceOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { principlesData, Principle } from '@/lib/design-thinking-data';

const PrincipleSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    figure: z.string(),
    company: z.string(),
    article: z.string(),
});


const GetValueTensionAdviceInputSchema = z.object({
  projectContext: z.string().describe('A brief description of the user\'s project or idea. E.g., "An AI chatbot for customer service".'),
  principleA: PrincipleSchema.describe('The first principle in the tension.'),
  principleB: PrincipleSchema.describe('The second principle that is in tension with the first.'),
});
export type GetValueTensionAdviceInput = z.infer<typeof GetValueTensionAdviceInputSchema>;


const GetValueTensionAdviceOutputSchema = z.object({
    synergyProposal: z.string().describe("A creative, actionable proposal on how the two principles could work together in synergy, rather than conflict."),
    impulseQuestions: z.array(z.string()).describe("A list of 2-3 inspiring and thought-provoking questions to help the user reframe the conflict as a creative opportunity."),
});
export type GetValueTensionAdviceOutput = z.infer<typeof GetValueTensionAdviceOutputSchema>;


export async function getValueTensionAdvice(
  input: GetValueTensionAdviceInput
): Promise<GetValueTensionAdviceOutput> {
  return valueTensionAdvisorFlow(input);
}


const prompt = ai.definePrompt({
  name: 'valueTensionAdvisorPrompt',
  input: { schema: GetValueTensionAdviceInputSchema },
  output: { schema: GetValueTensionAdviceOutputSchema },
  prompt: `You are an expert design thinking facilitator and an EU AI Act compliance consultant, specializing in turning regulatory conflicts into innovation opportunities. Your tone is constructive, inspiring, and practical.

A user is facing a tension between two core ethical principles for their project.

**User's Project Context:**
"{{{projectContext}}}"

**The Conflict:**
Principle A: **{{principleA.title}}** ({{principleA.description}})
vs.
Principle B: **{{principleB.title}}** ({{principleB.description}})

For example, a conflict between "Transparency" and "Privacy" is common.

Your task is to provide creative input in GERMAN to help the user resolve this tension not as a compromise, but as a synergy.

1.  **Synergy Proposal:**
    Write a short, actionable paragraph suggesting how these two principles can reinforce each other to create a better, more trustworthy product. Instead of "A vs. B", think "A through B".

2.  **Impulse Questions:**
    Provide 2-3 specific, thought-provoking questions that challenge the user to think differently about the problem. The questions should be open-ended and directly relate to the user's project context and the specific tension.

Your response must be structured and directly helpful for a product developer or designer.`,
});

const valueTensionAdvisorFlow = ai.defineFlow(
  {
    name: 'valueTensionAdvisorFlow',
    inputSchema: GetValueTensionAdviceInputSchema,
    outputSchema: GetValueTensionAdviceOutputSchema,
  },
  async (input) => {
    const result = await prompt(input);
    return result.output!;
  }
);
