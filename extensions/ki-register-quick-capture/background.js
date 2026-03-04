const DEFAULT_BASE_URL = "https://app.kiregister.com";
const QUICK_CAPTURE_PATH = "/capture";
const STORAGE_KEY = "quickCaptureBaseUrl";
const MENU_ID = "ki-register-open-quick-capture";

function normalizeBaseUrl(value) {
  try {
    const parsed = new URL(String(value).trim());
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }
    parsed.pathname = "";
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function isPreferredHost(hostname) {
  if (!hostname) return false;
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  return hostname === "kiregister.com" || hostname.endsWith(".kiregister.com");
}

async function getStoredBaseUrl() {
  const stored = await chrome.storage.sync.get(STORAGE_KEY);
  const normalized = normalizeBaseUrl(stored[STORAGE_KEY]);
  return normalized || DEFAULT_BASE_URL;
}

async function inferBaseUrlFromActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];
  if (!activeTab?.url) return null;

  try {
    const url = new URL(activeTab.url);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (!isPreferredHost(url.hostname)) return null;
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

async function resolveBaseUrl() {
  const inferred = await inferBaseUrlFromActiveTab();
  if (inferred) return inferred;
  return getStoredBaseUrl();
}

function buildQuickCaptureUrl(baseUrl, prefillText, sourceUrl) {
  const url = new URL(QUICK_CAPTURE_PATH, `${baseUrl}/`);
  url.searchParams.set("source", "chrome-extension");

  if (prefillText) {
    url.searchParams.set("prefill", prefillText.slice(0, 500));
  }
  if (sourceUrl) {
    url.searchParams.set("originUrl", sourceUrl.slice(0, 500));
  }
  return url.toString();
}

async function openQuickCapture({ openInTab = false, prefillText = "", sourceUrl = "" } = {}) {
  const baseUrl = await resolveBaseUrl();
  const targetUrl = buildQuickCaptureUrl(baseUrl, prefillText, sourceUrl);

  if (openInTab) {
    await chrome.tabs.create({ url: targetUrl });
    return targetUrl;
  }

  await chrome.windows.create({
    url: targetUrl,
    type: "popup",
    width: 520,
    height: 900,
    focused: true,
  });
  return targetUrl;
}

async function createContextMenu() {
  try {
    await chrome.contextMenus.removeAll();
  } catch {
    // Ignore if Chrome has not created any menu yet.
  }

  chrome.contextMenus.create({
    id: MENU_ID,
    title: "KI-Register Quick Capture",
    contexts: ["page", "selection"],
  });
}

chrome.runtime.onInstalled.addListener(() => {
  void createContextMenu();
});

chrome.runtime.onStartup.addListener(() => {
  void createContextMenu();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID) return;
  void openQuickCapture({
    prefillText: info.selectionText || "",
    sourceUrl: tab?.url || "",
  });
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "open-quick-capture") {
    void openQuickCapture();
  }
});

chrome.action.onClicked.addListener(() => {
  void openQuickCapture();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "openQuickCapture") {
    void openQuickCapture({
      openInTab: Boolean(message.openInTab),
      prefillText: String(message.prefillText || ""),
      sourceUrl: String(message.sourceUrl || ""),
    })
      .then((url) => sendResponse({ ok: true, url }))
      .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }));
    return true;
  }

  if (message?.type === "getConfig") {
    void getStoredBaseUrl()
      .then((baseUrl) => sendResponse({ ok: true, baseUrl, defaultBaseUrl: DEFAULT_BASE_URL }))
      .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }));
    return true;
  }

  if (message?.type === "setBaseUrl") {
    const normalized = normalizeBaseUrl(message.baseUrl);
    if (!normalized) {
      sendResponse({ ok: false, error: "Ungueltige URL." });
      return false;
    }

    void chrome.storage.sync
      .set({ [STORAGE_KEY]: normalized })
      .then(() => sendResponse({ ok: true, baseUrl: normalized }))
      .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }));
    return true;
  }

  return false;
});
