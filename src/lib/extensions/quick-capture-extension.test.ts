import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

interface CoverageAssistDetectionEntry {
  toolId: string;
  toolName: string;
  hosts: string[];
  isEnabled?: boolean;
}

interface ExtensionHarness {
  context: vm.Context & {
    isPreferredHost: (hostname?: string | null) => boolean;
    buildQuickCaptureUrl: (
      baseUrl: string,
      prefillText?: string,
      sourceUrl?: string
    ) => string;
    buildCoverageAssistUrl: (
      baseUrl: string,
      input: {
        toolId: string;
        matchedHost: string;
        sourceUrl?: string;
      }
    ) => string;
    resolveBaseUrl: () => Promise<string>;
    resolveCoverageAssistPopupState: () => Promise<{
      rolloutEnabled: boolean;
      enabled: boolean;
      activeTabSupported: boolean;
      detection: {
        toolId: string;
        toolName: string;
        matchedHost: string;
        matchedPath: string | null;
        sourceUrl: string;
      } | null;
      dismissed: boolean;
      quietSignal: boolean;
    }>;
    refreshActionPresentation: () => Promise<void>;
    openQuickCapture: (input?: {
      openInTab?: boolean;
      prefillText?: string;
      sourceUrl?: string;
    }) => Promise<string>;
    openCoverageAssistCapture: (input?: {
      openInTab?: boolean;
      toolId: string;
      matchedHost: string;
      sourceUrl?: string;
    }) => Promise<string>;
    setCoverageAssistEnabled: (enabled: boolean) => Promise<void>;
    getCoverageAssistLocalEvents: () => Promise<
      Array<{
        name: string;
        occurredAt: string;
        payload: Record<string, unknown>;
      }>
    >;
    findCoverageAssistMatchForUrl: (
      sourceUrl: string,
      detectionEntries?: CoverageAssistDetectionEntry[]
    ) => {
      toolId: string;
      toolName: string;
      matchedHost: string;
      matchedPath: string | null;
      sourceUrl: string;
    } | null;
    deriveCoverageAssistSignalState: (input: {
      rolloutEnabled?: boolean;
      assistEnabled: boolean;
      activeTabUrl: string | null;
      dismissedToolIds?: string[];
      detectionEntries?: CoverageAssistDetectionEntry[];
    }) => {
      assistEnabled: boolean;
      activeTabSupported: boolean;
      detection: {
        toolId: string;
        toolName: string;
        matchedHost: string;
        matchedPath: string | null;
        sourceUrl: string;
      } | null;
      dismissed: boolean;
      quietSignal: boolean;
    };
  };
  createdTabs: string[];
  createdWindows: string[];
}

interface ExtensionHarnessOptions {
  remoteCoverageAssistConfig?: {
    coverageAssistPhase1?: boolean;
    coverageAssistExtension?: boolean;
    coverageAssistSeedLibrary?: boolean;
    rolloutEnabled?: boolean;
  };
}

function createExtensionHarness(
  activeTabUrl: string | null,
  storageState: Record<string, unknown> = {},
  options: ExtensionHarnessOptions = {}
): ExtensionHarness {
  const createdTabs: string[] = [];
  const createdWindows: string[] = [];
  const localStorageState = new Map<string, unknown>(Object.entries(storageState));
  const remoteCoverageAssistConfig = {
    coverageAssistPhase1: false,
    coverageAssistExtension: false,
    coverageAssistSeedLibrary: false,
    rolloutEnabled: false,
    ...options.remoteCoverageAssistConfig,
  };
  const extensionRoot = path.join(
    process.cwd(),
    "extensions/ki-register-quick-capture"
  );

  const contextObject = {
    console,
    URL,
    setTimeout,
    clearTimeout,
    fetch: async (url: string) => {
      if (url.endsWith("coverage-assist-detection.json")) {
        return {
          ok: true,
          json: async () =>
            JSON.parse(
              readFileSync(
                path.join(extensionRoot, "coverage-assist-detection.json"),
                "utf8"
              )
            ),
        };
      }

      if (url.includes("/api/coverage-assist/config")) {
        return {
          ok: true,
          json: async () => remoteCoverageAssistConfig,
        };
      }

      throw new Error(`Unexpected fetch request: ${url}`);
    },
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
                  active: true,
                },
              ]
            : [],
        create: async ({ url }: { url: string }) => {
          createdTabs.push(url);
        },
        onActivated: {
          addListener: () => {},
        },
        onUpdated: {
          addListener: () => {},
        },
      },
      windows: {
        WINDOW_ID_NONE: -1,
        create: async ({ url }: { url: string }) => {
          createdWindows.push(url);
        },
        onFocusChanged: {
          addListener: () => {},
        },
      },
      storage: {
        local: {
          get: async (defaults: Record<string, unknown>) => {
            const resolved: Record<string, unknown> = {};
            for (const [key, fallback] of Object.entries(defaults)) {
              resolved[key] = localStorageState.has(key)
                ? localStorageState.get(key)
                : fallback;
            }
            return resolved;
          },
          set: async (values: Record<string, unknown>) => {
            for (const [key, value] of Object.entries(values)) {
              localStorageState.set(key, value);
            }
          },
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
        setTitle: async () => {},
        setBadgeText: async () => {},
        setBadgeBackgroundColor: async () => {},
      },
      commands: {
        onCommand: {
          addListener: () => {},
        },
      },
      runtime: {
        getURL: (value: string) => `chrome-extension://test-extension/${value}`,
        getContexts: async () => [],
        sendMessage: async () => ({ scheme: "light" }),
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
    path.join(extensionRoot, "background.js"),
    "utf8"
  );
  vm.runInContext(source, context);

  return {
    context: context as ExtensionHarness["context"],
    createdTabs,
    createdWindows,
  };
}

test("quick capture extension accepts production, app, and local hosts", async () => {
  const { context } = createExtensionHarness("https://kiregister.com/control");

  assert.equal(context.isPreferredHost("kiregister.com"), true);
  assert.equal(context.isPreferredHost("www.kiregister.com"), true);
  assert.equal(context.isPreferredHost("app.kiregister.com"), true);
  assert.equal(context.isPreferredHost("localhost"), true);
  assert.equal(context.isPreferredHost("127.0.0.1"), true);
  assert.equal(context.isPreferredHost("example.com"), false);
});

test("quick capture extension preserves the active local origin when opening capture", async () => {
  const { context, createdTabs } = createExtensionHarness(
    "http://127.0.0.1:9002/control"
  );

  const resolved = await context.resolveBaseUrl();
  assert.equal(resolved, "http://127.0.0.1:9002");

  const opened = await context.openQuickCapture({
    openInTab: true,
    prefillText: "Audit trail",
    sourceUrl: "https://example.com/article",
  });

  assert.equal(
    opened,
    "http://127.0.0.1:9002/capture?source=chrome-extension&prefill=Audit+trail&originUrl=https%3A%2F%2Fexample.com%2Farticle"
  );
  assert.deepEqual(createdTabs, [opened]);
});

test("coverage assist detects known hosts locally and builds a register deeplink", async () => {
  const { context, createdTabs } = createExtensionHarness(
    "https://chat.openai.com/",
    {},
    {
      remoteCoverageAssistConfig: {
        coverageAssistPhase1: true,
        coverageAssistExtension: true,
        coverageAssistSeedLibrary: true,
        rolloutEnabled: true,
      },
    }
  );

  const match = context.findCoverageAssistMatchForUrl("https://chat.openai.com/", [
    {
      toolId: "chatgpt_openai",
      toolName: "ChatGPT (OpenAI)",
      hosts: ["chat.openai.com"],
    },
  ]);

  assert.ok(match);
  assert.equal(match.toolId, "chatgpt_openai");
  assert.equal(match.matchedHost, "chat.openai.com");

  const opened = await context.openCoverageAssistCapture({
    openInTab: true,
    toolId: "chatgpt_openai",
    matchedHost: "chat.openai.com",
    sourceUrl: "https://chat.openai.com/",
  });

  assert.equal(
    opened,
    "https://kiregister.com/capture?source=chrome-extension&assist=coverage&assistSource=chrome_extension&assistToolId=chatgpt_openai&assistMatchedHost=chat.openai.com&toolId=chatgpt_openai&matchedHost=chat.openai.com&originUrl=https%3A%2F%2Fchat.openai.com%2F"
  );
  assert.deepEqual(createdTabs, [opened]);
});

test("coverage assist ignores unknown hosts", () => {
  const { context } = createExtensionHarness("https://example.com/");

  const state = context.deriveCoverageAssistSignalState({
    assistEnabled: true,
    activeTabUrl: "https://example.com/",
    dismissedToolIds: [],
      detectionEntries: [
        {
          toolId: "chatgpt_openai",
        toolName: "ChatGPT (OpenAI)",
        hosts: ["chat.openai.com"],
      },
      ],
      rolloutEnabled: true,
    });

  assert.equal(state.detection, null);
  assert.equal(state.quietSignal, false);
});

test("coverage assist stays quiet while disabled", () => {
  const { context } = createExtensionHarness("https://chat.openai.com/");

  const state = context.deriveCoverageAssistSignalState({
    assistEnabled: false,
    activeTabUrl: "https://chat.openai.com/",
    dismissedToolIds: [],
      detectionEntries: [
        {
          toolId: "chatgpt_openai",
        toolName: "ChatGPT (OpenAI)",
        hosts: ["chat.openai.com"],
      },
      ],
      rolloutEnabled: true,
    });

  assert.equal(state.detection, null);
  assert.equal(state.quietSignal, false);
});

test("coverage assist suppresses the quiet signal for locally dismissed tools", () => {
  const { context } = createExtensionHarness("https://chat.openai.com/");

  const state = context.deriveCoverageAssistSignalState({
    assistEnabled: true,
    activeTabUrl: "https://chat.openai.com/",
    dismissedToolIds: ["chatgpt_openai"],
      detectionEntries: [
        {
          toolId: "chatgpt_openai",
        toolName: "ChatGPT (OpenAI)",
        hosts: ["chat.openai.com"],
      },
      ],
      rolloutEnabled: true,
    });

  assert.ok(state.detection);
  assert.equal(state.dismissed, true);
  assert.equal(state.quietSignal, false);
});

test("coverage assist tracks local disable events when the device toggle is turned off", async () => {
  const { context } = createExtensionHarness("https://chat.openai.com/", {
    coverageAssistEnabled: true,
  }, {
    remoteCoverageAssistConfig: {
      coverageAssistPhase1: true,
      coverageAssistExtension: true,
      coverageAssistSeedLibrary: true,
      rolloutEnabled: true,
    },
  });

  await context.setCoverageAssistEnabled(false);
  const events = await context.getCoverageAssistLocalEvents();

  assert.equal(events.length, 1);
  assert.equal(events[0]?.name, "assist_disabled");
  assert.equal(
    JSON.stringify(events[0]?.payload),
    JSON.stringify({
      source: "chrome_extension",
      location: "extension_popup",
    })
  );
});

test("coverage assist popup stays inactive until the pilot rollout is enabled", async () => {
  const { context } = createExtensionHarness(
    "https://chat.openai.com/",
    {
      coverageAssistEnabled: true,
    },
    {
      remoteCoverageAssistConfig: {
        coverageAssistPhase1: true,
        coverageAssistExtension: false,
        coverageAssistSeedLibrary: true,
        rolloutEnabled: false,
      },
    }
  );

  const state = await context.resolveCoverageAssistPopupState();
  assert.equal(state.rolloutEnabled, false);
  assert.equal(state.enabled, true);
  assert.equal(state.detection, null);
  assert.equal(state.quietSignal, false);
});

test("coverage assist tracks the quiet signal locally once per tool signature", async () => {
  const { context } = createExtensionHarness(
    "https://chat.openai.com/",
    {
      coverageAssistEnabled: true,
    },
    {
      remoteCoverageAssistConfig: {
        coverageAssistPhase1: true,
        coverageAssistExtension: true,
        coverageAssistSeedLibrary: true,
        rolloutEnabled: true,
      },
    }
  );

  await context.refreshActionPresentation();
  await context.refreshActionPresentation();
  const events = await context.getCoverageAssistLocalEvents();

  assert.equal(events.length, 1);
  assert.equal(events[0]?.name, "assist_signal_shown");
  assert.equal(
    JSON.stringify(events[0]?.payload),
    JSON.stringify({
      source: "chrome_extension",
      tool_id: "chatgpt_openai",
      matched_host: "chat.openai.com",
    })
  );
});

test("quick capture extension manifest enables popup ui and storage", () => {
  const manifest = JSON.parse(
    readFileSync(
      path.join(
        process.cwd(),
        "extensions/ki-register-quick-capture/manifest.json"
      ),
      "utf8"
    )
  ) as {
    permissions?: string[];
    action?: { default_popup?: string };
    host_permissions?: string[];
  };

  assert.deepEqual(manifest.permissions, [
    "tabs",
    "windows",
    "contextMenus",
    "offscreen",
    "storage",
  ]);
  assert.equal(manifest.action?.default_popup, "popup.html");
  assert.deepEqual(manifest.host_permissions, [
    "https://kiregister.com/*",
    "https://app.kiregister.com/*",
    "https://www.kiregister.com/*",
    "http://localhost/*",
    "http://127.0.0.1/*",
  ]);
});
