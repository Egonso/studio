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

Before using the workflow, verify that this clone is the active repo and that the agent command actually exists here:

```bash
pwd
test -f package.json
rg -n '"studio:agent"' package.json
test -f agent-kit/bin/studio-agent.mjs
test -f docs/DATA_MODEL_AND_QUERIES.md
```

If one of those checks fails, stop and find the real repo root before you run `onboard`, `capture`, or `validate`. Do not write workflow docs into the wrong studio clone just because the folder names look similar.

1. From the KI-Register studio repo root, prefer `npm run studio:agent -- onboard`.
2. During coding or other agent work, run `npm run studio:agent -- capture` to create documentation with the saved defaults.
3. If the context is incomplete or needs stakeholder input, switch to `npm run studio:agent -- interview`.
4. Validate every generated or edited manifest with `npm run studio:agent -- validate <manifest>`.
5. Only fall back to `node ./agent-kit/bin/studio-agent.mjs ...` when `npm run studio:agent -- ...` is unavailable in the current repo.

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

## Repo rules

- Verify first that you are in the repo you are actually changing. In mixed workspaces with both `studio` and `studio-main-sync`, do not assume one fixed path; confirm the active root by checking `package.json` for `studio:agent` and the presence of `agent-kit/bin/studio-agent.mjs`.
- If both the script and the fallback binary exist in more than one nearby clone, also confirm the intended Git root or branch before writing docs. Similar file trees are not enough evidence.
- Before Firestore or schema changes, read `docs/DATA_MODEL_AND_QUERIES.md`.
- If the change affects rules, indexes, or deployment steps, also read `docs/manual_steps.md`.
- If routing is unclear, shortlist nearby docs with `docs/route-map.md` and the relevant sprint note before touching app surfaces.

## Portability

- The CLI is plain Node and does not require framework-specific runtimes.
- The canonical machine format is `manifest.json`.
- If an agent system has no skill loader, hand it this `SKILL.md` plus the schema and sample manifest from the agent kit.
- Agents that support custom slash commands can map a shortcut to `studio-agent capture`.
- Outside the KI-Register studio repo, omit the repo-specific rules above and rely on the agent kit schema plus sample manifest.
