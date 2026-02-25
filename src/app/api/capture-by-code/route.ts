import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

interface CaptureByCodeBody {
  code: string;
  purpose: string;
  toolId?: string;
  toolFreeText?: string;
  usageContext: string;
  dataCategory: string;
  ownerName: string;
  organisation?: string;
}

// Simple in-memory rate limiting (use Redis for production scale)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_PER_CODE = 10; // 10 submissions per hour per code
const RATE_LIMIT_PER_IP = 100; // 100 submissions per day per IP
const RATE_WINDOW_CODE = 60 * 60 * 1000; // 1 hour
const RATE_WINDOW_IP = 24 * 60 * 60 * 1000; // 24 hours

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

function parseExpiresAt(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  ) {
    const parsed = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function mapOperationalError(error: unknown): { status: number; message: string } {
  const message = String(
    (error as { message?: unknown } | undefined)?.message ?? ""
  ).toLowerCase();
  const code = String(
    (error as { code?: unknown } | undefined)?.code ?? ""
  ).toLowerCase();

  if (
    message.includes("could not load the default credentials") ||
    message.includes("failed to determine service account") ||
    code.includes("invalid-credential")
  ) {
    return {
      status: 503,
      message:
        "Dienst vorübergehend nicht verfügbar. Bitte versuchen Sie es in wenigen Minuten erneut.",
    };
  }

  if (
    code.includes("permission-denied") ||
    message.includes("permission_denied")
  ) {
    return {
      status: 503,
      message:
        "Dienst vorübergehend nicht verfügbar. Bitte versuchen Sie es in wenigen Minuten erneut.",
    };
  }

  return { status: 500, message: "Interner Fehler" };
}

function checkRateLimit(key: string, limit: number, window: number): boolean {
  const now = Date.now();
  const rateData = rateLimitMap.get(key);

  if (!rateData || now > rateData.resetAt) {
    // Reset or first request
    rateLimitMap.set(key, { count: 1, resetAt: now + window });
    return true;
  }

  if (rateData.count >= limit) {
    return false; // Rate limit exceeded
  }

  rateData.count++;
  return true;
}

// GET: Validate code and return register info
export async function GET(req: NextRequest) {
  try {
    const rawCode = req.nextUrl.searchParams.get("code");
    const code = rawCode ? normalizeCode(rawCode) : "";
    if (!code) {
      return NextResponse.json({ error: "Code parameter required" }, { status: 400 });
    }
    if (code.length < 4) {
      return NextResponse.json({ error: "Ungültiger Code" }, { status: 400 });
    }

    const codeDoc = await db.doc(`registerAccessCodes/${code}`).get();
    if (!codeDoc.exists) {
      return NextResponse.json({ error: "Ungültiger Code" }, { status: 404 });
    }

    const codeData = codeDoc.data()!;
    if (!codeData.isActive) {
      return NextResponse.json({ error: "Dieser Code ist nicht mehr aktiv" }, { status: 410 });
    }

    const expiresAt = parseExpiresAt(codeData.expiresAt);
    if (expiresAt && expiresAt < new Date()) {
      return NextResponse.json({ error: "Dieser Code ist abgelaufen" }, { status: 410 });
    }

    // Get register name for display
    const registerDoc = await db
      .doc(`users/${codeData.ownerId}/registers/${codeData.registerId}`)
      .get();

    const registerName = registerDoc.exists
      ? registerDoc.data()?.organisationName || registerDoc.data()?.name
      : null;

    return NextResponse.json({
      valid: true,
      code,
      label: codeData.label,
      organisationName: registerName,
    });
  } catch (error: any) {
    console.error("Code validation error:", error);
    const mapped = mapOperationalError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}

// POST: Create use case via access code (no auth required)
export async function POST(req: NextRequest) {
  try {
    const body: CaptureByCodeBody = await req.json();
    const { code: rawCode, purpose, toolId, toolFreeText, usageContext, dataCategory, ownerName, organisation } = body;
    const code = rawCode ? normalizeCode(rawCode) : "";

    if (code) {
      if (!checkRateLimit(`code:${code}`, RATE_LIMIT_PER_CODE, RATE_WINDOW_CODE)) {
        return NextResponse.json(
          { error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." },
          { status: 429 }
        );
      }
    }

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(`ip:${ip}`, RATE_LIMIT_PER_IP, RATE_WINDOW_IP)) {
      return NextResponse.json(
        { error: "Zu viele Anfragen von Ihrer IP-Adresse." },
        { status: 429 }
      );
    }

    // Validate required fields
    if (!code || !purpose?.trim() || !ownerName?.trim()) {
      return NextResponse.json(
        { error: "Code, Use-Case Name und Verantwortlich sind Pflichtfelder" },
        { status: 400 }
      );
    }

    if (ownerName.trim().length < 2) {
      return NextResponse.json(
        { error: "Name muss mindestens 2 Zeichen haben" },
        { status: 400 }
      );
    }

    // Validate code
    const codeDoc = await db.doc(`registerAccessCodes/${code}`).get();
    if (!codeDoc.exists) {
      return NextResponse.json({ error: "Ungültiger Code" }, { status: 404 });
    }

    const codeData = codeDoc.data()!;
    if (!codeData.isActive) {
      return NextResponse.json({ error: "Dieser Code ist nicht mehr aktiv" }, { status: 410 });
    }

    const expiresAt = parseExpiresAt(codeData.expiresAt);
    if (expiresAt && expiresAt < new Date()) {
      return NextResponse.json({ error: "Dieser Code ist abgelaufen" }, { status: 410 });
    }

    const { ownerId, registerId } = codeData;

    // Create UseCaseCard under the admin's register path
    const now = new Date().toISOString();
    const useCaseId = crypto.randomUUID();

    const card = {
      cardVersion: "1.1",
      useCaseId,
      createdAt: now,
      updatedAt: now,
      purpose: purpose.trim(),
      usageContexts: [usageContext || "INTERNAL_ONLY"],
      responsibility: {
        isCurrentlyResponsible: false,
        responsibleParty: ownerName.trim(),
      },
      decisionImpact: "UNSURE",
      affectedParties: [],
      status: "UNREVIEWED",
      reviewHints: [],
      evidences: [],
      reviews: [],
      proof: null,
      toolId: toolId || undefined,
      toolFreeText: toolFreeText || undefined,
      dataCategory: dataCategory || "NONE",
      organisation: organisation?.trim() || null,
      standardVersion: "EUKI-UC-1.2",
      formatVersion: "v1.1",
      isPublicVisible: false,
      // Audit metadata
      capturedBy: "ANONYMOUS",
      capturedByName: ownerName.trim(),
      capturedViaCode: true,
      accessCodeLabel: codeData.label,
    };

    // Write to Firestore under admin's register
    await db
      .doc(`users/${ownerId}/registers/${registerId}/useCases/${useCaseId}`)
      .set(card);

    // Increment usage count
    await db.doc(`registerAccessCodes/${code}`).update({
      usageCount: FieldValue.increment(1),
    });

    return NextResponse.json({
      success: true,
      useCaseId,
      purpose: card.purpose,
    });
  } catch (error: any) {
    console.error("Capture by code error:", error);
    const mapped = mapOperationalError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
