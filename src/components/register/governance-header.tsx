"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Settings, Link2, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { UseCaseCard, RegisterUseCaseStatus, Register } from "@/lib/register-first/types";
import { accessCodeService } from "@/lib/register-first/access-code-service";

// ── Constants ────────────────────────────────────────────────────────────────

const REGISTER_VERSION = "1.0";

interface GovernanceHeaderProps {
    useCases: UseCaseCard[];
    register?: Register | null;
    onQuickCapture?: () => void;
    onRegisterUpdated?: (partial: Partial<Register>) => void;
    children?: React.ReactNode;
}

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

            <div className="grid gap-3 border-t border-border/80 pt-4 sm:grid-cols-2">
                <div className="rounded-md border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Einsatzfälle gesamt
                    </p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
                        {counts.total}
                    </p>
                </div>
                <div className="rounded-md border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Offene Prüfungen
                    </p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
                        {openReviews}
                    </p>
                </div>
            </div>
        </div>
    );
}
