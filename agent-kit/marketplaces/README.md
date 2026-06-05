# Marketplace Publishing Guide

This folder contains the practical assets for publishing the kit to public skill registries and marketplace-like directories.

## Targets

- OpenClaw / ClawHub
- SkillsMP-style skill listings
- Agent Skills-compatible directories
- Public GitHub repository distribution

## Why the package is structured this way

OpenClaw's official docs say a skill is a folder with a `SKILL.md` file plus optional supporting files, and the published flow is based on completing `SKILL.md`, testing locally, and publishing through the current ClawHub flow. GitHub's official docs recommend clear community-health files, issue templates, support resources, and repository hygiene for public collaboration.

Relevant references:

- [OpenClaw: Creating Skills](https://docs.openclaw.ai/tools/creating-skills)
- [OpenClaw: ClawHub](https://docs.openclaw.ai/tools/clawhub)
- [GitHub Docs: community health files](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file)

## Included collateral

- `listing-copy.md`: short and long listing text, tags, and positioning
- `publish-checklist.md`: preflight list before a public release
- `marketplace-manifest.json`: machine-readable listing data for copy/paste into marketplace submissions

## Note on SkillsMP compatibility

SkillsMP indexes public GitHub repositories that contain `SKILL.md` files. Publishing this repository publicly is therefore the primary SkillsMP submission path; catalog visibility may lag until the next index run. Treat any additional SkillsMP-specific guidance as a compatibility profile rather than a vendor submission API.
