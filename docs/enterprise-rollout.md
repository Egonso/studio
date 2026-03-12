# Enterprise Rollout Surface

## Canonical Enterprise Roles

- `OWNER`: final workspace owner, cannot be removed or downgraded through the standard member API
- `ADMIN`: manages members, enterprise settings, invites, procurement settings, hooks, and sign-off requests
- `REVIEWER`: participates in formal review and approval queues
- `MEMBER`: normal internal collaborator
- `EXTERNAL_OFFICER`: dedicated external/compliance approver for submissions or governance sign-off

## Workspace Boundary

- Canonical enterprise boundary: `workspaces/{orgId}`
- Membership: `workspaces/{orgId}/members/{userId}`
- Legacy user-doc membership fields remain as a compatibility mirror:
  - `users/{uid}.workspaces`
  - `users/{uid}.workspaceOrgIds`
  - `users/{uid}.workspaceRolesByOrg`
- Registers stay stored under the owner path, but enterprise access is resolved through the register `workspaceId` and workspace membership.

## Enterprise APIs

- `GET /api/workspaces/[orgId]/members`
- `PATCH|DELETE /api/workspaces/[orgId]/members/[memberId]`
- `GET|PATCH /api/workspaces/[orgId]/settings`
- `GET /api/workspaces/[orgId]/audit-export`
- `POST /api/workspaces/[orgId]/notifications/dispatch`
- `GET|POST /api/workspaces/[orgId]/governance-signoffs`
- `PATCH /api/workspaces/[orgId]/governance-signoffs/[signOffId]`
- `GET /api/workspaces/[orgId]/external-submissions`
- `PATCH /api/workspaces/[orgId]/external-submissions/[submissionId]`

## Enterprise Product Surface

- Canonical UI route: `/control/enterprise`
- Main sections:
  - members and roles
  - identity provider and SCIM settings
  - approval policy
  - retention settings
  - notification hooks
  - procurement and security references
  - governance sign-off queue
  - external approval queue
  - immutable audit export

## Approval Model

- External submissions can require:
  - no formal approval
  - `REVIEWER`
  - `REVIEWER + EXTERNAL_OFFICER`
  - `ADMIN`
- Governance sign-off can require:
  - no formal sign-off
  - `ADMIN`
  - `EXTERNAL_OFFICER`
- Approval decisions append to the workflow state and keep the original submission/sign-off record intact.

## Notifications

- Supported webhook events:
  - `submission_received`
  - `review_due`
  - `approval_needed`
- Supplier submissions trigger `submission_received` automatically and `approval_needed` when the workspace policy requires formal approval.

## Procurement / Security Surface

- DPA URL
- SCC URL
- Subprocessor directory URL
- Subprocessors list
- Security contact name / email / URL
- Incident reporting URL / email
- Retention summary
- Documentation portal URL
