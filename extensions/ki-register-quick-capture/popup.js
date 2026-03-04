const baseUrlEl = document.getElementById("base-url");
const statusEl = document.getElementById("status");
const openWindowBtn = document.getElementById("open-window");
const openTabBtn = document.getElementById("open-tab");
const openOptionsBtn = document.getElementById("open-options");

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle("error", isError);
}

function request(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!response?.ok) {
        reject(new Error(response?.error || "Unbekannter Fehler"));
        return;
      }
      resolve(response);
    });
  });
}

async function loadConfig() {
  try {
    const response = await request({ type: "getConfig" });
    baseUrlEl.textContent = response.baseUrl;
  } catch (error) {
    baseUrlEl.textContent = "Konfiguration konnte nicht geladen werden.";
    setStatus(error instanceof Error ? error.message : String(error), true);
  }
}

async function openQuickCapture(openInTab) {
  setStatus("Oeffne ...");
  try {
    await request({
      type: "openQuickCapture",
      openInTab,
    });
    setStatus("Geoeffnet.");
    window.close();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), true);
  }
}

openWindowBtn.addEventListener("click", () => {
  void openQuickCapture(false);
});

openTabBtn.addEventListener("click", () => {
  void openQuickCapture(true);
});

openOptionsBtn.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

void loadConfig();
