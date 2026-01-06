import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Award, FileText, XCircle, AlertCircle, Download, ExternalLink } from "lucide-react";
import type { UserStatus } from "@/hooks/use-user-status";
import { useToast } from "@/hooks/use-toast";

interface UserCertificationStatusProps {
    status: UserStatus | null;
    loading: boolean;
}

export function UserCertificationStatus({ status, loading }: UserCertificationStatusProps) {
    const { toast } = useToast();

    if (loading) {
        return (
            <Card className="border-slate-200">
                <CardContent className="p-6">
                    <div className="h-6 w-1/3 bg-slate-100 animate-pulse rounded mb-4"></div>
                    <div className="h-4 w-1/2 bg-slate-100 animate-pulse rounded"></div>
                </CardContent>
            </Card>
        );
    }

    if (!status) return null;

    // Don't show anything if they haven't even purchased (though they shouldn't be here if logic works)
    // or if they have purchased but not started exam (optional: show "Start Exam" CTA?)

    const hasExamData = status.examAttempts > 0;
    const passed = status.examPassed;
    const hasCertificate = status.hasCertificate;

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {/* 1. Exam Status */}
            <Card className="border-slate-200 shadow-sm relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${passed ? 'bg-green-500' : hasExamData ? 'bg-red-500' : 'bg-slate-300'}`} />
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            Kompetenz-Prüfung
                        </CardTitle>
                        {passed ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Bestanden</Badge>
                        ) : hasExamData ? (
                            <Badge variant="destructive">Nicht Bestanden</Badge>
                        ) : (
                            <Badge variant="outline">Ausstehend</Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {passed ? (
                            <p className="text-sm text-muted-foreground">
                                Glückwunsch! Sie haben die Prüfung am {status.purchase?.date ? new Date(status.purchase.date).toLocaleDateString('de-DE') : 'kürzlich'} erfolgreich absolviert.
                            </p>
                        ) : hasExamData ? (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Leider hat es beim letzten Versuch nicht geklappt. Sie können die Prüfung jederzeit wiederholen.
                                </p>
                                <Button size="sm" variant="outline" className="w-full" asChild>
                                    <a href="https://eukigesetz.com/exam-login" target="_blank" rel="noreferrer">
                                        Prüfung wiederholen <ExternalLink className="ml-2 h-3 w-3" />
                                    </a>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Weisen Sie Ihre Kompetenz nach, um Ihr Zertifikat zu erhalten.
                                </p>
                                <Button size="sm" className="w-full" asChild>
                                    <a href="https://eukigesetz.com/exam-login" target="_blank" rel="noreferrer">
                                        Zur Prüfung <ExternalLink className="ml-2 h-3 w-3" />
                                    </a>
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 2. Certificate Status */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <Award className="h-4 w-4 text-muted-foreground" />
                            Personenzertifikat
                        </CardTitle>
                        {hasCertificate && (
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">Aktiv</Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {hasCertificate && status.certificate ? (
                        <div className="space-y-4">
                            <div className="text-sm space-y-1">
                                <p className="font-medium">{status.certificate.holderName}</p>
                                <p className="text-muted-foreground text-xs">Code: {status.certificate.code}</p>
                                <p className="text-muted-foreground text-xs">Gültig bis: {status.certificate.validUntil}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-20 text-center">
                            <p className="text-sm text-muted-foreground mb-2">Wird nach bestandener Prüfung freigeschaltet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 3. Action / Trust Center */}
            <Card className="border-slate-200 shadow-sm bg-slate-50/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        Trust Center
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Ihr Zertifikat ist öffentlich verifizierbar. Nutzen Sie dies für Ihre Kommunikation.
                        </p>
                        {hasCertificate && status.certificate && (
                            <Button variant="secondary" size="sm" className="w-full" onClick={() => {
                                navigator.clipboard.writeText(`https://app.eukigesetz.com/verify/${status.certificate!.code}`);
                                toast({
                                    title: "Link kopiert",
                                    description: "Der Verifizierungs-Link wurde in die Zwischenablage kopiert.",
                                });
                            }}>
                                Verifizierungs-Link kopieren
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function Shield({ className }: { className?: string }) {
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
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        </svg>
    )
}
