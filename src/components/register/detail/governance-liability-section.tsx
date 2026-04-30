"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useLocale } from "next-intl";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasDocumentedAiActCategory } from "@/lib/register-first";
import { cn } from "@/lib/utils";
import {
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
  onOpenRiskReview?: (() => void) | null;
  focusField?: "oversight" | "reviewCycle" | "history" | null;
  autoOpenField?: "oversight" | "reviewCycle" | null;
  onToggleDetails?: (() => void) | null;
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

type GovernanceIsoSettings = NonNullable<
  NonNullable<NonNullable<UseCaseCard["governanceAssessment"]>["flex"]>["iso"]
>;

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

const OVERSIGHT_OPTIONS_EN: DecisionOption<Exclude<OversightValue, "unknown">>[] =
  [
    {
      value: "HITL",
      title: "Human-in-the-loop",
      description:
        "A person confirms each critical step before final use.",
    },
    {
      value: "HOTL",
      title: "Human-on-the-loop",
      description:
        "Use is continuously monitored and corrected by a person when needed.",
    },
    {
      value: "HUMAN_REVIEW",
      title: "Human review",
      description:
        "Outputs are checked selectively before or after release.",
    },
    {
      value: "NO_HUMAN",
      title: "No human intervention",
      description:
        "There is no ongoing human review in the operational workflow.",
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

const REVIEW_CYCLE_OPTIONS_EN: DecisionOption<
  Exclude<ReviewCycleValue, "unknown" | "ad_hoc">
>[] = [
  {
    value: "monthly",
    title: "Monthly",
    description:
      "Suitable for frequently used or closely monitored use cases.",
  },
  {
    value: "quarterly",
    title: "Quarterly",
    description:
      "Suitable for regular use with standard governance needs.",
  },
  {
    value: "semiannual",
    title: "Semiannual",
    description:
      "Suitable for stable use cases with limited change dynamics.",
  },
  {
    value: "annual",
    title: "Annual",
    description:
      "Suitable for rarely changed or clearly bounded use scenarios.",
  },
];

function getGovernanceLiabilityCopy(locale: string) {
  if (locale === "de") {
    return {
      organisationStandard: "Organisationstandard",
      riskBasedOrgStandard: "Risikobasiert (Organisationstandard)",
      adHoc: "Anlassbezogen",
      oversightDecision: "Aufsichtsmodell festlegen",
      reviewCycleDecision: "Review-Zyklus festlegen",
      upcomingAfterOversight:
        "Wird aktiv, sobald das Aufsichtsmodell dokumentiert ist.",
      upcomingAfterReviewCycle:
        "Wird aktiv, sobald der Review-Zyklus dokumentiert ist.",
      upcomingFallback: "Dieser Entscheidungspunkt folgt als naechstes.",
      riskDocumented: "Risikoklasse dokumentiert",
      ownerDocumented: "Verantwortliche Rolle dokumentiert",
      oversightDocumented: "Aufsichtsmodell dokumentiert",
      reviewCycleDocumented: "Review-Zyklus dokumentiert",
      change: "Aendern",
      defineOverride: "Override festlegen",
      ownerMissing: "Verantwortliche Rolle dokumentieren",
      inMasterData: "In Stammdaten.",
      riskReview: "Risikoklasse pruefen",
      riskDocument: "Risikoklasse dokumentieren",
      riskNextDetail: "Als naechster Schritt nach Aufsicht und Review-Zyklus.",
      startShortReview: "Kurze Pruefung starten",
      nextOversight: "Jetzt Aufsichtsmodell dokumentieren.",
      nextReviewCycle: "Jetzt Review-Zyklus dokumentieren.",
      nextRiskReview: "Jetzt kurze Pruefung zur Risikoklasse starten.",
      nextRiskMetadata: "Jetzt Risikoklasse in den Stammdaten dokumentieren.",
      nextOpenProofs: "Offene Grundnachweise dokumentieren.",
      nextSystemEvidence: "Weiter zu 2. Systemnachweis.",
      trustActivatedTitle: "Trust Portal aktiviert",
      trustActivatedDescription: (url: string) =>
        `Oeffentlicher Governance-Nachweis ist jetzt unter ${url} erreichbar.`,
      errorTitle: "Fehler",
      trustFailed: "Trust Portal konnte nicht aktiviert werden.",
      reportDownloadedTitle: "Report heruntergeladen",
      reportDownloadedDescription:
        "Governance-Stichtagsreport als CSV gespeichert.",
      reportFailed: "Report konnte nicht generiert werden.",
      savedTitle: "Gespeichert",
      savedNext:
        "Nachweis aktualisiert. Der naechste offene Entscheidungspunkt wurde geoeffnet.",
      savedDescription: "Nachweis aktualisiert.",
      saveFailed: "Aenderung konnte nicht gespeichert werden.",
      sectionTitle: "1. Grundnachweise",
      sectionDescription: "Risikoklasse, Rolle, Aufsicht und Review-Zyklus.",
      hideDetails: "Details ausblenden",
      statusTitle: "Stand",
      statusDescription: "Vier Grundangaben fuer den Nachweis.",
      completedCount: (done: number, total: number) =>
        `${done} von ${total} abgeschlossen`,
      alreadyDocumented: "Bereits dokumentiert",
      noGroundProofs: "Noch keine Grundnachweise dokumentiert.",
      stillOpen: "Noch offen",
      allGroundProofs: "Alle Grundnachweise sind dokumentiert.",
      next: "Als Naechstes",
      oversightPanelDescription:
        "Wie wird dieser Einsatzfall menschlich begleitet oder kontrolliert?",
      reviewCyclePanelDescription:
        "In welchem Rhythmus wird dieser Einsatzfall erneut geprueft?",
      currentlyDocumented: (value: string) => `Aktuell dokumentiert: ${value}`,
      noOversight: "Noch kein Aufsichtsmodell dokumentiert.",
      noReviewCycle: "Noch kein Review-Zyklus dokumentiert.",
      saveAndContinue: "Speichern und weiter",
      save: "Speichern",
      saving: "Speichert...",
      cancel: "Abbrechen",
      after: "Danach",
      reviewHistoryTitle: "Review-Verlauf",
      reviewHistoryDescription: "Reviews, Fristen und Verlauf.",
      deadlineMonitoring: "Fristueberwachung",
      reviewHistory: "Review-Historie",
      reviewsDocumented: (count: number) =>
        `${count} ${count === 1 ? "Review" : "Reviews"} dokumentiert`,
      noReviewDocumented: "Noch kein Review dokumentiert.",
      documentReviewNow: "Jetzt Review dokumentieren",
      governanceReport: "Governance-Report",
      reportDescription: "CSV fuer dokumentierte Reviews.",
      evidenceExport: "Nachweisexport",
      evidenceExportDescription: "Externe Nachweise und Audit-Dokumente.",
      auditDossier: "ISO 42001 Audit-Dossier",
      auditDossierDescription: "Organisationsweiter Audit-Nachweis.",
      governanceEvidence: "Governance-Nachweis",
      governanceEvidenceDescription: "Oeffentlich verifizierbarer Nachweis.",
      activating: "Wird aktiviert...",
      activateTrustPortal: "Trust Portal aktivieren",
      activateEvidence: "Jetzt Nachweise aktivieren",
      overdue: (days: number) =>
        `Ueberfaellig seit ${days} ${days === 1 ? "Tag" : "Tagen"}`,
      dueSoon: (days: number) =>
        `Faellig in ${days} ${days === 1 ? "Tag" : "Tagen"}`,
      nextReview: (date: string) => `Naechste Pruefung: ${date}`,
    };
  }

  return {
    organisationStandard: "organisation standard",
    riskBasedOrgStandard: "Risk-based (organisation standard)",
    adHoc: "Event-based",
    oversightDecision: "Define oversight model",
    reviewCycleDecision: "Define review cycle",
    upcomingAfterOversight:
      "Becomes active once the oversight model is documented.",
    upcomingAfterReviewCycle:
      "Becomes active once the review cycle is documented.",
    upcomingFallback: "This decision point follows next.",
    riskDocumented: "Risk class documented",
    ownerDocumented: "Responsible role documented",
    oversightDocumented: "Oversight model documented",
    reviewCycleDocumented: "Review cycle documented",
    change: "Change",
    defineOverride: "Define override",
    ownerMissing: "Document responsible role",
    inMasterData: "In master data.",
    riskReview: "Review risk class",
    riskDocument: "Document risk class",
    riskNextDetail: "As the next step after oversight and review cycle.",
    startShortReview: "Start short review",
    nextOversight: "Document oversight model now.",
    nextReviewCycle: "Document review cycle now.",
    nextRiskReview: "Start short risk-class review now.",
    nextRiskMetadata: "Document risk class in master data now.",
    nextOpenProofs: "Document open ground evidence.",
    nextSystemEvidence: "Continue to 2. System evidence.",
    trustActivatedTitle: "Trust Portal activated",
    trustActivatedDescription: (url: string) =>
      `Public governance evidence is now available at ${url}.`,
    errorTitle: "Error",
    trustFailed: "Trust Portal could not be activated.",
    reportDownloadedTitle: "Report downloaded",
    reportDownloadedDescription:
      "Governance point-in-time report saved as CSV.",
    reportFailed: "Report could not be generated.",
    savedTitle: "Saved",
    savedNext:
      "Evidence updated. The next open decision point has been opened.",
    savedDescription: "Evidence updated.",
    saveFailed: "Change could not be saved.",
    sectionTitle: "1. Ground evidence",
    sectionDescription: "Risk class, role, oversight, and review cycle.",
    hideDetails: "Hide details",
    statusTitle: "Status",
    statusDescription: "Four basic entries for evidence.",
    completedCount: (done: number, total: number) =>
      `${done} of ${total} complete`,
    alreadyDocumented: "Already documented",
    noGroundProofs: "No ground evidence documented yet.",
    stillOpen: "Still open",
    allGroundProofs: "All ground evidence is documented.",
    next: "Next",
    oversightPanelDescription:
      "How is this use case accompanied or controlled by humans?",
    reviewCyclePanelDescription:
      "At what interval is this use case reviewed again?",
    currentlyDocumented: (value: string) => `Currently documented: ${value}`,
    noOversight: "No oversight model documented yet.",
    noReviewCycle: "No review cycle documented yet.",
    saveAndContinue: "Save and continue",
    save: "Save",
    saving: "Saving...",
    cancel: "Cancel",
    after: "Afterwards",
    reviewHistoryTitle: "Review history",
    reviewHistoryDescription: "Reviews, deadlines, and history.",
    deadlineMonitoring: "Deadline monitoring",
    reviewHistory: "Review history",
    reviewsDocumented: (count: number) =>
      `${count} ${count === 1 ? "review" : "reviews"} documented`,
    noReviewDocumented: "No review documented yet.",
    documentReviewNow: "Document review now",
    governanceReport: "Governance report",
    reportDescription: "CSV for documented reviews.",
    evidenceExport: "Evidence export",
    evidenceExportDescription: "External evidence and audit documents.",
    auditDossier: "ISO 42001 audit dossier",
    auditDossierDescription: "Organisation-wide audit evidence.",
    governanceEvidence: "Governance evidence",
    governanceEvidenceDescription: "Publicly verifiable evidence.",
    activating: "Activating...",
    activateTrustPortal: "Activate Trust Portal",
    activateEvidence: "Activate evidence",
    overdue: (days: number) =>
      `Overdue by ${days} ${days === 1 ? "day" : "days"}`,
    dueSoon: (days: number) =>
      `Due in ${days} ${days === 1 ? "day" : "days"}`,
    nextReview: (date: string) => `Next review: ${date}`,
  };
}

type GovernanceLiabilityCopy = ReturnType<typeof getGovernanceLiabilityCopy>;

function formatDateForLocale(isoDate: string, locale: string): string {
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return "–";
    return d.toLocaleDateString(locale === "de" ? "de-DE" : "en-GB");
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

function getOversightLabel(
  value: OversightValue | null | undefined,
  options: DecisionOption<Exclude<OversightValue, "unknown">>[],
): string | null {
  const normalized = normalizeOversightValue(value);
  if (normalized === "unknown") {
    return null;
  }

  const match = options.find((option) => option.value === normalized);
  return match?.title ?? normalized;
}

function getReviewCycleLabel(
  value: ReviewCycleValue | null | undefined,
  options: DecisionOption<Exclude<ReviewCycleValue, "unknown" | "ad_hoc">>[],
  copy: GovernanceLiabilityCopy,
): string | null {
  const normalized = normalizeReviewCycleValue(value);
  if (normalized === "unknown") {
    return null;
  }

  if (normalized === "ad_hoc") {
    return copy.adHoc;
  }

  const match = options.find((option) => option.value === normalized);
  return match?.title ?? normalized;
}

function getEffectiveReviewCycleDetail(
  reviewCycle: ReviewCycleValue | null | undefined,
  orgSettings: OrgSettings | null | undefined,
  options: DecisionOption<Exclude<ReviewCycleValue, "unknown" | "ad_hoc">>[],
  copy: GovernanceLiabilityCopy,
): { label: string; source: "use_case" | "org" } | null {
  const directLabel = getReviewCycleLabel(reviewCycle, options, copy);
  if (directLabel) {
    return {
      label: directLabel,
      source: "use_case",
    };
  }

  if (orgSettings?.reviewStandard === "risk-based") {
    return {
      label: copy.riskBasedOrgStandard,
      source: "org",
    };
  }

  const inheritedLabel = getReviewCycleLabel(
    orgSettings?.reviewStandard ?? "unknown",
    options,
    copy,
  );

  if (!inheritedLabel) {
    return null;
  }

  return {
    label: `${inheritedLabel} (${copy.organisationStandard})`,
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

function getDecisionTitle(
  field: EditableField,
  copy: GovernanceLiabilityCopy,
): string {
  return field === "oversight"
    ? copy.oversightDecision
    : copy.reviewCycleDecision;
}

function getUpcomingDecisionHint(input: {
  activeField: EditableField | null;
  nextField: EditableField | null;
}, copy: GovernanceLiabilityCopy): string | null {
  if (!input.nextField) {
    return null;
  }

  if (input.activeField === "oversight" && input.nextField === "reviewCycle") {
    return copy.upcomingAfterOversight;
  }

  if (input.activeField === "reviewCycle" && input.nextField === "oversight") {
    return copy.upcomingAfterReviewCycle;
  }

  return copy.upcomingFallback;
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
  onOpenRiskReview = null,
  focusField = null,
  autoOpenField = null,
  onToggleDetails = null,
}: GovernanceLiabilitySectionProps) {
  const locale = useLocale();
  const copy = getGovernanceLiabilityCopy(locale);
  const oversightOptions = locale === "de" ? OVERSIGHT_OPTIONS : OVERSIGHT_OPTIONS_EN;
  const reviewCycleOptions =
    locale === "de" ? REVIEW_CYCLE_OPTIONS : REVIEW_CYCLE_OPTIONS_EN;
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

  const hasRiskClass = hasDocumentedAiActCategory(
    card.governanceAssessment?.core?.aiActCategory,
  );
  const hasOwner =
    Boolean(card.responsibility?.responsibleParty) ||
    card.responsibility?.isCurrentlyResponsible === true;
  const hasOversight = normalizeOversightValue(iso?.oversightModel) !== "unknown";
  const reviewCycleDetail = getEffectiveReviewCycleDetail(
    normalizeReviewCycleValue(iso?.reviewCycle),
    orgSettings,
    reviewCycleOptions,
    copy,
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
    oversightOptions,
  );

  const openEditor = useCallback((field: EditableField) => {
    setEditingField(field);
    focusDecisionField(field);
  }, []);

  const completedRequirements = compactRequirements([
    hasRiskClass
      ? {
          key: "risk",
          label: copy.riskDocumented,
        }
      : null,
    hasOwner
      ? {
          key: "owner",
          label: copy.ownerDocumented,
        }
      : null,
    hasOversight
      ? {
          key: "oversight",
          label: copy.oversightDocumented,
          detail: documentedOversightLabel,
          actionLabel: copy.change,
          onAction: () => openEditor("oversight"),
        }
      : null,
    hasReviewCycle
      ? {
          key: "reviewCycle",
          label: copy.reviewCycleDocumented,
          detail: reviewCycleDetail?.label ?? null,
          actionLabel:
            reviewCycleDetail?.source === "org" ? copy.defineOverride : copy.change,
          onAction: () => openEditor("reviewCycle"),
        }
      : null,
  ]);

  const showOversightDecision = !hasOversight || editingField === "oversight";
  const showReviewCycleDecision = !hasReviewCycle || editingField === "reviewCycle";
  const activeDecisionField: EditableField | null =
    editingField ??
    (!hasOversight ? "oversight" : !hasReviewCycle ? "reviewCycle" : null);
  const nextDecisionField = activeDecisionField
    ? getNextOpenDecisionField({
        currentField: activeDecisionField,
        oversightValue:
          activeDecisionField === "oversight"
            ? draftValues.oversight
            : normalizeOversightValue(iso?.oversightModel),
        reviewCycleValue:
          activeDecisionField === "reviewCycle"
            ? draftValues.reviewCycle
            : normalizeReviewCycleValue(iso?.reviewCycle),
        orgSettings,
      })
    : null;
  const upcomingDecisionHint = getUpcomingDecisionHint({
    activeField: activeDecisionField,
    nextField: nextDecisionField,
  }, copy);
  const canLaunchRiskReview =
    !hasRiskClass && !activeDecisionField && Boolean(onOpenRiskReview);
  const missingRequirements = compactRequirements([
    !hasOwner
      ? {
          key: "owner",
          label: copy.ownerMissing,
          detail: copy.inMasterData,
        }
      : null,
    !hasOversight
      ? {
          key: "oversight",
          label: copy.oversightDecision,
          detail: null,
        }
      : null,
    !hasReviewCycle
      ? {
          key: "reviewCycle",
          label: copy.reviewCycleDecision,
          detail: null,
        }
      : null,
    !hasRiskClass
      ? {
          key: "risk",
          label: canLaunchRiskReview
            ? copy.riskReview
            : copy.riskDocument,
          detail: canLaunchRiskReview
            ? copy.riskNextDetail
            : copy.inMasterData,
          actionLabel: canLaunchRiskReview ? copy.startShortReview : null,
          onAction: canLaunchRiskReview ? () => onOpenRiskReview?.() : null,
        }
      : null,
  ]);
  const groundProofsNextHint =
    activeDecisionField === "oversight"
      ? copy.nextOversight
      : activeDecisionField === "reviewCycle"
        ? copy.nextReviewCycle
        : canLaunchRiskReview
          ? copy.nextRiskReview
          : !hasRiskClass
            ? copy.nextRiskMetadata
        : missingRequirements.length > 0
          ? copy.nextOpenProofs
          : copy.nextSystemEvidence;

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
        title: copy.trustActivatedTitle,
        description: copy.trustActivatedDescription(result.verifyUrl),
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: copy.errorTitle,
        description: copy.trustFailed,
      });
      console.error("Trust Portal activation failed:", err);
    } finally {
      setIsActivatingPortal(false);
    }
  }, [card.useCaseId, copy, onCardUpdate, router, toast, trustCap.allowed]);

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
        title: copy.reportDownloadedTitle,
        description: copy.reportDownloadedDescription,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: copy.errorTitle,
        description: copy.reportFailed,
      });
      console.error("Report generation failed:", err);
    }
  }, [card, copy, useCases, orgSettings, toast]);

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
        const currentIso: Partial<GovernanceIsoSettings> =
          card.governanceAssessment?.flex?.iso ?? {};
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
          title: copy.savedTitle,
          description: nextField
            ? copy.savedNext
            : copy.savedDescription,
        });
      } catch {
        toast({
          variant: "destructive",
          title: copy.errorTitle,
          description: copy.saveFailed,
        });
      } finally {
        setIsSavingField(null);
      }
    },
    [card, copy, draftValues, onCardUpdate, orgSettings, toast],
  );

  return (
    <Card className="border-slate-300">
      <CardHeader className="border-b border-slate-200 bg-white pb-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <ShieldCheck className="h-4 w-4 text-slate-500" />
            {copy.sectionTitle}
          </CardTitle>
          <p className="text-sm text-slate-600">
            {copy.sectionDescription}
          </p>
          </div>
          {onToggleDetails ? (
            <Button size="sm" variant="outline" onClick={onToggleDetails}>
              {copy.hideDetails}
            </Button>
          ) : null}
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
              <h3 className="text-sm font-semibold text-slate-900">
                {copy.statusTitle}
              </h3>
              <p className="text-sm text-slate-600">
                {copy.statusDescription}
              </p>
            </div>
            <p className="text-xs text-slate-500">
              {copy.completedCount(section1Passed, section1Total)}
            </p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <RequirementGroupCard
              title={copy.alreadyDocumented}
              emptyText={copy.noGroundProofs}
              items={completedRequirements}
            />
            <RequirementGroupCard
              title={copy.stillOpen}
              emptyText={copy.allGroundProofs}
              items={missingRequirements}
              tone="open"
            />
          </div>

          <div className="mt-4 space-y-1">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-500">
              {copy.next}
            </p>
            <p className="text-sm leading-6 text-slate-600">
              {groundProofsNextHint}
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {activeDecisionField === "oversight" && showOversightDecision ? (
              <DecisionPanel
                id="governance-decision-oversight"
                title={copy.oversightDecision}
                description={copy.oversightPanelDescription}
                helperText={
                  hasOversight && documentedOversightLabel
                    ? copy.currentlyDocumented(documentedOversightLabel)
                    : copy.noOversight
                }
                options={oversightOptions}
                selectedValue={draftValues.oversight}
                isSaving={isSavingField === "oversight"}
                submitLabel={!hasReviewCycle ? copy.saveAndContinue : copy.save}
                savingLabel={copy.saving}
                cancelLabel={copy.cancel}
                onSelect={(value) => handleSelectValue("oversight", value)}
                onSave={() => void handleSaveField("oversight")}
                onCancel={
                  hasOversight ? () => handleCloseEditor("oversight") : undefined
                }
                active
              />
            ) : null}

            {activeDecisionField === "reviewCycle" && showReviewCycleDecision ? (
              <DecisionPanel
                id="governance-decision-reviewCycle"
                title={copy.reviewCycleDecision}
                description={copy.reviewCyclePanelDescription}
                helperText={
                  reviewCycleDetail
                    ? copy.currentlyDocumented(reviewCycleDetail.label)
                    : copy.noReviewCycle
                }
                options={reviewCycleOptions}
                selectedValue={draftValues.reviewCycle}
                isSaving={isSavingField === "reviewCycle"}
                submitLabel={!hasOversight ? copy.saveAndContinue : copy.save}
                savingLabel={copy.saving}
                cancelLabel={copy.cancel}
                onSelect={(value) => handleSelectValue("reviewCycle", value)}
                onSave={() => void handleSaveField("reviewCycle")}
                onCancel={
                  hasReviewCycle ? () => handleCloseEditor("reviewCycle") : undefined
                }
                active
              />
            ) : null}

            {nextDecisionField && upcomingDecisionHint ? (
              <UpcomingDecisionCard
                title={getDecisionTitle(nextDecisionField, copy)}
                hint={upcomingDecisionHint}
                afterLabel={copy.after}
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
              <h3 className="text-sm font-semibold text-slate-900">
                {copy.reviewHistoryTitle}
              </h3>
              <p className="text-sm text-slate-600">
                {copy.reviewHistoryDescription}
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
                  <p className="font-medium text-slate-900">
                    {copy.deadlineMonitoring}
                  </p>
                  <p className="text-sm text-slate-600">
                    <DeadlineDisplay
                      status={deadline.status}
                      daysRemaining={deadline.daysRemaining}
                      nextReviewAt={deadline.nextReviewAt}
                      locale={locale}
                      copy={copy}
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
                    <p className="font-medium text-slate-900">
                      {copy.reviewHistory}
                    </p>
                    <p className="text-sm text-slate-600">
                      {hasHistory
                        ? copy.reviewsDocumented(card.reviews.length)
                        : copy.noReviewDocumented}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={handleActivateReviewWorkflow}
                  >
                    {copy.documentReviewNow}
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
                    <p className="font-medium text-slate-900">
                      {copy.governanceReport}
                    </p>
                    <p className="text-sm text-slate-600">
                      {copy.reportDescription}
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
                <li>{copy.deadlineMonitoring}</li>
                <li>{copy.reviewHistory}</li>
                <li>{copy.governanceReport}</li>
              </ul>
              <p className="mt-3 text-sm text-slate-600">
                {copy.reviewHistoryDescription}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={handleActivateReviewWorkflow}
              >
                {copy.documentReviewNow}
              </Button>
            </div>
          )}
        </section>

        <section className="p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-900">
                {copy.evidenceExport}
              </h3>
              <p className="text-sm text-slate-600">
                {copy.evidenceExportDescription}
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
                  <p className="font-medium text-slate-900">
                    {copy.auditDossier}
                  </p>
                  <p className="text-sm text-slate-600">
                    {copy.auditDossierDescription}
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
                    <p className="font-medium text-slate-900">
                      {copy.governanceEvidence}
                    </p>
                    <p className="text-sm text-slate-600">
                      {copy.governanceEvidenceDescription}
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
                      {isActivatingPortal
                        ? copy.activating
                        : copy.activateTrustPortal}
                    </Button>
                  ) : null}
                </div>
              </li>
            </ul>
          ) : (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
              <ul className="space-y-2 text-sm text-slate-600">
                <li>{copy.auditDossier}</li>
                <li>{copy.governanceEvidence}</li>
              </ul>
              <p className="mt-3 text-sm text-slate-600">
                {copy.evidenceExportDescription}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => void handleActivateTrustPortal()}
              >
                {copy.activateEvidence}
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
  savingLabel,
  cancelLabel,
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
  savingLabel: string;
  cancelLabel: string;
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
          {isSaving ? savingLabel : submitLabel}
        </Button>
        {onCancel ? (
          <Button size="sm" variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function UpcomingDecisionCard({
  title,
  hint,
  afterLabel,
}: {
  title: string;
  hint: string;
  afterLabel: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 md:p-5">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.08em] text-slate-500">
          {afterLabel}
        </p>
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        <p className="text-sm text-slate-600">{hint}</p>
      </div>
    </div>
  );
}

function DeadlineDisplay({
  status,
  daysRemaining,
  nextReviewAt,
  locale,
  copy,
}: {
  status: string;
  daysRemaining: number | null;
  nextReviewAt: string | null;
  locale: string;
  copy: GovernanceLiabilityCopy;
}) {
  if (status === "overdue" && daysRemaining !== null) {
    return <span>{copy.overdue(Math.abs(daysRemaining))}</span>;
  }

  if (status === "due_soon" && daysRemaining !== null) {
    return <span>{copy.dueSoon(daysRemaining)}</span>;
  }

  if (status === "on_track" && nextReviewAt) {
    return (
      <span>{copy.nextReview(formatDateForLocale(nextReviewAt, locale))}</span>
    );
  }

  return (
    <span>
      {getDeadlineStatusLabel(
        status as "overdue" | "due_soon" | "on_track" | "no_deadline",
      )}
    </span>
  );
}
