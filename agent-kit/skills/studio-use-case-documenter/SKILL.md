---
name: studio-use-case-documenter
description: Use when a task requires documenting a new AI application, process, or workflow for KI-Register, especially when an agent should onboard once, capture documentation alongside coding work, interview stakeholders, or generate structured Markdown and JSON docs with confirmation before writing.
---

# Studio Use Case Documenter

Use this skill when a new AI application, process, or workflow should be documented as part of the work itself, not as an afterthought.

## Primary outputs

- `docs/agent-workflows/<slug>/manifest.json`
- `docs/agent-workflows/<slug>/README.md`

These files are designed to stay portable across Codex, Claude Code, OpenClaw, Antigravity, and similar agent systems.

## Preferred workflow

1. Run `studio-agent onboard` once per workspace to store your profile, owner-role defaults, output path, and confirmation preference.
2. During coding or other agent work, run `studio-agent capture` to create documentation with the saved defaults.
3. If the context is incomplete or needs stakeholder input, switch to `studio-agent interview`.
4. Validate every generated or edited manifest with `studio-agent validate <manifest>`.

## Behavior expectations

- `capture` should be the low-friction path for documentation during delivery work.
- The CLI should still ask for final confirmation before writing unless explicitly bypassed.
- If required details are missing, the CLI should ask only for the missing fields instead of re-running a full interview.
- Prefer updating an existing workflow folder instead of creating duplicates for the same use case.

## Interview coverage

Capture at least:

- documentation type: `application`, `process`, or `workflow`
- title, purpose, and owner role
- systems in execution order
- usage contexts and data categories
- decision influence
- trigger events and process steps
- human checkpoints, risks, controls, and artifacts

## Portability

- The CLI is plain Node and does not require framework-specific runtimes.
- The canonical machine format is `manifest.json`.
- If an agent system has no skill loader, hand it this `SKILL.md` plus the schema and sample manifest from the agent kit.
- Agents that support custom slash commands can map a shortcut to `studio-agent capture`.
