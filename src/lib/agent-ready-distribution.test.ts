import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyAgentAction,
  getAgentDemoSession,
  getAgentDiscoveryResponse,
  getAgentDistributionAuditExport,
  getAgentDistributionProfile,
  getAgentOpenApiSpec,
  getProcurementDossier,
  prepareAgenticCommerceSandboxIntent,
  renderProcurementDossierMarkdown,
} from '@/lib/agent-ready-distribution';

const fixedNow = new Date('2026-06-18T10:00:00.000Z');

test('agent-ready discovery exposes public artifacts without workspace data', () => {
  const discovery = getAgentDiscoveryResponse();
  const profile = getAgentDistributionProfile();

  assert.equal(discovery.kind, 'kiregister.agent_discovery');
  assert.equal(profile.dataProcessingSummary.publicDiscoveryUsesWorkspaceData, false);
  assert.ok(profile.publicArtifacts.includes('/api/agent/discovery'));
  assert.ok(profile.publicArtifacts.includes('/.well-known/kiregister-agent.json'));
  assert.ok(
    profile.humanApprovalRequiredFor.includes('submitting_register_entries'),
  );
  assert.ok(profile.blockedForAgentOnly.includes('accept_terms'));
});

test('agent action policy defaults unknown and critical actions to safe classes', () => {
  assert.equal(classifyAgentAction('read_public_product_profile'), 'read_only');
  assert.equal(classifyAgentAction('start_checkout'), 'approval_required');
  assert.equal(classifyAgentAction('accept_terms'), 'blocked');
  assert.equal(classifyAgentAction('something_future_and_unknown'), 'blocked');
});

test('read-only demo session uses curated data only', () => {
  const session = getAgentDemoSession({
    now: fixedNow,
    sessionId: 'demo_test',
  });

  assert.equal(session.sessionId, 'demo_test');
  assert.equal(session.mode, 'read_only_demo');
  assert.equal(session.sampleExport.containsWorkspaceData, false);
  assert.equal(session.auditEvent.containsWorkspaceData, false);
  assert.equal(session.auditEvent.containsPersonalData, false);
  assert.ok(session.blockedActions.includes('start_paid_subscription'));
});

test('procurement dossier is a draft with blocked agent-only actions', () => {
  const dossier = getProcurementDossier({ now: fixedNow });
  const markdown = renderProcurementDossierMarkdown(dossier);

  assert.equal(dossier.status, 'draft');
  assert.ok(dossier.requiredApprovals.includes('it-security'));
  assert.match(markdown, /Blocked Agent-only Actions/);
  assert.match(markdown, /No purchase without human approval/);
});

test('OpenAPI exposes only public agent distribution paths', () => {
  const spec = getAgentOpenApiSpec('https://example.test');
  const paths = Object.keys(spec.paths);

  assert.deepEqual(paths.sort(), [
    '/api/agent/demo/session',
    '/api/agent/discovery',
    '/api/agent/procurement-dossier',
  ]);
  assert.equal(JSON.stringify(spec).includes('/api/workspaces'), false);
  assert.equal(JSON.stringify(spec).includes('/api/billing'), false);
});

test('agentic commerce sandbox cannot start checkout or accept terms', () => {
  const intent = prepareAgenticCommerceSandboxIntent({ now: fixedNow });

  assert.equal(intent.mode, 'sandbox_only');
  assert.equal(intent.checkoutCanBeStartedByAgent, false);
  assert.equal(intent.humanApprovalRequired, true);
  assert.ok(intent.blockedActions.includes('start_live_checkout'));
  assert.ok(intent.blockedActions.includes('accept_terms'));
});

test('audit export is bounded and non-personal', () => {
  const auditExport = getAgentDistributionAuditExport({ now: fixedNow });

  assert.equal(auditExport.containsWorkspaceData, false);
  assert.equal(auditExport.containsPersonalData, false);
  assert.ok(auditExport.sampleEvents.length > 0);
  assert.ok(
    auditExport.sampleEvents.every(
      (event) =>
        event.containsWorkspaceData === false &&
        event.containsPersonalData === false,
    ),
  );
});
