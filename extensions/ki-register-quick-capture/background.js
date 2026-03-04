const DEFAULT_BASE_URL = "https://kiregister.com";
const QUICK_CAPTURE_PATH = "/capture";
const MENU_ID = "ki-register-open-quick-capture";
const OFFSCREEN_DOCUMENT_PATH = "theme-detector.html";
const LIGHT_ACTION_ICONS = {
  16: "icons/icon16.png",
  32: "icons/icon32.png",
};
const DARK_ACTION_ICONS = {
  16: "icons/icon16-dark.png",
  32: "icons/icon32-dark.png",
};
let creatingOffscreenDocument = null;

function isPreferredHost(hostname) {
  if (!hostname) return false;
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  return hostname === "kiregister.com" || hostname.endsWith(".kiregister.com");
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
  return DEFAULT_BASE_URL;
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

async function hasOffscreenDocument() {
  if (typeof chrome.runtime.getContexts === "function") {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
      documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)],
    });
    return contexts.length > 0;
  }

  const matchedClients = await clients.matchAll();
  return matchedClients.some(
    (client) => client.url === chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)
  );
}

async function ensureOffscreenDocument() {
  if (!chrome.offscreen?.createDocument) {
    return false;
  }

  if (await hasOffscreenDocument()) {
    return true;
  }

  if (!creatingOffscreenDocument) {
    creatingOffscreenDocument = chrome.offscreen
      .createDocument({
        url: OFFSCREEN_DOCUMENT_PATH,
        reasons: ["MATCH_MEDIA"],
        justification: "Adapts extension icon to dark/light browser theme.",
      })
      .catch(() => {
        // Fail silently and fall back to default icon.
      })
      .finally(() => {
        creatingOffscreenDocument = null;
      });
  }

  await creatingOffscreenDocument;
  return hasOffscreenDocument();
}

async function setActionIconForScheme(scheme) {
  const icons = scheme === "dark" ? DARK_ACTION_ICONS : LIGHT_ACTION_ICONS;
  try {
    await chrome.action.setIcon({ path: icons });
  } catch {
    // Ignore icon update failures and keep Chrome defaults.
  }
}

async function getColorSchemeFromOffscreen() {
  const ready = await ensureOffscreenDocument();
  if (!ready) return null;

  try {
    const response = await chrome.runtime.sendMessage({ type: "getColorScheme" });
    if (response?.scheme === "dark" || response?.scheme === "light") {
      return response.scheme;
    }
  } catch {
    // Ignore and keep fallback.
  }

  return null;
}

async function refreshActionIcon() {
  const colorScheme = await getColorSchemeFromOffscreen();
  await setActionIconForScheme(colorScheme === "dark" ? "dark" : "light");
}

chrome.runtime.onInstalled.addListener(() => {
  void createContextMenu();
  void refreshActionIcon();
});

chrome.runtime.onStartup.addListener(() => {
  void createContextMenu();
  void refreshActionIcon();
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
  void refreshActionIcon();
  void openQuickCapture();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "colorSchemeChanged") {
    void setActionIconForScheme(message.scheme === "dark" ? "dark" : "light");
    return false;
  }

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

  return false;
});
