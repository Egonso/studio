import { OpenAI } from "openai";
import type { PolicySection } from "./types";

/**
 * Thrown or returned if the user hits their rate limit
 */
export class RateLimitError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RateLimitError";
    }
}

/**
 * Service to generate AI improvements for policy sections.
 * This is called server-side because it uses the OpenAI API key.
 * 
 * IMPORTANT: In production, the API route calling this MUST enforce
 * rate limits based on the user's subscription tier:
 * - Free: 0 (blocked at UI level)
 * - Pro: 5 per day
 * - Enterprise: unlimited
 */
export async function generateSectionImprovement(
    section: PolicySection,
    context: { orgName?: string | null; industry?: string | null }
): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("Missing OPENAI_API_KEY environment variable. AI features are unavailable.");
    }

    const openai = new OpenAI({ apiKey });

    const systemPrompt = `
You are a renowned Legal-Tech expert and AI Governance specialist (as defined in the EU AI Act, Regulation (EU) 2024/1689).
Your task is to improve a given draft text for an internal AI policy of an organisation.

STYLE & RULES:
1. DEFENSIVE AND ADVISORY: Consistently use the subjunctive ("should", "could", "it would be advisable to") rather than absolute obligations ("must", "is prohibited"). This minimises legal liability.
2. CLARITY: Write clearly, precisely, and professionally. Avoid impenetrable legal jargon while maintaining an authoritative tone.
3. CONTEXT: The organisation is called "${context.orgName || "the organisation"}" and operates in the "${context.industry || "general"}" sector. Subtly incorporate this context where appropriate.
4. FORMAT: The input is formatted in Markdown. YOUR OUTPUT MUST ALSO BE PURE MARKDOWN.
5. BOUNDARIES: Return ONLY the improved text. Do not add introductions, explanations, or comments like "Here is the improved text:".
6. LENGTH: Roughly match the length of the original text. Do not artificially inflate it.
`.trim();

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Cost effective, fast, sufficient for copy-editing
            temperature: 0.3, // Keep it deterministic and professional
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Here is the draft text of section "${section.title}":\n\n${section.content}` }
            ],
        });

        const result = response.choices[0]?.message?.content;
        if (!result) {
            throw new Error("OpenAI returned an empty response.");
        }

        return result.trim();
    } catch (err: any) {
        console.error("OpenAI API Error:", err);
        throw new Error(err.message || "Failed to generate AI improvement.");
    }
}
