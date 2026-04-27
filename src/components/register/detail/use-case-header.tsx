"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  ArrowLeft,
  Download,
  FileJson,
  MoreHorizontal,
  Pencil,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  createAiToolsRegistryService,
  getDisplayedRiskClassLabel,
  getUseCaseSystemsSummary,
  getUseCaseWorkflowBadge,
  getUseCaseSource,
  getUseCaseSourceBadges,
  getUseCaseSourceLabel,
  getUseCaseSubmitterIdentity,
} from "@/lib/register-first";
import { RegisterStatusPill } from "@/components/register/detail/status-pill";
import type { UseCaseCard } from "@/lib/register-first/types";
import {
  getDataCategoryLabel,
  getDecisionInfluenceLabel,
  getUsageContextLabel,
  resolveDataCategories,
  resolveDecisionInfluence,
} from "@/lib/register-first/types";
import { cn } from "@/lib/utils";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useAuth } from "@/context/auth-context";
import { registerService } from "@/lib/register-first/register-service";
import { useToast } from "@/hooks/use-toast";
import {
  buildScopedRegisterHref,
  buildScopedUseCasePassHref,
} from "@/lib/navigation/workspace-scope";
import { useWorkspaceScope } from "@/lib/navigation/use-workspace-scope";
import { useRouter } from "@/i18n/navigation";
import type { EditableMetadataField } from "./use-case-metadata-section";

interface UseCaseHeaderProps {
  card: UseCaseCard;
  onDelete?: () => Promise<void>;
  onRefresh?: () => Promise<void>;
  onEditField?: (field: EditableMetadataField) => void;
}

const aiRegistry = createAiToolsRegistryService();
const legacyDecisionImpactLabelsDe = {
  YES: "Ja",
  NO: "Nein",
  UNSURE: "Unsicher",
} as const;

const legacyDecisionImpactLabelsEn = {
  YES: "Yes",
  NO: "No",
  UNSURE: "Unsure",
} as const;

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function UseCaseHeader({
  card,
  onDelete,
  onRefresh,
  onEditField,
}: UseCaseHeaderProps) {
  const locale = useLocale();
  const isGerman = locale === "de";
  const copy = {
    noSystem: isGerman ? "Kein System" : "No system",
    notSpecified: isGerman ? "Nicht angegeben" : "Not specified",
    notAssigned: isGerman ? "Nicht zugewiesen" : "Not assigned",
    internalTeam: isGerman ? "Internes Team" : "Internal team",
    currentCapturer: isGerman ? "Erfasser:in (selbst)" : "Captured by current user",
    capturedBy: isGerman ? "Erfasst von" : "Captured by",
    submittedBy: isGerman ? "Eingereicht von" : "Submitted by",
    source: isGerman ? "Herkunft" : "Source",
    reference: isGerman ? "Referenz" : "Reference",
    systemSingular: isGerman ? "System" : "system",
    systemPlural: isGerman ? "Systeme" : "systems",
    unknownDate: isGerman ? "unbekannt" : "unknown",
    openEukiId: isGerman ? "EUKI-ID offen" : "EUKI ID pending",
    updated: isGerman ? "Aktualisiert" : "Updated",
    sealedSuccessTitle: isGerman ? "Erfolgreich besiegelt" : "Successfully sealed",
    sealedSuccessDescription: isGerman
      ? "Der Einsatzfall wurde kryptografisch versiegelt."
      : "The use case has been cryptographically sealed.",
    errorTitle: isGerman ? "Fehler" : "Error",
    sealFailed: isGerman ? "Versiegeln fehlgeschlagen." : "Sealing failed.",
    signedBy: isGerman ? "Gezeichnet von" : "Signed by",
    back: isGerman ? "Zurück" : "Back",
    proofReadyLine: isGerman
      ? "Dieser Einsatzfall ist formal geprüft und nachweisfähig dokumentiert."
      : "This use case has been formally reviewed and documented as evidence-ready.",
    openPass: isGerman ? "Use-Case-Pass öffnen" : "Open use case pass",
    moreActionsTitle: isGerman ? "Weitere Aktionen" : "More actions",
    more: isGerman ? "Mehr" : "More",
    exportPdf: isGerman ? "PDF exportieren" : "Export PDF",
    exportJson: isGerman ? "JSON exportieren" : "Export JSON",
    sealing: isGerman ? "Formal signieren..." : "Signing...",
    seal: isGerman ? "Formal signieren" : "Formally sign",
    delete: isGerman ? "Loeschen" : "Delete",
    ownerRole: isGerman ? "Owner-Rolle" : "Owner role",
    decisionRelevance: isGerman
      ? "Entscheidungsrelevanz"
      : "Decision relevance",
    riskClass: isGerman ? "Risikoklasse" : "Risk class",
    impactScope: isGerman ? "Wirkungsbereich" : "Scope",
    deleteTitle: isGerman ? "Einsatzfall loeschen?" : "Delete use case?",
    deleteDescription: isGerman
      ? "Diese Aktion kann nicht rueckgaengig gemacht werden. Der Einsatzfall wird unwiderruflich geloescht."
      : "This action cannot be undone. The use case will be permanently deleted.",
    cancel: isGerman ? "Abbrechen" : "Cancel",
    deleting: isGerman ? "Loeschen..." : "Deleting...",
    deleteConfirm: isGerman ? "Endgueltig loeschen" : "Delete permanently",
  };
  const router = useRouter();
  const workspaceScope = useWorkspaceScope();
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const { user } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSealing, setIsSealing] = useState(false);
  const isProofReady = card.status === "PROOF_READY";

  const toolEntry = card.toolId ? aiRegistry.getById(card.toolId) : null;
  const toolDisplayName = getUseCaseSystemsSummary(card, {
    resolveToolName: (toolId) => aiRegistry.getById(toolId)?.productName ?? null,
    emptyLabel: copy.noSystem,
    locale,
  });
  const workflowBadge = getUseCaseWorkflowBadge(card, {
    locale,
    resolveToolName: (toolId) => aiRegistry.getById(toolId)?.productName ?? null,
  });
  const systemCount = (card.toolId || card.toolFreeText ? 1 : 0) +
    (card.workflow?.additionalSystems?.length ?? 0);

  const riskClass = getDisplayedRiskClassLabel({
    aiActCategory: card.governanceAssessment?.core?.aiActCategory,
    toolRiskLevel: toolEntry?.riskLevel ?? null,
    short: true,
    locale,
  });
  const usageScope = card.usageContexts.length
    ? card.usageContexts
        .map((ctx) => getUsageContextLabel(ctx, locale))
        .join(", ")
    : copy.notSpecified;
  const decisionInfluence = resolveDecisionInfluence(card);
  const decisionLabel = decisionInfluence
    ? getDecisionInfluenceLabel(decisionInfluence, locale)
    : (isGerman ? legacyDecisionImpactLabelsDe : legacyDecisionImpactLabelsEn)[
        card.decisionImpact
      ];
  const dataCategories = resolveDataCategories(card);
  const dataCategoryLabel = dataCategories.length
    ? dataCategories
        .map((cat) => getDataCategoryLabel(cat, locale) ?? cat)
        .join(", ")
    : copy.notSpecified;
  const ownerLabel = card.responsibility.isCurrentlyResponsible
    ? copy.currentCapturer
    : card.responsibility.responsibleParty || copy.notAssigned;
  const source = getUseCaseSource(card);
  const sourceBadges = getUseCaseSourceBadges(card, locale);
  const visibleSourceBadges = sourceBadges.filter((badge) => badge.key !== "MANUELL");
  const submitterIdentity = getUseCaseSubmitterIdentity(card);
  const displaySubmitterIdentity =
    submitterIdentity ?? (source === "manual" ? copy.internalTeam : null);
  const sourceReference =
    card.origin?.sourceRequestId ??
    card.externalIntake?.submissionId ??
    card.externalIntake?.requestTokenId ??
    card.externalIntake?.accessCodeId ??
    null;
  const provenanceLine = [
    `${copy.source}: ${getUseCaseSourceLabel(source, locale)}`,
    displaySubmitterIdentity
      ? source === "manual"
        ? `${copy.capturedBy} ${displaySubmitterIdentity}`
        : `${copy.submittedBy} ${displaySubmitterIdentity}`
      : null,
    sourceReference ? `${copy.reference} ${sourceReference}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
      router.push(buildScopedRegisterHref(workspaceScope));
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSeal = async () => {
    if (!profile?.isOfficer || !user) return;
    setIsSealing(true);
    try {
      await registerService.sealUseCaseManual({
        registerId: undefined, // uses scope
        useCaseId: card.useCaseId,
        officerId: user.uid,
        officerName: user.displayName || user.email || "EUKI Officer",
      });
      toast({
        title: copy.sealedSuccessTitle,
        description: copy.sealedSuccessDescription,
      });
      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: copy.errorTitle,
        description: copy.sealFailed,
      });
    } finally {
      setIsSealing(false);
    }
  };

  const handleExportJSON = () => {
    const exportData = {
      useCaseId: card.useCaseId,
      globalUseCaseId: card.globalUseCaseId,
      purpose: card.purpose,
      toolId: card.toolId,
      toolFreeText: card.toolFreeText,
      workflow: card.workflow,
      status: card.status,
      cardVersion: card.cardVersion,
      dataCategory: card.dataCategory,
      usageContexts: card.usageContexts,
      decisionInfluence: card.decisionInfluence,
      responsibility: card.responsibility,
      governanceAssessment: card.governanceAssessment,
      isPublicVisible: card.isPublicVisible,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
      reviews: card.reviews,
      statusHistory: card.statusHistory,
      manualEdits: card.manualEdits,
      origin: card.origin,
      externalIntake: card.externalIntake,
    };
    const json = JSON.stringify(exportData, null, 2);
    const filename = `use-case-pass-${card.globalUseCaseId || card.useCaseId}.json`;
    downloadFile(json, filename, "application/json;charset=utf-8");
  };

  const subline = [
    card.globalUseCaseId ?? copy.openEukiId,
    `v${card.cardVersion}`,
    provenanceLine,
    `${copy.updated} ${formatDate(card.updatedAt, locale, copy.unknownDate)}`,
  ].join(" · ");

  return (
    <>
      {card.sealedAt && (
        <div className="hidden print:flex flex-col items-center absolute top-12 right-12 transform rotate-[-15deg] opacity-20 border-8 border-emerald-600 text-emerald-600 rounded-2xl p-6 max-w-[400px] text-center pointer-events-none z-50">
          <p className="font-black text-4xl uppercase mb-2 tracking-widest">EUKI CERTIFIED</p>
          <p className="text-lg font-bold">
            {copy.signedBy} {card.sealedByName}
          </p>
          <p className="text-sm font-mono mt-3">Hash: {card.sealHash}</p>
          <p className="text-sm mt-1">
            {formatDate(card.sealedAt, locale, copy.unknownDate)}
          </p>
        </div>
      )}
      <div
        className="space-y-6"
      >
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-0 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground"
            onClick={() => {
              if (window.history.length > 2) {
                router.back();
              } else {
                router.push(buildScopedRegisterHref(workspaceScope));
              }
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            {copy.back}
          </Button>
        </div>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <h1
                  className={cn(
                    "text-[34px] font-semibold leading-tight tracking-tight text-slate-950",
                    isProofReady && "font-[650]"
                  )}
                >
                  {card.purpose}
                </h1>
                <RegisterStatusPill status={card.status} />
              </div>

              <div className="space-y-2 text-[15px] leading-7">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-slate-600">
                  <p className="font-medium text-slate-700">{toolDisplayName}</p>
                  {workflowBadge ? (
                    <p className="text-slate-600">{workflowBadge}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {systemCount > 0 ? (
                <HeaderSignalPill>
                  {`${systemCount} ${systemCount === 1 ? copy.systemSingular : copy.systemPlural}`}
                </HeaderSignalPill>
              ) : null}
              <HeaderSignalPill>{usageScope}</HeaderSignalPill>
              <HeaderSignalPill>{dataCategoryLabel}</HeaderSignalPill>
              {visibleSourceBadges.map((badge) => (
                <Badge
                  key={badge.key}
                  variant="outline"
                  className={cn("tracking-[0.06em]", badge.className)}
                >
                  {badge.label}
                </Badge>
              ))}
            </div>

            <p className="text-xs text-slate-500">{subline}</p>
            {isProofReady ? (
              <p className="text-xs text-emerald-700">
                {copy.proofReadyLine}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(buildScopedUseCasePassHref(card.useCaseId, workspaceScope))
              }
              title={copy.openPass}
            >
              {copy.openPass}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" title={copy.moreActionsTitle}>
                  <MoreHorizontal className="mr-1.5 h-3.5 w-3.5" />
                  {copy.more}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onSelect={() => window.print()}>
                  <Download className="h-4 w-4" />
                  {copy.exportPdf}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleExportJSON}>
                  <FileJson className="h-4 w-4" />
                  {copy.exportJson}
                </DropdownMenuItem>
                {(!card.sealedAt && profile?.isOfficer) || onDelete ? (
                  <DropdownMenuSeparator />
                ) : null}
                {!card.sealedAt && profile?.isOfficer ? (
                  <DropdownMenuItem
                    onSelect={() => void handleSeal()}
                    disabled={isSealing}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {isSealing ? copy.sealing : copy.seal}
                  </DropdownMenuItem>
                ) : null}
                {onDelete ? (
                  <DropdownMenuItem
                    onSelect={() => setShowDeleteConfirm(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    {copy.delete}
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {card.sealedAt ? (
          <div className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800" title={`Siegel (${card.sealHash})`}>
            <ShieldCheck className="h-4 w-4" />
            <span>
              {copy.signedBy} {card.sealedByName || "Officer"}
            </span>
          </div>
        ) : null}

        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <MetaItem
              label={copy.ownerRole}
              value={ownerLabel}
              onEdit={onEditField ? () => onEditField("responsibleParty") : undefined}
            />
            <MetaItem
              label={copy.decisionRelevance}
              value={decisionLabel}
              onEdit={onEditField ? () => onEditField("decisionInfluence") : undefined}
            />
            <MetaItem
              label={copy.riskClass}
              value={riskClass}
              onEdit={onEditField ? () => onEditField("aiActCategory") : undefined}
            />
            <MetaItem
              label={copy.impactScope}
              value={usageScope}
              onEdit={onEditField ? () => onEditField("usageContexts") : undefined}
            />
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.deleteDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{copy.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? copy.deleting : copy.deleteConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function MetaItem({
  label,
  value,
  className,
  onEdit,
}: {
  label: string;
  value: string;
  className?: string;
  onEdit?: () => void;
}) {
  if (onEdit) {
    return (
      <button
        type="button"
        onClick={onEdit}
        className={cn(
          "group space-y-1 rounded-lg p-1.5 -m-1.5 text-left transition-colors hover:bg-white/80",
          className,
        )}
      >
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
            {label}
          </p>
          <Pencil className="h-3 w-3 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <p className="text-[15px] leading-7 font-medium text-slate-900">{value}</p>
      </button>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="text-[15px] leading-7 font-medium text-slate-900">{value}</p>
    </div>
  );
}

function HeaderSignalPill({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
      {children}
    </span>
  );
}

function formatDate(
  isoDate: string,
  locale: string,
  unknownLabel: string,
): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return unknownLabel;
  return date.toLocaleString(locale === "de" ? "de-DE" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
