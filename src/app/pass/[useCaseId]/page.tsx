"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, ArrowLeft, Printer, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { registerService } from "@/lib/register-first/register-service";
import { createAiToolsRegistryService } from "@/lib/register-first";
import type { UseCaseCard, Register } from "@/lib/register-first/types";

const aiRegistry = createAiToolsRegistryService();

const dataCategoryLabels: Record<string, string> = {
    NONE: "Keine besonderen Daten (Standard)",
    INTERNAL: "Interne Geschäfts- oder Betriebsgeheimnisse",
    PERSONAL: "Personenbezogene Daten (nach DSGVO)",
    SENSITIVE: "Sensible personenbezogene Daten (Art. 9 DSGVO)",
};

const isoReviewCycleLabels: Record<string, string> = {
    unknown: "Nicht definiert",
    monthly: "Monatlich",
    quarterly: "Quartalsweise",
    semiannual: "Halbjährlich",
    annual: "Jährlich",
    ad_hoc: "Anlassbezogen (Ad-hoc)",
};

export default function UseCasePassPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const useCaseId = params.useCaseId as string;

    const [useCase, setUseCase] = useState<UseCaseCard | null>(null);
    const [register, setRegister] = useState<Register | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push("/login");
            return;
        }

        async function fetchData() {
            try {
                const regs = await registerService.listRegisters();
                let foundUc: UseCaseCard | null = null;
                let foundReg: Register | null = null;

                for (const reg of regs) {
                    try {
                        const ucs = await registerService.listUseCases(reg.registerId);
                        const uc = ucs.find((u) => u.useCaseId === useCaseId);
                        if (uc) {
                            foundUc = uc;
                            foundReg = reg;
                            break;
                        }
                    } catch (e) {
                        console.error("Error fetching use cases for reg", reg.registerId, e);
                    }
                }

                if (foundUc && foundReg) {
                    setUseCase(foundUc);
                    setRegister(foundReg);
                }
            } catch (e) {
                console.error("Failed to load pass data", e);
            } finally {
                setLoading(false);
            }
        }

        void fetchData();
    }, [user, authLoading, useCaseId, router]);

    if (authLoading || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!useCase || !register) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4">
                <h1 className="text-xl font-bold mb-4">Pass nicht gefunden</h1>
                <Button variant="outline" onClick={() => router.push("/my-register")}>
                    Zurück zum Register
                </Button>
            </div>
        );
    }

    const toolEntry = useCase.toolId ? aiRegistry.getById(useCase.toolId) : null;
    const toolName = useCase.toolFreeText || toolEntry?.productName || "Unbekanntes System";

    const aiActCategory = useCase.governanceAssessment?.core?.aiActCategory || "Unbekannt";
    const dataCat = useCase.dataCategory ? dataCategoryLabels[useCase.dataCategory] : dataCategoryLabels.NONE;
    const owner = useCase.responsibility?.responsibleParty || "Nicht definiert";
    const reviewCycle = useCase.governanceAssessment?.flex?.iso?.reviewCycle || "unknown";
    const reviewLabel = isoReviewCycleLabels[reviewCycle] || "Nicht definiert";

    const formattedDate = new Date(useCase.updatedAt || useCase.createdAt).toLocaleDateString("de-DE", {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 py-8 print:py-0 print:bg-white">
            {/* Action Bar (Hidden in Print) */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 print:hidden flex justify-between items-center">
                <Button variant="ghost" size="sm" onClick={() => router.push("/my-register")} className="text-muted-foreground">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Zurück zum Register
                </Button>
                <div className="flex gap-2">
                    <Button onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" /> PDF Speichern / Drucken
                    </Button>
                </div>
            </div>

            {/* The 1-Pager A4 Document */}
            <div className="max-w-3xl mx-auto bg-white border border-slate-200 shadow-sm rounded-lg p-10 sm:p-14 print:border-none print:shadow-none print:p-0 print:m-0">

                {/* Header */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-8 mb-8">
                    <div>
                        <h1 className="text-sm font-semibold tracking-wider text-slate-500 uppercase mb-1">EUKI Registerauszug</h1>
                        <h2 className="text-3xl font-serif text-slate-900 leading-tight">Use-Case Pass</h2>
                        <p className="text-slate-500 text-sm mt-2 font-mono">ID: {useCase.useCaseId.split('-')[0].toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                        <Image src="/logo.png" alt="EUKI Logo" width={120} height={40} className="h-10 w-auto ml-auto mb-3" />
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Dokumentiert & Registriert</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-10">

                    {/* Org & System Info */}
                    <div>
                        <h3 className="text-sm font-semibold tracking-wide text-slate-900 uppercase border-b border-slate-100 pb-2 mb-4">1. Identifikation</h3>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                            <div>
                                <dt className="text-xs text-slate-500 mb-1">Organisation</dt>
                                <dd className="text-sm font-medium text-slate-900">{register.organisationName}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-slate-500 mb-1">Datum der letzten Erfassung</dt>
                                <dd className="text-sm font-medium text-slate-900">{formattedDate} Uhr</dd>
                            </div>
                            <div className="sm:col-span-2 mt-2">
                                <dt className="text-xs text-slate-500 mb-1">KI-System / Applikation</dt>
                                <dd className="text-lg font-semibold text-slate-900">{toolName}</dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-xs text-slate-500 mb-1">Beschriebener Zweck</dt>
                                <dd className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-100">{useCase.purpose || "Nicht spezifiziert"}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Assessment Core */}
                    <div>
                        <h3 className="text-sm font-semibold tracking-wide text-slate-900 uppercase border-b border-slate-100 pb-2 mb-4">2. Regulatorische Basiswerte (AI Act)</h3>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                            <div>
                                <dt className="text-xs text-slate-500 mb-1">Risikoklassifizierung</dt>
                                <dd className="text-sm font-medium text-slate-900">{aiActCategory}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-slate-500 mb-1">Datenkategorie</dt>
                                <dd className="text-sm font-medium text-slate-900">{dataCat}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Governance Core */}
                    <div>
                        <h3 className="text-sm font-semibold tracking-wide text-slate-900 uppercase border-b border-slate-100 pb-2 mb-4">3. Governance & Lifecycle (ISO 42001)</h3>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                            <div>
                                <dt className="text-xs text-slate-500 mb-1">Verantwortliche Partei (Owner)</dt>
                                <dd className="text-sm font-medium text-slate-900">{owner}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-slate-500 mb-1">Zertifizierter Review-Zyklus</dt>
                                <dd className="text-sm font-medium text-slate-900">{reviewLabel}</dd>
                            </div>
                            <div className="sm:col-span-2 mt-4 pt-4 border-t border-slate-100">
                                <dt className="text-xs text-slate-500 mb-2">Gesetzlicher Status</dt>
                                <dd className="text-xs leading-relaxed text-slate-600">
                                    Dieses KI-System wurde offiziell im Register der Organisation erfasst und unterliegt den dokumentierten betrieblichen Kontrollmechanismen. Die Einstufung und Freigabe erfolgt nach bestem Gewissen und in Übereinstimmung mit den gesetzlichen Dokumentationspflichten zum Zeitpunkt des oben angegebenen Datums.
                                </dd>
                            </div>
                        </dl>
                    </div>

                </div>

                {/* Footer */}
                <div className="mt-16 pt-6 border-t border-slate-200 text-center">
                    <p className="text-xs text-slate-400">
                        Erstellt am {new Date().toLocaleDateString("de-DE")} mit dem EUKI AI Governance Register.
                        <br />
                        Dokument generiert über fortbildung.eukigesetz.com
                    </p>
                </div>

            </div>
        </div>
    );
}
