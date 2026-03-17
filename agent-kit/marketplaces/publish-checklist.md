# Publish Checklist

## Before a public GitHub release

- [ ] Confirm the chosen license is still correct
- [ ] Add the real repository, homepage, and issues URLs to `package.json`
- [ ] Check `README.md` screenshots and links
- [ ] Run `npm test` inside `agent-kit/`
- [ ] Review `CHANGELOG.md`
- [ ] Verify `skills/studio-use-case-documenter/SKILL.md` and `agents/openai.yaml` still match
- [ ] Confirm no internal or customer-specific examples remain

## Before publishing to ClawHub or another skill registry

- [ ] Skill description is concise and searchable
- [ ] `SKILL.md` explains when to use the skill, not just what it is
- [ ] Bundle includes only necessary assets
- [ ] Version number is updated if behavior changed
- [ ] Listing text and tags are ready

## Before publishing to SkillsMP-style directories

- [ ] Public GitHub repository is accessible
- [ ] README clearly shows install and use flows
- [ ] Agent metadata file is present
- [ ] The slash-command example is included for runtimes that support it
