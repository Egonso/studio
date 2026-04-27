import { NextRequest, NextResponse } from "next/server";
import { z } from 'zod';

import { generateSectionImprovement } from "@/lib/policy-engine/ai-assistant";
import { resolveGovernanceCopyLocale } from "@/lib/i18n/governance-copy";
import { db } from "@/lib/firebase-admin";
import { logError } from '@/lib/observability/logger';
import { resolveRegisterPlan } from "@/lib/register-first/entitlement";
import type { Register } from "@/lib/register-first/types";
import {
  ServerAuthError,
  requireRegisterOwner,
  requireUser,
} from "@/lib/server-auth";
import {
  buildRateLimitKey,
  enforceRequestRateLimit,
  safeIdentifierSchema,
  safePlainTextSchema,
} from '@/lib/security/request-security';

const PRO_LIMIT = 5;

const PolicyImproveSchema = z.object({
  section: z.object({
    sectionId: safeIdentifierSchema,
    title: safePlainTextSchema('Titel', { max: 200 }),
    content: safePlainTextSchema('Inhalt', { max: 12000 }),
    order: z.number().int().min(0).max(1000),
    isConditional: z.boolean(),
    conditionLabel: safePlainTextSchema('Bedingung', { max: 240 }).optional(),
  }),
  orgName: safePlainTextSchema('Organisationsname', { max: 160 }).optional(),
  industry: safePlainTextSchema('Branche', { max: 160 }).optional(),
  registerId: safeIdentifierSchema.optional(),
  locale: z.enum(['de', 'en']).optional(),
});

function getPolicyImproveErrorCopy(locale?: string | null) {
  return resolveGovernanceCopyLocale(locale) === 'de'
    ? {
        aiUnavailable:
          'KI-Schreibhilfe ist im Governance Control Center verfügbar.',
        rateLimit: 'Tageslimit für KI-Verbesserungen erreicht (5/Tag).',
        invalidInput: 'Ungültige Eingabe.',
      }
    : {
        aiUnavailable:
          'The AI writing assistant is available in the Governance Control Center.',
        rateLimit: 'Daily limit for AI improvements reached (5/day).',
        invalidInput: 'Invalid input.',
      };
}

async function resolveRegisterForUser(
  userId: string,
  registerId?: string | null
): Promise<(Register & { registerId: string }) | null> {
  if (registerId) {
    const snapshot = await db.doc(`users/${userId}/registers/${registerId}`).get();
    if (!snapshot.exists) {
      return null;
    }
    return snapshot.data() as Register & { registerId: string };
  }

  const snapshot = await db
    .collection(`users/${userId}/registers`)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  const doc = snapshot.docs[0];
  return doc ? (doc.data() as Register & { registerId: string }) : null;
}

export async function POST(req: NextRequest) {
  try {
    const authorizationHeader = req.headers.get("authorization");
    const decoded = await requireUser(authorizationHeader);
    const { section, orgName, industry, registerId, locale } =
      PolicyImproveSchema.parse(await req.json());
    const copy = getPolicyImproveErrorCopy(locale);

    const activeRegister = registerId
      ? (await requireRegisterOwner(authorizationHeader, registerId)).register
      : await resolveRegisterForUser(decoded.uid, registerId);
    if (!activeRegister) {
      return NextResponse.json({ error: "Register context not found" }, { status: 404 });
    }

    const plan = resolveRegisterPlan(activeRegister);

    if (plan === "free") {
      return NextResponse.json(
        { error: copy.aiUnavailable },
        { status: 403 }
      );
    }

    if (plan === "pro") {
      const rateLimit = await enforceRequestRateLimit({
        request: req,
        namespace: 'policy-improve',
        key: buildRateLimitKey(
          req,
          decoded.uid,
          activeRegister.registerId,
          'policy-improve',
        ),
        limit: PRO_LIMIT,
        windowMs: 24 * 60 * 60 * 1000,
        logContext: {
          actorUserId: decoded.uid,
          registerId: activeRegister.registerId,
        },
      });

      if (!rateLimit.ok) {
        return NextResponse.json(
          { error: copy.rateLimit },
          { status: 429 }
        );
      }
    }

    const improvedText = await generateSectionImprovement(section, { orgName, industry, locale });

    return NextResponse.json({
      success: true,
      improvedContent: improvedText,
    });
  } catch (error: any) {
    if (error instanceof ServerAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      const acceptLanguage = req.headers.get('accept-language');
      const copy = getPolicyImproveErrorCopy(acceptLanguage);
      return NextResponse.json(
        { error: error.issues[0]?.message ?? copy.invalidInput },
        { status: 400 },
      );
    }

    logError('policy_improve_failed', {
      errorMessage: error instanceof Error ? error.message : 'unknown_error',
    });
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
