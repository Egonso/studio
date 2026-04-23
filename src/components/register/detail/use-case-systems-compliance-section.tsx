"use client";

import { useMemo, useState } from "react";
import { APP_LOCALE } from '@/lib/locale';
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { buildAuthPath } from "@/lib/auth/login-routing";
import {
  createAiToolsRegistryService,
  createUseCaseSystemPublicInfoEntry,
  mergeUseCaseSystemPublicInfoEntries,
  resolveUniqueSystemsForCompliance,
  type ResolvedComplianceSystemEntry,
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
  headingOverride?: string;
  descriptionOverride?: string;
  showSectionAction?: boolean;
}

type ActiveCheckTarget = "all" | string | null;

function isReloginFailureReason(value: string): boolean {
  return /auth|unauthori|eingeloggt|sign in|session|sitzung|erneut an/i.test(
    value
  );
}

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

  return date.toLocaleDateString(APP_LOCALE);
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

function getKnownSignals(publicInfo: ToolPublicInfo): string[] {
  const signals: string[] = [];

  if (publicInfo.flags.gdprClaim === "yes") {
    signals.push("DSGVO-Hinweis");
  }
  if (publicInfo.flags.aiActClaim === "yes") {
    signals.push("AI-Act-Hinweis");
  }
  if (publicInfo.flags.trustCenterFound === "yes") {
    signals.push("Trust Center");
  }
  if (publicInfo.flags.privacyPolicyFound === "yes") {
    signals.push("Datenschutzerklaerung");
  }
  if (publicInfo.flags.dpaOrSccMention === "yes") {
    signals.push("AVV / SCC");
  }

  return signals;
}

function buildSystemNarrative(
  system: ResolvedComplianceSystemEntry,
  lastCheckedAt: string | null,
): {
  status: string;
  documented: string;
  missing: string;
  actionLabel: string | null;
} {
  if (system.requiresManualDocumentation && !system.publicInfo) {
    const vendorText = system.vendor
      ? `Anbieter ist als ${system.vendor} hinterlegt.`
      : "Ein Anbieter ist noch nicht gesondert hinterlegt.";

    return {
      status: "Manuelle Dokumentation erforderlich",
      documented: `${vendorText} System ist identifiziert.`,
      missing: "Es fehlen Angaben zu Betrieb, Datenschutz oder Vertragsgrundlagen.",
      actionLabel: null,
    };
  }

  if (!system.publicInfo) {
    const vendorText = system.vendor
      ? `Anbieter ${system.vendor} ist hinterlegt.`
      : "Bisher ist nur das System selbst dokumentiert.";

    return {
      status: "Noch kein dokumentierter Compliance-Stand",
      documented: vendorText,
      missing: "Es fehlt ein dokumentierter Nachweisstand.",
      actionLabel: "Jetzt System pruefen",
    };
  }

  const signals = getKnownSignals(system.publicInfo);
  const summary =
    system.publicInfo.summary?.trim() ||
    `Es liegen ${signals.length > 0 ? signals.length : "einige"} dokumentierte Nachweisindikatoren vor.`;
  const sourceCount = system.publicInfo.sources.length;

  return {
    status: lastCheckedAt
      ? `Dokumentiert, zuletzt geprueft am ${lastCheckedAt}`
      : "Dokumentiert",
    documented:
      sourceCount > 0
        ? `${summary} ${sourceCount} Quelle${sourceCount === 1 ? "" : "n"} verknuepft.`
        : summary,
    missing:
      sourceCount === 0
        ? "Es ist noch keine Quelle verlinkt."
        : signals.length >= 2
          ? "Keine akute Nachweisluecke sichtbar."
          : "Der Nachweis ist noch schmal.",
    actionLabel: "Jetzt erneut pruefen",
  };
}

function getSectionIntro(input: {
  isSingleMode: boolean;
  systems: ResolvedComplianceSystemEntry[];
  isEditing: boolean;
}): string {
  if (input.systems.length === 0) {
    return "Noch kein System dokumentiert.";
  }

  if (input.isEditing) {
    return input.isSingleMode
      ? "Weitere Systeme koennen spaeter ergaenzt werden."
      : 'Beteiligte Systeme werden im Abschnitt "Ablauf & Systeme" gepflegt.';
  }

  const documentedCount = input.systems.filter((system) => Boolean(system.publicInfo))
    .length;
  const manualCount = input.systems.filter(
    (system) => system.requiresManualDocumentation && !system.publicInfo,
  ).length;

  if (input.isSingleMode) {
    return documentedCount > 0
      ? "Nachweisstand fuer das dokumentierte System ist hinterlegt."
      : manualCount > 0
        ? "Dieses System benoetigt manuelle Nachweise."
        : "Fuer dieses System liegt noch kein Nachweisstand vor.";
  }

  if (manualCount > 0) {
    return `${documentedCount} von ${input.systems.length} Systemen haben recherchierte Nachweise. ${manualCount} System${manualCount === 1 ? "" : "e"} bleiben manuell.`;
  }

  return `${documentedCount} von ${input.systems.length} Systemen haben recherchierte Nachweise.`;
}

export function UseCaseSystemsComplianceSection({
  card,
  isEditing,
  onSave,
  mode = "multi",
  layout = "standalone",
  headingOverride,
  descriptionOverride,
  showSectionAction = true,
}: UseCaseSystemsComplianceSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
  const sectionIntro = getSectionIntro({
    isSingleMode,
    systems,
    isEditing,
  });
  const returnToPath = useMemo(() => {
    const query = searchParams?.toString() ?? "";
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

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
          isReloginFailureReason(failure.reason)
        );
        toast({
          variant: "destructive",
          title: requiresRelogin
            ? "Sitzung abgelaufen"
            : "Compliance-Pruefung fehlgeschlagen",
          description: requiresRelogin
            ? "Bitte melden Sie sich erneut an, um den Systemnachweis fortzusetzen."
            : failures
                .slice(0, 2)
                .map((failure) => `${failure.systemName}: ${failure.reason}`)
                .join(" | "),
          action: requiresRelogin ? (
            <ToastAction
              altText="Zur Anmeldung"
              onClick={() =>
                router.push(
                  buildAuthPath({
                    mode: "login",
                    returnTo: returnToPath,
                  })
                )
              }
            >
              Zur Anmeldung
            </ToastAction>
          ) : undefined,
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
            {headingOverride ??
              (isSingleMode ? "Systemnachweis" : "Systemnachweise")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {descriptionOverride ??
              (isSingleMode
                ? "Status und Nachweise fuer das aktuelle System."
                : "Status und Nachweise pro beteiligtem System.")}
          </p>
        </div>

        {showSectionAction ? (
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
                ? "Jetzt System pruefen"
                : "Jetzt Systeme pruefen"
            )}
          </Button>
        ) : null}
      </div>

      <div className="mt-4 rounded-sm border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
        <p>{sectionIntro}</p>
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
            const narrative = buildSystemNarrative(system, lastCheckedAt);

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
                        narrative.actionLabel ?? "Pruefen"
                      )}
                    </Button>
                  )}
                </div>

                <div className="mt-3 space-y-3 rounded-md border border-slate-200 bg-white px-4 py-3">
                  <ComplianceNarrativeRow
                    label="Status"
                    value={narrative.status}
                  />
                  <ComplianceNarrativeRow
                    label="Dokumentiert"
                    value={narrative.documented}
                  />
                  <ComplianceNarrativeRow
                    label="Es fehlt"
                    value={narrative.missing}
                  />

                  {publicInfo ? (
                    <>
                      <div className="grid gap-2 border-t border-slate-200 pt-3 text-xs text-slate-600 md:grid-cols-2">
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
                        <p className="border-t border-slate-200 pt-3 text-xs text-slate-500">
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
                    </>
                  ) : null}
                </div>
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

function ComplianceNarrativeRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-1 md:grid-cols-[140px_minmax(0,1fr)] md:gap-3">
      <p className="text-xs uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className="text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}
