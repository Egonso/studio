import {
  buildAuditDossier,
  dossierToMarkdown,
  getDossierBlockers,
} from "@/lib/compliance-engine/audit/dossier-builder";
import {
  generateGovernanceReport,
  governanceReportToCSV,
} from "@/lib/compliance-engine/audit/governance-report";
import { registerUseCaseStatusLabels } from "@/lib/register-first/status-flow";
import type { OrgSettings, UseCaseCard } from "@/lib/register-first/types";
import {
  POLICY_LEVEL_LABELS,
  POLICY_STATUS_LABELS,
  type PolicyDocument,
} from "@/lib/policy-engine/types";

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
  organisationName: string | null | undefined
): OrgSettings {
  return {
    ...(orgSettings ?? {}),
    organisationName:
      orgSettings?.organisationName?.trim() ||
      organisationName?.trim() ||
      "Nicht hinterlegt",
    industry: orgSettings?.industry?.trim() || "Nicht hinterlegt",
    contactPerson: orgSettings?.contactPerson ?? {
      name: "Nicht hinterlegt",
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
  now: Date
): string {
  const lines: string[] = [
    "# ISO 42001 Dossier - Vorpruefung",
    "",
    `Organisation: ${orgSettings.organisationName}`,
    `Erstellt am: ${now.toISOString()}`,
    "",
    "Das vollstaendige Dossier ist noch nicht freigabefaehig.",
    "Folgende Punkte muessen zuerst dokumentiert werden:",
    "",
  ];

  for (const blocker of blockers) {
    lines.push(`- ${blocker}`);
  }

  lines.push("");
  lines.push(
    "Hinweis: Use-Case PDF/JSON Exporte bleiben im Register unveraendert verfuegbar."
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

function trustPortalBundleToMarkdown(bundle: TrustPortalBundleData): string {
  const lines: string[] = [
    "# Trust Portal Bundle",
    "",
    `Organisation: ${bundle.organisationName}`,
    `Erstellt am: ${bundle.generatedAt}`,
    "",
    "## Zusammenfassung",
    "",
    `- Systeme gesamt: ${bundle.totalSystems}`,
    `- Oeffentlich sichtbare Systeme: ${bundle.publicSystems}`,
    `- Geprueft/Nachweisfaehig (oeffentlich): ${bundle.reviewedPublicSystems}`,
    `- Nachweisfaehig (oeffentlich): ${bundle.proofReadyPublicSystems}`,
    `- Verifizierte Nachweise (oeffentlich): ${bundle.verifiedPublicProofs}`,
    "",
    "## Oeffentliche Statusverteilung",
    "",
    `- Formale Pruefung ausstehend: ${bundle.publicStatusDistribution.UNREVIEWED}`,
    `- Pruefung empfohlen: ${bundle.publicStatusDistribution.REVIEW_RECOMMENDED}`,
    `- Pruefung abgeschlossen: ${bundle.publicStatusDistribution.REVIEWED}`,
    `- Nachweisfaehig: ${bundle.publicStatusDistribution.PROOF_READY}`,
    "",
    "## Systemliste",
    "",
    "| Use Case | Status | Oeffentlich | Verifizierter Nachweis | Tool |",
    "|---|---|---|---|---|",
  ];

  for (const system of bundle.systems) {
    const statusLabel = registerUseCaseStatusLabels[system.status] ?? system.status;
    lines.push(
      `| ${system.purpose} | ${statusLabel} | ${system.isPublicVisible ? "Ja" : "Nein"} | ${
        system.hasVerifiedProof ? "Ja" : "Nein"
      } | ${system.toolName} |`
    );
  }

  lines.push("");
  lines.push(
    "Hinweis: Dieses Bundle aggregiert organisationsweite Transparenzdaten."
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
  now: Date
): string {
  const mappedUseCases = useCases.filter((useCase) => {
    const links = useCase.governanceAssessment?.flex?.policyLinks ?? [];
    return links.some((entry) => entry.trim().length > 0);
  }).length;

  const lines: string[] = [
    "# Policy Bundle Export",
    "",
    `Organisation: ${orgName}`,
    `Erstellt am: ${now.toISOString()}`,
    "",
    "## Kennzahlen",
    "",
    `- Richtlinien im Register: ${policies.length}`,
    `- Use Cases mit Policy-Mapping: ${mappedUseCases}/${useCases.length} (${percentage(
      mappedUseCases,
      useCases.length
    )}%)`,
    "",
  ];

  if (policies.length === 0) {
    lines.push("Es sind aktuell keine Richtlinien hinterlegt.");
    lines.push("");
    lines.push(
      "Hinweis: Der Export bleibt verfuegbar, auch wenn noch keine Policy angelegt wurde."
    );
    return lines.join("\n");
  }

  lines.push("## Richtlinienverzeichnis");
  lines.push("");
  lines.push("| Policy | Status | Level | Version | Letzte Aktualisierung | Zugeordnete Use Cases |",);
  lines.push("|---|---|---|---|---|---|");

  for (const policy of policies) {
    const linkedCount = useCases.filter((useCase) => isPolicyLinked(policy, useCase)).length;
    lines.push(
      `| ${policy.title} | ${POLICY_STATUS_LABELS[policy.status]} | ${
        POLICY_LEVEL_LABELS[policy.level]
      } | v${policy.metadata.version} | ${policy.metadata.updatedAt} | ${linkedCount} |`
    );
  }

  lines.push("");
  lines.push("## Policy-Inhalte (Markdown)");

  for (const policy of policies) {
    lines.push("");
    lines.push(`### ${policy.title} (${policy.policyId})`);
    lines.push("");
    lines.push(`Status: ${POLICY_STATUS_LABELS[policy.status]}`);
    lines.push(`Version: ${policy.metadata.version}`);
    lines.push("");

    if (policy.sections.length === 0) {
      lines.push("Keine Abschnitte hinterlegt.");
      continue;
    }

    for (const section of [...policy.sections].sort((a, b) => a.order - b.order)) {
      lines.push(`#### ${section.title}`);
      lines.push(section.content || "(leer)");
      lines.push("");
    }
  }

  return lines.join("\n");
}

function buildIsoDossierArtifact(
  useCases: UseCaseCard[],
  orgSettings: OrgSettings,
  now: Date
): OrgExportArtifact {
  const blockers = getDossierBlockers(useCases, orgSettings);
  const datePart = formatFileDate(now);

  if (blockers.length > 0) {
    return {
      type: "iso_42001_dossier",
      label: "ISO 42001 Dossier",
      description:
        "Organisationsweites Dossier fuer ISO-orientierte Audit-Vorbereitung.",
      fileName: `iso-42001-dossier-vorpruefung-${datePart}.md`,
      mimeType: "text/markdown;charset=utf-8",
      content: createDossierPreparationNote(blockers, orgSettings, now),
      ready: false,
      blockers,
    };
  }

  const dossier = buildAuditDossier(useCases, orgSettings, now);
  return {
    type: "iso_42001_dossier",
    label: "ISO 42001 Dossier",
    description: "Organisationsweites Dossier mit ISO-Abschnittsnachweisen.",
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
  now: Date
): OrgExportArtifact {
  const report = generateGovernanceReport(useCases, orgSettings, now);
  return {
    type: "governance_report",
    label: "Governance Report",
    description: "Stichtagsreport fuer organisationsweite Governance-Kennzahlen.",
    fileName: `governance-report-${formatFileDate(now)}.csv`,
    mimeType: "text/csv;charset=utf-8",
    content: governanceReportToCSV(report),
    ready: true,
    blockers: [],
  };
}

function buildTrustPortalBundleArtifact(
  useCases: UseCaseCard[],
  orgName: string,
  now: Date
): OrgExportArtifact {
  const bundle = buildTrustPortalBundleData(useCases, orgName, now);
  return {
    type: "trust_portal_bundle",
    label: "Trust Portal Bundle",
    description: "Aggregierter Transparenzstand fuer externe Nachweise.",
    fileName: `trust-portal-bundle-${formatFileDate(now)}.md`,
    mimeType: "text/markdown;charset=utf-8",
    content: trustPortalBundleToMarkdown(bundle),
    ready: true,
    blockers: [],
  };
}

function buildPolicyBundleArtifact(
  useCases: UseCaseCard[],
  policies: PolicyDocument[],
  orgName: string,
  now: Date
): OrgExportArtifact {
  return {
    type: "policy_bundle",
    label: "Policy Bundle",
    description: "Richtlinienpaket inkl. Versionen und Mapping auf Use Cases.",
    fileName: `policy-bundle-${formatFileDate(now)}.md`,
    mimeType: "text/markdown;charset=utf-8",
    content: buildPolicyBundleMarkdown(policies, useCases, orgName, now),
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
    input.organisationName
  );
  const orgName = normalizedOrgSettings.organisationName;
  const policies = input.policies ?? [];

  return [
    buildIsoDossierArtifact(input.useCases, normalizedOrgSettings, now),
    buildGovernanceReportArtifact(input.useCases, normalizedOrgSettings, now),
    buildTrustPortalBundleArtifact(input.useCases, orgName, now),
    buildPolicyBundleArtifact(input.useCases, policies, orgName, now),
  ];
}
