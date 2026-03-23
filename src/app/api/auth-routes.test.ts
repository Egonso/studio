import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function readSource(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const inviteRoute = readSource("src/app/api/invites/route.ts");
const inviteAcceptRoute = readSource("src/app/api/invites/accept/route.ts");
const authAttemptRoute = readSource("src/app/api/auth/attempts/route.ts");
const publicInfoCheckRoute = readSource("src/app/api/tools/public-info-check/route.ts");
const draftAssessmentRoute = readSource("src/app/api/draft-assessment/route.ts");
const complianceCheckRoute = readSource("src/app/api/check-tool-compliance/route.ts");
const entitlementSyncRoute = readSource("src/app/api/entitlements/sync/route.ts");
const billingCheckoutRoute = readSource("src/app/api/billing/checkout/route.ts");
const billingPortalRoute = readSource("src/app/api/billing/portal/route.ts");
const stripeSessionRoute = readSource("src/app/api/stripe-session/route.ts");
const aimsExportRoute = readSource("src/app/api/aims/export-document/route.ts");
const captureByCodeRoute = readSource("src/app/api/capture-by-code/route.ts");
const supplierSubmitRoute = readSource("src/app/api/supplier-submit/route.ts");
const certificationBadgeRoute = readSource("src/app/api/certification/badge/route.ts");
const certificationPublicRoute = readSource("src/app/api/certification/public/[code]/route.ts");
const registerExternalSubmissionsRoute = readSource(
  "src/app/api/registers/[registerId]/external-submissions/route.ts",
);
const registerExternalSubmissionItemRoute = readSource(
  "src/app/api/registers/[registerId]/external-submissions/[submissionId]/route.ts",
);
const workspaceMembersRoute = readSource("src/app/api/workspaces/[orgId]/members/route.ts");
const workspaceMemberItemRoute = readSource("src/app/api/workspaces/[orgId]/members/[memberId]/route.ts");
const workspaceListRoute = readSource("src/app/api/workspaces/route.ts");
const workspaceSettingsRoute = readSource("src/app/api/workspaces/[orgId]/settings/route.ts");
const workspaceRegistersRoute = readSource("src/app/api/workspaces/[orgId]/registers/route.ts");
const workspaceAuditExportRoute = readSource("src/app/api/workspaces/[orgId]/audit-export/route.ts");
const workspaceNotificationsRoute = readSource("src/app/api/workspaces/[orgId]/notifications/dispatch/route.ts");
const workspaceSignOffsRoute = readSource("src/app/api/workspaces/[orgId]/governance-signoffs/route.ts");
const workspaceSignOffItemRoute = readSource("src/app/api/workspaces/[orgId]/governance-signoffs/[signOffId]/route.ts");
const workspaceExternalSubmissionsRoute = readSource("src/app/api/workspaces/[orgId]/external-submissions/route.ts");
const workspaceExternalSubmissionItemRoute = readSource("src/app/api/workspaces/[orgId]/external-submissions/[submissionId]/route.ts");
const workspaceRegisterLinkRoute = readSource("src/app/api/workspaces/[orgId]/registers/link/route.ts");
const workspaceAgentKitKeysRoute = readSource("src/app/api/workspaces/[orgId]/agent-kit/keys/route.ts");
const workspaceAgentKitKeyItemRoute = readSource("src/app/api/workspaces/[orgId]/agent-kit/keys/[keyId]/route.ts");
const agentKitSubmitRoute = readSource("src/app/api/agent-kit/submit/route.ts");
const coverageAssistConfigRoute = readSource("src/app/api/coverage-assist/config/route.ts");

test("invite creation route requires workspace-admin authorization", () => {
  assert.match(inviteRoute, /requireWorkspaceAdmin\(/);
  assert.match(inviteRoute, /const authorizationHeader = req\.headers\.get\("authorization"\);/);
});

test("invite acceptance route requires auth and identity match", () => {
  assert.match(inviteAcceptRoute, /requireUser\(request\.headers\.get\("authorization"\)\)/);
  assert.match(inviteAcceptRoute, /assertAuthenticatedIdentity\(actor, \{/);
  assert.match(inviteAcceptRoute, /error instanceof AuthenticatedIdentityError/);
});

test("internal compliance helper routes require authenticated users", () => {
  assert.match(publicInfoCheckRoute, /await requireUser\(req\.headers\.get\("authorization"\)\);/);
  assert.match(draftAssessmentRoute, /await requireUser\(req\.headers\.get\("authorization"\)\);/);
  assert.match(complianceCheckRoute, /await requireUser\(req\.headers\.get\("authorization"\)\);/);
  assert.match(entitlementSyncRoute, /await requireUser\(request\.headers\.get\('authorization'\)\)/);
  assert.match(billingCheckoutRoute, /await requireUser\(request\.headers\.get\('authorization'\)\)/);
  assert.match(billingPortalRoute, /await requireUser\(request\.headers\.get\('authorization'\)\)/);
  assert.match(aimsExportRoute, /await requireUser\(request\.headers\.get\('authorization'\)\)/);
});

test("draft assessment route stays a reasoning aid instead of a final governance decision", () => {
  assert.match(draftAssessmentRoute, /selectedRiskClass/);
  assert.match(draftAssessmentRoute, /suggestedRiskClass/);
  assert.match(draftAssessmentRoute, /reasons/);
  assert.match(draftAssessmentRoute, /openQuestions/);
  assert.match(
    draftAssessmentRoute,
    /Triff keine finale rechtliche oder governance-seitige Entscheidung/,
  );
});

test("checkout return route validates session ids and only exposes completed sessions", () => {
  assert.match(stripeSessionRoute, /isValidStripeCheckoutSessionId/);
  assert.match(stripeSessionRoute, /getCheckoutEligibility\(/);
  assert.match(stripeSessionRoute, /getCheckoutEligibilityErrorMessage\(eligibility\.reason\)/);
});

test("public intake routes rely on centralized server-side rate limiting", () => {
  assert.match(authAttemptRoute, /enforceRequestRateLimit\(/);
  assert.match(captureByCodeRoute, /checkPublicRateLimit\(/);
  assert.match(supplierSubmitRoute, /checkPublicRateLimit\(/);
  assert.match(stripeSessionRoute, /enforceRequestRateLimit\(/);
  assert.match(certificationBadgeRoute, /enforceRequestRateLimit\(/);
  assert.match(certificationPublicRoute, /enforceRequestRateLimit\(/);
});

test("register-owned external submission routes require server-side register ownership", () => {
  assert.match(registerExternalSubmissionsRoute, /requireRegisterOwner\(/);
  assert.match(registerExternalSubmissionItemRoute, /requireRegisterOwner\(/);
});

test("workspace enterprise routes enforce member, admin, and reviewer auth on the server", () => {
  assert.match(workspaceListRoute, /requireUser\(/);
  assert.match(workspaceMembersRoute, /requireWorkspaceMember\(/);
  assert.match(workspaceMemberItemRoute, /requireWorkspaceAdmin\(/);
  assert.match(workspaceSettingsRoute, /requireWorkspaceMember\(/);
  assert.match(workspaceRegistersRoute, /requireWorkspaceMember\(/);
  assert.match(workspaceSettingsRoute, /requireWorkspaceAdmin\(/);
  assert.match(workspaceAuditExportRoute, /requireWorkspaceReviewer\(/);
  assert.match(workspaceNotificationsRoute, /requireWorkspaceAdmin\(/);
  assert.match(workspaceSignOffsRoute, /requireWorkspaceMember\(/);
  assert.match(workspaceSignOffsRoute, /requireWorkspaceAdmin\(/);
  assert.match(workspaceSignOffItemRoute, /requireWorkspaceReviewer\(/);
  assert.match(workspaceExternalSubmissionsRoute, /requireWorkspaceMember\(/);
  assert.match(workspaceExternalSubmissionItemRoute, /requireWorkspaceReviewer\(/);
  assert.match(workspaceRegisterLinkRoute, /requireWorkspaceAdmin\(/);
  assert.match(workspaceAgentKitKeysRoute, /requireUser\(/);
  assert.match(workspaceAgentKitKeysRoute, /requireWorkspaceMember\(/);
  assert.match(workspaceAgentKitKeyItemRoute, /requireUser\(/);
  assert.match(workspaceAgentKitKeyItemRoute, /requireWorkspaceMember\(/);
});

test("billing and workspace register routes use scope-aware register lookup hints", () => {
  assert.match(
    billingCheckoutRoute,
    /findRegisterLocationById\(registerId, \{[\s\S]*ownerId: input\.actorUserId,/,
  );
  assert.match(
    workspaceRegisterLinkRoute,
    /findRegisterLocationById\(payload\.registerId, \{[\s\S]*ownerId: authorization\.user\.uid,[\s\S]*workspaceId: orgId,/,
  );
});

test("coverage assist config route exposes only public rollout flags", () => {
  assert.match(coverageAssistConfigRoute, /getPublicCoverageAssistConfig\(/);
  assert.doesNotMatch(coverageAssistConfigRoute, /requireUser\(/);
  assert.doesNotMatch(coverageAssistConfigRoute, /authorization/);
});

test("agent kit submit route authenticates with API keys and scopes register lookup to the workspace", () => {
  assert.match(agentKitSubmitRoute, /authenticateAgentKitApiKey\(/);
  assert.match(agentKitSubmitRoute, /isPersonalAgentKitScope\(/);
  assert.match(agentKitSubmitRoute, /findRegisterLocationById\(payload\.registerId, \{/);
  assert.match(agentKitSubmitRoute, /workspaceId: personalScope \? undefined : authentication\.record\.orgId/);
  assert.match(agentKitSubmitRoute, /sanitizeFirestorePayload\(useCase\)/);
});
