import type { RegisterFirstFeatureFlags } from "./flags";
import { getOutputProfileByStatus } from "./status-flow.ts";
import type { DataCategory, RegisterUseCaseStatus, UseCaseCard } from "./types";
import type { ToolType } from "./tool-registry-types";

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
        "Proof-Pack-Entwurf ist per Feature-Flag deaktiviert (registerFirst.proofGate=false).",
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
      blockedReason:
        "Proof Pack (PDF) ist per Feature-Flag deaktiviert (registerFirst.proofGate=false).",
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
  if (card.cardVersion !== "1.1") {
    throw new Error("v1.1 export requires a v1.1 use case card.");
  }

  const scopeLabel = card.usageContexts.join(", ");
  const responsibleRole = card.responsibility.isCurrentlyResponsible
    ? "Erfasser (self)"
    : (card.responsibility.responsibleParty ?? "Unbekannt");

  return {
    schemaVersion: "1.1",
    exportedAt: now.toISOString(),
    globalUseCaseId: card.globalUseCaseId ?? card.useCaseId,
    formatVersion: card.formatVersion ?? "v1.1",
    projectId,
    purpose: card.purpose,
    tool: {
      toolId: card.toolId ?? "unknown",
      vendor: resolvedTool.vendor ?? null,
      productName: resolvedTool.productName ?? null,
      toolType: resolvedTool.toolType ?? null,
      freeText: card.toolFreeText ?? null,
    },
    dataCategory: card.dataCategory ?? "INTERNAL",
    scope: scopeLabel,
    responsibleRole,
    status: card.status,
    createdAtISO: card.createdAt,
    outputTier: resolveOutputTier(card.status),
    outputProfile: getOutputProfileByStatus(card.status),
    publicHashId: card.publicHashId ?? null,
    isPublicVisible: card.isPublicVisible ?? false,
    card,
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
