import {
  buildAuditDossier,
  dossierToMarkdown,
  getDossierBlockers,
} from "@/lib/compliance-engine/audit/dossier-builder";
import {
  generateGovernanceReport,
  governanceReportToCSV,
} from "@/lib/compliance-engine/audit/governance-report";
import { getRegisterUseCaseStatusLabel } from "@/lib/register-first/status-flow";
import type { OrgSettings, UseCaseCard } from "@/lib/register-first/types";
import {
  type PolicyDocument,
} from "@/lib/policy-engine/types";
import {
  getPolicyLevelLabel,
  getPolicyStatusLabel,
  resolveGovernanceCopyLocale,
} from "@/lib/i18n/governance-copy";

export type OrgExportType =
  | "iso_42001_dossier"
  | "governance_report"
  | "trust_portal_bundle"
  | "policy_bundle";

export interface OrgExportArtifact {
  type: OrgExportType;
  label: string;
  description: string;
  fileName: string;
  mimeType: string;
  content: string;
  ready: boolean;
  blockers: string[];
}

export interface BuildOrgExportArtifactsInput {
  useCases: UseCaseCard[];
  orgSettings?: OrgSettings | null;
  organisationName?: string | null;
  policies?: PolicyDocument[];
  now?: Date;
  locale?: string;
}

interface TrustPortalBundleData {
  generatedAt: string;
  organisationName: string;
  totalSystems: number;
  publicSystems: number;
  reviewedPublicSystems: number;
  proofReadyPublicSystems: number;
  verifiedPublicProofs: number;
  publicStatusDistribution: {
    UNREVIEWED: number;
    REVIEW_RECOMMENDED: number;
    REVIEWED: number;
    PROOF_READY: number;
  };
  systems: Array<{
    useCaseId: string;
    purpose: string;
    status: UseCaseCard["status"];
    isPublicVisible: boolean;
    hasVerifiedProof: boolean;
    toolName: string;
    verifyUrl: string | null;
  }>;
}

function formatFileDate(now: Date): string {
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeOrgSettings(
  orgSettings: OrgSettings | null | undefined,
  organisationName: string | null | undefined,
  locale?: string
): OrgSettings {
  const fallback = resolveGovernanceCopyLocale(locale) === "de" ? "Nicht hinterlegt" : "Not configured";
  return {
    ...(orgSettings ?? {}),
    organisationName:
      orgSettings?.organisationName?.trim() ||
      organisationName?.trim() ||
      fallback,
    industry: orgSettings?.industry?.trim() || fallback,
    contactPerson: orgSettings?.contactPerson ?? {
      name: fallback,
      email: "not-configured@example.invalid",
    },
  };
}

function percentage(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function createDossierPreparationNote(
  blockers: string[],
  orgSettings: OrgSettings,
  now: Date,
  locale?: string
): string {
  const isGerman = resolveGovernanceCopyLocale(locale) === "de";
  const lines: string[] = [
    isGerman ? "# ISO 42001 Dossier - Vorprüfung" : "# ISO 42001 Dossier - Pre-check",
    "",
    `Organisation: ${orgSettings.organisationName}`,
    `${isGerman ? "Erstellt am" : "Generated at"}: ${now.toISOString()}`,
    "",
    isGerman
      ? "Das vollständige Dossier ist noch nicht freigabefähig."
      : "The complete dossier is not ready for release yet.",
    isGerman
      ? "Folgende Punkte müssen zuerst dokumentiert werden:"
      : "The following items should be documented first:",
    "",
  ];

  for (const blocker of blockers) {
    lines.push(`- ${blocker}`);
  }

  lines.push("");
  lines.push(
    isGerman
      ? "Hinweis: Use-Case PDF/JSON Exporte bleiben im Register unverändert verfügbar."
      : "Note: Use-case PDF/JSON exports remain available unchanged in the register."
  );

  return lines.join("\n");
}

function buildTrustPortalBundleData(
  useCases: UseCaseCard[],
  organisationName: string,
  now: Date
): TrustPortalBundleData {
  const statusDistribution = {
    UNREVIEWED: 0,
    REVIEW_RECOMMENDED: 0,
    REVIEWED: 0,
    PROOF_READY: 0,
  };

  for (const useCase of useCases) {
    if (useCase.isPublicVisible) {
      statusDistribution[useCase.status] += 1;
    }
  }

  const publicSystems = useCases.filter((useCase) => useCase.isPublicVisible);

  const reviewedPublicSystems = publicSystems.filter(
    (useCase) => useCase.status === "REVIEWED" || useCase.status === "PROOF_READY"
  ).length;
  const proofReadyPublicSystems = publicSystems.filter(
    (useCase) => useCase.status === "PROOF_READY"
  ).length;
  const verifiedPublicProofs = publicSystems.filter(
    (useCase) => Boolean(useCase.proof?.verification?.isReal && useCase.proof?.verification?.isCurrent)
  ).length;

  return {
    generatedAt: now.toISOString(),
    organisationName,
    totalSystems: useCases.length,
    publicSystems: publicSystems.length,
    reviewedPublicSystems,
    proofReadyPublicSystems,
    verifiedPublicProofs,
    publicStatusDistribution: statusDistribution,
    systems: useCases.map((useCase) => ({
      useCaseId: useCase.useCaseId,
      purpose: useCase.purpose,
      status: useCase.status,
      isPublicVisible: Boolean(useCase.isPublicVisible),
      hasVerifiedProof: Boolean(
        useCase.proof?.verification?.isReal && useCase.proof?.verification?.isCurrent
      ),
      toolName: useCase.toolFreeText || useCase.toolId || "-",
      verifyUrl: useCase.proof?.verifyUrl ?? null,
    })),
  };
}

function trustPortalBundleToMarkdown(
  bundle: TrustPortalBundleData,
  locale?: string
): string {
  const isGerman = resolveGovernanceCopyLocale(locale) === "de";
  const lines: string[] = [
    "# Trust Portal Bundle",
    "",
    `Organisation: ${bundle.organisationName}`,
    `${isGerman ? "Erstellt am" : "Generated at"}: ${bundle.generatedAt}`,
    "",
    isGerman ? "## Zusammenfassung" : "## Summary",
    "",
    `- ${isGerman ? "Systeme gesamt" : "Total systems"}: ${bundle.totalSystems}`,
    `- ${isGerman ? "Öffentlich sichtbare Systeme" : "Publicly visible systems"}: ${bundle.publicSystems}`,
    `- ${isGerman ? "Geprüft/Nachweisfähig (öffentlich)" : "Reviewed/proof-ready (public)"}: ${bundle.reviewedPublicSystems}`,
    `- ${isGerman ? "Nachweisfähig (öffentlich)" : "Proof-ready (public)"}: ${bundle.proofReadyPublicSystems}`,
    `- ${isGerman ? "Verifizierte Nachweise (öffentlich)" : "Verified evidence (public)"}: ${bundle.verifiedPublicProofs}`,
    "",
    isGerman ? "## Öffentliche Statusverteilung" : "## Public Status Distribution",
    "",
    `- ${getRegisterUseCaseStatusLabel("UNREVIEWED", locale)}: ${bundle.publicStatusDistribution.UNREVIEWED}`,
    `- ${getRegisterUseCaseStatusLabel("REVIEW_RECOMMENDED", locale)}: ${bundle.publicStatusDistribution.REVIEW_RECOMMENDED}`,
    `- ${getRegisterUseCaseStatusLabel("REVIEWED", locale)}: ${bundle.publicStatusDistribution.REVIEWED}`,
    `- ${getRegisterUseCaseStatusLabel("PROOF_READY", locale)}: ${bundle.publicStatusDistribution.PROOF_READY}`,
    "",
    isGerman ? "## Systemliste" : "## System List",
    "",
    isGerman
      ? "| Use Case | Status | Öffentlich | Verifizierter Nachweis | Tool |"
      : "| Use case | Status | Public | Verified evidence | Tool |",
    "|---|---|---|---|---|",
  ];

  for (const system of bundle.systems) {
    const statusLabel = getRegisterUseCaseStatusLabel(system.status, locale) ?? system.status;
    lines.push(
      `| ${system.purpose} | ${statusLabel} | ${system.isPublicVisible ? (isGerman ? "Ja" : "Yes") : (isGerman ? "Nein" : "No")} | ${
        system.hasVerifiedProof ? (isGerman ? "Ja" : "Yes") : (isGerman ? "Nein" : "No")
      } | ${system.toolName} |`
    );
  }

  lines.push("");
  lines.push(
    isGerman
      ? "Hinweis: Dieses Bundle aggregiert organisationsweite Transparenzdaten."
      : "Note: This bundle aggregates organisation-wide transparency data."
  );

  return lines.join("\n");
}

function isPolicyLinked(policy: PolicyDocument, useCase: UseCaseCard): boolean {
  const policyLinks = useCase.governanceAssessment?.flex?.policyLinks ?? [];
  return policyLinks.some(
    (entry) => entry.trim().toLowerCase() === policy.policyId.toLowerCase()
  );
}

function buildPolicyBundleMarkdown(
  policies: PolicyDocument[],
  useCases: UseCaseCard[],
  orgName: string,
  now: Date,
  locale?: string
): string {
  const isGerman = resolveGovernanceCopyLocale(locale) === "de";
  const mappedUseCases = useCases.filter((useCase) => {
    const links = useCase.governanceAssessment?.flex?.policyLinks ?? [];
    return links.some((entry) => entry.trim().length > 0);
  }).length;

  const lines: string[] = [
    "# Policy Bundle Export",
    "",
    `Organisation: ${orgName}`,
    `${isGerman ? "Erstellt am" : "Generated at"}: ${now.toISOString()}`,
    "",
    isGerman ? "## Kennzahlen" : "## Metrics",
    "",
    `- ${isGerman ? "Richtlinien im Register" : "Policies in register"}: ${policies.length}`,
    `- ${isGerman ? "Use Cases mit Policy-Mapping" : "Use cases with policy mapping"}: ${mappedUseCases}/${useCases.length} (${percentage(
      mappedUseCases,
      useCases.length
    )}%)`,
    "",
  ];

  if (policies.length === 0) {
    lines.push(isGerman ? "Es sind aktuell keine Richtlinien hinterlegt." : "No policies are currently documented.");
    lines.push("");
    lines.push(
      isGerman
        ? "Hinweis: Der Export bleibt verfügbar, auch wenn noch keine Policy angelegt wurde."
        : "Note: The export remains available even if no policy has been created yet."
    );
    return lines.join("\n");
  }

  lines.push(isGerman ? "## Richtlinienverzeichnis" : "## Policy Directory");
  lines.push("");
  lines.push(
    isGerman
      ? "| Policy | Status | Level | Version | Letzte Aktualisierung | Zugeordnete Use Cases |"
      : "| Policy | Status | Level | Version | Last updated | Linked use cases |",
  );
  lines.push("|---|---|---|---|---|---|");

  for (const policy of policies) {
    const linkedCount = useCases.filter((useCase) => isPolicyLinked(policy, useCase)).length;
    lines.push(
      `| ${policy.title} | ${getPolicyStatusLabel(policy.status, locale)} | ${
        getPolicyLevelLabel(policy.level, locale)
      } | v${policy.metadata.version} | ${policy.metadata.updatedAt} | ${linkedCount} |`
    );
  }

  lines.push("");
  lines.push(isGerman ? "## Policy-Inhalte (Markdown)" : "## Policy Contents (Markdown)");

  for (const policy of policies) {
    lines.push("");
    lines.push(`### ${policy.title} (${policy.policyId})`);
    lines.push("");
    lines.push(`${isGerman ? "Status" : "Status"}: ${getPolicyStatusLabel(policy.status, locale)}`);
    lines.push(`${isGerman ? "Version" : "Version"}: ${policy.metadata.version}`);
    lines.push("");

    if (policy.sections.length === 0) {
      lines.push(isGerman ? "Keine Abschnitte hinterlegt." : "No sections documented.");
      continue;
    }

    for (const section of [...policy.sections].sort((a, b) => a.order - b.order)) {
      lines.push(`#### ${section.title}`);
      lines.push(section.content || (isGerman ? "(leer)" : "(empty)"));
      lines.push("");
    }
  }

  return lines.join("\n");
}

function buildIsoDossierArtifact(
  useCases: UseCaseCard[],
  orgSettings: OrgSettings,
  now: Date,
  locale?: string
): OrgExportArtifact {
  const isGerman = resolveGovernanceCopyLocale(locale) === "de";
  const blockers = getDossierBlockers(useCases, orgSettings);
  const datePart = formatFileDate(now);

  if (blockers.length > 0) {
    return {
      type: "iso_42001_dossier",
      label: "ISO 42001 Dossier",
      description:
        isGerman
          ? "Organisationsweites Dossier für ISO-orientierte Audit-Vorbereitung."
          : "Organisation-wide dossier for ISO-oriented audit preparation.",
      fileName: isGerman
        ? `iso-42001-dossier-vorpruefung-${datePart}.md`
        : `iso-42001-dossier-pre-check-${datePart}.md`,
      mimeType: "text/markdown;charset=utf-8",
      content: createDossierPreparationNote(blockers, orgSettings, now, locale),
      ready: false,
      blockers,
    };
  }

  const dossier = buildAuditDossier(useCases, orgSettings, now);
  return {
    type: "iso_42001_dossier",
    label: "ISO 42001 Dossier",
    description: isGerman
      ? "Organisationsweites Dossier mit ISO-Abschnittsnachweisen."
      : "Organisation-wide dossier with ISO section evidence.",
    fileName: `iso-42001-dossier-${datePart}.md`,
    mimeType: "text/markdown;charset=utf-8",
    content: dossierToMarkdown(dossier),
    ready: true,
    blockers: [],
  };
}

function buildGovernanceReportArtifact(
  useCases: UseCaseCard[],
  orgSettings: OrgSettings,
  now: Date,
  locale?: string
): OrgExportArtifact {
  const report = generateGovernanceReport(useCases, orgSettings, now, locale);
  const isGerman = resolveGovernanceCopyLocale(locale) === "de";
  return {
    type: "governance_report",
    label: "Governance Report",
    description: isGerman
      ? "Stichtagsreport für organisationsweite Governance-Kennzahlen."
      : "Point-in-time report for organisation-wide governance metrics.",
    fileName: `governance-report-${formatFileDate(now)}.csv`,
    mimeType: "text/csv;charset=utf-8",
    content: governanceReportToCSV(report, locale),
    ready: true,
    blockers: [],
  };
}

function buildTrustPortalBundleArtifact(
  useCases: UseCaseCard[],
  orgName: string,
  now: Date,
  locale?: string
): OrgExportArtifact {
  const isGerman = resolveGovernanceCopyLocale(locale) === "de";
  const bundle = buildTrustPortalBundleData(useCases, orgName, now);
  return {
    type: "trust_portal_bundle",
    label: "Trust Portal Bundle",
    description: isGerman
      ? "Aggregierter Transparenzstand für externe Nachweise."
      : "Aggregated transparency status for external evidence.",
    fileName: `trust-portal-bundle-${formatFileDate(now)}.md`,
    mimeType: "text/markdown;charset=utf-8",
    content: trustPortalBundleToMarkdown(bundle, locale),
    ready: true,
    blockers: [],
  };
}

function buildPolicyBundleArtifact(
  useCases: UseCaseCard[],
  policies: PolicyDocument[],
  orgName: string,
  now: Date,
  locale?: string
): OrgExportArtifact {
  const isGerman = resolveGovernanceCopyLocale(locale) === "de";
  return {
    type: "policy_bundle",
    label: "Policy Bundle",
    description: isGerman
      ? "Richtlinienpaket inkl. Versionen und Mapping auf Use Cases."
      : "Policy package including versions and use-case mapping.",
    fileName: `policy-bundle-${formatFileDate(now)}.md`,
    mimeType: "text/markdown;charset=utf-8",
    content: buildPolicyBundleMarkdown(policies, useCases, orgName, now, locale),
    ready: true,
    blockers: [],
  };
}

export function buildOrgExportArtifacts(
  input: BuildOrgExportArtifactsInput
): OrgExportArtifact[] {
  const now = input.now ?? new Date();
  const normalizedOrgSettings = normalizeOrgSettings(
    input.orgSettings,
    input.organisationName,
    input.locale
  );
  const orgName = normalizedOrgSettings.organisationName;
  const policies = input.policies ?? [];

  return [
    buildIsoDossierArtifact(input.useCases, normalizedOrgSettings, now, input.locale),
    buildGovernanceReportArtifact(input.useCases, normalizedOrgSettings, now, input.locale),
    buildTrustPortalBundleArtifact(input.useCases, orgName, now, input.locale),
    buildPolicyBundleArtifact(input.useCases, policies, orgName, now, input.locale),
  ];
}
