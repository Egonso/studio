import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { buildOrgExportArtifacts } from "@/lib/control/exports/org-export-center";
import type { PolicyDocument } from "@/lib/policy-engine/types";
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
      isCurrentlyResponsible: true,
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
    organisationName: "EUKI Test Organisation",
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
  };
}

function createPolicies(): PolicyDocument[] {
  return [
    {
      policyId: "pol-a",
      registerId: "reg-1",
      level: 2,
      status: "approved",
      title: "KI-Richtlinie Basis",
      sections: [
        {
          sectionId: "sec-1",
          title: "Geltungsbereich",
          content: "Diese Richtlinie gilt fuer alle KI-Einsatzfaelle.",
          order: 1,
          isConditional: false,
        },
      ],
      metadata: {
        createdAt: "2026-02-01T10:00:00.000Z",
        updatedAt: "2026-02-20T10:00:00.000Z",
        createdBy: "owner-1",
        approvedBy: "approver-1",
        approvedAt: "2026-02-20T10:00:00.000Z",
        version: 3,
      },
      orgContextSnapshot: {
        organisationName: "EUKI Test Organisation",
      },
    },
  ];
}

export function runOrgExportCenterSmoke() {
  const now = new Date("2026-02-27T12:00:00.000Z");
  const useCases: UseCaseCard[] = [
    {
      ...createBaseUseCase("uc_export_1"),
      status: "REVIEWED",
      isPublicVisible: true,
      governanceAssessment: {
        core: {
          aiActCategory: "Hochrisiko",
          reviewCycleDefined: true,
          oversightDefined: true,
        },
        flex: {
          policyLinks: ["pol-a"],
          iso: {
            reviewCycle: "quarterly",
            oversightModel: "HITL",
            documentationLevel: "standard",
            lifecycleStatus: "active",
            lastReviewedAt: "2026-02-20T10:00:00.000Z",
            nextReviewAt: "2026-05-20T10:00:00.000Z",
          },
        },
      },
      reviews: [
        {
          reviewId: "r1",
          reviewedAt: "2026-02-20T10:00:00.000Z",
          reviewedBy: "auditor@example.com",
          nextStatus: "REVIEWED",
        },
      ],
      proof: {
        verifyUrl: "https://example.com/proof/1",
        generatedAt: "2026-02-20T10:00:00.000Z",
        verification: {
          isReal: true,
          isCurrent: true,
          scope: "Smoke",
        },
      },
    },
    {
      ...createBaseUseCase("uc_export_2"),
      status: "UNREVIEWED",
      isPublicVisible: false,
    },
  ];

  const artifacts = buildOrgExportArtifacts({
    useCases,
    orgSettings: createOrgSettings(),
    organisationName: "EUKI Test Organisation",
    policies: createPolicies(),
    now,
  });

  assert.equal(artifacts.length, 4);
  assert.ok(artifacts.every((artifact) => artifact.content.length > 20));

  const dossier = artifacts.find((artifact) => artifact.type === "iso_42001_dossier");
  const report = artifacts.find((artifact) => artifact.type === "governance_report");
  const trust = artifacts.find((artifact) => artifact.type === "trust_portal_bundle");
  const policy = artifacts.find((artifact) => artifact.type === "policy_bundle");

  assert.equal(dossier?.ready, true);
  assert.match(dossier?.fileName ?? "", /iso-42001-dossier-\d{4}-\d{2}-\d{2}\.md$/);
  assert.match(report?.fileName ?? "", /governance-report-\d{4}-\d{2}-\d{2}\.csv$/);
  assert.match(trust?.content ?? "", /Trust Portal Bundle/);
  assert.match(policy?.content ?? "", /KI-Richtlinie Basis/);

  const emptyArtifacts = buildOrgExportArtifacts({
    useCases: [],
    orgSettings: null,
    organisationName: null,
    policies: [],
    now,
  });

  assert.equal(emptyArtifacts.length, 4);
  assert.ok(emptyArtifacts.every((artifact) => artifact.content.length > 10));

  const emptyDossier = emptyArtifacts.find(
    (artifact) => artifact.type === "iso_42001_dossier"
  );
  assert.equal(emptyDossier?.ready, false);
  assert.ok((emptyDossier?.blockers.length ?? 0) > 0);

  console.log("Control org-export-center smoke tests passed.");
}

const isDirectRun =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  try {
    runOrgExportCenterSmoke();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
