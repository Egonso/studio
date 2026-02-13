"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ClipboardCopy, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  getOutputProfileByStatus,
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

const toolRegistry = createStaticToolRegistryService();

const dataCategoryLabels: Record<string, string> = {
  NONE: "Keine besonderen Daten",
  INTERNAL: "Interne Daten",
  PERSONAL: "Personenbezogene Daten",
  SENSITIVE: "Sensible Daten",
};

interface RegisterBoardProps {
  projectId?: string;
}

type StatusFilter = RegisterUseCaseStatus | "ALL";
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

export function RegisterBoard({ projectId }: RegisterBoardProps) {
  const { toast } = useToast();
  const [useCases, setUseCases] = useState<UseCaseCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedNextStatusById, setSelectedNextStatusById] = useState<
    Record<string, RegisterUseCaseStatus | undefined>
  >({});
  const [updatingUseCaseId, setUpdatingUseCaseId] = useState<string | null>(null);
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
      const items = await registerFirstService.listUseCases(projectId, {
        status: statusFilter === "ALL" ? undefined : statusFilter,
        searchText: searchQuery,
        limit: 150,
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
  }, [projectId, searchQuery, statusFilter]);

  useEffect(() => {
    void loadUseCases();
  }, [loadUseCases]);

  const handleApplyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setStatusFilter("ALL");
  };

  const handleUpdateStatus = async (card: UseCaseCard) => {
    const nextStatus = selectedNextStatusById[card.useCaseId];
    if (!nextStatus) {
      return;
    }

    setUpdatingUseCaseId(card.useCaseId);
    setUpdateErrorById((prev) => ({ ...prev, [card.useCaseId]: undefined }));

    try {
      await registerFirstService.updateUseCaseStatusManual({
        projectId,
        useCaseId: card.useCaseId,
        nextStatus,
        actor: "HUMAN",
      });

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
      await registerFirstService.setPublicVisibility({
        projectId,
        useCaseId: card.useCaseId,
        isPublicVisible: !(card.isPublicVisible ?? false),
      });
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
      await registerFirstService.updateProofMetaManual({
        projectId,
        useCaseId: card.useCaseId,
        verifyUrl: validation.normalized.verifyUrl,
        isReal: draft.isReal === "YES",
        isCurrent: draft.isCurrent === "YES",
        scope: validation.normalized.scope,
        actor: "HUMAN",
      });

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
    <div className="space-y-6">
      <Alert>
        <AlertTitle>Governance bleibt manuell</AlertTitle>
        <AlertDescription>
          Statuswechsel werden nur durch explizite menschliche Entscheidungen gesetzt.
          Keine automatische Review-Pflicht, Eskalation oder Policy-Generierung.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
          <CardDescription>
            Suche und Statusfilter fuer Register-Einsatzfaelle im aktuellen Projekt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleApplyFilters} className="grid gap-3 md:grid-cols-[2fr_1fr_auto_auto]">
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Suche nach Zweck, Verantwortung oder Hinweis"
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger>
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
            <Button type="submit">Anwenden</Button>
            <Button type="button" variant="outline" onClick={handleResetFilters}>
              Zuruecksetzen
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {useCases.length} Einsatzfall{useCases.length === 1 ? "" : "e"} gefunden.
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => void loadUseCases()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Aktualisieren
          </Button>
          <Button asChild>
            <Link href={projectId ? `/register/capture?projectId=${projectId}` : "/register/capture"}>
              Neuer Einsatzfall
            </Link>
          </Button>
        </div>
      </div>

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
            <CardTitle>Noch keine Register-Eintraege</CardTitle>
            <CardDescription>
              Lege den ersten Einsatzfall an. Startpunkt ist der Capture-Flow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={projectId ? `/register/capture?projectId=${projectId}` : "/register/capture"}>
                Zum Capture
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {useCases.map((card) => {
            const nextStatuses = getNextManualStatuses(card.status);
            const outputProfile = getOutputProfileByStatus(card.status);
            const outputState = getStatusGatedOutputState(
              card.status,
              registerFirstFlags
            );
            const proofPdfState = getProofPackPdfState(card, registerFirstFlags);
            const selectedNextStatus = selectedNextStatusById[card.useCaseId];
            const isUpdating = updatingUseCaseId === card.useCaseId;
            const proofDraft = proofDraftById[card.useCaseId] ?? createProofMetaDraft(card);
            const isSavingProof = savingProofUseCaseId === card.useCaseId;
            const proofValidation = validateVerifyLinkInput({
              verifyUrl: proofDraft.verifyUrl,
              scope: proofDraft.scope,
            });
            const hasProofDraftChanges = hasUnsavedProofDraft(
              card,
              proofDraft,
              proofValidation.normalized
            );
            const canPreviewProofPdf =
              card.status === "PROOF_READY" &&
              registerFirstFlags.proofGate &&
              (Boolean(card.proof) || proofValidation.isValid);
            const previewUsesDraft = proofValidation.isValid;
            const previewVerifyUrl =
              proofValidation.normalized.verifyUrl || card.proof?.verifyUrl || "nicht gesetzt";
            const previewScope =
              proofValidation.normalized.scope ||
              card.proof?.verification.scope ||
              "nicht gesetzt";
            const previewIsReal = previewUsesDraft
              ? proofDraft.isReal === "YES"
              : (card.proof?.verification.isReal ?? false);
            const previewIsCurrent = previewUsesDraft
              ? proofDraft.isCurrent === "YES"
              : (card.proof?.verification.isCurrent ?? false);

            return (
              <Card key={card.useCaseId}>
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-lg">{card.purpose}</CardTitle>
                    <RegisterStatusBadge status={card.status} />
                  </div>
                  <CardDescription>
                    ID: {card.useCaseId}
                    {card.cardVersion === "1.1" && (
                      <span className="ml-1 text-xs">
                        | v1.1{card.globalUseCaseId ? ` | ${card.globalUseCaseId}` : ""}
                      </span>
                    )}
                    {" "}| Aktualisiert: {formatDate(card.updatedAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 text-sm md:grid-cols-2">
                    <div>
                      <p className="font-medium">Wirkungskontext</p>
                      <p className="text-muted-foreground">
                        {card.usageContexts.map((value) => usageContextLabels[value]).join(", ")}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Output-Status</p>
                      <p className="text-muted-foreground">
                        {outputProfile.artifactName}: {outputProfile.description}
                      </p>
                    </div>
                  </div>

                  {card.cardVersion === "1.1" && (
                    <div className="grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-4">
                      {card.toolId && (
                        <div>
                          <p className="font-medium">Tool</p>
                          <p className="text-muted-foreground">
                            {card.toolId === "other"
                              ? card.toolFreeText ?? "Anderes Tool"
                              : card.toolId}
                          </p>
                        </div>
                      )}
                      {card.dataCategory && (
                        <div>
                          <p className="font-medium">Datenkategorie</p>
                          <p className="text-muted-foreground">
                            {dataCategoryLabels[card.dataCategory] ?? card.dataCategory}
                          </p>
                        </div>
                      )}
                      {card.globalUseCaseId && (
                        <div>
                          <p className="font-medium">Global ID</p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {card.globalUseCaseId}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="font-medium">Sichtbarkeit</p>
                        <p className="text-muted-foreground">
                          {card.isPublicVisible ? "Oeffentlich" : "Privat"}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 rounded-md border p-3">
                    <p className="text-sm font-medium">Statusgesteuerte Ausgaben</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportUseCasePass(card)}
                        disabled={!outputState.cardJsonEnabled}
                      >
                        Use-Case Pass (JSON)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportProofPackDraft(card)}
                        disabled={!outputState.proofPackDraftEnabled}
                      >
                        Proof-Pack Entwurf (JSON)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportProofPackPdf(card)}
                        disabled={!proofPdfState.enabled}
                      >
                        Proof Pack (PDF)
                      </Button>
                      {card.cardVersion === "1.1" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void handleExportUseCasePassV11(card)}
                          disabled={!outputState.cardJsonEnabled}
                        >
                          Use-Case Pass v1.1 (JSON)
                        </Button>
                      )}
                    </div>
                    {card.cardVersion === "1.1" && (
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleTogglePublicVisibility(card)}
                        >
                          {card.isPublicVisible
                            ? "Oeffentlich sichtbar (deaktivieren)"
                            : "Als oeffentlich markieren"}
                        </Button>
                        {card.publicHashId && card.isPublicVisible && (
                          <a
                            href={buildVerifyPassAbsoluteUrl(card.publicHashId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs text-blue-600 underline hover:text-blue-800"
                          >
                            Verify-Link oeffnen
                          </a>
                        )}
                        {card.publicHashId && card.isPublicVisible && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const url = buildVerifyPassAbsoluteUrl(card.publicHashId!);
                              void copyTextToClipboard(url).then(() =>
                                toast({
                                  title: "Verify-Link kopiert",
                                  description: url,
                                })
                              );
                            }}
                          >
                            <ClipboardCopy className="mr-1 h-3.5 w-3.5" />
                            Link kopieren
                          </Button>
                        )}
                      </div>
                    )}
                    {card.status === "PROOF_READY" && (
                      <div className="space-y-2 rounded-md border border-dashed p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-medium">Proof-Pack Vorschau</p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreviewProofPackPdf(card)}
                            disabled={!canPreviewProofPdf}
                          >
                            <ExternalLink className="mr-2 h-3.5 w-3.5" />
                            PDF Vorschau
                          </Button>
                        </div>
                        <div className="grid gap-1 text-xs text-muted-foreground">
                          <p>
                            Quelle: {previewUsesDraft ? "aktueller Entwurf" : "gespeicherter Stand"}
                          </p>
                          <p>URL: {previewVerifyUrl}</p>
                          <p>Scope: {previewScope}</p>
                          <p>Echt: {previewIsReal ? "Ja" : "Nein"}</p>
                          <p>Aktuell: {previewIsCurrent ? "Ja" : "Nein"}</p>
                        </div>
                        {hasProofDraftChanges && (
                          <p className="text-xs text-amber-600">
                            Ungespeicherte Aenderungen vorhanden. Vorschau kann bereits den Entwurf
                            zeigen, Download bleibt bis zum Speichern statusgesteuert.
                          </p>
                        )}
                      </div>
                    )}
                    {outputState.proofPackDraftBlockedReason && (
                      <p className="text-xs text-muted-foreground">
                        {outputState.proofPackDraftBlockedReason}
                      </p>
                    )}
                    {proofPdfState.blockedReason && (
                      <p className="text-xs text-muted-foreground">
                        {proofPdfState.blockedReason}
                      </p>
                    )}
                  </div>

                  {card.status === "PROOF_READY" && (
                    <div className="space-y-3 rounded-md border p-3">
                      <p className="text-sm font-medium">Verify-Link Daten (echt / aktuell / scope)</p>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <Input
                            placeholder="Verify URL (https://...)"
                            value={proofDraft.verifyUrl}
                            onChange={(event) =>
                              handleProofDraftChange(
                                card.useCaseId,
                                { verifyUrl: event.target.value },
                                card
                              )
                            }
                            aria-invalid={Boolean(proofValidation.errors.verifyUrl)}
                          />
                          {proofValidation.errors.verifyUrl && (
                            <p className="text-xs text-destructive">
                              {proofValidation.errors.verifyUrl}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Input
                            placeholder="Scope"
                            value={proofDraft.scope}
                            onChange={(event) =>
                              handleProofDraftChange(
                                card.useCaseId,
                                { scope: event.target.value },
                                card
                              )
                            }
                            aria-invalid={Boolean(proofValidation.errors.scope)}
                          />
                          {proofValidation.errors.scope && (
                            <p className="text-xs text-destructive">
                              {proofValidation.errors.scope}
                            </p>
                          )}
                        </div>
                        <Select
                          value={proofDraft.isReal}
                          onValueChange={(value) =>
                            handleProofDraftChange(
                              card.useCaseId,
                              { isReal: value as ProofBooleanChoice },
                              card
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Echt" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="YES">Echt: Ja</SelectItem>
                            <SelectItem value="NO">Echt: Nein</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={proofDraft.isCurrent}
                          onValueChange={(value) =>
                            handleProofDraftChange(
                              card.useCaseId,
                              { isCurrent: value as ProofBooleanChoice },
                              card
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Aktuell" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="YES">Aktuell: Ja</SelectItem>
                            <SelectItem value="NO">Aktuell: Nein</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => void handleSaveProofMeta(card)}
                          disabled={isSavingProof || !proofValidation.isValid}
                        >
                          {isSavingProof && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Verify-Link speichern
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void handleCopyVerifyUrl(card)}
                        >
                          <ClipboardCopy className="mr-2 h-4 w-4" />
                          Verify-Link kopieren
                        </Button>
                        {card.proof && (
                          <p className="text-xs text-muted-foreground">
                            Letzter Stand: {formatDate(card.proof.generatedAt)}
                          </p>
                        )}
                      </div>

                      {proofErrorById[card.useCaseId] && (
                        <p className="text-xs text-destructive">
                          {proofErrorById[card.useCaseId]}
                        </p>
                      )}
                    </div>
                  )}

                  {nextStatuses.length > 0 && (
                    <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                      <Select
                        value={selectedNextStatus}
                        onValueChange={(value) =>
                          setSelectedNextStatusById((prev) => ({
                            ...prev,
                            [card.useCaseId]: value as RegisterUseCaseStatus,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Naechsten Status waehlen" />
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
                        onClick={() => void handleUpdateStatus(card)}
                        disabled={!selectedNextStatus || isUpdating}
                      >
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Status manuell setzen
                      </Button>
                    </div>
                  )}

                  {updateErrorById[card.useCaseId] && (
                    <p className="text-xs text-destructive">{updateErrorById[card.useCaseId]}</p>
                  )}

                  {outputProfile.requiresManualDecision && (
                    <p className="text-xs text-muted-foreground">
                      Dieser Status ist eine explizite menschliche Governance-Entscheidung.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
