
'use server';

/**
 * @fileOverview An AI-powered advisor for the "Compliance by Design" process.
 * It provides context-specific questions, patterns, and opportunity reframing
 * based on a selected design thinking phase and a core principle of trustworthy AI.
 *
 * - getDesignAdvice - The main function to generate design advice.
 * - GetDesignAdviceInput - The input schema for the function.
 * - GetDesignAdviceOutput - The output schema for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { designPhases, principlesData } from '@/lib/design-thinking-data';
import { updateTokenUsage, isUserOverTokenLimit } from '@/lib/data-service';

// Dynamically create Zod enums from the data files to ensure consistency
const designPhaseIds = designPhases.map(p => p.id) as [string, ...string[]];
const principleIds = principlesData.map(p => p.id) as [string, ...string[]];


const DesignPhaseSchema = z.object({
    id: z.enum(designPhaseIds),
    title: z.string(),
    description: z.string(),
    output: z.string(),
});

const PrincipleSchema = z.object({
    id: z.enum(principleIds),
    title: z.string(),
    description: z.string(),
    figure: z.string(),
    company: z.string(),
    article: z.string(),
});


const GetDesignAdviceInputSchema = z.object({
  projectContext: z.string().describe('A brief description of the user\'s project or idea. E.g., "An AI chatbot for customer service" or "A tool for analyzing job applications."'),
  phase: DesignPhaseSchema.describe('The current design thinking phase the user is in.'),
  principle: PrincipleSchema.describe('The principle of trustworthy intelligence the user wants to focus on.'),
});
export type GetDesignAdviceInput = z.infer<typeof GetDesignAdviceInputSchema>;

const GetDesignAdviceOutputSchema = z.object({
  sections: z.array(z.object({
    title: z.string().describe("The title of the advice section, e.g., 'Principle Lenses: Key Questions' or 'Opportunity Reframer'."),
    content: z.array(z.string()).describe("A list of concrete questions, patterns, or reframed opportunities."),
  })).describe("An array of advice sections, each containing a title and a list of content points."),
});
export type GetDesignAdviceOutput = z.infer<typeof GetDesignAdviceOutputSchema>;

export async function getDesignAdvice(
  input: GetDesignAdviceInput
): Promise<GetDesignAdviceOutput> {
  return designAdvisorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'designAdvisorPrompt',
  input: { schema: GetDesignAdviceInputSchema },
  output: { schema: GetDesignAdviceOutputSchema },
  prompt: `You are an expert design thinking facilitator and an EU AI Act compliance consultant, specialized in transforming regulatory constraints into innovation opportunities. Your tone is inspiring, practical, and revolutionary.

A user is working on a project and needs creative, actionable advice.

**User's Project Context:**
"{{{projectContext}}}"

They are currently in the **"{{phase.title}}"** phase of the design thinking process. The goal of this phase is to produce: "{{phase.output}}".

They want to apply the principle of **"{{principle.title}}"**, which states: "{{principle.description}}". This principle is inspired by {{principle.figure}} and exemplified by companies like {{principle.company}}. It relates to Article(s) {{principle.article}} of the EU AI Act.

GENERATE a list of 2-3 structured advice sections in GERMAN language to help them. Be specific, creative, and directly applicable to their context.

1.  **Principle Lenses: Schlüsselfragen:**
    Generate 2-3 penetrating questions that connect the selected principle with the current design phase and the user's project. These questions should challenge assumptions and spark new ideas.

2.  **Pattern Library: Konkrete Muster:**
    Suggest 1-2 concrete, reusable design patterns or "micro-actions" they could implement right now in their project. Think in terms of UI, workflow, or documentation.

3.  **Opportunity Reframer: Von Risiko zur Chance:**
    Reframe the core challenge of the principle from a burden into a clear market opportunity or a unique selling proposition (USP). How can they turn this specific compliance requirement into a competitive advantage?

Your output must be structured, inspiring, and directly helpful for a product developer or designer.`,
});

const designAdvisorFlow = ai.defineFlow(
  {
    name: 'designAdvisorFlow',
    inputSchema: GetDesignAdviceInputSchema,
    outputSchema: GetDesignAdviceOutputSchema,
  },
  async (input) => {
    const result = await prompt(input);
    // TODO: Re-implement token counting on the server-side
    return result.output!;
  }
);
