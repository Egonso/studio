"use client";

import { useState, useMemo, useCallback } from "react";
import {
    AlertCircle,
    Check,
    CheckCircle2,
    Clock,
    Download,
    ExternalLink,
    Pencil,
    ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { UseCaseCard, OrgSettings } from "@/lib/register-first/types";
import { useToast } from "@/hooks/use-toast";
import { useCapability } from "@/lib/compliance-engine/capability/useCapability";
import { registerService } from "@/lib/register-first/register-service";
import { ReviewDialog } from "./review-dialog";

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
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

    // ── Inline-Edit state for Section 1 ─────────────────────────────────
    const [editingField, setEditingField] = useState<"oversight" | "reviewCycle" | null>(null);
    const [editValue, setEditValue] = useState("");
    const [isSavingInline, setIsSavingInline] = useState(false);

    // ── Capability checks ───────────────────────────────────────────────
    const reviewCap = useCapability("reviewWorkflow");
    const trustCap = useCapability("trustPortal");

    // ── Section 1: Stammdokumentation ───────────────────────────────────
    const iso = card.governanceAssessment?.flex?.iso;

    const hasRiskClass = !!card.governanceAssessment?.core?.aiActCategory
        || (!!card.dataCategory && card.dataCategory !== "NONE");
    const hasOwner = !!card.responsibility?.responsibleParty
        || card.responsibility?.isCurrentlyResponsible === true;
    // OrgSettings fallback: If per-card ISO data is missing, check org-wide reviewStandard
    const hasOversight = (!!iso?.oversightModel && iso.oversightModel !== "unknown");
    const hasReviewCycle = (!!iso?.reviewCycle && iso.reviewCycle !== "unknown")
        || !!orgSettings?.reviewStandard;

    const section1Checks = [hasRiskClass, hasOwner, hasOversight, hasReviewCycle];
    const section1Passed = section1Checks.filter(Boolean).length;
    const section1Total = section1Checks.length;
    const isRegistered = section1Passed === section1Total;

    const section1StatusIcon = useMemo(() => {
        if (section1Passed === section1Total) {
            return <CheckCircle2 className="w-4 h-4 text-green-600" />;
        }
        return <span className="inline-block w-4 h-4 rounded-full border-2 border-slate-300" />;
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
        || card.usageContexts?.includes("EXTERNAL_PUBLIC")
        || card.usageContexts?.includes("CUSTOMERS")
        || card.usageContexts?.includes("PUBLIC");
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
                description: `Diese Funktion ist in Ihrem aktuellen Plan nicht enthalten. Details unter Einstellungen.`,
            });
            return;
        }
        setReviewDialogOpen(true);
    }, [reviewCap, toast]);

    const handleActivateTrustPortal = useCallback(async () => {
        if (!trustCap.allowed) {
            toast({
                title: "Funktion nicht verfügbar",
                description: `Diese Funktion ist in Ihrem aktuellen Plan nicht enthalten. Details unter Einstellungen.`,
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

    // ── Inline-Edit Handler ──────────────────────────────────────────────

    const handleInlineEdit = useCallback((field: "oversight" | "reviewCycle") => {
        const currentVal = field === "oversight"
            ? (iso?.oversightModel ?? "unknown")
            : (iso?.reviewCycle ?? "unknown");
        setEditValue(currentVal);
        setEditingField(field);
    }, [iso]);

    const handleInlineSave = useCallback(async () => {
        if (!editingField || !editValue) return;
        setIsSavingInline(true);
        try {
            const currentIso = card.governanceAssessment?.flex?.iso || {};
            const updatedIso = {
                ...currentIso,
                ...(editingField === "oversight" ? { oversightModel: editValue } : {}),
                ...(editingField === "reviewCycle" ? { reviewCycle: editValue } : {}),
            };
            const updatedCard: UseCaseCard = {
                ...card,
                governanceAssessment: {
                    ...card.governanceAssessment,
                    core: card.governanceAssessment?.core || {},
                    flex: {
                        ...card.governanceAssessment?.flex,
                        iso: updatedIso as any,
                    },
                },
            };
            await registerService.updateUseCase(card.useCaseId, updatedCard);
            onCardUpdate?.(updatedCard);
            toast({ title: "Gespeichert", description: editingField === "oversight" ? "Aufsichtsmodell aktualisiert." : "Review-Zyklus aktualisiert." });
        } catch {
            toast({ variant: "destructive", title: "Fehler", description: "Änderung konnte nicht gespeichert werden." });
        } finally {
            setIsSavingInline(false);
            setEditingField(null);
        }
    }, [editingField, editValue, card, onCardUpdate, toast]);

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
                                {section1Passed} von {section1Total}
                            </span>
                            {section1StatusIcon}
                        </span>
                    </h4>
                    <ul className="space-y-2 text-muted-foreground text-xs">
                        <li className="flex items-center gap-2">
                            {hasRiskClass
                                ? <CheckCircle2 className="w-3 h-3 shrink-0 text-green-600" />
                                : <span className="inline-block w-3 h-3 shrink-0 rounded-full border border-slate-300" />}
                            Risiko klassifiziert
                        </li>
                        <li className="flex items-center gap-2">
                            {hasOwner
                                ? <CheckCircle2 className="w-3 h-3 shrink-0 text-green-600" />
                                : <span className="inline-block w-3 h-3 shrink-0 rounded-full border border-slate-300" />}
                            Verantwortliche:r definiert
                        </li>

                        {/* Aufsichtsmodell – clickable if red */}
                        <li className="flex items-center gap-2">
                            {hasOversight
                                ? <CheckCircle2 className="w-3 h-3 shrink-0 text-green-600" />
                                : <span className="inline-block w-3 h-3 shrink-0 rounded-full border border-slate-300" />}
                            {!hasOversight && editingField !== "oversight" ? (
                                <button
                                    onClick={() => handleInlineEdit("oversight")}
                                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
                                >
                                    Aufsichtsmodell festlegen
                                    <Pencil className="w-2.5 h-2.5" />
                                </button>
                            ) : (
                                <span>Aufsichtsmodell festgelegt</span>
                            )}
                        </li>
                        {editingField === "oversight" && (
                            <li className="ml-5 p-2 bg-blue-50 border border-blue-100 rounded-md">
                                <label className="text-[11px] font-medium text-blue-800 block mb-1">Aufsichtsmodell wählen:</label>
                                <Select value={editValue} onValueChange={setEditValue}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Modell wählen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="HITL">Human-in-the-Loop (HITL)</SelectItem>
                                        <SelectItem value="HOTL">Human-on-the-Loop (HOTL)</SelectItem>
                                        <SelectItem value="HUMAN_REVIEW">Menschliche Überprüfung</SelectItem>
                                        <SelectItem value="NO_HUMAN">Kein menschl. Eingriff</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex gap-2 mt-2">
                                    <Button size="sm" className="h-7 text-xs" onClick={() => void handleInlineSave()} disabled={isSavingInline || editValue === "unknown"}>
                                        <Check className="w-3 h-3 mr-1" />{isSavingInline ? "…" : "Speichern"}
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingField(null)}>Abbrechen</Button>
                                </div>
                            </li>
                        )}

                        {/* Review-Zyklen – clickable if red */}
                        <li className="flex items-center gap-2">
                            {hasReviewCycle
                                ? <CheckCircle2 className="w-3 h-3 shrink-0 text-green-600" />
                                : <span className="inline-block w-3 h-3 shrink-0 rounded-full border border-slate-300" />}
                            {!hasReviewCycle && editingField !== "reviewCycle" ? (
                                <button
                                    onClick={() => handleInlineEdit("reviewCycle")}
                                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
                                >
                                    Review-Zyklus festlegen
                                    <Pencil className="w-2.5 h-2.5" />
                                </button>
                            ) : (
                                <span>Review-Zyklen definiert</span>
                            )}
                        </li>
                        {editingField === "reviewCycle" && (
                            <li className="ml-5 p-2 bg-blue-50 border border-blue-100 rounded-md">
                                <label className="text-[11px] font-medium text-blue-800 block mb-1">Review-Zyklus wählen:</label>
                                <Select value={editValue} onValueChange={setEditValue}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Zyklus wählen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="monthly">Monatlich</SelectItem>
                                        <SelectItem value="quarterly">Quartalsweise</SelectItem>
                                        <SelectItem value="semiannually">Halbjährlich</SelectItem>
                                        <SelectItem value="annually">Jährlich</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex gap-2 mt-2">
                                    <Button size="sm" className="h-7 text-xs" onClick={() => void handleInlineSave()} disabled={isSavingInline || editValue === "unknown"}>
                                        <Check className="w-3 h-3 mr-1" />{isSavingInline ? "…" : "Speichern"}
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingField(null)}>Abbrechen</Button>
                                </div>
                            </li>
                        )}
                    </ul>
                </div>

                {/* ── Section 2: Prüfhistorie (Pro) ─────────────────── */}
                <div className="p-4 border-b">
                    <h4 className="font-semibold mb-3 flex items-center justify-between">
                        <span>2. Prüfhistorie</span>
                        {isPruefhistorie
                            ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                            : <span className="inline-block w-4 h-4 rounded-full border-2 border-slate-300" />}
                    </h4>

                    {reviewCap.allowed ? (
                        /* ── Pro/Enterprise: Show real data ─────────────── */
                        <>
                            <ul className="space-y-2 text-muted-foreground text-xs">
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
                                    <button
                                        onClick={handleActivateReviewWorkflow}
                                        className="ml-auto inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                        + Review
                                    </button>
                                </li>
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
                                            <Download className="w-3 h-3" /> CSV
                                        </button>
                                    )}
                                </li>
                            </ul>
                        </>
                    ) : (
                        /* ── Locked: Neutral activation card ──────────── */
                        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                            <ul className="space-y-2 text-xs text-muted-foreground mb-4">
                                <li className="flex items-center gap-2">
                                    <span className="inline-block w-3 h-3 shrink-0 rounded-full border border-slate-300" />
                                    Fristüberwachung
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="inline-block w-3 h-3 shrink-0 rounded-full border border-slate-300" />
                                    Review-Historie
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="inline-block w-3 h-3 shrink-0 rounded-full border border-slate-300" />
                                    Governance-Report
                                </li>
                            </ul>
                            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                                Unveränderbare Prüfdokumentation mit automatischer Fristüberwachung.
                            </p>
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-xs"
                                onClick={handleActivateReviewWorkflow}
                            >
                                Dokumentation erweitern
                            </Button>
                        </div>
                    )}
                </div>

                {/* ── Section 3: Extern belegbar (Enterprise) ─────────── */}
                <div className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center justify-between">
                        <span>3. Audit- &amp; Nachweisexport</span>
                        {isExternBelegbar
                            ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                            : <span className="inline-block w-4 h-4 rounded-full border-2 border-slate-300" />}
                    </h4>

                    {trustCap.allowed ? (
                        /* ── Enterprise: Show real data ─────────────────── */
                        <>
                            <ul className="space-y-2 text-muted-foreground text-xs">
                                <li className="flex items-center gap-2">
                                    {hasAuditDossier
                                        ? <CheckCircle2 className="w-3 h-3 shrink-0 text-green-600" />
                                        : <AlertCircle className="w-3 h-3 shrink-0 text-slate-400" />}
                                    ISO 42001 Audit-Dossier
                                </li>
                                <li className="flex items-center gap-2">
                                    {hasTrustPortal
                                        ? <CheckCircle2 className="w-3 h-3 shrink-0 text-green-600" />
                                        : <AlertCircle className="w-3 h-3 shrink-0 text-slate-400" />}
                                    <span>Governance-Nachweis (Trust Portal)</span>
                                </li>
                                {hasTrustPortal && verifyUrl && (
                                    <li className="ml-5 flex items-center gap-1.5">
                                        <ExternalLink className="w-3 h-3 shrink-0 text-blue-600" />
                                        <a href={verifyUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline truncate">
                                            {verifyUrl}
                                        </a>
                                    </li>
                                )}
                            </ul>
                            {needsEnterpriseHint && !hasTrustPortal && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full mt-3 text-xs"
                                    onClick={() => void handleActivateTrustPortal()}
                                    disabled={isActivatingPortal}
                                >
                                    {isActivatingPortal ? "Wird aktiviert…" : "Trust Portal aktivieren"}
                                </Button>
                            )}
                        </>
                    ) : (
                        /* ── Locked: Neutral activation card ─────── */
                        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                            <ul className="space-y-2 text-xs text-muted-foreground mb-4">
                                <li className="flex items-center gap-2">
                                    <span className="inline-block w-3 h-3 shrink-0 rounded-full border border-slate-300" />
                                    ISO 42001 Audit-Dossier
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="inline-block w-3 h-3 shrink-0 rounded-full border border-slate-300" />
                                    Governance-Nachweis (Trust Portal)
                                </li>
                            </ul>
                            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                                Prüffähige Nachweise für ISO-Auditoren und externe Stakeholder.
                            </p>
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-xs"
                                onClick={() => void handleActivateTrustPortal()}
                            >
                                Audit-Export aktivieren
                            </Button>
                        </div>
                    )}
                </div>

            </CardContent>

            {/* Review Dialog (GN-E) */}
            <ReviewDialog
                card={card}
                open={reviewDialogOpen}
                onOpenChange={setReviewDialogOpen}
                onReviewAdded={(updatedCard) => {
                    onCardUpdate?.(updatedCard);
                }}
            />
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
