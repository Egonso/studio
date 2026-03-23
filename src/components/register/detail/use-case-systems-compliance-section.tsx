"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  createAiToolsRegistryService,
  createUseCaseSystemPublicInfoEntry,
  mergeUseCaseSystemPublicInfoEntries,
  resolveUniqueSystemsForCompliance,
} from "@/lib/register-first";
import type {
  ToolPublicInfo,
  UseCaseCard,
} from "@/lib/register-first/types";

const aiRegistry = createAiToolsRegistryService();

interface UseCaseSystemsComplianceSectionProps {
  card: UseCaseCard;
  isEditing: boolean;
  onSave: (updates: Partial<UseCaseCard>) => Promise<void>;
  mode?: "single" | "multi";
  layout?: "standalone" | "embedded";
}

type ActiveCheckTarget = "all" | string | null;

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function resolveRegistryEntry(toolId?: string | null) {
  const normalized = normalizeOptionalText(toolId);
  if (!normalized || normalized === "other") {
    return null;
  }

  return (
    aiRegistry.getById(normalized) ??
    aiRegistry
      .getAll()
      .find((entry) => entry.productName.toLowerCase() === normalized.toLowerCase()) ??
    null
  );
}

function resolveVendor(toolId?: string | null): string | null {
  return resolveRegistryEntry(toolId)?.vendor ?? null;
}

function formatProviderType(value: string | null): string {
  if (!value) {
    return "System";
  }

  return value === "API"
    ? "API"
    : value === "MODEL"
      ? "Modell"
      : value === "CONNECTOR"
        ? "Connector"
        : value === "INTERNAL"
          ? "Intern"
          : value === "TOOL"
            ? "Tool"
            : "System";
}

function formatCheckedAt(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("de-DE");
}

function formatFlagLabel(value: ToolPublicInfo["flags"][keyof ToolPublicInfo["flags"]]): string {
  if (value === "yes") {
    return "Ja";
  }

  if (value === "no") {
    return "Nein";
  }

  return "Nicht gefunden";
}

function getStatusLabel(input: {
  hasPublicInfo: boolean;
  requiresManualDocumentation: boolean;
  lastCheckedAt: string | null | undefined;
}): string {
  if (input.requiresManualDocumentation && !input.hasPublicInfo) {
    return "Manuell dokumentieren";
  }

  if (!input.hasPublicInfo) {
    return "Nicht dokumentiert";
  }

  return input.lastCheckedAt ? `Geprueft am ${input.lastCheckedAt}` : "Dokumentiert";
}

export function UseCaseSystemsComplianceSection({
  card,
  isEditing,
  onSave,
  mode = "multi",
  layout = "standalone",
}: UseCaseSystemsComplianceSectionProps) {
  const { toast } = useToast();
  const [activeCheckTarget, setActiveCheckTarget] =
    useState<ActiveCheckTarget>(null);
  const isSingleMode = mode === "single";
  const sectionClassName =
    layout === "embedded"
      ? "space-y-5"
      : "rounded-lg border border-slate-200 bg-white p-5 md:p-6";

  const systems = useMemo(
    () =>
      resolveUniqueSystemsForCompliance(card, {
        resolveToolName: (toolId) =>
          resolveRegistryEntry(toolId)?.productName ?? null,
        resolveVendor: (toolId) => resolveVendor(toolId),
        resolveProviderType: (system) =>
          resolveRegistryEntry(system.toolId)?.toolId ? "TOOL" : null,
      }),
    [card]
  );

  const researchableSystems = systems.filter(
    (system) => !system.requiresManualDocumentation
  );

  const runComplianceCheck = async (targetSystemKeys?: string[]) => {
    const targetSystems = systems.filter((system) =>
      targetSystemKeys?.length
        ? targetSystemKeys.includes(system.systemKey)
        : !system.requiresManualDocumentation
    );

    if (targetSystems.length === 0) {
      toast({
        title: "Keine Recherche noetig",
        description:
          "Die aktuellen Systeme sind eher intern oder muessen manuell dokumentiert werden.",
      });
      return;
    }

    setActiveCheckTarget(
      targetSystems.length > 1 ? "all" : targetSystems[0]?.systemKey ?? null
    );

    const successes: ReturnType<typeof createUseCaseSystemPublicInfoEntry>[] = [];
    const failures: Array<{ systemName: string; reason: string }> = [];

    try {
      const { fetchWithFirebaseAuth } = await import("@/lib/firebase");

      for (const system of targetSystems) {
        try {
          const response = await fetchWithFirebaseAuth("/api/tools/public-info-check", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              toolName: system.displayName,
              toolVendor: system.vendor || "Unknown / Generic",
              force: true,
            }),
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Check failed");
          }
          if (!data.result) {
            throw new Error("Keine Ergebnisse vom Server empfangen.");
          }

          successes.push(
            createUseCaseSystemPublicInfoEntry({
              system,
              displayName: system.displayName,
              vendor: system.vendor,
              providerType: system.providerType,
              publicInfo: data.result as ToolPublicInfo,
            })
          );
        } catch (error) {
          failures.push({
            systemName: system.displayName,
            reason:
              error instanceof Error
                ? error.message
                : "Unbekannter Fehler bei der Recherche.",
          });
        }
      }

      if (successes.length > 0) {
        const mergedSystemPublicInfo = mergeUseCaseSystemPublicInfoEntries(
          card.systemPublicInfo,
          successes
        );
        const primarySystemKey = systems[0]?.systemKey ?? null;
        const primaryMatch =
          primarySystemKey !== null
            ? successes.find((entry) => entry.systemKey === primarySystemKey)
            : null;

        await onSave({
          systemPublicInfo: mergedSystemPublicInfo,
          ...(primaryMatch ? { publicInfo: primaryMatch.publicInfo } : {}),
        });
      }

      if (failures.length > 0 && successes.length > 0) {
        toast({
          title: "Compliance teilweise aktualisiert",
          description: `${successes.length} System(e) gespeichert, ${failures.length} System(e) mit Fehler.`,
        });
        return;
      }

      if (failures.length > 0) {
        const requiresRelogin = failures.some((failure) =>
          /auth|unauthori|eingeloggt/i.test(failure.reason)
        );
        toast({
          variant: "destructive",
          title: "Compliance-Pruefung fehlgeschlagen",
          description: requiresRelogin
            ? "Ihre Sitzung konnte nicht bestaetigt werden. Bitte laden Sie die Seite neu und melden Sie sich gegebenenfalls erneut an."
            : failures
                .slice(0, 2)
                .map((failure) => `${failure.systemName}: ${failure.reason}`)
                .join(" | "),
        });
        return;
      }

      toast({
        title: "Compliance aktualisiert",
        description:
          targetSystems.length > 1
            ? `Compliance-Daten fuer ${targetSystems.length} beteiligte Systeme gespeichert.`
            : `Compliance-Daten fuer ${targetSystems[0]?.displayName ?? "das System"} gespeichert.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description:
          error instanceof Error
            ? error.message
            : "Compliance-Informationen konnten nicht aktualisiert werden.",
      });
    } finally {
      setActiveCheckTarget(null);
    }
  };

  return (
    <section className={sectionClassName}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-[18px] font-semibold tracking-tight">
            {isSingleMode
              ? "System & Compliance"
              : "Beteiligte Systeme & Compliance"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {isSingleMode
              ? "Zeigt den aktuellen Compliance-Stand fuer das dokumentierte System."
              : "Ablauf dokumentiert die Reihenfolge. Compliance prueft beteiligte Systeme dedupliziert."}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => void runComplianceCheck()}
          disabled={activeCheckTarget !== null || researchableSystems.length === 0}
        >
          {activeCheckTarget === "all" ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Pruefung laeuft...
            </>
          ) : (
            isSingleMode
              ? "Compliance pruefen"
              : "Compliance fuer beteiligte Systeme pruefen"
          )}
        </Button>
      </div>

      <div className="mt-4 rounded-sm border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
        {isEditing ? (
          <p>
            {isSingleMode
              ? 'Wenn Sie weitere Systeme ergaenzen, erscheint hier automatisch eine deduplizierte Mehrsystem-Sicht.'
              : 'Beteiligte Systeme pflegen Sie im Abschnitt "Ablauf & Systeme". Hier sehen und pruefen Sie die deduplizierten Compliance-Informationen.'}
          </p>
        ) : (
          <p>
            {isSingleMode
              ? "Compliance-Informationen beziehen sich auf das aktuell dokumentierte System."
              : "Wiederholte Schritte mit demselben System erscheinen hier nur einmal."}
          </p>
        )}
      </div>

      {systems.length > 0 ? (
        <div className="mt-5 space-y-3">
          {systems.map((system) => {
            const publicInfo = system.publicInfo;
            const lastCheckedAt = formatCheckedAt(system.publicInfo?.lastCheckedAt);
            const statusLabel = getStatusLabel({
              hasPublicInfo: Boolean(publicInfo),
              requiresManualDocumentation: system.requiresManualDocumentation,
              lastCheckedAt,
            });
            const isCheckingThisSystem = activeCheckTarget === system.systemKey;

            return (
              <div
                key={system.systemKey}
                className="rounded-md border border-slate-200 bg-slate-50/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {system.displayName}
                      </p>
                      {system.occurrenceCount > 1 ? (
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600">
                          {system.occurrenceCount}x im Ablauf
                        </span>
                      ) : null}
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600">
                        {formatProviderType(system.providerType)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Anbieter: {system.vendor || "Nicht hinterlegt"}
                    </p>
                    <p className="text-xs text-slate-600">{statusLabel}</p>
                  </div>

                  {system.requiresManualDocumentation ? (
                    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                      Manuell dokumentieren
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => void runComplianceCheck([system.systemKey])}
                      disabled={activeCheckTarget !== null}
                    >
                      {isCheckingThisSystem ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Pruefung...
                        </>
                      ) : (
                        "Pruefen"
                      )}
                    </Button>
                  )}
                </div>

                {publicInfo ? (
                  <div className="mt-3 space-y-3 rounded-md border border-slate-200 bg-white px-4 py-3">
                    <p className="text-sm text-slate-700">
                      {publicInfo.summary || "Keine Zusammenfassung verfuegbar."}
                    </p>

                    <div className="grid gap-2 text-xs text-slate-600 md:grid-cols-2">
                      <p>DSGVO: {formatFlagLabel(publicInfo.flags.gdprClaim)}</p>
                      <p>AI Act: {formatFlagLabel(publicInfo.flags.aiActClaim)}</p>
                      <p>
                        Trust Center:{" "}
                        {formatFlagLabel(publicInfo.flags.trustCenterFound)}
                      </p>
                      <p>
                        AVV / SCC: {formatFlagLabel(publicInfo.flags.dpaOrSccMention)}
                      </p>
                    </div>

                    {publicInfo.sources.length > 0 ? (
                      <p className="text-xs text-slate-500">
                        Quellen:{" "}
                        {publicInfo.sources
                          .slice(0, 3)
                          .map((source, index) => (
                            <span key={`${system.systemKey}-${source.url}-${index}`}>
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-700 underline underline-offset-2"
                              >
                                {source.title || `Quelle ${index + 1}`}
                              </a>
                              {index < Math.min(publicInfo.sources.length, 3) - 1
                                ? ", "
                                : ""}
                            </span>
                          ))}
                      </p>
                    ) : null}
                  </div>
                ) : system.requiresManualDocumentation ? (
                  <div className="mt-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                    Internes oder kundenspezifisches System. Bitte Anbieter- und
                    Compliance-Informationen manuell dokumentieren.
                  </div>
                ) : (
                  <div className="mt-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                    Fuer dieses beteiligte System liegen derzeit keine dokumentierten
                    Compliance-Informationen vor.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-md border border-dashed border-slate-200 px-4 py-6 text-sm text-muted-foreground">
          Noch keine beteiligten Systeme dokumentiert.
        </div>
      )}
    </section>
  );
}
