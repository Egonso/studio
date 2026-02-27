import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import type { UseCaseCard } from "@/lib/register-first/types";
import { buildPortfolioMetrics } from "../portfolio-metrics";

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
      responsibleParty: "Owner Placeholder",
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

export function runPortfolioMetricsSmoke() {
  const now = new Date("2026-02-27T12:00:00.000Z");

  const useCases: UseCaseCard[] = [
    {
      ...createBaseUseCase("uc_1"),
      updatedAt: "2026-02-01T10:00:00.000Z",
      organisation: "HR",
      responsibility: { isCurrentlyResponsible: false, responsibleParty: "Alice" },
      status: "UNREVIEWED",
      governanceAssessment: {
        core: { aiActCategory: "Hochrisiko" },
        flex: {
          iso: {
            reviewCycle: "quarterly",
            oversightModel: "unknown",
            documentationLevel: "standard",
            lifecycleStatus: "active",
            nextReviewAt: "2026-02-10T10:00:00.000Z",
          },
        },
      },
    },
    {
      ...createBaseUseCase("uc_2"),
      updatedAt: "2026-02-10T10:00:00.000Z",
      organisation: "HR",
      responsibility: { isCurrentlyResponsible: false, responsibleParty: "Alice" },
      status: "REVIEWED",
      governanceAssessment: {
        core: { aiActCategory: "Hochrisiko" },
        flex: {
          iso: {
            reviewCycle: "quarterly",
            oversightModel: "HITL",
            documentationLevel: "extended",
            lifecycleStatus: "active",
            nextReviewAt: "2026-03-15T10:00:00.000Z",
          },
        },
      },
    },
    {
      ...createBaseUseCase("uc_3"),
      updatedAt: "2026-02-11T10:00:00.000Z",
      organisation: "Finance",
      responsibility: { isCurrentlyResponsible: false, responsibleParty: "Bob" },
      status: "REVIEW_RECOMMENDED",
      governanceAssessment: {
        core: { aiActCategory: "Transparenzpflichten" },
        flex: {
          iso: {
            reviewCycle: "semiannual",
            oversightModel: "HUMAN_REVIEW",
            documentationLevel: "standard",
            lifecycleStatus: "active",
          },
        },
      },
    },
    {
      ...createBaseUseCase("uc_4"),
      updatedAt: "2026-02-12T10:00:00.000Z",
      organisation: "Finance",
      responsibility: { isCurrentlyResponsible: true, responsibleParty: null },
      status: "PROOF_READY",
      governanceAssessment: {
        core: { aiActCategory: "Minimales Risiko" },
        flex: {
          iso: {
            reviewCycle: "annual",
            oversightModel: "HITL",
            documentationLevel: "minimal",
            lifecycleStatus: "active",
          },
        },
      },
      proof: {
        verifyUrl: "https://example.com/proof",
        generatedAt: "2026-02-12T10:00:00.000Z",
        verification: {
          isReal: true,
          isCurrent: true,
          scope: "Smoke Scope",
        },
      },
    },
  ];

  const metrics = buildPortfolioMetrics(useCases, now);
  assert.equal(metrics.totalSystems, 4);

  const highRiskBucket = metrics.riskDistribution.find((entry) => entry.key === "HIGH");
  const limitedBucket = metrics.riskDistribution.find((entry) => entry.key === "LIMITED");
  const minimalBucket = metrics.riskDistribution.find((entry) => entry.key === "MINIMAL");
  assert.equal(highRiskBucket?.count, 2);
  assert.equal(limitedBucket?.count, 1);
  assert.equal(minimalBucket?.count, 1);

  const hrDepartment = metrics.departmentAnalysis.find((entry) => entry.department === "HR");
  assert.equal(hrDepartment?.totalSystems, 2);
  assert.equal(hrDepartment?.highRiskSystems, 2);
  assert.equal(hrDepartment?.reviewedPercent, 50);
  assert.equal(hrDepartment?.overdueReviews, 1);
  assert.match(hrDepartment?.drilldownLink ?? "", /^\/my-register\/[^?]+\?focus=oversight$/);

  const aliceOwner = metrics.ownerPerformance.find((entry) => entry.owner === "Alice");
  assert.equal(aliceOwner?.totalSystems, 2);
  assert.equal(aliceOwner?.highRiskSystems, 2);
  assert.equal(aliceOwner?.reviewedPercent, 50);

  const reviewedStatus = metrics.statusDistribution.find((entry) => entry.status === "REVIEWED");
  assert.equal(reviewedStatus?.count, 1);
  assert.match(reviewedStatus?.drilldownLink ?? "", /^\/my-register\/[^?]+\?focus=review$/);

  assert.equal(metrics.riskConcentrationIndex.assessedSystems, 2);
  assert.equal(metrics.riskConcentrationIndex.groupCount, 1);
  assert.equal(metrics.riskConcentrationIndex.score, 100);
  assert.equal(metrics.riskConcentrationIndex.concentrationBand, "CLUSTERED");

  const empty = buildPortfolioMetrics([], now);
  assert.equal(empty.totalSystems, 0);
  assert.equal(empty.riskDistribution.every((entry) => entry.count === 0), true);
  assert.equal(empty.statusDistribution.every((entry) => entry.count === 0), true);
  assert.equal(empty.riskConcentrationIndex.score, 0);

  console.log("Control portfolio-metrics smoke tests passed.");
}

const isDirectRun =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  try {
    runPortfolioMetricsSmoke();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

