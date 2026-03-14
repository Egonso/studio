"use client";

import { useState } from "react";
import { ArrowLeft, Download, FileJson, Pencil, Trash2, X, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
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
  createAiToolsRegistryService,
  getUseCaseSource,
  getUseCaseSourceBadges,
  getUseCaseSourceLabel,
  getUseCaseSubmitterIdentity,
  riskLevelLabels,
} from "@/lib/register-first";
import { RegisterStatusPill } from "@/components/register/detail/status-pill";
import type { UseCaseCard } from "@/lib/register-first/types";
import {
  DATA_CATEGORY_LABELS,
  DECISION_INFLUENCE_LABELS,
  resolveDataCategories,
  resolveDecisionInfluence,
  USAGE_CONTEXT_LABELS,
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

interface UseCaseHeaderProps {
  card: UseCaseCard;
  isEditing: boolean;
  onToggleEdit: () => void;
  onDelete?: () => Promise<void>;
  onRefresh?: () => Promise<void>;
}

const aiRegistry = createAiToolsRegistryService();
const legacyDecisionImpactLabels = {
  YES: "Ja",
  NO: "Nein",
  UNSURE: "Unsicher",
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

export function UseCaseHeader({ card, isEditing, onToggleEdit, onDelete, onRefresh }: UseCaseHeaderProps) {
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
  const toolDisplayName =
    card.toolId === "other"
      ? card.toolFreeText ?? "Anderes Tool"
      : toolEntry?.productName ?? card.toolId ?? "Kein Tool";

  const riskClass =
    card.governanceAssessment?.core?.aiActCategory ??
    (toolEntry ? riskLevelLabels[toolEntry.riskLevel] : "Unbekannt");
  const usageScope = card.usageContexts.length
    ? card.usageContexts.map((ctx) => USAGE_CONTEXT_LABELS[ctx]).join(", ")
    : "Nicht angegeben";
  const decisionInfluence = resolveDecisionInfluence(card);
  const decisionLabel = decisionInfluence
    ? DECISION_INFLUENCE_LABELS[decisionInfluence]
    : legacyDecisionImpactLabels[card.decisionImpact];
  const dataCategories = resolveDataCategories(card);
  const dataCategoryLabel = dataCategories.length
    ? dataCategories.map((cat) => DATA_CATEGORY_LABELS[cat] ?? cat).join(", ")
    : "Nicht angegeben";
  const ownerLabel = card.responsibility.isCurrentlyResponsible
    ? "Erfasser:in (selbst)"
    : card.responsibility.responsibleParty || "Nicht zugewiesen";
  const source = getUseCaseSource(card);
  const sourceBadges = getUseCaseSourceBadges(card);
  const submitterIdentity = getUseCaseSubmitterIdentity(card);
  const displaySubmitterIdentity =
    submitterIdentity ?? (source === "manual" ? "Internes Team" : null);
  const sourceReference =
    card.origin?.sourceRequestId ??
    card.externalIntake?.submissionId ??
    card.externalIntake?.requestTokenId ??
    card.externalIntake?.accessCodeId ??
    null;
  const provenanceLine = [
    `Herkunft: ${getUseCaseSourceLabel(source)}`,
    displaySubmitterIdentity
      ? source === "manual"
        ? `Erfasst von ${displaySubmitterIdentity}`
        : `Eingereicht von ${displaySubmitterIdentity}`
      : null,
    sourceReference ? `Referenz ${sourceReference}` : null,
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
      toast({ title: "Erfolgreich besiegelt", description: "Der Einsatzfall wurde kryptografisch versiegelt." });
      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Fehler", description: "Versiegeln fehlgeschlagen." });
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
    toolDisplayName,
    card.globalUseCaseId ?? "EUKI-ID offen",
    `v${card.cardVersion}`,
    card.isPublicVisible ? "Nachweis sichtbar" : "Nachweis intern",
    formatDate(card.updatedAt),
  ].join(" · ");

  return (
    <>
      {card.sealedAt && (
        <div className="hidden print:flex flex-col items-center absolute top-12 right-12 transform rotate-[-15deg] opacity-20 border-8 border-emerald-600 text-emerald-600 rounded-2xl p-6 max-w-[400px] text-center pointer-events-none z-50">
          <p className="font-black text-4xl uppercase mb-2 tracking-widest">EUKI CERTIFIED</p>
          <p className="text-lg font-bold">Gezeichnet von {card.sealedByName}</p>
          <p className="text-sm font-mono mt-3">Hash: {card.sealHash}</p>
          <p className="text-sm mt-1">{formatDate(card.sealedAt)}</p>
        </div>
      )}
      <div
        className={cn(
          "space-y-6",
          isProofReady && "border-l-2 border-emerald-300 pl-4"
        )}
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
            Zurück
          </Button>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <h1
              className={cn(
                "text-[30px] font-semibold leading-tight tracking-tight",
                isProofReady && "font-[650]"
              )}
            >
              {card.purpose}
            </h1>
            <p
              className={cn(
                "text-sm text-muted-foreground",
                isProofReady && "text-slate-700"
              )}
            >
              {subline}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {sourceBadges.map((badge) => (
                <Badge
                  key={badge.key}
                  variant="outline"
                  className={badge.className}
                >
                  {badge.label}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-slate-600">{provenanceLine}</p>
            {isProofReady && (
              <p className="text-xs text-emerald-700">
                Dieser Einsatzfall ist formal geprüft und nachweisfähig dokumentiert.
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
            {card.sealedAt && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-200 bg-emerald-50 text-emerald-800 rounded-md text-xs font-medium mr-2" title={`Siegel (${card.sealHash})`}>
                <ShieldCheck className="h-4 w-4" />
                <span>Gezeichnet von {card.sealedByName || "Officer"}</span>
              </div>
            )}
            {!card.sealedAt && profile?.isOfficer && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeal}
                disabled={isSealing}
                className="mr-2"
                title="Dokument formal signieren"
              >
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                {isSealing ? "Signiere..." : "Formal signieren"}
              </Button>
            )}
            <RegisterStatusPill status={card.status} />
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(buildScopedUseCasePassHref(card.useCaseId, workspaceScope))
              }
              title="Use-Case-Pass öffnen"
            >
              Use-Case-Pass öffnen
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              title="Use-Case-Pass als PDF exportieren"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportJSON}
              title="Use-Case-Pass als JSON exportieren"
            >
              <FileJson className="mr-1.5 h-3.5 w-3.5" />
              JSON
            </Button>
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={onToggleEdit}
              title={
                isEditing
                  ? "Bearbeitung der Stammdaten beenden"
                  : "Stammdaten des Einsatzfalls ändern"
              }
            >
              {isEditing ? (
                <>
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  Bearbeiten beenden
                </>
              ) : (
                <>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Stammdaten bearbeiten
                </>
              )}
            </Button>
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Loeschen
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-2 lg:grid-cols-3">
          <MetaItem label="Owner-Rolle" value={ownerLabel} />
          <MetaItem label="Risikoklasse" value={riskClass} />
          <MetaItem label="Wirkungsbereich" value={usageScope} />
          <MetaItem label="Entscheidungsrelevanz" value={decisionLabel} />
          <MetaItem label="Datenkategorien" value={dataCategoryLabel} className="sm:col-span-2" />
        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Einsatzfall loeschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rueckgaengig gemacht werden. Der Einsatzfall
              wird unwiderruflich geloescht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Loeschen..." : "Endgueltig loeschen"}
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
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-[15px] font-medium text-slate-900">{value}</p>
    </div>
  );
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "unbekannt";
  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
