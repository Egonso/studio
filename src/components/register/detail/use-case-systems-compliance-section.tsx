"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { buildAuthPath } from "@/lib/auth/login-routing";
import { usePathname, useRouter } from "@/i18n/navigation";
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

function getSystemsComplianceCopy(locale: string) {
  if (locale === "de") {
    return {
      providerSystem: "System",
      providerModel: "Modell",
      providerConnector: "Connector",
      providerInternal: "Intern",
      providerTool: "Tool",
      flagYes: "Ja",
      flagNo: "Nein",
      flagNotFound: "Nicht gefunden",
      manualDocumentation: "Manuell dokumentieren",
      notDocumented: "Nicht dokumentiert",
      checkedAt: "Geprueft am",
      documented: "Dokumentiert",
      gdprSignal: "DSGVO-Hinweis",
      aiActSignal: "AI-Act-Hinweis",
      privacyPolicy: "Datenschutzerklaerung",
      vendorStored: (vendor: string) =>
        `Anbieter ist als ${vendor} hinterlegt.`,
      vendorNotStored: "Ein Anbieter ist noch nicht gesondert hinterlegt.",
      systemIdentified: "System ist identifiziert.",
      manualMissing:
        "Es fehlen Angaben zu Betrieb, Datenschutz oder Vertragsgrundlagen.",
      manualStatus: "Manuelle Dokumentation erforderlich",
      vendorKnown: (vendor: string) => `Anbieter ${vendor} ist hinterlegt.`,
      onlySystemDocumented: "Bisher ist nur das System selbst dokumentiert.",
      noComplianceStatus: "Noch kein dokumentierter Compliance-Stand",
      missingEvidence: "Es fehlt ein dokumentierter Nachweisstand.",
      checkSystemNow: "Jetzt System pruefen",
      someEvidenceIndicators: "einige",
      evidenceIndicators: (count: number | string) =>
        `Es liegen ${count} dokumentierte Nachweisindikatoren vor.`,
      linkedSources: (count: number) =>
        `${count} Quelle${count === 1 ? "" : "n"} verknuepft.`,
      documentedCheckedAt: (date: string) =>
        `Dokumentiert, zuletzt geprueft am ${date}`,
      noSourceLinked: "Es ist noch keine Quelle verlinkt.",
      noAcuteGap: "Keine akute Nachweisluecke sichtbar.",
      narrowEvidence: "Der Nachweis ist noch schmal.",
      checkAgain: "Jetzt erneut pruefen",
      noSystemDocumented: "Noch kein System dokumentiert.",
      singleEditing: "Weitere Systeme koennen spaeter ergaenzt werden.",
      multiEditing:
        'Beteiligte Systeme werden im Abschnitt "Ablauf & Systeme" gepflegt.',
      singleDocumented:
        "Nachweisstand fuer das dokumentierte System ist hinterlegt.",
      singleManual: "Dieses System benoetigt manuelle Nachweise.",
      singleMissing: "Fuer dieses System liegt noch kein Nachweisstand vor.",
      systemsResearched: (documented: number, total: number, manual: number) =>
        manual > 0
          ? `${documented} von ${total} Systemen haben recherchierte Nachweise. ${manual} System${manual === 1 ? "" : "e"} bleiben manuell.`
          : `${documented} von ${total} Systemen haben recherchierte Nachweise.`,
      noResearchNeededTitle: "Keine Recherche noetig",
      noResearchNeededDescription:
        "Die aktuellen Systeme sind eher intern oder muessen manuell dokumentiert werden.",
      unknownVendor: "Unknown / Generic",
      noServerResults: "Keine Ergebnisse vom Server empfangen.",
      unknownResearchError: "Unbekannter Fehler bei der Recherche.",
      partialUpdatedTitle: "Compliance teilweise aktualisiert",
      partialUpdatedDescription: (successes: number, failures: number) =>
        `${successes} System(e) gespeichert, ${failures} System(e) mit Fehler.`,
      sessionExpiredTitle: "Sitzung abgelaufen",
      checkFailedTitle: "Compliance-Pruefung fehlgeschlagen",
      sessionExpiredDescription:
        "Bitte melden Sie sich erneut an, um den Systemnachweis fortzusetzen.",
      loginAction: "Zur Anmeldung",
      updatedTitle: "Compliance aktualisiert",
      updatedDescriptionMulti: (count: number) =>
        `Compliance-Daten fuer ${count} beteiligte Systeme gespeichert.`,
      updatedDescriptionSingle: (systemName: string) =>
        `Compliance-Daten fuer ${systemName} gespeichert.`,
      fallbackSystem: "das System",
      errorTitle: "Fehler",
      updateFailed:
        "Compliance-Informationen konnten nicht aktualisiert werden.",
      headingSingle: "Systemnachweis",
      headingMulti: "Systemnachweise",
      descriptionSingle: "Status und Nachweise fuer das aktuelle System.",
      descriptionMulti: "Status und Nachweise pro beteiligtem System.",
      checking: "Pruefung laeuft...",
      checkSystemsNow: "Jetzt Systeme pruefen",
      occurrenceInWorkflow: (count: number) => `${count}x im Ablauf`,
      vendor: "Anbieter",
      notStored: "Nicht hinterlegt",
      checkingShort: "Pruefung...",
      check: "Pruefen",
      status: "Status",
      documentedLabel: "Dokumentiert",
      missingLabel: "Es fehlt",
      sources: "Quellen",
      source: "Quelle",
      noSystemsDocumented:
        "Noch keine beteiligten Systeme dokumentiert.",
    };
  }

  return {
    providerSystem: "System",
    providerModel: "Model",
    providerConnector: "Connector",
    providerInternal: "Internal",
    providerTool: "Tool",
    flagYes: "Yes",
    flagNo: "No",
    flagNotFound: "Not found",
    manualDocumentation: "Document manually",
    notDocumented: "Not documented",
    checkedAt: "Checked on",
    documented: "Documented",
    gdprSignal: "GDPR note",
    aiActSignal: "AI Act note",
    privacyPolicy: "Privacy policy",
    vendorStored: (vendor: string) => `Vendor is recorded as ${vendor}.`,
    vendorNotStored: "No separate vendor has been recorded yet.",
    systemIdentified: "System is identified.",
    manualMissing:
      "Information on operation, data protection, or contractual basis is missing.",
    manualStatus: "Manual documentation required",
    vendorKnown: (vendor: string) => `Vendor ${vendor} is recorded.`,
    onlySystemDocumented: "Only the system itself has been documented so far.",
    noComplianceStatus: "No documented compliance status yet",
    missingEvidence: "A documented evidence status is missing.",
    checkSystemNow: "Check system now",
    someEvidenceIndicators: "some",
    evidenceIndicators: (count: number | string) =>
      `There are ${count} documented evidence indicators.`,
    linkedSources: (count: number) =>
      `${count} source${count === 1 ? "" : "s"} linked.`,
    documentedCheckedAt: (date: string) =>
      `Documented, last checked on ${date}`,
    noSourceLinked: "No source has been linked yet.",
    noAcuteGap: "No acute evidence gap visible.",
    narrowEvidence: "The evidence base is still narrow.",
    checkAgain: "Check again",
    noSystemDocumented: "No system documented yet.",
    singleEditing: "Additional systems can be added later.",
    multiEditing:
      'Involved systems are maintained in the "Workflow & systems" section.',
    singleDocumented:
      "Evidence status for the documented system is recorded.",
    singleManual: "This system requires manual evidence.",
    singleMissing: "No evidence status is available for this system yet.",
    systemsResearched: (documented: number, total: number, manual: number) =>
      manual > 0
        ? `${documented} of ${total} systems have researched evidence. ${manual} system${manual === 1 ? "" : "s"} remain manual.`
        : `${documented} of ${total} systems have researched evidence.`,
    noResearchNeededTitle: "No research needed",
    noResearchNeededDescription:
      "The current systems are internal or need to be documented manually.",
    unknownVendor: "Unknown / generic",
    noServerResults: "No results received from the server.",
    unknownResearchError: "Unknown research error.",
    partialUpdatedTitle: "Compliance partially updated",
    partialUpdatedDescription: (successes: number, failures: number) =>
      `${successes} system(s) saved, ${failures} system(s) with errors.`,
    sessionExpiredTitle: "Session expired",
    checkFailedTitle: "Compliance check failed",
    sessionExpiredDescription:
      "Please sign in again to continue system evidence.",
    loginAction: "Sign in",
    updatedTitle: "Compliance updated",
    updatedDescriptionMulti: (count: number) =>
      `Compliance data saved for ${count} involved systems.`,
    updatedDescriptionSingle: (systemName: string) =>
      `Compliance data saved for ${systemName}.`,
    fallbackSystem: "the system",
    errorTitle: "Error",
    updateFailed: "Compliance information could not be updated.",
    headingSingle: "System evidence",
    headingMulti: "System evidence",
    descriptionSingle: "Status and evidence for the current system.",
    descriptionMulti: "Status and evidence for each involved system.",
    checking: "Check running...",
    checkSystemsNow: "Check systems now",
    occurrenceInWorkflow: (count: number) => `${count}x in workflow`,
    vendor: "Vendor",
    notStored: "Not recorded",
    checkingShort: "Checking...",
    check: "Check",
    status: "Status",
    documentedLabel: "Documented",
    missingLabel: "Missing",
    sources: "Sources",
    source: "Source",
    noSystemsDocumented: "No involved systems documented yet.",
  };
}

type SystemsComplianceCopy = ReturnType<typeof getSystemsComplianceCopy>;

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

function formatProviderType(
  value: string | null,
  copy: SystemsComplianceCopy,
): string {
  if (!value) {
    return copy.providerSystem;
  }

  return value === "API"
    ? "API"
    : value === "MODEL"
      ? copy.providerModel
      : value === "CONNECTOR"
        ? copy.providerConnector
        : value === "INTERNAL"
          ? copy.providerInternal
          : value === "TOOL"
            ? copy.providerTool
            : copy.providerSystem;
}

function formatCheckedAt(
  value: string | null | undefined,
  locale: string,
): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString(locale === "de" ? "de-DE" : "en-GB");
}

function formatFlagLabel(
  value: ToolPublicInfo["flags"][keyof ToolPublicInfo["flags"]],
  copy: SystemsComplianceCopy,
): string {
  if (value === "yes") {
    return copy.flagYes;
  }

  if (value === "no") {
    return copy.flagNo;
  }

  return copy.flagNotFound;
}

function getStatusLabel(input: {
  hasPublicInfo: boolean;
  requiresManualDocumentation: boolean;
  lastCheckedAt: string | null | undefined;
}, copy: SystemsComplianceCopy): string {
  if (input.requiresManualDocumentation && !input.hasPublicInfo) {
    return copy.manualDocumentation;
  }

  if (!input.hasPublicInfo) {
    return copy.notDocumented;
  }

  return input.lastCheckedAt
    ? `${copy.checkedAt} ${input.lastCheckedAt}`
    : copy.documented;
}

function getKnownSignals(
  publicInfo: ToolPublicInfo,
  copy: SystemsComplianceCopy,
): string[] {
  const signals: string[] = [];

  if (publicInfo.flags.gdprClaim === "yes") {
    signals.push(copy.gdprSignal);
  }
  if (publicInfo.flags.aiActClaim === "yes") {
    signals.push(copy.aiActSignal);
  }
  if (publicInfo.flags.trustCenterFound === "yes") {
    signals.push("Trust Center");
  }
  if (publicInfo.flags.privacyPolicyFound === "yes") {
    signals.push(copy.privacyPolicy);
  }
  if (publicInfo.flags.dpaOrSccMention === "yes") {
    signals.push("AVV / SCC");
  }

  return signals;
}

function buildSystemNarrative(
  system: ResolvedComplianceSystemEntry,
  lastCheckedAt: string | null,
  copy: SystemsComplianceCopy,
): {
  status: string;
  documented: string;
  missing: string;
  actionLabel: string | null;
} {
  if (system.requiresManualDocumentation && !system.publicInfo) {
    const vendorText = system.vendor
      ? copy.vendorStored(system.vendor)
      : copy.vendorNotStored;

    return {
      status: copy.manualStatus,
      documented: `${vendorText} ${copy.systemIdentified}`,
      missing: copy.manualMissing,
      actionLabel: null,
    };
  }

  if (!system.publicInfo) {
    const vendorText = system.vendor
      ? copy.vendorKnown(system.vendor)
      : copy.onlySystemDocumented;

    return {
      status: copy.noComplianceStatus,
      documented: vendorText,
      missing: copy.missingEvidence,
      actionLabel: copy.checkSystemNow,
    };
  }

  const signals = getKnownSignals(system.publicInfo, copy);
  const summary =
    system.publicInfo.summary?.trim() ||
    copy.evidenceIndicators(
      signals.length > 0 ? signals.length : copy.someEvidenceIndicators,
    );
  const sourceCount = system.publicInfo.sources.length;

  return {
    status: lastCheckedAt
      ? copy.documentedCheckedAt(lastCheckedAt)
      : copy.documented,
    documented:
      sourceCount > 0
        ? `${summary} ${copy.linkedSources(sourceCount)}`
        : summary,
    missing:
      sourceCount === 0
        ? copy.noSourceLinked
        : signals.length >= 2
          ? copy.noAcuteGap
          : copy.narrowEvidence,
    actionLabel: copy.checkAgain,
  };
}

function getSectionIntro(input: {
  isSingleMode: boolean;
  systems: ResolvedComplianceSystemEntry[];
  isEditing: boolean;
}, copy: SystemsComplianceCopy): string {
  if (input.systems.length === 0) {
    return copy.noSystemDocumented;
  }

  if (input.isEditing) {
    return input.isSingleMode
      ? copy.singleEditing
      : copy.multiEditing;
  }

  const documentedCount = input.systems.filter((system) => Boolean(system.publicInfo))
    .length;
  const manualCount = input.systems.filter(
    (system) => system.requiresManualDocumentation && !system.publicInfo,
  ).length;

  if (input.isSingleMode) {
    return documentedCount > 0
      ? copy.singleDocumented
      : manualCount > 0
        ? copy.singleManual
        : copy.singleMissing;
  }

  return copy.systemsResearched(
    documentedCount,
    input.systems.length,
    manualCount,
  );
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
  const locale = useLocale();
  const copy = getSystemsComplianceCopy(locale);
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
  }, copy);
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
        title: copy.noResearchNeededTitle,
        description: copy.noResearchNeededDescription,
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
              toolVendor: system.vendor || copy.unknownVendor,
              force: true,
            }),
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Check failed");
          }
          if (!data.result) {
            throw new Error(copy.noServerResults);
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
                : copy.unknownResearchError,
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
          title: copy.partialUpdatedTitle,
          description: copy.partialUpdatedDescription(
            successes.length,
            failures.length,
          ),
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
            ? copy.sessionExpiredTitle
            : copy.checkFailedTitle,
          description: requiresRelogin
            ? copy.sessionExpiredDescription
            : failures
                .slice(0, 2)
                .map((failure) => `${failure.systemName}: ${failure.reason}`)
                .join(" | "),
          action: requiresRelogin ? (
            <ToastAction
              altText={copy.loginAction}
              onClick={() =>
                router.push(
                  buildAuthPath({
                    mode: "login",
                    returnTo: returnToPath,
                  })
                )
              }
            >
              {copy.loginAction}
            </ToastAction>
          ) : undefined,
        });
        return;
      }

      toast({
        title: copy.updatedTitle,
        description:
          targetSystems.length > 1
            ? copy.updatedDescriptionMulti(targetSystems.length)
            : copy.updatedDescriptionSingle(
                targetSystems[0]?.displayName ?? copy.fallbackSystem,
              ),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: copy.errorTitle,
        description:
          error instanceof Error
            ? error.message
            : copy.updateFailed,
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
              (isSingleMode ? copy.headingSingle : copy.headingMulti)}
          </h2>
          <p className="text-xs text-muted-foreground">
            {descriptionOverride ??
              (isSingleMode
                ? copy.descriptionSingle
                : copy.descriptionMulti)}
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
                {copy.checking}
              </>
            ) : (
              isSingleMode
                ? copy.checkSystemNow
                : copy.checkSystemsNow
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
            const lastCheckedAt = formatCheckedAt(
              system.publicInfo?.lastCheckedAt,
              locale,
            );
            const statusLabel = getStatusLabel({
              hasPublicInfo: Boolean(publicInfo),
              requiresManualDocumentation: system.requiresManualDocumentation,
              lastCheckedAt,
            }, copy);
            const isCheckingThisSystem = activeCheckTarget === system.systemKey;
            const narrative = buildSystemNarrative(system, lastCheckedAt, copy);

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
                          {copy.occurrenceInWorkflow(system.occurrenceCount)}
                        </span>
                      ) : null}
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600">
                        {formatProviderType(system.providerType, copy)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {copy.vendor}: {system.vendor || copy.notStored}
                    </p>
                    <p className="text-xs text-slate-600">{statusLabel}</p>
                  </div>

                  {system.requiresManualDocumentation ? (
                    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                      {copy.manualDocumentation}
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
                          {copy.checkingShort}
                        </>
                      ) : (
                        narrative.actionLabel ?? copy.check
                      )}
                    </Button>
                  )}
                </div>

                <div className="mt-3 space-y-3 rounded-md border border-slate-200 bg-white px-4 py-3">
                  <ComplianceNarrativeRow
                    label={copy.status}
                    value={narrative.status}
                  />
                  <ComplianceNarrativeRow
                    label={copy.documentedLabel}
                    value={narrative.documented}
                  />
                  <ComplianceNarrativeRow
                    label={copy.missingLabel}
                    value={narrative.missing}
                  />

                  {publicInfo ? (
                    <>
                      <div className="grid gap-2 border-t border-slate-200 pt-3 text-xs text-slate-600 md:grid-cols-2">
                        <p>DSGVO: {formatFlagLabel(publicInfo.flags.gdprClaim, copy)}</p>
                        <p>AI Act: {formatFlagLabel(publicInfo.flags.aiActClaim, copy)}</p>
                        <p>
                          Trust Center:{" "}
                          {formatFlagLabel(publicInfo.flags.trustCenterFound, copy)}
                        </p>
                        <p>
                          AVV / SCC: {formatFlagLabel(publicInfo.flags.dpaOrSccMention, copy)}
                        </p>
                      </div>

                      {publicInfo.sources.length > 0 ? (
                        <p className="border-t border-slate-200 pt-3 text-xs text-slate-500">
                          {copy.sources}:{" "}
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
                                  {source.title || `${copy.source} ${index + 1}`}
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
          {copy.noSystemsDocumented}
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
