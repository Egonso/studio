"use client";

import { registerUseCaseStatusLabels } from "@/lib/register-first";
import type { RegisterUseCaseStatus } from "@/lib/register-first/types";
import { cn } from "@/lib/utils";

interface RegisterStatusPillProps {
  status: RegisterUseCaseStatus;
  className?: string;
}

const statusPillClassNames: Record<RegisterUseCaseStatus, string> = {
  UNREVIEWED: "border-slate-300 bg-slate-100 text-slate-700",
  REVIEW_RECOMMENDED: "border-slate-300 bg-slate-100 text-slate-700",
  REVIEWED: "border-blue-200 bg-blue-50 text-blue-700",
  PROOF_READY: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function RegisterStatusPill({ status, className }: RegisterStatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full border px-3 text-sm font-medium",
        statusPillClassNames[status],
        className
      )}
    >
      {registerUseCaseStatusLabels[status]}
    </span>
  );
}
