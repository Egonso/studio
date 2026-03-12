import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const rules = readFileSync(
  resolve(process.cwd(), "firestore.rules"),
  "utf8"
);

test("firestore rules no longer allow placeholder org access", () => {
  assert.match(rules, /function hasWorkspaceMembership\(orgId\)/);
  assert.match(rules, /workspaceOrgIds is list/);
  assert.match(rules, /function hasWorkspaceMemberDoc\(orgId\)/);
  assert.match(rules, /function isWorkspaceOwner\(orgId\)/);
  assert.doesNotMatch(
    rules,
    /function canAccessOrg\(orgId\)\s*\{\s*return isSignedIn\(\);/
  );
});

test("firestore rules expose workspace collections through real membership checks", () => {
  assert.match(rules, /match \/workspaces\/\{orgId\} \{/);
  assert.match(rules, /match \/members\/\{memberId\} \{/);
  assert.match(rules, /match \/governanceSignOffs\/\{signOffId\} \{/);
  assert.match(rules, /allow create, update, delete: if canManageOrg\(orgId\);/);
});

test("firestore rules protect public and shared write surfaces with ownership checks", () => {
  assert.match(rules, /function canWriteSharedPolicy\(data\)/);
  assert.match(rules, /function hasSharedPolicyScope\(nextData, currentData\)/);
  assert.match(rules, /ownsLegacyProject\(data\.projectId\)/);
  assert.match(rules, /function canWritePublicTrustPortal\(docId, data\)/);
  assert.match(rules, /data\.projectId == docId/);
  assert.match(rules, /ownsLegacyProject\(docId\) \|\|[\s\S]*ownsRegister\(docId\)/);
  assert.match(
    rules,
    /allow update: if canWritePublicTrustPortal\(projectId, request\.resource\.data\)/
  );
});

test("firestore rules block client entitlement escalation and legacy global project access", () => {
  assert.match(rules, /hasOnlyFreeEntitlement\(request\.resource\.data\)/);
  assert.match(rules, /affectedKeys\(\)\s*\.hasAny\(\['plan', 'entitlement'\]\)/);
  assert.match(rules, /function canReadRegister\(userId, data\)/);
  assert.match(rules, /function canReviewRegisterContents\(userId, registerId\)/);
  assert.match(rules, /match \/projects\/\{projectId\} \{[\s\S]*allow read, write: if false;/);
});

test("firestore rules resolve org access through parent aiSystems", () => {
  assert.match(rules, /function hasAiSystemOrgAccess\(systemId\)/);
  assert.match(rules, /exists\(\/databases\/\$\(database\)\/documents\/aiSystems\/\$\(systemId\)\)/);
});
