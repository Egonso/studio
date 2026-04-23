import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

import {
  applyExternalSubmissionReview,
  buildAccessCodeSubmissionSnapshot,
  buildExternalSubmissionRecord,
  buildUseCaseFromAccessCodeSubmission,
  buildUseCaseFromSupplierSubmission,
} from '@/lib/register-first/external-submissions';
import {
  createInMemoryPublicIndexRepo,
  createInMemoryRegisterAccessCodeRepo,
  createInMemoryRegisterRepository,
  createInMemoryRegisterUseCaseRepo,
} from '@/lib/register-first/register-repository';
import { createRegisterService } from '@/lib/register-first/register-service';
import { createUseCasePassV11Export } from '@/lib/register-first/output';
import {
  issueSupplierRequestToken,
  verifySupplierRequestToken,
} from '@/lib/register-first/request-tokens';
import {
  ROUTE_HREFS,
  getVisiblePremiumControlNav,
} from '@/lib/navigation/route-manifest';

function readSource(filePath: string): string {
  return readFileSync(resolve(process.cwd(), filePath), 'utf8');
}

test('free signup/login entry stays focused and direct', () => {
  const rootPageSource = readSource('src/app/[locale]/page.tsx');
  const authEntrySource = readSource('src/components/auth/auth-entry-page.tsx');
  const germanMessages = readSource('messages/de.json');

  assert.match(rootPageSource, /AuthEntryPage/);
  assert.match(authEntrySource, /useTranslations/);
  assert.match(germanMessages, /"signUp": "Registrieren"/);
  assert.match(germanMessages, /"signIn": "Anmelden"/);
  assert.match(germanMessages, /"createRegister": "Eigenes Register anlegen"/);
  assert.match(
    germanMessages,
    /"heroTitle": "Jede Organisation mit KI-Einsatz braucht ein belastbares KI Register\."/,
  );
  assert.match(
    germanMessages,
    /"governanceActivating": "Governance Control Center wird für dieses Konto freigeschaltet\."/,
  );
  assert.match(
    germanMessages,
    /"loginDescription": "Melden Sie sich mit Ihrem bestehenden Zugang an und setzen Sie direkt fort\."/,
  );
  assert.match(
    germanMessages,
    /"shareNote": "Nachweise und Registerauszüge lassen sich in standardisierter Form teilen\."/,
  );
  assert.doesNotMatch(authEntrySource, /self-serve/i);
  assert.doesNotMatch(authEntrySource, /Checkout erkannt/);
  assert.doesNotMatch(authEntrySource, /Public Marketing/);
  assert.doesNotMatch(authEntrySource, /purchase required/i);
});

test('core launch flows stay wired through the register-first model', async () => {
  let tick = 0;
  const baseTime = Date.parse('2026-03-12T09:00:00.000Z');
  let useCaseCounter = 1;

  const service = createRegisterService({
    accessCodeRepo: createInMemoryRegisterAccessCodeRepo(),
    clearActiveRegisterIdFn: () => undefined,
    getActiveRegisterIdFn: () => null,
    getDefaultRegisterIdFn: async () => null,
    now: () => new Date(baseTime + tick++ * 1000),
    publicIndexRepo: createInMemoryPublicIndexRepo(),
    registerRepo: createInMemoryRegisterRepository(),
    resolveUserId: async () => 'launch_user',
    setActiveRegisterIdFn: () => undefined,
    setDefaultRegisterIdFn: async () => undefined,
    useCaseIdGenerator: () =>
      `launch_uc_${String(useCaseCounter++).padStart(3, '0')}`,
    useCaseRepo: createInMemoryRegisterUseCaseRepo(),
  });

  const register = await service.createRegister('Launch Register');
  assert.equal(register.plan, 'free');
  assert.equal(register.entitlement?.plan, 'free');

  const created = await service.createUseCaseFromCapture(
    {
      purpose: 'Eingehende Tickets automatisch priorisieren',
      usageContexts: ['INTERNAL_ONLY'],
      isCurrentlyResponsible: true,
      decisionImpact: 'YES',
      toolId: 'openai_chatgpt',
      dataCategory: 'PERSONAL',
    },
    { registerId: register.registerId },
  );

  const updated = await service.updateUseCase(created.useCaseId, {
    purpose: 'Support-Tickets automatisch priorisieren',
  });

  assert.equal(updated.purpose, 'Support-Tickets automatisch priorisieren');
  assert.equal(updated.origin?.source, 'manual');

  const accessCodeSubmission = buildExternalSubmissionRecord({
    accessCodeId: 'AI-CODE-001',
    ownerId: 'launch_user',
    rawPayloadSnapshot: {
      dataCategories: ['INTERNAL_CONFIDENTIAL'],
      ownerRole: 'IT',
      purpose: 'Interne Wissensdatenbank durchsuchen',
      usageContexts: ['INTERNAL_ONLY'],
    },
    registerId: register.registerId,
    sourceType: 'access_code',
    submittedByName: 'Max Team',
  });

  const accessCodeCard = buildUseCaseFromAccessCodeSubmission({
    accessCode: 'AI-CODE-001',
    accessCodeLabel: 'Team Capture',
    registerId: register.registerId,
    snapshot: buildAccessCodeSubmissionSnapshot({
      dataCategories: ['INTERNAL_CONFIDENTIAL'],
      ownerRole: 'IT',
      purpose: 'Interne Wissensdatenbank durchsuchen',
      usageContexts: ['INTERNAL_ONLY'],
    }),
    submissionId: accessCodeSubmission.submissionId,
    useCaseId: 'launch_access_code_uc',
  });

  assert.equal(accessCodeCard.origin?.source, 'access_code');
  assert.equal(
    accessCodeCard.origin?.sourceRequestId,
    accessCodeSubmission.submissionId,
  );

  const issuedRequestToken = issueSupplierRequestToken({
    createdBy: 'launch_user',
    ownerId: 'launch_user',
    registerId: register.registerId,
  });
  assert.equal(
    verifySupplierRequestToken(
      issuedRequestToken.token,
      issuedRequestToken.record,
    ).valid,
    true,
  );

  const supplierSubmission = buildExternalSubmissionRecord({
    ownerId: 'launch_user',
    rawPayloadSnapshot: {
      aiActCategory: 'limited',
      dataCategory: 'PERSONAL',
      purpose: 'Rechnungen klassifizieren',
      supplierEmail: 'vendor@example.com',
      toolName: 'Vendor Classifier',
    },
    registerId: register.registerId,
    requestTokenId: issuedRequestToken.tokenId,
    sourceType: 'supplier_request',
    submittedByEmail: 'vendor@example.com',
  });

  const reviewedSubmission = applyExternalSubmissionReview({
    action: 'approve',
    linkedUseCaseId: 'launch_supplier_uc',
    reviewNote: 'KMU-Freigabe',
    reviewedBy: 'launch_user',
    submission: supplierSubmission,
  });

  const supplierCard = buildUseCaseFromSupplierSubmission({
    organisationName: 'Launch GmbH',
    ownerId: 'launch_user',
    registerId: register.registerId,
    requestTokenId: issuedRequestToken.tokenId,
    submission: reviewedSubmission,
    useCaseId: reviewedSubmission.linkedUseCaseId!,
  });

  assert.equal(reviewedSubmission.status, 'approved');
  assert.equal(supplierCard.origin?.source, 'supplier_request');
  assert.equal(
    supplierCard.origin?.sourceRequestId,
    supplierSubmission.submissionId,
  );

  const passExport = createUseCasePassV11Export(
    updated,
    register.registerId,
    {
      productName: 'ChatGPT',
      toolType: 'LLM',
      vendor: 'OpenAI',
    },
    new Date(baseTime + 30_000),
  );
  assert.equal(passExport.schemaVersion, '1.1');
  assert.equal(passExport.tool.vendor, 'OpenAI');
  assert.equal(passExport.status, updated.status);
});

test('external inbox and premium destinations stay discoverable', () => {
  const inboxSource = readSource(
    'src/components/register/external-submissions-inbox.tsx',
  );
  const controlSource = readSource('src/app/[locale]/control/page.tsx');
  assert.match(inboxSource, /Eingegangen/);
  assert.match(inboxSource, /Freigegeben/);
  assert.match(inboxSource, /Abgelehnt/);
  assert.match(inboxSource, /Uebernommen/);
  assert.match(inboxSource, /Ablehnen/);
  assert.match(inboxSource, /Freigeben/);
  assert.match(controlSource, /Bericht aktuell halten/);
  assert.match(controlSource, /scopedHrefs\.controlReviews/);
  assert.match(controlSource, /t\('control\.reviews'\)/);

  const premiumNavHrefs = new Set(
    getVisiblePremiumControlNav('pro').map((entry) => entry.href),
  );
  assert.ok(premiumNavHrefs.has(ROUTE_HREFS.control));
  assert.ok(premiumNavHrefs.has(ROUTE_HREFS.controlReviews));
  assert.ok(premiumNavHrefs.has(ROUTE_HREFS.controlPolicies));
  assert.ok(premiumNavHrefs.has(ROUTE_HREFS.controlExports));
  assert.ok(premiumNavHrefs.has(ROUTE_HREFS.controlTrust));
  assert.ok(premiumNavHrefs.has(ROUTE_HREFS.academy));
});
