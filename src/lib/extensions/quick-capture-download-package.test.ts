import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

function runUnzip(args: string[]) {
  const result = spawnSync("unzip", args, {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(result.stderr || `unzip ${args.join(" ")} failed`);
  }

  return result.stdout;
}

test("chrome extension download zip includes popup assets", () => {
  const zipPath = path.join(
    process.cwd(),
    "public/downloads/ki-register-quick-capture-chrome.zip"
  );

  const entries = runUnzip(["-Z1", zipPath])
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);

  assert.ok(
    entries.includes("ki-register-quick-capture/popup.html"),
    "download zip is missing popup.html"
  );
  assert.ok(
    entries.includes("ki-register-quick-capture/popup.css"),
    "download zip is missing popup.css"
  );
  assert.ok(
    entries.includes("ki-register-quick-capture/popup.js"),
    "download zip is missing popup.js"
  );
  assert.ok(
    entries.includes("ki-register-quick-capture/coverage-assist-detection.json"),
    "download zip is missing coverage-assist-detection.json"
  );
  assert.equal(
    entries.some(
      (entry) => entry.startsWith("__MACOSX/") || entry.includes("/._")
    ),
    false,
    "download zip should not contain macOS metadata files"
  );
});

test("chrome extension download zip manifest points at the popup ui", () => {
  const zipPath = path.join(
    process.cwd(),
    "public/downloads/ki-register-quick-capture-chrome.zip"
  );

  const manifestRaw = runUnzip([
    "-p",
    zipPath,
    "ki-register-quick-capture/manifest.json",
  ]);
  const manifest = JSON.parse(manifestRaw) as {
    action?: { default_popup?: string };
  };

  assert.equal(manifest.action?.default_popup, "popup.html");
});

test("extension source folder still contains the popup assets referenced by the zip", () => {
  const extensionDir = path.join(
    process.cwd(),
    "extensions/ki-register-quick-capture"
  );

  for (const relativePath of [
    "popup.html",
    "popup.css",
    "popup.js",
    "coverage-assist-detection.json",
    "manifest.json",
  ]) {
    assert.doesNotThrow(() =>
      readFileSync(path.join(extensionDir, relativePath), "utf8")
    );
  }
});
