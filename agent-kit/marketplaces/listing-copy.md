# Listing Copy

## Name

KI-Register EU AI Act Use Case Documenter

## Short description

Skill and CLI pack for documenting AI use cases, interviewing stakeholders, validating manifests and submitting confirmed records to KI-Register.

## Long description

KI-Register Agent Kit helps teams document AI applications, processes, and workflows while the work is happening. It combines a lightweight Node CLI with the portable `ki-register-use-case-documenter` skill so Codex, Claude Code, OpenClaw, and similar agent systems can create consistent workflow folders with human-readable `README.md` files and machine-readable `manifest.json` records.

The skill supports two practical paths:

- inspect a codebase or workflow folder and draft the use case from evidence-backed facts
- interview the user one question at a time when owner, purpose, data, risks, controls, or human checkpoints are missing

The package is built for reviewability:

- onboard once with your role and defaults
- capture documentation during coding or agent work
- inspect the codebase or ask only for missing required fields
- require final confirmation before each write by default
- validate outputs against a stable manifest contract
- submit confirmed manifests to `https://kiregister.com/api/agent-kit/submit` with a scoped Agent Kit API key

This makes it easier to maintain intended-purpose records, human oversight checkpoints, risk notes, controls, and evidence references in a form that can support internal governance and AI Act-oriented documentation programs.

If the user does not have a KI-Register account or API key yet, the skill guides them to `https://kiregister.com/developers/agent-kit` or `https://kiregister.com/settings/agent-kit` to create an account, choose a target register, create a scoped API key, and copy the ready-to-use submit command.

## Suggested tags

- ai-governance
- eu-ai-act
- compliance
- documentation
- codex
- claude-code
- openclaw
- workflow
- use-case-documentation
- api
- register
- risk-management
- audit
- procurement

## Source and install URLs

- Repository: `https://github.com/Egonso/ki-register-agent-kit`
- Skill entrypoint: `skills/ki-register-use-case-documenter/SKILL.md`
- Developer docs: `https://kiregister.com/developers/agent-kit`
- API endpoint: `https://kiregister.com/api/agent-kit/submit`

## Suggested screenshots or visuals

1. README hero graphic
2. Lifecycle diagram
3. Example generated workflow folder
4. Example `manifest.json` snippet

## Suggested install note

Clone `https://github.com/Egonso/ki-register-agent-kit`, run `studio-agent onboard` once, then use `studio-agent capture` or the `ki-register-use-case-documenter` skill during implementation work. Configure `KI_REGISTER_API_KEY` and `KI_REGISTER_REGISTER_ID` only when direct submission to KI-Register is needed.
