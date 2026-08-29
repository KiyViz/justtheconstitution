# Architecture

Build pipeline, file layout, and deploy for justtheconstitution.org.
Referenced from `CLAUDE.md`. Read this before any build or file-structure work.

## Tech stack

- **No framework.** Plain HTML/CSS/vanilla-JS, assembled by `build.js` (custom
  Node.js script). Not Jekyll/Hugo/Next/etc.
- **`esbuild`** is the only npm dependency — JS/CSS minification.
- Output is static files, served as-is by a Cloudflare Worker.

## Source vs generated

### Source — edit these

| File / dir | What it is |
|---|---|
| `index.template.html` | Main page shell. Contains `<!-- BUILD:* -->` markers and `<!-- S:key -->` string placeholders. |
| `templates/*.template.html` | Subpage shells: `404`, `info`, `educators`. |
| `styles.css` | All CSS. Single file. |
| `*.js` (repo root) | JS modules — see map below. |
| `data/constitution.js` | English document text. Edit with care. |
| `data/constitution.es.js` | Spanish document text. |
| `data/strings.en.js`, `data/strings.es.js` | UI string tables that resolve `<!-- S:key -->`. |
| `build.js`, `_scripts/extract-fonts.js` | Build tooling. |
| `worker.js` | Cloudflare Worker entry — see below. Bundled by wrangler, untouched by `build.js`. |
| `_headers`, `_redirects`, `wrangler.jsonc`, `.assetsignore` | Cloudflare config. |
| `fonts/*.woff2`, `images/*`, `assets/*` | Static assets. |

### Generated — never hand-edit

`build.js` writes all of these:

- `index.html` (a copy of `en/index.html`, the root fallback)
- `en/index.html`, `es/index.html`
- `en/info/index.html`, `es/info/index.html`
- `en/for-educators/index.html`, `es/for-educators/index.html`
- `404.html`
- `*.min.js` (every JS module), `styles.min.css`
- `data/constitution.min.js`, `data/constitution.es.min.js`
- `en/strings.min.js`, `es/strings.min.js`
- `sitemap.xml`, `en/sitemap.xml`, `es/sitemap.xml`, `robots.txt`

When a task says "change X on the page," find X in `index.template.html` /
`styles.css` / a `*.js` module — never in `index.html` or `en/index.html`.

## Build

```
npm install      # one-time — installs esbuild
node build.js    # regenerates every output file (~200ms, idempotent)
```

**⚠️ Always `npm install` first.** With `esbuild` missing, `build.js` skips
minification *and* leaves the HTML pointing at unminified `styles.css` /
`*.js` instead of the `.min` versions — committing that ships a perf
regression. The build prints `(esbuild not installed — skipping
minification…)` when this happens; if you see that line, install and rebuild.

The build bumps `?v=<hash>` cache-busting query strings on every asset
reference, and the hash reflects the *minified* file's content.

## Pre-commit hook

`.githooks/pre-commit` auto-runs `node build.js` before each commit. Enable
once per clone:

```
git config core.hooksPath .githooks
```

The hook only `git add`s `index.html` + `sitemap.xml`. **All other generated
files (`en/`, `es/`, `404.html`, `*.min.*`) must be staged manually.** After a
CSS/JS/template change, run `node build.js` and `git add` every modified
output yourself.

## JS module map

`app.js` is the orchestrator. By area:

| Module | Responsibility |
|---|---|
| `core.js` | Shared utilities. |
| `theme.js` | Theme + mode toggles (`data-theme`, `data-mode`). |
| `tweaks.js` | Settings ("tweaks") panel. |
| `progress.js` | Reading progress bar, chapter ticks, labels. |
| `nav.js` | Navigation / table of contents. |
| `search.js` | In-page search. |
| `share.js` | Share popover. |
| `reader.js` | Reader mode. |
| `images.js` | Parchment image pane. |
| `lang.js` | Locale switching. |
| `citations.js` | Citation engine. |

## The Worker (`worker.js`)

The site is static assets, with one exception: `POST /api/contact`.

The contact form used to post straight to Web3Forms with the access key
visible in the page. Bots scraped the key and posted to Web3Forms directly,
bypassing the page and every client-side check (see `docs/pr-log.md`).
`worker.js` now sits in front: it verifies the form's Cloudflare Turnstile
token server-side, re-validates every field, and only then relays to
Web3Forms using a key held as a Worker secret. Everything else falls through
to `env.ASSETS.fetch()` — and `run_worker_first: ["/api/*"]` in
`wrangler.jsonc` means non-API routes never invoke the Worker at all.

**Secrets** (Worker, set once — the Worker returns a 503 `not_configured`
until they exist):

```
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put WEB3FORMS_ACCESS_KEY
```

**Local dev:** `Copy-Item .dev.vars.example .dev.vars` — pre-filled with
Turnstile's always-pass test secret and a dummy Web3Forms key, so a local
submission runs the whole chain but fails at the relay with `upstream_error`
instead of sending mail. Swap in the real key for a deliberate end-to-end test.

⚠️ **`npx wrangler dev` does not work in this repo.** `assets.directory` is
the repo root, and wrangler writes its own bundle to `.wrangler/tmp/` — inside
that watched directory. Each write retriggers the watcher, so the server
reload-loops several times a second and never serves a request.
`--persist-to` and `--no-bundle` don't avoid it (the tmp bundle is written
either way). Deploys are unaffected — `wrangler deploy` doesn't watch.

To exercise the Worker locally, copy `worker.js` and a minimal config into a
scratch directory outside the repo and run `wrangler dev` there:

```jsonc
// <scratch>/wrangler.jsonc — plus a copy of worker.js and .dev.vars
{ "name": "jtc-worker-test", "main": "worker.js",
  "compatibility_date": "2026-04-29", "compatibility_flags": ["nodejs_compat"] }
```

`/api/contact` then behaves exactly as in production (there is no ASSETS
binding, so non-API paths throw — that path is a one-line passthrough). Keep
the scratch directory's path short: workerd fails to open its SQLite state
under very long Windows paths.

The Turnstile **sitekey** is public and lives in
`templates/info.template.html`. `build.js` warns if the placeholder is still
in place; unreplaced, the widget never renders and every submission is
rejected.

## Deploy

Cloudflare Workers Builds watches the repo. On push it runs `npm run build`
then `npx wrangler deploy`, uploading the repo root as static assets behind
the Worker — except paths listed in `.assetsignore` (build inputs,
`node_modules/`, `docs/`, `CLAUDE.md`, other repo docs). `wrangler.jsonc` has
`main: worker.js`, so script and assets deploy together.

- Non-`main` branches → preview URLs (posted as a PR check).
- Merge to `main` → production.

## Troubleshooting

**CSP violation on live site after deploy.** Open DevTools Console on the
live URL — the browser logs which resource was blocked. If it's legit (a new
third-party script you added intentionally), amend the
`Content-Security-Policy` line in `_headers`. If it's unexpected, figure out
what introduced the external request.

**Roll back CSP to Report-Only if things break.** In `_headers`, change the
`Content-Security-Policy:` header back to `Content-Security-Policy-Report-Only:`,
commit, push. Violations will be logged to the browser console instead of
blocking resources while you investigate.
