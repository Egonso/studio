
'use server';

/**
 * @fileOverview An AI-powered flow that detects "Dark Patterns" or "Anti-Patterns" in a user-provided UI/UX workflow description.
 *
 * - detectAntiPatterns - The main function to analyze the description.
 * - DetectAntiPatternsInput - The input type for the function.
 * - DetectAntiPatternsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { updateTokenUsage, isUserOverTokenLimit } from '@/lib/data-service';


const DetectAntiPatternsInputSchema = z.object({
  description: z.string().describe("A description of a user interface, a user workflow, or a specific design choice to be analyzed for manipulative or unethical patterns (Dark Patterns)."),
});
export type DetectAntiPatternsInput = z.infer<typeof DetectAntiPatternsInputSchema>;

const DetectAntiPatternsOutputSchema = z.object({
  detectedPatterns: z.array(z.object({
    patternName: z.string().describe("The common name of the detected anti-pattern, e.g., 'Confirmshaming', 'Roach Motel', 'Hidden Costs'."),
    explanation: z.string().describe("A clear and concise explanation of why the described workflow is considered a manipulative pattern and potentially problematic under the EU AI Act's transparency and fairness principles."),
    suggestion: z.string().describe("A concrete, actionable suggestion for a more transparent, user-friendly, and ethical alternative."),
  })).describe("A list of detected anti-patterns. If no patterns are found, this array should be empty."),
});
export type DetectAntiPatternsOutput = z.infer<typeof DetectAntiPatternsOutputSchema>;


export async function detectAntiPatterns(
  input: DetectAntiPatternsInput
): Promise<DetectAntiPatternsOutput> {
  return antiPatternDetectorFlow(input);
}


const prompt = ai.definePrompt({
  name: 'antiPatternDetectorPrompt',
  input: { schema: DetectAntiPatternsInputSchema },
  output: { schema: DetectAntiPatternsOutputSchema },
  prompt: `You are an expert UX designer and an EU AI Act compliance consultant, specializing in identifying and rectifying "Dark Patterns" in digital interfaces. You are reviewing a workflow described by a product developer.

Your task is to analyze the following description for any known manipulative anti-patterns.

**Workflow Description:**
---
{{{description}}}
---

Analyze the description and identify if it contains any of the following patterns:
- **Roach Motel / Trick Questions:** Is it easy for the user to get into a situation but hard to get out? Are questions phrased to confuse the user into making an unintended choice?
- **Hidden Costs / Drip Pricing:** Are costs or negative consequences only revealed at the very end of the process?
- **Confirmshaming:** Does the UI use guilt or shame to make the user opt-in to something they might not want? (e.g., "No thanks, I prefer to pay full price.")
- **Forced Action / Forced Enrollment:** Is the user forced to do something unrelated to their primary goal, like creating an account to browse a site? Is a service added automatically without explicit consent?
- **Sneak into Basket:** Are extra items added to the shopping cart without the user's action?
- **Misleading Urgency / Scarcity:** Does the UI create a false sense of urgency or scarcity to pressure the user into a quick decision? (e.g., "Only 2 left in stock!" when it's not true).

For each pattern you identify, provide:
1.  **patternName:** The name of the pattern.
2.  **explanation:** A brief explanation of why this is a manipulative pattern.
3.  **suggestion:** A concrete, ethical, and user-friendly alternative design.

If you find no manipulative patterns, return an empty array for \`detectedPatterns\`. Your response must be in German.`,
});

const antiPatternDetectorFlow = ai.defineFlow(
  {
    name: 'antiPatternDetectorFlow',
    inputSchema: DetectAntiPatternsInputSchema,
    outputSchema: DetectAntiPatternsOutputSchema,
  },
  async (input) => {
    const result = await prompt(input);
    // TODO: Re-implement token counting on the server-side
    return result.output!;
  }
);
