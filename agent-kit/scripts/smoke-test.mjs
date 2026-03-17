#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT_DIR = process.cwd();
const CLI_PATH = path.join(ROOT_DIR, "bin", "studio-agent.mjs");

function runCli(args, cwd = ROOT_DIR) {
  return execFileSync("node", [CLI_PATH, ...args], {
    cwd,
    encoding: "utf8",
  });
}

function main() {
  const template = JSON.parse(runCli(["template"]));
  assert.equal(template.documentationType, "application");
  assert.equal(Array.isArray(template.systems), true);

  const workspace = mkdtempSync(path.join(os.tmpdir(), "agent-kit-smoke-"));
  const outDir = path.join(workspace, "docs");
  const inputPath = path.join(workspace, "input.json");
  const configDir = path.join(workspace, ".studio-agent");

  mkdirSync(configDir, { recursive: true });
  writeFileSync(
    path.join(configDir, "config.json"),
    `${JSON.stringify(
      {
        profile: {
          name: "Smoke Test",
          role: "Compliance Lead",
          team: "QA",
        },
        defaults: {
          outDir,
          ownerRole: "Compliance Lead",
          documentationType: "workflow",
          usageContexts: ["EMPLOYEES"],
          decisionInfluence: "PREPARATION",
          confirmBeforeWrite: false,
        },
      },
      null,
      2,
    )}\n`,
  );

  writeFileSync(
    inputPath,
    `${JSON.stringify(
      {
        title: "Support knowledge assistant",
        purpose: "Draft support summaries for review.",
        systems: ["Zendesk", "Claude"],
        controls: ["Human review remains mandatory"],
      },
      null,
      2,
    )}\n`,
  );

  const createResult = JSON.parse(
    runCli(["capture", "--input", inputPath, "--yes", "--json"], workspace),
  );
  assert.equal(createResult.ok, true);

  const manifest = JSON.parse(
    readFileSync(createResult.files.manifestPath, "utf8"),
  );
  assert.equal(manifest.ownerRole, "Compliance Lead");
  assert.deepEqual(manifest.usageContexts, ["EMPLOYEES"]);

  const validateResult = JSON.parse(
    runCli(
      ["validate", createResult.files.manifestPath, "--json"],
      workspace,
    ),
  );
  assert.equal(validateResult.ok, true);

  process.stdout.write("agent-kit smoke test passed\n");
}

main();
