const baseUrlInput = document.getElementById("baseUrl");
const saveButton = document.getElementById("save");
const openTestButton = document.getElementById("open-test");
const statusEl = document.getElementById("status");

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
    baseUrlInput.value = response.baseUrl;
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), true);
  }
}

async function save() {
  const baseUrl = baseUrlInput.value.trim();
  if (!baseUrl) {
    setStatus("Bitte gib eine URL ein.", true);
    return;
  }

  try {
    const response = await request({ type: "setBaseUrl", baseUrl });
    baseUrlInput.value = response.baseUrl;
    setStatus(`Gespeichert: ${response.baseUrl}`);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), true);
  }
}

async function openTest() {
  try {
    await request({ type: "openQuickCapture", openInTab: false });
    setStatus("Quick Capture geoeffnet.");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), true);
  }
}

saveButton.addEventListener("click", () => {
  void save();
});

openTestButton.addEventListener("click", () => {
  void openTest();
});

void loadConfig();
