
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

        // System Prompt construction
        const systemPrompt = `
You are the intelligent assistant for "EuKIGesetz Studio".
Your role is to help users navigate the platform, understand the EU AI Act tools we offer, and find specific content.

**Knowledge Base (Routes):**
- /dashboard: The main Compliance Dashboard.
- /kurs: The "AI-Act-Kompetenz" Course overview.
- /trust: Trust Portal and Certification status.
- /profile: User profile and settings.
- /tools: Library of AI tools and compliance resources.

**Capabilities:**
- Answer questions about the platform functions.
- Explain general EU AI Act concepts (informational only).
- Navigate the user to relevant pages using the 'navigateTool'. ALWAYS use this tool if the user asks to go somewhere or looks for a specific tool/page.

**Legal Disclaimer:**
IMPORTANT: You must always maintain a helpful but professional tone.
If the user asks for legal advice, you MUST explicitly state: "I am an AI assistant. My responses are for informational purposes only and do not constitute legal advice."
    `;

        // Call the model
        // Note: We use 'googleai/gemini-3-flash-preview' as requested.
        const response = await ai.generate({
            model: 'googleai/gemini-3-flash-preview',
            prompt: [
                { role: 'system', content: [{ text: systemPrompt }] },
                ...input.messages.map(m => ({ role: m.role, content: [{ text: m.content }] })),
                // Add current context if needed
                ...(input.currentPath ? [{ role: 'system', content: [{ text: `User is currently on page: ${input.currentPath}` }] }] : [])
            ] as any, // Cast to any to avoid strict typing issues with the message structure if needed
            tools: [navigateTool],
            config: {
                temperature: 0.7,
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

        const toolCalls = response.toolCalls;
        let finalText = response.text;

        if (toolCalls && toolCalls.length > 0) {
            // Check for navigate tool
            const navCall = toolCalls.find(tc => tc.toolName === 'navigateTool');
            if (navCall) {
                // We append a special marker for the frontend
                const args = navCall.args as any;
                finalText += `\n[NAVIGATE:${args.path}]`;
            }
        }

        return finalText;
    }
);
