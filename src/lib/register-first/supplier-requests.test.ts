import assert from "node:assert/strict";
import test from "node:test";

import {
  parseSupplierRequestSubmission,
  createSupplierRequestUseCase,
  getSupplierRequestContact,
  isSupplierRequestCard,
  normalizeSupplierRequestDataCategories,
  SUPPLIER_REQUEST_DEFAULT_USAGE_CONTEXT,
  SUPPLIER_REQUEST_FILTER,
} from "./supplier-requests";

test("createSupplierRequestUseCase erzeugt eine schema-kompatible Registerkarte", () => {
  const now = new Date("2026-03-12T08:15:00.000Z");
  const card = createSupplierRequestUseCase(
    {
      supplierEmail: "vendor@example.com",
      supplierOrganisation: "Lieferant GmbH",
      toolName: "SuperAgent AI",
      purpose: "Unterstuetzt den First-Level-Support bei eingehenden Anfragen.",
      dataCategory: "PERSONAL_DATA",
      aiActCategory: "Geringes Risiko",
    },
    {
      useCaseId: "uc_supplier_1",
      now,
      organisationName: "Muster GmbH",
    }
  );

  assert.equal(card.cardVersion, "1.1");
  assert.equal(card.status, "UNREVIEWED");
  assert.equal(card.toolId, "other");
  assert.equal(card.toolFreeText, "SuperAgent AI");
  assert.deepEqual(card.usageContexts, [SUPPLIER_REQUEST_DEFAULT_USAGE_CONTEXT]);
  assert.equal(card.responsibility.responsibleParty, "vendor@example.com");
  assert.equal(card.dataCategory, "PERSONAL_DATA");
  assert.deepEqual(card.dataCategories, ["PERSONAL_DATA"]);
  assert.equal(card.organisation, "Muster GmbH");
  assert.equal(card.governanceAssessment?.core?.aiActCategory, "Geringes Risiko");
  assert.equal(card.createdAt, now.toISOString());
  assert.equal(card.updatedAt, now.toISOString());
  assert.equal(card.capturedBy, "SUPPLIER_REQUEST");
  assert.equal(card.origin?.source, "supplier_request");
  assert.equal(card.origin?.submittedByEmail, "vendor@example.com");
  assert.equal(card.origin?.submittedByName, "Lieferant GmbH");
  assert.ok(isSupplierRequestCard(card));
  assert.equal(getSupplierRequestContact(card), "vendor@example.com");
  assert.ok(card.reviewHints.includes("Lieferantenanfrage eingegangen."));
});

test("getSupplierRequestContact nutzt den Registerwert als Fallback", () => {
  const contact = getSupplierRequestContact({
    labels: [],
    responsibility: {
      isCurrentlyResponsible: false,
      responsibleParty: "fallback@example.com",
    },
  });

  assert.equal(contact, "fallback@example.com");
  assert.equal(SUPPLIER_REQUEST_FILTER, "supplier_requests");
});

test("parseSupplierRequestSubmission normalisiert weitere Systeme und Ablaufmetadaten", () => {
  const submission = parseSupplierRequestSubmission({
    supplierEmail: "vendor@example.com",
    supplierOrganisation: "Lieferant GmbH",
    toolName: "Perplexity API",
    systems: [
      "Perplexity API",
      "Gemini API",
      "Interner Freigabe-Webhook",
    ],
    purpose: "Unterstuetzt die Content-Produktion fuer Marketingtexte.",
    dataCategory: "PERSONAL_DATA",
    aiActCategory: "Geringes Risiko",
    workflowConnectionMode: "semi_automated",
    workflowSummary: "Recherche -> Entwurf -> Freigabe",
  });

  assert.equal(submission.toolName, "Perplexity API");
  assert.equal(submission.workflow?.connectionMode, "SEMI_AUTOMATED");
  assert.equal(submission.workflow?.summary, "Recherche -> Entwurf -> Freigabe");
  assert.deepEqual(submission.workflow?.additionalSystems, [
    {
      entryId: "supplier_system_3",
      position: 2,
      toolId: "other",
      toolFreeText: "Gemini API",
    },
    {
      entryId: "supplier_system_4",
      position: 3,
      toolId: "other",
      toolFreeText: "Interner Freigabe-Webhook",
    },
  ]);
});

test("createSupplierRequestUseCase uebernimmt den Mehrsystem-Ablauf in die Registerkarte", () => {
  const card = createSupplierRequestUseCase(
    {
      supplierEmail: "vendor@example.com",
      supplierOrganisation: "Lieferant GmbH",
      toolName: "Perplexity API",
      systems: [
        "Perplexity API",
        "Gemini API",
        "Interner Freigabe-Webhook",
      ],
      purpose: "Unterstuetzt die Content-Produktion fuer Marketingtexte.",
      dataCategory: "PERSONAL_DATA",
      aiActCategory: "Geringes Risiko",
      workflowConnectionMode: "FULLY_AUTOMATED",
      workflowSummary: "Recherche -> Entwurf -> Freigabe",
    },
    {
      useCaseId: "uc_supplier_2",
      now: new Date("2026-03-12T11:00:00.000Z"),
    }
  );

  assert.equal(card.toolFreeText, "Perplexity API");
  assert.equal(card.workflow?.connectionMode, "FULLY_AUTOMATED");
  assert.equal(card.workflow?.additionalSystems.length, 2);
  assert.equal(card.workflow?.additionalSystems[0].toolFreeText, "Gemini API");
});

test("parseSupplierRequestSubmission normalisiert mehrere Datenkategorien rueckwaertskompatibel", () => {
  const submission = parseSupplierRequestSubmission({
    supplierEmail: "vendor@example.com",
    supplierOrganisation: "Lieferant GmbH",
    toolName: "SuperAgent AI",
    purpose: "Unterstuetzt den Support.",
    dataCategories: ["SPECIAL_PERSONAL"],
    aiActCategory: "Geringes Risiko",
  });

  assert.equal(submission.dataCategory, "SPECIAL_PERSONAL");
  assert.deepEqual(submission.dataCategories, [
    "SPECIAL_PERSONAL",
    "PERSONAL_DATA",
  ]);
});

test("normalizeSupplierRequestDataCategories entfernt widerspruechliche Kombinationen", () => {
  const categories = normalizeSupplierRequestDataCategories(
    ["NO_PERSONAL_DATA", "SPECIAL_PERSONAL"]
  );

  assert.deepEqual(categories, ["SPECIAL_PERSONAL", "PERSONAL_DATA"]);
});

test("createSupplierRequestUseCase uebernimmt mehrere Datenkategorien konsistent", () => {
  const card = createSupplierRequestUseCase(
    {
      supplierEmail: "vendor@example.com",
      supplierOrganisation: "Lieferant GmbH",
      toolName: "Perplexity API",
      purpose: "Marketing-Recherche",
      dataCategories: ["SPECIAL_PERSONAL"],
      aiActCategory: "Geringes Risiko",
    },
    {
      useCaseId: "uc_supplier_3",
      now: new Date("2026-03-12T12:00:00.000Z"),
    }
  );

  assert.equal(card.dataCategory, "SPECIAL_PERSONAL");
  assert.deepEqual(card.dataCategories, [
    "SPECIAL_PERSONAL",
    "PERSONAL_DATA",
  ]);
});

test("parseSupplierRequestSubmission erlaubt optionale Datenkategorien fuer schlanke Lieferantenangaben", () => {
  const submission = parseSupplierRequestSubmission({
    supplierEmail: "vendor@example.com",
    supplierOrganisation: "Lieferant GmbH",
    toolName: "Perplexity API",
    purpose: "Marketing-Recherche",
  });

  assert.equal(submission.dataCategory, undefined);
  assert.equal(submission.dataCategories, undefined);
});

test("parseSupplierRequestSubmission bleibt rueckwaertskompatibel fuer alte Snapshots ohne Lieferantenorganisation", () => {
  const submission = parseSupplierRequestSubmission({
    supplierEmail: "vendor@example.com",
    toolName: "Perplexity API",
    purpose: "Marketing-Recherche",
  });

  assert.equal(submission.supplierOrganisation, null);
});
