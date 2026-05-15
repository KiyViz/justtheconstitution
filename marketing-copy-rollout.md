# Marketing Copy Rollout — Handoff

This document is a self-contained brief for a fresh Claude Code session.
The previous session worked with the site owner to define the marketing copy
for justtheconstitution.org and wrote a canonical reference file
([marketing-copy.md](marketing-copy.md)). Your job is to apply that copy to
the actual repo — meta tags, share prefills, templates, locale strings.

Read this entire document **and** [marketing-copy.md](marketing-copy.md)
before changing a single file.

---

## Mission

Bring the live site into alignment with the canonical marketing copy defined
in [marketing-copy.md](marketing-copy.md). The reference file is the source
of truth; this rollout doc is the implementation map.

Do **not** invent new copy. If a slot is needed that isn't covered by
marketing-copy.md, stop and ask the user. If something seems off about the
copy itself, surface it as a question rather than silently editing it.

---

## Background — how we got here

The site owner and the previous session went through a structured copy
discussion:

1. **Tagline candidates** were evaluated. The winner — *"Ratified in 1788. Built for 2026."* — was chosen for its specificity (concrete dates) and intentional juxtaposition. Do not change the years, the punctuation (period not comma), or the word "Built."
2. **Tagline vs. share-prefill split.** It was explicitly decided to keep the tagline pure (curiosity hook) and use a separate, more utility-forward line for share prefills (where the share context already implies "this is interesting"). Do not combine them into one compound string.
3. **Brand voice was canonicalized** around five rules (see the "Brand voice" section in marketing-copy.md). The most load-bearing one is the recurring *"No ads. No commentary. No paywall."* cadence, which is already present in some existing meta tags — preserve and extend it, do not remove it.
4. **Date framing inconsistency was flagged.** The site currently uses both *"inscribed in 1787"* (in the doc subtitle inside [index.html](index.html)) and *"ratified in 1788"* (the new tagline). This is intentionally unresolved — see "Open questions" below. **Do not unilaterally reconcile this.**

---

## Source of truth

[marketing-copy.md](marketing-copy.md) at repo root. Every string you write
into code should match an entry there verbatim. If you need to pick between
two options listed in marketing-copy.md (e.g. two valid SEO titles), default
to the first/primary one and note your choice in the change log section of
marketing-copy.md.

---

## Application plan

### 1. Meta tags — HTML files

Update the `<title>`, `<meta name="description">`, `<meta property="og:*">`,
and `<meta name="twitter:*">` tags in these files. The Twitter and OG image
already exist at `/og-image.png` — do not change the image reference.

Files with meta tags (confirmed via grep):

- [index.html](index.html) — root entry, redirects to /en/
- [en/index.html](en/index.html) — primary English page
- [es/index.html](es/index.html) — Spanish page (see Spanish caveat below)
- [templates/404.template.html](templates/404.template.html)
- [templates/educators.template.html](templates/educators.template.html)
- [templates/info.template.html](templates/info.template.html)

There is also an [index.template.html](index.template.html) at repo root.
**Check whether the build pipeline regenerates `index.html` / `en/index.html` /
`es/index.html` from templates.** [build.js](build.js) is the build script —
read it before editing both a template and its generated output. If templates
are the canonical source, edit only the templates and rerun the build.
If they aren't wired up that way, edit the generated files directly. Confirm
with the user if unclear.

**Per-file mapping** (use the strings *verbatim* from marketing-copy.md):

| Meta slot | marketing-copy.md section |
| --- | --- |
| `<title>` | SEO → Page title tag |
| `<meta name="description">` | SEO → Meta description |
| `<meta property="og:title">` | Open Graph → OG title |
| `<meta property="og:description">` | Open Graph → OG description |
| `<meta name="twitter:title">` | Twitter / X card → Twitter title |
| `<meta name="twitter:description">` | Twitter / X card → Twitter description |

The current [index.html](index.html) has a duplicate `og:title` and
`og:description` pair (you'll see two of each in the existing markup) — fix
that while you're in there. There should be one of each.

### 2. Hero tagline + subtitle (on-page content)

In whichever file renders the hero ([en/index.html](en/index.html) is the
primary candidate — verify), the on-page hero copy should include:

- The primary tagline (*"Ratified in 1788. Built for 2026."*)
- The hero subtitle (*"Read, cite, and share the Constitution line-by-line."*)

**Important:** the existing `<h1 class="doc-title">` and `<p class="doc-subtitle">`
("The Constitution of the United States" / "The complete text, as inscribed in
1787…") are the *document* title and subtitle, not the *brand* hero. Do not
overwrite them. If a brand hero slot doesn't exist yet, ask the user where
they want the tagline displayed before adding new DOM.

### 3. Share prefills — JavaScript

Share logic lives in [nav.js:77-130](nav.js:77). Key facts:

- Twitter/X intent URL is built at [nav.js:80](nav.js:80) — uses a `text=${t}` param. The `t` value is what needs to become the marketing-copy.md "Homepage share — Twitter / X" string (URL-encoded; the URL itself goes in the `url=${u}` slot, so do **not** double-include the URL in the text).
- Native `navigator.share({ title, url })` is called at [nav.js:129](nav.js:129). Update the `title` argument to match the "Generic copy-link / iOS share sheet" string from marketing-copy.md (minus the URL — `navigator.share` takes URL separately).
- Email share builds the body via the i18n key `share.email_body_prefix` at [nav.js:124](nav.js:124) — this means email copy lives in the locale string files, not in nav.js. See §4 below.

For **clause-level share** (when a specific clause is selected, not the
whole page): check whether the existing share logic detects clause
selection / fragment URLs. If it doesn't, that's an implementation gap —
flag it to the user rather than wiring half a feature. The clause-level
prefill template in marketing-copy.md (with `{clause_text}`,
`{citation_label}`, `{deep_link}` slots) is ready when the wiring is.

### 4. Locale string files

i18n strings live in:

- [en/strings.min.js](en/strings.min.js)
- [es/strings.min.js](es/strings.min.js)

Update `share.email_body_prefix` (and any sibling `share.*` keys) in English
to match the "Email body" string in marketing-copy.md.

**Spanish caveat:** marketing-copy.md currently only contains English copy.
Do **not** machine-translate the new strings into Spanish. Leave the existing
Spanish strings in place and surface a clear note to the user: *"Spanish
marketing copy is not in marketing-copy.md and was not updated. Please
provide a Spanish equivalent, or confirm machine translation is acceptable
for v1."* The user is bilingual-aware (the site has two locales) and will
have an opinion.

### 5. Footer + about copy

If there's a footer tagline slot or About-page blurb on the site, update
those to match marketing-copy.md's "Footer tagline" and "About / mission
statement" sections. Search the codebase for the current footer copy
(*grep `footer` in HTML/templates*) before assuming a slot exists.

### 6. After applying

- Rebuild if the build pipeline requires it (`npm run build` or whatever
  [package.json](package.json) defines — check first).
- Visually verify in a browser if the dev server can be started. At minimum
  confirm: the `<title>` is correct, the OG card preview validates (use
  the Twitter/Meta card debugger URL pattern if the user wants — but **don't
  submit anything to those tools without asking**, they cache and crawl).
- Add a one-line entry to the change log section at the bottom of
  marketing-copy.md describing what you applied and when.

---

## Open questions — surface to user before applying

These were intentionally left unresolved by the previous session. Ask before
acting on any of them:

1. **"Inscribed 1787" vs. "Ratified 1788."** The doc subtitle in [index.html](index.html) says *"inscribed in 1787."* The new brand tagline says *"Ratified in 1788."* Both are factually correct (signed 1787, ratified 1788). Options:
   - Keep both intentionally distinct (doc-level vs. brand-level framing).
   - Change the doc subtitle to also say 1788 for consistency.
   - Pick a different framing entirely.
   **Default if user is unavailable:** keep both as-is and flag in the PR description.
2. **SEO `<title>` swap.** marketing-copy.md offers two valid options: the new short branded title (*"Just the Constitution — Read, Cite & Share the U.S. Constitution"*) and the existing keyword-heavy one. Swapping may cost some SEO continuity. **Default:** keep the existing title unless the user explicitly opts into the new one.
3. **Spanish translations.** Whether to ship English-only updates first or block on Spanish (see §4 above).
4. **Where the brand tagline is displayed.** If there's no existing hero slot for a brand line (only the document title slot), the user needs to decide whether to add one and where.

---

## Hard rules

- **Source of truth:** marketing-copy.md. Don't paraphrase, don't "improve," don't auto-translate.
- **No emoji, no exclamation marks, no hype words.** This is part of the brand voice.
- **Preserve the *"No ads. No commentary. No paywall."* cadence** wherever it currently appears.
- **One change at a time, atomic commits.** A commit per logical slot (meta tags / share prefills / locale strings / etc.) makes review easy and revert safe.
- **Do not push to remote or open a PR without explicit user confirmation.**
- **Do not run `npm install`, dependency upgrades, or any non-copy refactors** as part of this rollout. Scope discipline.

---

## Files referenced

- [marketing-copy.md](marketing-copy.md) — canonical copy (source of truth)
- [index.html](index.html) — root, redirects to /en/
- [index.template.html](index.template.html) — template (verify build wiring)
- [en/index.html](en/index.html), [es/index.html](es/index.html)
- [templates/404.template.html](templates/404.template.html), [templates/educators.template.html](templates/educators.template.html), [templates/info.template.html](templates/info.template.html)
- [nav.js](nav.js) — share logic
- [app.js](app.js) — keyboard shortcut for share (Shift+S)
- [en/strings.min.js](en/strings.min.js), [es/strings.min.js](es/strings.min.js) — i18n strings
- [build.js](build.js) — build pipeline
- [package.json](package.json) — npm scripts
