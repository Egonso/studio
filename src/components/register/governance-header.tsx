"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertTriangle, BarChart3, Settings, Link2, Shield, Zap, Download, Lock, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { UseCaseCard, RegisterUseCaseStatus, Register } from "@/lib/register-first/types";
import { registerUseCaseStatusLabels } from "@/lib/register-first/status-flow";
import { aggregateOrgScores, getExposureColor } from "@/lib/compliance-engine/scores";
import { FeatureGate } from "@/components/register/feature-gate";
import { FeatureGateDialog } from "@/components/feature-gate-dialog";
import { generateAuditExport, auditToCSV } from "@/lib/compliance-engine/audit/audit-export";
import { useCapability } from "@/lib/compliance-engine/capability/useCapability";
import { accessCodeService } from "@/lib/register-first/access-code-service";

// ── Constants ────────────────────────────────────────────────────────────────

const REGISTER_VERSION = "1.0";

interface KpiItem {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
}

interface GovernanceHeaderProps {
    useCases: UseCaseCard[];
    register?: Register | null;
    onQuickCapture?: () => void;
    onRegisterUpdated?: (partial: Partial<Register>) => void;
    children?: React.ReactNode;
}

// ── Status Colors ────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<RegisterUseCaseStatus, string> = {
    UNREVIEWED: "#94a3b8",
    REVIEW_RECOMMENDED: "#94a3b8",
    REVIEWED: "#3b82f6",
    PROOF_READY: "#10b981",
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

    const orgScores = useMemo(() => aggregateOrgScores(useCases), [useCases]);

    const kpis: KpiItem[] = [
        {
            label: "Registrierte Einsatzfälle",
            value: counts.total,
            icon: <BarChart3 className="h-4 w-4" />,
            color: "text-foreground",
        },
        {
            label: "Formale Prüfung ausstehend",
            value: counts.byStatus.UNREVIEWED,
            icon: <AlertTriangle className="h-4 w-4" />,
            color: "text-muted-foreground",
        },
    ];

    // Status distribution segments
    const segments = useMemo(() => {
        if (counts.total === 0) return [];
        return (Object.entries(counts.byStatus) as [RegisterUseCaseStatus, number][])
            .filter(([, count]) => count > 0)
            .map(([status, count]) => ({
                status,
                count,
                percentage: (count / counts.total) * 100,
                color: STATUS_COLORS[status],
                label: registerUseCaseStatusLabels[status],
            }));
    }, [counts]);

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

    const { allowed: canExport } = useCapability('auditExport');
    const { allowed: canAssessment, loading: assessmentLoading } = useCapability('assessmentWizard');
    const [showAssessmentGate, setShowAssessmentGate] = useState(false);

    const handleAuditExport = () => {
        if (!register || !canExport) return;
        const audit = generateAuditExport(register, useCases, register.organisationName || 'User');
        const csv = auditToCSV(audit);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-export-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: 'Audit-Export', description: 'CSV-Datei heruntergeladen.' });
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
        <div className="space-y-4">
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
                    {register && canExport && (
                        <button
                            onClick={handleAuditExport}
                            className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-500/10"
                            title="Audit-Export als CSV herunterladen"
                        >
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">Audit-Export</span>
                        </button>
                    )}
                    {!canAssessment && !assessmentLoading && (
                        <button
                            onClick={() => setShowAssessmentGate(true)}
                            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            title="Erweiterte Governance-Funktionen"
                        >
                            <Lock className="h-3 w-3" />
                            <span className="hidden sm:inline">Erweitert</span>
                        </button>
                    )}
                </div>
            </div>

            {children && (
                <div className="pt-2">
                    {children}
                </div>
            )}

            {/* KPI Bar */}
            <div className="grid grid-cols-2 gap-3">
                {kpis.map((kpi) => (
                    <div
                        key={kpi.label}
                        className="flex items-center gap-3 rounded-lg border bg-card p-3"
                    >
                        <div className={`${kpi.color} opacity-70`}>{kpi.icon}</div>
                        <div>
                            <p className="text-2xl font-semibold tabular-nums">{kpi.value}</p>
                            <p className="text-xs text-muted-foreground">{kpi.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Dual Score Indicators (Pro/Enterprise) */}
            {useCases.length > 0 && (
                <FeatureGate feature="assessmentWizard" mode="hide">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Governance Quality */}
                        <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
                            <div className="relative flex items-center justify-center">
                                <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
                                    <path
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        className="text-muted/30"
                                    />
                                    <path
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeDasharray={`${orgScores.avgQuality}, 100`}
                                        className={orgScores.avgQuality >= 60 ? 'text-emerald-500' : orgScores.avgQuality >= 40 ? 'text-amber-500' : 'text-red-400'}
                                    />
                                </svg>
                                <span className="absolute text-xs font-bold tabular-nums">{orgScores.avgQuality}%</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-sm font-medium">Governance Quality</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{orgScores.avgQualityLabel} · Ø über {orgScores.totalUseCases} Einsatzfälle</p>
                            </div>
                        </div>

                        {/* Exposure Level */}
                        <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
                            <div
                                className="flex h-14 w-14 items-center justify-center rounded-full"
                                style={{ backgroundColor: `${getExposureColor(orgScores.maxExposure)}15` }}
                            >
                                <Zap className="h-6 w-6" style={{ color: getExposureColor(orgScores.maxExposure) }} />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-medium">Exposure</span>
                                    <span
                                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                                        style={{ backgroundColor: getExposureColor(orgScores.maxExposure) }}
                                    >
                                        {orgScores.maxExposureLabel}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {orgScores.exposureDistribution.critical > 0 && `${orgScores.exposureDistribution.critical} kritisch · `}
                                    {orgScores.exposureDistribution.high > 0 && `${orgScores.exposureDistribution.high} hoch · `}
                                    {orgScores.exposureDistribution.medium > 0 && `${orgScores.exposureDistribution.medium} mittel · `}
                                    {orgScores.exposureDistribution.low > 0 && `${orgScores.exposureDistribution.low} gering`}
                                </p>
                            </div>
                        </div>
                    </div>
                </FeatureGate>
            )}

            {/* Status Distribution Bar */}
            {segments.length > 0 && (
                <div className="space-y-2">
                    <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                        {segments.map((seg) => (
                            <div
                                key={seg.status}
                                style={{
                                    width: `${seg.percentage}%`,
                                    backgroundColor: seg.color,
                                    minWidth: seg.percentage > 0 ? "4px" : "0",
                                }}
                                title={`${seg.label}: ${seg.count}`}
                                className="transition-all duration-300"
                            />
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {segments.map((seg) => (
                            <div key={seg.status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span
                                    className="inline-block h-2 w-2 rounded-full"
                                    style={{ backgroundColor: seg.color }}
                                />
                                {seg.label}: {seg.count}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <FeatureGateDialog feature="assessmentWizard" open={showAssessmentGate} onOpenChange={setShowAssessmentGate} />
        </div>
    );
}
