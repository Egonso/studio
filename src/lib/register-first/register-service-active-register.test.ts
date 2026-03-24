import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createInMemoryPublicIndexRepo,
  createInMemoryRegisterAccessCodeRepo,
  createInMemoryRegisterRepository,
  createInMemoryRegisterUseCaseRepo,
} from './register-repository';
import { createRegisterService } from './register-service';

function createPersonalService(options: {
  activeRegisterIdRef: { current: string | null };
  defaultRegisterIdRef: { current: string | null };
}) {
  const registerRepo = createInMemoryRegisterRepository();
  const useCaseRepo = createInMemoryRegisterUseCaseRepo();
  const publicIndexRepo = createInMemoryPublicIndexRepo();
  const accessCodeRepo = createInMemoryRegisterAccessCodeRepo();

  return createRegisterService({
    accessCodeRepo,
    clearActiveRegisterIdFn: () => {
      options.activeRegisterIdRef.current = null;
    },
    getActiveRegisterIdFn: () => options.activeRegisterIdRef.current,
    getDefaultRegisterIdFn: async () => options.defaultRegisterIdRef.current,
    now: () => new Date('2026-03-24T08:00:00.000Z'),
    publicIndexRepo,
    registerRepo,
    resolveUserId: async () => 'user_personal',
    setActiveRegisterIdFn: (registerId) => {
      options.activeRegisterIdRef.current = registerId;
    },
    setDefaultRegisterIdFn: async (_userId, registerId) => {
      options.defaultRegisterIdRef.current = registerId;
    },
    useCaseRepo,
  });
}

test('getActiveRegister returns the persisted active register instead of resetting to the first entry', async () => {
  const activeRegisterIdRef = { current: null as string | null };
  const defaultRegisterIdRef = { current: null as string | null };
  const service = createPersonalService({
    activeRegisterIdRef,
    defaultRegisterIdRef,
  });

  const firstRegister = await service.createRegister('First Register');
  const secondRegister = await service.createRegister('Second Register');

  await service.setActiveRegister(firstRegister.registerId);
  await service.setActiveRegister(secondRegister.registerId);

  const activeRegister = await service.getActiveRegister();

  assert.equal(activeRegister?.registerId, secondRegister.registerId);
  assert.equal(activeRegisterIdRef.current, secondRegister.registerId);
  assert.equal(defaultRegisterIdRef.current, secondRegister.registerId);
});
