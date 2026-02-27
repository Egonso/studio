"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Settings, Link2, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { UseCaseCard, RegisterUseCaseStatus, Register } from "@/lib/register-first/types";
import { registerUseCaseStatusLabels } from "@/lib/register-first/status-flow";
import { accessCodeService } from "@/lib/register-first/access-code-service";
import { cn } from "@/lib/utils";

// ── Constants ────────────────────────────────────────────────────────────────

const REGISTER_VERSION = "1.0";

interface GovernanceHeaderProps {
    useCases: UseCaseCard[];
    register?: Register | null;
    onQuickCapture?: () => void;
    onRegisterUpdated?: (partial: Partial<Register>) => void;
    children?: React.ReactNode;
}

const STATUS_DOT_CLASS: Record<RegisterUseCaseStatus, string> = {
    UNREVIEWED: "border border-slate-400",
    REVIEW_RECOMMENDED: "border border-slate-500/80",
    REVIEWED: "bg-blue-600",
    PROOF_READY: "bg-emerald-600",
};

// ── Component ────────────────────────────────────────────────────────────────

export function GovernanceHeader({ useCases, register, onQuickCapture, children }: GovernanceHeaderProps) {
    const router = useRouter();
    const { toast } = useToast();

    const counts = useMemo(() => {
        const byStatus: Record<RegisterUseCaseStatus, number> = {
            UNREVIEWED: 0,
            REVIEW_RECOMMENDED: 0,
            REVIEWED: 0,
            PROOF_READY: 0,
        };
        let publicCount = 0;

        for (const uc of useCases) {
            byStatus[uc.status] = (byStatus[uc.status] ?? 0) + 1;
            if (uc.isPublicVisible) publicCount++;
        }
        return { byStatus, publicCount, total: useCases.length };
    }, [useCases]);

    const openReviews = counts.byStatus.UNREVIEWED + counts.byStatus.REVIEW_RECOMMENDED;
    const proofReadyCount = counts.byStatus.PROOF_READY;
    const proofReadyRatio = counts.total > 0 ? proofReadyCount / counts.total : 0;
    const proofReadyPercent = Math.round(proofReadyRatio * 100);
    const meetsProofReadyStandard = counts.total > 0 && proofReadyRatio >= 0.8;
    const missingForProofReadyStandard = Math.max(
        0,
        Math.ceil(counts.total * 0.8) - proofReadyCount
    );

    const statusSummary = useMemo(
        () =>
            (Object.entries(counts.byStatus) as [RegisterUseCaseStatus, number][])
                .filter(([, count]) => count > 0)
                .map(([status, count]) => ({
                    status,
                    count,
                    label: registerUseCaseStatusLabels[status],
                })),
        [counts.byStatus]
    );

    // Org scope
    const orgName = register?.organisationName;
    const orgUnit = register?.organisationUnit;
    const orgSettings = register?.orgSettings;

    const handleSupplierRequest = async () => {
        if (!register?.registerId) return;
        const link = `${window.location.origin}/request/${register.registerId}`;
        try {
            await navigator.clipboard.writeText(link);
            toast({
                title: "Magic Link kopiert",
                description: "Der Anfrage-Link für Lieferanten wurde in die Zwischenablage kopiert. Sie können diesen nun per E-Mail versenden.",
            });
        } catch {
            toast({
                variant: "destructive",
                title: "Fehler",
                description: "Link konnte nicht kopiert werden.",
            });
        }
    };

    const handleCopyCaptureLink = async () => {
        if (!register?.registerId) return;
        try {
            const codes = await accessCodeService.listCodes(register.registerId);
            const activeCode = codes.find(
                (code) =>
                    code.isActive &&
                    (!code.expiresAt || new Date(code.expiresAt) > new Date())
            );
            const resolvedCode = activeCode
                ? activeCode.code
                : (
                    await accessCodeService.generateCode(register.registerId, {
                        label: "Utility Link",
                        expiryOption: "90_DAYS",
                    })
                ).code;
            const captureLink = `${window.location.origin}/erfassen?code=${encodeURIComponent(resolvedCode)}`;
            await navigator.clipboard.writeText(captureLink);
            toast({
                title: "Erfassungslink kopiert",
                description: "Der Link wurde in die Zwischenablage kopiert.",
            });
        } catch {
            toast({
                variant: "destructive",
                title: "Fehler",
                description: "Erfassungslink konnte nicht kopiert werden.",
            });
        }
    };

    return (
        <div className="space-y-6 border-b border-border/80 pb-6">
            {/* Title + Scope */}
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                        <Image
                            src="/register-logo.png"
                            alt="AI Governance Register"
                            width={32}
                            height={32}
                            className="h-8 w-8 dark:invert"
                        />
                        <h1 className="text-2xl font-bold tracking-tight">AI Governance Register</h1>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Verbindliche Dokumentation aller KI-Einsatzfälle.
                    </p>
                    {/* Org scope block */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 pt-1 text-xs text-muted-foreground">
                        {orgName ? (
                            <>
                                <span>Organisation: <span className="font-medium text-foreground">{orgName}</span></span>
                                {orgUnit && (
                                    <span>Organisationseinheit: <span className="font-medium text-foreground">{orgUnit}</span></span>
                                )}
                                {orgSettings?.industry && (
                                    <span>Branche: <span className="font-medium text-foreground">{orgSettings.industry}</span></span>
                                )}
                                {orgSettings?.contactPerson?.name && (
                                    <span>Kontakt: <span className="font-medium text-foreground">{orgSettings.contactPerson.name}</span></span>
                                )}
                            </>
                        ) : (
                            <span>Scope: Private Registerinstanz</span>
                        )}
                        <span>Register-Version: {REGISTER_VERSION}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {register && (
                        <button
                            onClick={() => router.push('/settings/governance')}
                            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            title="Governance-Einstellungen"
                        >
                            <Settings className="h-4 w-4" />
                        </button>
                    )}
                    {register && onQuickCapture && (
                        <button
                            onClick={onQuickCapture}
                            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            + KI-Einsatzfall erfassen
                        </button>
                    )}
                    {register && (
                        <button
                            onClick={handleSupplierRequest}
                            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            <Link2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Lieferant anfragen</span>
                        </button>
                    )}
                    {register && (
                        <button
                            onClick={() => void handleCopyCaptureLink()}
                            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            title="Erfassungslink teilen"
                        >
                            <Share2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Erfassungslink teilen</span>
                        </button>
                    )}
                </div>
            </div>

            {children && (
                <div className="pt-2">
                    {children}
                </div>
            )}

            <div className="grid gap-5 border-t border-border/80 pt-4 md:grid-cols-[1.4fr_1fr]">
                <div className="space-y-3">
                    <div
                        className={cn(
                            "border-l pl-3",
                            meetsProofReadyStandard
                                ? "border-emerald-500/60"
                                : "border-slate-300"
                        )}
                    >
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Dokumentationsreife
                        </p>
                        <p className="text-sm font-medium">
                            Nachweisfähig:{" "}
                            <span className="tabular-nums">
                                {proofReadyCount} von {counts.total}
                            </span>{" "}
                            ({proofReadyPercent}%)
                        </p>
                        <p
                            className={cn(
                                "text-xs",
                                meetsProofReadyStandard
                                    ? "text-emerald-700"
                                    : "text-muted-foreground"
                            )}
                        >
                            {counts.total === 0
                                ? "Der Registerstandard beginnt mit dem ersten dokumentierten Einsatzfall."
                                : meetsProofReadyStandard
                                    ? "Registerstandard erreicht: Mindestens 80% der Einsatzfälle sind nachweisfähig."
                                    : `Standardziel: 80% nachweisfähig. Es fehlen ${missingForProofReadyStandard} Einsatzfall${missingForProofReadyStandard === 1 ? "" : "e"}.`}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        <div className="space-y-0.5">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                Einsatzfälle gesamt
                            </p>
                            <p className="font-medium tabular-nums">{counts.total}</p>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                Offene Prüfungen
                            </p>
                            <p className="font-medium tabular-nums">{openReviews}</p>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Statusverteilung
                    </p>
                    {statusSummary.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Noch keine Statusdaten vorhanden.
                        </p>
                    ) : (
                        <ul className="space-y-1.5">
                            {statusSummary.map((entry) => (
                                <li
                                    key={entry.status}
                                    className="flex items-center justify-between gap-2 text-sm"
                                >
                                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                                        <span
                                            className={cn(
                                                "h-2 w-2 shrink-0 rounded-full",
                                                STATUS_DOT_CLASS[entry.status]
                                            )}
                                        />
                                        {entry.label}
                                    </span>
                                    <span className="tabular-nums text-foreground">
                                        {entry.count}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
