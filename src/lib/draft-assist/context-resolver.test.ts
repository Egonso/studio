import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createInMemoryPublicIndexRepo,
  createInMemoryRegisterRepository,
  createInMemoryRegisterUseCaseRepo,
  createRegisterService,
  type RegisterService,
} from '@/lib/register-first';
import { createInMemoryRegisterAccessCodeRepo } from '@/lib/register-first/register-repository';

import {
  formatDraftAssistContext,
  resolveDraftAssistContext,
} from './context-resolver';

function createPersonalService(): RegisterService {
  const activeRegisterIdRef = { current: null as string | null };
  const defaultRegisterIdRef = { current: null as string | null };
  const registerRepo = createInMemoryRegisterRepository();
  const useCaseRepo = createInMemoryRegisterUseCaseRepo();
  const publicIndexRepo = createInMemoryPublicIndexRepo();
  const accessCodeRepo = createInMemoryRegisterAccessCodeRepo();
  let tick = 0;

  return createRegisterService({
    accessCodeRepo,
    clearActiveRegisterIdFn: () => {
      activeRegisterIdRef.current = null;
    },
    getActiveRegisterIdFn: () => activeRegisterIdRef.current,
    getDefaultRegisterIdFn: async () => defaultRegisterIdRef.current,
    now: () => {
      const base = new Date('2026-04-12T09:00:00.000Z');
      base.setMinutes(base.getMinutes() + tick);
      tick += 1;
      return base;
    },
    publicIndexRepo,
    registerRepo,
    resolveUserId: async () => 'user_personal',
    setActiveRegisterIdFn: (registerId) => {
      activeRegisterIdRef.current = registerId;
    },
    setDefaultRegisterIdFn: async (_userId, registerId) => {
      defaultRegisterIdRef.current = registerId;
    },
    useCaseRepo,
  });
}

test('resolveDraftAssistContext returns null when no register exists', async () => {
  const service = createPersonalService();

  const context = await resolveDraftAssistContext({ service });

  assert.equal(context, null);
});

test('resolveDraftAssistContext returns compact register-first context', async () => {
  const service = createPersonalService();
  const register = await service.createRegister('Acme Register');

  await service.updateRegisterProfile(register.registerId, {
    organisationName: 'Acme Care GmbH',
    organisationUnit: 'Operations',
    orgSettings: {
      organisationName: 'Acme Care GmbH',
      industry: 'Healthcare',
      contactPerson: {
        name: 'Anna Ops',
        email: 'anna@example.com',
      },
      aiPolicy: {
        url: 'https://example.com/ai-policy',
      },
      incidentProcess: {
        url: 'https://example.com/incidents',
      },
      rolesFramework: {
        docUrl: 'https://example.com/roles',
      },
      reviewStandard: 'annual',
    },
  });

  await service.createUseCaseFromCapture(
    {
      purpose: 'Support-Team nutzt ChatGPT fuer Antwortentwuerfe an Kunden',
      usageContexts: ['CUSTOMERS'],
      isCurrentlyResponsible: true,
      decisionInfluence: 'PREPARATION',
      dataCategories: ['PERSONAL_DATA'],
      toolId: 'other',
      toolFreeText: 'ChatGPT',
    },
    {
      registerId: register.registerId,
    },
  );

  await service.createUseCaseFromCapture(
    {
      purpose: 'IT nutzt interne RAG-Pipeline fuer Wissenssuche',
      usageContexts: ['INTERNAL_ONLY'],
      isCurrentlyResponsible: true,
      decisionInfluence: 'ASSISTANCE',
      dataCategories: ['INTERNAL_CONFIDENTIAL'],
      toolId: 'other',
      toolFreeText: 'Interne RAG-Pipeline',
    },
    {
      registerId: register.registerId,
    },
  );

  const context = await resolveDraftAssistContext({
    registerId: register.registerId,
    service,
    useCaseLimit: 1,
  });

  assert.ok(context);
  assert.equal(context.registerId, register.registerId);
  assert.equal(context.registerName, 'Acme Register');
  assert.equal(context.organisationName, 'Acme Care GmbH');
  assert.equal(context.organisationUnit, 'Operations');
  assert.deepEqual(context.policyTitles, [
    'AI Policy',
    'Incident Process',
    'Roles Framework',
    'Review Standard',
  ]);
  assert.equal(context.existingUseCases.length, 1);
  assert.equal(context.existingUseCaseCount, 1);
  assert.equal(
    context.existingUseCases[0]?.purpose,
    'IT nutzt interne RAG-Pipeline fuer Wissenssuche',
  );
  assert.equal(
    context.existingUseCases[0]?.primarySystem,
    'Interne RAG-Pipeline',
  );

  const formatted = formatDraftAssistContext(context);
  assert.match(formatted ?? '', /Register-Kontext/);
  assert.match(formatted ?? '', /Acme Care GmbH/);
  assert.match(formatted ?? '', /Interne RAG-Pipeline/);
});

test('resolveDraftAssistContext throws for an unknown explicit register id', async () => {
  const service = createPersonalService();
  await service.createRegister('Only Register');

  await assert.rejects(
    () =>
      resolveDraftAssistContext({
        registerId: 'reg_missing',
        service,
      }),
    /reg_missing/,
  );
});
