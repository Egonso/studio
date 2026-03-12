import { POLICY_STATUS_LABELS, type PolicyDocument } from "@/lib/policy-engine/types";
import type { UseCaseCard } from "./types";

export interface WorkflowLinkEntry {
  reference: string;
  isResolved: boolean;
  title: string;
  meta: string;
}

function normalizeWorkflowReference(value: string): string {
  return value.trim().toLowerCase();
}

function isLikelyUrl(value: string): boolean {
  try {
    const candidate = new URL(value);
    return candidate.protocol === "http:" || candidate.protocol === "https:";
  } catch {
    return false;
  }
}

export function getWorkflowLinkReferences(
  source: Pick<UseCaseCard, "governanceAssessment"> | string[]
): string[] {
  const rawReferences = Array.isArray(source)
    ? source
    : source.governanceAssessment?.flex?.policyLinks ?? [];

  const seen = new Set<string>();
  const references: string[] = [];

  for (const value of rawReferences) {
    const trimmed = value.trim();
    if (trimmed.length === 0) continue;

    const normalized = normalizeWorkflowReference(trimmed);
    if (seen.has(normalized)) continue;

    seen.add(normalized);
    references.push(trimmed);
  }

  return references;
}

export function hasWorkflowLinkReference(
  references: string[],
  reference: string
): boolean {
  const normalizedReference = normalizeWorkflowReference(reference);
  return getWorkflowLinkReferences(references).some(
    (entry) => normalizeWorkflowReference(entry) === normalizedReference
  );
}

export function toggleWorkflowLinkReference(
  references: string[],
  reference: string
): string[] {
  const trimmed = reference.trim();
  if (trimmed.length === 0) {
    return getWorkflowLinkReferences(references);
  }

  if (hasWorkflowLinkReference(references, trimmed)) {
    return removeWorkflowLinkReference(references, trimmed);
  }

  return [...getWorkflowLinkReferences(references), trimmed];
}

export function removeWorkflowLinkReference(
  references: string[],
  reference: string
): string[] {
  const normalizedReference = normalizeWorkflowReference(reference);
  return getWorkflowLinkReferences(references).filter(
    (entry) => normalizeWorkflowReference(entry) !== normalizedReference
  );
}

export function resolveWorkflowLinkEntries(
  source: Pick<UseCaseCard, "governanceAssessment"> | string[],
  policies: PolicyDocument[]
): WorkflowLinkEntry[] {
  const policyById = new Map(
    policies.map((policy) => [normalizeWorkflowReference(policy.policyId), policy])
  );

  return getWorkflowLinkReferences(source).map((reference) => {
    const linkedPolicy = policyById.get(normalizeWorkflowReference(reference));

    if (linkedPolicy) {
      return {
        reference,
        isResolved: true,
        title: linkedPolicy.title,
        meta: `${POLICY_STATUS_LABELS[linkedPolicy.status]} · ${linkedPolicy.policyId}`,
      } satisfies WorkflowLinkEntry;
    }

    return {
      reference,
      isResolved: false,
      title: reference,
      meta: isLikelyUrl(reference)
        ? "Direkte Dokumentreferenz"
        : "Dokumentreferenz ohne Register-Dokument",
    } satisfies WorkflowLinkEntry;
  });
}
