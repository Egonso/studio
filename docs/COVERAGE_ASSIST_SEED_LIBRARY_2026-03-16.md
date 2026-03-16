# Coverage Assist Seed Library v0.1

## Purpose

The Coverage Assist seed library is a Phase-1 starter catalog for assisted capture prompts.

It is intentionally:

- hand-curated
- neutral in tone
- limited to common day-to-day purposes
- non-authoritative from a legal or governance perspective

It is explicitly **not** a legally reliable use-case library and must not be treated as governance truth.

## Contract

Each seed suggestion stores only lightweight assistive fields:

- `suggestionId`
- `toolId`
- `label`
- `purposeDraft`
- optional `descriptionHint`
- optional `likelyContexts`
- `libraryVersion = "seed_v0_1"`

The contract does **not** preload:

- risk classifications
- legal statements
- data categories
- compliance outcomes

## Selection Rule

Version `seed_v0_1` covers 20 start tools with exactly 4 suggestions per tool.

The aim is not completeness. The aim is a better next question once a tool has already been detected or selected.

## Rollback

If the seed library creates noise, rollback is simple:

1. stop using the helper in the assist step
2. keep the file out of the active flow
3. fall back to tool-only prefill until the library is improved
