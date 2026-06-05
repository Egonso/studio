# Suggested Slash Command

Use this snippet in agent systems that support custom slash commands.

```text
/capture-use-case

Use the ki-register-use-case-documenter skill.
If no local onboarding exists, run `studio-agent onboard` first.
Then run `studio-agent capture` with the current task context.
Use saved defaults when possible, ask only for missing required fields, and require final confirmation before writing files.
Write outputs to `docs/agent-workflows/<slug>/`.
If KI_REGISTER_API_KEY and KI_REGISTER_REGISTER_ID are configured, validate the manifest and offer to submit it to KI-Register after confirmation.
```
