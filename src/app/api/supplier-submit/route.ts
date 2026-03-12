import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { FieldPath } from "firebase-admin/firestore";
import { ZodError } from "zod";
import {
    createSupplierRequestUseCase,
    sanitizeSupplierRequestCard,
} from "@/lib/register-first/supplier-requests";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            registerId,
            ownerId,
            toolName,
            purpose,
            dataCategory,
            aiActCategory,
            supplierEmail,
        } = body;

        if (!registerId || !toolName || !supplierEmail) {
            return NextResponse.json({ error: "Fehlende Pflichtfelder (Register, Tool-Name oder Email)" }, { status: 400 });
        }

        // Verify register exists (prefer direct owner/register path when available)
        let registerRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData> | null = null;
        let organisationName = "";

        if (typeof ownerId === "string" && ownerId.trim().length > 0) {
            const directRef = db.doc(`users/${ownerId.trim()}/registers/${registerId}`);
            const directDoc = await directRef.get();
            if (directDoc.exists && directDoc.data()?.isDeleted !== true) {
                registerRef = directRef;
                organisationName = directDoc.data()?.organisationName || "";
            } else if (directDoc.exists) {
                return NextResponse.json({ error: "Register nicht gefunden / Ungültiger Magic Link" }, { status: 404 });
            }
        }

        if (!registerRef) {
            let registerQuery = await db.collectionGroup("registers").where("registerId", "==", registerId).limit(1).get();
            if (registerQuery.empty) {
                registerQuery = await db.collectionGroup("registers").where(FieldPath.documentId(), "==", registerId).limit(1).get();
            }

            if (registerQuery.empty) {
                return NextResponse.json({ error: "Register nicht gefunden / Ungültiger Magic Link" }, { status: 404 });
            }

            const registerDoc = registerQuery.docs[0];
            if (registerDoc.data()?.isDeleted !== true) {
                registerRef = registerDoc.ref;
                organisationName = registerDoc.data()?.organisationName || "";
            }
        }

        if (!registerRef) {
            return NextResponse.json({ error: "Register nicht gefunden / Ungültiger Magic Link" }, { status: 404 });
        }

        const useCaseId = crypto.randomUUID();
        const currentTime = new Date();

        const newUseCase = createSupplierRequestUseCase(
            {
                supplierEmail,
                toolName,
                purpose,
                dataCategory,
                aiActCategory,
            },
            {
                useCaseId,
                now: currentTime,
                organisationName,
            }
        );

        // Firebase Admin ignores client security rules, allowing this secure unauthenticated write
        await registerRef
            .collection("useCases")
            .doc(useCaseId)
            .set(sanitizeSupplierRequestCard(newUseCase));

        return NextResponse.json({ success: true, useCaseId });
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: "Bitte pruefen Sie die uebermittelten Lieferantenangaben." },
                { status: 400 }
            );
        }

        console.error("Supplier Request error:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Interner Serverfehler",
            },
            { status: 500 }
        );
    }
}
