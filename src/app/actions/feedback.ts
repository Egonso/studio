"use server";

import { db } from "@/lib/firebase-admin";
import { z } from "zod";

// Schema for feedback validation
const FeedbackSchema = z.object({
    type: z.enum(['bug', 'feature', 'support']),
    message: z.string().min(3, "Nachricht muss mindestens 3 Zeichen lang sein"),
    path: z.string().optional(),
    userId: z.string().optional(),
    userEmail: z.string().email().optional().or(z.literal('')),
    metadata: z.record(z.any()).optional(),
});

export type FeedbackInput = z.infer<typeof FeedbackSchema>;

export async function submitFeedback(input: FeedbackInput) {
    try {
        const data = FeedbackSchema.parse(input);

        const feedbackRef = db.collection('feedback').doc();
        await feedbackRef.set({
            ...data,
            status: 'open',
            createdAt: new Date().toISOString(), // Use ISO string for consistency
        });

        return { success: true, id: feedbackRef.id };
    } catch (error: any) {
        console.error("Error submitting feedback:", error);
        return { success: false, error: error.message };
    }
}
