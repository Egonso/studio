"use client";

import {
  registerUseCaseStatusLabels,
  type RegisterUseCaseStatus,
} from "@/lib/register-first";

interface RegisterStatusBadgeProps {
  status: RegisterUseCaseStatus;
}

/** Dot color: filled for completed states, outline for pending */
const dotClassName: Record<RegisterUseCaseStatus, string> = {
  UNREVIEWED: "border border-muted-foreground",
  REVIEW_RECOMMENDED: "border border-muted-foreground/70",
  REVIEWED: "bg-primary",
  PROOF_READY: "bg-emerald-500",
};

/** Text weight: slightly bolder for REVIEW_RECOMMENDED to differentiate from UNREVIEWED */
const textClassName: Record<RegisterUseCaseStatus, string> = {
  UNREVIEWED: "text-muted-foreground",
  REVIEW_RECOMMENDED: "text-muted-foreground font-medium",
  REVIEWED: "text-foreground",
  PROOF_READY: "text-foreground",
};

export function RegisterStatusBadge({ status }: RegisterStatusBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className={`inline-block h-2 w-2 rounded-full shrink-0 ${dotClassName[status]}`} />
      <span className={textClassName[status]}>
        {registerUseCaseStatusLabels[status]}
      </span>
    </span>
  );
}
