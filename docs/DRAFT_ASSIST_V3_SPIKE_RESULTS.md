# Draft Assist v3 Spike Results

Stand: 2026-04-12
Status: spike passed after one refinement round
Slice: non-release-ready spike only

## Purpose

This spike exists to answer one narrow question before any UI or API work:

- can a small Draft Assist produce reviewable first drafts from repo-near use case descriptions
- without introducing a new persistence model
- and while staying anchored to the current Register-First and agent-kit core

This is not a launch document.
It is an evidence gate.

## Current status

Implemented:
- repo-near eval set under `src/ai/spikes/draft-assist-v3/eval-cases.ts`
- spike prompt under `src/ai/spikes/draft-assist-v3/draft-assist-spike.ts`
- eval runner under `src/ai/spikes/draft-assist-v3/run-eval.ts`
- machine-readable output target at `src/ai/spikes/draft-assist-v3/eval-results.json`

Execution history on 2026-04-12:

1. First run:
- blocked at provider level
- Google returned `403 Forbidden` and flagged the key as leaked

2. Second run with a fresh key:
- completed successfully across all 14 cases
- first meaningful quality result: `5/14` reviewable

3. Refinement round:
- prompt tightened around usage context semantics, owner-role inference, and
  truly blocking missing facts only
- spike summary length aligned with capture handoff limits

4. Final rerun after refinement:
- total cases: `14`
- executed cases: `14`
- schema valid: `14/14`
- capture mapping valid: `14/14`
- reviewable: `14/14`
- invented specific systems: `0/14`

Interpretation:
- the spike is now strong enough to clear the evidence gate
- the prompt can produce schema-valid, capture-mappable drafts at useful quality
- one refinement round was enough to move from weak output to pilot-worthy output

## Eval corpus

The spike uses repo-near or clearly repo-derived examples from:
- `src/lib/register-first/__tests__/smoke.ts`
- `src/lib/register-first/__tests__/service-v11.smoke.ts`
- `src/lib/register-first/risk-suggestion-engine.test.ts`
- `src/lib/agent-kit/manifest.test.ts`
- `src/lib/dev/studio-agent.test.ts`
- `src/data/coverage-assist-seed-library.json`

Covered case families:
- support prioritization and support drafting
- chatbot / customer-facing assistance
- recruitment / applicant communication / applicant ranking
- finance and procurement review flows
- internal drafting and knowledge workflows
- multi-system content workflows

## Evaluation logic

Per case the runner checks:
- manifest-near draft generation
- schema validity via `parseStudioUseCaseManifest`
- capture mapping validity via `buildRegisterCaptureFromManifest` plus `parseCaptureInput`
- deterministic risk suggestion via `suggestRiskClass`
- likely hallucination risk via unexpected specific system names
- coarse reviewability verdict

Current reviewability rule in the runner:
- schema valid
- capture mapping valid
- no unexpected specific systems
- at most 3 explicit missing facts
- no explicit expected-risk mismatch where one is defined

This is intentionally conservative and only suitable for spike triage.

## Run command

From the Studio repo root:

```bash
npx tsx src/ai/spikes/draft-assist-v3/run-eval.ts
```

Optional help:

```bash
npx tsx src/ai/spikes/draft-assist-v3/run-eval.ts --help
```

## Expected output

The runner writes:

- `src/ai/spikes/draft-assist-v3/eval-results.json`

With:
- overall status
- per-case draft output
- schema and capture mapping verdicts
- deterministic risk suggestion
- reviewability summary

## Decision gate

Go:
- at least 60 percent of cases are reviewable
- no recurring pattern of invented specific systems
- high-risk and limited-risk benchmark cases are not systematically flattened to `UNASSESSED`

No-Go or re-scope:
- many drafts fail manifest or capture mapping
- repeated hallucinated systems or owner assumptions
- strong benchmark cases miss obvious usage context or risk signals

## Current recommendation

Current judgment:
- **Go for Sprint 1**

Why:
- the evidence gate was met after one disciplined refinement cycle
- structural safety stayed high throughout
- the slice now clears the practical `reviewable first draft` bar on the current corpus

Residual caution:
- `exactRiskMatch` is still not the main success signal and remains lower than
  `reviewableCount`
- this means risk semantics still require explicit human review in later slices,
  which is already consistent with the product boundary

Recommended next step:
- move to Sprint 1
- keep this 14-case corpus as a regression set
- do not loosen the current safety boundary just because the spike now passes
