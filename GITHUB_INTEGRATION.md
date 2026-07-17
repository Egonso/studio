# GitHub and production integration

## Current source of truth

- GitHub repository: [Egonso/studio](https://github.com/Egonso/studio)
- Release branch: `main`
- Production Netlify project: `studio-egonso`
- Production domain: [kiregister.com](https://kiregister.com)
- Pull requests receive Netlify deploy previews and GitHub Actions verification.

GitHub `main` is the deploy source of truth. Local branch descriptions, old worktrees, and similarly named Netlify projects do not prove production state.

## Required pull-request flow

1. Create a focused `codex/*` branch from current `origin/main`.
2. Commit one reviewable maintenance or product slice.
3. Push the branch and open a pull request.
4. Wait for GitHub CI and the `studio-egonso` deploy preview.
5. Merge only after the relevant checks pass.
6. Verify the production domain after the `main` deploy.
7. Delete the remote feature branch after successful verification.

Do not push feature work directly to `main`.

## Checks

The CI workflow uses Node.js 22 and runs:

- application dependency installation;
- Functions dependency installation and typecheck;
- application typecheck;
- lint;
- tests;
- production build.

The Netlify preview validates the hosting build and route behavior independently of GitHub Actions.

## Integration recovery

If the Netlify check does not appear on a pull request:

1. confirm that the repository and branch are correct;
2. confirm that the expected project is `studio-egonso`;
3. inspect the existing Git integration in the Netlify dashboard;
4. repair the existing integration instead of creating a second Netlify project;
5. never paste build hooks, tokens, or other credentials into tracked documentation.

Manual production deploys are exceptional recovery actions and require verified access to `studio-egonso`. See [NETLIFY_DEPLOY.md](NETLIFY_DEPLOY.md).
