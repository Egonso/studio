import { db } from "@/lib/firebase-admin";
import SupplierRequestForm from "./client";
import { FieldPath } from "firebase-admin/firestore";

export default async function SupplierRequestPage({
    params,
    searchParams,
}: {
    params: Promise<{ registerId: string }>;
    searchParams?: Promise<{ owner?: string | string[] | undefined }>;
}) {
    const { registerId } = await params;
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const ownerParam = Array.isArray(resolvedSearchParams?.owner)
        ? resolvedSearchParams?.owner[0]
        : resolvedSearchParams?.owner;
    const ownerId = typeof ownerParam === "string" && ownerParam.trim().length > 0
        ? ownerParam.trim()
        : null;

    let organisationName = "Unbekannt";
    let isValid = false;
    let isOperationalError = false;

    try {
        if (ownerId) {
            const directDoc = await db.doc(`users/${ownerId}/registers/${registerId}`).get();
            if (directDoc.exists && directDoc.data()?.isDeleted !== true) {
                organisationName = directDoc.data()?.organisationName || "Unbekannt";
                isValid = true;
            } else if (directDoc.exists) {
                return (
                    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
                        <div className="bg-white p-8 rounded-lg shadow-sm border max-w-md w-full text-center">
                            <h1 className="text-xl font-bold text-slate-900 mb-2">Ungültiger Link</h1>
                            <p className="text-slate-500">
                                Dieser Erfassungs-Link ist nicht mehr aktiv.
                            </p>
                        </div>
                    </div>
                );
            }
        }

        if (!isValid) {
            let snap = await db.collectionGroup("registers").where("registerId", "==", registerId).limit(1).get();
            if (snap.empty) {
                snap = await db.collectionGroup("registers").where(FieldPath.documentId(), "==", registerId).limit(1).get();
            }
            if (!snap.empty) {
                const doc = snap.docs[0];
                if (doc.data()?.isDeleted !== true) {
                    organisationName = doc.data()?.organisationName || "Unbekannt";
                    isValid = true;
                }
            }
        }
    } catch (e) {
        isOperationalError = true;
        console.error("Failed to load register for supplier request", e);
    }

    if (!isValid) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
                <div className="bg-white p-8 rounded-lg shadow-sm border max-w-md w-full text-center">
                    <h1 className="text-xl font-bold text-slate-900 mb-2">
                        {isOperationalError ? "Dienst vorübergehend nicht verfügbar" : "Ungültiger Link"}
                    </h1>
                    <p className="text-slate-500">
                        {isOperationalError
                            ? "Bitte versuchen Sie es in wenigen Minuten erneut."
                            : "Dieser Erfassungs-Link ist abgelaufen oder ungültig."}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <SupplierRequestForm
            registerId={registerId}
            ownerId={ownerId}
            organisationName={organisationName}
        />
    );
}
