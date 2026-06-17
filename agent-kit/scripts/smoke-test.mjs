#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
  writeFileSync(
    path.join(workspace, "package.json"),
    `${JSON.stringify(
      {
        dependencies: {
          openai: "^6.0.0",
        },
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

  const autopilotPlan = JSON.parse(
    runCli(
      [
        "autopilot",
        "plan",
        "--json",
        "--cadence",
        "every-3-days",
        "--mode",
        "draft-only",
        "--sources",
        "docs/agent-workflows,package.json",
      ],
      workspace,
    ),
  );
  assert.equal(autopilotPlan.ok, true);
  assert.equal(autopilotPlan.plan.kind, "kiregister.autopilot.plan");
  assert.equal(autopilotPlan.plan.cadence, "every-3-days");
  assert.deepEqual(autopilotPlan.plan.policy.mayRead, [
    "docs/agent-workflows",
    "package.json",
  ]);

  const planPath = path.join(workspace, "autopilot-plan.json");
  runCli(
    [
      "autopilot",
      "plan",
      "--cadence",
      "every-3-days",
      "--mode",
      "draft-only",
      "--sources",
      "docs/agent-workflows,package.json",
      "--out-file",
      planPath,
    ],
    workspace,
  );

  const autopilotRun = JSON.parse(
    runCli(
      ["autopilot", "run", "--policy", planPath, "--json"],
      workspace,
    ),
  );
  assert.equal(autopilotRun.ok, true);
  assert.equal(autopilotRun.run.kind, "kiregister.autopilot.run");
  assert.equal(autopilotRun.run.candidateCount, 1);
  assert.equal(existsSync(autopilotRun.files.runPath), true);
  assert.equal(existsSync(autopilotRun.files.candidatePaths[0]), true);

  process.stdout.write("agent-kit smoke test passed\n");
}

main();
