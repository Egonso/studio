import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import {
  createInMemoryRegisterRepository,
  createInMemoryRegisterAccessCodeRepo,
  createInMemoryRegisterUseCaseRepo,
  createInMemoryPublicIndexRepo,
} from "../register-repository";
import {
  createRegisterService,
  RegisterServiceError,
} from "../register-service";
import { prepareUseCaseForStorage } from "../use-case-builder";

const baseNow = Date.parse("2026-02-10T10:00:00.000Z");
let tick = 0;
let useCaseCounter = 1;
let reviewCounter = 1;

// Simulated settings storage (replaces sessionStorage + Firestore)
let activeRegisterId: string | null = null;
let defaultRegisterId: string | null = null;

const registerRepo = createInMemoryRegisterRepository();
const useCaseRepo = createInMemoryRegisterUseCaseRepo();
const publicIndexRepo = createInMemoryPublicIndexRepo();
const accessCodeRepo = createInMemoryRegisterAccessCodeRepo();

function buildService(userId: string | null = "user_standalone") {
  return createRegisterService({
    registerRepo,
    useCaseRepo,
    publicIndexRepo,
    accessCodeRepo,
    resolveUserId: async () => userId,
    now: () => new Date(baseNow + tick++ * 1000),
    useCaseIdGenerator: () => `uc_s_${String(useCaseCounter++).padStart(3, "0")}`,
    reviewIdGenerator: () => `rev_s_${String(reviewCounter++).padStart(3, "0")}`,
    getDefaultRegisterIdFn: async () => defaultRegisterId,
    setDefaultRegisterIdFn: async (_userId, regId) => {
      defaultRegisterId = regId;
    },
    getActiveRegisterIdFn: () => activeRegisterId,
    setActiveRegisterIdFn: (id) => {
      activeRegisterId = id;
    },
    clearActiveRegisterIdFn: () => {
      activeRegisterId = null;
    },
  });
}

export async function runRegisterStandaloneSmoke() {
  // Reset state
  activeRegisterId = null;
  defaultRegisterId = null;
  tick = 0;
  useCaseCounter = 1;
  reviewCounter = 1;

  const service = buildService("user_standalone");

  // ── 1. No register → REGISTER_NOT_FOUND (No Auto-Create) ──
  await assert.rejects(
    () => service.listUseCases(),
    (error) =>
      error instanceof RegisterServiceError &&
      error.code === "REGISTER_NOT_FOUND"
  );
  console.log("  [1] No auto-create: REGISTER_NOT_FOUND when no register exists ✓");

  // ── 2. Create register ──
  const register = await service.createRegister("Test Register");
  assert.ok(register.registerId, "Register should have an ID");
  assert.equal(register.name, "Test Register");
  assert.equal(register.linkedProjectId, null);
  assert.equal(register.plan, "free");
  assert.equal(register.entitlement?.plan, "free");
  assert.equal(register.entitlement?.source, "default_free");
  assert.equal(defaultRegisterId, register.registerId, "Should set as default");
  console.log("  [2] Create register ✓");

  // ── 3. List registers ──
  const registers = await service.listRegisters();
  assert.equal(registers.length, 1);
  assert.equal(registers[0].registerId, register.registerId);
  console.log("  [3] List registers ✓");

  // ── 3b. Last register delete is blocked ──
  const deletePreview = await service.getRegisterDeletionPreview(register.registerId);
  assert.equal(deletePreview.canDelete, false);
  assert.equal(deletePreview.blockedReason, "LAST_REGISTER");
  await assert.rejects(
    () =>
      service.deleteRegister({
        registerId: register.registerId,
        confirmationName: "Test Register",
      }),
    (error) =>
      error instanceof RegisterServiceError &&
      error.code === "REGISTER_DELETE_FORBIDDEN"
  );
  console.log("  [3b] Last register delete blocked ✓");

  // ── 4. Capture use case ──
  const card = await service.createUseCaseFromCapture({
    purpose: "Standalone: Dokumente zusammenfassen",
    usageContexts: ["INTERNAL_ONLY"],
    isCurrentlyResponsible: true,
    decisionImpact: "NO",
    dataCategory: "INTERNAL",
    toolId: "chatgpt",
  });
  assert.equal(card.status, "UNREVIEWED");
  assert.equal(card.useCaseId, "uc_s_001");
  assert.ok(card.purpose.includes("Standalone"));
  assert.equal(card.cardVersion, "1.1");
  assert.ok(card.publicHashId, "v1.1 card should have a publicHashId");
  assert.ok(card.globalUseCaseId, "v1.1 card should have a globalUseCaseId");
  console.log("  [4] Create use case from capture ✓");

  // ── 5. List use cases ──
  const cases = await service.listUseCases();
  assert.equal(cases.length, 1);
  assert.equal(cases[0].useCaseId, card.useCaseId);
  console.log("  [5] List use cases ✓");

  // ── 6. Status transition: UNREVIEWED → REVIEWED ──
  const reviewed = await service.updateUseCaseStatusManual({
    useCaseId: card.useCaseId,
    nextStatus: "REVIEWED",
    reason: "Fachlich geprueft",
    actor: "HUMAN",
  });
  assert.equal(reviewed.status, "REVIEWED");
  assert.equal(reviewed.reviews.length, 1);
  assert.equal(reviewed.reviews[0].nextStatus, "REVIEWED");
  console.log("  [6] Status transition UNREVIEWED → REVIEWED ✓");

  // ── 7. Status transition: REVIEWED → PROOF_READY ──
  const proofReady = await service.updateUseCaseStatusManual({
    useCaseId: card.useCaseId,
    nextStatus: "PROOF_READY",
    reason: "Export freigegeben",
    actor: "HUMAN",
  });
  assert.equal(proofReady.status, "PROOF_READY");
  assert.equal(proofReady.reviews.length, 2);
  console.log("  [7] Status transition REVIEWED → PROOF_READY ✓");

  // ── 8. Invalid transition: UNREVIEWED → PROOF_READY ──
  const card2 = await service.createUseCaseFromCapture({
    purpose: "Standalone: Zweiter Fall",
    usageContexts: ["EMPLOYEE_FACING"],
    isCurrentlyResponsible: false,
    responsibleParty: "HR Lead",
    contactPersonName: "Max Mustermann",
    decisionImpact: "YES",
    dataCategory: "PERSONAL",
    toolId: "other",
    toolFreeText: "Eigenes Modell",
  });
  assert.equal(card2.responsibility.responsibleParty, "HR Lead");
  assert.equal(card2.responsibility.contactPersonName, "Max Mustermann");

  await assert.rejects(
    () =>
      service.updateUseCaseStatusManual({
        useCaseId: card2.useCaseId,
        nextStatus: "PROOF_READY",
        actor: "HUMAN",
      }),
    (error) =>
      error instanceof RegisterServiceError &&
      error.code === "INVALID_STATUS_TRANSITION"
  );
  console.log("  [8] Invalid transition blocked ✓");

  // ── 9. Automation forbidden ──
  await assert.rejects(
    () =>
      service.updateUseCaseStatusManual({
        useCaseId: card2.useCaseId,
        nextStatus: "REVIEWED",
        actor: "AUTOMATION",
      }),
    (error) =>
      error instanceof RegisterServiceError &&
      error.code === "AUTOMATION_FORBIDDEN"
  );
  console.log("  [9] Automation forbidden ✓");

  // ── 10. Set public visibility (Dual-Write) ──
  const published = await service.setPublicVisibility({
    useCaseId: card.useCaseId,
    isPublicVisible: true,
    resolvedToolName: "ChatGPT",
  });
  assert.equal(published.isPublicVisible, true);

  // Verify public index entry exists
  const publicEntry = await publicIndexRepo.getPublicEntry(card.publicHashId!);
  assert.ok(publicEntry, "Public index entry should exist after publish");
  assert.equal(publicEntry!.publicHashId, card.publicHashId);
  assert.equal(publicEntry!.purpose, card.purpose);
  assert.equal(publicEntry!.toolName, "ChatGPT");
  assert.equal(publicEntry!.status, "PROOF_READY");
  assert.equal(publicEntry!.ownerId, "user_standalone");
  console.log("  [10] setPublicVisibility(true) → Public Index entry created ✓");

  // ── 11. Unpublish (removes from public index) ──
  const unpublished = await service.setPublicVisibility({
    useCaseId: card.useCaseId,
    isPublicVisible: false,
  });
  assert.equal(unpublished.isPublicVisible, false);

  const removedEntry = await publicIndexRepo.getPublicEntry(card.publicHashId!);
  assert.equal(removedEntry, null, "Public index entry should be removed after unpublish");
  console.log("  [11] setPublicVisibility(false) → Public Index entry removed ✓");

  // ── 12. Proof meta update ──
  const withProof = await service.updateProofMetaManual({
    useCaseId: card.useCaseId,
    verifyUrl: `https://kiregister.com/verify/pass/${card.publicHashId}`,
    isReal: true,
    isCurrent: true,
    scope: "Dokumentenverarbeitung",
    actor: "HUMAN",
  });
  assert.ok(withProof.proof);
  assert.equal(withProof.proof.verification.isReal, true);
  assert.equal(withProof.proof.verification.scope, "Dokumentenverarbeitung");
  console.log("  [12] Proof meta update ✓");

  // ── 13. prepareUseCaseForStorage produces identical structure ──
  const prepared = prepareUseCaseForStorage(
    {
      purpose: "Builder-Test: Zusammenfassung",
      usageContexts: ["INTERNAL_ONLY"],
      isCurrentlyResponsible: false,
      responsibleParty: "IT Security",
      contactPersonName: "Lisa Beispiel",
      decisionImpact: "NO",
      dataCategory: "NONE",
      toolId: "chatgpt",
    },
    {
      useCaseId: "uc_builder_test",
      now: new Date("2026-02-10T12:00:00Z"),
    }
  );
  assert.equal(prepared.useCaseId, "uc_builder_test");
  assert.equal(prepared.status, "UNREVIEWED");
  assert.equal(prepared.cardVersion, "1.1");
  assert.ok(prepared.globalUseCaseId);
  assert.ok(prepared.publicHashId);
  assert.equal(prepared.responsibility.responsibleParty, "IT Security");
  assert.equal(prepared.responsibility.contactPersonName, "Lisa Beispiel");
  console.log("  [13] prepareUseCaseForStorage produces valid card ✓");

  // ── 14. Unauthenticated user → UNAUTHENTICATED ──
  const unauthService = buildService(null);
  await assert.rejects(
    () => unauthService.createRegister("Should fail"),
    (error) =>
      error instanceof RegisterServiceError &&
      error.code === "UNAUTHENTICATED"
  );
  console.log("  [14] Unauthenticated → error ✓");

  // ── 15. Filter by status ──
  const reviewedOnly = await service.listUseCases(undefined, { status: "PROOF_READY" });
  assert.equal(reviewedOnly.length, 1);
  assert.equal(reviewedOnly[0].useCaseId, card.useCaseId);
  console.log("  [15] Filter by status ✓");

  // ── 16. Register delete preview, soft delete, and restore ──
  const secondRegister = await service.createRegister("Second Register");
  await service.setActiveRegister(secondRegister.registerId);

  accessCodeRepo.seedCode({
    code: "AI-DEL001",
    registerId: secondRegister.registerId,
    ownerId: "user_standalone",
    createdAt: new Date(baseNow + tick++ * 1000).toISOString(),
    expiresAt: null,
    label: "Delete Test",
    usageCount: 0,
    maxUsageCount: null,
    isActive: true,
    deactivatedReason: null,
    deactivatedAt: null,
  });
  accessCodeRepo.seedCode({
    code: "AI-MANUAL1",
    registerId: secondRegister.registerId,
    ownerId: "user_standalone",
    createdAt: new Date(baseNow + tick++ * 1000).toISOString(),
    expiresAt: null,
    label: "Manual Revoke",
    usageCount: 0,
    maxUsageCount: null,
    isActive: false,
    deactivatedReason: "MANUAL",
    deactivatedAt: new Date(baseNow + tick++ * 1000).toISOString(),
  });

  const secondCard = await service.createUseCaseFromCapture(
    {
      purpose: "Standalone: Öffentliches Register",
      usageContexts: ["PUBLIC"],
      isCurrentlyResponsible: true,
      decisionImpact: "YES",
      dataCategory: "PUBLIC_DATA",
      toolId: "other",
      toolFreeText: "Portal",
    },
    { registerId: secondRegister.registerId }
  );

  await service.setPublicVisibility({
    registerId: secondRegister.registerId,
    useCaseId: secondCard.useCaseId,
    isPublicVisible: true,
    resolvedToolName: "Public Portal",
  });

  const secondDeletePreview = await service.getRegisterDeletionPreview(
    secondRegister.registerId
  );
  assert.equal(secondDeletePreview.canDelete, true);
  assert.equal(secondDeletePreview.fallbackRegisterId, register.registerId);
  assert.equal(secondDeletePreview.impact.totalUseCaseCount, 1);
  assert.equal(secondDeletePreview.impact.publicUseCaseCount, 1);
  assert.equal(secondDeletePreview.impact.activeAccessCodeCount, 1);

  await assert.rejects(
    () =>
      service.deleteRegister({
        registerId: secondRegister.registerId,
        confirmationName: "Falscher Name",
      }),
    (error) =>
      error instanceof RegisterServiceError &&
      error.code === "REGISTER_CONFIRMATION_MISMATCH"
  );

  const deleteResult = await service.deleteRegister({
    registerId: secondRegister.registerId,
    confirmationName: "Second Register",
  });
  assert.equal(deleteResult.fallbackRegisterId, register.registerId);
  assert.equal(deleteResult.strategy, "SOFT_DELETE");
  assert.equal(activeRegisterId, register.registerId);
  assert.equal(defaultRegisterId, register.registerId);

  const deletedRegister = await registerRepo.getRegister(
    "user_standalone",
    secondRegister.registerId,
    { includeDeleted: true }
  );
  assert.equal(deletedRegister?.isDeleted, true);
  assert.equal(deletedRegister?.deletionState?.strategy, "SOFT_DELETE");
  assert.equal(deletedRegister?.deletionState?.deactivatedAccessCodeCount, 1);

  const visibleRegistersAfterDelete = await service.listRegisters();
  assert.equal(
    visibleRegistersAfterDelete.some(
      (entry) => entry.registerId === secondRegister.registerId
    ),
    false
  );

  const publicEntryAfterDelete = await publicIndexRepo.getPublicEntry(
    secondCard.publicHashId!
  );
  assert.equal(publicEntryAfterDelete, null);

  const codesAfterDelete = await accessCodeRepo.listCodes(
    "user_standalone",
    secondRegister.registerId
  );
  assert.equal(
    codesAfterDelete.find((entry) => entry.code === "AI-DEL001")?.isActive,
    false
  );
  assert.equal(
    codesAfterDelete.find((entry) => entry.code === "AI-DEL001")?.deactivatedReason,
    "REGISTER_DELETED"
  );
  assert.equal(
    codesAfterDelete.find((entry) => entry.code === "AI-MANUAL1")?.deactivatedReason,
    "MANUAL"
  );

  await assert.rejects(
    () => service.listUseCases(secondRegister.registerId),
    (error) =>
      error instanceof RegisterServiceError &&
      error.code === "REGISTER_NOT_FOUND"
  );

  const restoredRegister = await service.restoreRegister(secondRegister.registerId);
  assert.equal(restoredRegister.isDeleted, false);

  const visibleRegistersAfterRestore = await service.listRegisters();
  assert.equal(
    visibleRegistersAfterRestore.some(
      (entry) => entry.registerId === secondRegister.registerId
    ),
    true
  );

  const publicEntryAfterRestore = await publicIndexRepo.getPublicEntry(
    secondCard.publicHashId!
  );
  assert.ok(publicEntryAfterRestore, "Public entry should be republished on restore");

  const codesAfterRestore = await accessCodeRepo.listCodes(
    "user_standalone",
    secondRegister.registerId
  );
  assert.equal(
    codesAfterRestore.find((entry) => entry.code === "AI-DEL001")?.isActive,
    true
  );
  assert.equal(
    codesAfterRestore.find((entry) => entry.code === "AI-DEL001")?.deactivatedReason,
    null
  );
  assert.equal(
    codesAfterRestore.find((entry) => entry.code === "AI-MANUAL1")?.isActive,
    false
  );
  assert.equal(
    codesAfterRestore.find((entry) => entry.code === "AI-MANUAL1")?.deactivatedReason,
    "MANUAL"
  );
  console.log("  [16] Register delete + restore flow ✓");

  console.log("Register-First standalone smoke tests passed.");
}

const isDirectRun =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  runRegisterStandaloneSmoke()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
