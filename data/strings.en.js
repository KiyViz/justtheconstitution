// English UI string table — build-time input for i18n.
// This file is read by build.js, NOT served to browsers directly.
// Keys are used across build.js (build-time HTML injection) and
// client JS modules (via the JTC.STRINGS runtime object).

module.exports = {
  // ── Accessibility ──
  "a11y.skip_to_content":     "Skip to the Constitution",

  // ── Page metadata ──
  "meta.title":               "Just the Constitution",
  "meta.description":         "The full text of the United States Constitution and its twenty-seven amendments, paired with the original National Archives parchment. No ads. No commentary. Just the info.",
  "meta.og_title":            "Just the Constitution",
  "meta.og_description":      "The founding document, unabridged. Original text and facsimiles, side by side.",

  // ── Document title / heading ──
  "doc.title":                "The Constitution of the United States",
  "doc.tag":                  "We the People \u00b7 September 17, 1787",

  // ── Sections ──
  "section.main_document":    "Main Document",
  "section.amendments":       "Amendments",
  "section.amendments_intro": "Twenty-seven amendments ratified between 1791 and 1992. The first ten form the Bill of Rights.",
  "section.signatures":       "Signatures",
  "section.preamble":         "Preamble",

  // ── Amendment / Article prefixes ──
  "prefix.amendment":         "Amendment",
  "prefix.ratified":          "Ratified",
  "prefix.commonly_known":    "Commonly known as",
  "prefix.article":           "Article",
  "prefix.section":           "Section",
  "prefix.clause":            "Clause",
  "prefix.paragraph":         "\u00b6",

  // ── Citation ──
  // Legacy — kept for any remaining call sites; prefer
  // cite.constitution_short / cite.constitution_long below.
  "cite.us_constitution":     "U.S. Constitution",
  "cite.source_label":        "Source:",
  // Citation primitives — pulled by citations.js for the locale-aware engine.
  // These are the building blocks of Bluebook/MLA/Chicago citation strings.
  // English values; non-EN locales typically keep these in English (the
  // style guides themselves are anglophone) and rely on cite.translation_marker
  // to flag that the quoted text is a translation.
  "cite.constitution_long":   "U.S. Constitution",
  "cite.constitution_short":  "U.S. Const.",
  "cite.translation_marker":  "",
  "cite.bluebook.preamble":   "pmbl.",
  "cite.bluebook.signatures": "sigs.",
  "cite.bluebook.art":        "art.",
  "cite.bluebook.amend":      "amend.",
  "cite.bluebook.section":    "§",
  "cite.bluebook.clause":     "cl.",
  "cite.mla.const":           "US Const.",
  "cite.mla.preamble":        "preamble",
  "cite.mla.signatures":      "signatures",
  "cite.mla.art":             "art.",
  "cite.mla.amend":           "amend.",
  "cite.mla.section":         "sec.",
  "cite.mla.clause":          "cl.",
  "cite.chicago.art":         "art.",
  "cite.chicago.amend":       "amend.",
  "cite.chicago.section":     "§",
  "cite.chicago.clause":      "cl.",

  // ── Copy buttons ──
  "copy.excerpt":             "Copy excerpt",
  "copy.passage":             "Copy passage",
  "copy.all":                 "Copy all",
  "copy.to_clipboard":        "Copy to clipboard",

  // ── Toast messages ──
  "toast.copied":             "Copied",
  "toast.copy_failed":        "Copy failed",
  "toast.link_copied":        "Link copied",

  // ── Header buttons ──
  "btn.contents":             "Contents",
  "btn.contents_aria":        "Open table of contents",
  "btn.search_aria":          "Search the document",
  "btn.search_title":         "Search (Ctrl/Cmd+F)",
  "btn.share":                "Share",
  "btn.share_aria":           "Share",
  "btn.reader_aria":          "Pure reader mode",
  "btn.reader_title":         "Reader mode",
  "btn.mode_aria":            "Toggle dark mode",
  "btn.mode_title":           "Dark / light",
  "btn.settings_aria":        "Open settings",
  "btn.settings_title":       "Settings",

  // ── Search bar ──
  "search.placeholder":       "Search the document",
  "search.prev_aria":         "Previous match",
  "search.prev_title":        "Previous (Shift+Enter)",
  "search.next_aria":         "Next match",
  "search.next_title":        "Next (Enter)",
  "search.close_aria":        "Close search",
  "search.close_title":       "Close (Esc)",
  "search.no_results":        "No results",
  "search.counter":           "{current} of {total}",

  // ── Progress bar ──
  "progress.aria":            "Reading progress",
  "progress.preamble":        "Preamble",
  "progress.preamble_short":  "Pre",
  "progress.signatures":      "Signatures",
  "progress.signatures_short":"Sig",

  // ── TOC ──
  "toc.drawer_aria":          "Table of contents",
  "toc.close_aria":           "Close contents",
  "toc.inline_aria":          "Contents (sidebar)",
  "toc.download_aria":        "Download Markdown transcript",
  "toc.download_title":       "Download transcript",

  // ── Text pane ──
  "text.pane_aria":           "Constitution text",

  // ── Image pane ──
  "image.pane_aria":          "Original parchment image",
  "image.page_tag_prefix":    "PAGE 0",
  "image.prev_aria":          "Previous page image",
  "image.prev_title":         "Previous image",
  "image.next_aria":          "Next page image",
  "image.next_title":         "Next image",
  "image.zoom_aria":          "Zoom in",
  "image.zoom_title":         "Zoom",
  "image.download_aria":      "Download high-res",
  "image.download_title":     "Download",
  "image.collapse_aria":      "Hide parchment pane",
  "image.collapse_title":     "Hide parchment",
  "image.expand_aria":        "Show parchment pane",
  "image.expand_title":       "Show parchment",
  "image.frame_aria":         "Original Constitution parchment",
  "image.img_alt":            "Original parchment, current page",
  "image.source_link":        "High-res \u2197",
  "image.error_prefix":       "Couldn\u2019t load",
  "image.error_view":         "View the",
  "image.error_link":         "high-res originals",
  "image.error_suffix":       "on the National Archives.",
  "image.page_caption_1":     "Preamble through Article I, \u00a77",
  "image.page_caption_2":     "Article I, \u00a78 through Article II, \u00a71",
  "image.page_caption_3":     "Article II, \u00a72 through Article IV",
  "image.page_caption_4":     "Article V through signatures",
  "image.bor_title":          "Bill of Rights",
  "image.bor_tag":            "BILL OF RIGHTS",
  "image.bor_caption":        "Ratified December 15, 1791 \u2014 Amendments I\u2013X",
  "image.view_original":      "View original page",
  "image.page_chip":          "Page {n} →",

  // ── Lightbox ──
  "lb.aria":                  "Enlarged parchment",
  "lb.caption_label":         "Caption",
  "lb.zoom_out_aria":         "Zoom out",
  "lb.zoom_out_title":        "Zoom out",
  "lb.zoom_in_aria":          "Zoom in",
  "lb.zoom_in_title":         "Zoom in",
  "lb.reset_aria":            "Reset zoom",
  "lb.reset_title":           "Reset",
  "lb.download_aria":         "Download full-res",
  "lb.download_title":        "Download full-res",
  "lb.download_span":         "Full res",
  "lb.close_aria":            "Close",
  "lb.close_title":           "Close",
  "lb.img_alt":               "Full-resolution parchment",

  // ── Settings panel ──
  "settings.title":           "Settings",
  "settings.close_aria":      "Close settings",
  "settings.tools":           "Tools",
  "settings.mode":            "Mode",
  "settings.mode_light":      "Light",
  "settings.mode_dark":       "Dark",
  "settings.mode_oled":       "OLED",
  "settings.color":           "Color",
  // Copy / citation format — shown above the fold in the settings pane.
  // Short labels, characters at a premium.
  "settings.copy_label":      "Copy",
  "settings.copy_plain":      "Plain",
  "settings.copy_bluebook":   "Bluebook",
  "settings.copy_mla":        "MLA",
  "settings.copy_chicago":    "Chicago",
  "settings.copy_markdown":   "MD",
  "settings.copy_bibtex":     "BibTeX",
  "settings.text_size":       "Text size",
  "settings.size_small":      "Small",
  "settings.size_medium":     "Medium",
  "settings.size_large":      "Large",
  "settings.advanced":        "Advanced settings",
  "settings.saturation":      "Saturation",
  "settings.sat_default":     "Default",
  "settings.sat_vibrant":     "Vibrant",
  "settings.typeface":        "Typography",
  "settings.font_default":    "Default",
  "settings.font_serif":      "Serif",
  "settings.font_sans":       "Sans-serif",
  "settings.font_mono":       "Mono",
  "settings.reset_aria":      "Reset all settings to defaults",
  "settings.reset_title":     "Reset settings",
  "settings.reset_toast":     "Settings reset",
  "settings.switch_dark":     "Switch to dark mode",
  "settings.switch_dark_short":"Switch to dark",
  "settings.switch_oled":     "Switch to OLED",
  "settings.switch_oled_short":"Switch to OLED",
  "settings.switch_light":    "Switch to light mode",
  "settings.switch_light_short":"Switch to light",

  // ── Reader mode overlay ──
  "reader.exit_aria":         "Exit reader",
  "reader.exit_label":        "Exit reader",
  "reader.switch_mode_aria":  "Switch mode",
  "reader.switch_mode_title": "Light / Dark / OLED",
  "reader.settings_aria":     "Open settings",
  "reader.settings_title":    "Settings",

  // ── Share popover ──
  "share.aria":               "Share",
  "share.copy_link":          "Copy link",
  "share.email":              "Email",
  "share.more":               "More\u2026",
  "share.email_body_prefix":  "Thought you might find this useful:\n\n",
  "share.toast_default":      "Link copied",

  // ── Download CTA ──
  "download.heading":         "Take it with you.",
  "download.description":     "The full document \u2014 preamble, articles, signatures, all twenty-seven amendments \u2014 as a single Markdown file. Readable anywhere.",
  "download.button":          "Download Markdown",
  "download.filename":        "us-constitution.md",
  "download.hint":            "us-constitution.md",

  // ── Markdown export ──
  "md.source_footer":         "Source: [justtheconstitution.org](https://justtheconstitution.org)",

  // ── Footer ──
  "footer.sources":           "Sources.",
  "footer.national_archives": "National Archives",
  "footer.images":            "Images.",
  "footer.images_link":       "National Archives \u2014 High Resolution Downloads",
  "footer.tagline":           "No ads. No commentary. Just the info.",

  // ── Language switcher ──
  "lang.button_aria":         "Change language",
  "lang.button_title":        "Language",

  // ── Schema.org ──
  "schema.name":              "Constitution of the United States",

  // ── Ordinal suffixes (for amendment image labels) ──
  "ordinal.st":               "st",
  "ordinal.nd":               "nd",
  "ordinal.rd":               "rd",
  "ordinal.th":               "th"
};
