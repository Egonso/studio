'use client';

import Link from "next/link";
import { useLocale } from "next-intl";
import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type {
  ControlMaturityResult,
  MaturityCriterionResult,
  MaturityLevelResult,
} from "@/lib/control/maturity-calculator";
import { appendWorkspaceScope } from "@/lib/navigation/workspace-scope";
import { useWorkspaceScope } from "@/lib/navigation/use-workspace-scope";

interface ControlMaturityPanelProps {
  maturity: ControlMaturityResult;
}

function getControlMaturityCopy(locale: string) {
  if (locale === "de") {
    return {
      evidence: "Datengrundlage",
      missing: "Fehlend",
      criteriaMet: "Kriterien erfüllt",
      fulfilled: "erfüllt",
      open: "offen",
      title: "Governance-Reifegradmodell",
      description:
        "Aktueller Stand: {label}. Das Level wird deterministisch aus Registerdaten berechnet.",
    } as const;
  }

  return {
    evidence: "Evidence",
    missing: "Missing",
    criteriaMet: "Criteria met",
    fulfilled: "met",
    open: "open",
    title: "Governance Maturity Model",
    description:
      "Current state: {label}. The level is calculated deterministically from register data.",
  } as const;
}

function CriterionRow({ criterion }: { criterion: MaturityCriterionResult }) {
  const workspaceScope = useWorkspaceScope();
  const locale = useLocale();
  const copy = getControlMaturityCopy(locale);

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-start gap-2">
        {criterion.fulfilled ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 text-foreground" />
        ) : (
          <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" />
        )}
        <div className="space-y-1">
          <p className="text-sm">{criterion.label}</p>
          <p className="text-xs text-muted-foreground">
            {copy.evidence}: {criterion.evidence}
          </p>
          {!criterion.fulfilled && (
            <p className="text-xs text-muted-foreground">
              {copy.missing}: {criterion.missing}
            </p>
          )}
          {!criterion.fulfilled && criterion.actionHref && criterion.actionLabel && (
            <div className="pt-1">
              <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                <Link
                  href={appendWorkspaceScope(
                    criterion.actionHref,
                    workspaceScope,
                  )}
                >
                  {criterion.actionLabel}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LevelBlock({ level }: { level: MaturityLevelResult }) {
  const workspaceScope = useWorkspaceScope();
  const locale = useLocale();
  const copy = getControlMaturityCopy(locale);
  const firstActionableCriterion = level.criteria.find(
    (criterion) =>
      !criterion.fulfilled && criterion.actionHref && criterion.actionLabel
  );

  return (
    <div id={`control-level-${level.level}`} className="space-y-3 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{level.title}</h3>
          <p className="text-xs text-muted-foreground">
            {copy.criteriaMet}: {level.achievedCriteria}/{level.totalCriteria}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {level.fulfilled ? copy.fulfilled : copy.open}
        </p>
      </div>

      {!level.fulfilled && firstActionableCriterion?.actionHref && firstActionableCriterion.actionLabel && (
        <div className="flex justify-end">
          <Button asChild variant="outline" size="sm" className="h-8 text-xs">
            <Link
              href={appendWorkspaceScope(
                firstActionableCriterion.actionHref,
                workspaceScope,
              )}
            >
              {firstActionableCriterion.actionLabel}
            </Link>
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {level.criteria.map((criterion) => (
          <CriterionRow key={criterion.id} criterion={criterion} />
        ))}
      </div>
    </div>
  );
}

export function ControlMaturityPanel({ maturity }: ControlMaturityPanelProps) {
  const locale = useLocale();
  const copy = getControlMaturityCopy(locale);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>
          {copy.description.replace("{label}", maturity.currentLabel)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {maturity.levels.map((level) => (
          <LevelBlock key={level.level} level={level} />
        ))}
      </CardContent>
    </Card>
  );
}
