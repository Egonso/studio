"use client";

import { useLocale } from "next-intl";
import { getRegisterUseCaseStatusLabel } from "@/lib/register-first";
import type { RegisterUseCaseStatus } from "@/lib/register-first/types";
import { cn } from "@/lib/utils";

interface RegisterStatusPillProps {
  status: RegisterUseCaseStatus;
  className?: string;
}

const statusPillClassNames: Record<RegisterUseCaseStatus, string> = {
  UNREVIEWED: "border-slate-400 bg-transparent",
  REVIEW_RECOMMENDED: "border-slate-500 bg-transparent",
  REVIEWED: "bg-blue-700",
  PROOF_READY: "bg-emerald-600",
};

export function RegisterStatusPill({ status, className }: RegisterStatusPillProps) {
  const locale = useLocale();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-sm font-medium text-slate-900",
        className
      )}
    >
      <span
        className={cn(
          "inline-block h-2.5 w-2.5 shrink-0 rounded-full border",
          statusPillClassNames[status],
        )}
      />
      {getRegisterUseCaseStatusLabel(status, locale)}
    </span>
  );
}
