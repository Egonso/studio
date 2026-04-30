import assert from "node:assert/strict";
import test from "node:test";

import {
  createUseCaseSystemPublicInfoEntry,
  buildUseCaseWorkflowUpdates,
  getUseCaseSystemSectionMode,
  getUseCaseSystemsSummary,
  getUseCaseWorkflowBadge,
  hasUseCaseWorkflowMetadata,
  resolveUniqueSystemsForCompliance,
  resolveUseCaseWorkflowDisplay,
} from "./systems";

test("resolveUseCaseWorkflowDisplay returns ordered systems with workflow metadata", () => {
  const workflow = resolveUseCaseWorkflowDisplay({
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
      connectionMode: "SEMI_AUTOMATED",
      summary: "Recherche -> Text -> Bild",
    },
  });

  assert.equal(workflow.systemCount, 3);
  assert.equal(workflow.hasMultipleSystems, true);
  assert.equal(workflow.connectionModeLabel, "Teilweise automatisiert");
  assert.equal(workflow.summary, "Recherche -> Text -> Bild");
  assert.equal(workflow.systems[0]?.displayName, "perplexity_api");
  assert.equal(workflow.systems[2]?.displayName, "Interner Bild-Webhook");
});

test("getUseCaseSystemsSummary and badge stay compact", () => {
  const card = {
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
          toolFreeText: "Sora",
        },
      ],
      connectionMode: "FULLY_AUTOMATED" as const,
    },
  };

  assert.equal(getUseCaseSystemsSummary(card), "perplexity_api +2");
  assert.equal(
    getUseCaseWorkflowBadge(card),
    "Mehrsystemig · 3 Systeme · Weitgehend automatisiert"
  );
  assert.equal(
    getUseCaseWorkflowBadge(card, { locale: "en" }),
    "Multi-system · 3 systems · Mostly automated"
  );
});

test("buildUseCaseWorkflowUpdates splits primary and additional systems for storage", () => {
  const updates = buildUseCaseWorkflowUpdates({
    orderedSystems: [
      {
        entryId: "primary",
        position: 1,
        toolId: "other",
        toolFreeText: "Perplexity API",
      },
      {
        entryId: "step_2",
        position: 2,
        toolId: "other",
        toolFreeText: "Gemini API",
      },
      {
        entryId: "step_3",
        position: 3,
        toolId: "other",
        toolFreeText: "Sora",
      },
    ],
    workflow: {
      connectionMode: "SEMI_AUTOMATED",
      summary: "Recherche -> Text -> Bild",
    },
  });

  assert.equal(updates.toolId, "other");
  assert.equal(updates.toolFreeText, "Perplexity API");
  assert.equal(updates.workflow?.connectionMode, "SEMI_AUTOMATED");
  assert.equal(updates.workflow?.additionalSystems.length, 2);
  assert.equal(updates.workflow?.additionalSystems[0]?.toolFreeText, "Gemini API");
});

test("buildUseCaseWorkflowUpdates collapses back to a single primary system", () => {
  const updates = buildUseCaseWorkflowUpdates({
    orderedSystems: [
      {
        entryId: "primary",
        position: 1,
        toolId: "other",
        toolFreeText: "Perplexity API",
      },
    ],
  });

  assert.equal(updates.toolId, "other");
  assert.equal(updates.toolFreeText, "Perplexity API");
  assert.equal(updates.workflow, undefined);
});

test("getUseCaseSystemSectionMode keeps plain single-system cards compact", () => {
  const mode = getUseCaseSystemSectionMode({
    toolId: "other",
    toolFreeText: "Midjourney",
  });

  assert.equal(mode, "single");
  assert.equal(
    hasUseCaseWorkflowMetadata({
      workflow: undefined,
    }),
    false
  );
});

test("getUseCaseSystemSectionMode upgrades to multi when workflow metadata exists", () => {
  const mode = getUseCaseSystemSectionMode({
    toolId: "other",
    toolFreeText: "Gemini",
    workflow: {
      additionalSystems: [],
      connectionMode: "SEMI_AUTOMATED",
      summary: "Entwurf -> Freigabe",
    },
  });

  assert.equal(mode, "multi");
  assert.equal(
    hasUseCaseWorkflowMetadata({
      workflow: {
        additionalSystems: [],
        connectionMode: "SEMI_AUTOMATED",
        summary: "Entwurf -> Freigabe",
      },
    }),
    true
  );
});

test("resolveUniqueSystemsForCompliance deduplicates repeated workflow systems", () => {
  const systems = resolveUniqueSystemsForCompliance({
    toolId: "other",
    toolFreeText: "Perplexity API",
    workflow: {
      additionalSystems: [
        {
          entryId: "step_2",
          position: 2,
          toolId: "other",
          toolFreeText: "DeepL",
        },
        {
          entryId: "step_3",
          position: 3,
          toolId: "other",
          toolFreeText: "DeepL",
        },
      ],
    },
  });

  assert.equal(systems.length, 2);
  assert.equal(systems[1]?.displayName, "DeepL");
  assert.equal(systems[1]?.occurrenceCount, 2);
});

test("resolveUniqueSystemsForCompliance falls back to legacy publicInfo for the primary system", () => {
  const systems = resolveUniqueSystemsForCompliance({
    toolId: "other",
    toolFreeText: "Perplexity API",
    publicInfo: {
      lastCheckedAt: "2026-03-14T09:00:00.000Z",
      checker: "perplexity",
      summary: "Legacy fallback",
      flags: {
        gdprClaim: "yes",
        aiActClaim: "not_found",
        trustCenterFound: "yes",
        privacyPolicyFound: "yes",
        dpaOrSccMention: "no",
      },
      confidence: "medium",
      sources: [],
      disclaimerVersion: "v1",
    },
  });

  assert.equal(systems.length, 1);
  assert.equal(systems[0]?.publicInfo?.summary, "Legacy fallback");
  assert.equal(systems[0]?.publicInfoSource, "legacy");
});

test("createUseCaseSystemPublicInfoEntry stores stable keys for saved compliance info", () => {
  const entry = createUseCaseSystemPublicInfoEntry({
    system: {
      toolId: "other",
      toolFreeText: "Perplexity API",
    },
    displayName: "Perplexity API",
    vendor: "Perplexity",
    providerType: "API",
    publicInfo: {
      lastCheckedAt: "2026-03-14T09:00:00.000Z",
      checker: "perplexity",
      summary: "Documented",
      flags: {
        gdprClaim: "yes",
        aiActClaim: "not_found",
        trustCenterFound: "yes",
        privacyPolicyFound: "yes",
        dpaOrSccMention: "yes",
      },
      confidence: "high",
      sources: [],
      disclaimerVersion: "v1",
    },
  });

  assert.equal(entry.systemKey, "name:perplexity api");
  assert.equal(entry.providerType, "API");
  assert.equal(entry.displayName, "Perplexity API");
});
