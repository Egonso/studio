import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { registerId, toolName, purpose, dataCategory, aiActCategory, responsibleParty, supplierEmail } = body;

        if (!registerId || !toolName || !supplierEmail) {
            return NextResponse.json({ error: "Fehlende Pflichtfelder (Register, Tool-Name oder Email)" }, { status: 400 });
        }

        // Verify the register exists
        const registerQuery = await db.collectionGroup("registers").where("registerId", "==", registerId).limit(1).get();

        if (registerQuery.empty) {
            return NextResponse.json({ error: "Register nicht gefunden / Ungültiger Magic Link" }, { status: 404 });
        }

        const registerDoc = registerQuery.docs[0];
        const registerRef = registerDoc.ref;
        const organisationName = registerDoc.data()?.organisationName || "";

        const useCaseId = crypto.randomUUID();
        const now = new Date().toISOString();

        const newUseCase = {
            cardVersion: "1.2",
            useCaseId,
            createdAt: now,
            updatedAt: now,
            purpose: purpose || "Vom Systemlieferant übermittelt",
            toolId: "other",
            toolFreeText: toolName,
            usageContexts: ["EXTERNAL_PUBLIC"],
            responsibility: {
                isCurrentlyResponsible: false,
                responsibleParty: responsibleParty || supplierEmail,
            },
            decisionImpact: "UNSURE",
            affectedParties: [],
            status: "draft",
            reviewHints: ["Neu erfasst via Lieferanten-Anfrage"],
            evidences: [],
            reviews: [],
            proof: null,
            dataCategory: dataCategory || "NONE",
            organisation: organisationName,
            labels: [{ key: "source", value: "supplier_request" }, { key: "supplier_email", value: supplierEmail }],
            governanceAssessment: {
                core: {
                    aiActCategory: aiActCategory || "Unbekannt",
                    assessedAt: now,
                },
                flex: {
                    iso: {
                        reviewCycle: "unknown",
                        oversightModel: "unknown",
                        documentationLevel: "unknown",
                        lifecycleStatus: "pilot",
                    },
                    portfolio: {
                        valueScore: null,
                        valueRationale: null,
                        riskScore: null,
                        riskRationale: null,
                        strategyTag: null,
                    }
                }
            }
        };

        // Firebase Admin ignores client security rules, allowing this secure unauthenticated write
        await registerRef.collection("useCases").doc(useCaseId).set(newUseCase);

        return NextResponse.json({ success: true, useCaseId });
    } catch (error: any) {
        console.error("Supplier Request error:", error);
        return NextResponse.json({ error: error.message || "Interner Serverfehler" }, { status: 500 });
    }
}
