# Typography — Locked April 2026

> Status: shipped. This document records the decisions and the reasoning. Implementation: see `styles.css`, `_scripts/extract-fonts.js`, `assets/dropcap-we.svg`, `build.js`, `reader.js`.

## The system

Three typographic registers, each with one job.

- **Serif (the document):** **Libre Caslon Text.** The U.S. Constitution was first printed by John Dunlap and David Claypoole in September 1787 in Caslon small-pica. There is no closer typographic provenance available for an American civic site — the document set in its own type. Libre Caslon Text (Impallari Type) is SIL OFL, drawn for body at 16–18px on screen.
- **Sans (the interface):** **Public Sans.** Designed by GSA / Technology Transformation Services for the U.S. Web Design System and shipped in 2019. SIL OFL, supports tabular figures and small caps. The chrome around the document is set in the type the federal web is set in.
- **Mono (the citations):** **Courier Prime.** Typewriter / mid-century officialdom register. Applied to the site footer (NARA / National Constitution Center attributions), signature footnotes, year labels, page chips, and image-pane metadata. Citations and annotations are visibly distinct from both the document and the UI. SIL OFL.

The user-override Typography toggle in Advanced Settings (Default / Serif / Sans / Mono) is preserved — Mono remains useful for niche cases like character counting.

## Body

Body size: **18px** (up from 17px). Compensates for Caslon's lower x-height vs. the prior Garamond. Line-height 1.62 sans / 1.58 serif. Measure 62ch sans / 66ch serif.

OpenType: `liga`, `kern` everywhere; `dlig` on serif body; `tnum`/`lnum` on counters and digit-only chrome. `onum` (old-style figures) intentionally not requested — Libre Caslon Text doesn't expose them as a static feature, and 18th-century printers used both styles inconsistently. Lining figures arguably read more formal in a civic context.

## Preamble dropcap

The Preamble opens with an SVG dropcap of the engrossed "We" — adapted from the JTC brand mark, itself a tracing of the iconic letterform Jacob Shallus engrossed on the parchment Constitution. Two-letter unit ("We") rather than the conventional one-letter dropcap, because "We" from the Constitution is itself an icon. The brand mark and the dropcap are now the same letterform — the site's identity is the document's first word.

The literal "We" stays in the DOM via a visually-hidden `.dropcap-letters` span so screen readers and copy-paste preserve the original text. The SVG is decorative (`aria-hidden="true"`).

Background circle from the logo is stripped for non-logo use. Letterforms inherit `currentColor` via CSS mask-image, so the dropcap follows the active theme accent across Modern, Parchment, and Civic. Mobile (≤480px) scales the dropcap down.

Spanish (and any future locale) falls through to the standard Caslon `::first-letter` dropcap on the leading character ("N" for "Nosotros"). The engrossed-"We" is English-specific.

## Voice statement

> The Constitution, set in its own type. The interface, set in the federal type. Citations, set in the type of the typewriter. Nothing else.

## Implementation map

| File | Change |
|---|---|
| `_scripts/extract-fonts.js` | CSS_URL swapped to Libre Caslon Text + Public Sans + Courier Prime |
| `fonts/` | 20 new woff2 (latin + latin-ext); old EB Garamond / Inter Tight / JetBrains Mono removed |
| `styles.css` | `@font-face` block regenerated; `:root` cascades updated; `--fs-body: 18px`; `onum` removed; `.preamble::first-letter` rules gated behind `:not(.has-dropcap-we)` for non-EN; new `.dropcap-we` mask-image rules; `.site-footer` and `.sig-footnotes` switched to mono register |
| `build.js`, `reader.js` | Preamble emits dropcap-we wrapper for EN locale only |
| `assets/dropcap-we.svg` | New — engrossed "We" with circle stripped, `fill="currentColor"` |
| `_headers` | New `Cache-Control: immutable` rule for `/assets/*` |

## Licensing

All three faces ship under the SIL Open Font License v1.1. All self-hosted from `fonts/` — no Google Fonts, no CDN. CSP `font-src 'self'` posture preserved. The dropcap SVG is original (adapted from the project's own brand mark).

## What didn't ship (and why)

- **Times New Roman:** British, 1931, no civic lineage. Reads as default Word document.
- **Cormorant Garamond:** x-height too low for screen body at 18px.
- **IM Fell DW Pica:** beautiful, but reads as period reproduction. Wrong tone for a clean reading site.
- **Variable fonts as primary:** Google Fonts only serves Public Sans as VF; Libre Caslon Text and Courier Prime are static-only. We ship static across the board for consistency. Variable can be a future commit when subsetting tooling supports VF.
- **Removing the Mono user-override:** considered, kept. Power users may want body-as-mono for character counting or other niche reasons.
