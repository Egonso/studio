import { db } from "@/lib/firebase-admin";
import SupplierRequestForm from "./client";
import { FieldPath } from "firebase-admin/firestore";

export default async function SupplierRequestPage({ params }: { params: { registerId: string } }) {
    const { registerId } = await params;

    let organisationName = "Unbekannt";
    let isValid = false;

    try {
        let snap = await db.collectionGroup("registers").where("registerId", "==", registerId).limit(1).get();
        if (snap.empty) {
            snap = await db.collectionGroup("registers").where(FieldPath.documentId(), "==", registerId).limit(1).get();
        }
        if (!snap.empty) {
            organisationName = snap.docs[0].data()?.organisationName || "Unbekannt";
            isValid = true;
        }
    } catch (e) {
        console.error("Failed to load register for supplier request", e);
    }

    if (!isValid) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
                <div className="bg-white p-8 rounded-lg shadow-sm border max-w-md w-full text-center">
                    <h1 className="text-xl font-bold text-slate-900 mb-2">Ungültiger Link</h1>
                    <p className="text-slate-500">Dieser Erfassungs-Link ist abgelaufen oder ungültig.</p>
                </div>
            </div>
        );
    }

    return <SupplierRequestForm registerId={registerId} organisationName={organisationName} />;
}
