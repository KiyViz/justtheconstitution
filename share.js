/* ===== justtheconstitution — share =====
   Platform-aware share-payload builder. Given a source object (clause /
   section / article / amendment / preamble / signatures), the passage
   text, the target platform, and locale opts, returns the payload that
   nav.js feeds into platform intent URLs.

   Citation: always Bluebook short ("U.S. Const. art. I, § 8, cl. 3").
   The user's copyMode (plain / bluebook / mla / chicago / markdown /
   bibtex) governs the clipboard *copy* button only — share has a
   different audience and a compact, universal authority form serves
   every destination.

   URL: produced by citations.js urlFor() — now clause-level after the
   anchor change in reader.js paragraphSrc.

   Truncation: X has a 280-char visible tweet limit and Bluesky a 300-char
   hard cap. Long clauses (5th Am ~620, 14th Am §1 ~480) blow this on
   their own. We target conservative budgets (250 / 270) to leave the
   reader headroom and truncate quotes at the nearest sentence or word
   boundary with a single … character. Citation + URL are never dropped.

   Depends on: core (JTC.SITE_URL), citations (JTC.cite._bluebookCite,
               JTC.cite._urlFor). */
(() => {
  const JTC = (window.JTC = window.JTC || {});

  // Conservative character budgets per platform. Reserve headroom over
  // the published cap so the user can edit slightly without re-truncating.
  const BUDGET = {
    x: 250,        // X cap 280 — t.co shortens URLs to 23 chars in counted length
    bluesky: 270   // Bluesky cap 300 — no link shortening, counts full URL
  };

  // ── Citation + URL primitives ──
  // Both work for every kind in citations.js. _bluebookCite handles preamble
  // / signatures / amendment / amendment-section / article / section / clause.
  function citeFor(source) {
    if (!source) return "";
    return JTC.cite && JTC.cite._bluebookCite ? JTC.cite._bluebookCite(source) : "";
  }
  function urlFor(source, opts) {
    if (!source) return (opts && opts.fallbackUrl) || "";
    return JTC.cite && JTC.cite._urlFor ? JTC.cite._urlFor(source, opts) : "";
  }

  // ── Truncation ──
  // Returns the quoted body (with leading/trailing curly quotes) trimmed to
  // fit within `budget` once `suffix` (e.g. " — <cite> <url>") is appended.
  // Prefers a sentence boundary in the back half of the budget; falls back
  // to a word boundary; appends a single ellipsis. If the quote already
  // fits, no truncation marker is added.
  function truncateQuote(quote, suffix, budget) {
    const q = String(quote || "").trim();
    if (!q) return "";
    const full = `“${q}”`;             // “quote”
    if (full.length + suffix.length <= budget) return full;
    // Leave room for the two curly quotes and the ellipsis.
    const room = budget - suffix.length - 3;
    if (room <= 16) return `“${q.slice(0, Math.max(8, room))}…”`;
    let head = q.slice(0, room);
    const sentenceEnd = head.lastIndexOf(". ");
    if (sentenceEnd > room * 0.5) {
      head = q.slice(0, sentenceEnd + 1);        // include the period
    } else {
      const lastSpace = head.lastIndexOf(" ");
      if (lastSpace > 0) head = head.slice(0, lastSpace);
    }
    return `“${head.trim()}…”`;
  }

  // ── Build per platform ──
  // Returns { text, url, title } — fields the nav.js dispatcher uses to
  // construct intent URLs. Empty string means "platform doesn't use it".
  function buildSharePayload(source, text, platform, opts) {
    opts = opts || {};
    // Page-level (no source) — preserve today's top-level share behavior.
    if (!source) {
      const url = opts.fallbackUrl || (typeof location !== "undefined" ? location.href : "");
      const title = opts.fallbackTitle || (typeof document !== "undefined" ? document.title : "");
      if (platform === "copy") return { text: url, url, title };
      if (platform === "email") {
        return { text: (JTC.t ? JTC.t("share.email_body_prefix") : "") + url, url, title };
      }
      // Bluesky's intent URL has no separate url= param — link must live
      // in the text. Other social platforms get title in text and url in url=.
      if (platform === "bluesky") return { text: `${title} ${url}`, url, title };
      return { text: title, url, title };
    }

    const cite = citeFor(source);
    const url  = urlFor(source, opts);
    const q    = String(text || "").trim();

    switch (platform) {
      case "x": {
        const suffix = ` — ${cite} ${url}`;
        const body = truncateQuote(q, suffix, BUDGET.x);
        return { text: body + suffix, url, title: cite };
      }
      case "bluesky": {
        const suffix = ` — ${cite} ${url}`;
        const body = truncateQuote(q, suffix, BUDGET.bluesky);
        return { text: body + suffix, url, title: cite };
      }
      case "reddit": {
        // Reddit titles cap at 300 chars. Use citation + a quote teaser.
        const teaser = q.length > 180 ? q.slice(0, 177).trimEnd() + "…" : q;
        const title = `${cite}: “${teaser}”`;
        return { text: "", url, title: title.length > 300 ? title.slice(0, 297) + "…" : title };
      }
      case "email": {
        const body = `“${q}”\n\n— ${cite}\n${url}`;
        return { text: body, url, title: cite };
      }
      case "linkedin":
      case "facebook": {
        // LinkedIn's share-offsite intent ignores prefilled text; Facebook
        // removed the `quote=` parameter in 2017. Both unfurl from the
        // destination's OG tags — URL-only is honest.
        return { text: "", url, title: cite };
      }
      case "native": {
        // navigator.share — let the OS app decide formatting.
        return { text: `“${q}” — ${cite}`, url, title: cite };
      }
      case "copy":
      default: {
        // "Copy link" copies the clause URL only. The clause-level copy
        // button (next to this share button) is what copies the full
        // quote + citation payload.
        return { text: url, url, title: cite };
      }
    }
  }

  JTC.buildSharePayload = buildSharePayload;
  // Expose the truncator for the verification path / future tests.
  JTC._truncateShareQuote = truncateQuote;
})();
