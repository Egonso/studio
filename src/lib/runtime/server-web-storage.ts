type StorageShape = {
  clear(): void;
  getItem(key: string): string | null;
  key(index: number): string | null;
  readonly length: number;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
};

declare global {
  // eslint-disable-next-line no-var
  var __KI_REGISTER_STORAGE_SHIM_INSTALLED__: boolean | undefined;
}

function createMemoryStorage(): StorageShape {
  const store = new Map<string, string>();

  return {
    clear() {
      store.clear();
    },
    getItem(key) {
      return store.has(key) ? (store.get(key) ?? null) : null;
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null;
    },
    get length() {
      return store.size;
    },
    removeItem(key) {
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
  };
}

function hasStorageMethods(candidate: unknown): candidate is StorageShape {
  return Boolean(
    candidate &&
    typeof candidate === 'object' &&
    typeof (candidate as StorageShape).getItem === 'function' &&
    typeof (candidate as StorageShape).setItem === 'function' &&
    typeof (candidate as StorageShape).removeItem === 'function',
  );
}

export function installServerWebStorageShim(): void {
  if (typeof window !== 'undefined') {
    return;
  }

  if (globalThis.__KI_REGISTER_STORAGE_SHIM_INSTALLED__ === true) {
    return;
  }

  const storage = createMemoryStorage();
  const targets: Array<'localStorage' | 'sessionStorage'> = [
    'localStorage',
    'sessionStorage',
  ];

  for (const key of targets) {
    if (!hasStorageMethods((globalThis as Record<string, unknown>)[key])) {
      Object.defineProperty(globalThis, key, {
        value: storage,
        configurable: true,
        writable: true,
      });
    }
  }

  globalThis.__KI_REGISTER_STORAGE_SHIM_INSTALLED__ = true;
}
