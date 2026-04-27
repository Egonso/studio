"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, ArrowDownIcon, ArrowUpIcon, ClipboardCopy, ExternalLink, Loader2, MoreVertical, RefreshCw, Search, Trash2, Undo2, X } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createProofPackDraftExport,
  createUseCasePassExport,
  createUseCasePassV11Export,
  getProofPackDraftFileName,
  getProofPackPdfState,
  getStatusGatedOutputState,
  getUseCasePassFileName,
  getUseCasePassV11FileName,
  serializePrettyJson,
} from "@/lib/register-first/output";
import {
  createStaticToolRegistryService,
  createAiToolsRegistryService,
} from "@/lib/register-first/tool-registry-service";
import { registerFirstService, type RegisterFirstServiceErrorCode } from "@/lib/register-first/service";
import {
  type RegisterUseCaseStatus,
  type UseCaseCard,
} from "@/lib/register-first/types";
import {
  getNextManualStatuses,
  registerUseCaseStatusOrder,
} from "@/lib/register-first/status-flow";
import { SUPPLIER_REQUEST_FILTER } from "@/lib/register-first/supplier-requests";
import { buildVerifyPassAbsoluteUrl } from "@/lib/register-first/entry-links";
import {
  getUseCaseSystemsSummary,
  getUseCaseWorkflowBadge,
} from "@/lib/register-first/systems";
import {
  getDisplayedRiskClassLabel,
  parseStoredAiActCategory,
} from "@/lib/register-first/risk-taxonomy";
import {
  matchesUseCaseSourceFilter,
  type UseCaseSourceFilter,
} from "@/lib/register-first/source";
import {
  createProofPackPdfBlob,
  getProofPackPdfFileName,
} from "@/lib/register-first/proof-pack";
import { validateVerifyLinkInput } from "@/lib/register-first/verify-link";
import { RegisterStatusBadge } from "./status-badge";
import { registerFirstFlags } from "@/lib/register-first/flags";
import { parseRegisterScopeFromWorkspaceValue } from "@/lib/register-first/register-scope";
import { registerService } from "@/lib/register-first/register-service";
import { buildScopedUseCaseDetailHref } from "@/lib/navigation/workspace-scope";
import { useWorkspaceScope } from "@/lib/navigation/use-workspace-scope";
import { useRouter } from "@/i18n/navigation";

const toolRegistry = createStaticToolRegistryService();
const aiToolsRegistry = createAiToolsRegistryService();



interface RegisterBoardProps {
  projectId?: string;
  mode?: "dashboard" | "standalone";
  registerId?: string;
  refreshKey?: number;
  onUseCasesLoaded?: (cards: UseCaseCard[]) => void;
  initialFilter?: string;
}

type StatusFilter = RegisterUseCaseStatus | "ALL";
type SortField = "updatedAt" | "createdAt" | "purpose" | "owner" | "status" | "tool";
type ViewMode = "ALL" | "BY_OWNER" | "BY_ORG" | "BY_STATUS";
type ProofBooleanChoice = "YES" | "NO";
type RiskFilter = "ALL" | "MINIMAL" | "LIMITED" | "HIGH" | "PROHIBITED" | "UNKNOWN";

interface ProofMetaDraft {
  verifyUrl: string;
  scope: string;
  isReal: ProofBooleanChoice;
  isCurrent: ProofBooleanChoice;
}



function getRegisterBoardCopy(locale: string) {
  if (locale === 'de') {
    return {
      unknown: 'Unbekannt',
      noSystem: 'Kein System',
      invalidVerifyLink: 'Verify-Link-Daten sind ungültig.',
      noContext: 'Kein Organisationskontext gefunden. Bitte zuerst eine Organisation im Dashboard öffnen.',
      notSignedIn: 'Sie sind nicht angemeldet. Bitte erneut anmelden.',
      registerLoadFailed: 'Register konnte nicht geladen werden. Bitte erneut versuchen.',
      notAssigned: 'Nicht zugewiesen',
      noOrganisation: 'Keine Organisation',
      statusTransitionForbidden: 'Dieser Statuswechsel ist nicht erlaubt.',
      manualOnly: 'Governance-Entscheidungen sind nur manuell erlaubt.',
      statusUpdateFailed: 'Status konnte nicht aktualisiert werden.',
      deleted: 'Gelöscht',
      deletedDesc: 'Der Einsatzfall wurde in den Papierkorb verschoben.',
      restored: 'Wiederhergestellt',
      restoredDesc: 'Der Einsatzfall ist wieder aktiv.',
      deleteFailed: 'Einsatzfall konnte nicht gelöscht werden.',
      restoreFailed: 'Einsatzfall konnte nicht wiederhergestellt werden.',
      exportFailed: 'Export fehlgeschlagen',
      exportFailedDesc: 'Der Use-Case Pass v1.1 konnte nicht exportiert werden.',
      visibilityFailed: 'Sichtbarkeit konnte nicht geändert werden.',
      proofStatusOnly:
        'Verify-Link-Daten können nur im Status Proof-ready gepflegt werden.',
      verifyLinkInvalid: 'Verify-Link-Daten sind ungültig. Bitte URL und Scope prüfen.',
      verifyLinkSaveFailed: 'Verify-Link-Daten konnten nicht gespeichert werden.',
      noVerifyUrl: 'Es gibt noch keine Verify-URL zum Kopieren.',
      verifyLinkCopied: 'Verify-Link kopiert',
      verifyLinkCopiedDesc: 'Die Verify-URL wurde in die Zwischenablage kopiert.',
      copyFailed: 'Kopieren fehlgeschlagen',
      copyFailedDesc: 'Die Verify-URL konnte nicht kopiert werden.',
      previewDisabled: 'Vorschau deaktiviert',
      previewDisabledDesc: 'Die Vorschau ist aktuell nicht verfügbar.',
      popupBlocked: 'Popup blockiert',
      popupBlockedDesc: 'Das PDF wurde stattdessen heruntergeladen.',
    previewFailed: 'Vorschau fehlgeschlagen',
    previewFailedDesc: 'Die PDF-Vorschau konnte nicht erzeugt werden.',
    previewNeedsVerify: 'Für die PDF-Vorschau müssen zuerst Verify-URL und Scope gepflegt werden.',
      changeStatus: 'Status ändern',
      newStatus: 'Neuer Status',
      useCasePass: 'Use-Case Pass (JSON)',
      useCasePassV11: 'Use-Case Pass v1.1 (JSON)',
      proofPackDraft: 'Proof-Pack Entwurf (JSON)',
      proofPackPdf: 'Proof Pack (PDF)',
      pdfPreview: 'PDF Vorschau',
      makePrivate: 'Auf privat setzen',
      makePublic: 'Öffentlich machen',
      restore: 'Wiederherstellen',
      copyVerifyLink: 'Verify-Link kopieren',
      openVerifyLink: 'Verify-Link öffnen',
      searchPlaceholder: 'Einsatzfall suchen…',
      statusPlaceholder: 'Status',
      sortPlaceholder: 'Sortierung',
      viewPlaceholder: 'Ansicht',
      allStatuses: 'Alle Status',
      allRiskClasses: 'Alle Risikoklassen',
      minimalRisk: 'Minimales Risiko',
      limitedRisk: 'Begrenztes Risiko',
      highRisk: 'Hochrisiko',
      prohibitedRisk: 'Verboten',
      activity: 'Aktivität',
      actions: 'Aktionen',
      ownerRole: 'Owner-Rolle',
      systems: 'Systeme',
      applyFilters: 'Filter anwenden',
      ascending: 'Aufsteigend',
      descending: 'Absteigend',
      viewAll: 'Alle',
      viewByOwner: 'Nach Owner-Rolle',
      viewByOrganisation: 'Nach Organisation',
      viewByStatus: 'Nach Status',
      hideDeleted: 'Gelöschte ausblenden',
      showDeleted: 'Gelöschte anzeigen',
      noUseCasesTitle: 'Noch keine Einsatzfälle dokumentiert',
      noUseCasesDesc: 'Dokumentieren Sie oben den ersten Einsatzfall im Register.',
      noFilteredEntriesTitle: 'Keine Einträge für den aktuellen Filter',
      noFilteredEntriesDesc:
        'Passen Sie Suche, Status, Risikoklasse oder Ansicht an, um mehr Registereinträge zu sehen.',
      resultCount: (count: number) =>
        `${count} Einsatzfall${count === 1 ? '' : 'fälle'}`,
      missingReviewHistory: 'Fehlende Review-Historie',
      highRiskGap: 'Hochrisiko-Haftungslücke',
      transparencyRisk: 'Transparenzrisiko',
      sortUpdatedAt: 'Zuletzt geändert',
      sortCreatedAt: 'Erstellt am',
      sortName: 'Name',
      sortOwner: 'Owner-Rolle',
      sortStatus: 'Status',
      sortSystems: 'Systeme',
      confirmStatusTitle: 'Statusänderung bestätigen',
      confirmStatusDesc:
        'Diese Statusänderung dokumentiert eine formale Entscheidung. Fortfahren?',
    };
  }

  return {
    unknown: 'Unknown',
    noSystem: 'No system',
    invalidVerifyLink: 'Verify link data is invalid.',
    noContext:
      'No organisation context found. Please open an organisation in the dashboard first.',
    notSignedIn: 'You are not signed in. Please sign in again.',
    registerLoadFailed: 'Register could not be loaded. Please try again.',
    notAssigned: 'Not assigned',
    noOrganisation: 'No organisation',
    statusTransitionForbidden: 'This status transition is not permitted.',
    manualOnly: 'Governance decisions are only permitted manually.',
    statusUpdateFailed: 'Status could not be updated.',
    deleted: 'Deleted',
    deletedDesc: 'The use case has been moved to the recycle bin.',
    restored: 'Restored',
    restoredDesc: 'The use case is active again.',
    deleteFailed: 'Use case could not be deleted.',
    restoreFailed: 'Use case could not be restored.',
    exportFailed: 'Export failed',
    exportFailedDesc: 'The v1.1 use case pass could not be exported.',
    visibilityFailed: 'Visibility could not be changed.',
    proofStatusOnly: 'Verify link data can only be maintained in Proof-ready status.',
    verifyLinkInvalid: 'Verify link data is invalid. Please check URL and scope.',
    verifyLinkSaveFailed: 'Verify link data could not be saved.',
    noVerifyUrl: 'There is no verify URL to copy yet.',
    verifyLinkCopied: 'Verify link copied',
    verifyLinkCopiedDesc: 'The verify URL has been copied to the clipboard.',
    copyFailed: 'Copy failed',
    copyFailedDesc: 'The verify URL could not be copied.',
    previewDisabled: 'Preview disabled',
    previewDisabledDesc: 'The preview is currently not available.',
    popupBlocked: 'Popup blocked',
    popupBlockedDesc: 'The PDF was downloaded instead.',
    previewFailed: 'Preview failed',
    previewFailedDesc: 'The PDF preview could not be generated.',
    previewNeedsVerify: 'PDF preview requires verify link data first. Please fill in URL and scope.',
    changeStatus: 'Change status',
    newStatus: 'New status',
    useCasePass: 'Use case pass (JSON)',
    useCasePassV11: 'Use case pass v1.1 (JSON)',
    proofPackDraft: 'Proof pack draft (JSON)',
    proofPackPdf: 'Proof pack (PDF)',
    pdfPreview: 'PDF preview',
    makePrivate: 'Make private',
    makePublic: 'Make public',
    restore: 'Restore',
    copyVerifyLink: 'Copy verify link',
    openVerifyLink: 'Open verify link',
    searchPlaceholder: 'Search use case…',
    statusPlaceholder: 'Status',
    sortPlaceholder: 'Sort',
    viewPlaceholder: 'View',
    allStatuses: 'All statuses',
    allRiskClasses: 'All risk classes',
    minimalRisk: 'Minimal risk',
    limitedRisk: 'Limited risk',
    highRisk: 'High-risk',
    prohibitedRisk: 'Prohibited',
    activity: 'Activity',
    actions: 'Actions',
    ownerRole: 'Owner role',
    systems: 'Systems',
    applyFilters: 'Apply filters',
    ascending: 'Ascending',
    descending: 'Descending',
    viewAll: 'All',
    viewByOwner: 'By owner role',
    viewByOrganisation: 'By organisation',
    viewByStatus: 'By status',
    hideDeleted: 'Hide deleted',
    showDeleted: 'Show deleted',
    noUseCasesTitle: 'No use cases documented yet',
    noUseCasesDesc: 'Document the first use case using the register action above.',
    noFilteredEntriesTitle: 'No entries for the current filter',
    noFilteredEntriesDesc:
      'Adjust search, status, risk class or view to display more register entries.',
    resultCount: (count: number) => `${count} use case${count === 1 ? '' : 's'}`,
    missingReviewHistory: 'Missing review history',
    highRiskGap: 'High-risk liability gap',
    transparencyRisk: 'Transparency risk',
    sortUpdatedAt: 'Recently updated',
    sortCreatedAt: 'Created on',
    sortName: 'Name',
    sortOwner: 'Owner role',
    sortStatus: 'Status',
    sortSystems: 'Systems',
    confirmStatusTitle: 'Confirm status change',
    confirmStatusDesc:
      'This status change records a formal decision. Continue?',
  };
}

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

function formatDate(isoDate: string, locale: string, unknownLabel: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return unknownLabel;
  }
  return date.toLocaleString(locale === 'de' ? 'de-DE' : 'en-GB');
}

function getCardToolDisplayName(card: UseCaseCard, emptyLabel: string): string {
  return getUseCaseSystemsSummary(card, {
    resolveToolName: (toolId) =>
      aiToolsRegistry.getById(toolId)?.productName ?? null,
    emptyLabel,
  });
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
  errors: ReturnType<typeof validateVerifyLinkInput>["errors"],
  fallbackMessage: string,
): string {
  const messages = [errors.verifyUrl, errors.scope].filter(
    (value): value is string => Boolean(value)
  );

  if (messages.length === 0) {
    return fallbackMessage;
  }

  return messages.join(" ");
}

function _hasUnsavedProofDraft(
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

export function RegisterBoard({ projectId, mode = "dashboard", registerId, refreshKey = 0, onUseCasesLoaded, initialFilter }: RegisterBoardProps) {
  const locale = useLocale();
  const t = useTranslations();
  const copy = getRegisterBoardCopy(locale);
  const isStandalone = mode === "standalone";
  const isMobile = useIsMobile();
  const router = useRouter();
  const workspaceScope = useWorkspaceScope();
  const scopeContext = useMemo(
    () => parseRegisterScopeFromWorkspaceValue(workspaceScope),
    [workspaceScope],
  );
  const { toast } = useToast();
  const initialSourceFilter: UseCaseSourceFilter =
    initialFilter === SUPPLIER_REQUEST_FILTER ? "LIEFERANT" : "ALL";
  const initialCustomFilter =
    initialFilter && initialFilter !== SUPPLIER_REQUEST_FILTER
      ? initialFilter
      : null;
  const [useCases, setUseCases] = useState<UseCaseCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeCustomFilter, setActiveCustomFilter] = useState<string | null>(initialCustomFilter);
  const [sourceFilter, setSourceFilter] =
    useState<UseCaseSourceFilter>(initialSourceFilter);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("ALL");
  const [showDeleted, setShowDeleted] = useState(false);
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("ALL");

  const [selectedNextStatusById, setSelectedNextStatusById] = useState<
    Record<string, RegisterUseCaseStatus | undefined>
  >({});
  const [_updatingUseCaseId, setUpdatingUseCaseId] = useState<string | null>(null);
  const [confirmingStatusCard, setConfirmingStatusCard] = useState<UseCaseCard | null>(null);
  const [_updateErrorById, setUpdateErrorById] = useState<Record<string, string | undefined>>(
    {}
  );
  const [proofDraftById, setProofDraftById] = useState<Record<string, ProofMetaDraft>>({});
  const [_savingProofUseCaseId, setSavingProofUseCaseId] = useState<string | null>(null);
  const [_proofErrorById, setProofErrorById] = useState<Record<string, string | undefined>>({});
  const statusLabel = useCallback(
    (status: RegisterUseCaseStatus) => t(`register.status.${status}`),
    [t],
  );
  const statusFilterOptions = useMemo(
    () => [
      { value: "ALL" as const, label: copy.allStatuses },
      ...registerUseCaseStatusOrder.map((status) => ({
        value: status,
        label: statusLabel(status),
      })),
    ],
    [copy.allStatuses, statusLabel],
  );
  const riskClassLabel = useCallback(
    (card: UseCaseCard) =>
      getDisplayedRiskClassLabel({
        aiActCategory: card.governanceAssessment?.core?.aiActCategory,
        toolRiskLevel: card.toolId
          ? aiToolsRegistry.getById(card.toolId)?.riskLevel ?? null
          : null,
        locale,
      }),
    [locale],
  );

  const loadUseCases = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let items = isStandalone
        ? await registerService.listUseCases(registerId, {
          status: statusFilter === "ALL" ? undefined : statusFilter,
          searchText: searchQuery,
          limit: 150,
          includeDeleted: showDeleted,
        }, scopeContext)
        : await registerFirstService.listUseCases(projectId, {
          status: statusFilter === "ALL" ? undefined : statusFilter,
          searchText: searchQuery,
          limit: 150,
          includeDeleted: showDeleted,
        });

      if (riskFilter !== "ALL") {
        items = items.filter((uc) => {
          const category = parseStoredAiActCategory(
            uc.governanceAssessment?.core?.aiActCategory,
          );

          switch (riskFilter) {
            case "MINIMAL":
              return category === "MINIMAL";
            case "LIMITED":
              return category === "LIMITED";
            case "HIGH":
              return category === "HIGH";
            case "PROHIBITED":
              return category === "PROHIBITED";
            case "UNKNOWN":
              return category === "UNASSESSED";
            default:
              return true;
          }
        });
      }

      // Apply Custom initialFilters (Dashboard Lenses)
      if (activeCustomFilter) {
        items = items.filter((uc) => {
          const core = uc.governanceAssessment?.core;
          const risk = (uc as any).riskScore || 0;
          const val = (uc as any).valueScore || 0;

          const toolEntry = uc.toolId ? aiToolsRegistry.getById(uc.toolId) : null;
          const isHighRisk = toolEntry?.riskLevel === "high" || toolEntry?.riskLevel === "unacceptable" || core?.aiActCategory === "Hochrisiko" || core?.aiActCategory === "Verboten";
          const isExternal = uc.usageContexts.includes("CUSTOMER_FACING") || uc.usageContexts.includes("EXTERNAL_PUBLIC") || uc.usageContexts.includes("CUSTOMERS") || uc.usageContexts.includes("PUBLIC");

          const hasHistory = false;
          const hasReminders = false;
          const isPruefhistorie = hasHistory && hasReminders;
          const hasTrustPortal = false;
          const isExternBelegbar = false && hasTrustPortal;

          switch (activeCustomFilter) {
            case 'missing_history':
              return !isPruefhistorie;
            case 'high_risk_missing_history':
              return isHighRisk && !isPruefhistorie;
            case 'external_missing_dossier':
              return isExternal && !isExternBelegbar;

            // Legacy filters
            case 'missing_ai_act_category':
              return !core || !core.aiActCategory;
            case 'critical_ai_act_gaps':
              return core?.aiActCategory === 'Hochrisiko' && !core.oversightDefined;
            case 'iso_micro_gaps':
            case 'missing_review_cycle':
              return !core?.reviewCycleDefined || !uc.responsibility?.responsibleParty;
            case 'high_value_high_risk':
              return val > 60 && risk > 60;
            case 'low_risk_high_value':
              return val > 60 && risk < 40;
            default:
              return true;
          }
        });
      }

      setUseCases(items);
    } catch (loadError) {
      const code = mapServiceErrorCode(loadError);
      if (code === "PROJECT_CONTEXT_MISSING") {
        setError(copy.noContext);
      } else if (code === "UNAUTHENTICATED") {
        setError(copy.notSignedIn);
      } else {
        setError(copy.registerLoadFailed);
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeCustomFilter, copy.noContext, copy.notSignedIn, copy.registerLoadFailed, isStandalone, projectId, registerId, riskFilter, scopeContext, searchQuery, showDeleted, statusFilter]);

  useEffect(() => {
    void loadUseCases();
  }, [loadUseCases, refreshKey]);

  useEffect(() => {
    onUseCasesLoaded?.(useCases);
  }, [useCases, onUseCasesLoaded]);

  useEffect(() => {
    if (initialFilter === SUPPLIER_REQUEST_FILTER) {
      setSourceFilter("LIEFERANT");
      setActiveCustomFilter(null);
      return;
    }

    setSourceFilter("ALL");
    setActiveCustomFilter(initialFilter || null);
  }, [initialFilter]);

  const handleApplyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setStatusFilter("ALL");
    setRiskFilter("ALL");
    setActiveCustomFilter(null);
    setSourceFilter("ALL");
  };

  const visibleUseCases = useMemo(() => {
    return useCases.filter((card) => matchesUseCaseSourceFilter(card, sourceFilter));
  }, [sourceFilter, useCases]);

  const sortedUseCases = useMemo(() => {
    const sorted = [...visibleUseCases];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "purpose": cmp = a.purpose.localeCompare(b.purpose); break;
        case "owner": cmp = (a.responsibility.responsibleParty ?? "").localeCompare(b.responsibility.responsibleParty ?? ""); break;
        case "status": cmp = registerUseCaseStatusOrder.indexOf(a.status) - registerUseCaseStatusOrder.indexOf(b.status); break;
        case "tool": cmp = getCardToolDisplayName(a, copy.noSystem).localeCompare(getCardToolDisplayName(b, copy.noSystem)); break;
        case "createdAt": cmp = a.createdAt.localeCompare(b.createdAt); break;
        case "updatedAt":
        default: cmp = a.updatedAt.localeCompare(b.updatedAt); break;
      }
      return sortDir === "asc" ? cmp : -cmp; // flip if desc
    });
    return sorted;
  }, [copy.noSystem, sortDir, sortField, visibleUseCases]);

  const groupedUseCases = useMemo(() => {
    if (viewMode === "ALL") return null;
    const groups = new Map<string, UseCaseCard[]>();
    for (const uc of sortedUseCases) {
      let key: string;
      switch (viewMode) {
        case "BY_OWNER": key = uc.responsibility.responsibleParty || copy.notAssigned; break;
        case "BY_ORG": key = uc.organisation || copy.noOrganisation; break;
        case "BY_STATUS": key = statusLabel(uc.status); break;
        default: key = copy.viewAll;
      }
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(uc);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [copy.noOrganisation, copy.notAssigned, copy.viewAll, sortedUseCases, statusLabel, viewMode]);

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
          registerId,
          scopeContext,
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
          ? copy.statusTransitionForbidden
          : code === "AUTOMATION_FORBIDDEN"
            ? copy.manualOnly
            : copy.statusUpdateFailed;

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
      await registerService.softDeleteUseCase(
        isStandalone ? registerId : projectId,
        card.useCaseId,
        scopeContext,
      );
      await loadUseCases();
      toast({ title: copy.deleted, description: copy.deletedDesc });
    } catch {
      toast({ variant: "destructive", title: t('common.error'), description: copy.deleteFailed });
    }
  };

  const handleRestore = async (card: UseCaseCard) => {
    try {
      await registerService.restoreUseCase(
        isStandalone ? registerId : projectId,
        card.useCaseId,
        scopeContext,
      );
      await loadUseCases();
      toast({ title: copy.restored, description: copy.restoredDesc });
    } catch {
      toast({ variant: "destructive", title: t('common.error'), description: copy.restoreFailed });
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
        title: copy.exportFailed,
        description: copy.exportFailedDesc,
      });
    }
  };

  const handleTogglePublicVisibility = async (card: UseCaseCard) => {
    try {
      if (isStandalone) {
        await registerService.setPublicVisibility({
          registerId,
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
        title: t('common.error'),
        description: copy.visibilityFailed,
      });
    }
  };

  const _handleProofDraftChange = (
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

  const _handleSaveProofMeta = async (card: UseCaseCard) => {
    const draft = proofDraftById[card.useCaseId] ?? createProofMetaDraft(card);
    const validation = validateVerifyLinkInput({
      verifyUrl: draft.verifyUrl,
      scope: draft.scope,
    });

    if (!validation.isValid) {
      setProofErrorById((prev) => ({
        ...prev,
        [card.useCaseId]: buildProofValidationMessage(validation.errors, copy.invalidVerifyLink),
      }));
      return;
    }

    setSavingProofUseCaseId(card.useCaseId);
    setProofErrorById((prev) => ({ ...prev, [card.useCaseId]: undefined }));

    try {
      if (isStandalone) {
        await registerService.updateProofMetaManual({
          registerId,
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
          ? copy.proofStatusOnly
          : code === "VALIDATION_FAILED"
            ? copy.verifyLinkInvalid
            : copy.verifyLinkSaveFailed;

      setProofErrorById((prev) => ({
        ...prev,
        [card.useCaseId]: message,
      }));
    } finally {
      setSavingProofUseCaseId(null);
    }
  };

  const _handleCopyVerifyUrl = async (card: UseCaseCard) => {
    const draft = proofDraftById[card.useCaseId] ?? createProofMetaDraft(card);
    const verifyUrl = draft.verifyUrl.trim() || card.proof?.verifyUrl?.trim() || "";

    if (verifyUrl.length === 0) {
      setProofErrorById((prev) => ({
        ...prev,
        [card.useCaseId]: copy.noVerifyUrl,
      }));
      return;
    }

    try {
      await copyTextToClipboard(verifyUrl);
      setProofErrorById((prev) => ({ ...prev, [card.useCaseId]: undefined }));
      toast({
        title: copy.verifyLinkCopied,
        description: copy.verifyLinkCopiedDesc,
      });
    } catch {
      toast({
        variant: "destructive",
        title: copy.copyFailed,
        description: copy.copyFailedDesc,
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
        title: copy.previewDisabled,
        description: copy.previewDisabledDesc,
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
        [card.useCaseId]: copy.previewNeedsVerify,
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
          title: copy.popupBlocked,
          description: copy.popupBlockedDesc,
        });
      }

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60_000);
    } catch {
      toast({
        variant: "destructive",
        title: copy.previewFailed,
        description: copy.previewFailedDesc,
      });
    }
  };

  const resultCountLabel = [
    copy.resultCount(sortedUseCases.length),
  ]
    .filter(Boolean)
    .join(" · ");

  const renderActionsMenu = (
    card: UseCaseCard,
    nextStatuses: RegisterUseCaseStatus[],
    outputState: ReturnType<typeof getStatusGatedOutputState>,
    proofPdfState: ReturnType<typeof getProofPackPdfState>,
  ) => (
    <DropdownMenuContent align="end" className="w-56">
      {nextStatuses.length > 0 && (
        <div className="mb-1 border-b p-2">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Change status</p>
          <Select
            onValueChange={(value) => {
              setSelectedNextStatusById((prev) => ({
                ...prev,
                [card.useCaseId]: value as RegisterUseCaseStatus,
              }));
              setConfirmingStatusCard(card);
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder={copy.newStatus} />
            </SelectTrigger>
            <SelectContent>
              {nextStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {statusLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <DropdownMenuItem
        onClick={() => handleExportUseCasePass(card)}
        disabled={!outputState.cardJsonEnabled}
      >
        {copy.useCasePass}
      </DropdownMenuItem>
      {card.cardVersion === "1.1" && (
        <DropdownMenuItem
          onClick={() => void handleExportUseCasePassV11(card)}
          disabled={!outputState.cardJsonEnabled}
        >
          {copy.useCasePassV11}
        </DropdownMenuItem>
      )}
      <DropdownMenuItem
        onClick={() => handleExportProofPackDraft(card)}
        disabled={!outputState.proofPackDraftEnabled}
      >
        {copy.proofPackDraft}
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => handleExportProofPackPdf(card)}
        disabled={!proofPdfState.enabled}
      >
        {copy.proofPackPdf}
      </DropdownMenuItem>
      {card.status === "PROOF_READY" && (
        <DropdownMenuItem onClick={() => handlePreviewProofPackPdf(card)}>
          {copy.pdfPreview}
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => void handleTogglePublicVisibility(card)}>
        {card.isPublicVisible ? copy.makePrivate : copy.makePublic}
      </DropdownMenuItem>
      {card.isDeleted ? (
        <DropdownMenuItem onClick={() => void handleRestore(card)}>
          <Undo2 className="mr-2 h-3.5 w-3.5" />
          {copy.restore}
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem
          onClick={() => void handleSoftDelete(card)}
          className="text-destructive focus:bg-destructive/10"
        >
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          {t('common.delete')}
        </DropdownMenuItem>
      )}
      {card.publicHashId && card.isPublicVisible && (
        <>
          <DropdownMenuItem
            onClick={() => {
              const url = buildVerifyPassAbsoluteUrl(card.publicHashId!);
              void copyTextToClipboard(url).then(() =>
                toast({ title: copy.verifyLinkCopied, description: url })
              );
            }}
          >
            <ClipboardCopy className="mr-2 h-3.5 w-3.5" />
            {copy.copyVerifyLink}
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={buildVerifyPassAbsoluteUrl(card.publicHashId)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              {copy.openVerifyLink}
            </a>
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  );

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <form
        onSubmit={handleApplyFilters}
        className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
      >
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder={copy.searchPlaceholder}
          className="h-9 w-full text-sm sm:max-w-xs"
        />
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as StatusFilter)}
        >
          <SelectTrigger className="h-9 w-full text-sm sm:w-40">
            <SelectValue placeholder={copy.statusPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {statusFilterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={riskFilter}
          onValueChange={(value) => setRiskFilter(value as RiskFilter)}
        >
          <SelectTrigger className="h-9 w-full text-sm sm:w-40">
            <SelectValue placeholder={t('register.riskClass.label')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{copy.allRiskClasses}</SelectItem>
            <SelectItem value="MINIMAL">{copy.minimalRisk}</SelectItem>
            <SelectItem value="LIMITED">{copy.limitedRisk}</SelectItem>
            <SelectItem value="HIGH">{copy.highRisk}</SelectItem>
            <SelectItem value="PROHIBITED">{copy.prohibitedRisk}</SelectItem>
            <SelectItem value="UNKNOWN">{copy.unknown}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
            <SelectTrigger className="h-9 w-full text-sm sm:w-36">
              <SelectValue placeholder={copy.sortPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt">{copy.sortUpdatedAt}</SelectItem>
              <SelectItem value="createdAt">{copy.sortCreatedAt}</SelectItem>
              <SelectItem value="purpose">{copy.sortName}</SelectItem>
              <SelectItem value="owner">{copy.sortOwner}</SelectItem>
              <SelectItem value="status">{copy.sortStatus}</SelectItem>
              <SelectItem value="tool">{copy.sortSystems}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => setSortDir(prev => prev === "asc" ? "desc" : "asc")}
            title={sortDir === "asc" ? copy.ascending : copy.descending}
          >
            {sortDir === "asc" ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
          </Button>
        </div>
        <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <SelectTrigger className="h-9 w-full text-sm sm:w-44">
            <SelectValue placeholder={copy.viewPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{copy.viewAll}</SelectItem>
            <SelectItem value="BY_OWNER">{copy.viewByOwner}</SelectItem>
            <SelectItem value="BY_ORG">{copy.viewByOrganisation}</SelectItem>
            <SelectItem value="BY_STATUS">{copy.viewByStatus}</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" variant="ghost" size="sm" className="h-9 w-9 p-0" title={copy.applyFilters}><Search className="h-3.5 w-3.5" /></Button>
        <button type="button" className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline px-1" onClick={handleResetFilters}>
          {t('common.reset')}
        </button>
        <button
          type="button"
          className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${showDeleted ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => setShowDeleted(!showDeleted)}
        >
          <span className={`inline-block h-2 w-2 rounded-full transition-colors ${showDeleted ? "bg-foreground" : "border border-muted-foreground"}`} />
          {showDeleted ? copy.hideDeleted : copy.showDeleted}
        </button>
        {activeCustomFilter && (
          <Badge variant="secondary" className="h-9 px-3 text-sm flex items-center gap-1 cursor-pointer" onClick={() => setActiveCustomFilter(null)}>
            Filter: {activeCustomFilter === 'missing_history' ? copy.missingReviewHistory : activeCustomFilter === 'high_risk_missing_history' ? copy.highRiskGap : activeCustomFilter === 'external_missing_dossier' ? copy.transparencyRisk : activeCustomFilter.replace(/_/g, ' ')}
            <X className="h-3 w-3 ml-1" />
          </Badge>
        )}
        <div className="flex w-full items-center justify-between gap-2 sm:ml-auto sm:w-auto">
          <span className="text-xs text-muted-foreground">
            {resultCountLabel}
          </span>
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => void loadUseCases()}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('common.error')}</AlertTitle>
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
            <CardTitle>{copy.noUseCasesTitle}</CardTitle>
            <CardDescription>{copy.noUseCasesDesc}</CardDescription>
          </CardHeader>
        </Card>
      ) : sortedUseCases.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{copy.noFilteredEntriesTitle}</CardTitle>
            <CardDescription>{copy.noFilteredEntriesDesc}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="rounded-md border bg-card">
          {isMobile ? (
            <div className="space-y-3 p-3">
              {sortedUseCases.map((card, idx) => {
                let showGroupHeader = false;
                let groupHeader: string | null = null;
                if (groupedUseCases) {
                  let currentGroup: string;
                  switch (viewMode) {
                    case "BY_OWNER":
                      currentGroup = card.responsibility.responsibleParty || copy.notAssigned;
                      break;
                    case "BY_ORG":
                      currentGroup = card.organisation || copy.noOrganisation;
                      break;
                    case "BY_STATUS":
                      currentGroup = statusLabel(card.status);
                      break;
                    default:
                      currentGroup = "";
                  }
                  const prev = idx > 0 ? sortedUseCases[idx - 1] : null;
                  let prevGroup = "";
                  if (prev) {
                    switch (viewMode) {
                      case "BY_OWNER":
                        prevGroup = prev.responsibility.responsibleParty || copy.notAssigned;
                        break;
                      case "BY_ORG":
                        prevGroup = prev.organisation || copy.noOrganisation;
                        break;
                      case "BY_STATUS":
                        prevGroup = statusLabel(prev.status);
                        break;
                    }
                  }
                  if (!prev || currentGroup !== prevGroup) {
                    const count = sortedUseCases.filter((uc) => {
                      switch (viewMode) {
                        case "BY_OWNER":
                          return (uc.responsibility.responsibleParty || copy.notAssigned) === currentGroup;
                        case "BY_ORG":
                          return (uc.organisation || copy.noOrganisation) === currentGroup;
                        case "BY_STATUS":
                          return statusLabel(uc.status) === currentGroup;
                        default:
                          return true;
                      }
                    }).length;
                    groupHeader = `${currentGroup} (${count})`;
                    showGroupHeader = true;
                  }
                }

                const nextStatuses = getNextManualStatuses(card.status);
                const toolDisplayName = getCardToolDisplayName(card, copy.noSystem);
                const workflowBadge = getUseCaseWorkflowBadge(card, {
                  locale,
                  resolveToolName: (toolId) =>
                    aiToolsRegistry.getById(toolId)?.productName ?? null,
                });
                const ownerRole =
                  card.responsibility.responsibleParty || copy.notAssigned;
                const outputState = getStatusGatedOutputState(
                  card.status,
                  registerFirstFlags
                );
                const proofPdfState = getProofPackPdfState(card, registerFirstFlags);

                return (
                  <React.Fragment key={card.useCaseId}>
                    {showGroupHeader && groupHeader ? (
                      <div className="px-1 pt-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        {groupHeader}
                      </div>
                    ) : null}
                    <div
                      onClick={() =>
                        router.push(
                          buildScopedUseCaseDetailHref(
                            card.useCaseId,
                            workspaceScope,
                          ),
                        )
                      }
                      className={`space-y-4 rounded-xl border border-slate-200 bg-white p-4 ${card.isDeleted ? "opacity-60 grayscale" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-sm font-medium text-slate-950 ${card.isDeleted ? "line-through" : ""}`}>
                            {card.purpose}
                          </span>
                          {card.isDeleted ? (
                            <Badge variant="destructive" className="shrink-0">
                              {copy.deleted}
                            </Badge>
                          ) : null}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {copy.systems}: {toolDisplayName}
                        </div>
                          {workflowBadge ? (
                            <div className="text-xs text-muted-foreground">
                              {workflowBadge}
                            </div>
                          ) : null}
                        </div>
                        <div onClick={(event) => event.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 hover:bg-muted">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            {renderActionsMenu(card, nextStatuses, outputState, proofPdfState)}
                          </DropdownMenu>
                        </div>
                      </div>

                      <div className="grid gap-3 text-sm text-slate-700">
                        <div>
                          <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                            {copy.sortStatus}
                          </div>
                          <div className="pt-1">
                            <RegisterStatusBadge status={card.status} />
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                              {copy.ownerRole}
                            </div>
                            <div>{ownerRole}</div>
                          </div>
                          <div>
                            <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                              {t('register.riskClass.label')}
                            </div>
                            <div>
                              {riskClassLabel(card)}
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                            {copy.activity}
                          </div>
                          <div>{formatDate(card.updatedAt, locale, copy.unknown)}</div>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[360px]">{t('register.useCaseTitle')}</TableHead>
                  <TableHead>{copy.sortStatus}</TableHead>
                  <TableHead>{copy.ownerRole}</TableHead>
                  <TableHead>{t('register.riskClass.label')}</TableHead>
                  <TableHead>{copy.activity}</TableHead>
                  <TableHead className="w-[80px] text-right">{copy.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUseCases.map((card, idx) => {
                  let showGroupHeader = false;
                  let groupHeader: string | null = null;
                  if (groupedUseCases) {
                    let currentGroup: string;
                    switch (viewMode) {
                      case "BY_OWNER": currentGroup = card.responsibility.responsibleParty || copy.notAssigned; break;
                      case "BY_ORG": currentGroup = card.organisation || copy.noOrganisation; break;
                      case "BY_STATUS": currentGroup = statusLabel(card.status); break;
                      default: currentGroup = "";
                    }
                    const prev = idx > 0 ? sortedUseCases[idx - 1] : null;
                    let prevGroup = "";
                    if (prev) {
                      switch (viewMode) {
                        case "BY_OWNER": prevGroup = prev.responsibility.responsibleParty || copy.notAssigned; break;
                        case "BY_ORG": prevGroup = prev.organisation || copy.noOrganisation; break;
                        case "BY_STATUS": prevGroup = statusLabel(prev.status); break;
                      }
                    }
                    if (!prev || currentGroup !== prevGroup) {
                      const count = sortedUseCases.filter((uc) => {
                        switch (viewMode) {
                          case "BY_OWNER": return (uc.responsibility.responsibleParty || copy.notAssigned) === currentGroup;
                          case "BY_ORG": return (uc.organisation || copy.noOrganisation) === currentGroup;
                          case "BY_STATUS": return statusLabel(uc.status) === currentGroup;
                          default: return true;
                        }
                      }).length;
                      groupHeader = `${currentGroup} (${count})`;
                      showGroupHeader = true;
                    }
                  }

                  const nextStatuses = getNextManualStatuses(card.status);
                  const toolDisplayName = getCardToolDisplayName(card, copy.noSystem);
                  const workflowBadge = getUseCaseWorkflowBadge(card, {
                    locale,
                    resolveToolName: (toolId) =>
                      aiToolsRegistry.getById(toolId)?.productName ?? null,
                  });
                  const ownerRole =
                    card.responsibility.responsibleParty || copy.notAssigned;
                  const outputState = getStatusGatedOutputState(
                    card.status,
                    registerFirstFlags
                  );
                  const proofPdfState = getProofPackPdfState(card, registerFirstFlags);

                  return (
                    <React.Fragment key={card.useCaseId}>
                      {showGroupHeader && groupHeader && (
                        <TableRow className="bg-white hover:bg-white">
                          <TableCell colSpan={6} className="h-10 text-xs font-semibold uppercase text-muted-foreground">
                            {groupHeader}
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow
                        onClick={() =>
                          router.push(
                            buildScopedUseCaseDetailHref(
                              card.useCaseId,
                              workspaceScope,
                            ),
                          )
                        }
                        className={`cursor-pointer group ${card.isDeleted ? "opacity-60 grayscale" : ""}`}
                      >
                        <TableCell>
                          <div className="flex min-w-0 flex-col gap-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-sm font-medium text-slate-950 ${card.isDeleted ? "line-through" : ""}`}>
                                {card.purpose}
                              </span>
                              {card.isDeleted && (
                                <Badge variant="destructive" className="shrink-0">{copy.deleted}</Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {copy.systems}: {toolDisplayName}
                            </span>
                            {workflowBadge ? (
                              <span className="text-xs text-muted-foreground">
                                {workflowBadge}
                              </span>
                            ) : null}
                          </div>
                        </TableCell>

                        <TableCell>
                          <RegisterStatusBadge status={card.status} />
                        </TableCell>

                        <TableCell>
                          <span className="text-sm text-slate-700">{ownerRole}</span>
                        </TableCell>

                        <TableCell>
                          <span className="text-sm text-slate-700">
                            {riskClassLabel(card)}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(card.updatedAt, locale, copy.unknown)}
                          </span>
                        </TableCell>

                        <TableCell className="text-right align-middle" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 hover:bg-muted">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            {renderActionsMenu(card, nextStatuses, outputState, proofPdfState)}
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Status change confirmation dialog */}
      <AlertDialog
        open={confirmingStatusCard !== null}
        onOpenChange={(open) => { if (!open) setConfirmingStatusCard(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.confirmStatusTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.confirmStatusDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmingStatusCard) {
                  void handleUpdateStatus(confirmingStatusCard);
                  setConfirmingStatusCard(null);
                }
              }}
            >
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
