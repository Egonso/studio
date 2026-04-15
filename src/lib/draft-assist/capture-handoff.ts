import type { OrderedUseCaseSystem } from "@/lib/register-first/types";

import { type DraftAssistHandoff } from "./types";

export interface DraftAssistCaptureInitialDraft {
  purpose: string;
  description: string;
  ownerRole: string;
  contactPersonName: string;
  toolId: string;
  toolFreeText: string;
  systems: OrderedUseCaseSystem[];
  workflowConnectionMode: DraftAssistHandoff["captureInput"]["workflow"] extends infer T
    ? T extends { connectionMode?: infer U }
      ? U | null
      : null
    : null;
  workflowSummary: string;
  usageContexts: DraftAssistHandoff["captureInput"]["usageContexts"];
  dataCategories: DraftAssistHandoff["captureInput"]["dataCategories"] extends infer T
    ? T extends Array<infer U>
      ? U[]
      : []
    : [];
  decisionInfluence: DraftAssistHandoff["captureInput"]["decisionInfluence"] extends infer T
    ? T | null
    : null;
}

function buildPrimarySystem(
  handoff: DraftAssistHandoff,
): OrderedUseCaseSystem[] {
  const toolId = handoff.captureInput.toolId;
  const toolFreeText = handoff.captureInput.toolFreeText;

  if (!toolId && !toolFreeText) {
    return [];
  }

  return [
    {
      entryId: "draft_assist_primary",
      position: 1,
      toolId,
      toolFreeText,
    },
  ];
}

export function buildCaptureInitialDraftFromDraftAssistHandoff(
  handoff: DraftAssistHandoff,
): DraftAssistCaptureInitialDraft {
  const systems = [
    ...buildPrimarySystem(handoff),
    ...(handoff.captureInput.workflow?.additionalSystems ?? []).map(
      (system, index) => ({
        entryId: system.entryId,
        position: index + 2,
        toolId: system.toolId,
        toolFreeText: system.toolFreeText,
      }),
    ),
  ];
  const dataCategories =
    handoff.captureInput.dataCategories ??
    (handoff.captureInput.dataCategory
      ? [handoff.captureInput.dataCategory]
      : []);

  return {
    purpose: handoff.captureInput.purpose,
    description: handoff.manifest.summary ?? "",
    ownerRole:
      handoff.captureInput.responsibleParty ??
      handoff.manifest.ownerRole,
    contactPersonName: handoff.captureInput.contactPersonName ?? "",
    toolId: handoff.captureInput.toolId ?? "",
    toolFreeText: handoff.captureInput.toolFreeText ?? "",
    systems,
    workflowConnectionMode:
      handoff.captureInput.workflow?.connectionMode ?? null,
    workflowSummary: handoff.captureInput.workflow?.summary ?? "",
    usageContexts: [...handoff.captureInput.usageContexts],
    dataCategories: [...dataCategories],
    decisionInfluence: handoff.captureInput.decisionInfluence ?? null,
  };
}
