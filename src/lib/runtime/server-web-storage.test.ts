import assert from 'node:assert/strict';
import test from 'node:test';

import { installServerWebStorageShim } from './server-web-storage';

test('server web storage shim replaces broken global storage objects', () => {
  const originalLocalStorage = (globalThis as Record<string, unknown>)
    .localStorage;
  const originalSessionStorage = (globalThis as Record<string, unknown>)
    .sessionStorage;
  const originalFlag = globalThis.__KI_REGISTER_STORAGE_SHIM_INSTALLED__;

  Object.defineProperty(globalThis, 'localStorage', {
    value: {},
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: {},
    configurable: true,
    writable: true,
  });
  globalThis.__KI_REGISTER_STORAGE_SHIM_INSTALLED__ = false;

  installServerWebStorageShim();

  assert.equal(typeof globalThis.localStorage.getItem, 'function');
  assert.equal(typeof globalThis.sessionStorage.setItem, 'function');

  globalThis.localStorage.setItem('probe', 'ok');
  assert.equal(globalThis.localStorage.getItem('probe'), 'ok');

  if (typeof originalLocalStorage === 'undefined') {
    delete (globalThis as Record<string, unknown>).localStorage;
  } else {
    Object.defineProperty(globalThis, 'localStorage', {
      value: originalLocalStorage,
      configurable: true,
      writable: true,
    });
  }

  if (typeof originalSessionStorage === 'undefined') {
    delete (globalThis as Record<string, unknown>).sessionStorage;
  } else {
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: originalSessionStorage,
      configurable: true,
      writable: true,
    });
  }

  globalThis.__KI_REGISTER_STORAGE_SHIM_INSTALLED__ = originalFlag;
});
