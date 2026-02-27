"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { Loader2, CheckCircle2, XCircle, Shield, Award, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PublicCertificate {
    certificateCode: string;
    holderName: string;
    company: string | null;
    issuedDate: string;
    validUntil: string | null;
    status: string;
    modules: string[];
}

export default function VerificationPage() {
    const params = useParams();
    const code = params.code as string;
    const [loading, setLoading] = useState(true);
    const [certificate, setCertificate] = useState<PublicCertificate | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!code) return;

        const fetchCertificate = async () => {
            try {
                const db = await getFirebaseDb();
                const certRef = doc(db, "public_certificates", code);
                const snapshot = await getDoc(certRef);

                if (snapshot.exists()) {
                    setCertificate(snapshot.data() as PublicCertificate);
                } else {
                    setError("Zertifikat nicht gefunden oder ungültig.");
                }
            } catch (err) {
                console.error("Verification error:", err);
                setError("Fehler bei der Überprüfung. Bitte versuchen Sie es später erneut.");
            } finally {
                setLoading(false);
            }
        };

        fetchCertificate();
    }, [code]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Verifiziere Zertifikat...</p>
            </div>
        );
    }

    if (error || !certificate) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <Card className="w-full max-w-md border-red-200 shadow-lg">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <XCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <CardTitle className="text-xl text-red-700">Verifizierung fehlgeschlagen</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-muted-foreground mb-6">{error || "Ungültiger Code."}</p>
                        <Button variant="outline" onClick={() => window.location.href = 'https://eukigesetz.com'}>
                            Zurück zur Startseite
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            {/* Header / Brand */}
            <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
                    AI Act Competence Center
                </h1>
                <p className="text-sm text-muted-foreground">Trust & Verification Portal</p>
            </div>

            <Card className="w-full max-w-lg border-green-200 shadow-xl bg-white overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400" />

                <CardHeader className="text-center pb-6 border-b border-slate-100">
                    <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 ring-8 ring-green-50/50">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl text-green-700">Gültiges Zertifikat</CardTitle>
                    <div className="flex items-center justify-center gap-2 text-sm text-green-600/80 font-medium mt-2">
                        <Shield className="h-4 w-4" />
                        <span>Offiziell Verifiziert</span>
                    </div>
                </CardHeader>

                <CardContent className="pt-8 px-8 space-y-6">
                    {/* Main Info */}
                    <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Zertifiziert für</p>
                        <h2 className="text-2xl font-bold text-slate-900">{certificate.holderName}</h2>
                        {certificate.company && (
                            <p className="text-lg text-slate-600">{certificate.company}</p>
                        )}
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4 py-6 border-t border-b border-slate-100">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Award className="h-3 w-3" /> Zertifikat-Code
                            </p>
                            <p className="font-mono font-medium text-slate-800">{certificate.certificateCode}</p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                                <Calendar className="h-3 w-3" /> Ausgestellt am
                            </p>
                            <p className="font-medium text-slate-800">
                                {new Date(certificate.issuedDate).toLocaleDateString('de-DE')}
                            </p>
                        </div>
                        <div className="col-span-2 pt-2">
                            <p className="text-xs text-muted-foreground mb-2">Bestandene Module</p>
                            <div className="flex flex-wrap gap-2">
                                {certificate.modules.map((mod, i) => (
                                    <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {mod}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                </CardContent>
                <CardFooter className="bg-slate-50 p-6 text-center text-xs text-muted-foreground">
                    Dieses Zertifikat bestätigt die erfolgreiche Teilnahme an der Kompetenzprüfung gemäß den Standards des AI Act Competence Centers.
                </CardFooter>
            </Card>

            <div className="mt-8 text-center text-xs text-muted-foreground/50">
                &copy; 2026 AI Act Competence Center. All rights reserved.
            </div>
        </div>
    );
}
