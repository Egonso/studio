import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  DraftAssistPanelView,
  requestDraftAssistResult,
  validateDraftAssistDescription,
} from "./draft-assist-panel";

test("draft assist panel returns a clean validation error for too-short descriptions", () => {
  const error = validateDraftAssistDescription("Zu kurz");
  assert.ok(error);
  assert.match(error, /mindestens 2-5 Saetzen oder ca\. 50 Zeichen/);
});

test("draft assist panel renders a ready_for_handoff result with takeover action", () => {
  const html = renderToStaticMarkup(
    <DraftAssistPanelView
      description="Unser Support-Team nutzt ChatGPT, um erste Antwortentwuerfe fuer Kundenanfragen zu formulieren. Vor dem Versand prueft ein Mensch jede Antwort."
      mode="register"
      result={{
        draft: {
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
        meta: {
          confidence: "medium",
          missingFacts: [],
          assumptions: [],
        },
        verifier: {
          schemaValid: true,
          captureMappingValid: true,
          missingFacts: [],
          duplicateHints: [
            'Aehnlicher bestehender Use Case im Register: "Support-Antworten mit GPT" (Status: REVIEWED | System: ChatGPT).',
          ],
          reviewTriggers: [],
          riskSuggestion: null,
          openQuestions: [],
          verdict: "ready_for_handoff",
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
      }}
    />,
  );

  assert.match(html, /Noch nichts gespeichert/);
  assert.match(html, /Reviewbar/);
  assert.match(html, /In Quick Capture uebernehmen/);
  assert.match(html, /Moeglicher Doppel-Eintrag/);
});

test("draft assist panel renders open questions for needs_input results", () => {
  const html = renderToStaticMarkup(
    <DraftAssistPanelView
      description="Wir nutzen ein KI-System fuer die Vorauswahl von Bewerbungen und wollen schneller priorisieren, bevor Recruiter final entscheiden."
      mode="register"
      result={{
        draft: {
          documentationType: "application",
          title: "KI-gestuetzte Bewerbungs-Vorauswahl",
          purpose:
            "Ein KI-System soll Bewerbungen fuer eine menschliche Vorauswahl strukturieren und priorisieren.",
          ownerRole: "People Lead",
          usageContexts: ["APPLICANTS"],
          decisionInfluence: "PREPARATION",
          dataCategories: [],
          systems: [{ position: 1, name: "Nicht spezifiziertes KI-System" }],
          triggers: [],
          steps: [],
          humansInLoop: [],
          risks: [],
          controls: [],
          artifacts: [],
          tags: [],
        },
        meta: {
          confidence: "low",
          missingFacts: [
            "Welches konkrete KI-System wird genutzt?",
          ],
          assumptions: [],
        },
        verifier: {
          schemaValid: true,
          captureMappingValid: true,
          missingFacts: ["Welches konkrete KI-System wird genutzt?"],
          duplicateHints: [
            'Aehnlicher bestehender Use Case im Register: "Bewerbungen fuer menschliche Vorauswahl strukturieren" (Status: REVIEWED | System: Greenhouse \\+ KI-Modul).',
          ],
          reviewTriggers: [],
          riskSuggestion: null,
          openQuestions: [
            "Welches konkrete KI-System oder welcher Anbieter wird fuer die Vorauswahl genutzt?",
            "Welche personenbezogenen oder sensiblen Daten werden fuer die Vorauswahl verarbeitet?",
          ],
          verdict: "needs_input",
        },
        questions: [
          "Welches konkrete KI-System oder welcher Anbieter wird fuer die Vorauswahl genutzt?",
          "Welche personenbezogenen oder sensiblen Daten werden fuer die Vorauswahl verarbeitet?",
        ],
        handoff: {
          source: "draft_assist_v1",
          manifest: {
            documentationType: "application",
            title: "KI-gestuetzte Bewerbungs-Vorauswahl",
            purpose:
              "Ein KI-System soll Bewerbungen fuer eine menschliche Vorauswahl strukturieren und priorisieren.",
            ownerRole: "People Lead",
            usageContexts: ["APPLICANTS"],
            decisionInfluence: "PREPARATION",
            dataCategories: [],
            systems: [{ position: 1, name: "Nicht spezifiziertes KI-System" }],
            triggers: [],
            steps: [],
            humansInLoop: [],
            risks: [],
            controls: [],
            artifacts: [],
            tags: [],
          },
          captureInput: {
            purpose:
              "Ein KI-System soll Bewerbungen fuer eine menschliche Vorauswahl strukturieren und priorisieren.",
            usageContexts: ["APPLICANTS"],
            isCurrentlyResponsible: false,
            responsibleParty: "People Lead",
            contactPersonName: null,
            decisionInfluence: "PREPARATION",
            dataCategories: [],
            organisation: null,
          },
        },
      }}
    />,
  );

  assert.match(html, /Rueckfragen offen/);
  assert.match(html, /Offene Rueckfragen/);
  assert.match(html, /Welches konkrete KI-System/);
  assert.match(html, /Moeglicher Doppel-Eintrag/);
  assert.match(html, /Mit Entwurf in Quick Capture weiter/);
});

test("draft assist request helper returns a result but persists nothing before explicit acceptance", async () => {
  let requestCount = 0;

  const result = await requestDraftAssistResult(
    {
      description:
        "Unser Support-Team nutzt ChatGPT, um erste Antwortentwuerfe fuer Kundenanfragen zu formulieren. Vor dem Versand prueft ein Mensch jede Antwort.",
      context: null,
    },
    {
      async getIdToken() {
        return null;
      },
      async fetchImpl() {
        requestCount += 1;
        return new Response(
          JSON.stringify({
            draft: {
              documentationType: "application",
              title: "Support-Antwortentwuerfe mit ChatGPT",
              purpose:
                "ChatGPT erstellt erste Antwortentwuerfe fuer Kundenanfragen, die vor dem Versand durch einen Menschen geprueft werden.",
              ownerRole: "Support Lead",
              usageContexts: ["CUSTOMERS"],
              decisionInfluence: "PREPARATION",
              dataCategories: ["PERSONAL_DATA"],
              systems: [{ position: 1, name: "ChatGPT", providerType: "MODEL" }],
              triggers: [],
              steps: [],
              humansInLoop: [],
              risks: [],
              controls: [],
              artifacts: [],
              tags: [],
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
              riskSuggestion: null,
              openQuestions: [],
              verdict: "ready_for_handoff",
            },
            questions: [],
            handoff: null,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      },
    },
  );

  assert.equal(requestCount, 1);
  assert.equal(result.verifier.verdict, "ready_for_handoff");
  assert.equal(result.handoff, null);
});
