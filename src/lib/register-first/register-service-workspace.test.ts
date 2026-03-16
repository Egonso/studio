import assert from 'node:assert/strict';
import test from 'node:test';

import type { CaptureAssistContext } from '@/lib/coverage-assist/types';
import {
  createInMemoryPublicIndexRepo,
  createInMemoryRegisterAccessCodeRepo,
  createInMemoryRegisterRepository,
  createInMemoryRegisterUseCaseRepo,
} from './register-repository';
import { createRegisterService } from './register-service';
import type { RegisterScopeContext } from './types';

const WORKSPACE_SCOPE: RegisterScopeContext = {
  kind: 'workspace',
  workspaceId: 'org_acme',
};

function createScopeAwareService(options: {
  userId: string;
  activeRegisterByScope: Map<string, string | null>;
  defaultRegisterByScope: Map<string, string | null>;
  linkedRegisters: Array<{ orgId: string; registerId: string }>;
  registerRepo: ReturnType<typeof createInMemoryRegisterRepository>;
  useCaseRepo: ReturnType<typeof createInMemoryRegisterUseCaseRepo>;
  publicIndexRepo: ReturnType<typeof createInMemoryPublicIndexRepo>;
  accessCodeRepo: ReturnType<typeof createInMemoryRegisterAccessCodeRepo>;
}) {
  return createRegisterService({
    accessCodeRepo: options.accessCodeRepo,
    clearActiveRegisterIdFn: (scopeKey) => {
      options.activeRegisterByScope.delete(scopeKey ?? 'personal');
    },
    getActiveRegisterIdFn: (scopeKey) =>
      options.activeRegisterByScope.get(scopeKey ?? 'personal') ?? null,
    getDefaultRegisterIdFn: async (_userId, scopeKey) =>
      options.defaultRegisterByScope.get(scopeKey ?? 'personal') ?? null,
    linkRegisterToWorkspace: async ({ orgId, registerId }) => {
      options.linkedRegisters.push({ orgId, registerId });
    },
    now: () => new Date('2026-03-13T09:00:00.000Z'),
    publicIndexRepo: options.publicIndexRepo,
    registerRepo: options.registerRepo,
    resolveAccessibleWorkspaceIds: async () => ['org_acme'],
    resolveRequestedScopeContext: async () => WORKSPACE_SCOPE,
    resolveUserId: async () => options.userId,
    setActiveRegisterIdFn: (registerId, scopeKey) => {
      options.activeRegisterByScope.set(scopeKey ?? 'personal', registerId);
    },
    setDefaultRegisterIdFn: async (_userId, registerId, scopeKey) => {
      options.defaultRegisterByScope.set(scopeKey ?? 'personal', registerId);
    },
    useCaseRepo: options.useCaseRepo,
  });
}

test('workspace register creation links the register and stores workspace scope defaults', async () => {
  const activeRegisterByScope = new Map<string, string | null>();
  const defaultRegisterByScope = new Map<string, string | null>();
  const linkedRegisters: Array<{ orgId: string; registerId: string }> = [];
  const registerRepo = createInMemoryRegisterRepository();
  const useCaseRepo = createInMemoryRegisterUseCaseRepo();
  const publicIndexRepo = createInMemoryPublicIndexRepo();
  const accessCodeRepo = createInMemoryRegisterAccessCodeRepo();

  const service = createScopeAwareService({
    userId: 'owner_alpha',
    activeRegisterByScope,
    defaultRegisterByScope,
    linkedRegisters,
    registerRepo,
    useCaseRepo,
    publicIndexRepo,
    accessCodeRepo,
  });

  const register = await service.createRegister('Acme Workspace Register', null, {
    scopeContext: WORKSPACE_SCOPE,
  });

  assert.equal(register.workspaceId, 'org_acme');
  assert.deepEqual(linkedRegisters, [
    { orgId: 'org_acme', registerId: register.registerId },
  ]);
  assert.equal(
    defaultRegisterByScope.get('workspace:org_acme'),
    register.registerId,
  );
  assert.equal(
    activeRegisterByScope.get('workspace:org_acme'),
    register.registerId,
  );
  assert.equal(defaultRegisterByScope.has('personal'), false);
});

test('workspace scope resolves registers across owners and records the acting member', async () => {
  const activeRegisterByScope = new Map<string, string | null>();
  const defaultRegisterByScope = new Map<string, string | null>();
  const linkedRegisters: Array<{ orgId: string; registerId: string }> = [];
  const registerRepo = createInMemoryRegisterRepository();
  const useCaseRepo = createInMemoryRegisterUseCaseRepo();
  const publicIndexRepo = createInMemoryPublicIndexRepo();
  const accessCodeRepo = createInMemoryRegisterAccessCodeRepo();

  const ownerService = createScopeAwareService({
    userId: 'owner_alpha',
    activeRegisterByScope,
    defaultRegisterByScope,
    linkedRegisters,
    registerRepo,
    useCaseRepo,
    publicIndexRepo,
    accessCodeRepo,
  });
  const secondOwnerService = createScopeAwareService({
    userId: 'owner_beta',
    activeRegisterByScope,
    defaultRegisterByScope,
    linkedRegisters,
    registerRepo,
    useCaseRepo,
    publicIndexRepo,
    accessCodeRepo,
  });
  const reviewerService = createScopeAwareService({
    userId: 'reviewer_user',
    activeRegisterByScope,
    defaultRegisterByScope,
    linkedRegisters,
    registerRepo,
    useCaseRepo,
    publicIndexRepo,
    accessCodeRepo,
  });

  const alphaRegister = await ownerService.createRegister('Alpha Register', null, {
    scopeContext: WORKSPACE_SCOPE,
  });
  const betaRegister = await secondOwnerService.createRegister('Beta Register', null, {
    scopeContext: WORKSPACE_SCOPE,
  });

  const createdByReviewer = await reviewerService.createUseCaseFromCapture(
    {
      purpose: 'Workspace Review Queue',
      usageContexts: ['INTERNAL_ONLY'],
      isCurrentlyResponsible: true,
      decisionImpact: 'YES',
      dataCategory: 'PERSONAL',
      toolId: 'openai_chatgpt',
    },
    {
      registerId: betaRegister.registerId,
      scopeContext: WORKSPACE_SCOPE,
    },
  );

  assert.equal(createdByReviewer.capturedBy, 'reviewer_user');
  assert.equal(createdByReviewer.origin?.capturedByUserId, 'reviewer_user');

  const storedOnOwnerPath = await useCaseRepo.getById(
    {
      userId: 'owner_beta',
      registerId: betaRegister.registerId,
    },
    createdByReviewer.useCaseId,
  );
  assert.ok(storedOnOwnerPath);

  const workspaceRegisters = await reviewerService.listRegisters(WORKSPACE_SCOPE);
  assert.deepEqual(
    new Set(workspaceRegisters.map((register) => register.registerId)),
    new Set([alphaRegister.registerId, betaRegister.registerId]),
  );

  const updated = await reviewerService.updateUseCaseStatusManual({
    registerId: betaRegister.registerId,
    scopeContext: WORKSPACE_SCOPE,
    useCaseId: createdByReviewer.useCaseId,
    nextStatus: 'REVIEWED',
    actor: 'HUMAN',
    reason: 'Workspace review completed',
  });

  assert.equal(updated.reviews[0]?.reviewedBy, 'reviewer_user');
  assert.equal(updated.statusHistory?.[0]?.changedBy, 'reviewer_user');
});

test('workspace capture persists coverage assist context without changing human origin', async () => {
  const activeRegisterByScope = new Map<string, string | null>();
  const defaultRegisterByScope = new Map<string, string | null>();
  const linkedRegisters: Array<{ orgId: string; registerId: string }> = [];
  const registerRepo = createInMemoryRegisterRepository();
  const useCaseRepo = createInMemoryRegisterUseCaseRepo();
  const publicIndexRepo = createInMemoryPublicIndexRepo();
  const accessCodeRepo = createInMemoryRegisterAccessCodeRepo();

  const ownerService = createScopeAwareService({
    userId: 'owner_alpha',
    activeRegisterByScope,
    defaultRegisterByScope,
    linkedRegisters,
    registerRepo,
    useCaseRepo,
    publicIndexRepo,
    accessCodeRepo,
  });
  const reviewerService = createScopeAwareService({
    userId: 'reviewer_user',
    activeRegisterByScope,
    defaultRegisterByScope,
    linkedRegisters,
    registerRepo,
    useCaseRepo,
    publicIndexRepo,
    accessCodeRepo,
  });

  const register = await ownerService.createRegister('Coverage Register', null, {
    scopeContext: WORKSPACE_SCOPE,
  });

  const assistContext: CaptureAssistContext = {
    assist: 'coverage',
    source: 'chrome_extension',
    detectedToolId: 'chatgpt_openai',
    matchedHost: 'chat.openai.com',
    matchedPath: '/',
    selectionMode: 'seed_suggestion',
    seedSuggestionId: 'chatgpt_openai_email_drafting',
    seedSuggestionLabel: 'E-Mails entwerfen',
    libraryVersion: 'seed_v0_1',
    confidence: 'high',
  };

  const captured = await reviewerService.createUseCaseFromCapture(
    {
      purpose: 'Routine-E-Mails mit KI vorformulieren',
      usageContexts: ['INTERNAL_ONLY'],
      isCurrentlyResponsible: true,
      decisionImpact: 'NO',
      toolId: 'chatgpt_openai',
    },
    {
      registerId: register.registerId,
      scopeContext: WORKSPACE_SCOPE,
      assistContext,
    },
  );

  assert.deepEqual(captured.assistContext, assistContext);
  assert.equal(captured.origin?.source, 'manual');
});
