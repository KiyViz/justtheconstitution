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

## Deploy

Cloudflare Workers Builds watches the repo. On push it runs `npm run build`
then `npx wrangler deploy`, uploading the repo root as static assets behind
the Worker — except paths listed in `.assetsignore` (build inputs,
`node_modules/`, `docs/`, `CLAUDE.md`, other repo docs).

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
