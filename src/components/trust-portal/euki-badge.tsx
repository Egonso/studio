"use client";

import { Shield, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EukiBadgeProps {
  /** Validated org governance maturity level (1, 2, 3 or undefined) */
  governanceLevel?: 1 | 2 | 3 | null;
  /** Standard version label */
  standardVersion?: string;
  /** Compact mode for inline use */
  compact?: boolean;
  className?: string;
}

const levelLabels: Record<number, string> = {
  1: "Basis",
  2: "Erweitert",
  3: "Audit-Ready",
};

const levelColors: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
  2: { bg: "bg-indigo-50", text: "text-indigo-800", border: "border-indigo-200" },
  3: { bg: "bg-green-50", text: "text-green-800", border: "border-green-200" },
};

export function EukiBadge({
  governanceLevel,
  standardVersion = "EUKI-GOV-1.0",
  compact = false,
  className,
}: EukiBadgeProps) {
  const level = governanceLevel ?? null;
  const colors = level ? levelColors[level] : { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };

  if (compact) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium",
          colors.bg,
          colors.text,
          colors.border,
          className
        )}
      >
        <Shield className="h-3 w-3" />
        <span>{standardVersion}</span>
        {level && (
          <>
            <span className="opacity-40">|</span>
            <span>Level {level}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-5 space-y-3",
        colors.bg,
        colors.border,
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-lg", level ? "bg-white/80" : "bg-white/60")}>
            <Shield className={cn("h-5 w-5", colors.text)} />
          </div>
          <div>
            <div className={cn("text-xs font-bold uppercase tracking-wider", colors.text)}>
              EUKI Standard
            </div>
            <div className="text-sm font-mono font-medium text-slate-900">
              {standardVersion}
            </div>
          </div>
        </div>
        {level && (
          <div className="text-right">
            <div className="text-xs text-slate-500 uppercase tracking-wider">
              Org-Level
            </div>
            <div className={cn("text-xl font-bold", colors.text)}>
              {level}
            </div>
          </div>
        )}
      </div>

      {level && (
        <div className="flex items-center gap-2 pt-1">
          <CheckCircle2 className={cn("h-4 w-4", colors.text)} />
          <span className={cn("text-sm font-medium", colors.text)}>
            Governance-Level: {levelLabels[level]}
          </span>
        </div>
      )}

      {!level && (
        <p className="text-xs text-slate-500">
          Governance-Level wird nach abgeschlossenem Assessment angezeigt.
        </p>
      )}
    </div>
  );
}
