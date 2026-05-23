# PR Log

Chronological record of merged pull requests, newest first. Lets a session
recover project history by reading one file instead of querying `gh` / `git`.

**Maintaining this file:** updated automatically by the `Log merged PR`
GitHub Action (`.github/workflows/log-merged-pr.yml`) — each merge into `main`
prepends one line to the list below. No manual step needed. To add an entry
by hand (e.g. the Action is disabled), use the format
`- **#NN** (YYYY-MM-DD) — <PR title>` at the top of the list. If it ever
drifts, rebuild from scratch with:

```
gh pr list --state merged --limit 200 --json number,title,mergedAt \
  --jq 'sort_by(.number) | reverse | .[] | "- **#\(.number)** (\(.mergedAt[:10])) — \(.title)"'
```

---

- **#48** (2026-05-23) — chore: delete stale SOP.md and prune .assetsignore
- **#47** (2026-05-23) — chore: backfill #46 in pr-log.md
- **#46** (2026-05-22) — ci: auto-log merged PRs to docs/pr-log.md
- **#45** (2026-05-22) — docs: add progressive-disclosure CLAUDE.md + context files
- **#44** (2026-05-21) — fix: prevent iOS auto-zoom on search input focus
- **#43** (2026-05-21) — fix: close share menu on selection and surface copy toast
- **#42** (2026-05-21) — fix: icon-only header buttons on mobile
- **#41** (2026-05-16) — Keep internal docs private and off the public site
- **#40** (2026-05-15) — fix: symmetric progress bar padding at tablet breakpoint
- **#39** (2026-05-15) — feat: amplify TOC link hover so the color shift registers
- **#38** (2026-05-15) — feat: "We" mark in mobile/tablet contents drawer
- **#37** (2026-05-15) — Align meta tags, SEO, and share prefills with marketing-copy.md
- **#36** (2026-05-15) — chore: refresh stale subpage asset hashes
- **#35** (2026-05-15) — feat: clause-level share buttons with pre-filled quote, citation, and deep link
- **#34** (2026-05-21) — feat: SEO + GEO + analytics pass — zero-cookie tracking, AI-citable schema
- **#33** (2026-05-12) — feat: native social share buttons in the share popover
- **#32** (2026-05-12) — feat: keyboard shortcuts for the toolbar
- **#31** (2026-05-12) — feat: Civic becomes the default theme
- **#30** (2026-05-12) — refactor: snappier wordmark reveal — Y-axis sweep, half the duration
- **#29** (2026-05-12) — feat: progress bar hit area now covers the labels row
- **#28** (2026-05-12) — refactor: toolbar labels expand on hover instead of staying persistent
- **#27** (2026-05-12) — fix: cache-bust hash should reflect the served (minified) file
- **#26** (2026-05-12) — Phase 3: search counter echoes query, brightens on hits
- **#25** (2026-05-12) — Phase 2: wide breakpoint, toolbar labels, sidebar widening
- **#24** (2026-05-12) — Phase 1: progress bar polish, TOC contrast, cut Saturation
- **#23** (2026-05-12) — feat: re-enable esbuild asset minification
- **#22** (2026-05-12) — chore: add .assetsignore for new build pipeline
- **#21** (2026-05-12) — fix: roll back asset minification (live site CSS/JS 404)
- **#20** (2026-05-06) — v2: SEO, a11y, performance, OG image, educators page
- **#19** (2026-05-06) — fix: add missing logo and language switcher to subpage headers
- **#18** (2026-05-06) — feat: add category selector and star rating to contact form
- **#17** (2026-05-06) — feat: sticky expandable footer
- **#16** (2026-05-06) — feat: add subpages (404 + /info) and updated footer
- **#15** (2026-05-05) — fix: increase copy button visibility on hover
- **#14** (2026-05-05) — fix: stack image pane header at tablet breakpoint
- **#13** (2026-05-05) — fix: Spanish amendment images not loading (locale in filename)
- **#12** (2026-05-05) — fix: include page_chip translation in runtime strings bundle
- **#11** (2026-05-05) — chore: rebuild HTML with cache-busting hashes
- **#10** (2026-05-05) — fix: translate page-chip buttons for Spanish locale
- **#9** (2026-05-05) — fix: localize progress bar article labels for Spanish
- **#8** (2026-05-05) — revert: remove dropcap selectability hacks
- **#7** (2026-05-05) — fix: move mask to pseudo-element for dropcap selectability
- **#6** (2026-05-05) — fix: dropcap text included in manual selection
- **#5** (2026-05-05) — fix: make dropcap text selectable and render Spanish Ñ SVG
- **#4** (2026-05-05) — feat: locale-dependent SVG dropcap for Spanish preamble
- **#3** (2026-04-30) — copy: contain citation chip text within pill borders
- **#2** (2026-04-29) — brand: add OG share card source SVG
- **#1** (2026-04-30) — Add Cloudflare Workers configuration
