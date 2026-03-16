# Coverage Assist Phase 1 Pilot Rollout (2026-03-16)

## Purpose

This document is the rollout runbook for Coverage Assist Phase 1.
It is intentionally conservative. The feature should prove that it reduces capture friction
without creating a monitoring feeling.

This is **not** a broad launch plan.
It is a pilot plan with explicit stop conditions.

## Release boundary

Phase 1 includes only:

- local host match in the Chrome extension
- quiet icon signal
- app-side assist step on `/capture`
- four seed suggestions where available
- custom purpose and tool-only fallback
- additive `assistContext`
- lightweight local analytics

Phase 1 does **not** include:

- server-side suggestion inbox
- organisation-wide discovery
- background use case creation
- prompt analysis
- browsing-history storage

## Rollout gate

Coverage Assist must remain off by default until pilot validation is complete.

Relevant flags:

- `NEXT_PUBLIC_COVERAGE_ASSIST_PHASE1`
- `NEXT_PUBLIC_COVERAGE_ASSIST_EXTENSION`
- `NEXT_PUBLIC_COVERAGE_ASSIST_SEED_LIBRARY`

Pilot activation requires all three flags.

## Verification plan

### Required technical checks

1. Known host -> assist visible
   Example: `chat.openai.com` with Coverage Assist enabled.
   Expected: quiet signal in extension, deeplink into `/capture`, assist entry shown.

2. Unknown host -> no assist
   Example: `example.com`.
   Expected: no quiet signal, no assist entry, standard Quick Capture only.

3. Assist disabled -> no signal
   Expected: no quiet signal, no assist entry, extension behaves as plain Quick Capture launcher.

4. Tool with seed library -> four suggestions
   Example: `ChatGPT (OpenAI)`.
   Expected: exactly four seed suggestions shown in app entry.

5. Tool without seed library -> tool-only fallback
   Expected: no seed cards, but tool is prefilled and custom/tool-only continuation remains possible.

6. Save with seed suggestion
   Expected:
   - use case saved successfully
   - `origin.source` remains human (`manual` or existing human path)
   - `assistContext.selectionMode = "seed_suggestion"`
   - `assistContext.seedSuggestionId` present

7. Save with custom purpose
   Expected:
   - use case saved successfully
   - `assistContext.selectionMode = "custom_purpose"`
   - no forced seed suggestion id

8. Continue tool-only
   Expected:
   - Quick Capture opens with tool prefilled
   - no false purpose default
   - `assistContext.selectionMode = "tool_only"` after save

### Required user-facing checks

1. Transparency copy is visible before save.
2. No auto-save language appears anywhere in the flow.
3. Plugin copy says local detection and easy deactivation.
4. The assist step still feels faster than starting from a blank capture form.

## Verification checklist

- [ ] Flags off path still behaves exactly like normal Quick Capture
- [ ] Known host detection works for the pilot tools
- [ ] Unknown hosts stay silent
- [ ] Disable toggle suppresses signal
- [ ] Suggestion save persists assist metadata correctly
- [ ] Custom purpose save persists assist metadata correctly
- [ ] Tool-only fallback does not invent a purpose
- [ ] Download page explains the trust boundary clearly
- [ ] Pilot feedback channel is ready before first rollout wave
- [ ] Rollback owner is named and reachable

## Pilot cohort

### Wave 0: Internal dogfood

Target:

- 5-10 internal users
- product + ops + 1-2 non-builder users
- mixed familiarity with Quick Capture

Purpose:

- catch creepy wording early
- validate top-host precision
- check whether the extra step still feels net faster

Duration:

- 3-5 working days

### Wave 1: Small pilot organisations

Target:

- 1-2 small organisations
- each with one clear contact person
- ideally already using Quick Capture manually

Purpose:

- validate real-world adoption outside the internal team
- test whether suggestions remain useful without direct onboarding help

Duration:

- 1-2 weeks

### No broad rollout yet

Do **not** expand beyond this pilot if trust or precision remains mixed.

## Pilot tool scope

Start with the most common productivity / chat tools from the current detection map:

- `chatgpt_openai`
- `claude_anthropic`
- `google_gemini`
- `microsoft_copilot`
- `perplexity`

Hold back the more variable creative tools for later pilot expansion:

- `midjourney`
- `jasper_ai`
- `runway`

Reason:
The first five have more stable, office-like use cases and make trust review easier.
Creative tools are not wrong, but they introduce more ambiguous capture patterns too early.

## Trust review

Before moving from Wave 0 to Wave 1, all three questions must be answered with a clear
`yes` or `mostly yes` based on actual pilot evidence:

1. Does the feature feel helpful rather than watchful?
2. Are the suggestions professionally usable?
3. Is the flow still faster than manual capture from scratch?

If one answer is `no`, stop the rollout and adjust before expanding.

### Evidence to collect

- short user interviews after first use
- 1-2 sentence written feedback
- disable reasons, if available
- examples of bad suggestions
- examples where the assist step saved time

## Feedback channel

Use one lightweight channel only. Do not spread pilot feedback across too many places.

Recommended setup:

- one dedicated Slack or Teams thread: `#coverage-assist-pilot`
- one short feedback form with four fields:
  - tool detected
  - helpful / neutral / irritating
  - suggestion quality
  - free text

Minimum prompt for pilot users:

> Bitte teilen Sie nach den ersten 2-3 Nutzungen kurz mit, ob Coverage Assist hilfreich, neutral oder irritierend war und ob die vorgeschlagenen Zwecke brauchbar waren.

## Pilot metrics

These are validation targets, not long-term business KPIs.

- Host-match precision on pilot tools: `>= 90%`
- Assisted captures among extension-based captures: `>= 25%`
- Save rate after assist entry shown: `>= 30%`
- Disable rate after first meaningful use: `< 15%`
- Explicit negative trust feedback: `< 10%` of pilot users

## How to read the metrics

Do not interpret a single metric in isolation.

Examples:

- High disable rate with good save rate usually means the feature is useful but feels too loud.
- Low save rate with low disable rate may mean the assist step is polite but not helpful enough.
- Good precision with poor trust feedback usually points to wording or timing, not detection quality.

## Stop conditions

Stop rollout expansion immediately if one of these happens:

- disable rate exceeds `20%` in a very small pilot
- repeated feedback says the feature feels like monitoring
- host matches create obvious false positives on common sites
- the assist step is measurably slower than plain Quick Capture

## Rollback

Rollback must be possible without data cleanup.

Primary rollback steps:

1. Set Coverage Assist flags back to `false`
2. Keep the extension available as plain Quick Capture launcher
3. Let `/capture` ignore Coverage Assist query params again via flags

Expected effect:

- no assist entry
- no assist signal
- existing use cases remain valid because `assistContext` is additive only

## Pilot owner checklist

- [ ] Pilot owner named
- [ ] Rollback owner named
- [ ] Wave 0 users named
- [ ] Wave 1 org contacts named
- [ ] Flags ready but still off
- [ ] Feedback channel created
- [ ] Verification checklist completed once with flag-off and once with flag-on
- [ ] Stop conditions acknowledged before rollout start
