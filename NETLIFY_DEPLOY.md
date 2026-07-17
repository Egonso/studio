# Netlify production deployment

## Canonical project

- Netlify project: `studio-egonso`
- Production domain: [kiregister.com](https://kiregister.com)
- Repository: `Egonso/studio`
- Production branch: `main`
- Build command: `npm run build`
- Publish directory: `.next`
- Runtime: Node.js 22, configured in `netlify.toml`

`studio-egonso` is the only production Netlify project for KI Register. Do not create another project when local CLI access or project linking is missing.

The obsolete duplicate `pumuckels` had no custom domain and served older assets. It was permanently deleted on 2026-07-17 after the production asset mapping was reverified.

## Standard deployment path

1. Push a `codex/*` branch.
2. Review the Netlify deploy preview attached to the pull request.
3. Require green GitHub CI.
4. Merge the pull request into `main`.
5. Let the `studio-egonso` Git integration publish production.
6. Verify `kiregister.com` after the production deploy completes.

The Git integration is the normal production path. A local `netlify deploy --prod` is not a substitute for missing access to `studio-egonso`.

## CLI safety check

Before any Netlify mutation, verify both the authenticated account and the exact linked project:

```bash
netlify status
netlify sites:list
```

If `studio-egonso` is not visible to the authenticated account, stop. Use the GitHub deployment path or obtain access to the owning Netlify team. Never run `netlify init`, create a replacement project, or deploy production to a similarly named site.

## Production verification

Verify at least:

- `https://kiregister.com/de` returns HTTP 200;
- the primary capture journey loads;
- the production Next.js asset set matches `studio-egonso.netlify.app`;
- the merged feature or copy is visible;
- no stale duplicate project is receiving production traffic.

## Rollback

For a faulty web release, revert the merge commit through a pull request. Netlify will publish the reverted `main` state. If immediate recovery is required, restore the previous successful production deploy in the `studio-egonso` Netlify project and then reconcile `main` through GitHub.
