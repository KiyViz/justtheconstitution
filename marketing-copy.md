# Marketing Copy

Canonical reference for all marketing-facing strings on justtheconstitution.org.
When in doubt about wording — for a meta tag, social card, share prefill, bio, or
press blurb — use the entries below verbatim. Update this file *before* changing
copy elsewhere, so this file remains the source of truth.

---

## Brand voice

Five rules that keep every line on-brand:

1. **Specific over poetic.** Dates, numbers, and concrete features beat vague civic mood.
2. **Utility before vibe.** The reader's first question is "what is this site?" — answer it.
3. **Three short clauses.** The site already uses the rhythm *"No ads. No commentary. No paywall."* — keep that cadence as a recurring motif.
4. **Period beats comma.** Sentence fragments separated by periods read sharper in social and meta contexts than compound sentences.
5. **No emoji, no exclamation marks, no hype words** ("revolutionary," "amazing," "the best"). The Constitution doesn't need cheerleading.

---

## Primary tagline

> **Ratified in 1788. Built for 2026.**

Use as the hero headline, OG title, Twitter card title, and any place a single brand line is needed. Do not modify the years, punctuation, or sentence break. If the venue is too tight for two sentences, fall back to the *short tagline* below.

**Short tagline (≤30 chars):**

> **The Constitution, online.**

---

## Hero subtitle / supporting line

Used directly under the primary tagline. Conveys utility (the *what* and *why click*).

> **Read, cite, and share the Constitution line-by-line.**

Acceptable variants if length is constrained:

- *Read, cite, share — line-by-line.* (39 chars)
- *Every clause, one link away.* (28 chars)

---

## Hero CTA (button)

Primary:

> **Start reading**

Alternates (use depending on visual weight and surrounding copy):

- *Open the Constitution*
- *Read Article I* — strongest if the click drops the user straight into the document

---

## About / mission statement

For an About page, footer blurb, or directory listing where 1–3 sentences are available.

> **Just the Constitution is a clean, modern web edition of the United States Constitution and all twenty-seven amendments. Every line is citeable, shareable, and searchable. No ads. No commentary. No paywall.**

Short version (1 sentence, ≤180 chars):

> **A modern web edition of the U.S. Constitution — citeable, shareable, and searchable, line-by-line.**

---

## Footer tagline

A short echo of the brand. Pick one and stay consistent across pages.

> **The Constitution, line-by-line.**

---

## SEO

### Page title tag

Used in `<title>` and as the Google blue link.

> **Just the Constitution — Read, Cite & Share the U.S. Constitution**

(58 chars — fits Google's ~60-char display limit.)

If preserving the existing keyword-heavy title for SEO continuity:

> **U.S. Constitution — Full Text & All 27 Amendments | justtheconstitution.org**

### Meta description

~155 chars. Used in `<meta name="description">` and Google SERP snippet.

> **Read the full U.S. Constitution and all 27 amendments online. Cite any line, share any clause, search the full text. No ads, no commentary, no paywall.**

---

## Open Graph (social link previews)

### OG title

> **Just the Constitution — Ratified in 1788. Built for 2026.**

### OG description

> **The U.S. Constitution, made for the web. Read, cite, and share the founding document line-by-line. No ads. No commentary. No paywall.**

### OG image

`https://justtheconstitution.org/og-image.png`
(1200×630, already present at repo root.)

---

## Twitter / X card

Use `summary_large_image`. Title and description may mirror OG verbatim, or use the slightly shorter variants below if you want Twitter-specific copy.

### Twitter title

> **Just the Constitution**

### Twitter description

> **Ratified in 1788. Built for 2026. Read, cite, and share the U.S. Constitution line-by-line.**

---

## Share prefills

Strings injected into native share / `twitter.com/intent/tweet` / `mailto:` / clipboard when a user clicks the share button.

### Homepage share (whole site)

**Twitter / X:**

> **Read the U.S. Constitution online — every clause, one link away. https://justtheconstitution.org**

**Generic copy-link / iOS share sheet:**

> **Just the Constitution — read, cite, and share the U.S. Constitution line-by-line. https://justtheconstitution.org**

**Email subject:**

> **The Constitution, line-by-line**

**Email body:**

> **A clean, free web edition of the U.S. Constitution. Cite any line, share any clause, search the full text. https://justtheconstitution.org**

### Clause / line share (deep link to a specific passage)

When sharing a specific passage with a fragment URL, the prefill should let the
quoted text speak for itself. Keep the wrapper minimal.

**Twitter / X (when a clause is selected):**

> **From the U.S. Constitution:**
> **"{clause_text}"**
> **{deep_link}**

**Generic copy-link (when a clause is selected):**

> **"{clause_text}" — U.S. Constitution, {citation_label}. {deep_link}**

Where `{citation_label}` is the human-readable citation (e.g. "Art. I, §8, cl. 3" or "Amend. XIV, §1") and `{deep_link}` is the canonical URL with the clause fragment.

---

## Bio / directory listings

### Twitter / X bio (≤160 chars)

> **The U.S. Constitution, line-by-line. Built for 2026. Free, no ads, no commentary. → justtheconstitution.org**

### Instagram bio (≤150 chars)

> **The U.S. Constitution, made for the web. Read, cite, share line-by-line.**
> **→ justtheconstitution.org**

### GitHub repo description (≤160 chars)

> **A clean, citeable web edition of the U.S. Constitution and all 27 amendments. No ads. No commentary. No paywall.**

### Press one-liner

For journalists, directories, "in the news" placements.

> **Just the Constitution is a modern web edition of the U.S. Constitution, optimized for citation and sharing — free, no ads, no commentary.**

---

## Reserved alternatives (do not ship without review)

Lines that tested well but are not in production. Keep here for A/B testing or
future redesign.

**Tagline alternates:**

- *Drafted in 1787. Built for 2026.*
- *1788 words. 2026 links.*
- *Every clause, one link away.*

**Subtitle alternates:**

- *Cite any line. Share any clause.*
- *The Constitution, with permalinks.*

**Share prefill alternates:**

- *I just cited the Constitution. You can too →*
- *The Constitution, in a tweet-able link →*

---

## Change log

When you change a primary string, add a line here with the date, the slot, and
the reason. This is the institutional memory for why the copy is what it is.

- *2026-05-14 — Initial canonical set established.*
- *2026-05-14 — Applied to repo: SEO `<title>` + meta description (en + es), OG/Twitter title + description (en + es), homepage share prefills for X / native iOS / email subject + body (en + es). Spanish copy machine-translated per site owner direction (constitutional source text remains the authentic ES transcript). SEO title swapped to the primary branded option for length compliance and intent-rich keywords.*
