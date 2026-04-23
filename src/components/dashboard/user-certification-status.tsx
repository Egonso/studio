import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Award, FileText, Lock, ExternalLink, GraduationCap, ShieldCheck, Share2, Download } from "lucide-react";
import { CertificateBadgeCard } from "@/components/certification/certificate-badge-card";
import type { UserStatus } from "@/hooks/use-user-status";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserCertificationStatusProps {
    status: UserStatus | null;
    loading: boolean;
}

export function UserCertificationStatus({ status, loading }: UserCertificationStatusProps) {
    const router = useRouter();
    const [isPublished, setIsPublished] = useState(false); // Local state for demo purposes, ideally persisted

    if (loading) {
        return (
            <Card className="border-slate-200 mb-8">
                <CardContent className="p-6">
                    <div className="h-6 w-1/3 bg-slate-100 animate-pulse rounded mb-4"></div>
                    <div className="h-4 w-1/2 bg-slate-100 animate-pulse rounded"></div>
                </CardContent>
            </Card>
        );
    }

    if (!status) return null;

    const hasExamData = status.examAttempts > 0;
    const passed = status.examPassed;
    const courseProgress = status.courseProgress || [];
    const hasStartedCourse = courseProgress.length > 0;
    const certificateStatus = status.certificate?.status ?? null;
    const isCertificateActive = certificateStatus === 'active';
    const certificateStatusLabel =
        certificateStatus === 'expired'
            ? 'Abgelaufen'
            : certificateStatus === 'revoked'
                ? 'Widerrufen'
                : 'Aktiv';

    // Logic for "Trusted" state could be: passed AND user has clicked publish/share (mocked here)
    // Or if backend eventually supports "published" flag.
    const isTrusted = passed && isPublished && isCertificateActive;

    // --- State 3: Trusted Personenzertifikat (Final Stage) ---
    if (isTrusted && status.certificate) {
        return (
            <Card className="border-gray-200 bg-gray-50/30 shadow-sm mb-8 relative overflow-hidden transition-all duration-500 ease-in-out">
                <div className="absolute top-0 left-0 w-1 h-full bg-gray-900" />
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-800">
                            <ShieldCheck className="h-5 w-5" />
                            Trusted Personenzertifikat
                        </CardTitle>
                        <Badge className="bg-gray-900 hover:bg-gray-800 border-none px-3 py-1 text-white">Verifiziert & Öffentlich</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div>
                            <p className="text-sm text-gray-800 mb-4">
                                Ihr Zertifikat ist weltweit gültig und öffentlich verifizierbar. Es signalisiert höchste Kompetenz im Umgang mit dem EU AI Act.
                            </p>
                            <div className="bg-white/60 p-3 rounded-lg border border-gray-100 space-y-1 text-sm">
                                <p><span className="font-semibold">Inhaber:</span> {status.certificate.holderName}</p>
                                <p><span className="font-semibold">Code:</span> <span className="font-mono">{status.certificate.code}</span></p>
                                <p><span className="font-semibold">Gültig bis:</span> {status.certificate.validUntil}</p>
                                <p><span className="font-semibold">Status:</span> {certificateStatusLabel}</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 justify-center">
                            <Button variant="outline" className="w-full bg-white border-gray-200 text-gray-800 hover:bg-gray-50" onClick={() => {
                                navigator.clipboard.writeText(status.certificate!.verifyUrl);
                                alert("Link kopiert!");
                            }}>
                                <Share2 className="mr-2 h-4 w-4" />
                                Verifizierungs-Link teilen
                            </Button>
                            {status.certificate.latestDocumentUrl ? (
                                <Button variant="outline" className="w-full bg-white border-gray-200 text-gray-800 hover:bg-gray-50" asChild>
                                    <a href={status.certificate.latestDocumentUrl} target="_blank" rel="noreferrer">
                                        <Download className="mr-2 h-4 w-4" />
                                        Zertifikat öffnen
                                    </a>
                                </Button>
                            ) : null}
                            <Button variant="ghost" className="w-full text-gray-700 hover:text-gray-900 hover:bg-gray-50/50" asChild>
                                <a href={status.certificate.verifyUrl} target="_blank" rel="noreferrer">
                                    Öffentliches Profil ansehen <ExternalLink className="ml-2 h-3 w-3" />
                                </a>
                            </Button>
                        </div>
                    </div>
                    <div className="mt-6">
                        <CertificateBadgeCard
                            certificateCode={status.certificate.code}
                            holderName={status.certificate.holderName}
                        />
                    </div>
                </CardContent>
            </Card>
        );
    }

    // --- State 2: Personenzertifikat (Exam Passed) ---
    if (passed && status.certificate) {
        return (
            <div className="space-y-6 mb-8">
                <Card className="border-gray-200 bg-gray-50/30 shadow-sm relative overflow-hidden transition-all duration-500 ease-in-out">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gray-900" />
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-900">
                                <Award className="h-5 w-5" />
                                Personenzertifikat
                            </CardTitle>
                            <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-none px-3 py-1">Bestanden</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                            <div className="space-y-4">
                                <p className="text-sm text-gray-800">
                                    Herzlichen Glückwunsch! Sie haben die Prüfung erfolgreich bestanden.
                                </p>
                                <div className="bg-white/60 p-3 rounded-lg border border-gray-100 space-y-1 text-sm text-slate-700">
                                    <p><span className="font-semibold text-gray-900">Zertifikat:</span> {certificateStatusLabel}</p>
                                    <p><span className="font-semibold text-gray-900">Code:</span> {status.certificate.code}</p>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <h4 className="font-semibold text-sm mb-2 text-gray-900">Nächster Schritt: Sichtbarkeit</h4>
                                <p className="text-xs text-muted-foreground mb-4">
                                    {isCertificateActive
                                        ? 'Veröffentlichen Sie Ihr Zertifikat im AI Trust Portal, um Ihren Expertenstatus für Kunden und Partner sichtbar zu machen.'
                                        : 'Badge und öffentliche Aktivierung bleiben nur für aktuell gültige Zertifikate verfügbar.'}
                                </p>
                                <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white" onClick={() => setIsPublished(true)} disabled={!isCertificateActive}>
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    Zertifikat veröffentlichen & aktivieren
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {isCertificateActive ? (
                    <CertificateBadgeCard
                        certificateCode={status.certificate.code}
                        holderName={status.certificate.holderName}
                    />
                ) : null}
            </div>
        );
    }


    // --- State 1: Kompetenz-Prüfung (Initial) ---
    return (
        <Card className="border-slate-200 shadow-sm mb-8 relative overflow-hidden">
            {/* Progress Bar Top */}
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
                <div className="h-full bg-primary/20" style={{ width: hasStartedCourse ? '50%' : '10%' }}></div>
            </div>

            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        Kompetenz & Zertifizierung
                    </CardTitle>
                    <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">Schritt 1 von 2</Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Erlangen Sie Ihr offizielles Personenzertifikat als Nachweis Ihrer AI Act Expertise.
                            Der Prozess besteht aus dem Videokurs und der anschließenden Prüfung.
                        </p>

                        {!hasStartedCourse ? (
                            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                                <Lock className="h-3 w-3" />
                                <span>Bitte starten Sie zuerst den Videokurs, um die Prüfung freizuschalten.</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Kurs gestartet. Prüfungsfreigabe aktiv.</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <Button className="w-full text-base h-11" onClick={() => router.push('/academy')}>
                            <FileText className="mr-2 h-4 w-4" />
                            Zu den Kursmodulen
                        </Button>

                        <div className="relative group">
                            <Button
                                variant={hasStartedCourse ? "secondary" : "ghost"}
                                className={`w-full border justify-between ${!hasStartedCourse ? 'opacity-50 cursor-not-allowed bg-slate-50 hover:bg-slate-50' : 'bg-white hover:bg-slate-50 border-slate-200'}`}
                                disabled={!hasStartedCourse}
                                asChild={hasStartedCourse}
                            >
                                {hasStartedCourse ? (
                                    <Link href="/exam">
                                        <span>Zur Prüfung</span>
                                        <ExternalLink className="ml-2 h-4 w-4 text-muted-foreground" />
                                    </Link>
                                ) : (
                                    <span>Zur Prüfung (Gesperrt)</span>
                                )}
                            </Button>
                            {!hasStartedCourse && (
                                <p className="text-[10px] text-center text-muted-foreground mt-1">
                                    *Prüfungsinhalte basieren auf den Kursmodulen
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
            {hasExamData && !passed && (
                <CardFooter className="bg-red-50 border-t border-red-100 p-3">
                    <p className="text-xs text-red-600 flex items-center mx-auto">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Letzter Versuch nicht bestanden. Sie können die Prüfung wiederholen.
                    </p>
                </CardFooter>
            )}
        </Card>
    );
}

function AlertCircle({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
        </svg>
    )
}
