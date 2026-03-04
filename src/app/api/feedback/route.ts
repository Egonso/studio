import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/firebase-admin";

const FeedbackSchema = z.object({
  type: z.enum(["bug", "feature", "support"]),
  message: z.string().min(3, "Nachricht muss mindestens 3 Zeichen lang sein"),
  path: z.string().optional(),
  userId: z.string().optional(),
  userEmail: z.string().email().optional().or(z.literal("")),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = FeedbackSchema.parse(body);

    const feedbackRef = db.collection("feedback").doc();
    await feedbackRef.set({
      ...data,
      status: "open",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, id: feedbackRef.id });
  } catch (error: any) {
    console.error("Feedback API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message ?? "Ungültige Eingaben." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error?.message ?? "Feedback konnte nicht gespeichert werden." },
      { status: 500 }
    );
  }
}
