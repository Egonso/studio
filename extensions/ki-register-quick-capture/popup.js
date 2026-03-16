const assistToggle = document.getElementById("assist-toggle")
const statusTitle = document.getElementById("status-title")
const statusBody = document.getElementById("status-body")
const reviewButton = document.getElementById("review-button")
const quickCaptureButton = document.getElementById("quick-capture-button")
const dismissButton = document.getElementById("dismiss-button")
const restoreButton = document.getElementById("restore-button")
const feedback = document.getElementById("feedback")
let latestState = null

async function sendMessage(message) {
  return chrome.runtime.sendMessage(message)
}

function syncControlAvailability(isBusy) {
  assistToggle.disabled = isBusy || latestState?.rolloutEnabled !== true
  reviewButton.disabled = isBusy
  quickCaptureButton.disabled = isBusy
  dismissButton.disabled = isBusy
  restoreButton.disabled = isBusy
}

function setBusy(isBusy) {
  syncControlAvailability(isBusy)
}

function setFeedback(message) {
  feedback.textContent = message || ""
}

function renderState(state) {
  latestState = state
  assistToggle.checked = state.rolloutEnabled === true && state.enabled === true

  reviewButton.hidden = true
  dismissButton.hidden = true
  restoreButton.hidden = true
  syncControlAvailability(false)

  if (!state.rolloutEnabled) {
    statusTitle.textContent = "Coverage Assist ist noch nicht freigeschaltet"
    statusBody.textContent =
      "Die Funktion bleibt deaktiviert, bis der Pilot im Register aktiviert ist. Quick Capture funktioniert weiterhin ganz normal."
    return
  }

  if (!state.enabled) {
    statusTitle.textContent = "Coverage Assist ist auf diesem Geraet aus"
    statusBody.textContent =
      "Aktiviere Coverage Assist, wenn du lokale Tool-Erkennung fuer den aktuellen Tab nutzen moechtest."
    return
  }

  if (!state.activeTabSupported) {
    statusTitle.textContent = "Kein pruefbarer Browser-Tab"
    statusBody.textContent =
      "Coverage Assist funktioniert nur auf regulaeren http(s)-Tabs."
    return
  }

  if (!state.detection) {
    statusTitle.textContent = "Kein bekanntes KI-Tool erkannt"
    statusBody.textContent =
      "Auf diesem Tab wurde kein Tool aus der lokalen Coverage-Assist-Liste erkannt."
    return
  }

  if (state.dismissed) {
    statusTitle.textContent = `${state.detection.toolName} lokal ausgeblendet`
    statusBody.textContent =
      "Dieses Tool wird auf diesem Geraet nicht mehr signalisiert, bis du es wieder aktivierst."
    restoreButton.hidden = false
    restoreButton.dataset.toolId = state.detection.toolId
    return
  }

  statusTitle.textContent = `${state.detection.toolName} erkannt`
  statusBody.textContent = `Coverage Assist ist fuer ${state.detection.matchedHost} verfuegbar. Die inhaltliche Pruefung passiert im Register.`
  reviewButton.hidden = false
  dismissButton.hidden = false
  dismissButton.dataset.toolId = state.detection.toolId
}

async function refreshState() {
  setBusy(true)
  setFeedback("")

  try {
    const response = await sendMessage({ type: "getPopupState" })
    if (!response?.ok) {
      throw new Error(response?.error || "Popup state could not be loaded.")
    }

    renderState(response.state)
  } catch (error) {
    statusTitle.textContent = "Status konnte nicht geladen werden"
    statusBody.textContent =
      error instanceof Error ? error.message : String(error)
  } finally {
    setBusy(false)
  }
}

assistToggle.addEventListener("change", async () => {
  setBusy(true)
  setFeedback("")

  try {
    const response = await sendMessage({
      type: "setCoverageAssistEnabled",
      enabled: assistToggle.checked,
    })
    if (!response?.ok) {
      throw new Error(response?.error || "Coverage Assist could not be updated.")
    }

    renderState(response.state)
  } catch (error) {
    assistToggle.checked = !assistToggle.checked
    setFeedback(error instanceof Error ? error.message : String(error))
  } finally {
    setBusy(false)
  }
})

reviewButton.addEventListener("click", async () => {
  setBusy(true)
  setFeedback("")

  try {
    const response = await sendMessage({ type: "openCoverageAssist" })
    if (!response?.ok) {
      throw new Error(response?.error || "Coverage Assist could not be opened.")
    }

    window.close()
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : String(error))
  } finally {
    setBusy(false)
  }
})

quickCaptureButton.addEventListener("click", async () => {
  setBusy(true)
  setFeedback("")

  try {
    const response = await sendMessage({
      type: "openQuickCapture",
      openInTab: false,
    })
    if (!response?.ok) {
      throw new Error(response?.error || "Quick Capture could not be opened.")
    }

    window.close()
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : String(error))
  } finally {
    setBusy(false)
  }
})

dismissButton.addEventListener("click", async () => {
  const toolId = dismissButton.dataset.toolId
  if (!toolId) return

  setBusy(true)
  setFeedback("")

  try {
    const response = await sendMessage({
      type: "dismissCoverageAssistTool",
      toolId,
    })
    if (!response?.ok) {
      throw new Error(response?.error || "Tool could not be dismissed.")
    }

    renderState(response.state)
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : String(error))
  } finally {
    setBusy(false)
  }
})

restoreButton.addEventListener("click", async () => {
  const toolId = restoreButton.dataset.toolId
  if (!toolId) return

  setBusy(true)
  setFeedback("")

  try {
    const response = await sendMessage({
      type: "undismissCoverageAssistTool",
      toolId,
    })
    if (!response?.ok) {
      throw new Error(response?.error || "Tool could not be restored.")
    }

    renderState(response.state)
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : String(error))
  } finally {
    setBusy(false)
  }
})

void refreshState()
