import assert from "node:assert/strict";
import test from "node:test";
import { POST as exportAimsDocument } from "./aims/export-document/route";
import { POST as submitAgentKit } from "./agent-kit/submit/route";
import { POST as startBillingCheckout } from "./billing/checkout/route";
import { POST as openBillingPortal } from "./billing/portal/route";
import { POST as checkToolCompliance } from "./check-tool-compliance/route";
import { GET as getCoverageAssistConfig } from "./coverage-assist/config/route";
import { POST as draftAssessment } from "./draft-assessment/route";
import { POST as createInvite } from "./invites/route";
import { POST as acceptInvite } from "./invites/accept/route";
import { POST as checkPublicInfo } from "./tools/public-info-check/route";

function createJsonRequest(path: string, body: unknown, headers?: HeadersInit): Request {
  return new Request(`https://kiregister.test${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

async function expectUnauthorized(
  handler: (request: Request) => Promise<Response>,
  request: Request,
): Promise<void> {
  const response = await handler(request);
  assert.equal(response.status, 401);
  await response.text();
}

test("protected API routes reject unauthenticated requests with real request objects", async () => {
  await expectUnauthorized(
    checkToolCompliance,
    createJsonRequest("/api/check-tool-compliance", { toolName: "ChatGPT" }),
  );
  await expectUnauthorized(
    (request) => checkPublicInfo(request as never),
    createJsonRequest("/api/tools/public-info-check", { toolName: "ChatGPT" }),
  );
  await expectUnauthorized(
    draftAssessment,
    createJsonRequest("/api/draft-assessment", { purpose: "Support-Automatisierung" }),
  );
  await expectUnauthorized(
    (request) => exportAimsDocument(request as never),
    createJsonRequest("/api/aims/export-document", {
      format: "pdf",
      exportData: {
        projectName: "Demo",
        aimsProgress: {},
        generatedAt: "2026-05-03T12:00:00.000Z",
      },
    }),
  );
  await expectUnauthorized(
    (request) => startBillingCheckout(request as never),
    createJsonRequest("/api/billing/checkout", { targetPlan: "pro" }),
  );
  await expectUnauthorized(
    (request) => openBillingPortal(request as never),
    createJsonRequest("/api/billing/portal", {}),
  );
  await expectUnauthorized(
    (request) => createInvite(request as never),
    createJsonRequest("/api/invites", {
      email: "user@example.com",
      role: "ADMIN",
      targetOrgId: "org_123",
      targetOrgName: "Acme GmbH",
    }),
  );
  await expectUnauthorized(
    (request) => acceptInvite(request as never),
    createJsonRequest("/api/invites/accept", {
      userId: "user_123",
      email: "user@example.com",
    }),
  );
});

test("agent kit submit requires an API key instead of succeeding anonymously", async () => {
  const response = await submitAgentKit(
    createJsonRequest("/api/agent-kit/submit", {
      registerId: "reg_123",
      manifest: {},
    }) as never,
  );

  assert.equal(response.status, 401);
  assert.match(await response.text(), /Agent-Kit-API-Key/);
});

test("coverage assist config stays publicly readable", async () => {
  const response = await getCoverageAssistConfig();
  assert.equal(response.status, 200);
});
