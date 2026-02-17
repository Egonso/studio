'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import lawDataRaw from '@/data/eu-ai-act.json';
import { SITE_TREE, FEATURE_OVERVIEW, COMMON_QUESTIONS } from '@/data/chatbot-context';

// Input/Output Schemas
const ChatbotInputSchema = z.object({
    messages: z.array(
        z.object({
            role: z.enum(['user', 'model', 'system']),
            content: z.string(),
        })
    ),
    currentPath: z.string().optional(),
});

// Define the Navigation Tool
export const navigateTool = ai.defineTool(
    {
        name: 'navigateTool',
        description: 'Use this tool to navigate the user to a specific path in the application. Use it when the user asks to go somewhere or when a specific page is the best answer.',
        inputSchema: z.object({
            path: z.string().describe('The relative path to navigate to, e.g., "/dashboard", "/kurs", "/trust".'),
            reason: z.string().describe('Short reason for navigation, for logging purposes.'),
        }),
        outputSchema: z.object({
            success: z.boolean(),
            command: z.string(),
        }),
    },
    async ({ path, reason }) => {
        return { success: true, command: `NAVIGATE_TO:${path}` };
    }
);

// Define the Chatbot Flow
export const siteChatbotFlow = ai.defineFlow(
    {
        name: 'siteChatbotFlow',
        inputSchema: ChatbotInputSchema,
        outputSchema: z.string(),
    },

    async (input, { sendChunk }) => {
        // Load Law Data — Static import for Vercel compatibility
        const lawData = lawDataRaw as any;

        let lawContext = "";
        try {
            // Extract the user's last message for keyword matching
            const lastUserMsg = input.messages
                .filter((m: any) => m.role === 'user')
                .pop()?.content?.toLowerCase() ?? "";

            // Check for specific article/recital references (e.g. "artikel 4", "art. 5", "paragraf 4", "§ 4")
            // Map "paragraf" or "§" to "Article" as EU Regulations use Articles
            const artMatches = [...lastUserMsg.matchAll(/(?:artikel|art\.?|paragraf|paragraph|§)\s*(\d+)/gi)].map(m => parseInt(m[1]));
            const recMatches = [...lastUserMsg.matchAll(/(?:erwägungsgrund|erw\.?|recital)\s*(\d+)/gi)].map(m => parseInt(m[1]));

            // Keywords from user message for fuzzy matching
            const stopwords = new Set(["der", "die", "das", "und", "oder", "ist", "ein", "eine", "was", "wie", "wer", "wo", "sagt", "steht", "dazu", "über", "zum", "zur", "bei", "mit", "von", "für", "auf", "in", "an", "zu", "es", "sich", "den", "dem", "des", "als", "auch", "nach", "noch", "nur", "aber", "wenn", "dann", "kann", "muss", "wird", "hat", "sind", "ich", "du", "sie", "er", "wir", "mir"]);
            const keywords = lastUserMsg
                .replace(/[^a-zäöüß\s]/gi, " ")
                .split(/\s+/)
                .filter((w: string) => w.length > 3 && !stopwords.has(w));

            // ... (rest of matching logic same as before) 
            // Collect matching articles
            const matchedArticles: string[] = [];
            const allArticleTitles: string[] = [];

            // Helper to get text safe
            const getArticleText = (a: any) => `${a.title ?? ''}\n${a.text}`;

            lawData.chapters?.forEach((c: any) => {
                c.articles?.forEach((a: any) => {
                    const artNum = parseInt(String(a.id).replace(/\D/g, ''));
                    allArticleTitles.push(`Art. ${artNum}: ${a.title ?? ''}`);

                    // Match by explicit reference
                    if (artMatches.includes(artNum)) {
                        matchedArticles.push(`[ARTICLE ${artNum}] ${getArticleText(a)}`);
                        return;
                    }

                    // Match by keyword in title/text (limit to prevent overload)
                    if (matchedArticles.length < 20 && keywords.length > 0) {
                        const searchText = getArticleText(a).toLowerCase();
                        const hits = keywords.filter((kw: string) => searchText.includes(kw));
                        if (hits.length >= 2 || (hits.length >= 1 && keywords.length <= 2)) {
                            matchedArticles.push(`[ARTICLE ${artNum}] ${getArticleText(a)}`);
                        }
                    }
                });
            });

            // Recitals logic...
            const matchedRecitals: string[] = [];
            lawData.recitals?.forEach((r: any) => {
                const recNum = parseInt(String(r.number));
                if (recMatches.includes(recNum)) {
                    matchedRecitals.push(`[RECITAL ${recNum}] ${r.text}`);
                    return;
                }
                if (matchedRecitals.length < 10 && keywords.length > 0) {
                    const hits = keywords.filter((kw: string) => r.text.toLowerCase().includes(kw));
                    if (hits.length >= 2) {
                        matchedRecitals.push(`[RECITAL ${recNum}] ${r.text}`);
                    }
                }
            });


            // Build compact context
            if (matchedArticles.length > 0 || matchedRecitals.length > 0) {
                lawContext = "EU AI ACT — RELEVANTE ABSCHNITTE:\n\n";
                if (matchedArticles.length > 0) {
                    lawContext += matchedArticles.join("\n\n") + "\n\n";
                }
                if (matchedRecitals.length > 0) {
                    lawContext += "ERWÄGUNGSGRÜNDE:\n" + matchedRecitals.join("\n\n") + "\n\n";
                }
            }

            // Always add compact article index so model knows what exists
            lawContext += "\nVERFÜGBARE ARTIKEL (Index):\n" + allArticleTitles.join("\n") + "\n";

        } catch (e) {
            console.error("Failed to process law data for chatbot:", e);
        }


        // System Prompt construction
        const systemPrompt = `
Du bist der intelligente Assistent für "EuKIGesetz Studio" (fortbildung.eukigesetz.com).
Deine Aufgabe: Nutzern helfen, die Plattform zu nutzen, den EU AI Act zu verstehen, und relevante Inhalte zu finden.
Antworte IMMER auf Deutsch, professionell und hilfsbereit.

**Zitatformat für EU AI Act:**
- Für Artikel: Schreibe "Artikel 5 [[Art. 5]]" — die [[Art. X]] Klammern werden im Frontend zu Links.
- Für Erwägungsgründe: Schreibe "Erwägungsgrund 12 [[Erw. 12]]".

**EU AI Act Kontext (relevante Abschnitte):**
${lawContext}

**Plattform-Wissen:**
${SITE_TREE}

${FEATURE_OVERVIEW}

${COMMON_QUESTIONS}

**Navigation:**
Wenn der Nutzer nach einer bestimmten Funktion oder Seite fragt, nutze IMMER das 'navigateTool' um direkt dorthin zu leiten.
Beispiel: "Wo kann ich ein Projekt anlegen?" → navigateTool mit path="/projects".

**Wichtig:**
- Sei proaktiv: Wenn ein Nutzer ein Thema anspricht, schlage relevante Seiten und Funktionen vor.
- Bei Rechtsfragen: Weise darauf hin, dass deine Antworten keine Rechtsberatung darstellen.
- Nutze die FAQ-Szenarien, um häufige Fragen schnell und strukturiert zu beantworten.
- Halte Antworten kompakt aber informativ. Nutze Aufzählungszeichen.
    `;

        // Prepare full message history, FILTERING OUT any existing system messages from input
        const userHistory = input.messages.filter(m => m.role !== 'system').map(m => ({
            role: m.role,
            content: [{ text: m.content }]
        }));

        // Combine System Prompt and Context into ONE single string
        let combinedSystemText = systemPrompt;
        if (input.currentPath) {
            combinedSystemText += `\n\nUser Context:\nUser is currently on page: ${input.currentPath}`;
        }

        // Create the SINGLE system message at the start
        const systemMessage = { role: 'system', content: [{ text: combinedSystemText }] };

        const fullMessages = [
            systemMessage,
            ...userHistory
        ] as any[];

        try {
            // Call the model
            const response = await ai.generate({
                model: 'googleai/gemini-2.0-flash',
                messages: fullMessages,
                tools: [navigateTool],
                config: {
                    temperature: 0.5,
                },
            });

            // Genkit response handling - tool calls logic
            const outputToolCalls = (response as any).toolCalls || (response.output as any)?.toolCalls;

            let finalText = response.text;

            if (outputToolCalls && outputToolCalls.length > 0) {
                const navCall = outputToolCalls.find((tc: any) => tc.toolName === 'navigateTool');
                if (navCall) {
                    const args = navCall.args as any;
                    finalText += `\n[NAVIGATE:${args.path}]`;
                }
            }

            return finalText;
        } catch (genError: any) {
            console.error("Chatbot ai.generate error:", genError);
            return "Entschuldigung, der Assistent ist momentan nicht erreichbar. Bitte versuche es später erneut.";
        }
    }
);
