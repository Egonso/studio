"use client";

import { AlertCircle, CheckCircle2, Lock, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UseCaseCard } from "@/lib/register-first/types";
import { useRouter } from "next/navigation";
import { createAiToolsRegistryService } from "@/lib/register-first";

const aiRegistry = createAiToolsRegistryService();

interface GovernanceLiabilitySectionProps {
    card: UseCaseCard;
}

export function GovernanceLiabilitySection({ card }: GovernanceLiabilitySectionProps) {
    const router = useRouter();

    const toolEntry = card.toolId ? aiRegistry.getById(card.toolId) : null;
    const isHighRisk = toolEntry?.riskLevel === "high" || toolEntry?.riskLevel === "unacceptable" || card.governanceAssessment?.core?.aiActCategory === "Hochrisiko" || card.governanceAssessment?.core?.aiActCategory === "Verboten";
    const isExternal = card.usageContexts.includes("CUSTOMER_FACING") || card.usageContexts.includes("EXTERNAL_PUBLIC");

    const iso = card.governanceAssessment?.flex?.iso;
    const hasRiskClass = !!toolEntry?.riskLevel || !!card.governanceAssessment?.core?.aiActCategory;
    const hasOwner = !!card.responsibility.responsibleParty;
    const hasOversight = iso?.oversightModel && iso.oversightModel !== "unknown";
    const hasReviewCycle = iso?.reviewCycle && iso.reviewCycle !== "unknown";
    const hasDocLevel = iso?.documentationLevel && iso.documentationLevel !== "unknown";

    const isRegistered = hasRiskClass && hasOwner && hasOversight && hasReviewCycle && hasDocLevel;

    // Pro / Status 2 Features (Mocked missing by default in Core)
    const hasHistory = false; // card.reviewHistory && card.reviewHistory.length > 0
    const hasReminders = false;

    const isPruefhistorie = hasHistory && hasReminders;

    // Enterprise / Status 3 Features
    const hasAuditDossier = false;
    const hasTrustPortal = false;

    const isExternBelegbar = hasAuditDossier && hasTrustPortal;

    // Triggers
    const needsPro = (isHighRisk && !hasHistory) || (iso?.reviewCycle === "monthly" && !hasReminders); // Simplify conditions
    const needsEnterprise = isExternal && !hasTrustPortal;

    return (
        <Card className="border-slate-300">
            <CardHeader className="bg-slate-50 border-b pb-4">
                <CardTitle className="text-base uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    Governance-Nachweis
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 text-sm">

                {/* Status 1: Registriert */}
                <div className="p-4 border-b">
                    <h4 className="font-semibold mb-3 flex items-center justify-between">
                        1. Stammdokumentation (Registriert)
                        {isRegistered ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-500" />}
                    </h4>
                    <ul className="space-y-2 text-muted-foreground text-xs">
                        <li className="flex items-center gap-2">
                            {hasRiskClass ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <XCircle className="w-3 h-3 text-red-500" />}
                            Risiko klassifiziert
                        </li>
                        <li className="flex items-center gap-2">
                            {hasOwner ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <XCircle className="w-3 h-3 text-red-500" />}
                            Verantwortliche:r definiert
                        </li>
                        <li className="flex items-center gap-2">
                            {hasOversight ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <XCircle className="w-3 h-3 text-red-500" />}
                            Aufsichtsmodell festgelegt
                        </li>
                        <li className="flex items-center gap-2">
                            {hasReviewCycle ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <XCircle className="w-3 h-3 text-red-500" />}
                            Review-Zyklen definiert
                        </li>
                    </ul>
                </div>

                {/* Status 2: Mit Prüfhistorie */}
                <div className="p-4 border-b bg-slate-50/50">
                    <h4 className="font-semibold mb-3 flex items-center justify-between">
                        2. Mit Prüfhistorie
                        {isPruefhistorie ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Lock className="w-4 h-4 text-slate-400" />}
                    </h4>
                    <ul className="space-y-2 text-muted-foreground text-xs">
                        <li className="flex items-center gap-2">
                            {hasReminders ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <AlertCircle className="w-3 h-3 text-amber-500" />}
                            Automatische Fristüberwachung aktiv
                        </li>
                        <li className="flex items-center gap-2">
                            {hasHistory ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <AlertCircle className="w-3 h-3 text-amber-500" />}
                            Unveränderbare Review-Historie
                        </li>
                        <li className="flex items-center gap-2">
                            <AlertCircle className="w-3 h-3 text-amber-500" />
                            Governance-Report generierbar
                        </li>
                    </ul>
                    {needsPro && !isPruefhistorie && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md text-red-800 text-xs">
                            <strong className="block mb-1">Operatives Risiko!</strong>
                            {isHighRisk
                                ? "Für Hochrisiko-Systeme verlangt Art. 14 AI Act eine dokumentierte menschliche Aufsicht. Ohne Prüfhistorie ist diese im Zweifel nicht belastbar belegbar."
                                : "Ohne Historie und Fristüberwachung ist die Umsetzung der Compliance-Vorgaben nicht rechtssicher nachweisbar."}
                            <Button size="sm" variant="outline" className="w-full mt-3 bg-white text-red-700 border-red-200 hover:bg-red-50">
                                Prüfhistorie aktivieren
                            </Button>
                        </div>
                    )}
                </div>

                {/* Status 3: Extern belegbar */}
                <div className="p-4 bg-slate-50/50">
                    <h4 className="font-semibold mb-3 flex items-center justify-between">
                        3. Beweisführung (Extern belegbar)
                        {isExternBelegbar ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Lock className="w-4 h-4 text-slate-400" />}
                    </h4>
                    <ul className="space-y-2 text-muted-foreground text-xs">
                        <li className="flex items-center gap-2">
                            <AlertCircle className="w-3 h-3 text-amber-500" />
                            ISO 42001 Audit-Dossier
                        </li>
                        <li className="flex items-center gap-2">
                            <AlertCircle className="w-3 h-3 text-amber-500" />
                            Externer Governance-Nachweis (Trust Portal)
                        </li>
                    </ul>
                    {needsEnterprise && !isExternBelegbar && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-md text-amber-800 text-xs">
                            <strong className="block mb-1">Transparenz-Lücke</strong>
                            Da dieses System externe Nutzer betrifft, sollten Sie einen öffentlichen Governance-Nachweis im Trust Portal generieren können.
                            <Button size="sm" variant="outline" className="w-full mt-3 bg-white text-amber-700 border-amber-200 hover:bg-amber-50">
                                Externe Belegbarkeit aktivieren
                            </Button>
                        </div>
                    )}
                </div>

            </CardContent>
        </Card>
    );
}
