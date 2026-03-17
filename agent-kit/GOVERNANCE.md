# Governance

This project is intentionally lightweight, but decisions should still be explicit.

## Maintainer responsibilities

Maintainers are responsible for:

- keeping the package portable across supported agent systems
- preserving safe defaults around confirmation and documentation quality
- reviewing compliance-related wording carefully
- deciding when schema changes require migration notes or version bumps

## Decision rules

- Small documentation and packaging fixes can be merged through normal review.
- Behavioral changes to the CLI or schema should explain compatibility impact.
- Changes that weaken human review, validation, or safety defaults need stronger justification.

## Release posture

- Use semantic versioning.
- Document user-visible changes in `CHANGELOG.md`.
- Treat the README, schema, and examples as part of the public contract.
