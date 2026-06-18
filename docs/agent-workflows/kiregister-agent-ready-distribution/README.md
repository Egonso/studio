# KIRegister Agent-Ready Distribution

KIRegister exposes a controlled, read-first product and evidence surface so
external agents can discover, evaluate and prepare procurement without
bypassing human responsibility.

## Metadata

- Type: workflow
- Status: active
- Owner role: KIRegister Product and Studio Engineering
- Contact person: Not documented
- Responsible today: Yes
- Responsible party: Current team
- Usage contexts: EMPLOYEES, CUSTOMERS, PUBLIC
- Decision influence: PREPARATION
- Data categories: PUBLIC_DATA, INTERNAL_CONFIDENTIAL, PERSONAL_DATA
- Generated: 2026-06-18T00:00:00.000Z
- Updated: 2026-06-18T10:00:00.000Z

## Source Note

This workflow was created after the YouTube impulse
`https://www.youtube.com/watch?v=GyijriMIKPA`.

The visible video title on 18.06.2026 was `Sell Your SaaS to AI Agents & Make
SERIOUS Money in 2026 (new economy / beginner friendly)`. A full transcript was
not available in this environment. The resulting plan therefore uses the
verified theme of agent-facing SaaS distribution and improves it for KIRegister
with official MCP, OpenAI Apps SDK, Stripe Agentic Commerce, ACP and A2A
sources.

## Purpose

Make KIRegister understandable and usable for enterprise, procurement, legal
and AI-workflow agents while preserving review-first governance, consent gates
and auditability.

## Product Decision

The useful idea is not to let bots buy compliance software autonomously.

The useful idea is to make KIRegister:

- discoverable by agents
- inspectable through structured product and policy metadata
- demonstrable through read-only evidence artifacts
- useful for procurement and legal agents through draft dossiers
- safe through explicit human approval gates

## Systems

1. Public agent discovery surfaces (API)
2. KIRegister Demo and Procurement Dossier Generator (SERVICE)
3. KIRegister MCP or Apps integration layer (AGENT_INTERFACE)
4. Human approval and governance review gates (CONTROL)
5. KIRegister Audit Export (REGISTER)

## Workflow

- Connection mode: SEMI_AUTOMATED
- Summary: External agents read public product and policy metadata, start
  read-only demos, generate draft procurement dossiers and hand
  approval-required actions to humans.

## Implementation Source

The detailed sprint plan is:

- [`docs/kiregister/agent-ready-distribution-sprints-99-112.md`](../../kiregister/agent-ready-distribution-sprints-99-112.md)

## Implemented v0

- `/api/agent/discovery`
- `/api/agent/openapi.json`
- `/api/agent/demo/session`
- `/api/agent/procurement-dossier`
- `/api/mcp`
- `/api/agent/a2a-card`
- `/api/agent/audit-export`
- `/api/agent/commerce/prepare-checkout-intent`
- `/settings/agent-access`

## Go Runbook

When the user gives the Go:

1. Read `docs/GOVERNANCE_UI_CHARTA.md`.
2. Read the Sprint 99-112 spec.
3. Check `git status --short`.
4. Implement from Sprint 99 onward.
5. Keep public surfaces read-only until policy gates are implemented.
6. Run the relevant tests after each sprint.
7. Validate this manifest.
8. Commit and push to GitHub when the block is complete.

## Human Oversight

- Humans approve paid activation, source connections and any workspace
  creation.
- Humans remain responsible for formal risk classification and legal review.
- Admins control authenticated agent access from organisation settings.
- Product and engineering review all new agent-facing claims before release.

## Controls

- Public endpoints are read-only and return only public product metadata or
  curated demo data.
- AgentActionPolicy classifies critical actions before implementation.
- Human approval is required for checkout, source connection, submission and
  formal governance decisions.
- UI work must follow `docs/GOVERNANCE_UI_CHARTA.md`.
- Dossier and demo activity is recorded for audit export without secrets.

## Machine Files

- `manifest.json` is the canonical machine-readable source.
- `README.md` is the human-readable summary for reviewers and agents.
