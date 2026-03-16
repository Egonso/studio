const DEFAULT_BASE_URL = "https://kiregister.com"
const QUICK_CAPTURE_PATH = "/capture"
const COVERAGE_ASSIST_CONFIG_PATH = "/api/coverage-assist/config"
const MENU_ID = "ki-register-open-quick-capture"
const OFFSCREEN_DOCUMENT_PATH = "theme-detector.html"
const COVERAGE_ASSIST_DETECTION_PATH = "coverage-assist-detection.json"
const COVERAGE_ASSIST_SOURCE = "chrome_extension"
const QUIET_SIGNAL_BADGE_TEXT = "."
const QUIET_SIGNAL_BADGE_THEME = {
  light: {
    background: "#0b0b0b",
    text: "#f7f7f2",
  },
  dark: {
    background: "#f7f7f2",
    text: "#0b0b0b",
  },
}
const LIGHT_ACTION_ICONS = {
  16: "icons/icon16.png",
  32: "icons/icon32.png",
}
const DARK_ACTION_ICONS = {
  16: "icons/icon16-dark.png",
  32: "icons/icon32-dark.png",
}
const STORAGE_KEYS = {
  coverageAssistEnabled: "coverageAssistEnabled",
  dismissedToolIds: "coverageAssistDismissedToolIds",
  coverageAssistEvents: "coverageAssistEvents",
  lastSignalSignature: "coverageAssistLastSignalSignature",
}
const COVERAGE_ASSIST_ANALYTICS_MAX_EVENTS = 100
const DEFAULT_COVERAGE_ASSIST_REMOTE_CONFIG = Object.freeze({
  coverageAssistPhase1: false,
  coverageAssistExtension: false,
  coverageAssistSeedLibrary: false,
  rolloutEnabled: false,
})
const COVERAGE_ASSIST_QUERY_KEYS = {
  assist: "assist",
  assistSource: "assistSource",
  assistToolId: "assistToolId",
  assistMatchedHost: "assistMatchedHost",
  toolId: "toolId",
  matchedHost: "matchedHost",
}
let creatingOffscreenDocument = null
let coverageAssistDetectionEntriesPromise = null
const coverageAssistRemoteConfigPromises = new Map()

function isPreferredHost(hostname) {
  if (!hostname) return false
  if (hostname === "localhost" || hostname === "127.0.0.1") return true
  return (
    hostname === "kiregister.com" ||
    hostname === "www.kiregister.com" ||
    hostname === "app.kiregister.com"
  )
}

function normalizeHostname(hostname) {
  if (typeof hostname !== "string") return null
  const normalized = hostname.trim().toLowerCase().replace(/\.+$/, "")
  return normalized.length > 0 ? normalized : null
}

function normalizePathname(pathname) {
  if (typeof pathname !== "string") return "/"
  const trimmed = pathname.trim()
  if (trimmed.length === 0) return "/"
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`
}

function normalizeDismissedToolIds(value) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((entry) => typeof entry === "string" && entry.trim().length > 0))]
}

function hostMatchesDetectionHost(hostname, candidateHost) {
  const normalizedHost = normalizeHostname(hostname)
  const normalizedCandidate = normalizeHostname(candidateHost)

  if (!normalizedHost || !normalizedCandidate) return false

  return (
    normalizedHost === normalizedCandidate ||
    normalizedHost.endsWith(`.${normalizedCandidate}`)
  )
}

function parseHttpUrl(value) {
  if (typeof value !== "string" || value.trim().length === 0) return null

  try {
    const parsed = new URL(value)
    if (!["http:", "https:"].includes(parsed.protocol)) return null
    return parsed
  } catch {
    return null
  }
}

function buildCoverageAssistConfigUrl(baseUrl) {
  return new URL(COVERAGE_ASSIST_CONFIG_PATH, `${baseUrl}/`).toString()
}

function normalizeCoverageAssistRemoteConfig(input) {
  if (!input || typeof input !== "object") {
    return DEFAULT_COVERAGE_ASSIST_REMOTE_CONFIG
  }

  return {
    coverageAssistPhase1: input.coverageAssistPhase1 === true,
    coverageAssistExtension: input.coverageAssistExtension === true,
    coverageAssistSeedLibrary: input.coverageAssistSeedLibrary === true,
    rolloutEnabled: input.rolloutEnabled === true,
  }
}

async function loadCoverageAssistRemoteConfig(baseUrl = DEFAULT_BASE_URL) {
  const resolvedBaseUrl =
    typeof baseUrl === "string" && baseUrl.trim().length > 0
      ? baseUrl
      : DEFAULT_BASE_URL

  if (!coverageAssistRemoteConfigPromises.has(resolvedBaseUrl)) {
    const request = fetch(buildCoverageAssistConfigUrl(resolvedBaseUrl))
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Coverage Assist config is unavailable.")
        }

        return normalizeCoverageAssistRemoteConfig(await response.json())
      })
      .catch(() => DEFAULT_COVERAGE_ASSIST_REMOTE_CONFIG)

    coverageAssistRemoteConfigPromises.set(resolvedBaseUrl, request)
  }

  return coverageAssistRemoteConfigPromises.get(resolvedBaseUrl)
}

function isCoverageAssistDetectionEntry(entry) {
  return Boolean(
    entry &&
      typeof entry === "object" &&
      typeof entry.toolId === "string" &&
      entry.toolId.trim().length > 0 &&
      typeof entry.toolName === "string" &&
      entry.toolName.trim().length > 0 &&
      Array.isArray(entry.hosts) &&
      entry.hosts.every(
        (host) => typeof host === "string" && host.trim().length > 0
      )
  )
}

async function loadCoverageAssistDetectionEntries() {
  if (!coverageAssistDetectionEntriesPromise) {
    coverageAssistDetectionEntriesPromise = fetch(
      chrome.runtime.getURL(COVERAGE_ASSIST_DETECTION_PATH)
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ${COVERAGE_ASSIST_DETECTION_PATH}`)
        }

        const data = await response.json()
        if (!Array.isArray(data)) return []
        return data.filter(isCoverageAssistDetectionEntry)
      })
      .catch(() => [])
  }

  return coverageAssistDetectionEntriesPromise
}

function findCoverageAssistMatchForUrl(sourceUrl, detectionEntries = []) {
  const parsedUrl = parseHttpUrl(sourceUrl)
  if (!parsedUrl) return null

  const hostname = normalizeHostname(parsedUrl.hostname)
  if (!hostname) return null

  const pathname = normalizePathname(parsedUrl.pathname)

  for (const entry of detectionEntries) {
    if (!entry || entry.isEnabled === false) continue

    const matchedHost = entry.hosts.find((candidateHost) =>
      hostMatchesDetectionHost(hostname, candidateHost)
    )

    if (!matchedHost) continue

    const pathPrefixes = Array.isArray(entry.pathPrefixes) ? entry.pathPrefixes : []
    const matchedPath = pathPrefixes.find((prefix) =>
      pathname.startsWith(normalizePathname(prefix))
    )

    if (pathPrefixes.length > 0 && !matchedPath) {
      continue
    }

    return {
      toolId: entry.toolId,
      toolName: entry.toolName,
      matchedHost,
      matchedPath: matchedPath ?? null,
      sourceUrl: parsedUrl.toString(),
    }
  }

  return null
}

function deriveCoverageAssistSignalState({
  rolloutEnabled = false,
  assistEnabled,
  activeTabUrl,
  dismissedToolIds = [],
  detectionEntries = [],
} = {}) {
  const activeTabSupported = Boolean(parseHttpUrl(activeTabUrl))

  if (!rolloutEnabled) {
    return {
      rolloutEnabled: false,
      assistEnabled: Boolean(assistEnabled),
      activeTabSupported,
      detection: null,
      dismissed: false,
      quietSignal: false,
    }
  }

  if (!assistEnabled) {
    return {
      rolloutEnabled: true,
      assistEnabled: false,
      activeTabSupported,
      detection: null,
      dismissed: false,
      quietSignal: false,
    }
  }

  const detection = findCoverageAssistMatchForUrl(activeTabUrl, detectionEntries)
  if (!detection) {
    return {
      rolloutEnabled: true,
      assistEnabled: true,
      activeTabSupported,
      detection: null,
      dismissed: false,
      quietSignal: false,
    }
  }

  const dismissed = normalizeDismissedToolIds(dismissedToolIds).includes(
    detection.toolId
  )

  return {
    rolloutEnabled: true,
    assistEnabled: true,
    activeTabSupported,
    detection,
    dismissed,
    quietSignal: !dismissed,
  }
}

async function getCoverageAssistPreferences() {
  if (!chrome.storage?.local?.get) {
    return {
      enabled: false,
      dismissedToolIds: [],
    }
  }

  const stored = await chrome.storage.local.get({
    [STORAGE_KEYS.coverageAssistEnabled]: false,
    [STORAGE_KEYS.dismissedToolIds]: [],
  })

  return {
    enabled: stored[STORAGE_KEYS.coverageAssistEnabled] === true,
    dismissedToolIds: normalizeDismissedToolIds(
      stored[STORAGE_KEYS.dismissedToolIds]
    ),
  }
}

async function setCoverageAssistEnabled(enabled) {
  if (!chrome.storage?.local?.set) return
  const remoteConfig = await loadCoverageAssistRemoteConfig(await resolveBaseUrl())
  const preferences = await getCoverageAssistPreferences()
  const nextEnabled = remoteConfig.rolloutEnabled === true && enabled === true

  await chrome.storage.local.set({
    [STORAGE_KEYS.coverageAssistEnabled]: nextEnabled,
  })

  if (preferences.enabled === true && nextEnabled !== true) {
    await trackCoverageAssistLocalEvent("assist_disabled", {
      source: COVERAGE_ASSIST_SOURCE,
      location: "extension_popup",
    })
  }
}

async function getCoverageAssistLocalEvents() {
  if (!chrome.storage?.local?.get) {
    return []
  }

  const stored = await chrome.storage.local.get({
    [STORAGE_KEYS.coverageAssistEvents]: [],
  })

  return Array.isArray(stored[STORAGE_KEYS.coverageAssistEvents])
    ? stored[STORAGE_KEYS.coverageAssistEvents]
    : []
}

async function trackCoverageAssistLocalEvent(name, payload = {}) {
  if (!chrome.storage?.local?.set) return null

  const existingEvents = await getCoverageAssistLocalEvents()
  const event = {
    name: String(name || ""),
    occurredAt: new Date().toISOString(),
    payload:
      payload && typeof payload === "object" ? payload : {},
  }

  await chrome.storage.local.set({
    [STORAGE_KEYS.coverageAssistEvents]: [...existingEvents, event].slice(
      -COVERAGE_ASSIST_ANALYTICS_MAX_EVENTS
    ),
  })

  return event
}

async function trackCoverageAssistSignalShownLocal(signalState) {
  if (
    !signalState?.quietSignal ||
    !signalState?.detection ||
    !chrome.storage?.local?.get ||
    !chrome.storage?.local?.set
  ) {
    return null
  }

  const signature = [
    COVERAGE_ASSIST_SOURCE,
    signalState.detection.toolId,
    signalState.detection.matchedHost ?? "",
  ].join(":")
  const stored = await chrome.storage.local.get({
    [STORAGE_KEYS.lastSignalSignature]: null,
  })

  if (stored[STORAGE_KEYS.lastSignalSignature] === signature) {
    return null
  }

  await chrome.storage.local.set({
    [STORAGE_KEYS.lastSignalSignature]: signature,
  })

  return trackCoverageAssistLocalEvent("assist_signal_shown", {
    source: COVERAGE_ASSIST_SOURCE,
    tool_id: signalState.detection.toolId,
    matched_host: signalState.detection.matchedHost ?? null,
  })
}

async function dismissCoverageAssistTool(toolId) {
  if (!toolId || !chrome.storage?.local?.set) return

  const preferences = await getCoverageAssistPreferences()
  const nextDismissedToolIds = normalizeDismissedToolIds([
    ...preferences.dismissedToolIds,
    toolId,
  ])

  await chrome.storage.local.set({
    [STORAGE_KEYS.dismissedToolIds]: nextDismissedToolIds,
  })
}

async function undismissCoverageAssistTool(toolId) {
  if (!toolId || !chrome.storage?.local?.set) return

  const preferences = await getCoverageAssistPreferences()
  const nextDismissedToolIds = preferences.dismissedToolIds.filter(
    (entry) => entry !== toolId
  )

  await chrome.storage.local.set({
    [STORAGE_KEYS.dismissedToolIds]: nextDismissedToolIds,
  })
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  return tabs[0] ?? null
}

async function inferBaseUrlFromActiveTab() {
  const activeTab = await getActiveTab()
  if (!activeTab?.url) return null

  try {
    const url = new URL(activeTab.url)
    if (!["http:", "https:"].includes(url.protocol)) return null
    if (!isPreferredHost(url.hostname)) return null
    return `${url.protocol}//${url.host}`
  } catch {
    return null
  }
}

async function resolveBaseUrl() {
  const inferred = await inferBaseUrlFromActiveTab()
  if (inferred) return inferred
  return DEFAULT_BASE_URL
}

function buildQuickCaptureUrl(baseUrl, prefillText, sourceUrl) {
  const url = new URL(QUICK_CAPTURE_PATH, `${baseUrl}/`)
  url.searchParams.set("source", "chrome-extension")

  if (prefillText) {
    url.searchParams.set("prefill", prefillText.slice(0, 500))
  }
  if (sourceUrl) {
    url.searchParams.set("originUrl", sourceUrl.slice(0, 500))
  }
  return url.toString()
}

function buildCoverageAssistUrl(
  baseUrl,
  { toolId, matchedHost, sourceUrl = "" } = {}
) {
  if (!toolId || !matchedHost) {
    throw new Error("Coverage Assist deeplink requires toolId and matchedHost.")
  }

  const url = new URL(QUICK_CAPTURE_PATH, `${baseUrl}/`)
  url.searchParams.set("source", "chrome-extension")
  url.searchParams.set(COVERAGE_ASSIST_QUERY_KEYS.assist, "coverage")
  url.searchParams.set(
    COVERAGE_ASSIST_QUERY_KEYS.assistSource,
    COVERAGE_ASSIST_SOURCE
  )
  url.searchParams.set(COVERAGE_ASSIST_QUERY_KEYS.assistToolId, toolId)
  url.searchParams.set(COVERAGE_ASSIST_QUERY_KEYS.assistMatchedHost, matchedHost)
  url.searchParams.set(COVERAGE_ASSIST_QUERY_KEYS.toolId, toolId)
  url.searchParams.set(COVERAGE_ASSIST_QUERY_KEYS.matchedHost, matchedHost)

  if (sourceUrl) {
    url.searchParams.set("originUrl", sourceUrl.slice(0, 500))
  }

  return url.toString()
}

async function openQuickCapture({
  openInTab = false,
  prefillText = "",
  sourceUrl = "",
} = {}) {
  const baseUrl = await resolveBaseUrl()
  const targetUrl = buildQuickCaptureUrl(baseUrl, prefillText, sourceUrl)

  if (openInTab) {
    await chrome.tabs.create({ url: targetUrl })
    return targetUrl
  }

  await chrome.windows.create({
    url: targetUrl,
    type: "popup",
    width: 520,
    height: 900,
    focused: true,
  })
  return targetUrl
}

async function openCoverageAssistCapture({
  openInTab = true,
  toolId,
  matchedHost,
  sourceUrl = "",
} = {}) {
  const baseUrl = await resolveBaseUrl()
  const targetUrl = buildCoverageAssistUrl(baseUrl, {
    toolId,
    matchedHost,
    sourceUrl,
  })

  if (openInTab) {
    await chrome.tabs.create({ url: targetUrl })
    return targetUrl
  }

  await chrome.windows.create({
    url: targetUrl,
    type: "popup",
    width: 520,
    height: 900,
    focused: true,
  })
  return targetUrl
}

async function createContextMenu() {
  try {
    await chrome.contextMenus.removeAll()
  } catch {
    // Ignore if Chrome has not created any menu yet.
  }

  chrome.contextMenus.create({
    id: MENU_ID,
    title: "KI-Register Quick Capture",
    contexts: ["page", "selection"],
  })
}

async function hasOffscreenDocument() {
  if (typeof chrome.runtime.getContexts === "function") {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
      documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)],
    })
    return contexts.length > 0
  }

  const matchedClients = await clients.matchAll()
  return matchedClients.some(
    (client) => client.url === chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)
  )
}

async function ensureOffscreenDocument() {
  if (!chrome.offscreen?.createDocument) {
    return false
  }

  if (await hasOffscreenDocument()) {
    return true
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
        creatingOffscreenDocument = null
      })
  }

  await creatingOffscreenDocument
  return hasOffscreenDocument()
}

async function setActionIconForScheme(scheme) {
  const icons = scheme === "dark" ? DARK_ACTION_ICONS : LIGHT_ACTION_ICONS
  try {
    await chrome.action.setIcon({ path: icons })
  } catch {
    // Ignore icon update failures and keep Chrome defaults.
  }
}

async function getColorSchemeFromOffscreen() {
  const ready = await ensureOffscreenDocument()
  if (!ready) return null

  try {
    const response = await chrome.runtime.sendMessage({ type: "getColorScheme" })
    if (response?.scheme === "dark" || response?.scheme === "light") {
      return response.scheme
    }
  } catch {
    // Ignore and keep fallback.
  }

  return null
}

async function refreshActionIcon() {
  const colorScheme = await getColorSchemeFromOffscreen()
  const scheme = colorScheme === "dark" ? "dark" : "light"
  await setActionIconForScheme(scheme)
  return scheme
}

function resolveQuietSignalBadgeTheme(scheme) {
  return scheme === "dark" ? QUIET_SIGNAL_BADGE_THEME.dark : QUIET_SIGNAL_BADGE_THEME.light
}

async function setQuietSignalState(signalState, scheme = "light") {
  const hasSignal = Boolean(signalState?.quietSignal && signalState?.detection)
  const actionTitle = hasSignal
    ? `Coverage Assist verfuegbar: ${signalState.detection.toolName}`
    : "KI-Register Quick Capture"

  try {
    await chrome.action.setTitle({ title: actionTitle })
    await chrome.action.setBadgeText({ text: hasSignal ? QUIET_SIGNAL_BADGE_TEXT : "" })
    if (hasSignal) {
      const theme = resolveQuietSignalBadgeTheme(scheme)
      await chrome.action.setBadgeBackgroundColor({
        color: theme.background,
      })
      if (typeof chrome.action.setBadgeTextColor === "function") {
        await chrome.action.setBadgeTextColor({ color: theme.text })
      }
    }
  } catch {
    // Ignore presentation failures and keep the extension usable.
  }

  if (hasSignal) {
    await trackCoverageAssistSignalShownLocal(signalState)
  }
}

async function resolveCoverageAssistStateForActiveTab(activeTabUrlOverride = null) {
  const baseUrl = await resolveBaseUrl()
  const remoteConfig = await loadCoverageAssistRemoteConfig(baseUrl)
  const preferences = await getCoverageAssistPreferences()
  const activeTabUrl =
    activeTabUrlOverride ?? (await getActiveTab())?.url ?? null
  const detectionEntries =
    preferences.enabled && remoteConfig.rolloutEnabled === true
    ? await loadCoverageAssistDetectionEntries()
    : []

  return deriveCoverageAssistSignalState({
    rolloutEnabled: remoteConfig.rolloutEnabled === true,
    assistEnabled: preferences.enabled,
    activeTabUrl,
    dismissedToolIds: preferences.dismissedToolIds,
    detectionEntries,
  })
}

async function resolveCoverageAssistPopupState() {
  const activeTab = await getActiveTab()
  const signalState = await resolveCoverageAssistStateForActiveTab(
    activeTab?.url ?? null
  )

  return {
    rolloutEnabled: signalState.rolloutEnabled,
    enabled: signalState.assistEnabled,
    activeTabSupported: signalState.activeTabSupported,
    detection: signalState.detection,
    dismissed: signalState.dismissed,
    quietSignal: signalState.quietSignal,
  }
}

async function refreshActionPresentation() {
  const scheme = await refreshActionIcon()
  const signalState = await resolveCoverageAssistStateForActiveTab()
  await setQuietSignalState(signalState, scheme)
}

chrome.runtime.onInstalled.addListener(() => {
  void createContextMenu()
  void refreshActionPresentation()
})

chrome.runtime.onStartup.addListener(() => {
  void createContextMenu()
  void refreshActionPresentation()
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID) return
  void openQuickCapture({
    prefillText: info.selectionText || "",
    sourceUrl: tab?.url || "",
  })
})

chrome.commands.onCommand.addListener((command) => {
  if (command === "open-quick-capture") {
    void openQuickCapture()
  }
})

chrome.tabs.onActivated.addListener(() => {
  void refreshActionPresentation()
})

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (!tab?.active) return
  if (changeInfo.status !== "complete" && !changeInfo.url) return
  void refreshActionPresentation()
})

chrome.windows.onFocusChanged?.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return
  void refreshActionPresentation()
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "colorSchemeChanged") {
    void setActionIconForScheme(message.scheme === "dark" ? "dark" : "light")
    return false
  }

  if (message?.type === "getPopupState") {
    void resolveCoverageAssistPopupState()
      .then((state) => sendResponse({ ok: true, state }))
      .catch((error) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        })
      )
    return true
  }

  if (message?.type === "setCoverageAssistEnabled") {
    void setCoverageAssistEnabled(message.enabled === true)
      .then(() => refreshActionPresentation())
      .then(() => resolveCoverageAssistPopupState())
      .then((state) => sendResponse({ ok: true, state }))
      .catch((error) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        })
      )
    return true
  }

  if (message?.type === "dismissCoverageAssistTool") {
    void dismissCoverageAssistTool(String(message.toolId || ""))
      .then(() => refreshActionPresentation())
      .then(() => resolveCoverageAssistPopupState())
      .then((state) => sendResponse({ ok: true, state }))
      .catch((error) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        })
      )
    return true
  }

  if (message?.type === "undismissCoverageAssistTool") {
    void undismissCoverageAssistTool(String(message.toolId || ""))
      .then(() => refreshActionPresentation())
      .then(() => resolveCoverageAssistPopupState())
      .then((state) => sendResponse({ ok: true, state }))
      .catch((error) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        })
      )
    return true
  }

  if (message?.type === "openCoverageAssist") {
    void resolveCoverageAssistStateForActiveTab()
      .then((state) => {
        if (!state.detection || state.dismissed) {
          throw new Error("Coverage Assist is not available for the current tab.")
        }

        return openCoverageAssistCapture({
          openInTab: true,
          toolId: state.detection.toolId,
          matchedHost: state.detection.matchedHost,
          sourceUrl: state.detection.sourceUrl,
        })
      })
      .then((url) => sendResponse({ ok: true, url }))
      .catch((error) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        })
      )
    return true
  }

  if (message?.type === "openQuickCapture") {
    void openQuickCapture({
      openInTab: Boolean(message.openInTab),
      prefillText: String(message.prefillText || ""),
      sourceUrl: String(message.sourceUrl || ""),
    })
      .then((url) => sendResponse({ ok: true, url }))
      .catch((error) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        })
      )
    return true
  }

  return false
})
