import { NextResponse } from "next/server";
import { z } from "zod";

import { generateDraftAssist } from "@/ai/flows/draft-assist-generate";
import {
  DraftAssistAssistResultSchema,
  DraftAssistContextSchema,
} from "@/lib/draft-assist/types";
import { logError } from "@/lib/observability/logger";
import {
  ServerAuthError,
  requireUser,
  type AuthenticatedRequestUser,
} from "@/lib/server-auth";
import {
  buildRateLimitKey,
  enforceRequestRateLimit,
  safePlainTextSchema,
} from "@/lib/security/request-security";

const DraftAssistRequestSchema = z.object({
  description: safePlainTextSchema("Beschreibung", {
    min: 50,
    max: 2000,
  }),
  context: DraftAssistContextSchema.nullable().optional(),
});

interface DraftAssistRouteDeps {
  generate?: typeof generateDraftAssist;
  enforceRateLimit?: typeof enforceRequestRateLimit;
  requireAuthenticatedUser?: typeof requireUser;
}

async function resolveActor(
  request: Request,
  requireAuthenticatedUser: typeof requireUser,
): Promise<AuthenticatedRequestUser | null> {
  const authorizationHeader = request.headers.get("authorization");

  if (!authorizationHeader?.trim()) {
    return null;
  }

  return requireAuthenticatedUser(authorizationHeader);
}

function createDraftAssistPostHandler(
  deps: DraftAssistRouteDeps = {},
) {
  const generate = deps.generate ?? generateDraftAssist;
  const enforceRateLimit = deps.enforceRateLimit ?? enforceRequestRateLimit;
  const requireAuthenticatedUser =
    deps.requireAuthenticatedUser ?? requireUser;

  return async function POST(request: Request) {
    try {
      const actor = await resolveActor(request, requireAuthenticatedUser);
      const payload = DraftAssistRequestSchema.parse(await request.json());

      const rateLimit = await enforceRateLimit({
        request,
        namespace: "draft-assist",
        key: buildRateLimitKey(
          request,
          actor?.uid ?? "guest",
          payload.description.slice(0, 80),
        ),
        limit: actor ? 24 : 8,
        windowMs: 60 * 60 * 1000,
        logContext: {
          actorUserId: actor?.uid ?? null,
          authenticated: Boolean(actor),
        },
      });

      if (!rateLimit.ok) {
        return NextResponse.json(
          { error: "Zu viele Assist-Anfragen in kurzer Zeit." },
          { status: 429 },
        );
      }

      const result = DraftAssistAssistResultSchema.parse(
        await generate({
          description: payload.description,
          context: payload.context ?? null,
        }),
      );

      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof ServerAuthError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status },
        );
      }

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.issues[0]?.message ?? "Ungültige Eingabe." },
          { status: 400 },
        );
      }

      logError("draft_assist_request_failed", {
        errorMessage: error instanceof Error ? error.message : "unknown_error",
      });

      return NextResponse.json(
        { error: "Entwurf konnte gerade nicht erzeugt werden." },
        { status: 500 },
      );
    }
  };
}

export const POST = createDraftAssistPostHandler();
