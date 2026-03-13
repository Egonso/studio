"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
    Loader2,
    CheckCircle2,
    XCircle,
    Shield,
    Award,
    Calendar,
    AlertTriangle,
    ExternalLink,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PublicCertificate {
    certificateCode: string;
    certificateId: string;
    holderName: string;
    company: string | null;
    issuedDate: string;
    validUntil: string | null;
    status: "active" | "expired" | "revoked";
    modules: string[];
    verifyUrl: string;
    latestDocumentUrl: string | null;
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
                const response = await fetch(`/api/certification/public/${encodeURIComponent(code)}`);
                if (!response.ok) {
                    throw new Error(response.status === 404 ? "Zertifikat nicht gefunden oder ungültig." : "Fehler bei der Überprüfung.");
                }

                const payload = await response.json();
                setCertificate(payload as PublicCertificate);
            } catch (err) {
                console.error("Verification error:", err);
                setError(err instanceof Error ? err.message : "Fehler bei der Überprüfung. Bitte versuchen Sie es später erneut.");
            } finally {
                setLoading(false);
            }
        };

        void fetchCertificate();
    }, [code]);

    const statusMeta = useMemo(() => {
        switch (certificate?.status) {
            case "expired":
                return {
                    title: "Abgelaufenes Zertifikat",
                    tone: "amber" as const,
                    body: "Dieses Zertifikat ist historisch nachvollziehbar, aber nicht mehr aktuell gültig.",
                };
            case "revoked":
                return {
                    title: "Widerrufenes Zertifikat",
                    tone: "red" as const,
                    body: "Dieses Zertifikat wurde widerrufen und darf nicht mehr als aktueller Nachweis verwendet werden.",
                };
            default:
                return {
                    title: "Gültiges Zertifikat",
                    tone: "green" as const,
                    body: "Dieses Zertifikat bestätigt die erfolgreiche Kompetenzprüfung im KI-Register.",
                };
        }
    }, [certificate?.status]);

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
                        <Button variant="outline" onClick={() => window.location.href = 'https://kiregister.com'}>
                            Zurück zur Startseite
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const isActive = certificate.status === "active";
    const accentClass =
        statusMeta.tone === "green"
            ? "border-green-200 text-green-700 bg-green-50"
            : statusMeta.tone === "amber"
                ? "border-amber-200 text-amber-700 bg-amber-50"
                : "border-red-200 text-red-700 bg-red-50";

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-cyan-600">
                    KI-Register
                </h1>
                <p className="text-sm text-muted-foreground">Certificate Verification</p>
            </div>

            <Card className="w-full max-w-2xl shadow-xl bg-white overflow-hidden relative">
                <div className={`absolute top-0 left-0 w-full h-1 ${isActive ? "bg-gradient-to-r from-green-500 to-emerald-400" : certificate.status === "expired" ? "bg-gradient-to-r from-amber-500 to-yellow-400" : "bg-gradient-to-r from-red-500 to-rose-400"}`} />

                <CardHeader className="text-center pb-6 border-b border-slate-100">
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ring-8 ${isActive ? "bg-green-50 ring-green-50/50" : certificate.status === "expired" ? "bg-amber-50 ring-amber-50/50" : "bg-red-50 ring-red-50/50"}`}>
                        {isActive ? (
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        ) : certificate.status === "expired" ? (
                            <AlertTriangle className="h-8 w-8 text-amber-600" />
                        ) : (
                            <XCircle className="h-8 w-8 text-red-600" />
                        )}
                    </div>
                    <CardTitle className="text-2xl text-slate-900">{statusMeta.title}</CardTitle>
                    <div className="flex items-center justify-center gap-2 text-sm font-medium mt-2 text-slate-600">
                        <Shield className="h-4 w-4" />
                        <span>{statusMeta.body}</span>
                    </div>
                </CardHeader>

                <CardContent className="pt-8 px-8 space-y-6">
                    <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Zertifiziert für</p>
                        <h2 className="text-2xl font-bold text-slate-900">{certificate.holderName}</h2>
                        {certificate.company && (
                            <p className="text-lg text-slate-600">{certificate.company}</p>
                        )}
                    </div>

                    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${accentClass}`}>
                        <Shield className="h-4 w-4" />
                        <span>Status: {certificate.status === "active" ? "Aktiv" : certificate.status === "expired" ? "Abgelaufen" : "Widerrufen"}</span>
                    </div>

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
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Gültig bis</p>
                            <p className="font-medium text-slate-800">
                                {certificate.validUntil
                                    ? new Date(certificate.validUntil).toLocaleDateString('de-DE')
                                    : 'Nicht gesetzt'}
                            </p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-xs text-muted-foreground">Öffentliche URL</p>
                            <a
                                href={certificate.verifyUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-sm font-medium text-cyan-700 hover:text-cyan-800"
                            >
                                Öffnen
                                <ExternalLink className="h-3 w-3" />
                            </a>
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

                    {certificate.latestDocumentUrl ? (
                        <div className="flex justify-center">
                            <Button asChild>
                                <a href={certificate.latestDocumentUrl} target="_blank" rel="noreferrer">
                                    Zertifikats-PDF öffnen
                                </a>
                            </Button>
                        </div>
                    ) : null}
                </CardContent>
                <CardFooter className="bg-slate-50 p-6 text-center text-xs text-muted-foreground">
                    Dieses Zertifikat ist öffentlich über das KI-Register verifizierbar.
                </CardFooter>
            </Card>
        </div>
    );
}
