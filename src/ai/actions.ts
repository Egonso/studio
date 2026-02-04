
'use server';

import { siteChatbotFlow } from '@/ai/flows/site-chatbot';

/**
 * Server Action to call the chatbot flow.
 * Wraps the Genkit flow execution to ensure clean serialization for the client.
 */
export async function callChatbotAction(input: any) {
    try {
        // We invoke the flow directly. RunFlow usually handles the context.
        // If siteChatbotFlow is exported as a flow, we can just call it if it's a function, 
        // or use runFlow(siteChatbotFlow, input) if that's the preferred pattern for the version.
        // Based on `dev.ts` imports, it seems flows are registerd.
        // However, importing the flow object and calling it is the standard way for server actions in Genkit + Next.js.

        // Fallback: If direct call fails due to context, we might need runFlow. 
        // But usually for 'use server', direct invocation works if the flow is defined in a file without side-effects that break boundaries.

        const result = await siteChatbotFlow(input);
        return { success: true, data: result };
    } catch (error: any) {
        console.error('Chatbot Action Error:', error);
        // Return a safe error object
        return {
            success: false,
            error: error.message || 'Unknown error occurred in chatbot action'
        };
    }
}
