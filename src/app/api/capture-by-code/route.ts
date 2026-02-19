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

// GET: Validate code and return register info
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    if (!code) {
      return NextResponse.json({ error: "Code parameter required" }, { status: 400 });
    }

    const codeDoc = await db.doc(`registerAccessCodes/${code}`).get();
    if (!codeDoc.exists) {
      return NextResponse.json({ error: "Ungültiger Code" }, { status: 404 });
    }

    const codeData = codeDoc.data()!;
    if (!codeData.isActive) {
      return NextResponse.json({ error: "Dieser Code ist nicht mehr aktiv" }, { status: 410 });
    }

    if (codeData.expiresAt && new Date(codeData.expiresAt) < new Date()) {
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
      label: codeData.label,
      organisationName: registerName,
    });
  } catch (error: any) {
    console.error("Code validation error:", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}

// POST: Create use case via access code (no auth required)
export async function POST(req: NextRequest) {
  try {
    const body: CaptureByCodeBody = await req.json();
    const { code, purpose, toolId, toolFreeText, usageContext, dataCategory, ownerName, organisation } = body;

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

    if (codeData.expiresAt && new Date(codeData.expiresAt) < new Date()) {
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
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
