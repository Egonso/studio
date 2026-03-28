import { appendWorkspaceScope } from '@/lib/navigation/workspace-scope';

export const CONTROL_FOCUS_TARGETS = [
  "metadata",
  "owner",
  "systems",
  "review",
  "oversight",
  "policy",
  "audit",
  "governance",
] as const;

export type ControlFocusTarget = (typeof CONTROL_FOCUS_TARGETS)[number];
export const GOVERNANCE_REPAIR_FIELDS = [
  "oversight",
  "reviewCycle",
  "history",
] as const;

export type GovernanceRepairField = (typeof GOVERNANCE_REPAIR_FIELDS)[number];

interface BuildUseCaseFocusLinkOptions {
  edit?: boolean;
  field?: GovernanceRepairField;
  workspaceScope?: string | null;
}

export function isControlFocusTarget(value: string | null): value is ControlFocusTarget {
  if (!value) return false;
  return (CONTROL_FOCUS_TARGETS as readonly string[]).includes(value);
}

export function isGovernanceRepairField(
  value: string | null
): value is GovernanceRepairField {
  if (!value) return false;
  return (GOVERNANCE_REPAIR_FIELDS as readonly string[]).includes(value);
}

export function buildUseCaseDetailLink(
  useCaseId: string,
  workspaceScope?: string | null,
): string {
  return appendWorkspaceScope(
    `/my-register/${encodeURIComponent(useCaseId)}`,
    workspaceScope,
  );
}

export function buildUseCaseFocusLink(
  useCaseId: string,
  focus: ControlFocusTarget,
  options: BuildUseCaseFocusLinkOptions = {}
): string {
  const params = new URLSearchParams({ focus });

  if (options.edit) {
    params.set("edit", "1");
  }

  if (options.field) {
    params.set("field", options.field);
  }

  return appendWorkspaceScope(
    `${buildUseCaseDetailLink(useCaseId)}?${params.toString()}`,
    options.workspaceScope,
  );
}
