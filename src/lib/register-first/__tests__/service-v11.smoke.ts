import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { createInMemoryRegisterUseCaseRepository } from "../repository.ts";
import {
  createRegisterFirstService,
  RegisterFirstServiceError,
} from "../service.ts";
import {
  createUseCasePassExport,
  createUseCasePassV11Export,
  getUseCasePassFileName,
  getUseCasePassV11FileName,
  getStatusGatedOutputState,
  serializePrettyJson,
} from "../output.ts";
import {
  createProofPackDocument,
  createProofPackV11Document,
  createProofPackPdfBlob,
  createProofPackV11PdfBlob,
  getProofPackPdfFileName,
  getProofPackV11PdfFileName,
} from "../proof-pack.ts";
import type { RegisterFirstFeatureFlags } from "../flags.ts";

const baseNow = Date.parse("2026-02-10T10:00:00.000Z");
let tick = 0;
let useCaseCounter = 100;
let reviewCounter = 100;

const repository = createInMemoryRegisterUseCaseRepository();
const service = createRegisterFirstService({
  repository,
  resolveUserId: async () => "user_v11",
  resolveProjectId: async (projectId) => projectId ?? "project_v11",
  now: () => new Date(baseNow + tick++ * 1000),
  useCaseIdGenerator: () => `uc_v11_${String(useCaseCounter++).padStart(3, "0")}`,
  reviewIdGenerator: () => `review_v11_${String(reviewCounter++).padStart(3, "0")}`,
});

export async function runServiceV11Smoke() {
  // ── 1. Create v1.1 card via service (toolId triggers v1.1 detection) ──────
  const v11Card = await service.createUseCaseFromCapture(
    {
      purpose: "Kundensupport-Tickets priorisieren mittels KI",
      usageContexts: ["INTERNAL_ONLY", "EMPLOYEE_FACING"],
      isCurrentlyResponsible: true,
      decisionImpact: "YES",
      affectedParties: ["INDIVIDUALS"],
      toolId: "openai_chatgpt",
      dataCategory: "PERSONAL",
    },
    { projectId: "project_v11" }
  );

  assert.equal(v11Card.cardVersion, "1.1");
  assert.equal(v11Card.status, "UNREVIEWED");
  assert.equal(v11Card.toolId, "openai_chatgpt");
  assert.equal(v11Card.dataCategory, "PERSONAL");
  assert.ok(v11Card.globalUseCaseId, "globalUseCaseId should be generated");
  assert.match(v11Card.globalUseCaseId!, /^EUKI-UC-\d{6}$/);
  assert.ok(v11Card.publicHashId, "publicHashId should be generated");
  assert.equal(v11Card.publicHashId!.length, 12);
  assert.equal(v11Card.isPublicVisible, false);
  assert.equal(v11Card.formatVersion, "v1.1");

  // ── 2. Create v1.0 card (no toolId/dataCategory) ─────────────────────────
  const v10Card = await service.createUseCaseFromCapture(
    {
      purpose: "Marketing-Texte pruefen lassen",
      usageContexts: ["CUSTOMER_FACING"],
      isCurrentlyResponsible: true,
      decisionImpact: "NO",
    },
    { projectId: "project_v11" }
  );

  assert.equal(v10Card.cardVersion, "1.0");
  assert.equal(v10Card.globalUseCaseId, undefined);
  assert.equal(v10Card.publicHashId, undefined);

  // ── 3. setPublicVisibility on v1.1 ────────────────────────────────────────
  const publicCard = await service.setPublicVisibility({
    projectId: "project_v11",
    useCaseId: v11Card.useCaseId,
    isPublicVisible: true,
  });

  assert.equal(publicCard.isPublicVisible, true);

  // Toggle off
  const privateCard = await service.setPublicVisibility({
    projectId: "project_v11",
    useCaseId: v11Card.useCaseId,
    isPublicVisible: false,
  });

  assert.equal(privateCard.isPublicVisible, false);

  // ── 4. setPublicVisibility on v1.0 should fail ────────────────────────────
  await assert.rejects(
    () =>
      service.setPublicVisibility({
        projectId: "project_v11",
        useCaseId: v10Card.useCaseId,
        isPublicVisible: true,
      }),
    (error) =>
      error instanceof RegisterFirstServiceError &&
      error.code === "VALIDATION_FAILED"
  );

  // ── 5. v1.0 Export (backward compat) ──────────────────────────────────────
  const exportNow = new Date("2026-02-10T11:00:00.000Z");
  const v10Export = createUseCasePassExport(v10Card, exportNow);
  assert.equal(v10Export.schemaVersion, "1.0");
  assert.equal(v10Export.status, v10Card.status);
  assert.equal(v10Export.card.useCaseId, v10Card.useCaseId);

  const v10Json = serializePrettyJson(v10Export);
  assert.ok(v10Json.includes('"schemaVersion": "1.0"'));

  assert.equal(getUseCasePassFileName(v10Card.useCaseId), `euki-use-case-pass-${v10Card.useCaseId}.json`);

  // ── 6. v1.1 Export ────────────────────────────────────────────────────────
  const v11Export = createUseCasePassV11Export(
    v11Card,
    "project_v11",
    {
      vendor: "OpenAI",
      productName: "ChatGPT",
      toolType: "LLM",
    },
    exportNow
  );

  assert.equal(v11Export.schemaVersion, "1.1");
  assert.equal(v11Export.globalUseCaseId, v11Card.globalUseCaseId);
  assert.equal(v11Export.projectId, "project_v11");
  assert.equal(v11Export.tool.toolId, "openai_chatgpt");
  assert.equal(v11Export.tool.vendor, "OpenAI");
  assert.equal(v11Export.tool.productName, "ChatGPT");
  assert.equal(v11Export.tool.toolType, "LLM");
  assert.equal(v11Export.tool.freeText, null);
  assert.equal(v11Export.dataCategory, "PERSONAL");
  assert.equal(v11Export.responsibleRole, "Erfasser (self)");
  assert.ok(v11Export.scope.includes("INTERNAL_ONLY"));

  const v11Json = serializePrettyJson(v11Export);
  assert.ok(v11Json.includes('"schemaVersion": "1.1"'));

  assert.equal(
    getUseCasePassV11FileName(v11Card.globalUseCaseId!),
    `euki-use-case-pass-v11-${v11Card.globalUseCaseId}.json`
  );

  // ── 7. v1.1 Export with "other" tool + freeText ───────────────────────────
  const otherToolCard = await service.createUseCaseFromCapture(
    {
      purpose: "Internes Wissensmanagement mit eigenem Tool",
      usageContexts: ["INTERNAL_ONLY"],
      isCurrentlyResponsible: false,
      responsibleParty: "IT-Abteilung",
      decisionImpact: "UNSURE",
      affectedParties: ["INTERNAL_PROCESSES"],
      toolId: "other",
      toolFreeText: "Eigenentwicklung RAG-Pipeline",
      dataCategory: "INTERNAL",
    },
    { projectId: "project_v11" }
  );

  assert.equal(otherToolCard.cardVersion, "1.1");
  assert.equal(otherToolCard.toolId, "other");
  assert.equal(otherToolCard.toolFreeText, "Eigenentwicklung RAG-Pipeline");

  const otherExport = createUseCasePassV11Export(otherToolCard, "project_v11", {}, exportNow);
  assert.equal(otherExport.tool.toolId, "other");
  assert.equal(otherExport.tool.freeText, "Eigenentwicklung RAG-Pipeline");
  assert.equal(otherExport.tool.vendor, null);
  assert.equal(otherExport.responsibleRole, "IT-Abteilung");

  // ── 8. v1.1 Export fails for v1.0 card ────────────────────────────────────
  assert.throws(
    () => createUseCasePassV11Export(v10Card, "project_v11", {}, exportNow),
    /v1\.1 export requires a v1\.1/
  );

  // ── 9. Status gated output check ─────────────────────────────────────────
  const flags: RegisterFirstFeatureFlags = {
    enabled: true,
    hybridEntry: true,
    stickyLauncher: false,
    proofGate: true,
    standaloneMode: false,
  };

  const unreviewedState = getStatusGatedOutputState("UNREVIEWED", flags);
  assert.equal(unreviewedState.tier, "RAW");
  assert.equal(unreviewedState.cardJsonEnabled, true);
  assert.equal(unreviewedState.proofPackDraftEnabled, false);

  const proofReadyState = getStatusGatedOutputState("PROOF_READY", flags);
  assert.equal(proofReadyState.tier, "PROOF_READY");
  assert.equal(proofReadyState.proofPackDraftEnabled, true);

  // ── 10. Proof Pack v1.0 Document ──────────────────────────────────────────
  // Advance v11 card to PROOF_READY for proof pack testing
  await service.updateUseCaseStatusManual({
    projectId: "project_v11",
    useCaseId: v11Card.useCaseId,
    nextStatus: "REVIEWED",
    reason: "Fachliche Prüfung bestanden",
    actor: "HUMAN",
  });

  const proofReady = await service.updateUseCaseStatusManual({
    projectId: "project_v11",
    useCaseId: v11Card.useCaseId,
    nextStatus: "PROOF_READY",
    reason: "Nachweis-Export freigegeben",
    actor: "HUMAN",
  });

  const withProof = await service.updateProofMetaManual({
    projectId: "project_v11",
    useCaseId: proofReady.useCaseId,
    verifyUrl: "https://verify.example.com/v11_check",
    isReal: true,
    isCurrent: true,
    scope: "Kundensupport KI-Priorisierung",
    actor: "HUMAN",
  });

  const proofDoc = createProofPackDocument(withProof, exportNow);
  assert.equal(proofDoc.schemaVersion, "1.0");
  assert.equal(proofDoc.verifyLink.url, "https://verify.example.com/v11_check");
  assert.equal(getProofPackPdfFileName(withProof.useCaseId), `euki-proof-pack-${withProof.useCaseId}.pdf`);

  // ── 11. Proof Pack v1.1 Document ──────────────────────────────────────────
  const proofV11Doc = createProofPackV11Document(
    withProof,
    { vendor: "OpenAI", productName: "ChatGPT", toolType: "LLM" },
    exportNow
  );

  assert.equal(proofV11Doc.schemaVersion, "1.1");
  assert.equal(proofV11Doc.globalUseCaseId, withProof.globalUseCaseId);
  assert.equal(proofV11Doc.tool.toolId, "openai_chatgpt");
  assert.equal(proofV11Doc.tool.vendor, "OpenAI");
  assert.equal(proofV11Doc.dataCategory, "PERSONAL");
  assert.equal(proofV11Doc.verifyLink.scope, "Kundensupport KI-Priorisierung");
  assert.equal(
    getProofPackV11PdfFileName(withProof.globalUseCaseId!),
    `euki-proof-pack-v11-${withProof.globalUseCaseId}.pdf`
  );

  // ── 12. Proof Pack v1.1 fails for v1.0 card ──────────────────────────────
  assert.throws(
    () => createProofPackV11Document(v10Card, {}, exportNow),
    /status PROOF_READY/
  );

  // ── 13. Proof Pack PDF blobs ──────────────────────────────────────────────
  const pdfBlob = createProofPackPdfBlob(withProof, exportNow);
  assert.ok(pdfBlob.size > 0, "v1.0 PDF blob should have content");
  assert.equal(pdfBlob.type, "application/pdf");

  const pdfV11Blob = createProofPackV11PdfBlob(
    withProof,
    { vendor: "OpenAI", productName: "ChatGPT", toolType: "LLM" },
    exportNow
  );
  assert.ok(pdfV11Blob.size > 0, "v1.1 PDF blob should have content");
  assert.equal(pdfV11Blob.type, "application/pdf");

  console.log("Service v1.1 + Output v1.1 smoke tests passed.");
}

const isDirectRun =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  runServiceV11Smoke()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
