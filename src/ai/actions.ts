
'use server';

import { siteChatbotFlow } from '@/ai/flows/site-chatbot';

/**
 * Server Action to call the chatbot flow.
 * Wraps the Genkit flow execution to ensure clean serialization for the client.
 */
export async function callChatbotAction(input: any) {
    try {
        const result = await siteChatbotFlow(input);
        // Ensure result is always a plain string for serialization
        const text = typeof result === 'string' ? result : String(result ?? '');
        return { success: true, data: text };
    } catch (error: any) {
        console.error('Chatbot Action Error:', error);
        return {
            success: false,
            error: error.message || 'Unknown error occurred in chatbot action'
        };
    }
}
