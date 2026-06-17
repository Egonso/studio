#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFile, execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";

const ROOT_DIR = process.cwd();
const CLI_PATH = path.join(ROOT_DIR, "bin", "studio-agent.mjs");

function runCli(args, cwd = ROOT_DIR, env = {}) {
  return execFileSync("node", [CLI_PATH, ...args], {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      ...env,
    },
  });
}

function runCliAsync(args, cwd = ROOT_DIR, env = {}) {
  return new Promise((resolve, reject) => {
    execFile(
      "node",
      [CLI_PATH, ...args],
      {
        cwd,
        encoding: "utf8",
        env: {
          ...process.env,
          ...env,
        },
      },
      (error, stdout, stderr) => {
        if (error) {
          error.message = `${error.message}\n${stderr}`;
          reject(error);
          return;
        }

        resolve(stdout);
      },
    );
  });
}

function startMockOperatorServer() {
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const authHeader = request.headers.authorization ?? "";

    response.setHeader("content-type", "application/json");

    if (!String(authHeader).startsWith("Bearer akv1.")) {
      response.statusCode = 401;
      response.end(JSON.stringify({ error: "missing api key" }));
      return;
    }

    if (url.pathname === "/api/agent/operator/registers") {
      response.end(
        JSON.stringify({
          mode: "read_only",
          registers: [
            {
              registerId: "reg_smoke",
              name: "Smoke Register",
              organisationName: "Smoke GmbH",
              workspaceId: "ws_smoke",
              createdAt: "2026-06-17T10:00:00.000Z",
              ownerId: "user_smoke",
              scopeType: "workspace",
            },
          ],
        }),
      );
      return;
    }

    if (url.pathname === "/api/agent/operator/use-cases") {
      assert.equal(url.searchParams.get("registerId"), "reg_smoke");
      assert.equal(url.searchParams.get("status"), "UNREVIEWED");
      assert.equal(url.searchParams.get("searchText"), "smoke");
      assert.equal(url.searchParams.get("limit"), "1");
      response.end(
        JSON.stringify({
          mode: "read_only",
          register: {
            registerId: "reg_smoke",
            name: "Smoke Register",
          },
          count: 1,
          useCases: [
            {
              useCaseId: "uc_smoke",
              purpose: "Draft smoke summaries for review.",
              status: "UNREVIEWED",
              systemSummary: "OpenAI",
            },
          ],
        }),
      );
      return;
    }

    if (url.pathname === "/api/agent/operator/use-cases/uc_smoke") {
      assert.equal(url.searchParams.get("registerId"), "reg_smoke");
      response.end(
        JSON.stringify({
          mode: "read_only",
          useCase: {
            useCaseId: "uc_smoke",
            purpose: "Draft smoke summaries for review.",
            status: "UNREVIEWED",
            systemSummary: "OpenAI",
          },
        }),
      );
      return;
    }

    if (url.pathname === "/api/agent/operator/candidates") {
      if (request.method === "POST") {
        let rawBody = "";
        request.on("data", (chunk) => {
          rawBody += chunk;
        });
        request.on("end", () => {
          const payload = JSON.parse(rawBody);
          assert.equal(payload.registerId, "reg_smoke");
          assert.equal(payload.manifest.title, "Support knowledge assistant");
          response.statusCode = 201;
          response.end(
            JSON.stringify({
              mode: "candidate_review",
              candidate: {
                candidateId: "cand_smoke",
                registerId: "reg_smoke",
                title: payload.manifest.title,
                purpose: payload.manifest.purpose,
                status: "needs_review",
                systemSummary: "Zendesk +1",
              },
            }),
          );
        });
        return;
      }

      assert.equal(url.searchParams.get("registerId"), "reg_smoke");
      assert.equal(url.searchParams.get("status"), "needs_review");
      assert.equal(url.searchParams.get("limit"), "1");
      response.end(
        JSON.stringify({
          mode: "candidate_review",
          count: 1,
          candidates: [
            {
              candidateId: "cand_smoke",
              registerId: "reg_smoke",
              title: "Support knowledge assistant",
              purpose: "Draft support summaries for review.",
              status: "needs_review",
              systemSummary: "Zendesk +1",
            },
          ],
        }),
      );
      return;
    }

    if (url.pathname === "/api/agent/operator/candidates/cand_smoke") {
      assert.equal(url.searchParams.get("registerId"), "reg_smoke");
      response.end(
        JSON.stringify({
          mode: "candidate_review",
          candidate: {
            candidateId: "cand_smoke",
            registerId: "reg_smoke",
            title: "Support knowledge assistant",
            purpose: "Draft support summaries for review.",
            status: "needs_review",
            systemSummary: "Zendesk +1",
          },
        }),
      );
      return;
    }

    response.statusCode = 404;
    response.end(JSON.stringify({ error: "not found" }));
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      assert.ok(address && typeof address === "object");
      resolve({
        server,
        operatorEndpoint: `http://127.0.0.1:${address.port}/api/agent/operator`,
      });
    });
  });
}

async function main() {
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

  const operatorServer = await startMockOperatorServer();
  try {
    const operatorEnv = {
      KI_REGISTER_API_KEY: "akv1.ws_smoke.key_smoke.secret_smoke",
      KI_REGISTER_OPERATOR_ENDPOINT: operatorServer.operatorEndpoint,
      KI_REGISTER_REGISTER_ID: "reg_smoke",
    };

    const operatorRegisters = JSON.parse(
      await runCliAsync(["operator", "registers", "--json"], workspace, operatorEnv),
    );
    assert.equal(operatorRegisters.ok, true);
    assert.equal(operatorRegisters.registers[0].registerId, "reg_smoke");

    const operatorUseCases = JSON.parse(
      await runCliAsync(
        [
          "operator",
          "use-cases",
          "--status",
          "UNREVIEWED",
          "--search-text",
          "smoke",
          "--limit",
          "1",
          "--json",
        ],
        workspace,
        operatorEnv,
      ),
    );
    assert.equal(operatorUseCases.ok, true);
    assert.equal(operatorUseCases.useCases[0].useCaseId, "uc_smoke");

    const operatorUseCase = JSON.parse(
      await runCliAsync(
        ["operator", "use-case", "uc_smoke", "--json"],
        workspace,
        operatorEnv,
      ),
    );
    assert.equal(operatorUseCase.ok, true);
    assert.equal(operatorUseCase.useCase.useCaseId, "uc_smoke");

    const operatorCandidates = JSON.parse(
      await runCliAsync(
        [
          "operator",
          "candidates",
          "--status",
          "needs_review",
          "--limit",
          "1",
          "--json",
        ],
        workspace,
        operatorEnv,
      ),
    );
    assert.equal(operatorCandidates.ok, true);
    assert.equal(operatorCandidates.candidates[0].candidateId, "cand_smoke");

    const operatorCandidate = JSON.parse(
      await runCliAsync(
        ["operator", "candidate", "cand_smoke", "--json"],
        workspace,
        operatorEnv,
      ),
    );
    assert.equal(operatorCandidate.ok, true);
    assert.equal(operatorCandidate.candidate.candidateId, "cand_smoke");

    const submittedCandidate = JSON.parse(
      await runCliAsync(
        [
          "operator",
          "candidate",
          "submit",
          createResult.files.manifestPath,
          "--confidence",
          "0.75",
          "--blocked-by",
          "personal-or-sensitive-data",
          "--json",
        ],
        workspace,
        operatorEnv,
      ),
    );
    assert.equal(submittedCandidate.ok, true);
    assert.equal(submittedCandidate.candidate.candidateId, "cand_smoke");
  } finally {
    operatorServer.server.close();
  }

  process.stdout.write("agent-kit smoke test passed\n");
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
