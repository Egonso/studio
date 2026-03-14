import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

interface ExtensionHarness {
  context: vm.Context & {
    isPreferredHost: (hostname?: string | null) => boolean;
    buildQuickCaptureUrl: (
      baseUrl: string,
      prefillText?: string,
      sourceUrl?: string,
    ) => string;
    resolveBaseUrl: () => Promise<string>;
    openQuickCapture: (input?: {
      openInTab?: boolean;
      prefillText?: string;
      sourceUrl?: string;
    }) => Promise<string>;
  };
  createdTabs: string[];
  createdWindows: string[];
}

function createExtensionHarness(activeTabUrl: string | null): ExtensionHarness {
  const createdTabs: string[] = [];
  const createdWindows: string[] = [];

  const contextObject = {
    console,
    URL,
    setTimeout,
    clearTimeout,
    clients: {
      matchAll: async () => [],
    },
    chrome: {
      tabs: {
        query: async () =>
          activeTabUrl
            ? [
                {
                  url: activeTabUrl,
                },
              ]
            : [],
        create: async ({ url }: { url: string }) => {
          createdTabs.push(url);
        },
      },
      windows: {
        create: async ({ url }: { url: string }) => {
          createdWindows.push(url);
        },
      },
      contextMenus: {
        removeAll: async () => {},
        create: () => {},
        onClicked: {
          addListener: () => {},
        },
      },
      offscreen: {
        createDocument: async () => {},
      },
      action: {
        setIcon: async () => {},
        onClicked: {
          addListener: () => {},
        },
      },
      commands: {
        onCommand: {
          addListener: () => {},
        },
      },
      runtime: {
        getURL: (value: string) => `chrome-extension://test-extension/${value}`,
        getContexts: async () => [],
        sendMessage: async () => ({ scheme: 'light' }),
        onInstalled: {
          addListener: () => {},
        },
        onStartup: {
          addListener: () => {},
        },
        onMessage: {
          addListener: () => {},
        },
      },
    },
  };

  const context = vm.createContext(contextObject);
  const source = readFileSync(
    path.join(
      process.cwd(),
      'extensions/ki-register-quick-capture/background.js',
    ),
    'utf8',
  );
  vm.runInContext(source, context);

  return {
    context: context as ExtensionHarness['context'],
    createdTabs,
    createdWindows,
  };
}

test('quick capture extension accepts production, app, and local hosts', async () => {
  const { context } = createExtensionHarness('https://kiregister.com/control');

  assert.equal(context.isPreferredHost('kiregister.com'), true);
  assert.equal(context.isPreferredHost('www.kiregister.com'), true);
  assert.equal(context.isPreferredHost('app.kiregister.com'), true);
  assert.equal(context.isPreferredHost('localhost'), true);
  assert.equal(context.isPreferredHost('127.0.0.1'), true);
  assert.equal(context.isPreferredHost('example.com'), false);
});

test('quick capture extension preserves the active local origin when opening capture', async () => {
  const { context, createdTabs } = createExtensionHarness(
    'http://127.0.0.1:9002/control',
  );

  const resolved = await context.resolveBaseUrl();
  assert.equal(resolved, 'http://127.0.0.1:9002');

  const opened = await context.openQuickCapture({
    openInTab: true,
    prefillText: 'Audit trail',
    sourceUrl: 'https://example.com/article',
  });

  assert.equal(
    opened,
    'http://127.0.0.1:9002/capture?source=chrome-extension&prefill=Audit+trail&originUrl=https%3A%2F%2Fexample.com%2Farticle',
  );
  assert.deepEqual(createdTabs, [opened]);
});

test('quick capture extension manifest allows app and local development origins', () => {
  const manifest = JSON.parse(
    readFileSync(
      path.join(
        process.cwd(),
        'extensions/ki-register-quick-capture/manifest.json',
      ),
      'utf8',
    ),
  ) as {
    host_permissions?: string[];
  };

  assert.deepEqual(
    manifest.host_permissions,
    [
      'https://kiregister.com/*',
      'https://app.kiregister.com/*',
      'https://www.kiregister.com/*',
      'http://localhost/*',
      'http://127.0.0.1/*',
    ],
  );
});
