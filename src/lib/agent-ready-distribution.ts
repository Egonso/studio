export type AgentActionClassification =
  | 'read_only'
  | 'approval_required'
  | 'blocked';

export interface AgentActionPolicyEntry {
  action: string;
  label: string;
  classification: AgentActionClassification;
  description: string;
}

export interface AgentDistributionProfile {
  schemaVersion: '1.0.0';
  kind: 'kiregister.agent_distribution_profile';
  product: {
    name: 'KIRegister';
    category: 'AI governance register';
    primaryUse: string;
  };
  capabilities: string[];
  publicArtifacts: string[];
  humanApprovalRequiredFor: string[];
  blockedForAgentOnly: string[];
  dataProcessingSummary: {
    personalDataPossible: boolean;
    specialCategoriesBlockedByDefault: boolean;
    sourceAllowlistRequired: boolean;
    publicDiscoveryUsesWorkspaceData: false;
  };
}

export interface AgentDemoSession {
  schemaVersion: '1.0.0';
  kind: 'kiregister.agent_demo_session';
  sessionId: string;
  createdAt: string;
  expiresAt: string;
  mode: 'read_only_demo';
  availableActions: string[];
  blockedActions: string[];
  sampleUseCases: SampleAgentUseCase[];
  sampleExport: SampleAgentExport;
  auditEvent: AgentDistributionAuditEvent;
}

export interface ProcurementDossier {
  schemaVersion: '1.0.0';
  kind: 'kiregister.procurement_dossier';
  status: 'draft';
  generatedAt: string;
  fitSummary: string;
  requiredApprovals: string[];
  dataProcessingSummary: AgentDistributionProfile['dataProcessingSummary'];
  evidenceArtifacts: Array<{
    id: string;
    title: string;
    type: 'json' | 'pdf' | 'markdown' | 'policy';
    href: string;
  }>;
  blockedActions: string[];
  nextHumanReviewQuestions: string[];
  auditEvent: AgentDistributionAuditEvent;
}

export interface AgentDistributionAuditEvent {
  eventId: string;
  eventType:
    | 'agent_discovery_read'
    | 'agent_demo_session_created'
    | 'agent_procurement_dossier_created'
    | 'agent_checkout_intent_prepared';
  occurredAt: string;
  actorType: 'external_agent' | 'public_client';
  mode: 'read_only' | 'approval_required';
  containsWorkspaceData: false;
  containsPersonalData: false;
}

export interface AgenticCommerceSandboxIntent {
  schemaVersion: '1.0.0';
  kind: 'kiregister.agentic_commerce_sandbox_intent';
  status: 'approval_required';
  mode: 'sandbox_only';
  createdAt: string;
  requestedAction: 'prepare_checkout_intent';
  checkoutCanBeStartedByAgent: false;
  humanApprovalRequired: true;
  requiredApprovals: string[];
  blockedActions: string[];
  auditEvent: AgentDistributionAuditEvent;
}

export interface SampleAgentUseCase {
  useCaseId: string;
  purpose: string;
  status: 'REVIEW_RECOMMENDED' | 'PROOF_READY';
  owner: string;
  riskClass: 'LIMITED' | 'HIGH';
  activity: string;
  evidenceCount: number;
}

export interface SampleAgentExport {
  exportId: string;
  title: string;
  generatedFrom: 'curated_demo_data';
  containsWorkspaceData: false;
  useCasePassAvailable: true;
  fields: string[];
}

const ISO_DATE = '2026-06-18T00:00:00.000Z';

export const AGENT_ACTION_POLICY: AgentActionPolicyEntry[] = [
  {
    action: 'read_public_product_profile',
    label: 'Produktprofil lesen',
    classification: 'read_only',
    description:
      'Liest öffentliche KIRegister-Capabilities, Artefakte und Governance-Grenzen.',
  },
  {
    action: 'start_read_only_demo',
    label: 'Demo-Session starten',
    classification: 'read_only',
    description:
      'Erzeugt eine kuratierte Demo-Session ohne echte Workspace-Daten.',
  },
  {
    action: 'generate_draft_procurement_dossier',
    label: 'Entscheidungsdossier vorbereiten',
    classification: 'read_only',
    description:
      'Erstellt ein Dossier als Entwurf für Einkauf, IT-Security und Rechtsprüfung.',
  },
  {
    action: 'create_workspace',
    label: 'Workspace erstellen',
    classification: 'approval_required',
    description:
      'Darf nur nach menschlicher Zustimmung und Authentifizierung vorbereitet werden.',
  },
  {
    action: 'connect_source',
    label: 'Quelle verbinden',
    classification: 'approval_required',
    description:
      'Externe Quellen benötigen explizites Opt-in, Scope-Auswahl und Audit-Nachweis.',
  },
  {
    action: 'submit_candidate',
    label: 'Review-Kandidat einreichen',
    classification: 'approval_required',
    description:
      'Einreichung ist nur mit geeignetem Agent-Kit-Key und menschlicher Freigabe zulässig.',
  },
  {
    action: 'start_checkout',
    label: 'Checkout vorbereiten',
    classification: 'approval_required',
    description:
      'Agentic Commerce bleibt in der Sandbox und kann keine Zahlung auslösen.',
  },
  {
    action: 'accept_terms',
    label: 'Bedingungen akzeptieren',
    classification: 'blocked',
    description:
      'Vertragsannahme ist keine Agent-only-Aktion und bleibt menschlich.',
  },
  {
    action: 'silent_subscription_purchase',
    label: 'Abo still buchen',
    classification: 'blocked',
    description:
      'Zahlungs- oder Vertragsaktionen dürfen nicht ohne menschliche Freigabe stattfinden.',
  },
  {
    action: 'final_legal_assessment',
    label: 'Rechtliche Prüfung abschließen',
    classification: 'blocked',
    description:
      'KIRegister bereitet Nachweise vor, schließt aber keine Rechtsbewertung automatisch ab.',
  },
  {
    action: 'risk_classification_as_final',
    label: 'Risikoklasse final setzen',
    classification: 'blocked',
    description:
      'Risikoklassen können vorgeschlagen, aber nicht agent-only finalisiert werden.',
  },
];

export function classifyAgentAction(action: string): AgentActionClassification {
  return (
    AGENT_ACTION_POLICY.find((entry) => entry.action === action)
      ?.classification ?? 'blocked'
  );
}

export function getAgentActionPolicy() {
  return {
    schemaVersion: '1.0.0' as const,
    kind: 'kiregister.agent_action_policy' as const,
    defaultMode: 'read_only' as const,
    allowedWithoutHumanApproval: AGENT_ACTION_POLICY.filter(
      (entry) => entry.classification === 'read_only',
    ).map((entry) => entry.action),
    requiresHumanApproval: AGENT_ACTION_POLICY.filter(
      (entry) => entry.classification === 'approval_required',
    ).map((entry) => entry.action),
    neverAllowedForAgentOnly: AGENT_ACTION_POLICY.filter(
      (entry) => entry.classification === 'blocked',
    ).map((entry) => entry.action),
    actions: AGENT_ACTION_POLICY,
  };
}

export function getAgentDistributionProfile(): AgentDistributionProfile {
  return {
    schemaVersion: '1.0.0',
    kind: 'kiregister.agent_distribution_profile',
    product: {
      name: 'KIRegister',
      category: 'AI governance register',
      primaryUse:
        'Document AI use cases, governance reviews, evidence and audit exports under the EU AI Act.',
    },
    capabilities: [
      'read_public_product_profile',
      'start_read_only_demo',
      'generate_draft_procurement_dossier',
      'prepare_register_candidate_after_approval',
      'export_audit_evidence_after_authentication',
    ],
    publicArtifacts: [
      '/llms.txt',
      '/.well-known/kiregister-agent.json',
      '/api/agent/discovery',
      '/api/agent/openapi.json',
      '/api/agent/demo/session',
      '/api/agent/procurement-dossier',
      '/api/mcp',
      '/api/agent/a2a-card',
      '/api/agent/audit-export',
      '/api/agent/commerce/prepare-checkout-intent',
    ],
    humanApprovalRequiredFor: [
      'paid_activation',
      'workspace_creation',
      'source_connection',
      'submitting_register_entries',
      'formal_risk_classification',
      'external_data_connection',
    ],
    blockedForAgentOnly: [
      'final_legal_assessment',
      'silent_subscription_purchase',
      'accept_terms',
      'risk_classification_as_final',
    ],
    dataProcessingSummary: {
      personalDataPossible: true,
      specialCategoriesBlockedByDefault: true,
      sourceAllowlistRequired: true,
      publicDiscoveryUsesWorkspaceData: false,
    },
  };
}

export function getAgentDiscoveryResponse() {
  return {
    schemaVersion: '1.0.0' as const,
    kind: 'kiregister.agent_discovery' as const,
    generatedAt: ISO_DATE,
    profile: getAgentDistributionProfile(),
    actionPolicy: getAgentActionPolicy(),
    demo: {
      sessionEndpoint: '/api/agent/demo/session',
      mode: 'read_only_demo',
    },
    procurement: {
      dossierEndpoint: '/api/agent/procurement-dossier',
      markdownFormat: '/api/agent/procurement-dossier?format=markdown',
      status: 'draft_only',
    },
    integrations: {
      mcpEndpoint: '/api/mcp',
      a2aAgentCard: '/api/agent/a2a-card',
      commerceSandbox: '/api/agent/commerce/prepare-checkout-intent',
    },
  };
}

function buildAuditEvent(
  eventType: AgentDistributionAuditEvent['eventType'],
  now: Date,
  mode: AgentDistributionAuditEvent['mode'] = 'read_only',
): AgentDistributionAuditEvent {
  const occurredAt = now.toISOString();
  return {
    eventId: `${eventType}_${occurredAt.replace(/[^0-9]/g, '').slice(0, 14)}`,
    eventType,
    occurredAt,
    actorType: 'external_agent',
    mode,
    containsWorkspaceData: false,
    containsPersonalData: false,
  };
}

export function getSampleAgentUseCases(): SampleAgentUseCase[] {
  return [
    {
      useCaseId: 'demo_support_summary_assistant',
      purpose:
        'Support-Team lässt Kundenanfragen zusammenfassen, bevor ein Mensch antwortet.',
      status: 'REVIEW_RECOMMENDED',
      owner: 'Support Lead',
      riskClass: 'LIMITED',
      activity: 'Review-Fragen offen',
      evidenceCount: 3,
    },
    {
      useCaseId: 'demo_hr_policy_assistant',
      purpose:
        'HR nutzt einen Assistenten für interne Policy-Entwürfe ohne automatische Entscheidungen.',
      status: 'PROOF_READY',
      owner: 'People Operations',
      riskClass: 'LIMITED',
      activity: 'Use-Case-Pass verfügbar',
      evidenceCount: 4,
    },
    {
      useCaseId: 'demo_supplier_screening_review',
      purpose:
        'Einkauf prüft Lieferantenangaben zu KI-Systemen als Review-Vorbereitung.',
      status: 'REVIEW_RECOMMENDED',
      owner: 'Procurement',
      riskClass: 'HIGH',
      activity: 'Datenkategorien klären',
      evidenceCount: 5,
    },
  ];
}

export function getSampleAgentExport(): SampleAgentExport {
  return {
    exportId: 'sample_register_export_v1',
    title: 'Kuratierter KIRegister Demo-Export',
    generatedFrom: 'curated_demo_data',
    containsWorkspaceData: false,
    useCasePassAvailable: true,
    fields: [
      'purpose',
      'status',
      'owner',
      'riskClass',
      'usageContexts',
      'decisionInfluence',
      'dataCategories',
      'evidenceCount',
    ],
  };
}

export function getAgentDemoSession(input?: {
  now?: Date;
  sessionId?: string;
}): AgentDemoSession {
  const now = input?.now ?? new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
  return {
    schemaVersion: '1.0.0',
    kind: 'kiregister.agent_demo_session',
    sessionId:
      input?.sessionId ??
      `demo_${now.toISOString().replace(/[^0-9]/g, '').slice(0, 14)}`,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    mode: 'read_only_demo',
    availableActions: [
      'list_sample_use_cases',
      'read_sample_use_case',
      'export_sample_pass',
      'generate_procurement_dossier',
    ],
    blockedActions: [
      'submit_real_register_entry',
      'connect_external_source',
      'start_paid_subscription',
      'accept_terms',
    ],
    sampleUseCases: getSampleAgentUseCases(),
    sampleExport: getSampleAgentExport(),
    auditEvent: buildAuditEvent('agent_demo_session_created', now),
  };
}

export function getProcurementDossier(input?: {
  now?: Date;
}): ProcurementDossier {
  const now = input?.now ?? new Date();
  return {
    schemaVersion: '1.0.0',
    kind: 'kiregister.procurement_dossier',
    status: 'draft',
    generatedAt: now.toISOString(),
    fitSummary:
      'KIRegister bereitet KI-Einsatzregister, Review-Nachweise, Use-Case-Pässe und Audit-Exporte vor. Formale Entscheidungen bleiben bei verantwortlichen Menschen.',
    requiredApprovals: ['legal', 'it-security', 'budget-owner'],
    dataProcessingSummary: getAgentDistributionProfile().dataProcessingSummary,
    evidenceArtifacts: [
      {
        id: 'sample_use_case_pass',
        title: 'Beispiel Use-Case-Pass',
        type: 'pdf',
        href: '/downloads/artefacts/ki-register-use-case-pass-beispiel.pdf',
      },
      {
        id: 'sample_register_export',
        title: 'Kuratierter Demo-Registerexport',
        type: 'json',
        href: '/api/agent/demo/session',
      },
      {
        id: 'agent_action_policy',
        title: 'Agent Action Policy',
        type: 'policy',
        href: '/api/agent/discovery',
      },
      {
        id: 'public_reference',
        title: 'Agentenlesbare Produktreferenz',
        type: 'markdown',
        href: '/llms.txt',
      },
    ],
    blockedActions: [
      'No purchase without human approval',
      'No external source connection without explicit opt-in',
      'No final legal assessment by agent only',
      'No formal risk classification as final by agent only',
    ],
    nextHumanReviewQuestions: [
      'Welche Organisation oder welcher Workspace soll KIRegister verantworten?',
      'Welche Datenquellen dürfen später ausdrücklich gelesen werden?',
      'Wer gibt Budget, Datenschutz und IT-Security frei?',
      'Welche bestehenden KI-Einsatzfälle sollen zuerst importiert oder geprüft werden?',
    ],
    auditEvent: buildAuditEvent('agent_procurement_dossier_created', now),
  };
}

export function renderProcurementDossierMarkdown(
  dossier: ProcurementDossier,
): string {
  const approvals = dossier.requiredApprovals
    .map((approval) => `- ${approval}`)
    .join('\n');
  const artifacts = dossier.evidenceArtifacts
    .map((artifact) => `- ${artifact.title}: ${artifact.href}`)
    .join('\n');
  const blocked = dossier.blockedActions.map((action) => `- ${action}`).join('\n');
  const questions = dossier.nextHumanReviewQuestions
    .map((question) => `- ${question}`)
    .join('\n');

  return [
    '# KIRegister Procurement Dossier',
    '',
    `Status: ${dossier.status}`,
    `Generated: ${dossier.generatedAt}`,
    '',
    '## Fit Summary',
    '',
    dossier.fitSummary,
    '',
    '## Required Approvals',
    '',
    approvals,
    '',
    '## Evidence Artifacts',
    '',
    artifacts,
    '',
    '## Blocked Agent-only Actions',
    '',
    blocked,
    '',
    '## Human Review Questions',
    '',
    questions,
    '',
  ].join('\n');
}

export function getAgentOpenApiSpec(origin = 'https://kiregister.com') {
  return {
    openapi: '3.1.0',
    info: {
      title: 'KIRegister Agent Distribution API',
      version: '1.0.0',
      description:
        'Read-only public API for agent discovery, demo sessions and procurement dossiers. Workspace data and mutations are not exposed here.',
    },
    servers: [{ url: origin }],
    paths: {
      '/api/agent/discovery': {
        get: {
          operationId: 'getAgentDiscovery',
          summary: 'Read public KIRegister agent discovery metadata',
          responses: {
            '200': {
              description: 'Public discovery metadata',
            },
          },
        },
      },
      '/api/agent/demo/session': {
        get: {
          operationId: 'startReadOnlyDemoSession',
          summary: 'Create a read-only demo session with curated data',
          responses: {
            '200': {
              description: 'Read-only demo session',
            },
            '429': {
              description: 'Rate limit exceeded',
            },
          },
        },
      },
      '/api/agent/procurement-dossier': {
        get: {
          operationId: 'generateDraftProcurementDossier',
          summary: 'Generate a draft procurement dossier for human review',
          parameters: [
            {
              name: 'format',
              in: 'query',
              schema: { type: 'string', enum: ['json', 'markdown'] },
            },
          ],
          responses: {
            '200': {
              description: 'Draft dossier in JSON or Markdown',
            },
            '429': {
              description: 'Rate limit exceeded',
            },
          },
        },
      },
    },
  };
}

export function getMcpToolDefinitions() {
  return [
    {
      name: 'kiregister_get_product_profile',
      description:
        'Read the public KIRegister product profile. This never returns workspace data.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {},
      },
    },
    {
      name: 'kiregister_start_demo_session',
      description:
        'Start a read-only KIRegister demo session with curated sample data.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {},
      },
    },
    {
      name: 'kiregister_get_sample_export',
      description:
        'Read the curated demo export structure. This is not a real workspace export.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {},
      },
    },
    {
      name: 'kiregister_generate_procurement_dossier',
      description:
        'Generate a draft procurement dossier. Human approval is required for purchase, source connection and formal decisions.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {},
      },
    },
  ];
}

export function getA2AAgentCard() {
  return {
    schemaVersion: '1.0.0',
    kind: 'kiregister.a2a_agent_card',
    name: 'KIRegister Compliance Agent',
    description:
      'Prepares AI-use register evidence, demo artifacts and procurement dossiers. It does not make final compliance decisions.',
    capabilities: [
      'read_public_product_profile',
      'start_read_only_demo',
      'generate_draft_procurement_dossier',
      'prepare_review_questions',
    ],
    endpoints: {
      discovery: '/api/agent/discovery',
      demoSession: '/api/agent/demo/session',
      procurementDossier: '/api/agent/procurement-dossier',
      mcp: '/api/mcp',
    },
    humanApprovalRequiredFor:
      getAgentDistributionProfile().humanApprovalRequiredFor,
    blockedForAgentOnly: getAgentDistributionProfile().blockedForAgentOnly,
  };
}

export function prepareAgenticCommerceSandboxIntent(input?: {
  now?: Date;
}): AgenticCommerceSandboxIntent {
  const now = input?.now ?? new Date();
  return {
    schemaVersion: '1.0.0',
    kind: 'kiregister.agentic_commerce_sandbox_intent',
    status: 'approval_required',
    mode: 'sandbox_only',
    createdAt: now.toISOString(),
    requestedAction: 'prepare_checkout_intent',
    checkoutCanBeStartedByAgent: false,
    humanApprovalRequired: true,
    requiredApprovals: ['budget-owner', 'legal', 'it-security'],
    blockedActions: [
      'start_live_checkout',
      'accept_terms',
      'charge_payment_method',
      'create_paid_subscription_without_human',
    ],
    auditEvent: buildAuditEvent(
      'agent_checkout_intent_prepared',
      now,
      'approval_required',
    ),
  };
}

export function getAgentDistributionAuditExport(input?: { now?: Date }) {
  const now = input?.now ?? new Date();
  return {
    schemaVersion: '1.0.0' as const,
    kind: 'kiregister.agent_distribution_audit_export' as const,
    generatedAt: now.toISOString(),
    scope: 'public_agent_distribution',
    containsWorkspaceData: false,
    containsPersonalData: false,
    eventTypes: [
      'agent_discovery_read',
      'agent_demo_session_created',
      'agent_procurement_dossier_created',
      'agent_checkout_intent_prepared',
    ],
    retentionNote:
      'Public discovery can be aggregated. Demo, dossier and checkout-intent preparation should remain exportable without secrets.',
    sampleEvents: [
      buildAuditEvent('agent_discovery_read', now),
      buildAuditEvent('agent_demo_session_created', now),
      buildAuditEvent('agent_procurement_dossier_created', now),
      buildAuditEvent(
        'agent_checkout_intent_prepared',
        now,
        'approval_required',
      ),
    ],
  };
}

export function getAgentAccessSettingsSummary() {
  const profile = getAgentDistributionProfile();
  const policy = getAgentActionPolicy();

  return {
    publicDiscovery: {
      status: 'active',
      endpoints: profile.publicArtifacts,
    },
    demoArtifacts: {
      status: 'active',
      containsWorkspaceData: false,
      sampleUseCaseCount: getSampleAgentUseCases().length,
    },
    actionPolicy: {
      readOnlyCount: policy.allowedWithoutHumanApproval.length,
      approvalRequiredCount: policy.requiresHumanApproval.length,
      blockedCount: policy.neverAllowedForAgentOnly.length,
    },
    audit: {
      status: 'prepared',
      exportEndpoint: '/api/agent/audit-export',
    },
  };
}
