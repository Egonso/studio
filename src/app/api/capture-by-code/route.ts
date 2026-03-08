import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { ZodError } from "zod";
import { parseUseCaseCard } from "@/lib/register-first/schema";
import { prepareUseCaseForStorage } from "@/lib/register-first/use-case-builder";
import { normalizeCaptureByCodeSelections } from "@/lib/capture-by-code/selections";

interface CaptureByCodeBody {
  code: string;
  purpose: string;
  toolId?: string;
  toolFreeText?: string;
  usageContext?: string;
  usageContexts?: string[];
  dataCategory?: string;
  dataCategories?: string[];
  decisionInfluence?: string | null;
  ownerRole?: string;
  ownerName?: string;
  contactPersonName?: string;
  organisation?: string;
}

// Simple in-memory rate limiting (use Redis for production scale)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_PER_CODE = 10; // 10 submissions per hour per code
const RATE_LIMIT_PER_IP = 100; // 100 submissions per day per IP
const RATE_WINDOW_CODE = 60 * 60 * 1000; // 1 hour
const RATE_WINDOW_IP = 24 * 60 * 60 * 1000; // 24 hours
const TEMPORARY_UNAVAILABLE_MESSAGE =
  "Dienst vorübergehend nicht verfügbar. Bitte versuchen Sie es in wenigen Minuten erneut.";

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

function parsePathSegment(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("/")) return null;
  return trimmed;
}

function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveCodeScope(
  codeData: Record<string, unknown>
): { ownerId: string; registerId: string } | null {
  const ownerId =
    parsePathSegment(codeData.ownerId) ??
    parsePathSegment(codeData.userId) ??
    parsePathSegment(codeData.ownerUid);
  const registerId =
    parsePathSegment(codeData.registerId) ??
    parsePathSegment(codeData.targetRegisterId) ??
    parsePathSegment(codeData.projectId);

  if (!ownerId || !registerId) return null;
  return { ownerId, registerId };
}

function mapOperationalError(error: unknown): { status: number; message: string } {
  const message = String(
    (error as { message?: unknown } | undefined)?.message ?? ""
  ).toLowerCase();
  const code = String(
    (error as { code?: unknown } | undefined)?.code ?? ""
  ).toLowerCase();
  const details = String(
    (error as { details?: unknown } | undefined)?.details ?? ""
  ).toLowerCase();
  const status = Number(
    (error as { status?: unknown; statusCode?: unknown } | undefined)?.status ??
    (error as { statusCode?: unknown } | undefined)?.statusCode ??
    0
  );
  const signature = `${message} ${code} ${details}`;

  if ([401, 403, 429, 500, 502, 503, 504].includes(status)) {
    return {
      status: 503,
      message: TEMPORARY_UNAVAILABLE_MESSAGE,
    };
  }

  if (
    message.includes("could not load the default credentials") ||
    message.includes("failed to determine service account") ||
    code.includes("invalid-credential")
  ) {
    return {
      status: 503,
      message: TEMPORARY_UNAVAILABLE_MESSAGE,
    };
  }

  if (
    code.includes("permission-denied") ||
    code.includes("unauthenticated") ||
    code.includes("unavailable") ||
    code.includes("deadline-exceeded") ||
    code.includes("resource-exhausted") ||
    message.includes("permission_denied")
  ) {
    return {
      status: 503,
      message: TEMPORARY_UNAVAILABLE_MESSAGE,
    };
  }

  if (
    signature.includes("permission denied") ||
    signature.includes("missing or insufficient permissions") ||
    signature.includes("service unavailable") ||
    signature.includes("deadline exceeded") ||
    signature.includes("network error") ||
    signature.includes("socket hang up")
  ) {
    return {
      status: 503,
      message: TEMPORARY_UNAVAILABLE_MESSAGE,
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
    const scope = resolveCodeScope(codeData as Record<string, unknown>);
    if (!scope) {
      console.warn("Invalid access-code scope", {
        code,
        keys: Object.keys(codeData ?? {}),
      });
      return NextResponse.json({ error: "Ungültiger Code" }, { status: 404 });
    }

    const registerDoc = await db
      .doc(`users/${scope.ownerId}/registers/${scope.registerId}`)
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
    const {
      code: rawCode,
      purpose,
      toolId,
      toolFreeText,
      usageContext,
      usageContexts,
      dataCategory,
      dataCategories,
      decisionInfluence,
      ownerRole,
      ownerName,
      contactPersonName,
      organisation,
    } = body;
    const code = rawCode ? normalizeCode(rawCode) : "";
    const normalizedOwnerRole =
      normalizeOptionalText(ownerRole) ?? normalizeOptionalText(ownerName);
    const normalizedContactPersonName = normalizeOptionalText(contactPersonName);
    const normalizedOrganisation = normalizeOptionalText(organisation);
    const normalizedSelections = normalizeCaptureByCodeSelections({
      usageContext,
      usageContexts,
      dataCategory,
      dataCategories,
      decisionInfluence,
    });

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
    if (!code || !purpose?.trim() || !normalizedOwnerRole) {
      return NextResponse.json(
        { error: "Code, Use-Case Name und Owner-Rolle sind Pflichtfelder" },
        { status: 400 }
      );
    }

    if (normalizedOwnerRole.length < 2) {
      return NextResponse.json(
        { error: "Owner-Rolle muss mindestens 2 Zeichen haben" },
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

    const scope = resolveCodeScope(codeData as Record<string, unknown>);
    if (!scope) {
      return NextResponse.json({ error: "Ungültiger Code" }, { status: 404 });
    }
    const { ownerId, registerId } = scope;

    // Create UseCaseCard under the admin's register path
    const useCaseId = crypto.randomUUID();
    const cardDraft = prepareUseCaseForStorage(
      {
        purpose: purpose.trim(),
        usageContexts: normalizedSelections.usageContexts,
        isCurrentlyResponsible: false,
        responsibleParty: normalizedOwnerRole,
        contactPersonName: normalizedContactPersonName,
        decisionImpact: "UNSURE",
        decisionInfluence: normalizedSelections.decisionInfluence,
        toolId: toolId || undefined,
        toolFreeText: normalizeOptionalText(toolFreeText) ?? undefined,
        dataCategory: normalizedSelections.dataCategory,
        dataCategories: normalizedSelections.dataCategories,
        organisation: normalizedOrganisation,
      },
      {
        useCaseId,
      }
    );

    const card = parseUseCaseCard({
      ...cardDraft,
      capturedBy: "ANONYMOUS",
      capturedByName: normalizedContactPersonName ?? undefined,
      capturedViaCode: true,
      accessCodeLabel: codeData.label,
    });

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
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Bitte überprüfe die eingegebenen Angaben." },
        { status: 400 }
      );
    }
    console.error("Capture by code error:", error);
    const mapped = mapOperationalError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
