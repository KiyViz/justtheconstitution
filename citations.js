/* ===== justtheconstitution — citations =====
   Six citation formats: plain, bluebook, mla, chicago, markdown, bibtex.
   Each format function takes (source, text, opts) and returns a clipboard
   payload string.

   Source object — what's being cited:
     {
       kind: "preamble" | "article" | "section" | "clause" |
             "amendment" | "amendment-section" | "signatures",
       art: 1,        // Arabic article number (1–7)
       sec: 8,        // Arabic section number
       cl:  3,        // Arabic clause/paragraph number within section
       am: 14,        // Arabic amendment number (1–27)
       para: 1,       // Arabic paragraph number within amendment
       hasMultipleSections: true,   // does this article have >1 sections?
       hasMultipleClauses:  true,   // does this section have >1 paragraphs?
       totalParas:  N,              // for amendments
       anchor: "a1-s8",             // URL hash for deep-link
       label: "Article I, Section 8" // locale-aware human label
     }

   Citation primitives (document name, "art.", "§", "cl.", "amend.",
   translation marker, etc.) come from strings.{locale}.js so adding a new
   language is a strings update — engine code stays language-agnostic.

   Granularity rules (legally accurate Bluebook/Chicago):
     • multi-section article + multi-para section → art. I, § 8, cl. 3
     • multi-section article + single-para section → art. III, § 1
     • single-section article + multi-para → art. VI, cl. 2 (skip §)
     • single-section article + single-para → art. V (article only)
     • amendment + multi-para → amend. XIV, § 1
     • amendment + single-para → amend. I

   Depends on: core (SITE_URL via JTC), JTC.t (locale strings). */
(() => {
  const JTC = (window.JTC = window.JTC || {});

  // ── Roman numeral conversion (Bluebook + Chicago use Roman for art. and amend.) ──
  function arabicToRoman(n) {
    const map = [
      [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
      [100,  "C"], [90,  "XC"], [50,  "L"], [40,  "XL"],
      [10,   "X"], [9,   "IX"], [5,   "V"], [4,   "IV"],
      [1,    "I"]
    ];
    let r = "", x = Number(n) || 0;
    for (const [v, s] of map) { while (x >= v) { r += s; x -= v; } }
    return r;
  }

  // ── Locale string lookup with fallback ──
  // JTC.t() may return the key itself if the string isn't defined; we provide
  // English fallbacks so the engine doesn't break if a locale's strings file
  // is missing a citation primitive.
  function tk(key, fallback) {
    const v = JTC.t ? JTC.t(key) : null;
    return (v && v !== key) ? v : fallback;
  }

  // ── URL builder ──
  function urlFor(source, opts) {
    const base = (opts && opts.url) || JTC.SITE_URL || "";
    const locale = (opts && opts.locale) || "en";
    const anchor = source.anchor || "";
    if (!base) return anchor ? `#${anchor}` : "";
    return anchor ? `${base.replace(/\/$/, "")}/${locale}/#${anchor}`
                  : `${base.replace(/\/$/, "")}/${locale}/`;
  }

  // ── BibTeX helpers ──
  function bibKey(source) {
    if (source.kind === "preamble")   return "usconst_preamble";
    if (source.kind === "signatures") return "usconst_signatures";
    if (source.kind === "amendment" || source.kind === "amendment-section") {
      const k = "usconst_am" + source.am;
      return source.para ? `${k}_s${source.para}` : k;
    }
    let k = "usconst_a" + source.art;
    if (source.sec) k += "_s" + source.sec;
    if (source.cl)  k += "_c" + source.cl;
    return k;
  }
  function escapeBibTeX(s) {
    // BibTeX is finicky with non-ASCII and braces. Render typographic
    // punctuation back to ASCII; escape special chars.
    return String(s)
      .replace(/\\/g, "\\textbackslash ")
      .replace(/§/g, "{\\S}")
      .replace(/—/g, "---")
      .replace(/–/g, "--")
      .replace(/"/g, "''")
      .replace(/[{}]/g, c => "\\" + c)
      .replace(/[#$%&_]/g, c => "\\" + c);
  }

  // ── Title builder for BibTeX / link text ──
  // Locale-aware via strings; uses long form for titles (Article, Section, Clause).
  function longTitle(source) {
    const constLong = tk("cite.constitution_long", "U.S. Constitution");
    if (source.kind === "preamble")   return `${constLong}, ${tk("section.preamble", "Preamble")}`;
    if (source.kind === "signatures") return `${constLong}, ${tk("section.signatures", "Signatures")}`;

    if (source.kind === "amendment" || source.kind === "amendment-section") {
      const amWord = tk("prefix.amendment", "Amendment");
      let s = `${constLong}, ${amWord} ${arabicToRoman(source.am)}`;
      if (source.para && source.totalParas > 1) {
        s += `, ${tk("prefix.section", "Section")} ${source.para}`;
      }
      return s;
    }

    const artWord = tk("prefix.article", "Article");
    let s = `${constLong}, ${artWord} ${arabicToRoman(source.art)}`;
    if (source.sec && source.hasMultipleSections) {
      s += `, ${tk("prefix.section", "Section")} ${source.sec}`;
    }
    if (source.cl && source.hasMultipleClauses) {
      s += `, ${tk("prefix.clause", "Clause")} ${source.cl}`;
    }
    // Single-section + multi-clause: still emit Clause N (no Section)
    if (source.cl && source.hasMultipleClauses && !source.hasMultipleSections) {
      // Already covered by the hasMultipleClauses branch above; no further work.
    }
    return s;
  }

  // ── Bluebook ──
  // U.S. Const. art. I, § 8, cl. 3.
  // U.S. Const. amend. XIV, § 1.
  // U.S. Const. pmbl.
  function bluebookCite(source) {
    const constShort = tk("cite.constitution_short", "U.S. Const.");
    if (source.kind === "preamble")   return `${constShort} ${tk("cite.bluebook.preamble", "pmbl.")}`;
    if (source.kind === "signatures") return `${constShort} ${tk("cite.bluebook.signatures", "sigs.")}`;

    const sec = tk("cite.bluebook.section", "§");
    const cl  = tk("cite.bluebook.clause",  "cl.");

    if (source.kind === "amendment" || source.kind === "amendment-section") {
      let s = `${constShort} ${tk("cite.bluebook.amend", "amend.")} ${arabicToRoman(source.am)}`;
      if (source.para && source.totalParas > 1) s += `, ${sec} ${source.para}`;
      return s;
    }

    let s = `${constShort} ${tk("cite.bluebook.art", "art.")} ${arabicToRoman(source.art)}`;
    if (source.sec && source.hasMultipleSections) s += `, ${sec} ${source.sec}`;
    if (source.cl  && source.hasMultipleClauses)  s += `, ${cl} ${source.cl}`;
    return s;
  }

  // ── MLA (9th ed.) ──
  // (US Const. art. 1, sec. 8, cl. 3).
  // MLA uses Arabic numerals throughout per Library of Congress guidance.
  function mlaCite(source) {
    const constShort = tk("cite.mla.const", "US Const.");
    if (source.kind === "preamble")   return `${constShort} ${tk("cite.mla.preamble", "preamble")}`;
    if (source.kind === "signatures") return `${constShort} ${tk("cite.mla.signatures", "signatures")}`;

    const sec = tk("cite.mla.section", "sec.");
    const cl  = tk("cite.mla.clause",  "cl.");

    if (source.kind === "amendment" || source.kind === "amendment-section") {
      let s = `${constShort} ${tk("cite.mla.amend", "amend.")} ${source.am}`;
      if (source.para && source.totalParas > 1) s += `, ${sec} ${source.para}`;
      return s;
    }

    let s = `${constShort} ${tk("cite.mla.art", "art.")} ${source.art}`;
    if (source.sec && source.hasMultipleSections) s += `, ${sec} ${source.sec}`;
    if (source.cl  && source.hasMultipleClauses)  s += `, ${cl} ${source.cl}`;
    return s;
  }

  // ── Chicago (notes-bibliography style) ──
  // U.S. Constitution, art. I, § 8, cl. 3.
  function chicagoCite(source) {
    const constLong = tk("cite.constitution_long", "U.S. Constitution");
    if (source.kind === "preamble")   return `${constLong}, ${tk("section.preamble", "Preamble")}`;
    if (source.kind === "signatures") return `${constLong}, ${tk("section.signatures", "Signatures")}`;

    const sec = tk("cite.chicago.section", "§");
    const cl  = tk("cite.chicago.clause",  "cl.");

    if (source.kind === "amendment" || source.kind === "amendment-section") {
      let s = `${constLong}, ${tk("cite.chicago.amend", "amend.")} ${arabicToRoman(source.am)}`;
      if (source.para && source.totalParas > 1) s += `, ${sec} ${source.para}`;
      return s;
    }

    let s = `${constLong}, ${tk("cite.chicago.art", "art.")} ${arabicToRoman(source.art)}`;
    if (source.sec && source.hasMultipleSections) s += `, ${sec} ${source.sec}`;
    if (source.cl  && source.hasMultipleClauses)  s += `, ${cl} ${source.cl}`;
    return s;
  }

  // ── Translation marker (appended for non-EN locales) ──
  function translationMarker(opts) {
    const locale = (opts && opts.locale) || "en";
    if (locale === "en") return "";
    const m = tk("cite.translation_marker", "");
    return m ? ` ${m}` : "";
  }

  // ── Format functions ──
  // Each takes (source, text, opts) and returns the full clipboard payload.

  // Avoid "..": some Bluebook primitives end in a period (pmbl., sigs.) —
  // don't add a second one when the format wants a sentence-ending period.
  function ensurePeriod(s) {
    return /[.!?]$/.test(s) ? s : s + ".";
  }

  function plain(source, text /*, opts */) {
    return text;
  }

  function bluebook(source, text, opts) {
    const cite = ensurePeriod(bluebookCite(source) + translationMarker(opts));
    return `"${text}" ${cite}`;
  }

  function mla(source, text, opts) {
    const cite = mlaCite(source) + translationMarker(opts);
    return `"${text}" (${cite}).`;
  }

  function chicago(source, text, opts) {
    const cite = ensurePeriod(chicagoCite(source) + translationMarker(opts));
    return `"${text}" ${cite}`;
  }

  function markdown(source, text, opts) {
    const cite = bluebookCite(source) + translationMarker(opts);
    const url = urlFor(source, opts);
    // Block quote + em-dash attribution. Each text line is prefixed `> `.
    const quoted = String(text).split("\n").map(l => l ? `> ${l}` : ">").join("\n");
    return url ? `${quoted}\n>\n> — [${cite}](${url})`
               : `${quoted}\n>\n> — ${cite}`;
  }

  function bibtex(source, text, opts) {
    const key   = bibKey(source);
    const title = escapeBibTeX(longTitle(source));
    const url   = urlFor(source, opts);
    const note  = escapeBibTeX(text.length > 200 ? text.slice(0, 197) + "..." : text);
    const lines = [
      `@misc{${key},`,
      `  title  = {${title}},`,
      `  author = {{United States}},`,
      `  year   = {1787},`
    ];
    if (url)  lines.push(`  url    = {${url}},`);
    if (note) lines.push(`  note   = {${note}}`);
    lines.push("}");
    return lines.join("\n");
  }

  // ── Public API ──
  JTC.cite = {
    plain, bluebook, mla, chicago, markdown, bibtex,
    // Helpers exposed for testing / future use.
    _arabicToRoman: arabicToRoman,
    _bluebookCite:  bluebookCite,
    _bibKey:        bibKey,
    _urlFor:        urlFor
  };

  // Format dispatcher — picks the right function from copyMode.
  // Defaults to plain if mode is unknown.
  JTC.formatCitation = function (source, text, mode, opts) {
    const fn = JTC.cite[mode] || JTC.cite.plain;
    return fn(source, String(text || "").trim(), opts || {});
  };
})();
