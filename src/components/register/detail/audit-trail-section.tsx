"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  buildUseCaseTimeline,
  getUseCaseBadgeMeta,
  type ExternalSubmission,
  type RegisterTimelineEvent,
  type UseCaseCard,
} from "@/lib/register-first";
import { cn } from "@/lib/utils";

interface AuditTrailSectionProps {
  card: UseCaseCard;
  submission?: ExternalSubmission | null;
}

function formatDate(isoDate: string, locale: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return locale === "de" ? "unbekannt" : "unknown";
  return date.toLocaleString(locale === "de" ? "de-DE" : "en-GB", {
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
  const locale = useLocale();
  const isGerman = locale === "de";
  const copy = {
    title: isGerman ? "Verlauf" : "Timeline",
    subtitle: isGerman ? "Neueste Ereignisse zuerst." : "Newest events first.",
    documentedBy: isGerman ? "Dokumentiert von" : "Documented by",
    less: isGerman ? "Weniger" : "Less",
    allEntries: (count: number) =>
      isGerman ? `Alle ${count} Eintraege` : `All ${count} entries`,
  };
  const timeline = buildUseCaseTimeline({ card, submission, locale });
  const badgeMeta = getUseCaseBadgeMeta(locale);
  const [showAll, setShowAll] = useState(false);
  const visibleTimeline = showAll ? timeline : timeline.slice(0, 3);
  const hasHiddenEvents = timeline.length > 3;

  useEffect(() => {
    setShowAll(false);
  }, [card.useCaseId]);

  return (
    <section className="border-t border-slate-200 pt-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-[16px] font-semibold tracking-tight text-slate-800">
          {copy.title}
        </h2>
        <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
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
                            const badge = badgeMeta[badgeKey];
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
                    {formatDate(event.timestamp, locale)}
                  </p>
                </div>
                {event.actor ? (
                  <p className="text-xs text-muted-foreground">
                    {copy.documentedBy} {event.actor}
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
            {showAll ? copy.less : copy.allEntries(timeline.length)}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
