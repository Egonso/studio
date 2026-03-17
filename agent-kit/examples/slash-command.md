# Suggested Slash Command

Use this snippet in agent systems that support custom slash commands.

```text
/capture-use-case

If no local onboarding exists, run `studio-agent onboard` first.
Then run `studio-agent capture` with the current task context.
Use saved defaults when possible, ask only for missing required fields, and require final confirmation before writing files.
Write outputs to `docs/agent-workflows/<slug>/`.
```
