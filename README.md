# Firebase Studio

This is a NextJS starter in Firebase Studio.

### Architecture & Data Model

**The Data Model and Architecture documentation is the Single Source of Truth for this project.**

*   [**Data Model & Queries**](/docs/DATA_MODEL_AND_QUERIES.md) - Detailed Firestore schema, indexing rules, and query patterns.
*   [**Manual Deployment Steps**](/docs/manual_steps.md) - Required manual actions for Firebase rules and indexes.

Please refer to these documents before making changes to the database structure.

To get started, take a look at src/app/page.tsx.

### Local Development

- `npm run dev` starts the default Turbopack dev server on port `9002`.
- `npm run dev:compat` starts the classic Next.js dev server on port `9002` as a fallback when Turbopack hangs locally.
- `npm run studio:agent -- onboard` stores your local defaults for documentation capture.
- `npm run studio:agent -- capture` creates or updates workflow docs while you are coding.
- `npm run studio:agent -- interview` runs the full guided interview flow.

### Private Working Docs

- Put local-only notes, drafts, and private working documents in [`private-docs/`](./private-docs/).
- Files inside `private-docs/` are intentionally kept out of Git.
- If a private file must temporarily live elsewhere, name it `*.private.*` so it stays local.

### Agent Kit

- The repo ships a standalone toolkit in [`agent-kit/`](/Users/momofeichtinger/Projects/active/studio/agent-kit) and a local skill in [`.codex/skills/studio-use-case-documenter/`](/Users/momofeichtinger/Projects/active/studio/.codex/skills/studio-use-case-documenter).
- Use `onboard` once, then `capture` during implementation so new AI applications, processes, and workflows are documented alongside the code.
- The toolkit is designed to be portable to GitHub, skill marketplaces, and agent systems that support custom slash commands.
