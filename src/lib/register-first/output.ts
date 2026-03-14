import type { RegisterFirstFeatureFlags } from "./flags";
import { getOutputProfileByStatus } from "./status-flow";
import { ensureV1_1Shape } from "./migration";
import { resolveUseCaseWorkflowDisplay } from "./systems";
import { createAiToolsRegistryService } from "./tool-registry-service";
import {
  resolvePrimaryDataCategory,
  type DataCategory,
  type RegisterUseCaseStatus,
  type UseCaseCard,
  type WorkflowConnectionMode,
} from "./types";
import type { ToolType } from "./tool-registry-types";

const aiRegistry = createAiToolsRegistryService();

export type RegisterOutputTier = "RAW" | "REVIEW_HINT" | "REVIEWED" | "PROOF_READY";

export interface StatusGatedOutputState {
  tier: RegisterOutputTier;
  cardJsonEnabled: boolean;
  proofPackDraftEnabled: boolean;
  proofPackDraftBlockedReason: string | null;
}

export interface ProofPackPdfState {
  enabled: boolean;
  blockedReason: string | null;
}

export interface UseCasePassExport {
  schemaVersion: "1.0";
  exportedAt: string;
  outputTier: RegisterOutputTier;
  status: RegisterUseCaseStatus;
  outputProfile: ReturnType<typeof getOutputProfileByStatus>;
  card: UseCaseCard;
}

export interface ProofPackDraftExport {
  schemaVersion: "1.0";
  exportedAt: string;
  useCaseId: string;
  status: "PROOF_READY";
  purpose: string;
  verifyLink: {
    url: string | null;
    isReal: boolean | null;
    isCurrent: boolean | null;
    scope: string | null;
  };
  sourceCard: UseCaseCard;
}

// ── v1.1 Use-Case Pass Export ─────────────────────────────────────────────────

export interface UseCasePassV11ToolInfo {
  toolId: string;
  vendor: string | null;
  productName: string | null;
  toolType: ToolType | null;
  freeText: string | null;
}

export interface UseCasePassV11WorkflowSystemInfo {
  position: number;
  displayName: string;
  toolId: string | null;
  freeText: string | null;
}

export interface UseCasePassV11WorkflowInfo {
  systems: UseCasePassV11WorkflowSystemInfo[];
  connectionMode: WorkflowConnectionMode | null;
  connectionModeLabel: string | null;
  summary: string | null;
}

export interface UseCasePassV11Export {
  schemaVersion: "1.1";
  exportedAt: string;
  globalUseCaseId: string;
  formatVersion: string;
  projectId: string;
  purpose: string;
  tool: UseCasePassV11ToolInfo;
  dataCategory: DataCategory;
  scope: string;
  responsibleRole: string;
  status: RegisterUseCaseStatus;
  createdAtISO: string;
  outputTier: RegisterOutputTier;
  outputProfile: ReturnType<typeof getOutputProfileByStatus>;
  publicHashId: string | null;
  isPublicVisible: boolean;
  workflow: UseCasePassV11WorkflowInfo | null;
  card: UseCaseCard;
}

function resolveOutputTier(status: RegisterUseCaseStatus): RegisterOutputTier {
  if (status === "UNREVIEWED") {
    return "RAW";
  }
  if (status === "REVIEW_RECOMMENDED") {
    return "REVIEW_HINT";
  }
  if (status === "REVIEWED") {
    return "REVIEWED";
  }
  return "PROOF_READY";
}

export function getStatusGatedOutputState(
  status: RegisterUseCaseStatus,
  flags: RegisterFirstFeatureFlags
): StatusGatedOutputState {
  const tier = resolveOutputTier(status);

  if (status !== "PROOF_READY") {
    return {
      tier,
      cardJsonEnabled: true,
      proofPackDraftEnabled: false,
      proofPackDraftBlockedReason:
        "Proof-Pack-Entwurf ist erst im Status PROOF_READY verfuegbar.",
    };
  }

  if (!flags.proofGate) {
    return {
      tier,
      cardJsonEnabled: true,
      proofPackDraftEnabled: false,
      proofPackDraftBlockedReason:
        "Proof-Pack-Entwurf ist aktuell nicht verfügbar.",
    };
  }

  return {
    tier,
    cardJsonEnabled: true,
    proofPackDraftEnabled: true,
    proofPackDraftBlockedReason: null,
  };
}

export function getProofPackPdfState(
  card: UseCaseCard,
  flags: RegisterFirstFeatureFlags
): ProofPackPdfState {
  if (card.status !== "PROOF_READY") {
    return {
      enabled: false,
      blockedReason: "Proof Pack (PDF) ist erst im Status PROOF_READY verfuegbar.",
    };
  }

  if (!flags.proofGate) {
    return {
      enabled: false,
      blockedReason: "Proof Pack (PDF) ist aktuell nicht verfügbar.",
    };
  }

  if (!card.proof) {
    return {
      enabled: false,
      blockedReason:
        "Proof Pack (PDF) braucht Verify-Link Daten: URL + echt/aktuell/scope.",
    };
  }

  return {
    enabled: true,
    blockedReason: null,
  };
}

export function createUseCasePassExport(
  card: UseCaseCard,
  now: Date = new Date()
): UseCasePassExport {
  return {
    schemaVersion: "1.0",
    exportedAt: now.toISOString(),
    outputTier: resolveOutputTier(card.status),
    status: card.status,
    outputProfile: getOutputProfileByStatus(card.status),
    card,
  };
}

/**
 * Resolved tool info for the v1.1 export.
 * Caller must look up vendor/productName/toolType from the ToolRegistryService
 * and pass them here. If the tool is "other" or not found, pass nulls.
 */
export interface ResolvedToolInfo {
  vendor?: string | null;
  productName?: string | null;
  toolType?: ToolType | null;
}

export function createUseCasePassV11Export(
  card: UseCaseCard,
  projectId: string,
  resolvedTool: ResolvedToolInfo = {},
  now: Date = new Date()
): UseCasePassV11Export {
  const normalizedCard = ensureV1_1Shape(card);

  const scopeLabel = normalizedCard.usageContexts.join(", ");
  const responsibleRole = normalizedCard.responsibility.isCurrentlyResponsible
    ? "Erfasser (self)"
    : (normalizedCard.responsibility.responsibleParty ?? "Unbekannt");
  const workflow = resolveUseCaseWorkflowDisplay(normalizedCard, {
    resolveToolName: (toolId) =>
      (toolId === normalizedCard.toolId
        ? resolvedTool.productName ?? null
        : null) ??
      aiRegistry.getById(toolId)?.productName ??
      null,
  });
  const workflowExport =
    workflow.systemCount > 1 || workflow.connectionModeLabel || workflow.summary
      ? {
          systems: workflow.systems.map((system) => ({
            position: system.position,
            displayName: system.displayName,
            toolId: system.toolId ?? null,
            freeText: system.toolFreeText ?? null,
          })),
          connectionMode: workflow.connectionMode,
          connectionModeLabel: workflow.connectionModeLabel,
          summary: workflow.summary,
        }
      : null;

  return {
    schemaVersion: "1.1",
    exportedAt: now.toISOString(),
    globalUseCaseId: normalizedCard.globalUseCaseId ?? normalizedCard.useCaseId,
    formatVersion: normalizedCard.formatVersion ?? "v1.1",
    projectId,
    purpose: normalizedCard.purpose,
    tool: {
      toolId: normalizedCard.toolId ?? "unknown",
      vendor: resolvedTool.vendor ?? null,
      productName: resolvedTool.productName ?? null,
      toolType: resolvedTool.toolType ?? null,
      freeText: normalizedCard.toolFreeText ?? null,
    },
    dataCategory:
      resolvePrimaryDataCategory(normalizedCard) ?? "INTERNAL_CONFIDENTIAL",
    scope: scopeLabel,
    responsibleRole,
    status: normalizedCard.status,
    createdAtISO: normalizedCard.createdAt,
    outputTier: resolveOutputTier(normalizedCard.status),
    outputProfile: getOutputProfileByStatus(normalizedCard.status),
    publicHashId: normalizedCard.publicHashId ?? null,
    isPublicVisible: normalizedCard.isPublicVisible ?? false,
    workflow: workflowExport,
    card: normalizedCard,
  };
}

export function createProofPackDraftExport(
  card: UseCaseCard,
  now: Date = new Date()
): ProofPackDraftExport {
  if (card.status !== "PROOF_READY") {
    throw new Error("Proof pack draft export requires status PROOF_READY.");
  }

  return {
    schemaVersion: "1.0",
    exportedAt: now.toISOString(),
    useCaseId: card.useCaseId,
    status: "PROOF_READY",
    purpose: card.purpose,
    verifyLink: {
      url: card.proof?.verifyUrl ?? null,
      isReal: card.proof?.verification.isReal ?? null,
      isCurrent: card.proof?.verification.isCurrent ?? null,
      scope: card.proof?.verification.scope ?? null,
    },
    sourceCard: card,
  };
}

export function serializePrettyJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function getUseCasePassFileName(useCaseId: string): string {
  return `euki-use-case-pass-${useCaseId}.json`;
}

export function getProofPackDraftFileName(useCaseId: string): string {
  return `euki-proof-pack-draft-${useCaseId}.json`;
}

export function getUseCasePassV11FileName(globalUseCaseId: string): string {
  return `euki-use-case-pass-v11-${globalUseCaseId}.json`;
}
