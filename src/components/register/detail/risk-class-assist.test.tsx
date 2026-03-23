import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { RiskClassAssist } from "./risk-class-assist";

test("RiskClassAssist renders compact open state copy when no final class exists", () => {
  const html = renderToStaticMarkup(
    <RiskClassAssist
      suggestion={{
        suggestedRiskClass: "LIMITED",
        signalStrength: "medium",
        reviewRecommended: true,
        reasons: ["Der Einsatzfall betrifft externe Personen."],
        openQuestions: ["Interagieren Nutzer*innen direkt mit KI-Ausgaben?"],
        sourceSignals: ["usage:CUSTOMERS"],
      }}
    />,
  );

  assert.match(html, /Einstufung offen/);
  assert.match(html, /Vorschlag ansehen/);
  assert.match(html, /Kurze Pruefung starten/);
});

test("RiskClassAssist renders expanded suggestion details and actions", () => {
  const html = renderToStaticMarkup(
    <RiskClassAssist
      currentRiskClass="HIGH"
      isHumanConfirmed
      defaultExpanded
      suggestion={{
        suggestedRiskClass: "LIMITED",
        signalStrength: "medium",
        reviewRecommended: true,
        reasons: [
          "Der Zweck deutet auf einen Chatbot- oder Assistenzfall hin.",
        ],
        openQuestions: [
          "Interagieren externe Personen direkt mit KI-generierten Inhalten?",
        ],
        sourceSignals: ["tool-risk:limited"],
      }}
    />,
  );

  assert.match(html, /Menschlich bestaetigt: Hochrisiko/);
  assert.match(html, /Vorschlag: Begrenztes Risiko \(Transparenzpflichten\)/);
  assert.match(html, /Nur Vorschlag\. Keine automatische Einstufung\./);
  assert.match(html, /Als Entwurf uebernehmen/);
  assert.match(html, /Selbst einstufen/);
});
