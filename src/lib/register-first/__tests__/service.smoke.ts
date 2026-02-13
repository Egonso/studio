import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { createInMemoryRegisterUseCaseRepository } from "../repository.ts";
import {
  createRegisterFirstService,
  RegisterFirstServiceError,
} from "../service.ts";

const baseNow = Date.parse("2026-02-07T12:00:00.000Z");
let tick = 0;
let useCaseCounter = 1;
let reviewCounter = 1;

const repository = createInMemoryRegisterUseCaseRepository();
const service = createRegisterFirstService({
  repository,
  resolveUserId: async () => "user_1",
  resolveProjectId: async (projectId) => projectId ?? "project_1",
  now: () => new Date(baseNow + tick++ * 1000),
  useCaseIdGenerator: () => `uc_${String(useCaseCounter++).padStart(3, "0")}`,
  reviewIdGenerator: () => `review_${String(reviewCounter++).padStart(3, "0")}`,
});

export async function runServiceSmoke() {
  const created = await service.createUseCaseFromCapture(
    {
      purpose: "Supporttickets priorisieren",
      usageContexts: ["INTERNAL_ONLY", "EMPLOYEE_FACING"],
      isCurrentlyResponsible: true,
      decisionImpact: "UNSURE",
      affectedParties: ["GROUPS_OR_TEAMS"],
    },
    { projectId: "project_1" }
  );

  assert.equal(created.status, "UNREVIEWED");
  assert.equal(created.useCaseId, "uc_001");

  const initialList = await service.listUseCases("project_1");
  assert.equal(initialList.length, 1);
  assert.equal(initialList[0].useCaseId, created.useCaseId);

  const reviewed = await service.updateUseCaseStatusManual({
    projectId: "project_1",
    useCaseId: created.useCaseId,
    nextStatus: "REVIEWED",
    reason: "Kurze fachliche Prüfung abgeschlossen",
    actor: "HUMAN",
  });

  assert.equal(reviewed.status, "REVIEWED");
  assert.equal(reviewed.reviews.length, 1);
  assert.equal(reviewed.reviews[0].nextStatus, "REVIEWED");

  const reviewedList = await service.listUseCases("project_1", {
    status: "REVIEWED",
  });
  assert.equal(reviewedList.length, 1);

  const proofReady = await service.updateUseCaseStatusManual({
    projectId: "project_1",
    useCaseId: created.useCaseId,
    nextStatus: "PROOF_READY",
    reason: "Nachweis-Export freigegeben",
    actor: "HUMAN",
  });
  assert.equal(proofReady.status, "PROOF_READY");
  assert.equal(proofReady.reviews.length, 2);

  const withProofMeta = await service.updateProofMetaManual({
    projectId: "project_1",
    useCaseId: proofReady.useCaseId,
    verifyUrl: "https://example.org/verify/uc_001",
    isReal: true,
    isCurrent: true,
    scope: "Supportprozess",
    actor: "HUMAN",
  });
  assert.equal(withProofMeta.proof?.verifyUrl, "https://example.org/verify/uc_001");
  assert.equal(withProofMeta.proof?.verification.scope, "Supportprozess");
  assert.equal(withProofMeta.proof?.verification.isReal, true);
  assert.equal(withProofMeta.proof?.verification.isCurrent, true);

  const second = await service.createUseCaseFromCapture(
    {
      purpose: "Marketing-Texte generieren",
      usageContexts: ["CUSTOMER_FACING"],
      isCurrentlyResponsible: true,
      decisionImpact: "NO",
    },
    { projectId: "project_1" }
  );

  await assert.rejects(
    () =>
      service.updateUseCaseStatusManual({
        projectId: "project_1",
        useCaseId: second.useCaseId,
        nextStatus: "PROOF_READY",
        actor: "HUMAN",
      }),
    (error) =>
      error instanceof RegisterFirstServiceError &&
      error.code === "INVALID_STATUS_TRANSITION"
  );

  await assert.rejects(
    () =>
      service.updateProofMetaManual({
        projectId: "project_1",
        useCaseId: second.useCaseId,
        verifyUrl: "https://example.org/verify/uc_002",
        isReal: true,
        isCurrent: true,
        scope: "Marketingprozess",
        actor: "HUMAN",
      }),
    (error) =>
      error instanceof RegisterFirstServiceError &&
      error.code === "INVALID_STATUS_TRANSITION"
  );

  await assert.rejects(
    () =>
      service.updateUseCaseStatusManual({
        projectId: "project_1",
        useCaseId: proofReady.useCaseId,
        nextStatus: "REVIEWED",
        actor: "AUTOMATION",
      }),
    (error) =>
      error instanceof RegisterFirstServiceError &&
      error.code === "AUTOMATION_FORBIDDEN"
  );

  await assert.rejects(
    () =>
      service.createUseCaseFromCapture(
        {
          purpose: "x",
          usageContexts: [],
          isCurrentlyResponsible: false,
          decisionImpact: "YES",
        },
        { projectId: "project_1" }
      ),
    (error) =>
      error instanceof RegisterFirstServiceError &&
      error.code === "VALIDATION_FAILED"
  );

  const missingProjectService = createRegisterFirstService({
    repository: createInMemoryRegisterUseCaseRepository(),
    resolveUserId: async () => "user_2",
    resolveProjectId: async () => null,
  });

  await assert.rejects(
    () =>
      missingProjectService.listUseCases(undefined, {
        limit: 10,
      }),
    (error) =>
      error instanceof RegisterFirstServiceError &&
      error.code === "PROJECT_CONTEXT_MISSING"
  );

  const unauthenticatedService = createRegisterFirstService({
    repository: createInMemoryRegisterUseCaseRepository(),
    resolveUserId: async () => null,
    resolveProjectId: async () => "project_3",
  });

  await assert.rejects(
    () => unauthenticatedService.listUseCases("project_3"),
    (error) =>
      error instanceof RegisterFirstServiceError &&
      error.code === "UNAUTHENTICATED"
  );

  console.log("Register-First service smoke tests passed.");
}

const isDirectRun =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  runServiceSmoke()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
