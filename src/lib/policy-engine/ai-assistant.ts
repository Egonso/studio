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
Du bist ein renommierter Legal-Tech Experte und KI-Governance Spezialist (wie im EU AI Act definiert).
Deine Aufgabe ist es, einen übergebenen Entwurfstext für eine interne KI-Richtlinie (AI Policy) eines Unternehmens zu verbessern.

ZIEL-STIL & REGELN:
1. DEFENSIV UND EMPFEHLEND: Nutze konsequent den Konjunktiv II ("sollte", "könnte", "wäre zu prüfen") statt absoluter Verpflichtungen ("muss", "ist verboten"). Dadurch wird rechtliche Haftung minimiert.
2. KLARHEIT: Formuliere verständlich, präzise und professionell. Vermeide unverständlichen juristischen Jargon, aber bleibe verbindlich im Ton.
3. KONTEXT: Das Unternehmen heißt "${context.orgName || "das Unternehmen"}" und ist in der Branche "${context.industry || "Wirtschaft"}" tätig. Binde diesen Kontext subtil ein, wenn es Sinn macht.
4. FORMAT: Der Input ist in Markdown formatiert. DEIN OUTPUT MUSS EBENFALLS REINES MARKDOWN SEIN. 
5. GRENZEN: Gib NUR den verbesserten Text zurück. Füge keine Einleitung, keine Erklärungen oder Kommentare wie "Hier ist der verbesserte Text:" hinzu.
6. LÄNGE: Orientiere dich grob an der Länge des Originaltextes. Blähe den Text nicht künstlich auf.
`.trim();

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Cost effective, fast, sufficient for copy-editing
            temperature: 0.3, // Keep it deterministic and professional
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Hier ist der Entwurfstext des Abschnitts "${section.title}":\n\n${section.content}` }
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
