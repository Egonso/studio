import { buildUseCaseFocusLink } from "@/lib/control/deep-link";
import { assemblePolicy, assemblePolicyMarkdown } from "@/lib/policy-engine/assembler";
import {
  isHighRiskClass,
  parseStoredAiActCategory,
} from "@/lib/register-first/risk-taxonomy";
import type { PolicyDocument, PolicyLevel } from "@/lib/policy-engine/types";
import {
  getPolicyLevelLabel as getLocalizedPolicyLevelLabel,
  getPolicyStatusLabel as getLocalizedPolicyStatusLabel,
} from "@/lib/i18n/governance-copy";
import type { OrgSettings, Register, UseCaseCard } from "@/lib/register-first/types";

export interface PolicyCoverageRow {
  policyId: string;
  title: string;
  status: string;
  level: string;
  version: number;
  linkedUseCases: number;
}

export interface UnmappedPolicyUseCase {
  useCaseId: string;
  purpose: string;
  deepLink: string;
}

export interface ControlPolicyCoverageSnapshot {
  totalUseCases: number;
  mappedUseCases: number;
  unmappedUseCases: number;
  coveragePercent: number;
  policiesTotal: number;
  approvedPolicies: number;
  policiesWithVersionHistory: number;
  orphanMappingReferences: number;
  rows: PolicyCoverageRow[];
  unmapped: UnmappedPolicyUseCase[];
}

export interface DeterministicPolicyPreview {
  level: PolicyLevel;
  levelLabel: string;
  markdown: string;
  sectionCount: number;
  sectionIds: string[];
  generatedAt: string;
  dataBasis: {
    totalUseCases: number;
    mappedUseCases: number;
    highRiskUseCases: number;
    externalFacingUseCases: number;
    deterministic: true;
  };
}

function percentage(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function normalizePolicyReference(value: string): string {
  return value.trim().toLowerCase();
}

function getPolicyReferences(useCase: UseCaseCard): string[] {
  const links = useCase.governanceAssessment?.flex?.policyLinks ?? [];
  return links
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function isExternalFacing(useCase: UseCaseCard): boolean {
  const externalContexts = new Set([
    "CUSTOMERS",
    "APPLICANTS",
    "PUBLIC",
    "CUSTOMER_FACING",
    "EXTERNAL_PUBLIC",
  ]);

  return useCase.usageContexts.some((context) => externalContexts.has(context));
}

function isHighRisk(useCase: UseCaseCard): boolean {
  return isHighRiskClass(
    parseStoredAiActCategory(useCase.governanceAssessment?.core?.aiActCategory)
  );
}

export function buildControlPolicyCoverage(
  useCases: UseCaseCard[],
  policies: PolicyDocument[],
  locale?: string
): ControlPolicyCoverageSnapshot {
  const policyIdSet = new Set(policies.map((policy) => normalizePolicyReference(policy.policyId)));

  let mappedUseCases = 0;
  let orphanMappingReferences = 0;

  const unmapped: UnmappedPolicyUseCase[] = [];

  for (const useCase of useCases) {
    const references = getPolicyReferences(useCase);

    if (references.length === 0) {
      unmapped.push({
        useCaseId: useCase.useCaseId,
        purpose: useCase.purpose,
        deepLink: buildUseCaseFocusLink(useCase.useCaseId, "policy"),
      });
      continue;
    }

    mappedUseCases += 1;

    for (const reference of references) {
      if (!policyIdSet.has(normalizePolicyReference(reference))) {
        orphanMappingReferences += 1;
      }
    }
  }

  const rows = policies
    .map((policy) => {
      const linkedUseCases = useCases.filter((useCase) =>
        getPolicyReferences(useCase)
          .map((reference) => normalizePolicyReference(reference))
          .includes(normalizePolicyReference(policy.policyId))
      ).length;

      return {
        policyId: policy.policyId,
        title: policy.title,
        status: getLocalizedPolicyStatusLabel(policy.status, locale),
        level: getLocalizedPolicyLevelLabel(policy.level, locale),
        version: policy.metadata.version,
        linkedUseCases,
      } satisfies PolicyCoverageRow;
    })
    .sort((left, right) => {
      if (left.linkedUseCases !== right.linkedUseCases) {
        return right.linkedUseCases - left.linkedUseCases;
      }
      return left.title.localeCompare(right.title);
    });

  return {
    totalUseCases: useCases.length,
    mappedUseCases,
    unmappedUseCases: Math.max(useCases.length - mappedUseCases, 0),
    coveragePercent: percentage(mappedUseCases, useCases.length),
    policiesTotal: policies.length,
    approvedPolicies: policies.filter((policy) => policy.status === "approved").length,
    policiesWithVersionHistory: policies.filter((policy) => (policy.versions?.length ?? 0) > 0)
      .length,
    orphanMappingReferences,
    rows,
    unmapped,
  };
}

export function buildDeterministicPolicyPreview(
  register: Register,
  useCases: UseCaseCard[],
  orgSettings: OrgSettings,
  level: PolicyLevel,
  now: Date = new Date(),
  locale?: string
): DeterministicPolicyPreview {
  const sections = assemblePolicy({
    register,
    useCases,
    orgSettings,
    level,
    locale,
  });

  const markdown = assemblePolicyMarkdown({
    register,
    useCases,
    orgSettings,
    level,
    locale,
  });

  const mappedUseCases = useCases.filter((useCase) => getPolicyReferences(useCase).length > 0).length;
  const highRiskUseCases = useCases.filter((useCase) => isHighRisk(useCase)).length;
  const externalFacingUseCases = useCases.filter((useCase) => isExternalFacing(useCase)).length;

  return {
    level,
    levelLabel: getLocalizedPolicyLevelLabel(level, locale),
    markdown,
    sectionCount: sections.length,
    sectionIds: sections.map((section) => section.sectionId),
    generatedAt: now.toISOString(),
    dataBasis: {
      totalUseCases: useCases.length,
      mappedUseCases,
      highRiskUseCases,
      externalFacingUseCases,
      deterministic: true,
    },
  };
}
