# 0021. Deploy to Cloudflare from CI, from a public repo

Status: Accepted (2026-11-02). Amends [0014](0014-deploy-last.md): the repo is public.

## Context

1.0 needs the app live at a public URL, deployed from `main`, and a deploy that waits for a green CI check ([ADR 0010](0010-a-portfolio-piece-with-a-1-0.md)). ADR 0014 left two questions for this moment: whether the repo goes public, and where the app is hosted.

The repo was already public on GitHub by then. Ryan confirmed that is what he wants.

The host has to do two things a plain file server does not. Every path has to serve `index.html`, or a shared link like `/nest/life` is a 404 ([ADR 0019](0019-a-small-router-of-our-own.md)). And it has to send security headers, like a Content-Security-Policy, which a page cannot set for itself as well as the server can.

## Options

1. **Cloudflare (Workers static assets).** Free. One setting serves `index.html` for every unknown path, with a 200. A `_headers` file in the build sets the headers. Wrangler, Cloudflare's command line tool, deploys from CI.
2. **Netlify.** Free, with the same `_headers` and `_redirects` files and the same deploy from CI. Nothing here favors it over Cloudflare.
3. **GitHub Pages.** No new account. It cannot send custom headers, and the only way to serve `index.html` for `/nest/life` is copying it to `404.html`, which answers with a 404 status. It fails the roadmap item as written.

How the deploy waits for CI:

1. **A last step in the CI workflow.** It runs only on a push to `main`, after every check has passed, and uploads the very build the end-to-end test rode.
2. **Cloudflare's own Git integration.** It builds every push by itself, whether CI is green or not. Making it wait would need branch protection, and requiring a status check on `main` blocks the direct pushes that ADR 0017 relies on.

## Decision

Cloudflare, deployed by a last step in the CI workflow. Ryan's call on the host and on keeping the repo public.

- `wrangler.jsonc` says what to deploy: `dist/`, with `not_found_handling: "single-page-application"`, and no Worker script.
- The headers live in `src/lib/securityHeaders.ts`. The build writes them into `dist/_headers`, and `npm run preview` sends the same ones. So the end-to-end test runs under the real policy, and a resource the policy blocks fails it.
- CI runs `npx wrangler@4.151.3 deploy`, pinned to an exact release. Wrangler is not a dependency in `package.json`: the app never imports it, and it is large.
- `compatibility_date` cannot be newer than the pinned Wrangler supports. A newer date fails `wrangler dev` with "the newest date supported by this server binary is ...". Bump the two together.

## Consequences

- The app is at `https://express-local.<account>.workers.dev` once Ryan has a Cloudflare account and adds two GitHub secrets, `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Until both exist, a push to `main` turns CI red at the deploy step. Every check before it still runs.
- A red check never deploys, and neither does a pull request or another branch.
- The policy allows nothing from other sites, no inline script and no `eval()`. A future feature that loads a font from Google or calls an API has to change `securityHeaders.ts` first, or the end-to-end test fails.
- A newer push to `main` cancels an older run, deploy step included (ADR 0013's concurrency setting). The newer run deploys anyway, so the site ends up on the newest green commit.
- `wrangler deploy` prints the live URL in the CI log. Checking the live headers and a deep link with `curl` is the last step of the deploy item.
- No branch protection on `main`. CI gates the deploy, not the push.
