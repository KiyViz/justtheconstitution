# Conventions

Design systems for justtheconstitution.org. Referenced from `CLAUDE.md`.
Read this before any CSS or UI work.

## Breakpoints

All in `styles.css`. "Tablet" ≈ 721–1100px; "mobile" ≈ ≤720px.

| Media query | Effect |
|---|---|
| `min-width: 1700px` | 2K+: container widens to 2200px, TOC column grows. |
| `min-width: 1101px` | Desktop: inline TOC shown; `#menu-btn` (hamburger) hidden. |
| `max-width: 1100px` | Tablet/compact: inline TOC hidden → hamburger drawer only; progress labels hidden. |
| `max-width: 960px` | Image (parchment) pane hidden; reader becomes single-column. |
| `max-width: 720px` | Mobile: header/progress padding tighten to 14px; lang/reader/mode buttons move into the Settings "Tools" row. |
| `max-width: 640px` | Text-pane padding shrinks. |

A rule "tuned for desktop" can read wrong at tablet once labels/panes drop
out — check what's hidden at the breakpoint before adjusting padding.

## Theme + mode system

Two independent axes on `<html>`, giving **9 combinations**:

- `data-theme` — `parchment` | `modern` | `civic` — **`civic` is the default**
- `data-mode` — `light` | `dark` | `oled` (`oled` = pure-black variant)

`theme.js` owns the toggles; `tweaks.js` owns the Settings panel.

### CSS variables

Each `[data-mode="…"][data-theme="…"]` block near the top of `styles.css`
redefines the palette: `--ink`, `--ink-soft`, `--ink-faint`, `--bg`,
`--bg-elev`, `--bg-sunken`, `--accent`, `--rule`, `--rule-soft`,
`--hairline`, `--chip-*`, `--progress-*`, and more. Layout variables include
`--header-h`, `--progress-h`, `--measure`.

**Write theme-agnostic CSS:** reference these variables, never hard-coded
colors. A relative `color-mix()` on `--ink` (e.g. `color-mix(in srgb,
var(--ink) 80%, #000 20%)`) self-tunes across all 9 combinations because
`--ink` itself is redefined per block. When a rule must differ by mode,
branch on `[data-mode="dark"]` / `[data-mode="oled"]` — one selector covers
all themes within that mode.

### Specificity gotcha

`.toc a:hover`, `.toc .toc-sub a`, and `.toc a.is-active` all share `(0,2,1)`
specificity — when specificity ties, **source order decides**. Hover/state
rules must come *after* the rules they need to override. A `[data-mode="…"]`
prefix bumps specificity to `(0,3,1)`, which can mask an ordering bug in one
mode while it stays broken in another.

## i18n / string placeholders

Templates contain `<!-- S:some.key -->` markers. `build.js` replaces them per
locale from `data/strings.{en,es}.js`.

To add UI copy:

1. Add the key to **both** `data/strings.en.js` and `data/strings.es.js`.
2. Reference `<!-- S:your.key -->` in the template.

`build.js` validates that the Spanish document data matches the English
structure (article/amendment counts) and fails the build on mismatch.
