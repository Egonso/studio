"use client";

import { useState, useMemo, useCallback } from "react";
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Download,
    ExternalLink,
    Lock,
    ShieldCheck,
    XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UseCaseCard, OrgSettings } from "@/lib/register-first/types";
import { useToast } from "@/hooks/use-toast";
import { useCapability } from "@/lib/compliance-engine/capability/useCapability";

// ── Backend Services ────────────────────────────────────────────────────────
import { isPubliclyVerifiable, getVerifyUrl } from "@/lib/register-first/trust-portal-service";
import { activatePublicVisibility } from "@/lib/register-first/trust-portal-service";
import { calculateReviewDeadline, getDeadlineStatusLabel } from "@/lib/compliance-engine/reminders/review-deadline";
import { generateGovernanceReport, governanceReportToCSV } from "@/lib/compliance-engine/audit/governance-report";
import { isDossierGeneratable } from "@/lib/compliance-engine/audit/dossier-builder";

// ── Types ───────────────────────────────────────────────────────────────────

interface GovernanceLiabilitySectionProps {
    card: UseCaseCard;
    /** All use cases in the register (for report/dossier generation) */
    useCases?: UseCaseCard[];
    /** Organisation settings (for report/dossier context) */
    orgSettings?: OrgSettings | null;
    /** Callback after card is updated (e.g. trust portal activation) */
    onCardUpdate?: (card: UseCaseCard) => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDateDE(isoDate: string): string {
    try {
        const d = new Date(isoDate);
        if (isNaN(d.getTime())) return "–";
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
    } catch {
        return "–";
    }
}

/**
 * Trigger a file download in the browser.
 */
function downloadBlob(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ── Component ───────────────────────────────────────────────────────────────

export function GovernanceLiabilitySection({
    card,
    useCases = [],
    orgSettings,
    onCardUpdate,
}: GovernanceLiabilitySectionProps) {
    const { toast } = useToast();
    const [isActivatingPortal, setIsActivatingPortal] = useState(false);

    // ── Capability checks ───────────────────────────────────────────────
    const reviewCap = useCapability("reviewWorkflow");
    const trustCap = useCapability("trustPortal");

    // ── Section 1: Stammdokumentation ───────────────────────────────────
    const iso = card.governanceAssessment?.flex?.iso;

    const hasRiskClass = !!card.governanceAssessment?.core?.aiActCategory
        || (!!card.dataCategory && card.dataCategory !== "NONE");
    const hasOwner = !!card.responsibility?.responsibleParty
        || card.responsibility?.isCurrentlyResponsible === true;
    const hasOversight = !!iso?.oversightModel && iso.oversightModel !== "unknown";
    const hasReviewCycle = !!iso?.reviewCycle && iso.reviewCycle !== "unknown";

    const section1Checks = [hasRiskClass, hasOwner, hasOversight, hasReviewCycle];
    const section1Passed = section1Checks.filter(Boolean).length;
    const section1Total = section1Checks.length;
    const isRegistered = section1Passed === section1Total;

    const section1StatusIcon = useMemo(() => {
        if (section1Passed === section1Total) {
            return <CheckCircle2 className="w-4 h-4 text-green-600" />;
        }
        if (section1Passed >= 2) {
            return <AlertCircle className="w-4 h-4 text-amber-500" />;
        }
        return <XCircle className="w-4 h-4 text-red-500" />;
    }, [section1Passed, section1Total]);

    // ── Section 2: Prüfhistorie ─────────────────────────────────────────
    const hasHistory = card.reviews != null && card.reviews.length > 0;
    const deadline = useMemo(() => calculateReviewDeadline(card), [card]);
    const hasReminders = deadline.status !== "no_deadline";
    const isPruefhistorie = hasHistory && hasReminders;

    // Report generation check
    const canGenerateReport = hasHistory && orgSettings != null;

    // Context-sensitive triggers
    const isHighRisk = card.governanceAssessment?.core?.aiActCategory === "Hochrisiko"
        || card.governanceAssessment?.core?.aiActCategory === "Verboten";
    const isExternal = card.usageContexts?.includes("CUSTOMER_FACING")
        || card.usageContexts?.includes("EXTERNAL_PUBLIC");
    const needsProHint = (isHighRisk && !hasHistory)
        || (iso?.reviewCycle === "monthly" && !hasReminders);

    // ── Section 3: Extern belegbar ──────────────────────────────────────
    const hasTrustPortal = isPubliclyVerifiable(card);
    const hasAuditDossier = orgSettings != null
        ? isDossierGeneratable(useCases, orgSettings)
        : false;
    const isExternBelegbar = hasTrustPortal || hasAuditDossier;
    const needsEnterpriseHint = isExternal && !hasTrustPortal;
    const verifyUrl = getVerifyUrl(card);

    // ── Button Handlers ─────────────────────────────────────────────────

    const handleActivateReviewWorkflow = useCallback(() => {
        if (!reviewCap.allowed) {
            toast({
                title: "Funktion nicht verfügbar",
                description: `Review-Workflows sind ab dem ${reviewCap.requiredPlanLabel} verfügbar. Upgrade unter Einstellungen.`,
            });
            return;
        }
        // Review dialog will be built in GN-E
        toast({
            title: "Prüfhistorie",
            description: "Review-Funktion wird in Kürze freigeschaltet.",
        });
    }, [reviewCap, toast]);

    const handleActivateTrustPortal = useCallback(async () => {
        if (!trustCap.allowed) {
            toast({
                title: "Funktion nicht verfügbar",
                description: `Trust Portal ist ab dem ${trustCap.requiredPlanLabel} verfügbar. Upgrade unter Einstellungen.`,
            });
            return;
        }

        setIsActivatingPortal(true);
        try {
            const result = await activatePublicVisibility(card.useCaseId);
            onCardUpdate?.(result.card);
            toast({
                title: "Trust Portal aktiviert",
                description: `Öffentlicher Governance-Nachweis ist jetzt unter ${result.verifyUrl} erreichbar.`,
            });
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Fehler",
                description: "Trust Portal konnte nicht aktiviert werden.",
            });
            console.error("Trust Portal activation failed:", err);
        } finally {
            setIsActivatingPortal(false);
        }
    }, [card.useCaseId, trustCap, toast, onCardUpdate]);

    const handleDownloadReport = useCallback(() => {
        if (!orgSettings) return;
        try {
            const report = generateGovernanceReport(
                useCases.length > 0 ? useCases : [card],
                orgSettings,
            );
            const csv = governanceReportToCSV(report);
            const dateStr = new Date().toISOString().slice(0, 10);
            downloadBlob(
                csv,
                `governance-report-${dateStr}.csv`,
                "text/csv;charset=utf-8",
            );
            toast({
                title: "Report heruntergeladen",
                description: "Governance-Stichtagsreport als CSV gespeichert.",
            });
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Fehler",
                description: "Report konnte nicht generiert werden.",
            });
            console.error("Report generation failed:", err);
        }
    }, [card, useCases, orgSettings, toast]);

    // ── Render ──────────────────────────────────────────────────────────

    return (
        <Card className="border-slate-300">
            <CardHeader className="bg-slate-50 border-b pb-4">
                <CardTitle className="text-base uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    Governance-Nachweis
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 text-sm">

                {/* ── Section 1: Stammdokumentation ──────────────────── */}
                <div className="p-4 border-b">
                    <h4 className="font-semibold mb-3 flex items-center justify-between">
                        <span>1. Stammdokumentation</span>
                        <span className="flex items-center gap-1.5">
                            <span className="text-xs font-normal text-muted-foreground">
                                {section1Passed}/{section1Total}
                            </span>
                            {section1StatusIcon}
                        </span>
                    </h4>
                    <ul className="space-y-2 text-muted-foreground text-xs">
                        <li className="flex items-center gap-2">
                            {hasRiskClass
                                ? <CheckCircle2 className="w-3 h-3 shrink-0 text-green-600" />
                                : <XCircle className="w-3 h-3 shrink-0 text-red-500" />}
                            Risiko klassifiziert
                        </li>
                        <li className="flex items-center gap-2">
                            {hasOwner
                                ? <CheckCircle2 className="w-3 h-3 shrink-0 text-green-600" />
                                : <XCircle className="w-3 h-3 shrink-0 text-red-500" />}
                            Verantwortliche:r definiert
                        </li>
                        <li className="flex items-center gap-2">
                            {hasOversight
                                ? <CheckCircle2 className="w-3 h-3 shrink-0 text-green-600" />
                                : <XCircle className="w-3 h-3 shrink-0 text-red-500" />}
                            Aufsichtsmodell festgelegt
                        </li>
                        <li className="flex items-center gap-2">
                            {hasReviewCycle
                                ? <CheckCircle2 className="w-3 h-3 shrink-0 text-green-600" />
                                : <XCircle className="w-3 h-3 shrink-0 text-red-500" />}
                            Review-Zyklen definiert
                        </li>
                    </ul>
                </div>

                {/* ── Section 2: Prüfhistorie ────────────────────────── */}
                <div className="p-4 border-b bg-slate-50/50">
                    <h4 className="font-semibold mb-3 flex items-center justify-between">
                        <span>2. Mit Prüfhistorie</span>
                        {isPruefhistorie
                            ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                            : <Lock className="w-4 h-4 text-slate-400" />}
                    </h4>
                    <ul className="space-y-2 text-muted-foreground text-xs">
                        {/* Deadline monitoring */}
                        <li className="flex items-center gap-2">
                            {hasReminders
                                ? <CheckCircle2 className="w-3 h-3 shrink-0 text-green-600" />
                                : <AlertCircle className="w-3 h-3 shrink-0 text-slate-400" />}
                            <span>Fristüberwachung</span>
                        </li>
                        {hasReminders && (
                            <li className="ml-5 flex items-center gap-1.5">
                                <Clock className="w-3 h-3 shrink-0" />
                                <DeadlineDisplay status={deadline.status} daysRemaining={deadline.daysRemaining} nextReviewAt={deadline.nextReviewAt} />
                            </li>
                        )}

                        {/* Review history */}
                        <li className="flex items-center gap-2">
                            {hasHistory
                                ? <CheckCircle2 className="w-3 h-3 shrink-0 text-green-600" />
                                : <AlertCircle className="w-3 h-3 shrink-0 text-slate-400" />}
                            <span>
                                Review-Historie
                                {hasHistory && (
                                    <span className="text-muted-foreground ml-1">
                                        ({card.reviews.length} {card.reviews.length === 1 ? "Review" : "Reviews"})
                                    </span>
                                )}
                            </span>
                        </li>

                        {/* Report */}
                        <li className="flex items-center gap-2">
                            {canGenerateReport
                                ? <CheckCircle2 className="w-3 h-3 shrink-0 text-green-600" />
                                : <AlertCircle className="w-3 h-3 shrink-0 text-slate-400" />}
                            <span>Governance-Report</span>
                            {canGenerateReport && (
                                <button
                                    onClick={handleDownloadReport}
                                    className="ml-auto inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                    <Download className="w-3 h-3" />
                                    CSV
                                </button>
                            )}
                        </li>
                    </ul>

                    {/* Pro upsell hint – sachlich, nicht aggressiv */}
                    {needsProHint && !isPruefhistorie && (
                        <div className="mt-4 p-3 bg-slate-100 border border-slate-200 rounded-md text-slate-700 text-xs">
                            <div className="flex items-start gap-2">
                                <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                                <div>
                                    <strong className="block mb-1">Review-Workflows</strong>
                                    {isHighRisk
                                        ? "Für Hochrisiko-Systeme empfiehlt Art. 14 AI Act eine dokumentierte menschliche Aufsicht. Eine Prüfhistorie macht dies belastbar nachweisbar."
                                        : "Review-Workflows und automatische Fristüberwachung dokumentieren die Umsetzung Ihrer Governance-Vorgaben."}
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full mt-3"
                                onClick={handleActivateReviewWorkflow}
                            >
                                {reviewCap.allowed
                                    ? "Prüfhistorie aktivieren"
                                    : <>
                                        <Lock className="w-3 h-3 mr-1.5" />
                                        Ab {reviewCap.requiredPlanLabel}
                                    </>}
                            </Button>
                        </div>
                    )}
                </div>

                {/* ── Section 3: Extern belegbar ─────────────────────── */}
                <div className="p-4 bg-slate-50/50">
                    <h4 className="font-semibold mb-3 flex items-center justify-between">
                        <span>3. Extern belegbar</span>
                        {isExternBelegbar
                            ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                            : <Lock className="w-4 h-4 text-slate-400" />}
                    </h4>
                    <ul className="space-y-2 text-muted-foreground text-xs">
                        {/* Audit Dossier */}
                        <li className="flex items-center gap-2">
                            {hasAuditDossier
                                ? <CheckCircle2 className="w-3 h-3 shrink-0 text-green-600" />
                                : <AlertCircle className="w-3 h-3 shrink-0 text-slate-400" />}
                            ISO 42001 Audit-Dossier
                        </li>

                        {/* Trust Portal */}
                        <li className="flex items-center gap-2">
                            {hasTrustPortal
                                ? <CheckCircle2 className="w-3 h-3 shrink-0 text-green-600" />
                                : <AlertCircle className="w-3 h-3 shrink-0 text-slate-400" />}
                            <span>Governance-Nachweis (Trust Portal)</span>
                        </li>

                        {/* Verify link if active */}
                        {hasTrustPortal && verifyUrl && (
                            <li className="ml-5 flex items-center gap-1.5">
                                <ExternalLink className="w-3 h-3 shrink-0 text-blue-600" />
                                <a
                                    href={verifyUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 hover:underline truncate"
                                >
                                    {verifyUrl}
                                </a>
                            </li>
                        )}
                    </ul>

                    {/* Enterprise upsell hint – sachlich */}
                    {needsEnterpriseHint && !isExternBelegbar && (
                        <div className="mt-4 p-3 bg-slate-100 border border-slate-200 rounded-md text-slate-700 text-xs">
                            <div className="flex items-start gap-2">
                                <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                                <div>
                                    <strong className="block mb-1">Externe Belegbarkeit</strong>
                                    Dieses System betrifft externe Nutzer. Ein öffentlicher Governance-Nachweis im Trust Portal stärkt das Vertrauen.
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full mt-3"
                                onClick={() => void handleActivateTrustPortal()}
                                disabled={isActivatingPortal}
                            >
                                {trustCap.allowed
                                    ? (isActivatingPortal ? "Wird aktiviert…" : "Trust Portal aktivieren")
                                    : <>
                                        <Lock className="w-3 h-3 mr-1.5" />
                                        Ab {trustCap.requiredPlanLabel}
                                    </>}
                            </Button>
                        </div>
                    )}
                </div>

            </CardContent>
        </Card>
    );
}

// ── Sub-Component: Deadline Display ─────────────────────────────────────────

function DeadlineDisplay({
    status,
    daysRemaining,
    nextReviewAt,
}: {
    status: string;
    daysRemaining: number | null;
    nextReviewAt: string | null;
}) {
    if (status === "overdue" && daysRemaining !== null) {
        return (
            <span className="text-red-600 font-medium">
                Überfällig seit {Math.abs(daysRemaining)} {Math.abs(daysRemaining) === 1 ? "Tag" : "Tagen"}
            </span>
        );
    }
    if (status === "due_soon" && daysRemaining !== null) {
        return (
            <span className="text-amber-600 font-medium">
                Fällig in {daysRemaining} {daysRemaining === 1 ? "Tag" : "Tagen"}
            </span>
        );
    }
    if (status === "on_track" && nextReviewAt) {
        return (
            <span className="text-green-600">
                Nächste Prüfung: {formatDateDE(nextReviewAt)}
            </span>
        );
    }
    return (
        <span className="text-muted-foreground">
            {getDeadlineStatusLabel(status as "overdue" | "due_soon" | "on_track" | "no_deadline")}
        </span>
    );
}
