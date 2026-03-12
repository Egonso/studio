import assert from "node:assert/strict";
import test from "node:test";

import {
  createSupplierRequestUseCase,
  getSupplierRequestContact,
  isSupplierRequestCard,
  SUPPLIER_REQUEST_DEFAULT_USAGE_CONTEXT,
  SUPPLIER_REQUEST_FILTER,
} from "./supplier-requests";

test("createSupplierRequestUseCase erzeugt eine schema-kompatible Registerkarte", () => {
  const now = new Date("2026-03-12T08:15:00.000Z");
  const card = createSupplierRequestUseCase(
    {
      supplierEmail: "vendor@example.com",
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
