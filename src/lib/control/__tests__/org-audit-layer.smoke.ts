import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { buildOrgAuditLayer } from "@/lib/control/audit/org-audit-layer";
import type { OrgSettings, UseCaseCard } from "@/lib/register-first/types";

function createBaseUseCase(useCaseId: string): UseCaseCard {
  return {
    cardVersion: "1.1",
    useCaseId,
    createdAt: "2026-02-20T10:00:00.000Z",
    updatedAt: "2026-02-20T10:00:00.000Z",
    purpose: `Use Case ${useCaseId}`,
    usageContexts: ["INTERNAL_ONLY"],
    responsibility: {
      isCurrentlyResponsible: false,
      responsibleParty: null,
    },
    decisionImpact: "YES",
    affectedParties: ["INTERNAL_PROCESSES"],
    status: "UNREVIEWED",
    reviewHints: [],
    evidences: [],
    reviews: [],
    proof: null,
  };
}

function createOrgSettings(): OrgSettings {
  return {
    organisationName: "EUKI Test Org",
    industry: "Education",
    contactPerson: {
      name: "Test Person",
      email: "test@example.com",
    },
    aiPolicy: {
      url: "https://example.com/policy",
    },
    incidentProcess: {
      url: "https://example.com/incident",
    },
    rolesFramework: {
      booleanDefined: true,
    },
  };
}

export function runOrgAuditLayerSmoke() {
  const now = new Date("2026-02-27T12:00:00.000Z");

  const useCases: UseCaseCard[] = [
    {
      ...createBaseUseCase("uc_audit_1"),
      status: "REVIEWED",
      responsibility: {
        isCurrentlyResponsible: true,
        responsibleParty: null,
      },
      governanceAssessment: {
        core: {
          aiActCategory: "Hochrisiko",
          oversightDefined: true,
          reviewCycleDefined: true,
          documentationLevelDefined: true,
        },
        flex: {
          policyLinks: ["pol-a"],
          iso: {
            reviewCycle: "quarterly",
            oversightModel: "HITL",
            documentationLevel: "extended",
            lifecycleStatus: "active",
            nextReviewAt: "2026-03-05T10:00:00.000Z",
          },
        },
      },
      reviews: [
        {
          reviewId: "r1",
          reviewedAt: "2026-02-22T10:00:00.000Z",
          reviewedBy: "auditor@example.com",
          nextStatus: "REVIEWED",
        },
      ],
      statusHistory: [
        {
          from: "UNREVIEWED",
          to: "REVIEWED",
          changedAt: "2026-02-22T10:00:00.000Z",
          changedBy: "auditor@example.com",
          changedByName: "Auditor",
        },
      ],
      proof: {
        verifyUrl: "https://example.com/proof/a",
        generatedAt: "2026-02-22T10:05:00.000Z",
        verification: {
          isReal: true,
          isCurrent: true,
          scope: "Smoke",
        },
      },
    },
    {
      ...createBaseUseCase("uc_audit_2"),
      status: "REVIEW_RECOMMENDED",
      governanceAssessment: {
        core: {
          aiActCategory: "Hochrisiko",
        },
        flex: {
          iso: {
            reviewCycle: "unknown",
            oversightModel: "unknown",
            documentationLevel: "unknown",
            lifecycleStatus: "pilot",
          },
        },
      },
    },
  ];

  const snapshot = buildOrgAuditLayer(useCases, createOrgSettings(), now);

  assert.equal(snapshot.lifecycle.totalSystems, 2);
  assert.equal(snapshot.lifecycle.active, 1);
  assert.equal(snapshot.lifecycle.pilot, 1);
  assert.equal(snapshot.statusDistribution.REVIEWED, 1);
  assert.equal(snapshot.statusDistribution.REVIEW_RECOMMENDED, 1);

  assert.equal(snapshot.isoClauseProgress.length, 6);
  assert.ok(snapshot.gapAnalysis.some((item) => item.id === "owner-coverage"));
  assert.ok(snapshot.gapAnalysis.some((item) => item.id === "high-risk-oversight"));

  assert.ok(snapshot.immutableReviewHistory.length >= 2);
  for (const entry of snapshot.immutableReviewHistory) {
    assert.match(entry.immutableReference, /^IMM-[A-F0-9]{8}$/);
    assert.match(entry.deepLink, /^\/my-register\/[^?]+\?focus=audit$/);
  }

  const empty = buildOrgAuditLayer([], null, now);
  assert.equal(empty.lifecycle.totalSystems, 0);
  assert.equal(empty.immutableReviewHistory.length, 0);
  assert.equal(empty.statusDistribution.UNREVIEWED, 0);

  console.log("Control org-audit-layer smoke tests passed.");
}

const isDirectRun =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  try {
    runOrgAuditLayerSmoke();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
