import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { landingPageContent } from "./content";

export function runLandingPageContentSmoke() {
  assert.equal(
    landingPageContent.hero.primaryCta.label,
    "KI-Anwendung jetzt erfassen"
  );
  assert.equal(landingPageContent.hero.secondaryCta.label, "Register öffnen");
  assert.equal(
    landingPageContent.problem.title,
    "Schatten-KI ist der Normalzustand."
  );
  assert.equal(
    landingPageContent.solution.title,
    "Transparenz ist der erste Schritt."
  );
  assert.equal(
    landingPageContent.free.title,
    "Dokumentation ist kein Premium-Feature."
  );
  assert.equal(
    landingPageContent.extension.title,
    "Wenn Organisationen ihre KI systematisch steuern wollen."
  );
  assert.equal(landingPageContent.closing.title, "Beginnen Sie mit Transparenz.");

  const corpus = JSON.stringify(landingPageContent).toLowerCase();

  assert.ok(
    corpus.includes("quick capture") && corpus.includes("unter 30 sekunden"),
    "Quick Capture muss sichtbar verankert sein."
  );
  assert.ok(
    corpus.includes("dauerhaft kostenlos"),
    "Der dauerhaft kostenlose Standard muss klar genannt sein."
  );
  assert.ok(
    corpus.includes("eu ai act") || corpus.includes("eu-ai-act"),
    "EU AI Act Bezug muss enthalten sein."
  );

  const blockedTerms = [
    "upgrade auf pro",
    "jetzt aktivieren",
    "ab 10 use cases",
    "funnel",
  ];
  for (const term of blockedTerms) {
    assert.ok(!corpus.includes(term), `Unerwünschter Funnel-Begriff: ${term}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]!).href) {
  runLandingPageContentSmoke();
  console.log("Landingpage content smoke passed.");
}
