import { NextRequest, NextResponse } from "next/server";

import { generateSectionImprovement } from "@/lib/policy-engine/ai-assistant";
import { db } from "@/lib/firebase-admin";
import { resolveRegisterPlan } from "@/lib/register-first/entitlement";
import type { Register } from "@/lib/register-first/types";
import {
  ServerAuthError,
  requireRegisterOwner,
  requireUser,
} from "@/lib/server-auth";

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RESET_INTERVAL = 24 * 60 * 60 * 1000;
const PRO_LIMIT = 5;

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
    const { section, orgName, industry, registerId } = await req.json();

    if (!section || !section.title || !section.content) {
      return NextResponse.json({ error: "Invalid section data" }, { status: 400 });
    }

    const activeRegister = registerId
      ? (await requireRegisterOwner(authorizationHeader, registerId)).register
      : await resolveRegisterForUser(decoded.uid, registerId);
    if (!activeRegister) {
      return NextResponse.json({ error: "Register context not found" }, { status: 404 });
    }

    const plan = resolveRegisterPlan(activeRegister);

    if (plan === "free") {
      return NextResponse.json(
        { error: "AI Schreibhilfe ist im Governance Control Center verfügbar." },
        { status: 403 }
      );
    }

    if (plan === "pro") {
      const key = `${decoded.uid}:${activeRegister.registerId}:policy-improve`;
      const now = Date.now();
      const usage = rateLimitMap.get(key) || { count: 0, lastReset: now };

      if (now - usage.lastReset > RESET_INTERVAL) {
        usage.count = 0;
        usage.lastReset = now;
      }

      if (usage.count >= PRO_LIMIT) {
        return NextResponse.json(
          { error: "Tageslimit für KI-Verbesserungen erreicht (5/Tag)." },
          { status: 429 }
        );
      }

      rateLimitMap.set(key, { ...usage, count: usage.count + 1 });
    }

    const improvedText = await generateSectionImprovement(section, { orgName, industry });

    return NextResponse.json({
      success: true,
      improvedContent: improvedText,
    });
  } catch (error: any) {
    if (error instanceof ServerAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Policy Improve API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
