# Contributing

Thanks for helping improve the KI-Register Agent Kit.

## What good contributions look like

- Keep the package portable across agent runtimes.
- Preserve the dual-output model:
  - `manifest.json` for machines
  - `README.md` for humans
- Prefer simple Node-based tooling over framework-heavy dependencies.
- Keep human confirmation in the loop by default unless there is a strong reason not to.

## Before opening a pull request

1. Run `npm test` at the repository root.
2. If you change the CLI, verify the onboarding, capture, and validate flows.
3. If you change the skill text, keep `SKILL.md` and `agents/openai.yaml` aligned.
4. If you change the public README or marketplace copy, keep the examples realistic and compliance-safe.

## Scope guidelines

Good fits:

- documentation quality improvements
- schema evolution with backward compatibility
- workflow capture ergonomics
- better marketplace packaging
- stronger validation and safer defaults

Please avoid:

- adding vendor-specific lock-in without a fallback
- removing confirmation or review checkpoints by default
- turning the package into a legal advice engine

## Pull request checklist

- Describe the user-facing change clearly.
- Note any compatibility impact.
- Include updated examples when the schema or CLI behavior changes.
- Mention whether the downloadable ZIP should be rebuilt.
