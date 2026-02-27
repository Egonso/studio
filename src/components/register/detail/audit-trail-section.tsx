"use client";

import type { ReviewEvent, UseCaseCard } from "@/lib/register-first/types";
import { registerUseCaseStatusLabels } from "@/lib/register-first";
import { cn } from "@/lib/utils";

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

export function AuditTrailSection({ card }: AuditTrailSectionProps) {
  const sortedReviews = [...card.reviews].reverse();
  const isProofReady = card.status === "PROOF_READY";

  return (
    <section className="border-t border-slate-200 pt-8">
      <h2 className="text-[18px] font-semibold tracking-tight">Audit-Trail</h2>

      {sortedReviews.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">
          Für diesen Use Case liegen noch keine dokumentierten Prüfungen vor.
        </p>
      ) : (
        <div
          className={cn(
            "mt-5 space-y-2",
            isProofReady && "border-l border-emerald-300 pl-4"
          )}
        >
          {sortedReviews.map((event, index) => (
            <TimelineLine
              key={event.reviewId}
              event={event}
              emphasize={isProofReady && index === 0}
            />
          ))}
          <p className="text-sm text-slate-600">• {formatDate(card.createdAt)} – Erstellt</p>
        </div>
      )}
    </section>
  );
}

function TimelineLine({
  event,
  emphasize,
}: {
  event: ReviewEvent;
  emphasize: boolean;
}) {
  return (
    <p className={cn("text-sm text-slate-600", emphasize && "font-semibold text-slate-800")}>
      • {formatDate(event.reviewedAt)} – Status geändert auf „
      {registerUseCaseStatusLabels[event.nextStatus]}“
      {event.notes ? ` (${event.notes})` : ""}
    </p>
  );
}
