export const CONTROL_FOCUS_TARGETS = [
  "owner",
  "review",
  "oversight",
  "policy",
  "audit",
] as const;

export type ControlFocusTarget = (typeof CONTROL_FOCUS_TARGETS)[number];

export function isControlFocusTarget(value: string | null): value is ControlFocusTarget {
  if (!value) return false;
  return (CONTROL_FOCUS_TARGETS as readonly string[]).includes(value);
}

export function buildUseCaseFocusLink(
  useCaseId: string,
  focus: ControlFocusTarget
): string {
  return `/my-register/${encodeURIComponent(useCaseId)}?focus=${focus}`;
}

