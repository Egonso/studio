# Marketplace Publishing Guide

This folder contains the practical assets for publishing the kit to public skill registries and marketplace-like directories.

## Targets

- OpenClaw / ClawHub
- SkillsMP-style skill listings
- Public GitHub repository distribution

## Why the package is structured this way

OpenClaw's official docs say a skill is a folder with a `SKILL.md` file plus optional supporting files, and ClawHub stores versioned bundles of files and metadata. GitHub's official docs recommend clear community-health files, issue templates, support resources, and repository hygiene for public collaboration.

Relevant references:

- [OpenClaw: Creating Skills](https://docs.openclaw.ai/tools/creating-skills)
- [OpenClaw: ClawHub](https://docs.openclaw.ai/tools/clawhub)
- [GitHub Docs: community health files](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file)

## Included collateral

- `listing-copy.md`: short and long listing text, tags, and positioning
- `publish-checklist.md`: preflight list before a public release

## Note on SkillsMP compatibility

The SkillsMP-specific guidance here is an implementation recommendation based on common skill-bundle patterns such as `SKILL.md` plus agent metadata like `agents/openai.yaml`. Treat that part as a compatibility profile rather than official vendor documentation unless you confirm a current platform spec.
