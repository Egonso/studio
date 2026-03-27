"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  resolvePrimaryDataCategory,
  type OrgSettings,
  type UseCaseCard,
} from "@/lib/register-first/types";
import { useToast } from "@/hooks/use-toast";
import { useCapability } from "@/lib/compliance-engine/capability/useCapability";
import { getFeatureUpgradeHref } from "@/lib/compliance-engine/capability/upgrade-paths";
import { registerService } from "@/lib/register-first/register-service";
import { ReviewDialog } from "./review-dialog";
import {
  activatePublicVisibility,
  getVerifyUrl,
  isPubliclyVerifiable,
} from "@/lib/register-first/trust-portal-service";
import {
  calculateReviewDeadline,
  getDeadlineStatusLabel,
} from "@/lib/compliance-engine/reminders/review-deadline";
import {
  generateGovernanceReport,
  governanceReportToCSV,
} from "@/lib/compliance-engine/audit/governance-report";
import { isDossierGeneratable } from "@/lib/compliance-engine/audit/dossier-builder";

interface GovernanceLiabilitySectionProps {
  card: UseCaseCard;
  useCases?: UseCaseCard[];
  orgSettings?: OrgSettings | null;
  onCardUpdate?: (card: UseCaseCard) => void;
  focusField?: "oversight" | "reviewCycle" | "history" | null;
  autoOpenField?: "oversight" | "reviewCycle" | null;
}

type EditableField = "oversight" | "reviewCycle";
type OversightValue = "HITL" | "HOTL" | "HUMAN_REVIEW" | "NO_HUMAN" | "unknown";
type ReviewCycleValue =
  | "annual"
  | "semiannual"
  | "quarterly"
  | "monthly"
  | "ad_hoc"
  | "unknown";

interface DecisionOption<TValue extends string> {
  value: TValue;
  title: string;
  description: string;
}

interface RequirementItem {
  key: string;
  label: string;
  detail?: string | null;
  actionLabel?: string | null;
  onAction?: (() => void) | null;
}

function compactRequirements(
  items: Array<RequirementItem | null>,
): RequirementItem[] {
  return items.filter((item): item is RequirementItem => item !== null);
}

const OVERSIGHT_OPTIONS: DecisionOption<Exclude<OversightValue, "unknown">>[] = [
  {
    value: "HITL",
    title: "Human-in-the-Loop",
    description: "Ein Mensch bestaetigt jeden kritischen Schritt vor der finalen Nutzung.",
  },
  {
    value: "HOTL",
    title: "Human-on-the-Loop",
    description: "Die Nutzung wird laufend ueberwacht und bei Bedarf menschlich korrigiert.",
  },
  {
    value: "HUMAN_REVIEW",
    title: "Menschliche Ueberpruefung",
    description: "Ergebnisse werden gezielt vor oder nach Freigabe kontrolliert.",
  },
  {
    value: "NO_HUMAN",
    title: "Kein menschlicher Eingriff",
    description: "Es gibt keine laufende menschliche Pruefung im operativen Ablauf.",
  },
];

const REVIEW_CYCLE_OPTIONS: DecisionOption<
  Exclude<ReviewCycleValue, "unknown" | "ad_hoc">
>[] = [
  {
    value: "monthly",
    title: "Monatlich",
    description: "Geeignet fuer haeufig genutzte oder eng ueberwachte Einsatzfaelle.",
  },
  {
    value: "quarterly",
    title: "Quartalsweise",
    description: "Geeignet fuer regelmaessige Nutzung mit ueblichem Governance-Bedarf.",
  },
  {
    value: "semiannual",
    title: "Halbjaehrlich",
    description: "Geeignet fuer stabile Einsatzfaelle mit geringer Veraenderungsdynamik.",
  },
  {
    value: "annual",
    title: "Jaehrlich",
    description: "Geeignet fuer selten veraenderte oder klar abgegrenzte Nutzungsszenarien.",
  },
];

function formatDateDE(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return "–";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return "–";
  }
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function normalizeOversightValue(value: string | null | undefined): OversightValue {
  if (
    value === "HITL" ||
    value === "HOTL" ||
    value === "HUMAN_REVIEW" ||
    value === "NO_HUMAN"
  ) {
    return value;
  }
  return "unknown";
}

function normalizeReviewCycleValue(value: string | null | undefined): ReviewCycleValue {
  if (
    value === "annual" ||
    value === "semiannual" ||
    value === "quarterly" ||
    value === "monthly" ||
    value === "ad_hoc"
  ) {
    return value;
  }
  return "unknown";
}

function getOversightLabel(value: OversightValue | null | undefined): string | null {
  const normalized = normalizeOversightValue(value);
  if (normalized === "unknown") {
    return null;
  }

  const match = OVERSIGHT_OPTIONS.find((option) => option.value === normalized);
  return match?.title ?? normalized;
}

function getReviewCycleLabel(value: ReviewCycleValue | null | undefined): string | null {
  const normalized = normalizeReviewCycleValue(value);
  if (normalized === "unknown") {
    return null;
  }

  if (normalized === "ad_hoc") {
    return "Anlassbezogen";
  }

  const match = REVIEW_CYCLE_OPTIONS.find((option) => option.value === normalized);
  return match?.title ?? normalized;
}

function getEffectiveReviewCycleDetail(
  reviewCycle: ReviewCycleValue | null | undefined,
  orgSettings: OrgSettings | null | undefined,
): { label: string; source: "use_case" | "org" } | null {
  const directLabel = getReviewCycleLabel(reviewCycle);
  if (directLabel) {
    return {
      label: directLabel,
      source: "use_case",
    };
  }

  if (orgSettings?.reviewStandard === "risk-based") {
    return {
      label: "Risikobasiert (Organisationstandard)",
      source: "org",
    };
  }

  const inheritedLabel = getReviewCycleLabel(
    orgSettings?.reviewStandard ?? "unknown",
  );

  if (!inheritedLabel) {
    return null;
  }

  return {
    label: `${inheritedLabel} (Organisationstandard)`,
    source: "org",
  };
}

function getNextOpenDecisionField(input: {
  currentField: EditableField;
  oversightValue: OversightValue;
  reviewCycleValue: ReviewCycleValue;
  orgSettings?: OrgSettings | null;
}): EditableField | null {
  const hasOversight = normalizeOversightValue(input.oversightValue) !== "unknown";
  const hasReviewCycle =
    normalizeReviewCycleValue(input.reviewCycleValue) !== "unknown" ||
    Boolean(input.orgSettings?.reviewStandard);

  if (input.currentField === "oversight" && !hasReviewCycle) {
    return "reviewCycle";
  }

  if (input.currentField === "reviewCycle" && !hasOversight) {
    return "oversight";
  }

  return null;
}

function focusDecisionField(field: EditableField) {
  if (typeof window === "undefined") return;

  window.requestAnimationFrame(() => {
    document
      .getElementById(`governance-decision-${field}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

export function GovernanceLiabilitySection({
  card,
  useCases = [],
  orgSettings,
  onCardUpdate,
  focusField = null,
  autoOpenField = null,
}: GovernanceLiabilitySectionProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isActivatingPortal, setIsActivatingPortal] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [draftValues, setDraftValues] = useState<{
    oversight: OversightValue;
    reviewCycle: ReviewCycleValue;
  }>({
    oversight: "unknown",
    reviewCycle: "unknown",
  });
  const [isSavingField, setIsSavingField] = useState<EditableField | null>(null);
  const [autoOpenApplied, setAutoOpenApplied] = useState(false);

  const reviewCap = useCapability("reviewWorkflow");
  const trustCap = useCapability("trustPortal");
  const iso = card.governanceAssessment?.flex?.iso;

  const hasRiskClass =
    Boolean(card.governanceAssessment?.core?.aiActCategory) ||
    Boolean(resolvePrimaryDataCategory(card));
  const hasOwner =
    Boolean(card.responsibility?.responsibleParty) ||
    card.responsibility?.isCurrentlyResponsible === true;
  const hasOversight = normalizeOversightValue(iso?.oversightModel) !== "unknown";
  const reviewCycleDetail = getEffectiveReviewCycleDetail(
    normalizeReviewCycleValue(iso?.reviewCycle),
    orgSettings,
  );
  const hasReviewCycle = Boolean(reviewCycleDetail);

  const section1Checks = [hasRiskClass, hasOwner, hasOversight, hasReviewCycle];
  const section1Passed = section1Checks.filter(Boolean).length;
  const section1Total = section1Checks.length;

  const hasHistory = card.reviews != null && card.reviews.length > 0;
  const deadline = useMemo(() => calculateReviewDeadline(card), [card]);
  const hasReminders = deadline.status !== "no_deadline";
  const hasReviewTrail = hasHistory && hasReminders;
  const canGenerateReport = hasHistory && orgSettings != null;

  const isExternal =
    card.usageContexts?.includes("CUSTOMER_FACING") ||
    card.usageContexts?.includes("EXTERNAL_PUBLIC") ||
    card.usageContexts?.includes("CUSTOMERS") ||
    card.usageContexts?.includes("PUBLIC");

  const hasTrustPortal = isPubliclyVerifiable(card);
  const hasAuditDossier =
    orgSettings != null ? isDossierGeneratable(useCases, orgSettings) : false;
  const isExternBelegbar = hasTrustPortal || hasAuditDossier;
  const needsEnterpriseHint = isExternal && !hasTrustPortal;
  const verifyUrl = getVerifyUrl(card);
  const documentedOversightLabel = getOversightLabel(
    normalizeOversightValue(iso?.oversightModel),
  );

  const openEditor = useCallback((field: EditableField) => {
    setEditingField(field);
    focusDecisionField(field);
  }, []);

  const completedRequirements = compactRequirements([
    hasRiskClass
      ? {
          key: "risk",
          label: "Risikoklasse dokumentiert",
        }
      : null,
    hasOwner
      ? {
          key: "owner",
          label: "Verantwortliche Rolle dokumentiert",
        }
      : null,
    hasOversight
      ? {
          key: "oversight",
          label: "Aufsichtsmodell dokumentiert",
          detail: documentedOversightLabel,
          actionLabel: "Aendern",
          onAction: () => openEditor("oversight"),
        }
      : null,
    hasReviewCycle
      ? {
          key: "reviewCycle",
          label: "Review-Zyklus dokumentiert",
          detail: reviewCycleDetail?.label ?? null,
          actionLabel:
            reviewCycleDetail?.source === "org" ? "Override festlegen" : "Aendern",
          onAction: () => openEditor("reviewCycle"),
        }
      : null,
  ]);

  const missingRequirements = compactRequirements([
    !hasRiskClass
      ? {
          key: "risk",
          label: "Risikoklasse dokumentieren",
          detail: "Im Bereich Stammdaten ergaenzen.",
        }
      : null,
    !hasOwner
      ? {
          key: "owner",
          label: "Verantwortliche Rolle dokumentieren",
          detail: "Im Bereich Stammdaten ergaenzen.",
        }
      : null,
    !hasOversight
      ? {
          key: "oversight",
          label: "Aufsichtsmodell festlegen",
          detail: "Wird in diesem Abschnitt als formale Entscheidung dokumentiert.",
        }
      : null,
    !hasReviewCycle
      ? {
          key: "reviewCycle",
          label: "Review-Zyklus festlegen",
          detail: "Wird in diesem Abschnitt als formale Entscheidung dokumentiert.",
        }
      : null,
  ]);

  const showOversightDecision = !hasOversight || editingField === "oversight";
  const showReviewCycleDecision = !hasReviewCycle || editingField === "reviewCycle";

  const handleActivateReviewWorkflow = useCallback(() => {
    if (!reviewCap.allowed) {
      router.push(getFeatureUpgradeHref("reviewWorkflow"));
      return;
    }
    setReviewDialogOpen(true);
  }, [reviewCap.allowed, router]);

  const handleActivateTrustPortal = useCallback(async () => {
    if (!trustCap.allowed) {
      router.push(getFeatureUpgradeHref("trustPortal"));
      return;
    }

    setIsActivatingPortal(true);
    try {
      const result = await activatePublicVisibility(card.useCaseId);
      onCardUpdate?.(result.card);
      toast({
        title: "Trust Portal aktiviert",
        description: `Oeffentlicher Governance-Nachweis ist jetzt unter ${result.verifyUrl} erreichbar.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Trust Portal konnte nicht aktiviert werden.",
      });
      console.error("Trust Portal activation failed:", err);
    } finally {
      setIsActivatingPortal(false);
    }
  }, [card.useCaseId, onCardUpdate, router, toast, trustCap.allowed]);

  const handleDownloadReport = useCallback(() => {
    if (!orgSettings) return;
    try {
      const report = generateGovernanceReport(
        useCases.length > 0 ? useCases : [card],
        orgSettings,
      );
      const csv = governanceReportToCSV(report);
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadBlob(
        csv,
        `governance-report-${dateStr}.csv`,
        "text/csv;charset=utf-8",
      );
      toast({
        title: "Report heruntergeladen",
        description: "Governance-Stichtagsreport als CSV gespeichert.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Report konnte nicht generiert werden.",
      });
      console.error("Report generation failed:", err);
    }
  }, [card, useCases, orgSettings, toast]);

  useEffect(() => {
    setDraftValues({
      oversight: normalizeOversightValue(iso?.oversightModel),
      reviewCycle: normalizeReviewCycleValue(iso?.reviewCycle),
    });
  }, [card.useCaseId, iso?.oversightModel, iso?.reviewCycle]);

  useEffect(() => {
    setAutoOpenApplied(false);
  }, [card.useCaseId, autoOpenField]);

  useEffect(() => {
    if (!autoOpenField || autoOpenApplied) return;
    setEditingField(autoOpenField);
    focusDecisionField(autoOpenField);
    setAutoOpenApplied(true);
  }, [autoOpenApplied, autoOpenField]);

  const handleSelectValue = useCallback(
    (field: EditableField, value: OversightValue | ReviewCycleValue) => {
      setEditingField(field);
      setDraftValues((current) => ({
        ...current,
        [field]: value,
      }));
    },
    [],
  );

  const handleCloseEditor = useCallback(
    (field: EditableField) => {
      setDraftValues((current) => ({
        ...current,
        oversight:
          field === "oversight"
            ? normalizeOversightValue(iso?.oversightModel)
            : current.oversight,
        reviewCycle:
          field === "reviewCycle"
            ? normalizeReviewCycleValue(iso?.reviewCycle)
            : current.reviewCycle,
      }));
      setEditingField((current) => (current === field ? null : current));
    },
    [iso?.oversightModel, iso?.reviewCycle],
  );

  const handleSaveField = useCallback(
    async (field: EditableField) => {
      const nextValue = draftValues[field];
      if (!nextValue || nextValue === "unknown") return;

      setIsSavingField(field);

      try {
        const currentIso = card.governanceAssessment?.flex?.iso || {};
        const updatedIso = {
          ...currentIso,
          oversightModel:
            field === "oversight"
              ? normalizeOversightValue(nextValue)
              : normalizeOversightValue(currentIso.oversightModel),
          reviewCycle:
            field === "reviewCycle"
              ? normalizeReviewCycleValue(nextValue)
              : normalizeReviewCycleValue(currentIso.reviewCycle),
        };
        const updatedCard: UseCaseCard = {
          ...card,
          governanceAssessment: {
            ...card.governanceAssessment,
            core: card.governanceAssessment?.core || {},
            flex: {
              ...card.governanceAssessment?.flex,
              iso: {
                ...currentIso,
                ...updatedIso,
                documentationLevel:
                  currentIso.documentationLevel ?? "unknown",
                lifecycleStatus: currentIso.lifecycleStatus ?? "unknown",
              },
            },
          },
        };

        await registerService.updateUseCase(card.useCaseId, updatedCard);
        onCardUpdate?.(updatedCard);

        const nextField = getNextOpenDecisionField({
          currentField: field,
          oversightValue: updatedIso.oversightModel,
          reviewCycleValue: updatedIso.reviewCycle,
          orgSettings,
        });

        if (nextField) {
          setEditingField(nextField);
          focusDecisionField(nextField);
        } else {
          setEditingField(null);
        }

        toast({
          title: "Gespeichert",
          description: nextField
            ? "Nachweis aktualisiert. Der naechste offene Entscheidungspunkt wurde geoeffnet."
            : "Nachweis aktualisiert.",
        });
      } catch {
        toast({
          variant: "destructive",
          title: "Fehler",
          description: "Aenderung konnte nicht gespeichert werden.",
        });
      } finally {
        setIsSavingField(null);
      }
    },
    [card, draftValues, onCardUpdate, orgSettings, toast],
  );

  return (
    <Card className="border-slate-300">
      <CardHeader className="border-b border-slate-200 bg-white pb-4">
        <div className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <ShieldCheck className="h-4 w-4 text-slate-500" />
            Prueffaehigkeit
          </CardTitle>
          <p className="text-sm leading-6 text-slate-600">
            Dokumentiert Grundnachweise, Review-Bezug und formale Nachweiswege fuer
            diesen Einsatzfall.
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-0 text-sm">
        <section
          className={cn(
            "border-b border-slate-200 p-5 md:p-6",
            (focusField === "oversight" || focusField === "reviewCycle") &&
              "border-l-2 border-slate-300 pl-4 md:pl-5",
          )}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-900">Grundnachweise</h3>
              <p className="text-sm leading-6 text-slate-600">
                Vier formale Angaben bilden die Grundlage fuer einen nachweisfaehigen
                Einsatzfall.
              </p>
            </div>
            <p className="text-xs text-slate-500">
              {section1Passed} von {section1Total} dokumentiert
            </p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <RequirementGroupCard
              title="Bereits dokumentiert"
              emptyText="Noch keine Grundnachweise dokumentiert."
              items={completedRequirements}
            />
            <RequirementGroupCard
              title="Noch offen"
              emptyText="Alle Grundnachweise sind dokumentiert."
              items={missingRequirements}
              tone="open"
            />
          </div>

          <div className="mt-5 space-y-4">
            {showOversightDecision ? (
              <DecisionPanel
                id="governance-decision-oversight"
                title="Aufsichtsmodell festlegen"
                description="Wie wird dieser Einsatzfall menschlich begleitet oder kontrolliert?"
                helperText={
                  hasOversight && documentedOversightLabel
                    ? `Aktuell dokumentiert: ${documentedOversightLabel}`
                    : "Noch kein Aufsichtsmodell dokumentiert."
                }
                options={OVERSIGHT_OPTIONS}
                selectedValue={draftValues.oversight}
                isSaving={isSavingField === "oversight"}
                submitLabel={!hasReviewCycle ? "Speichern und weiter" : "Speichern"}
                onSelect={(value) => handleSelectValue("oversight", value)}
                onSave={() => void handleSaveField("oversight")}
                onCancel={
                  hasOversight ? () => handleCloseEditor("oversight") : undefined
                }
                active={editingField === "oversight" || (!hasOversight && !editingField)}
              />
            ) : null}

            {showReviewCycleDecision ? (
              <DecisionPanel
                id="governance-decision-reviewCycle"
                title="Review-Zyklus festlegen"
                description="In welchem Rhythmus wird dieser Einsatzfall erneut geprueft?"
                helperText={
                  reviewCycleDetail
                    ? `Aktuell dokumentiert: ${reviewCycleDetail.label}`
                    : "Noch kein Review-Zyklus dokumentiert."
                }
                options={REVIEW_CYCLE_OPTIONS}
                selectedValue={draftValues.reviewCycle}
                isSaving={isSavingField === "reviewCycle"}
                submitLabel={!hasOversight ? "Speichern und weiter" : "Speichern"}
                onSelect={(value) => handleSelectValue("reviewCycle", value)}
                onSave={() => void handleSaveField("reviewCycle")}
                onCancel={
                  hasReviewCycle ? () => handleCloseEditor("reviewCycle") : undefined
                }
                active={
                  editingField === "reviewCycle" ||
                  (!hasReviewCycle && hasOversight && editingField === null)
                }
              />
            ) : null}
          </div>
        </section>

        <section
          className={cn(
            "border-b border-slate-200 p-5 md:p-6",
            focusField === "history" && "border-l-2 border-slate-300 pl-4 md:pl-5",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-900">Review-Verlauf</h3>
              <p className="text-sm leading-6 text-slate-600">
                Formale Review-Dokumentation, Fristen und Verlauf bleiben ein eigener
                Workflow.
              </p>
            </div>
            {hasReviewTrail ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-600" />
            ) : (
              <span className="mt-1 inline-block h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
            )}
          </div>

          {reviewCap.allowed ? (
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-3">
                {hasReminders ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                )}
                <div className="space-y-1">
                  <p className="font-medium text-slate-900">Fristueberwachung</p>
                  <p className="text-sm text-slate-600">
                    <DeadlineDisplay
                      status={deadline.status}
                      daysRemaining={deadline.daysRemaining}
                      nextReviewAt={deadline.nextReviewAt}
                    />
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                {hasHistory ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                )}
                <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-medium text-slate-900">Review-Historie</p>
                    <p className="text-sm text-slate-600">
                      {hasHistory
                        ? `${card.reviews.length} ${
                            card.reviews.length === 1 ? "Review" : "Reviews"
                          } dokumentiert`
                        : "Noch kein Review dokumentiert."}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={handleActivateReviewWorkflow}
                  >
                    Review erfassen
                  </Button>
                </div>
              </li>

              <li className="flex items-start gap-3">
                {canGenerateReport ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                )}
                <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-medium text-slate-900">Governance-Report</p>
                    <p className="text-sm text-slate-600">
                      CSV-Stichtagsreport fuer dokumentierte Review-Historie.
                    </p>
                  </div>
                  {canGenerateReport ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={handleDownloadReport}
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      CSV
                    </Button>
                  ) : null}
                </div>
              </li>
            </ul>
          ) : (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
              <ul className="space-y-2 text-sm text-slate-600">
                <li>Fristueberwachung</li>
                <li>Review-Historie</li>
                <li>Governance-Report</li>
              </ul>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Unveraenderbare Pruefdokumentation mit Fristen und nachvollziehbarer
                Historie.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={handleActivateReviewWorkflow}
              >
                Dokumentation erweitern
              </Button>
            </div>
          )}
        </section>

        <section className="p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-900">Nachweisexport</h3>
              <p className="text-sm leading-6 text-slate-600">
                Externe Nachweise und Audit-Dokumente bleiben sichtbar, aber
                nachrangig gegenueber dem Einsatzfall selbst.
              </p>
            </div>
            {isExternBelegbar ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-600" />
            ) : (
              <span className="mt-1 inline-block h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
            )}
          </div>

          {trustCap.allowed ? (
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-3">
                {hasAuditDossier ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                )}
                <div className="space-y-1">
                  <p className="font-medium text-slate-900">ISO 42001 Audit-Dossier</p>
                  <p className="text-sm text-slate-600">
                    Organisationsweiter Nachweis fuer Audit- und Governance-Zwecke.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                {hasTrustPortal ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                )}
                <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-medium text-slate-900">Governance-Nachweis</p>
                    <p className="text-sm text-slate-600">
                      Oeffentlich verifizierbarer Nachweis fuer diesen Einsatzfall.
                    </p>
                    {hasTrustPortal && verifyUrl ? (
                      <a
                        href={verifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-slate-950"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {verifyUrl}
                      </a>
                    ) : null}
                  </div>
                  {needsEnterpriseHint && !hasTrustPortal ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => void handleActivateTrustPortal()}
                      disabled={isActivatingPortal}
                    >
                      {isActivatingPortal ? "Wird aktiviert..." : "Trust Portal aktivieren"}
                    </Button>
                  ) : null}
                </div>
              </li>
            </ul>
          ) : (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
              <ul className="space-y-2 text-sm text-slate-600">
                <li>ISO 42001 Audit-Dossier</li>
                <li>Governance-Nachweis</li>
              </ul>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Prueffaehige Nachweise fuer Audits und externe Stakeholder.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => void handleActivateTrustPortal()}
              >
                Audit-Export aktivieren
              </Button>
            </div>
          )}
        </section>
      </CardContent>

      <ReviewDialog
        card={card}
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        onReviewAdded={(updatedCard) => {
          onCardUpdate?.(updatedCard);
        }}
      />
    </Card>
  );
}

function RequirementGroupCard({
  title,
  items,
  emptyText,
  tone = "default",
}: {
  title: string;
  items: RequirementItem[];
  emptyText: string;
  tone?: "default" | "open";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        tone === "open"
          ? "border-slate-300 bg-slate-50/60"
          : "border-slate-200 bg-white",
      )}
    >
      <h4 className="text-sm font-medium text-slate-900">{title}</h4>
      {items.length === 0 ? (
        <p className="mt-3 text-sm leading-6 text-slate-500">{emptyText}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((item) => (
            <li key={item.key} className="flex items-start gap-3">
              {tone === "open" ? (
                <span className="mt-[5px] inline-block h-4 w-4 shrink-0 rounded-full border border-slate-300" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium text-slate-900">{item.label}</p>
                {item.detail ? (
                  <p className="text-sm leading-6 text-slate-600">{item.detail}</p>
                ) : null}
                {item.actionLabel && item.onAction ? (
                  <button
                    type="button"
                    onClick={item.onAction}
                    className="text-sm text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-slate-950"
                  >
                    {item.actionLabel}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DecisionPanel<TValue extends string>({
  id,
  title,
  description,
  helperText,
  options,
  selectedValue,
  isSaving,
  submitLabel,
  onSelect,
  onSave,
  onCancel,
  active,
}: {
  id: string;
  title: string;
  description: string;
  helperText: string;
  options: DecisionOption<TValue>[];
  selectedValue: string;
  isSaving: boolean;
  submitLabel: string;
  onSelect: (value: TValue) => void;
  onSave: () => void;
  onCancel?: () => void;
  active?: boolean;
}) {
  return (
    <div
      id={id}
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-4 md:p-5",
        active && "border-slate-300 shadow-[0_1px_0_rgba(15,23,42,0.04)]",
      )}
    >
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
        <p className="text-xs text-slate-500">{helperText}</p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {options.map((option) => {
          const isSelected = selectedValue === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className={cn(
                "rounded-lg border px-4 py-3 text-left transition-colors",
                isSelected
                  ? "border-slate-900 bg-slate-50 text-slate-950"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-950",
              )}
            >
              <p className="text-sm font-medium">{option.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={onSave}
          disabled={isSaving || selectedValue === "unknown"}
        >
          {isSaving ? "Speichert..." : submitLabel}
        </Button>
        {onCancel ? (
          <Button size="sm" variant="outline" onClick={onCancel}>
            Abbrechen
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function DeadlineDisplay({
  status,
  daysRemaining,
  nextReviewAt,
}: {
  status: string;
  daysRemaining: number | null;
  nextReviewAt: string | null;
}) {
  if (status === "overdue" && daysRemaining !== null) {
    return (
      <span>
        Ueberfaellig seit {Math.abs(daysRemaining)}{" "}
        {Math.abs(daysRemaining) === 1 ? "Tag" : "Tagen"}
      </span>
    );
  }

  if (status === "due_soon" && daysRemaining !== null) {
    return (
      <span>
        Faellig in {daysRemaining} {daysRemaining === 1 ? "Tag" : "Tagen"}
      </span>
    );
  }

  if (status === "on_track" && nextReviewAt) {
    return <span>Naechste Pruefung: {formatDateDE(nextReviewAt)}</span>;
  }

  return (
    <span>
      {getDeadlineStatusLabel(
        status as "overdue" | "due_soon" | "on_track" | "no_deadline",
      )}
    </span>
  );
}
