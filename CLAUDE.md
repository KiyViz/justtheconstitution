# CLAUDE.md

Context for Claude Code sessions on **justtheconstitution.org**. Read this
first — it exists so sessions don't re-explore the codebase from scratch.

## What this is

A static website: the full text of the U.S. Constitution and its 27
amendments, paired with the National Archives parchment facsimiles. No ads,
no commentary. Bilingual (English + Spanish). Deployed on Cloudflare Workers.

## Tech stack

- **No framework.** Plain HTML/CSS/vanilla-JS, assembled by a custom Node.js
  build script (`build.js`). Not Jekyll/Hugo/Next/etc.
- **`esbuild`** is the only dependency — used for JS/CSS minification.
- Output is static files served as-is.

## ⚠️ Source vs generated — read before editing anything

**This is the #1 thing to get right.** Many files in the repo are build
output. Editing them directly is wasted work — the next build overwrites it.

### Source files — edit these

| File / dir | What it is |
|---|---|
| `index.template.html` | Main page shell. Has `<!-- BUILD:* -->` markers and `<!-- S:key -->` string placeholders. |
| `templates/*.template.html` | Subpage shells: `404`, `info`, `educators`. |
| `styles.css` | All CSS. Single file. |
| `*.js` (root) | JS modules: `app`, `core`, `theme`, `tweaks`, `progress`, `nav`, `search`, `share`, `reader`, `images`, `lang`, `citations`. |
| `data/constitution.js` | English document text. Edit with care. |
| `data/constitution.es.js` | Spanish document text. |
| `data/strings.en.js`, `data/strings.es.js` | UI string tables (resolve `<!-- S:key -->`). |
| `build.js`, `_scripts/extract-fonts.js` | Build tooling. |
| `_headers`, `_redirects`, `wrangler.jsonc` | Cloudflare config. |
| `fonts/*.woff2`, `images/*`, `assets/*` | Static assets. |

### Generated files — never hand-edit

`build.js` writes all of these from the sources above:

- `index.html` (copy of `en/index.html` as the root fallback)
- `en/index.html`, `es/index.html`
- `en/info/index.html`, `es/info/index.html`
- `en/for-educators/index.html`, `es/for-educators/index.html`
- `404.html`
- `*.min.js` (every JS module), `styles.min.css`
- `data/constitution.min.js`, `data/constitution.es.min.js`
- `en/strings.min.js`, `es/strings.min.js`
- `sitemap.xml`, `en/sitemap.xml`, `es/sitemap.xml`, `robots.txt`

If a task says "change X on the page," find X in `index.template.html` /
`styles.css` / a `*.js` module — **not** in `index.html` or `en/index.html`.

## Build

```
npm install      # one-time — installs esbuild
node build.js    # regenerates all output files
```

**⚠️ Gotcha — always `npm install` first.** If `esbuild` is missing,
`build.js` silently skips minification *and* leaves the HTML pointing at the
unminified `styles.css` / `*.js` instead of the `.min` versions. Committing
that ships a perf regression. The build prints
`(esbuild not installed — skipping minification…)` when this happens — if you
see that line, run `npm install` and rebuild.

The build is idempotent (~200ms) and bumps `?v=<hash>` cache-busting query
strings on every asset reference.

### Pre-commit hook

`.githooks/pre-commit` auto-runs `node build.js` before each commit. Enable
once per clone with `git config core.hooksPath .githooks`. Note the hook only
`git add`s `index.html` + `sitemap.xml` — **the other generated files
(`en/`, `es/`, `404.html`, `*.min.*`) must be staged manually.** When
committing a CSS/JS/template change, run `node build.js` yourself and
`git add` every modified output.

## Design systems

### Breakpoints (in `styles.css`)

| Media query | Effect |
|---|---|
| `max-width: 1700px`→`min-width:1700px` | 2K+: container widens to 2200px, TOC grows. |
| `min-width: 1101px` | Desktop: inline TOC shown, `#menu-btn` (hamburger) hidden. |
| `max-width: 1100px` | **Tablet/compact:** inline TOC hidden → hamburger drawer only; progress labels hidden. |
| `max-width: 960px` | Image pane hidden, reader becomes single-column. |
| `max-width: 720px` | **Mobile:** header/progress padding tighten to 14px; lang/reader/mode buttons move into the Settings "Tools" row. |
| `max-width: 640px` | Text-pane padding shrinks. |

"Tablet" = roughly 721–1100px. "Mobile" = ≤720px.

### Theme + mode system

Two independent axes on `<html>`, giving **9 combinations**:

- `data-theme` — `parchment` | `modern` | `civic` (**civic is the default**)
- `data-mode` — `light` | `dark` | `oled` (oled = pure-black variant)

CSS variables (`--ink`, `--ink-soft`, `--ink-faint`, `--bg`, `--bg-elev`,
`--bg-sunken`, `--accent`, `--rule`, `--hairline`, `--progress-*`, etc.) are
redefined in each `[data-mode="…"][data-theme="…"]` block near the top of
`styles.css`. Write theme-agnostic CSS by referencing these variables — a
relative `color-mix()` on `--ink` self-tunes to all 9 combinations.

`theme.js` owns the toggles; `tweaks.js` owns the Settings panel.

### String placeholders / i18n

Templates contain `<!-- S:some.key -->` markers. `build.js` replaces them per
locale from `data/strings.{en,es}.js`. To add UI copy: add the key to **both**
string tables, then reference `<!-- S:your.key -->` in the template.
`build.js` validates that ES document data matches EN structure.

## JS module map

`app.js` is the orchestrator. Others, by area: `theme` (theming),
`tweaks` (settings panel), `progress` (reading progress bar + chapter ticks),
`nav` (navigation/TOC), `search` (in-page search), `share` (share popover),
`reader` (reader mode), `images` (parchment image pane), `lang` (locale
switch), `citations` (citation engine), `core` (shared utilities).

## Git / PR workflow

- Feature branches: `claude/<short-name>`, branched off `origin/main`.
- A change usually touches one source file + many regenerated outputs — commit
  them together.
- Cloudflare deploys non-`main` branches to preview URLs (posted as a PR
  check); merging to `main` deploys production.
- `SOP.md` documents deploy steps but is **partially stale** — it predates the
  en/es multi-locale split and the minification pipeline. Trust this file over
  SOP.md for the build/output details.

## Reference docs in-repo

- `SOP.md` — deploy procedure (see staleness note above).
- `marketing-copy.md`, `marketing-copy-rollout.md` — copy guidelines.
- `typography-recommendation.md` — type decisions.
