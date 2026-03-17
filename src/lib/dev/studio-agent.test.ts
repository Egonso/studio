import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const cliPath = resolve(process.cwd(), "agent-kit/bin/studio-agent.mjs");

function runCli(args: string[], cwd = process.cwd()) {
  return execFileSync("node", [cliPath, ...args], {
    cwd,
    encoding: "utf8",
  });
}

test("studio-agent template prints a valid starter manifest", () => {
  const output = runCli(["template"]);
  const manifest = JSON.parse(output);

  assert.equal(manifest.documentationType, "application");
  assert.equal(Array.isArray(manifest.systems), true);
  assert.equal(manifest.systems.length > 0, true);
  assert.equal(manifest.ownerRole, "Support Lead");
});

test("studio-agent capture uses onboarding defaults and writes workflow docs", () => {
  const workspace = mkdtempSync(join(tmpdir(), "studio-agent-capture-"));
  const configDir = join(workspace, ".studio-agent");
  const outDir = join(workspace, "workflow-docs");

  mkdirSync(configDir, { recursive: true });
  writeFileSync(
    join(configDir, "config.json"),
    JSON.stringify(
      {
        profile: {
          name: "Momo",
          role: "Operations Lead",
          team: "Studio",
          contactPersonName: "Momo",
        },
        defaults: {
          outDir,
          ownerRole: "Operations Lead",
          documentationType: "workflow",
          usageContexts: ["EMPLOYEES"],
          decisionInfluence: "PREPARATION",
          connectionMode: "SEMI_AUTOMATED",
          confirmBeforeWrite: false,
        },
      },
      null,
      2,
    ),
  );

  const output = runCli(
    [
      "capture",
      "--title",
      "Finance invoice triage",
      "--purpose",
      "AI prepares invoice mismatch summaries for finance review.",
      "--systems",
      "SAP, Claude",
      "--controls",
      "Human approval remains mandatory",
      "--steps",
      "Analyst exports invoice records; AI drafts mismatch summary; Analyst approves next actions",
      "--yes",
      "--json",
    ],
    workspace,
  );
  const result = JSON.parse(output);
  const manifest = JSON.parse(readFileSync(result.files.manifestPath, "utf8"));
  const readme = readFileSync(result.files.readmePath, "utf8");

  assert.equal(result.ok, true);
  assert.equal(manifest.slug, "finance-invoice-triage");
  assert.equal(manifest.ownerRole, "Operations Lead");
  assert.deepEqual(manifest.usageContexts, ["EMPLOYEES"]);
  assert.match(readme, /# Finance invoice triage/);
});

test("studio-agent validate accepts generated manifests", () => {
  const workspace = mkdtempSync(join(tmpdir(), "studio-agent-validate-"));
  const manifestDir = join(workspace, "docs", "hr-copilot");
  const manifestPath = join(manifestDir, "manifest.json");

  mkdirSync(manifestDir, { recursive: true });
  writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        documentationType: "application",
        title: "HR copilot",
        purpose: "Draft interview summaries for recruiter review.",
        ownerRole: "People Lead",
        usageContexts: ["APPLICANTS"],
        decisionInfluence: "PREPARATION",
        dataCategories: ["PERSONAL_DATA"],
        systems: [
          {
            position: 1,
            name: "Claude",
            providerType: "MODEL",
          },
        ],
        steps: ["Recruiter reviews every summary"],
        controls: ["Manual approval is mandatory"],
      },
      null,
      2,
    ),
  );

  const output = runCli(["validate", manifestPath, "--json"], workspace);
  const result = JSON.parse(output);

  assert.equal(result.ok, true);
  assert.equal(result.errors.length, 0);
});
