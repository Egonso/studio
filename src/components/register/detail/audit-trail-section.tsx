"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  buildUseCaseTimeline,
  USE_CASE_BADGE_META,
  type ExternalSubmission,
  type RegisterTimelineEvent,
  type UseCaseCard,
} from "@/lib/register-first";
import { cn } from "@/lib/utils";

interface AuditTrailSectionProps {
  card: UseCaseCard;
  submission?: ExternalSubmission | null;
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

function toneClasses(event: RegisterTimelineEvent): {
  dot: string;
  ring: string;
  title: string;
} {
  switch (event.tone) {
    case "success":
      return {
        dot: "bg-emerald-600",
        ring: "border-emerald-200 bg-white",
        title: "text-slate-950",
      };
    case "warning":
      return {
        dot: "bg-slate-500",
        ring: "border-slate-200 bg-white",
        title: "text-slate-950",
      };
    case "danger":
      return {
        dot: "bg-slate-700",
        ring: "border-slate-300 bg-white",
        title: "text-slate-950",
      };
    default:
      return {
        dot: "bg-slate-500",
        ring: "border-slate-200 bg-white",
        title: "text-slate-900",
      };
  }
}

export function AuditTrailSection({
  card,
  submission = null,
}: AuditTrailSectionProps) {
  const timeline = buildUseCaseTimeline({ card, submission });
  const [showAll, setShowAll] = useState(false);
  const visibleTimeline = showAll ? timeline : timeline.slice(0, 3);
  const hasHiddenEvents = timeline.length > 3;

  useEffect(() => {
    setShowAll(false);
  }, [card.useCaseId]);

  return (
    <section className="border-t border-slate-200 pt-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-[18px] font-semibold tracking-tight">Verlauf</h2>
        <p className="text-sm text-muted-foreground">
          Neueste Dokumentationsereignisse zuerst. Herkunft, Aenderungen, Reviews
          und Freigaben werden zusammengefuehrt.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {visibleTimeline.map((event) => {
          const tone = toneClasses(event);
          const showSourceBadges =
            event.kind === "origin" || event.kind === "external_submission";

          return (
            <article
              key={event.id}
              className={cn(
                "relative rounded-md border px-4 py-4 pl-6",
                tone.ring
              )}
            >
              <span
                className={cn(
                  "absolute left-4 top-6 h-2.5 w-2.5 rounded-full",
                  tone.dot
                )}
              />
              <div className="ml-3 space-y-2">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={cn("text-sm font-semibold", tone.title)}>
                        {event.title}
                      </h3>
                      {showSourceBadges
                        ? event.badges.map((badgeKey) => {
                            const badge = USE_CASE_BADGE_META[badgeKey];
                            return (
                              <Badge
                                key={`${event.id}_${badge.key}`}
                                variant="outline"
                                className={badge.className}
                              >
                                {badge.label}
                              </Badge>
                            );
                          })
                        : null}
                    </div>
                    {event.description ? (
                      <p className="text-sm text-slate-700">{event.description}</p>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {formatDate(event.timestamp)}
                  </p>
                </div>
                {event.actor ? (
                  <p className="text-xs text-muted-foreground">
                    Dokumentiert von {event.actor}
                  </p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      {hasHiddenEvents ? (
        <div className="mt-5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAll((current) => !current)}
          >
            {showAll ? "Weniger anzeigen" : `Alle ${timeline.length} Eintraege anzeigen`}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
