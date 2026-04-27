import type {
  PolicyLevel,
  PolicyStatus,
} from '@/lib/policy-engine/types';
import type { PremiumControlNavItem } from '@/lib/navigation/route-manifest';

export type GovernanceCopyLocale = 'de' | 'en';

export function resolveGovernanceCopyLocale(
  locale?: string | null,
): GovernanceCopyLocale {
  if (!locale) {
    return 'de';
  }
  return locale?.toLowerCase().startsWith('de') ? 'de' : 'en';
}

export function getGovernanceDateLocale(locale?: string | null): string {
  return resolveGovernanceCopyLocale(locale) === 'de' ? 'de-DE' : 'en-GB';
}

export function formatGovernanceDate(
  date: Date | string | number,
  locale?: string | null,
): string {
  return new Date(date).toLocaleDateString(getGovernanceDateLocale(locale), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatGovernanceDateTime(
  date: Date | string | number,
  locale?: string | null,
): string {
  return new Date(date).toLocaleString(getGovernanceDateLocale(locale), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const POLICY_STATUS_LABELS_BY_LOCALE: Record<
  GovernanceCopyLocale,
  Record<PolicyStatus, string>
> = {
  de: {
    draft: 'Entwurf',
    review: 'In Prüfung',
    approved: 'Genehmigt',
    archived: 'Archiviert',
  },
  en: {
    draft: 'Draft',
    review: 'Under review',
    approved: 'Approved',
    archived: 'Archived',
  },
};

export const POLICY_LEVEL_LABELS_BY_LOCALE: Record<
  GovernanceCopyLocale,
  Record<PolicyLevel, string>
> = {
  de: {
    1: 'Commitment (1 Seite)',
    2: 'Framework (3-5 Seiten)',
    3: 'Enterprise (8-10 Seiten)',
  },
  en: {
    1: 'Commitment (1 page)',
    2: 'Framework (3-5 pages)',
    3: 'Enterprise (8-10 pages)',
  },
};

export function getPolicyStatusLabel(
  status: PolicyStatus,
  locale?: string | null,
): string {
  return POLICY_STATUS_LABELS_BY_LOCALE[resolveGovernanceCopyLocale(locale)][
    status
  ];
}

export function getPolicyLevelLabel(
  level: PolicyLevel,
  locale?: string | null,
): string {
  return POLICY_LEVEL_LABELS_BY_LOCALE[resolveGovernanceCopyLocale(locale)][
    level
  ];
}

export function getPolicyDocumentTitle(
  level: PolicyLevel,
  locale?: string | null,
): string {
  const resolvedLocale = resolveGovernanceCopyLocale(locale);
  const prefix = resolvedLocale === 'de' ? 'KI-Richtlinie' : 'AI Policy';
  return `${prefix} - ${getPolicyLevelLabel(level, resolvedLocale)}`;
}

export const POLICY_SECTION_TITLES_BY_LOCALE: Record<
  GovernanceCopyLocale,
  Record<string, string>
> = {
  de: {
    'l1-commitment': 'Verpflichtung zur verantwortungsvollen Nutzung von KI',
    'l1-basic-rules': 'Grundregeln für die KI-Nutzung',
    'l1-signature': 'Inkrafttreten und Unterschriften',
    'l2-roles': 'Rollen und Verantwortlichkeiten',
    'l2-risk-approach': 'Risikobasierter Einsatz von KI-Systemen',
    'l2-incident': 'Vorfallmanagement',
    'l2-training': 'Schulung und Qualifizierung',
    'l2-monitoring': 'Monitoring und Audit',
    'l3-data-governance': 'Data Governance und Datenschutz',
    'l3-high-risk': 'Anforderungen an Hochrisiko-KI-Systeme',
    'l3-transparency': 'Transparenzpflichten',
    'l3-validation': 'Validierung und Test',
    'l3-logging': 'Logging und Alarmierung',
    'l3-external-systems': 'Externe und kundenbezogene KI-Systeme',
    'l3-hr-recruitment': 'KI im Bewerbungs- und HR-Prozess',
  },
  en: {
    'l1-commitment': 'Commitment to Responsible Use of AI Systems',
    'l1-basic-rules': 'Basic Rules for AI Use',
    'l1-signature': 'Effective Date and Signatures',
    'l2-roles': 'Roles and Responsibilities',
    'l2-risk-approach': 'Risk-Based Use of AI Systems',
    'l2-incident': 'Incident Management',
    'l2-training': 'Training and Qualification',
    'l2-monitoring': 'Monitoring and Audit',
    'l3-data-governance': 'Data Governance and Data Protection',
    'l3-high-risk': 'Requirements for High-Risk AI Systems',
    'l3-transparency': 'Transparency Obligations',
    'l3-validation': 'Validation and Testing',
    'l3-logging': 'Logging and Alerting',
    'l3-external-systems': 'External and Customer-Facing AI Systems',
    'l3-hr-recruitment': 'AI Systems in Recruitment and HR Processes',
  },
};

export function getPolicySectionTitle(
  sectionId: string,
  fallback: string,
  locale?: string | null,
): string {
  return (
    POLICY_SECTION_TITLES_BY_LOCALE[resolveGovernanceCopyLocale(locale)][
      sectionId
    ] ?? fallback
  );
}

export function getConditionalPolicySectionLabel(
  sectionId: string,
  locale?: string | null,
): string {
  const resolvedLocale = resolveGovernanceCopyLocale(locale);
  if (resolvedLocale === 'de') {
    return `Bedingt aufgenommen: ${sectionId}`;
  }
  return `Conditionally included: ${sectionId}`;
}

type PremiumControlNavCopy = {
  label: string;
  headerLabel?: string;
  description: string;
};

const PREMIUM_CONTROL_NAV_COPY: Record<
  GovernanceCopyLocale,
  Record<PremiumControlNavItem['id'], PremiumControlNavCopy>
> = {
  de: {
    overview: {
      label: 'Bericht',
      headerLabel: 'Bericht',
      description:
        'Registerbasierte Analyse von Reifegrad, Reviews, Lernfortschritt und Nachweisen.',
    },
    reviews: {
      label: 'Reviews',
      description: 'Action Queue, überfällige Reviews und formale Prüfarbeit.',
    },
    governanceSettings: {
      label: 'Governance-Einstellungen',
      description:
        'Organisationsweite Regeln, Rollen, Review-Zyklen und Zugangscodes.',
    },
    policies: {
      label: 'Policy Engine',
      description: 'Governance-Richtlinien erzeugen und pflegen.',
    },
    exports: {
      label: 'Exports / Audit',
      description: 'Audit-Dossier und organisationsweite Exporte.',
    },
    trust: {
      label: 'Trust Portal',
      description: 'Externe Trust-Signale und öffentliche Offenlegung.',
    },
    enterprise: {
      label: 'Organisation',
      description:
        'Rollen, Mitglieder, Identity, SCIM, Beschaffung und formale Freigaben.',
    },
    academy: {
      label: 'Academy',
      description: 'Lernfortschritt, Inhalte und Zertifizierungsablauf.',
    },
  },
  en: {
    overview: {
      label: 'Report',
      headerLabel: 'Report',
      description:
        'Register-based analysis of maturity level, reviews, course progress and evidence.',
    },
    reviews: {
      label: 'Reviews',
      description: 'Action Queue, overdue reviews and formal review workload.',
    },
    governanceSettings: {
      label: 'Governance Settings',
      description:
        'Organisation-wide governance rules, roles, review cycles and access codes.',
    },
    policies: {
      label: 'Policy Engine',
      description: 'Generate and maintain governance policies.',
    },
    exports: {
      label: 'Exports / Audit',
      description: 'Audit dossier and export center.',
    },
    trust: {
      label: 'Trust Portal',
      description: 'External trust signals and public disclosure.',
    },
    enterprise: {
      label: 'Organisation',
      description:
        'Roles, members, identity, SCIM, procurement and formal approvals.',
    },
    academy: {
      label: 'Academy',
      description: 'Course progress, learning content and certification flow.',
    },
  },
};

export function getPremiumControlNavCopy(
  itemId: PremiumControlNavItem['id'],
  locale?: string | null,
): PremiumControlNavCopy {
  return PREMIUM_CONTROL_NAV_COPY[resolveGovernanceCopyLocale(locale)][itemId];
}

export const GOVERNANCE_COMMON_COPY = {
  de: {
    yes: 'Ja',
    no: 'Nein',
    open: 'Offen',
    unknown: 'Unbekannt',
    ready: 'Bereit',
    exportReady: 'Export bereit',
    preCheckRequired: 'Vorprüfung erforderlich',
    openItems: 'Offene Punkte:',
    generatedAt: 'Erstellt',
    asOf: 'Stand',
    details: 'Details',
    useCases: 'Use Cases',
    systems: 'Systeme',
    highRisk: 'Hochrisiko',
    total: 'Gesamt',
    status: 'Status',
    version: 'Version',
    level: 'Level',
    organisation: 'Organisation',
  },
  en: {
    yes: 'Yes',
    no: 'No',
    open: 'Open',
    unknown: 'Unknown',
    ready: 'Ready',
    exportReady: 'Export ready',
    preCheckRequired: 'Pre-check required',
    openItems: 'Open items:',
    generatedAt: 'Generated',
    asOf: 'As of',
    details: 'Details',
    useCases: 'Use cases',
    systems: 'Systems',
    highRisk: 'High risk',
    total: 'Total',
    status: 'Status',
    version: 'Version',
    level: 'Level',
    organisation: 'Organisation',
  },
} as const;

export function getGovernanceCommonCopy(locale?: string | null) {
  return GOVERNANCE_COMMON_COPY[resolveGovernanceCopyLocale(locale)];
}
