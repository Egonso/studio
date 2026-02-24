"use client";

import { useState } from "react";
import {
    Clock,
    ChevronDown,
    ChevronRight,
    ArrowRight,
    FileText,
    User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PolicyVersion } from "@/lib/policy-engine/types";
import { POLICY_STATUS_LABELS } from "@/lib/policy-engine/types";
import { PolicyPreview } from "./policy-preview";

// ── Props ─────────────────────────────────────────────────────────────────────

interface PolicyVersionTimelineProps {
    versions: PolicyVersion[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(iso: string): string {
    try {
        return new Date(iso).toLocaleString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return iso;
    }
}

// ── Component ───────────────────────────────────────────────────────────────

export function PolicyVersionTimeline({
    versions,
}: PolicyVersionTimelineProps) {
    const [expandedId, setExpandedId] = useState<number | null>(null);

    if (versions.length === 0) {
        return (
            <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm">
                <Clock className="mx-auto h-6 w-6 mb-2 opacity-50" />
                <p>Noch keine Versionshistorie vorhanden.</p>
                <p className="text-xs mt-1">
                    Versionen werden bei jedem Statuswechsel automatisch erstellt.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-0">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Versionshistorie ({versions.length})
            </h3>

            <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />

                <div className="space-y-0">
                    {versions.map((v, i) => {
                        const isExpanded = expandedId === v.versionNumber;
                        const isFirst = i === 0;

                        return (
                            <div key={v.versionNumber} className="relative pl-9">
                                {/* Timeline dot */}
                                <div
                                    className={`absolute left-[10px] top-3 h-3 w-3 rounded-full border-2 ${isFirst
                                            ? "bg-primary border-primary"
                                            : "bg-background border-muted-foreground/40"
                                        }`}
                                />

                                {/* Timeline entry */}
                                <div
                                    className={`py-2 ${i < versions.length - 1 ? "border-b border-border/50" : ""
                                        }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setExpandedId(isExpanded ? null : v.versionNumber)
                                        }
                                        className="flex w-full items-start gap-2 text-left group"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-medium">
                                                    v{v.versionNumber}
                                                </span>
                                                <Badge variant="outline" className="text-[10px] gap-0.5">
                                                    {POLICY_STATUS_LABELS[v.fromStatus]}
                                                    <ArrowRight className="h-2.5 w-2.5 mx-0.5" />
                                                    {POLICY_STATUS_LABELS[v.toStatus]}
                                                </Badge>
                                                {isFirst && (
                                                    <Badge variant="secondary" className="text-[10px]">
                                                        aktuell
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDateTime(v.createdAt)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {v.createdBy}
                                                </span>
                                            </div>
                                            {v.changeNote && (
                                                <p className="text-xs text-muted-foreground mt-1 italic">
                                                    „{v.changeNote}"
                                                </p>
                                            )}
                                        </div>
                                        <div className="shrink-0 mt-1 text-muted-foreground group-hover:text-foreground transition-colors">
                                            {v.sectionsSnapshot.length > 0 ? (
                                                isExpanded ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )
                                            ) : (
                                                <FileText className="h-4 w-4 opacity-30" />
                                            )}
                                        </div>
                                    </button>

                                    {/* Expanded: show sections snapshot */}
                                    {isExpanded && v.sectionsSnapshot.length > 0 && (
                                        <div className="mt-2 mb-1 rounded-md border bg-muted/20 p-3">
                                            <p className="text-xs text-muted-foreground mb-2">
                                                Inhalt zum Zeitpunkt v{v.versionNumber}:
                                            </p>
                                            <PolicyPreview
                                                sections={v.sectionsSnapshot}
                                                showPrintButton={false}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
