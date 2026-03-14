"use client";

import { registerUseCaseStatusLabels } from "@/lib/register-first/status-flow";
import type { RegisterUseCaseStatus } from "@/lib/register-first/types";

interface RegisterStatusBadgeProps {
  status: RegisterUseCaseStatus;
}

/** Dot color: filled for completed states, outline for pending */
const dotClassName: Record<RegisterUseCaseStatus, string> = {
  UNREVIEWED: "border border-slate-400 bg-transparent",
  REVIEW_RECOMMENDED: "border border-slate-500 bg-transparent",
  REVIEWED: "bg-blue-700",
  PROOF_READY: "bg-emerald-600",
};

/** Text weight: slightly bolder for REVIEW_RECOMMENDED to differentiate from UNREVIEWED */
const textClassName: Record<RegisterUseCaseStatus, string> = {
  UNREVIEWED: "text-muted-foreground",
  REVIEW_RECOMMENDED: "text-slate-700",
  REVIEWED: "text-slate-950",
  PROOF_READY: "text-slate-950",
};

export function RegisterStatusBadge({ status }: RegisterStatusBadgeProps) {
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${dotClassName[status]}`} />
      <span className={textClassName[status]}>
        {registerUseCaseStatusLabels[status]}
      </span>
    </span>
  );
}
