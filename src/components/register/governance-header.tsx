"use client";

import { useMemo } from "react";
import { Activity, Eye, FileCheck, AlertTriangle, BarChart3 } from "lucide-react";
import type { UseCaseCard, RegisterUseCaseStatus } from "@/lib/register-first/types";
import { registerUseCaseStatusLabels } from "@/lib/register-first/status-flow";

// ── Types ────────────────────────────────────────────────────────────────────

interface GovernanceHeaderProps {
    useCases: UseCaseCard[];
    onQuickCapture?: () => void;
}

interface KpiItem {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
}

// ── Status Colors ────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<RegisterUseCaseStatus, string> = {
    UNREVIEWED: "#94a3b8",       // slate-400
    REVIEW_RECOMMENDED: "#f59e0b", // amber-500
    REVIEWED: "#3b82f6",          // blue-500
    PROOF_READY: "#10b981",       // emerald-500
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatLastActivity(useCases: UseCaseCard[]): { time: string; name: string } | null {
    if (useCases.length === 0) return null;

    const sorted = [...useCases].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    const latest = sorted[0];
    const date = new Date(latest.updatedAt);

    const today = new Date();
    const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

    const time = isToday
        ? `Heute ${date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`
        : date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

    return { time, name: latest.purpose };
}

// ── Component ────────────────────────────────────────────────────────────────

export function GovernanceHeader({ useCases, onQuickCapture }: GovernanceHeaderProps) {
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

    const lastActivity = useMemo(() => formatLastActivity(useCases), [useCases]);

    const kpis: KpiItem[] = [
        {
            label: "Use Cases",
            value: counts.total,
            icon: <BarChart3 className="h-4 w-4" />,
            color: "text-foreground",
        },
        {
            label: "Ungeprüft",
            value: counts.byStatus.UNREVIEWED,
            icon: <AlertTriangle className="h-4 w-4" />,
            color: counts.byStatus.UNREVIEWED > 0 ? "text-amber-500" : "text-muted-foreground",
        },
        {
            label: "Review empf.",
            value: counts.byStatus.REVIEW_RECOMMENDED,
            icon: <FileCheck className="h-4 w-4" />,
            color: counts.byStatus.REVIEW_RECOMMENDED > 0 ? "text-blue-500" : "text-muted-foreground",
        },
        {
            label: "Proof-ready",
            value: counts.byStatus.PROOF_READY,
            icon: <FileCheck className="h-4 w-4" />,
            color: counts.byStatus.PROOF_READY > 0 ? "text-emerald-500" : "text-muted-foreground",
        },
        {
            label: "Öffentlich",
            value: counts.publicCount,
            icon: <Eye className="h-4 w-4" />,
            color: counts.publicCount > 0 ? "text-violet-500" : "text-muted-foreground",
        },
    ];

    // Next action CTA
    const nextAction = useMemo(() => {
        if (counts.byStatus.UNREVIEWED > 0) {
            return `${counts.byStatus.UNREVIEWED} ungeprüft → jetzt sichten`;
        }
        if (counts.byStatus.REVIEW_RECOMMENDED > 0) {
            return `${counts.byStatus.REVIEW_RECOMMENDED} Review empfohlen → prüfen`;
        }
        if (counts.total === 0) {
            return "Ersten Use Case erfassen";
        }
        return null;
    }, [counts]);

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

    return (
        <div className="space-y-4">
            {/* Title */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">AI Governance Register</h1>
                    <p className="text-sm text-muted-foreground">
                        Governance entsteht nur durch menschliche Entscheidungen.
                    </p>
                </div>
                {onQuickCapture && (
                    <button
                        onClick={onQuickCapture}
                        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        + Erfassen
                        <kbd className="hidden rounded bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] font-mono sm:inline-block">
                            ⌘K
                        </kbd>
                    </button>
                )}
            </div>

            {/* KPI Bar */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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

            {/* Footer: Last Activity + Next Action */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                {lastActivity && (
                    <div className="flex items-center gap-1.5">
                        <Activity className="h-3 w-3" />
                        <span>
                            Letzte Aktivität: {lastActivity.time} – „{lastActivity.name}"
                        </span>
                    </div>
                )}
                {nextAction && (
                    <button
                        onClick={onQuickCapture}
                        className="font-medium text-primary hover:underline"
                    >
                        {nextAction}
                    </button>
                )}
            </div>
        </div>
    );
}
