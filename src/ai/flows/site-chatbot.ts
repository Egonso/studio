'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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

const ChatbotOutputSchema = z.object({
    text: z.string(),
    toolCalls: z.array(z.any()).optional(), // To capture tool calls if needed manually, though genkit handles execution usually
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
        // Ideally, this tool just signals the frontend. 
        // In Genkit server-side, we can't "force" the client to move unless we return a structured signal.
        // We will return a specific string that the frontend looks for, or rely on the tool call structure itself if using generate().
        return { success: true, command: `NAVIGATE_TO:${path}` };
    }
);


// Define the Chatbot Flow
export const siteChatbotFlow = ai.defineFlow(
    {
        name: 'siteChatbotFlow',
        inputSchema: ChatbotInputSchema,
        outputSchema: z.string(), // We'll return the text response directly for simplicity in the stream
    },
    async (input, { sendChunk }) => {
        // Load Law Data
        const fs = await import('fs');
        const path = await import('path');

        let lawContext = "";
        try {
            const filePath = path.join(process.cwd(), 'src/data/eu-ai-act.json');
            if (fs.existsSync(filePath)) {
                const lawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

                // Format for context (optimized for token usage/readability)
                lawContext = "EU AI ACT FULL TEXT START:\n";

                // Add Recitals
                lawContext += "RECITALS (Erwägungsgründe):\n";
                lawData.recitals.forEach((r: any) => {
                    lawContext += `[RECITAL:${r.id}] (${r.number}) ${r.text}\n`;
                });

                // Add Articles
                lawContext += "\nARTICLES (Gesetzestext):\n";
                lawData.chapters.forEach((c: any) => {
                    lawContext += `CHAPTER: ${c.title}\n`;
                    c.articles.forEach((a: any) => {
                        lawContext += `[ARTICLE:${a.id}] ${a.text}\n`;
                    });
                });
                lawContext += "EU AI ACT FULL TEXT END.\n";
            }
        } catch (e) {
            console.error("Failed to load law data for chatbot:", e);
        }

        // System Prompt construction
        const systemPrompt = `
You are the intelligent assistant for "EuKIGesetz Studio".
Your role is to help users navigate the platform, understand the EU AI Act tools we offer, and find specific content.

**Context - EU AI Act:**
You have access to the FULL text of the EU AI Act below. Use this to answer questions about the law.
When quoting or referencing the law, you MUST provide citations in the following format:
- For Recitals: [[Recital X]](id:rct_X) -> Output as [[Erwagungsgrund X]] and I will handle it? No, output as plaintext [[Erw. X]] or whatever, but preferably consistent ID.
- BETTER INSTRUCTION: 
  - If referring to Article 5, write "Artikel 5 [[Art. 5]]".
  - If referring to Recital 10, write "Erwägungsgrund 10 [[Erw. 10]]".
  - The format [[ShortLabel]] will be converted to links by the frontend.
  - The frontend maps:
    - [[Art. X]] -> links to #art_X (or whatever regex matches)
    - [[Erw. X]] -> links to #rct_X
  
  Please strictly use: [[Art. NUMBER]] for Articles and [[Erw. NUMBER]] for Recitals.
  Example: "Das ist in Artikel 5 [[Art. 5]] verboten." or "Siehe Erwägungsgrund 12 [[Erw. 12]]."

${lawContext}

**Knowledge Base (Routes):**
- /dashboard: The main Compliance Dashboard.
- /gesetz: The full text viewer of the EU AI Act.
- /kurs: The "AI-Act-Kompetenz" Course overview.
- /trust: Trust Portal and Certification status.
- /profile: User profile and settings.
- /tools: Library of AI tools and compliance resources.

**Capabilities:**
- Answer questions about the platform functions.
- Answer questions about the EU AI Act using the provided text. BE PRECISE.
- Navigate the user to relevant pages using the 'navigateTool'. ALWAYS use this tool if the user asks to go somewhere or looks for a specific tool/page.

**Legal Disclaimer:**
IMPORTANT: You must always maintain a helpful but professional tone.
If the model is asked for legal advice, explicitly state: "I am an AI assistant. My responses are for informational purposes only and do not constitute legal advice."
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

        // Call the model
        const response = await ai.generate({
            model: 'googleai/gemini-3-flash-preview',
            messages: fullMessages,
            tools: [navigateTool],
            config: {
                temperature: 0.5,
            },
        });

        // Handle tool calls in the response if any (Genkit usually auto-executes if configured, but here we might want to pass the signal)
        // For a simple chatbot, if the tool execution returns a "NAVIGATE_TO" command, we might want to append that to the text
        // or handle it in the frontend by parsing the tool calls.
        // For this implementation, let's return the output text.
        // If the tool was called, Genkit's 'generate' with auto-execution would run it. 
        // However, since 'navigate' is a client-side action, the server-side tool execution is just a placeholder.
        // A better pattern for client-actions is to let the model output the tool call, and the client executes it.
        // But since we are inside a server flow, we can let the tool return a specific marker.

        // Genkit response handling - tool calls logic
        // Depending on genkit version, toolCalls might be directly on response or inside output/message
        // The previous error was specifically about input format, so that's covered.
        // For toolCalls, let's keep it safe.
        const outputToolCalls = (response as any).toolCalls || (response.output as any)?.toolCalls;

        let finalText = response.text;

        if (outputToolCalls && outputToolCalls.length > 0) {
            // Check for navigate tool
            const navCall = outputToolCalls.find((tc: any) => tc.toolName === 'navigateTool');
            if (navCall) {
                // We append a special marker for the frontend
                const args = navCall.args as any;
                finalText += `\n[NAVIGATE:${args.path}]`;
            }
        }

        return finalText;
    }
);
