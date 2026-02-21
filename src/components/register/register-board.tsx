"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ClipboardCopy, ExternalLink, Loader2, MoreVertical, RefreshCw, Trash2, Undo2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createProofPackDraftExport,
  createProofPackPdfBlob,
  createUseCasePassExport,
  createUseCasePassV11Export,
  getProofPackDraftFileName,
  getProofPackPdfFileName,
  getProofPackPdfState,
  getNextManualStatuses,
  getStatusGatedOutputState,
  getUseCasePassFileName,
  getUseCasePassV11FileName,

  registerFirstService,
  registerUseCaseStatusLabels,
  registerUseCaseStatusOrder,
  serializePrettyJson,
  validateVerifyLinkInput,
  createStaticToolRegistryService,
  buildVerifyPassAbsoluteUrl,
  type CaptureUsageContext,
  type RegisterFirstServiceErrorCode,
  type RegisterUseCaseStatus,
  type UseCaseCard,
} from "@/lib/register-first";
import { RegisterStatusBadge } from "./status-badge";
import { registerFirstFlags } from "@/lib/register-first/flags";
import { registerService } from "@/lib/register-first/register-service";

const toolRegistry = createStaticToolRegistryService();

const dataCategoryLabels: Record<string, string> = {
  NONE: "Keine besonderen Daten",
  INTERNAL: "Interne Daten",
  PERSONAL: "Personenbezogene Daten",
  SENSITIVE: "Sensible Daten",
};

interface RegisterBoardProps {
  projectId?: string;
  mode?: "dashboard" | "standalone";
  refreshKey?: number;
  onUseCasesLoaded?: (cards: UseCaseCard[]) => void;
}

type StatusFilter = RegisterUseCaseStatus | "ALL";
type SortField = "updatedAt" | "purpose" | "owner" | "status";
type ViewMode = "ALL" | "BY_OWNER" | "BY_ORG" | "BY_STATUS";
type ProofBooleanChoice = "YES" | "NO";

interface ProofMetaDraft {
  verifyUrl: string;
  scope: string;
  isReal: ProofBooleanChoice;
  isCurrent: ProofBooleanChoice;
}

const usageContextLabels: Record<CaptureUsageContext, string> = {
  INTERNAL_ONLY: "Nur intern",
  CUSTOMER_FACING: "Fuer Kund:innen",
  EMPLOYEE_FACING: "Fuer Mitarbeitende",
  EXTERNAL_PUBLIC: "Extern / oeffentlich",
};

const statusFilterOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: "ALL", label: "Alle Status" },
  ...registerUseCaseStatusOrder.map((status) => ({
    value: status,
    label: registerUseCaseStatusLabels[status],
  })),
];

function mapServiceErrorCode(error: unknown): RegisterFirstServiceErrorCode | null {
  if (error && typeof error === "object" && "code" in error) {
    const value = String((error as { code: unknown }).code);
    if (
      value === "UNAUTHENTICATED" ||
      value === "PROJECT_CONTEXT_MISSING" ||
      value === "USE_CASE_NOT_FOUND" ||
      value === "INVALID_STATUS_TRANSITION" ||
      value === "AUTOMATION_FORBIDDEN" ||
      value === "VALIDATION_FAILED" ||
      value === "PERSISTENCE_FAILED"
    ) {
      return value;
    }
  }
  return null;
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "unbekannt";
  }
  return date.toLocaleString("de-DE");
}

function createProofMetaDraft(card: UseCaseCard): ProofMetaDraft {
  return {
    verifyUrl: card.proof?.verifyUrl ?? "",
    scope: card.proof?.verification.scope ?? "",
    isReal: card.proof?.verification.isReal === false ? "NO" : "YES",
    isCurrent: card.proof?.verification.isCurrent === false ? "NO" : "YES",
  };
}

function isProofChoiceYes(value: ProofBooleanChoice): boolean {
  return value === "YES";
}

function buildProofValidationMessage(
  errors: ReturnType<typeof validateVerifyLinkInput>["errors"]
): string {
  const messages = [errors.verifyUrl, errors.scope].filter(
    (value): value is string => Boolean(value)
  );

  if (messages.length === 0) {
    return "Verify-Link Daten sind ungueltig.";
  }

  return messages.join(" ");
}

function hasUnsavedProofDraft(
  card: UseCaseCard,
  draft: ProofMetaDraft,
  normalized: { verifyUrl: string; scope: string }
): boolean {
  const currentUrl = card.proof?.verifyUrl ?? "";
  const currentScope = card.proof?.verification.scope ?? "";
  const currentIsReal = card.proof?.verification.isReal ?? true;
  const currentIsCurrent = card.proof?.verification.isCurrent ?? true;

  return (
    normalized.verifyUrl !== currentUrl ||
    normalized.scope !== currentScope ||
    isProofChoiceYes(draft.isReal) !== currentIsReal ||
    isProofChoiceYes(draft.isCurrent) !== currentIsCurrent
  );
}

async function copyTextToClipboard(value: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Clipboard copy failed.");
  }
}

export function RegisterBoard({ projectId, mode = "dashboard", refreshKey = 0, onUseCasesLoaded }: RegisterBoardProps) {
  const isStandalone = mode === "standalone";
  const router = useRouter();
  const { toast } = useToast();
  const [useCases, setUseCases] = useState<UseCaseCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [viewMode, setViewMode] = useState<ViewMode>("ALL");
  const [showDeleted, setShowDeleted] = useState(false);

  const [selectedNextStatusById, setSelectedNextStatusById] = useState<
    Record<string, RegisterUseCaseStatus | undefined>
  >({});
  const [updatingUseCaseId, setUpdatingUseCaseId] = useState<string | null>(null);
  const [confirmingStatusCard, setConfirmingStatusCard] = useState<UseCaseCard | null>(null);
  const [updateErrorById, setUpdateErrorById] = useState<Record<string, string | undefined>>(
    {}
  );
  const [proofDraftById, setProofDraftById] = useState<Record<string, ProofMetaDraft>>({});
  const [savingProofUseCaseId, setSavingProofUseCaseId] = useState<string | null>(null);
  const [proofErrorById, setProofErrorById] = useState<Record<string, string | undefined>>({});

  const loadUseCases = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const items = isStandalone
        ? await registerService.listUseCases(undefined, {
          status: statusFilter === "ALL" ? undefined : statusFilter,
          searchText: searchQuery,
          limit: 150,
          includeDeleted: showDeleted,
        })
        : await registerFirstService.listUseCases(projectId, {
          status: statusFilter === "ALL" ? undefined : statusFilter,
          searchText: searchQuery,
          limit: 150,
          includeDeleted: showDeleted,
        });
      setUseCases(items);
    } catch (loadError) {
      const code = mapServiceErrorCode(loadError);
      if (code === "PROJECT_CONTEXT_MISSING") {
        setError("Kein Projektkontext gefunden. Oeffne zuerst ein Projekt im Dashboard.");
      } else if (code === "UNAUTHENTICATED") {
        setError("Du bist nicht angemeldet. Bitte melde dich erneut an.");
      } else {
        setError("Register konnte nicht geladen werden. Bitte versuche es erneut.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [isStandalone, projectId, searchQuery, statusFilter, showDeleted]);

  useEffect(() => {
    void loadUseCases();
  }, [loadUseCases, refreshKey]);

  useEffect(() => {
    onUseCasesLoaded?.(useCases);
  }, [useCases, onUseCasesLoaded]);

  const handleApplyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setStatusFilter("ALL");
  };

  const sortedUseCases = useMemo(() => {
    const sorted = [...useCases];
    sorted.sort((a, b) => {
      switch (sortField) {
        case "purpose": return a.purpose.localeCompare(b.purpose);
        case "owner": return (a.responsibility.responsibleParty ?? "").localeCompare(b.responsibility.responsibleParty ?? "");
        case "status": return registerUseCaseStatusOrder.indexOf(a.status) - registerUseCaseStatusOrder.indexOf(b.status);
        default: return b.updatedAt.localeCompare(a.updatedAt);
      }
    });
    return sorted;
  }, [useCases, sortField]);

  const groupedUseCases = useMemo(() => {
    if (viewMode === "ALL") return null;
    const groups = new Map<string, UseCaseCard[]>();
    for (const uc of sortedUseCases) {
      let key: string;
      switch (viewMode) {
        case "BY_OWNER": key = uc.responsibility.responsibleParty || "Nicht zugewiesen"; break;
        case "BY_ORG": key = uc.organisation || "Keine Organisation"; break;
        case "BY_STATUS": key = registerUseCaseStatusLabels[uc.status]; break;
        default: key = "Alle";
      }
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(uc);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [sortedUseCases, viewMode]);

  const handleUpdateStatus = async (card: UseCaseCard) => {
    const nextStatus = selectedNextStatusById[card.useCaseId];
    if (!nextStatus) {
      return;
    }

    setUpdatingUseCaseId(card.useCaseId);
    setUpdateErrorById((prev) => ({ ...prev, [card.useCaseId]: undefined }));

    try {
      if (isStandalone) {
        await registerService.updateUseCaseStatusManual({
          useCaseId: card.useCaseId,
          nextStatus,
          actor: "HUMAN",
        });
      } else {
        await registerFirstService.updateUseCaseStatusManual({
          projectId,
          useCaseId: card.useCaseId,
          nextStatus,
          actor: "HUMAN",
        });
      }

      setSelectedNextStatusById((prev) => {
        const nextMap = { ...prev };
        delete nextMap[card.useCaseId];
        return nextMap;
      });

      await loadUseCases();
    } catch (updateError) {
      const code = mapServiceErrorCode(updateError);
      const message =
        code === "INVALID_STATUS_TRANSITION"
          ? "Dieser Statuswechsel ist nicht zulaessig."
          : code === "AUTOMATION_FORBIDDEN"
            ? "Governance-Entscheidungen sind nur manuell erlaubt."
            : "Status konnte nicht aktualisiert werden.";

      setUpdateErrorById((prev) => ({
        ...prev,
        [card.useCaseId]: message,
      }));
    } finally {
      setUpdatingUseCaseId(null);
    }
  };

  const handleSoftDelete = async (card: UseCaseCard) => {
    try {
      await registerService.softDeleteUseCase(isStandalone ? undefined : projectId, card.useCaseId);
      await loadUseCases();
      toast({ title: "Gelöscht", description: "Use Case wurde in den Papierkorb verschoben." });
    } catch {
      toast({ variant: "destructive", title: "Fehler", description: "Use Case konnte nicht gelöscht werden." });
    }
  };

  const handleRestore = async (card: UseCaseCard) => {
    try {
      await registerService.restoreUseCase(isStandalone ? undefined : projectId, card.useCaseId);
      await loadUseCases();
      toast({ title: "Wiederhergestellt", description: "Use Case ist wieder aktiv." });
    } catch {
      toast({ variant: "destructive", title: "Fehler", description: "Use Case konnte nicht wiederhergestellt werden." });
    }
  };

  const downloadBlob = (filename: string, blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadJson = (filename: string, content: string) => {
    downloadBlob(
      filename,
      new Blob([content], { type: "application/json;charset=utf-8" })
    );
  };

  const handleExportUseCasePass = (card: UseCaseCard) => {
    const exportPayload = createUseCasePassExport(card);
    downloadJson(
      getUseCasePassFileName(card.useCaseId),
      serializePrettyJson(exportPayload)
    );
  };

  const handleExportProofPackDraft = (card: UseCaseCard) => {
    const exportPayload = createProofPackDraftExport(card);
    downloadJson(
      getProofPackDraftFileName(card.useCaseId),
      serializePrettyJson(exportPayload)
    );
  };

  const handleExportProofPackPdf = (card: UseCaseCard) => {
    const pdfBlob = createProofPackPdfBlob(card);
    downloadBlob(getProofPackPdfFileName(card.useCaseId), pdfBlob);
  };

  const handleExportUseCasePassV11 = async (card: UseCaseCard) => {
    try {
      const resolvedTool = card.toolId
        ? await toolRegistry.getToolById(card.toolId)
        : null;

      const exportPayload = createUseCasePassV11Export(
        card,
        projectId ?? "unknown",
        resolvedTool
          ? {
            vendor: resolvedTool.vendor,
            productName: resolvedTool.productName,
            toolType: resolvedTool.toolType,
          }
          : {}
      );

      downloadJson(
        getUseCasePassV11FileName(card.globalUseCaseId ?? card.useCaseId),
        serializePrettyJson(exportPayload)
      );
    } catch {
      toast({
        variant: "destructive",
        title: "Export fehlgeschlagen",
        description: "v1.1 Use-Case Pass konnte nicht exportiert werden.",
      });
    }
  };

  const handleTogglePublicVisibility = async (card: UseCaseCard) => {
    try {
      if (isStandalone) {
        await registerService.setPublicVisibility({
          useCaseId: card.useCaseId,
          isPublicVisible: !(card.isPublicVisible ?? false),
        });
      } else {
        await registerFirstService.setPublicVisibility({
          projectId,
          useCaseId: card.useCaseId,
          isPublicVisible: !(card.isPublicVisible ?? false),
        });
      }
      await loadUseCases();
    } catch {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Sichtbarkeit konnte nicht geaendert werden.",
      });
    }
  };

  const handleProofDraftChange = (
    useCaseId: string,
    patch: Partial<ProofMetaDraft>,
    card: UseCaseCard
  ) => {
    setProofDraftById((prev) => ({
      ...prev,
      [useCaseId]: {
        ...(prev[useCaseId] ?? createProofMetaDraft(card)),
        ...patch,
      },
    }));
  };

  const handleSaveProofMeta = async (card: UseCaseCard) => {
    const draft = proofDraftById[card.useCaseId] ?? createProofMetaDraft(card);
    const validation = validateVerifyLinkInput({
      verifyUrl: draft.verifyUrl,
      scope: draft.scope,
    });

    if (!validation.isValid) {
      setProofErrorById((prev) => ({
        ...prev,
        [card.useCaseId]: buildProofValidationMessage(validation.errors),
      }));
      return;
    }

    setSavingProofUseCaseId(card.useCaseId);
    setProofErrorById((prev) => ({ ...prev, [card.useCaseId]: undefined }));

    try {
      if (isStandalone) {
        await registerService.updateProofMetaManual({
          useCaseId: card.useCaseId,
          verifyUrl: validation.normalized.verifyUrl,
          isReal: draft.isReal === "YES",
          isCurrent: draft.isCurrent === "YES",
          scope: validation.normalized.scope,
          actor: "HUMAN",
        });
      } else {
        await registerFirstService.updateProofMetaManual({
          projectId,
          useCaseId: card.useCaseId,
          verifyUrl: validation.normalized.verifyUrl,
          isReal: draft.isReal === "YES",
          isCurrent: draft.isCurrent === "YES",
          scope: validation.normalized.scope,
          actor: "HUMAN",
        });
      }

      await loadUseCases();
    } catch (saveError) {
      const code = mapServiceErrorCode(saveError);
      const message =
        code === "INVALID_STATUS_TRANSITION"
          ? "Verify-Link Daten koennen nur in PROOF_READY gepflegt werden."
          : code === "VALIDATION_FAILED"
            ? "Verify-Link Daten sind ungueltig. Pruefe URL und Scope."
            : "Verify-Link Daten konnten nicht gespeichert werden.";

      setProofErrorById((prev) => ({
        ...prev,
        [card.useCaseId]: message,
      }));
    } finally {
      setSavingProofUseCaseId(null);
    }
  };

  const handleCopyVerifyUrl = async (card: UseCaseCard) => {
    const draft = proofDraftById[card.useCaseId] ?? createProofMetaDraft(card);
    const verifyUrl = draft.verifyUrl.trim() || card.proof?.verifyUrl?.trim() || "";

    if (verifyUrl.length === 0) {
      setProofErrorById((prev) => ({
        ...prev,
        [card.useCaseId]: "Es gibt noch keine Verify URL zum Kopieren.",
      }));
      return;
    }

    try {
      await copyTextToClipboard(verifyUrl);
      setProofErrorById((prev) => ({ ...prev, [card.useCaseId]: undefined }));
      toast({
        title: "Verify-Link kopiert",
        description: "Die Verify URL wurde in die Zwischenablage kopiert.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Kopieren fehlgeschlagen",
        description: "Die Verify URL konnte nicht kopiert werden.",
      });
    }
  };

  const handlePreviewProofPackPdf = (card: UseCaseCard) => {
    if (card.status !== "PROOF_READY") {
      return;
    }

    if (!registerFirstFlags.proofGate) {
      toast({
        variant: "destructive",
        title: "Vorschau deaktiviert",
        description: "Proof Pack ist per Feature-Flag deaktiviert.",
      });
      return;
    }

    const draft = proofDraftById[card.useCaseId] ?? createProofMetaDraft(card);
    const validation = validateVerifyLinkInput({
      verifyUrl: draft.verifyUrl,
      scope: draft.scope,
    });

    const previewCard =
      validation.isValid
        ? {
          ...card,
          proof: {
            verifyUrl: validation.normalized.verifyUrl,
            generatedAt: card.proof?.generatedAt ?? new Date().toISOString(),
            verification: {
              isReal: draft.isReal === "YES",
              isCurrent: draft.isCurrent === "YES",
              scope: validation.normalized.scope,
            },
          },
        }
        : card;

    if (!previewCard.proof) {
      setProofErrorById((prev) => ({
        ...prev,
        [card.useCaseId]:
          "PDF-Vorschau braucht Verify-Link Daten. URL und Scope zuerst ausfuellen.",
      }));
      return;
    }

    try {
      const pdfBlob = createProofPackPdfBlob(previewCard);
      const url = URL.createObjectURL(pdfBlob);
      const previewWindow = window.open(url, "_blank", "noopener,noreferrer");

      if (!previewWindow) {
        downloadBlob(getProofPackPdfFileName(card.useCaseId), pdfBlob);
        toast({
          title: "Popup blockiert",
          description: "PDF wurde stattdessen als Download gestartet.",
        });
      }

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60_000);
    } catch {
      toast({
        variant: "destructive",
        title: "Vorschau fehlgeschlagen",
        description: "PDF-Vorschau konnte nicht erzeugt werden.",
      });
    }
  };


  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <form onSubmit={handleApplyFilters} className="flex flex-wrap items-center gap-2">
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Use Case suchen…"
          className="h-9 max-w-xs text-sm"
        />
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as StatusFilter)}
        >
          <SelectTrigger className="h-9 w-40 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusFilterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
          <SelectTrigger className="h-9 w-36 text-sm">
            <SelectValue placeholder="Sortierung" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updatedAt">Datum</SelectItem>
            <SelectItem value="purpose">Name</SelectItem>
            <SelectItem value="owner">Verantwortlich</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
        <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <SelectTrigger className="h-9 w-44 text-sm">
            <SelectValue placeholder="Ansicht" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Alle</SelectItem>
            <SelectItem value="BY_OWNER">Nach Verantwortlich</SelectItem>
            <SelectItem value="BY_ORG">Nach Organisation</SelectItem>
            <SelectItem value="BY_STATUS">Nach Status</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" size="sm" className="h-9">Filtern</Button>
        <Button type="button" variant="ghost" size="sm" className="h-9" onClick={handleResetFilters}>
          Zurücksetzen
        </Button>
        <Button
          type="button"
          variant={showDeleted ? "secondary" : "ghost"}
          size="sm"
          className="h-9"
          onClick={() => setShowDeleted(!showDeleted)}
        >
          {showDeleted ? "Gelöschte ausblenden" : "Gelöschte anzeigen"}
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {useCases.length} Einsatzf{useCases.length === 1 ? "all" : "älle"}
          </span>
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => void loadUseCases()}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center rounded-md border p-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : useCases.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Noch keine Einsatzfälle erfasst</CardTitle>
            <CardDescription>
              Erfasse den ersten Einsatzfall mit <kbd className="rounded border px-1 py-0.5 text-[10px] font-mono">⌘K</kbd> oder dem Button oben.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Group headers (when grouped view is active) */}
          {sortedUseCases.map((card, idx) => {
            // Determine group header
            let groupHeader: string | null = null;
            if (groupedUseCases) {
              let currentGroup: string;
              switch (viewMode) {
                case "BY_OWNER": currentGroup = card.responsibility.responsibleParty || "Nicht zugewiesen"; break;
                case "BY_ORG": currentGroup = card.organisation || "Keine Organisation"; break;
                case "BY_STATUS": currentGroup = registerUseCaseStatusLabels[card.status]; break;
                default: currentGroup = "";
              }
              const prev = idx > 0 ? sortedUseCases[idx - 1] : null;
              let prevGroup = "";
              if (prev) {
                switch (viewMode) {
                  case "BY_OWNER": prevGroup = prev.responsibility.responsibleParty || "Nicht zugewiesen"; break;
                  case "BY_ORG": prevGroup = prev.organisation || "Keine Organisation"; break;
                  case "BY_STATUS": prevGroup = registerUseCaseStatusLabels[prev.status]; break;
                }
              }
              if (!prev || currentGroup !== prevGroup) {
                const count = sortedUseCases.filter((uc) => {
                  switch (viewMode) {
                    case "BY_OWNER": return (uc.responsibility.responsibleParty || "Nicht zugewiesen") === currentGroup;
                    case "BY_ORG": return (uc.organisation || "Keine Organisation") === currentGroup;
                    case "BY_STATUS": return registerUseCaseStatusLabels[uc.status] === currentGroup;
                    default: return true;
                  }
                }).length;
                groupHeader = `${currentGroup} (${count})`;
              }
            }
            const nextStatuses = getNextManualStatuses(card.status);
            const outputState = getStatusGatedOutputState(
              card.status,
              registerFirstFlags
            );
            const proofPdfState = getProofPackPdfState(card, registerFirstFlags);
            const selectedNextStatus = selectedNextStatusById[card.useCaseId];
            const isUpdating = updatingUseCaseId === card.useCaseId;

            return (
              <div key={card.useCaseId}>
                {groupHeader && (
                  <h3 className="mb-2 mt-4 flex items-center gap-2 text-sm font-semibold first:mt-0">
                    {groupHeader}
                  </h3>
                )}
                <Card
                  className={`cursor-pointer overflow-hidden transition-shadow hover:shadow-md ${card.isDeleted ? "opacity-60 grayscale" : ""}`}
                  onClick={() => router.push(`/my-register/${card.useCaseId}`)}
                >
                  <div className="flex items-start justify-between gap-2 p-4 pb-2">
                    {/* Line 1: Purpose + Status + Visibility */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`truncate text-sm font-semibold ${card.isDeleted ? "line-through" : ""}`}>{card.purpose}</h3>
                        {card.isDeleted && (
                          <Badge variant="destructive" className="shrink-0 text-[10px]">
                            Gelöscht
                          </Badge>
                        )}
                        <RegisterStatusBadge status={card.status} />
                        <Badge
                          variant={card.isPublicVisible ? "default" : "secondary"}
                          className="shrink-0 text-[10px]"
                        >
                          {card.isPublicVisible ? "Öffentlich verifiziert" : "Privat"}
                        </Badge>
                      </div>

                      {/* Line 2: Badges */}
                      <div className="flex flex-wrap gap-1.5">
                        {card.toolId && (
                          <Badge variant="outline" className="text-[10px] font-normal">
                            {card.toolId === "other"
                              ? card.toolFreeText ?? "Anderes Tool"
                              : card.toolId}
                          </Badge>
                        )}
                        {card.dataCategory && card.dataCategory !== "NONE" && (
                          <Badge variant="outline" className="text-[10px] font-normal">
                            {dataCategoryLabels[card.dataCategory] ?? card.dataCategory}
                          </Badge>
                        )}
                        {card.usageContexts.map((ctx) => (
                          <Badge key={ctx} variant="outline" className="text-[10px] font-normal">
                            {usageContextLabels[ctx]}
                          </Badge>
                        ))}
                      </div>

                      {/* Line 3: Owner + Organisation */}
                      <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                        {card.responsibility.responsibleParty && (
                          <span>
                            Verantwortlich: <span className="font-medium text-foreground">{card.responsibility.responsibleParty}</span>
                          </span>
                        )}
                        {card.organisation && (
                          <span>{card.organisation}</span>
                        )}
                      </div>

                      {/* Line 4: Meta */}
                      <div className="flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
                        {card.globalUseCaseId && (
                          <span className="font-mono">{card.globalUseCaseId}</span>
                        )}
                        {card.reviews.length > 0 ? (
                          <span>
                            Statusentscheidung zuletzt am: {formatDate(card.reviews[card.reviews.length - 1].reviewedAt)}
                          </span>
                        ) : (
                          <span>Erfasst am: {formatDate(card.createdAt)}</span>
                        )}
                      </div>

                      {/* Audit mini-log: last review */}
                      {card.reviews.length > 0 && (() => {
                        const lastReview = card.reviews[card.reviews.length - 1];
                        return (
                          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
                            <span>Letzte Entscheidung:</span>
                            <span className="font-medium">{registerUseCaseStatusLabels[lastReview.nextStatus]}</span>
                            <span>→</span>
                            <span>{formatDate(lastReview.reviewedAt)}</span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Actions Dropdown - stop propagation to prevent card navigation */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 shrink-0 p-0" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem
                          onClick={() => handleExportUseCasePass(card)}
                          disabled={!outputState.cardJsonEnabled}
                        >
                          Use-Case Pass (JSON)
                        </DropdownMenuItem>
                        {card.cardVersion === "1.1" && (
                          <DropdownMenuItem
                            onClick={() => void handleExportUseCasePassV11(card)}
                            disabled={!outputState.cardJsonEnabled}
                          >
                            Use-Case Pass v1.1 (JSON)
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleExportProofPackDraft(card)}
                          disabled={!outputState.proofPackDraftEnabled}
                        >
                          Proof-Pack Entwurf (JSON)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleExportProofPackPdf(card)}
                          disabled={!proofPdfState.enabled}
                        >
                          Proof Pack (PDF)
                        </DropdownMenuItem>
                        {card.status === "PROOF_READY" && (
                          <DropdownMenuItem
                            onClick={() => handlePreviewProofPackPdf(card)}
                          >
                            PDF Vorschau
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => void handleTogglePublicVisibility(card)}
                        >
                          {card.isPublicVisible
                            ? "Auf privat setzen"
                            : "Öffentlich machen"}
                        </DropdownMenuItem>
                        {card.isDeleted ? (
                          <DropdownMenuItem onClick={() => void handleRestore(card)}>
                            <Undo2 className="mr-2 h-3.5 w-3.5" />
                            Wiederherstellen
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => void handleSoftDelete(card)} className="text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Löschen
                          </DropdownMenuItem>
                        )}
                        {card.publicHashId && card.isPublicVisible && (
                          <>
                            <DropdownMenuItem
                              onClick={() => {
                                const url = buildVerifyPassAbsoluteUrl(card.publicHashId!);
                                void copyTextToClipboard(url).then(() =>
                                  toast({ title: "Verify-Link kopiert", description: url })
                                );
                              }}
                            >
                              <ClipboardCopy className="mr-2 h-3.5 w-3.5" />
                              Verify-Link kopieren
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a
                                href={buildVerifyPassAbsoluteUrl(card.publicHashId)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                                Verify-Link öffnen
                              </a>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Status Setter - stop propagation to prevent card navigation */}
                  {nextStatuses.length > 0 && (
                    <div className="flex items-center gap-2 border-t bg-muted/30 px-4 py-2" onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={selectedNextStatus}
                        onValueChange={(value) =>
                          setSelectedNextStatusById((prev) => ({
                            ...prev,
                            [card.useCaseId]: value as RegisterUseCaseStatus,
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 max-w-[200px] text-xs">
                          <SelectValue placeholder="Status setzen" />
                        </SelectTrigger>
                        <SelectContent>
                          {nextStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {registerUseCaseStatusLabels[status]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>


                      <Button
                        type="button"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => {
                          if (!selectedNextStatus) return;
                          setConfirmingStatusCard(card);
                        }}
                        disabled={!selectedNextStatus || isUpdating}
                      >
                        {isUpdating && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                        Setzen
                      </Button>
                      {updateErrorById[card.useCaseId] && (
                        <p className="text-xs text-destructive">{updateErrorById[card.useCaseId]}</p>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Status change confirmation dialog */}
      <AlertDialog
        open={confirmingStatusCard !== null}
        onOpenChange={(open) => { if (!open) setConfirmingStatusCard(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Statusänderung bestätigen</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Statusänderung dokumentiert eine formale Entscheidung. Fortfahren?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmingStatusCard) {
                  void handleUpdateStatus(confirmingStatusCard);
                  setConfirmingStatusCard(null);
                }
              }}
            >
              Bestätigen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
