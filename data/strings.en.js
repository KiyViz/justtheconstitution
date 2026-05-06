// English UI string table — build-time input for i18n.
// This file is read by build.js, NOT served to browsers directly.
// Keys are used across build.js (build-time HTML injection) and
// client JS modules (via the JTC.STRINGS runtime object).

module.exports = {
  // ── Accessibility ──
  "a11y.skip_to_content":     "Skip to the Constitution",

  // ── Page metadata ──
  "meta.title":               "U.S. Constitution — Full Text & All 27 Amendments | justtheconstitution.org",
  "meta.description":         "The full text of the United States Constitution and its twenty-seven amendments, paired with the original National Archives parchment. No ads. No commentary. Just the info.",
  "meta.og_title":            "Just the Constitution",
  "meta.og_description":      "The full text of the U.S. Constitution and all 27 amendments. No ads. No commentary. No paywall. Just the founding document.",

  // ── Document title / heading ──
  "doc.title":                "The Constitution of the United States",
  "doc.subtitle":             "The complete text, as inscribed in 1787, with all twenty-seven amendments.",
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
  "download.description":     "The full document \u2014 preamble, articles, signatures, all twenty-seven amendments \u2014 as a plain text file. Works offline, in any app.",
  "download.button":          "Download transcript",
  "download.filename":        "us-constitution.md",
  "download.hint":            "us-constitution.md \u00b7 plain text",

  // ── Markdown export ──
  "md.source_footer":         "Source: [justtheconstitution.org](https://justtheconstitution.org)",

  // ── Footer ──
  "footer.sources":           "Sources.",
  "footer.national_archives": "National Archives",
  "footer.images":            "Images.",
  "footer.images_link":       "National Archives \u2014 High Resolution Downloads",
  "footer.tagline":           "No ads. No commentary. Just the information.",
  "footer.byline":            "A KiyViz project.",
  "footer.info_link":         "About · Privacy · Contact",
  "footer.contact_email":     "feedback@justtheconstitution.org",

  // ── Info page ──
  "info.title":               "About — Just the Constitution",
  "info.meta_description":    "What justtheconstitution.org is, why it exists, and how we handle your data.",
  "info.mission_heading":     "About this site",
  "info.mission_p1":          "justtheconstitution.org presents the full text of the United States Constitution and its twenty-seven amendments alongside facsimiles of the original parchment. No ads. No commentary. No paywall. Just the founding document, readable and free.",
  "info.mission_p2":          "The site is open to everyone—students, educators, researchers, or anyone who wants to read the document that defines American governance.",

  "info.faq_heading":         "Frequently Asked Questions",
  "info.faq_q1":              "What is this site?",
  "info.faq_a1":              "A free, ad-free reading experience for the US Constitution. The full text with the original parchment scans displayed side by side.",
  "info.faq_q2":              "Where does the text come from?",
  "info.faq_a2":              "Articles I–VII and signatures are transcribed from the National Archives, preserving original spelling and punctuation. Amendments I–XXVII come from the National Constitution Center. Both sources were compared; no discrepancies were found.",
  "info.faq_q3":              "Is this an official government website?",
  "info.faq_a3":              "No. This is an independent project. The text and images are sourced from official government archives but this site is not affiliated with or endorsed by any government agency.",
  "info.faq_q4":              "Can I download the text?",
  "info.faq_a4":              "Yes. A Markdown download is available at the bottom of the reading page. It contains the complete document including all amendments.",
  "info.faq_q5":              "Why is the spelling unusual?",
  "info.faq_a5":              "The original 1787 document uses 18th-century English spelling and capitalization. We preserve it exactly as inscribed by Jacob Shallus on the parchment.",
  "info.faq_q6":              "How do I cite this?",
  "info.faq_a6":              "Use the copy button on any paragraph to get a formatted citation in Bluebook, MLA, or Chicago style. The citation engine generates the reference automatically.",

  "info.privacy_heading":     "Privacy",
  "info.privacy_updated":     "Last updated May 2026.",
  "info.privacy_no_cookies":  "This site does not use cookies. We do not track you. We do not sell data.",
  "info.privacy_analytics":   "We use Cloudflare Web Analytics to monitor site performance. This collects anonymized, aggregated data (page views, country-level geography, referrer) with no personally identifiable information. It is cookie-free and EU-compliant.",
  "info.privacy_localstorage":"Your reading position and display preferences are saved in your browser’s local storage so you can pick up where you left off. This data never leaves your device.",
  "info.privacy_contact":     "If you contact us through the form below, we use your email address solely to reply. We do not add you to any mailing list or share your information with third parties.",

  "info.contact_heading":     "Contact",
  "info.contact_intro":       "Questions, corrections, or feedback—we’d like to hear from you.",
  "info.contact_email_label": "Your email",
  "info.contact_category_label": "Category",
  "info.contact_category_placeholder": "Select a category…",
  "info.contact_cat_general": "General Feedback",
  "info.contact_cat_bug":     "Bug Report",
  "info.contact_cat_content": "Content Suggestion",
  "info.contact_cat_accessibility": "Accessibility Issue",
  "info.contact_rating_label": "How would you rate your experience?",
  "info.contact_msg_label":   "Tell us why",
  "info.contact_msg_placeholder": "What prompted this rating?",
  "info.contact_submit":      "Send",
  "info.contact_success":     "Message sent. Thank you.",
  "info.contact_error":       "Something went wrong. Please try the email link below.",
  "info.contact_alt":         "Or email directly: feedback@justtheconstitution.org",

  // ── Language switcher ──
  "lang.button_aria":         "Change language",
  "lang.button_title":        "Language",

  // ── Educators page ──
  "educators.title":          "For Educators — Just the Constitution",
  "educators.meta_description": "Use justtheconstitution.org in your classroom. Direct links to every article and amendment, citation guide, and sharing tools for students.",
  "educators.heading":        "For Educators",
  "educators.intro":          "justtheconstitution.org is built for the classroom. Ad-free, distraction-free, and available on any device your students use. No accounts, no logins, no cost.",
  "educators.use_heading":    "How to use this in your classroom",
  "educators.use_p1":         "The reading page is designed for both guided and independent study:",
  "educators.use_li1":        "Assign specific sections using the direct links below — students land exactly where you want them.",
  "educators.use_li2":        "The built-in citation engine generates Bluebook, MLA, and Chicago references automatically. Students copy a paragraph and get a properly formatted citation.",
  "educators.use_li3":        "Reading progress is saved locally in each student's browser. They can resume where they left off without creating an account.",
  "educators.use_li4":        "Works on phones, tablets, and laptops. Dark mode and adjustable text size accommodate different reading environments.",
  "educators.links_heading":  "Direct links to key sections",
  "educators.links_intro":    "Share these links with students or paste them into your syllabus. Each opens the reading page scrolled to the exact section.",
  "educators.link_preamble":  "Preamble",
  "educators.link_art1":      "Article I — The Legislature",
  "educators.link_art2":      "Article II — The Executive",
  "educators.link_art3":      "Article III — The Judiciary",
  "educators.link_amendments":"All Amendments",
  "educators.link_bor":       "Bill of Rights (Amendments I–X)",
  "educators.link_13th":      "13th Amendment — Abolition of Slavery",
  "educators.link_14th":      "14th Amendment — Equal Protection",
  "educators.link_19th":      "19th Amendment — Women's Suffrage",
  "educators.cite_heading":   "How students should cite",
  "educators.cite_p1":        "Every paragraph on the reading page has a copy button. Tap it to choose a citation format: Bluebook, MLA, Chicago, Markdown, or BibTeX.",
  "educators.cite_p2":        "The citation engine identifies the exact article, section, and clause automatically. No manual formatting required.",
  "educators.share_heading":  "Share with your class",
  "educators.share_p1":       "Copy and send this link to your students. It works on any device, requires no setup, and will never ask them to sign up for anything.",
  "educators.share_url":      "justtheconstitution.org",

  // ── Schema.org ──
  "schema.name":              "Constitution of the United States",

  // ── Ordinal suffixes (for amendment image labels) ──
  "ordinal.st":               "st",
  "ordinal.nd":               "nd",
  "ordinal.rd":               "rd",
  "ordinal.th":               "th"
};
