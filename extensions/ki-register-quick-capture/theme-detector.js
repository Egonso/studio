const query = window.matchMedia("(prefers-color-scheme: dark)");

function currentScheme() {
  return query.matches ? "dark" : "light";
}

function notifyBackground() {
  chrome.runtime.sendMessage(
    {
      type: "colorSchemeChanged",
      scheme: currentScheme(),
    },
    () => {
      // Accessing lastError prevents noisy warnings when no listener is awake.
      void chrome.runtime.lastError;
    }
  );
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "getColorScheme") {
    sendResponse({ scheme: currentScheme() });
    return false;
  }

  return false;
});

if (typeof query.addEventListener === "function") {
  query.addEventListener("change", notifyBackground);
} else {
  query.addListener(notifyBackground);
}

notifyBackground();
