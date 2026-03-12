import assert from "node:assert/strict";
import test from "node:test";

import {
  assertAuthenticatedIdentity,
  buildWorkspaceAccessState,
  hasWorkspaceAccess,
  hasWorkspaceRole,
  materializeWorkspaceAccessWriteModel,
  removeWorkspaceMembership,
  upsertWorkspaceMembership,
} from "./server-access";

test("buildWorkspaceAccessState resolves owner and denormalized workspace memberships", () => {
  const state = buildWorkspaceAccessState("owner_1", {
    workspaceOrgIds: ["org_alpha", "org_beta"],
    workspaceRolesByOrg: {
      org_alpha: "ADMIN",
      org_beta: "MEMBER",
    },
  });

  assert.equal(hasWorkspaceAccess(state, "owner_1"), true);
  assert.equal(hasWorkspaceRole(state, "owner_1", ["OWNER"]), true);
  assert.equal(hasWorkspaceAccess(state, "org_alpha"), true);
  assert.equal(hasWorkspaceRole(state, "org_alpha", ["ADMIN"]), true);
  assert.equal(hasWorkspaceRole(state, "org_beta", ["ADMIN"]), false);
});

test("upsertWorkspaceMembership keeps rules-friendly membership fields in sync", () => {
  const updated = upsertWorkspaceMembership(
    {
      workspaces: [
        {
          orgId: "org_alpha",
          orgName: "Alpha GmbH",
          role: "MEMBER",
        },
      ],
    },
    {
      orgId: "org_beta",
      orgName: "Beta GmbH",
      role: "EXTERNAL_OFFICER",
    }
  );

  assert.deepEqual(updated.workspaceOrgIds, ["org_alpha", "org_beta"]);
  assert.deepEqual(updated.workspaceRolesByOrg, {
    org_alpha: "MEMBER",
    org_beta: "EXTERNAL_OFFICER",
  });
  assert.equal(updated.workspaces[1]?.orgName, "Beta GmbH");
});

test("assertAuthenticatedIdentity rejects mismatched request payloads for invite acceptance", () => {
  assert.doesNotThrow(() =>
    assertAuthenticatedIdentity(
      { uid: "user_1", email: "user@example.com" },
      { userId: "user_1", email: "USER@example.com" }
    )
  );

  assert.throws(
    () =>
      assertAuthenticatedIdentity(
        { uid: "user_1", email: "user@example.com" },
        { userId: "user_2", email: "user@example.com" }
      ),
    /Authenticated user does not match request user/
  );

  assert.throws(
    () =>
      assertAuthenticatedIdentity(
        { uid: "user_1", email: "user@example.com" },
        { userId: "user_1", email: "other@example.com" }
      ),
    /Authenticated email does not match request email/
  );
});

test("materializeWorkspaceAccessWriteModel backfills denormalized membership fields", () => {
  const materialized = materializeWorkspaceAccessWriteModel("owner_1", {
    workspaces: [
      {
        orgId: "org_alpha",
        orgName: "Alpha GmbH",
        role: "ADMIN",
      },
    ],
  });

  assert.deepEqual(materialized.workspaceOrgIds, ["org_alpha"]);
  assert.deepEqual(materialized.workspaceRolesByOrg, { org_alpha: "ADMIN" });
  assert.equal(materialized.workspaces[0]?.orgName, "Alpha GmbH");
});

test("removeWorkspaceMembership keeps denormalized membership fields aligned", () => {
  const updated = removeWorkspaceMembership(
    {
      workspaces: [
        { orgId: "org_alpha", orgName: "Alpha GmbH", role: "ADMIN" },
        { orgId: "org_beta", orgName: "Beta GmbH", role: "REVIEWER" },
      ],
    },
    "org_alpha",
  );

  assert.deepEqual(updated.workspaceOrgIds, ["org_beta"]);
  assert.deepEqual(updated.workspaceRolesByOrg, { org_beta: "REVIEWER" });
  assert.equal(updated.workspaces[0]?.orgName, "Beta GmbH");
});
