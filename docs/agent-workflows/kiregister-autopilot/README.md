# KIRegister Autopilot

A local or workspace-bound agent prepares KI-Register drafts from approved
sources and asks humans only for unresolved governance decisions.

## Metadata

- Type: workflow
- Status: draft
- Owner role: KIRegister Product and Studio Engineering
- Contact person: Not documented
- Responsible today: Yes
- Responsible party: Current team
- Usage contexts: EMPLOYEES
- Decision influence: PREPARATION
- Data categories: INTERNAL_CONFIDENTIAL, PERSONAL_DATA
- Generated: 2026-06-17T00:00:00.000Z

## Purpose

Reduce manual register maintenance by detecting AI-use evidence, drafting
use-case records, and escalating only unclear or responsibility-bearing
questions.

## Systems

1. Approved local or workspace sources (SOURCE)
2. studio-agent Autopilot Runner (AGENT)
3. KIRegister Agent Kit Submit API (API)
4. KIRegister (REGISTER)

## Workflow

- Connection mode: SEMI_AUTOMATED
- Summary: The agent reads approved sources, writes local candidates and
  evidence, asks review questions when required, and submits only confirmed
  manifests.

## Human Oversight

- Humans answer blockierende Review-Fragen zu Owner, Datenkategorien,
  Entscheidungseinfluss und Risiko.
- Humans confirm every submission unless the future policy explicitly allows a
  narrower trusted path.
- Formal governance decisions stay outside automated finalization.

## Controls

- Source allowlist is explicit in the Autopilot policy.
- Default mode writes local drafts only.
- Human review triggers block submission for unclear responsibility-bearing
  fields.
- Every candidate keeps an evidence summary.
- No scheduler is installed implicitly.

## Machine Files

- `manifest.json` is the canonical machine-readable source.
- `README.md` is the human-readable summary for reviewers and agents.
