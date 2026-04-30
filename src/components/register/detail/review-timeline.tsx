"use client";

/**
 * ReviewTimeline – Vertical timeline of all ReviewEvents for a UseCaseCard.
 *
 * Design:
 *   - CSS border-left + dots (no external timeline library)
 *   - Newest first (reverse chronological)
 *   - Max 10 entries shown by default, expander for more
 *   - Per entry: date (DD.MM.YYYY HH:MM), reviewer, status badge, optional notes
 *   - Status badges: REVIEWED = blue, PROOF_READY = green, REVIEW_RECOMMENDED = gray
 *   - Immutable: ReviewEvents are never edited or deleted
 *
 * Sprint: GN-E Review-UI
 */

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import { ChevronDown, ChevronUp, ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ReviewEvent, RegisterUseCaseStatus } from "@/lib/register-first/types";
import { getRegisterUseCaseStatusLabel } from "@/lib/register-first";

// ── Constants ───────────────────────────────────────────────────────────────

const MAX_VISIBLE_DEFAULT = 10;

/** Badge color mapping by status */
const STATUS_BADGE_STYLES: Record<
    Exclude<RegisterUseCaseStatus, "UNREVIEWED">,
    string
> = {
    REVIEWED: "bg-gray-100 text-gray-800 border-gray-200",
    PROOF_READY: "bg-gray-100 text-gray-800 border-gray-200",
    REVIEW_RECOMMENDED: "bg-slate-100 text-slate-700 border-slate-200",
};

/** Dot color on the timeline by status */
const DOT_COLORS: Record<
    Exclude<RegisterUseCaseStatus, "UNREVIEWED">,
    string
> = {
    REVIEWED: "bg-blue-500",
    PROOF_READY: "bg-green-500",
    REVIEW_RECOMMENDED: "bg-slate-400",
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDateTime(isoDate: string, locale: string): string {
    try {
        const d = new Date(isoDate);
        if (isNaN(d.getTime())) return "–";
        return d.toLocaleString(locale === "de" ? "de-DE" : "en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return "–";
    }
}

// ── Types ───────────────────────────────────────────────────────────────────

interface ReviewTimelineProps {
    /** ReviewEvents from the UseCaseCard */
    reviews: ReviewEvent[];
    /** Optional: override max visible entries */
    maxVisible?: number;
}

// ── Component ───────────────────────────────────────────────────────────────

export function ReviewTimeline({
    reviews,
    maxVisible = MAX_VISIBLE_DEFAULT,
}: ReviewTimelineProps) {
    const locale = useLocale();
    const isGerman = locale === "de";
    const copy = {
        title: isGerman ? "Prüfhistorie" : "Review history",
        empty: isGerman
            ? "Noch keine formale Prüfung dokumentiert."
            : "No formal review documented yet.",
        less: isGerman ? "Weniger anzeigen" : "Show less",
        showAll: (count: number) =>
            isGerman ? `Alle ${count} Reviews anzeigen` : `Show all ${count} reviews`,
        disclaimer: isGerman
            ? "Dokumentierter IST-Zustand. Reviews sind unveränderlich und werden chronologisch protokolliert."
            : "Documented current state. Reviews are immutable and recorded chronologically.",
    };
    const [isExpanded, setIsExpanded] = useState(false);

    // Sort newest first (reverse chronological)
    const sortedReviews = useMemo(
        () =>
            [...reviews].sort(
                (a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime(),
            ),
        [reviews],
    );

    const hasMore = sortedReviews.length > maxVisible;
    const visibleReviews = isExpanded
        ? sortedReviews
        : sortedReviews.slice(0, maxVisible);

    if (reviews.length === 0) {
        return (
            <Card className="border-slate-200">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <ClipboardCheck className="w-4 h-4 text-slate-500" />
                        {copy.title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                    <p className="text-xs text-muted-foreground">
                        {copy.empty}
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-slate-200">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <ClipboardCheck className="w-4 h-4 text-slate-500" />
                        {copy.title}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                        {reviews.length} {reviews.length === 1 ? "Review" : "Reviews"}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
                {/* Timeline container */}
                <div className="relative">
                    {visibleReviews.map((review, idx) => {
                        const isLast = idx === visibleReviews.length - 1;
                        const dotColor = DOT_COLORS[review.nextStatus] ?? "bg-slate-400";
                        const badgeStyle = STATUS_BADGE_STYLES[review.nextStatus] ?? "";
                        const statusLabel =
                            getRegisterUseCaseStatusLabel(review.nextStatus, locale) ??
                            review.nextStatus;

                        return (
                            <div key={review.reviewId} className="relative flex gap-3">
                                {/* Timeline line + dot */}
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ring-2 ring-white ${dotColor}`}
                                    />
                                    {!isLast && (
                                        <div className="w-px flex-1 bg-slate-200 min-h-[16px]" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className={`pb-4 flex-1 min-w-0 ${isLast ? "pb-0" : ""}`}>
                                    {/* Header row: date + badge */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-medium text-slate-700">
                                            {formatDateTime(review.reviewedAt, locale)}
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] px-1.5 py-0 leading-4 ${badgeStyle}`}
                                        >
                                            {statusLabel}
                                        </Badge>
                                    </div>

                                    {/* Reviewer */}
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {review.reviewedBy}
                                    </p>

                                    {/* Notes (optional) */}
                                    {review.notes && (
                                        <p className="text-xs text-slate-600 mt-1 italic leading-relaxed">
                                            {review.notes}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Expander */}
                {hasMore && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2 text-xs text-muted-foreground"
                        onClick={() => setIsExpanded((prev) => !prev)}
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp className="w-3 h-3 mr-1" />
                                {copy.less}
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-3 h-3 mr-1" />
                                {copy.showAll(sortedReviews.length)}
                            </>
                        )}
                    </Button>
                )}

                {/* Disclaimer */}
                <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
                    {copy.disclaimer}
                </p>
            </CardContent>
        </Card>
    );
}
