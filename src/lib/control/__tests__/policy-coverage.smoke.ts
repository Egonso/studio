import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import {
  buildControlPolicyCoverage,
  buildDeterministicPolicyPreview,
} from "@/lib/control/policy/coverage";
import type { PolicyDocument } from "@/lib/policy-engine/types";
import type { OrgSettings, Register, UseCaseCard } from "@/lib/register-first/types";

function createRegister(): Register {
  return {
    registerId: "reg_test",
    name: "Test Register",
    createdAt: "2026-02-01T10:00:00.000Z",
    organisationName: "EUKI Test Organisation",
    orgSettings: {
      organisationName: "EUKI Test Organisation",
      industry: "Education",
      contactPerson: {
        name: "Test",
        email: "test@example.com",
      },
    },
  };
}

function createOrgSettings(): OrgSettings {
  return {
    organisationName: "EUKI Test Organisation",
    industry: "Education",
    contactPerson: {
      name: "Test",
      email: "test@example.com",
    },
  };
}

function createBaseUseCase(useCaseId: string): UseCaseCard {
  return {
    cardVersion: "1.1",
    useCaseId,
    createdAt: "2026-02-10T10:00:00.000Z",
    updatedAt: "2026-02-20T10:00:00.000Z",
    purpose: `Use Case ${useCaseId}`,
    usageContexts: ["INTERNAL_ONLY"],
    responsibility: {
      isCurrentlyResponsible: true,
      responsibleParty: null,
    },
    decisionImpact: "YES",
    affectedParties: ["INTERNAL_PROCESSES"],
    status: "REVIEWED",
    reviewHints: [],
    evidences: [],
    reviews: [],
    proof: null,
  };
}

function createPolicies(): PolicyDocument[] {
  return [
    {
      policyId: "pol_a",
      registerId: "reg_test",
      level: 2,
      status: "approved",
      title: "Policy A",
      sections: [],
      metadata: {
        createdAt: "2026-02-10T10:00:00.000Z",
        updatedAt: "2026-02-20T10:00:00.000Z",
        createdBy: "test-user",
        version: 2,
      },
      orgContextSnapshot: {
        organisationName: "EUKI Test Organisation",
      },
      versions: [
        {
          versionNumber: 1,
          createdAt: "2026-02-15T10:00:00.000Z",
          createdBy: "test-user",
          sectionsSnapshot: [],
          toStatus: "review",
          fromStatus: "draft",
        },
      ],
    },
  ];
}

export function runPolicyCoverageSmoke() {
  const useCases: UseCaseCard[] = [
    {
      ...createBaseUseCase("uc_policy_1"),
      governanceAssessment: {
        core: {
          aiActCategory: "Hochrisiko",
        },
        flex: {
          policyLinks: ["pol_a"],
        },
      },
    },
    {
      ...createBaseUseCase("uc_policy_2"),
      usageContexts: ["CUSTOMERS"],
    },
  ];

  const coverage = buildControlPolicyCoverage(useCases, createPolicies());
  assert.equal(coverage.totalUseCases, 2);
  assert.equal(coverage.mappedUseCases, 1);
  assert.equal(coverage.coveragePercent, 50);
  assert.equal(coverage.policiesTotal, 1);
  assert.equal(coverage.approvedPolicies, 1);
  assert.equal(coverage.policiesWithVersionHistory, 1);
  assert.equal(coverage.rows[0]?.linkedUseCases, 1);

  const preview = buildDeterministicPolicyPreview(
    createRegister(),
    useCases,
    createOrgSettings(),
    2,
    new Date("2026-02-27T12:00:00.000Z")
  );
  assert.equal(preview.level, 2);
  assert.equal(preview.dataBasis.deterministic, true);
  assert.equal(preview.dataBasis.totalUseCases, 2);
  assert.ok(preview.sectionCount >= 0);
  assert.ok(preview.markdown.length > 0);

  console.log("Control policy coverage smoke tests passed.");
}

const isDirectRun =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  try {
    runPolicyCoverageSmoke();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
