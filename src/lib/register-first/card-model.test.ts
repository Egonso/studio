import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeUseCaseWorkflow,
  resolveOrderedSystemsFromCard,
  splitOrderedSystemsForStorage,
} from "./card-model";

test("normalizeUseCaseWorkflow canonicalizes additional systems and metadata", () => {
  const workflow = normalizeUseCaseWorkflow({
    additionalSystems: [
      {
        entryId: "step_b",
        position: 4,
        toolFreeText: "Interne Recherche API",
      },
      {
        entryId: "step_a",
        position: 2,
        toolId: "gemini_api",
      },
      {
        entryId: "empty",
        position: 7,
      },
    ],
    connectionMode: "semi_automated",
    summary: "  Recherche -> Entwurf  ",
  });

  assert.deepEqual(workflow, {
    additionalSystems: [
      {
        entryId: "step_a",
        position: 2,
        toolId: "gemini_api",
        toolFreeText: undefined,
      },
      {
        entryId: "step_b",
        position: 3,
        toolId: "other",
        toolFreeText: "Interne Recherche API",
      },
    ],
    connectionMode: "SEMI_AUTOMATED",
    summary: "Recherche -> Entwurf",
  });
});

test("resolveOrderedSystemsFromCard returns one ordered list across primary and workflow systems", () => {
  const orderedSystems = resolveOrderedSystemsFromCard({
    toolId: "perplexity_api",
    workflow: {
      additionalSystems: [
        {
          entryId: "step_2",
          position: 2,
          toolId: "gemini_api",
        },
        {
          entryId: "step_3",
          position: 3,
          toolId: "other",
          toolFreeText: "Interner Bild-Webhook",
        },
      ],
      connectionMode: "FULLY_AUTOMATED",
      summary: "Research -> Draft -> Image",
    },
  });

  assert.deepEqual(orderedSystems, [
    {
      entryId: "primary",
      position: 1,
      toolId: "perplexity_api",
      toolFreeText: undefined,
    },
    {
      entryId: "step_2",
      position: 2,
      toolId: "gemini_api",
      toolFreeText: undefined,
    },
    {
      entryId: "step_3",
      position: 3,
      toolId: "other",
      toolFreeText: "Interner Bild-Webhook",
    },
  ]);
});

test("splitOrderedSystemsForStorage mirrors the first system into top-level fields", () => {
  const storage = splitOrderedSystemsForStorage(
    [
      {
        entryId: "primary_tmp",
        position: 1,
        toolId: "perplexity_api",
      },
      {
        position: 2,
        toolId: "gemini_api",
      },
      {
        entryId: "step_3",
        position: 3,
        toolFreeText: "Interne Freigabe-API",
      },
    ],
    {
      workflow: {
        connectionMode: "FULLY_AUTOMATED",
        summary: "Research -> Draft -> Approval",
      },
      createEntryId: () => "generated_step",
    }
  );

  assert.deepEqual(storage, {
    toolId: "perplexity_api",
    toolFreeText: undefined,
    workflow: {
      additionalSystems: [
        {
          entryId: "generated_step",
          position: 2,
          toolId: "gemini_api",
          toolFreeText: undefined,
        },
        {
          entryId: "step_3",
          position: 3,
          toolId: "other",
          toolFreeText: "Interne Freigabe-API",
        },
      ],
      connectionMode: "FULLY_AUTOMATED",
      summary: "Research -> Draft -> Approval",
    },
  });
});
