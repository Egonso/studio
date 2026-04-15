import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { resolve } from "node:path";

import type { DraftAssistAssistResult } from "@/lib/draft-assist/types";
import type { PublicRateLimitDecision } from "@/lib/security/public-rate-limit";

import { createDraftAssistPostHandler } from "./handler";

function readSource(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const routeSource = readSource("src/app/api/draft-assist/route.ts");

function allowRateLimit(): PublicRateLimitDecision {
  return {
    ok: true,
    source: "memory",
    retryAfterMs: 0,
  };
}

const successResult: DraftAssistAssistResult = {
  draft: {
    documentationType: "application" as const,
    title: "Support-Antwortentwuerfe mit ChatGPT",
    summary: "ChatGPT erstellt erste Entwuerfe fuer Support-Antworten.",
    purpose:
      "ChatGPT erstellt erste Antwortentwuerfe fuer Kundenanfragen, die vor dem Versand durch einen Menschen geprueft werden.",
    ownerRole: "Support Lead",
    usageContexts: ["CUSTOMERS"],
    decisionInfluence: "PREPARATION" as const,
    dataCategories: ["PERSONAL_DATA"],
    systems: [{ position: 1, name: "ChatGPT", providerType: "MODEL" }],
    triggers: [],
    steps: ["Support prueft jede Antwort vor dem Versand"],
    humansInLoop: ["Support prueft jede Antwort vor dem Versand"],
    risks: [],
    controls: ["Manuelle Freigabe bleibt verpflichtend"],
    artifacts: ["Support-Antwortentwurf"],
    tags: ["support"],
  },
  meta: {
    confidence: "medium",
    missingFacts: [],
    assumptions: [],
  },
  verifier: {
    schemaValid: true,
    captureMappingValid: true,
    missingFacts: [],
    duplicateHints: [],
    reviewTriggers: [],
    riskSuggestion: {
      suggestedRiskClass: "LIMITED" as const,
      signalStrength: "medium" as const,
      reviewRecommended: true,
      reasons: ["Kundenseitige KI-Ausgaben deuten auf Transparenzpflichten hin."],
      openQuestions: [],
      sourceSignals: ["usage:CUSTOMERS"],
    },
    openQuestions: [],
      verdict: "ready_for_handoff" as const,
    },
    questions: [],
    handoff: {
      source: "draft_assist_v1",
      manifest: {
        documentationType: "application",
        title: "Support-Antwortentwuerfe mit ChatGPT",
        summary: "ChatGPT erstellt erste Entwuerfe fuer Support-Antworten.",
      purpose:
        "ChatGPT erstellt erste Antwortentwuerfe fuer Kundenanfragen, die vor dem Versand durch einen Menschen geprueft werden.",
      ownerRole: "Support Lead",
        usageContexts: ["CUSTOMERS"],
        decisionInfluence: "PREPARATION",
        dataCategories: ["PERSONAL_DATA"],
        systems: [{ position: 1, name: "ChatGPT", providerType: "MODEL" }],
      triggers: [],
      steps: ["Support prueft jede Antwort vor dem Versand"],
      humansInLoop: ["Support prueft jede Antwort vor dem Versand"],
      risks: [],
      controls: ["Manuelle Freigabe bleibt verpflichtend"],
      artifacts: ["Support-Antwortentwurf"],
      tags: ["support"],
    },
      captureInput: {
        purpose:
          "ChatGPT erstellt erste Antwortentwuerfe fuer Kundenanfragen, die vor dem Versand durch einen Menschen geprueft werden.",
        usageContexts: ["CUSTOMERS"],
        isCurrentlyResponsible: false,
        responsibleParty: "Support Lead",
        contactPersonName: null,
        decisionInfluence: "PREPARATION",
        toolId: "other",
        toolFreeText: "ChatGPT",
        dataCategories: ["PERSONAL_DATA"],
        organisation: null,
      },
    },
};

test("draft assist route rejects invalid descriptions with a clean 400", async () => {
  const handler = createDraftAssistPostHandler({
    async generate() {
      throw new Error("should not run");
    },
    async enforceRateLimit() {
      return allowRateLimit();
    },
  });

  const response = await handler(
    new Request("http://localhost/api/draft-assist", {
      method: "POST",
      body: JSON.stringify({
        description: "Zu kurz",
      }),
    }),
  );

  assert.equal(response.status, 400);
  assert.match(await response.text(), /Beschreibung ist erforderlich|Beschreibung ist zu lang/);
});

test("draft assist route returns plain JSON results for valid requests", async () => {
  let receivedContext: unknown = null;

  const handler = createDraftAssistPostHandler({
    async generate(input) {
      receivedContext = input.context;
      return successResult;
    },
    async enforceRateLimit() {
      return allowRateLimit();
    },
  });

  const response = await handler(
    new Request("http://localhost/api/draft-assist", {
      method: "POST",
      body: JSON.stringify({
        description:
          "Unser Support-Team nutzt ChatGPT, um erste Antwortentwuerfe fuer Kundenanfragen zu formulieren. Vor dem Versand prueft ein Mensch jede Antwort.",
        context: {
          registerId: "reg_demo",
          registerName: "Demo Register",
          organisationName: "Acme GmbH",
          organisationUnit: "Support",
          policyTitles: ["AI Policy"],
          existingUseCaseCount: 1,
          existingUseCases: [],
        },
      }),
    }),
  );

  const json = await response.json();
  assert.equal(response.status, 200);
  assert.equal(json.verifier.verdict, "ready_for_handoff");
  assert.equal(json.handoff.source, "draft_assist_v1");
  assert.deepEqual(receivedContext, {
    registerId: "reg_demo",
    registerName: "Demo Register",
    organisationName: "Acme GmbH",
    organisationUnit: "Support",
    policyTitles: ["AI Policy"],
    existingUseCaseCount: 1,
    existingUseCases: [],
  });
});

test("draft assist route stays assistive and does not persist captures itself", () => {
  assert.doesNotMatch(routeSource, /createUseCaseFromCapture/);
  assert.doesNotMatch(routeSource, /updateUseCase/);
  assert.doesNotMatch(routeSource, /aiSystems/);
});
