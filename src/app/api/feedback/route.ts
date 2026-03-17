import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/firebase-admin";
import { logError } from '@/lib/observability/logger';
import { requireUser, ServerAuthError } from '@/lib/server-auth';
import {
  buildRateLimitKey,
  enforceRequestRateLimit,
  safeEmailSchema,
  safeIdentifierSchema,
  safeOptionalPlainTextSchema,
  safePlainTextSchema,
} from '@/lib/security/request-security';

const FeedbackSchema = z.object({
  type: z.enum(["bug", "feature", "support"]),
  message: safePlainTextSchema('Nachricht', { min: 3, max: 2000 }),
  path: safeOptionalPlainTextSchema('Pfad', { max: 500 }),
  userId: safeIdentifierSchema.optional(),
  userEmail: safeEmailSchema.optional().or(z.literal("")),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = FeedbackSchema.parse(body);
    const authorization = request.headers.get('authorization');
    const actor = authorization ? await requireUser(authorization) : null;

    const rateLimit = await enforceRequestRateLimit({
      request,
      namespace: 'feedback-submit',
      key: buildRateLimitKey(request, actor?.uid ?? 'anonymous'),
      limit: 8,
      windowMs: 60 * 60 * 1000,
      logContext: {
        actorUserId: actor?.uid ?? null,
      },
    });

    if (!rateLimit.ok) {
      return NextResponse.json(
        { success: false, error: 'Zu viele Feedback-Anfragen in kurzer Zeit.' },
        { status: 429 },
      );
    }

    if (actor && data.userId && data.userId !== actor.uid) {
      return NextResponse.json(
        { success: false, error: 'Ungültige Benutzerzuordnung.' },
        { status: 403 },
      );
    }

    if (
      actor &&
      data.userEmail &&
      data.userEmail.length > 0 &&
      data.userEmail.toLowerCase() !== actor.email
    ) {
      return NextResponse.json(
        { success: false, error: 'Ungültige E-Mail-Zuordnung.' },
        { status: 403 },
      );
    }

    const feedbackRef = db.collection("feedback").doc();
    await feedbackRef.set({
      ...data,
      userId: actor?.uid ?? data.userId ?? null,
      userEmail: actor?.email ?? (data.userEmail?.trim() || null),
      status: "open",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, id: feedbackRef.id });
  } catch (error: any) {
    if (error instanceof ServerAuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message ?? "Ungültige Eingaben." },
        { status: 400 }
      );
    }

    logError('feedback_submit_failed', {
      errorMessage: error instanceof Error ? error.message : 'unknown_error',
    });
    return NextResponse.json(
      { success: false, error: error?.message ?? "Feedback konnte nicht gespeichert werden." },
      { status: 500 }
    );
  }
}
