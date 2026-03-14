import {
  normalizeWorkflowConnectionMode,
  resolveOrderedSystemsFromCard,
  splitOrderedSystemsForStorage,
} from "./card-model";
import type {
  OrderedUseCaseSystem,
  ToolPublicInfo,
  UseCaseCard,
  UseCaseSystemProviderType,
  UseCaseSystemPublicInfo,
  UseCaseWorkflow,
  WorkflowConnectionMode,
} from "./types";

export const WORKFLOW_CONNECTION_MODE_LABELS: Record<
  WorkflowConnectionMode,
  string
> = {
  MANUAL_SEQUENCE: "Manuell nacheinander",
  SEMI_AUTOMATED: "Teilweise automatisiert",
  FULLY_AUTOMATED: "Weitgehend automatisiert",
};

export interface ResolvedUseCaseSystemEntry extends OrderedUseCaseSystem {
  displayName: string;
}

interface ResolveUseCaseSystemOptions {
  resolveToolName?: ((toolId: string) => string | null | undefined) | null;
  resolveVendor?: ((toolId: string) => string | null | undefined) | null;
  resolveProviderType?:
    | ((system: Pick<OrderedUseCaseSystem, "toolId" | "toolFreeText">) => UseCaseSystemProviderType | null | undefined)
    | null;
  emptyLabel?: string;
}

export interface UseCaseWorkflowDisplay {
  systems: ResolvedUseCaseSystemEntry[];
  systemCount: number;
  hasMultipleSystems: boolean;
  connectionMode: WorkflowConnectionMode | null;
  connectionModeLabel: string | null;
  summary: string | null;
}

export interface ResolvedComplianceSystemEntry
  extends ResolvedUseCaseSystemEntry {
  systemKey: string;
  vendor: string | null;
  providerType: UseCaseSystemProviderType | null;
  publicInfo: ToolPublicInfo | null;
  publicInfoSource: "system" | "legacy" | "none";
  requiresManualDocumentation: boolean;
  occurrenceCount: number;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeSystemIdentity(value: string | null | undefined): string | null {
  const normalized = normalizeOptionalText(value);
  return normalized ? normalized.toLowerCase().replace(/\s+/g, " ") : null;
}

function inferProviderType(
  system: Pick<OrderedUseCaseSystem, "toolId" | "toolFreeText">,
  displayName?: string | null
): UseCaseSystemProviderType {
  const toolId = normalizeOptionalText(system.toolId);
  if (toolId && toolId !== "other") {
    return "TOOL";
  }

  const haystack = normalizeSystemIdentity(
    system.toolFreeText ?? displayName ?? toolId
  );
  if (!haystack) {
    return "OTHER";
  }

  if (
    /\b(intern|internal|lokal|local|eigen|custom|propriet|proprietaer|script)\b/i.test(
      haystack
    )
  ) {
    return "INTERNAL";
  }

  if (/\b(api|endpoint|service)\b/i.test(haystack)) {
    return "API";
  }

  if (/\b(model|modell|llm)\b/i.test(haystack)) {
    return "MODEL";
  }

  if (/\b(webhook|connector|zapier|make|n8n|workflow)\b/i.test(haystack)) {
    return "CONNECTOR";
  }

  return "OTHER";
}

export function buildSystemComplianceKey(
  system: Pick<OrderedUseCaseSystem, "toolId" | "toolFreeText">,
  displayName?: string | null
): string {
  const toolId = normalizeOptionalText(system.toolId);
  if (toolId && toolId !== "other") {
    return `tool:${normalizeSystemIdentity(toolId)}`;
  }

  const label =
    normalizeSystemIdentity(system.toolFreeText) ??
    normalizeSystemIdentity(displayName);

  return label ? `name:${label}` : "name:unknown";
}

export function resolveSystemPublicInfo(
  card: Pick<UseCaseCard, "systemPublicInfo">,
  systemKey: string
): UseCaseSystemPublicInfo | null {
  return (
    card.systemPublicInfo?.find((entry) => entry.systemKey === systemKey) ?? null
  );
}

export function resolveLegacyPublicInfoFallback(
  card: Pick<UseCaseCard, "publicInfo">
): ToolPublicInfo | null {
  return card.publicInfo ?? null;
}

export function createUseCaseSystemPublicInfoEntry(input: {
  system: Pick<OrderedUseCaseSystem, "toolId" | "toolFreeText">;
  displayName: string;
  publicInfo: ToolPublicInfo;
  vendor?: string | null;
  providerType?: UseCaseSystemProviderType | null;
}): UseCaseSystemPublicInfo {
  return {
    systemKey: buildSystemComplianceKey(input.system, input.displayName),
    toolId: normalizeOptionalText(input.system.toolId) ?? undefined,
    toolFreeText: normalizeOptionalText(input.system.toolFreeText) ?? undefined,
    displayName: input.displayName,
    vendor: normalizeOptionalText(input.vendor ?? null),
    providerType:
      input.providerType ??
      inferProviderType(input.system, input.displayName),
    publicInfo: input.publicInfo,
  };
}

export function mergeUseCaseSystemPublicInfoEntries(
  existing: ReadonlyArray<UseCaseSystemPublicInfo> | undefined,
  incoming: ReadonlyArray<UseCaseSystemPublicInfo>
): UseCaseSystemPublicInfo[] {
  const merged = new Map<string, UseCaseSystemPublicInfo>();

  for (const entry of existing ?? []) {
    merged.set(entry.systemKey, entry);
  }

  for (const entry of incoming) {
    merged.set(entry.systemKey, entry);
  }

  return Array.from(merged.values());
}

export function resolveUseCaseSystemDisplayName(
  system: Pick<OrderedUseCaseSystem, "toolId" | "toolFreeText">,
  options: ResolveUseCaseSystemOptions = {}
): string {
  const toolFreeText = normalizeOptionalText(system.toolFreeText);
  if (toolFreeText) {
    return toolFreeText;
  }

  const toolId = normalizeOptionalText(system.toolId);
  if (toolId === "other") {
    return options.emptyLabel ?? "Eigenes System";
  }

  if (toolId) {
    return (
      normalizeOptionalText(options.resolveToolName?.(toolId) ?? null) ?? toolId
    );
  }

  return options.emptyLabel ?? "Kein System";
}

export function resolveUseCaseSystemEntries(
  card: Pick<UseCaseCard, "toolId" | "toolFreeText" | "workflow">,
  options: ResolveUseCaseSystemOptions = {}
): ResolvedUseCaseSystemEntry[] {
  return resolveOrderedSystemsFromCard(card).map((system) => ({
    ...system,
    displayName: resolveUseCaseSystemDisplayName(system, options),
  }));
}

export function resolveUseCaseWorkflowDisplay(
  card: Pick<UseCaseCard, "toolId" | "toolFreeText" | "workflow">,
  options: ResolveUseCaseSystemOptions = {}
): UseCaseWorkflowDisplay {
  const systems = resolveUseCaseSystemEntries(card, options);
  const connectionMode =
    normalizeWorkflowConnectionMode(card.workflow?.connectionMode) ?? null;
  const summary = normalizeOptionalText(card.workflow?.summary);

  return {
    systems,
    systemCount: systems.length,
    hasMultipleSystems: systems.length > 1,
    connectionMode,
    connectionModeLabel: connectionMode
      ? WORKFLOW_CONNECTION_MODE_LABELS[connectionMode]
      : null,
    summary,
  };
}

export function resolveUniqueSystemsForCompliance(
  card: Pick<
    UseCaseCard,
    "toolId" | "toolFreeText" | "workflow" | "publicInfo" | "systemPublicInfo"
  >,
  options: ResolveUseCaseSystemOptions = {}
): ResolvedComplianceSystemEntry[] {
  const systems = resolveUseCaseSystemEntries(card, options);
  const primarySystemKey = systems[0]
    ? buildSystemComplianceKey(systems[0], systems[0].displayName)
    : null;
  const deduped = new Map<string, ResolvedComplianceSystemEntry>();

  for (const system of systems) {
    const systemKey = buildSystemComplianceKey(system, system.displayName);
    const existing = deduped.get(systemKey);
    if (existing) {
      existing.occurrenceCount += 1;
      continue;
    }

    const storedInfo = resolveSystemPublicInfo(card, systemKey);
    const legacyInfo =
      primarySystemKey === systemKey ? resolveLegacyPublicInfoFallback(card) : null;
    const providerType =
      storedInfo?.providerType ??
      options.resolveProviderType?.(system) ??
      inferProviderType(system, system.displayName);
    const vendor =
      normalizeOptionalText(storedInfo?.vendor ?? null) ??
      normalizeOptionalText(options.resolveVendor?.(system.toolId ?? "") ?? null) ??
      null;

    deduped.set(systemKey, {
      ...system,
      systemKey,
      vendor,
      providerType,
      publicInfo: storedInfo?.publicInfo ?? legacyInfo,
      publicInfoSource: storedInfo
        ? "system"
        : legacyInfo
          ? "legacy"
          : "none",
      requiresManualDocumentation: providerType === "INTERNAL",
      occurrenceCount: 1,
    });
  }

  return Array.from(deduped.values());
}

export function getUseCaseSystemsSummary(
  card: Pick<UseCaseCard, "toolId" | "toolFreeText" | "workflow">,
  options: ResolveUseCaseSystemOptions = {}
): string {
  const workflow = resolveUseCaseWorkflowDisplay(card, options);
  const [primarySystem, ...additionalSystems] = workflow.systems;

  if (!primarySystem) {
    return options.emptyLabel ?? "Kein System";
  }

  return additionalSystems.length > 0
    ? `${primarySystem.displayName} +${additionalSystems.length}`
    : primarySystem.displayName;
}

export function getUseCaseWorkflowBadge(
  card: Pick<UseCaseCard, "toolId" | "toolFreeText" | "workflow">,
  options: ResolveUseCaseSystemOptions = {}
): string | null {
  const workflow = resolveUseCaseWorkflowDisplay(card, options);
  if (!workflow.hasMultipleSystems) {
    return null;
  }

  const baseLabel = `Mehrsystemig · ${workflow.systemCount} Systeme`;
  return workflow.connectionModeLabel
    ? `${baseLabel} · ${workflow.connectionModeLabel}`
    : baseLabel;
}

export function buildUseCaseWorkflowUpdates(input: {
  orderedSystems: ReadonlyArray<Partial<OrderedUseCaseSystem>>;
  workflow?: Pick<UseCaseWorkflow, "connectionMode" | "summary"> | null;
  createEntryId?: () => string;
}): Pick<UseCaseCard, "toolId" | "toolFreeText" | "workflow"> {
  const storage = splitOrderedSystemsForStorage(input.orderedSystems, {
    workflow: input.workflow ?? undefined,
    createEntryId: input.createEntryId,
  });

  return {
    toolId: storage.toolId,
    toolFreeText: storage.toolFreeText,
    workflow: storage.workflow,
  };
}
