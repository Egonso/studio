"use client";

import { Clock, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterStatusBadge } from "@/components/register/status-badge";
import type { ReviewEvent, UseCaseCard } from "@/lib/register-first/types";
import { registerUseCaseStatusLabels } from "@/lib/register-first";

interface AuditTrailSectionProps {
  card: UseCaseCard;
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "unbekannt";
  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AuditEvent({ event, isLast }: { event: ReviewEvent; isLast: boolean }) {
  return (
    <div className="relative flex gap-3 pb-4">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[11px] top-6 h-full w-px bg-border" />
      )}

      {/* Dot */}
      <div className="relative z-10 mt-1 h-[22px] w-[22px] shrink-0 rounded-full border-2 border-primary bg-background" />

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <RegisterStatusBadge status={event.nextStatus} />
          <span className="text-xs text-muted-foreground">
            {registerUseCaseStatusLabels[event.nextStatus]}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(event.reviewedAt)}
          </span>
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {event.reviewedBy || "Unbekannt"}
          </span>
          {event.reviewId && (
            <span className="font-mono text-[10px]">{event.reviewId}</span>
          )}
        </div>

        {event.notes && (
          <p className="rounded-md bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
            {event.notes}
          </p>
        )}
      </div>
    </div>
  );
}

export function AuditTrailSection({ card }: AuditTrailSectionProps) {
  // Display reviews from newest to oldest
  const sortedReviews = [...card.reviews].reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Audit-Trail
          {card.reviews.length > 0 && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({card.reviews.length} Eintr{card.reviews.length === 1 ? "ag" : "aege"})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedReviews.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Noch keine Statusaenderungen dokumentiert.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Erstellt am {formatDate(card.createdAt)}
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {sortedReviews.map((event, idx) => (
              <AuditEvent
                key={event.reviewId}
                event={event}
                isLast={idx === sortedReviews.length - 1}
              />
            ))}

            {/* Initial creation marker */}
            <div className="relative flex gap-3">
              <div className="relative z-10 mt-1 h-[22px] w-[22px] shrink-0 rounded-full border-2 border-muted-foreground/30 bg-background" />
              <div className="space-y-0.5 pt-0.5">
                <span className="text-xs text-muted-foreground">Erfasst</span>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDate(card.createdAt)}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
