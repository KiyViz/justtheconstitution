# Just the Constitution

**Ratified in 1788. Built for 2026.**

**Live site: [justtheconstitution.org](https://justtheconstitution.org)** · [Español](https://justtheconstitution.org/es/)

Just the Constitution is a clean, modern web edition of the United States
Constitution and all twenty-seven amendments. Every line is citeable,
shareable, and searchable. No ads. No commentary. No paywall.

![Just the Constitution — Ratified in 1788. Built for 2026.](og-image.png)

## Features

- **Full text, faithfully transcribed** — Articles I–VII preserve the original
  1787 spelling, capitalization, and punctuation as inscribed by Jacob Shallus
  on the parchment.
- **Line-level deep links** — every paragraph has a stable anchor. Share a
  clause, not a homepage.
- **Citation engine** — copy any paragraph as a formatted citation in
  Bluebook, MLA, Chicago, Markdown, or BibTeX. The article, section, and
  clause are identified automatically.
- **Original parchment, side by side** — high-resolution National Archives
  facsimiles paired with the text.
- **English and Spanish** — matching document structure, validated at build time.
  The Spanish text is the National Archives translation; see the sources below.
- **Full-text search**, dark mode, reader mode, keyboard shortcuts, and a
  Markdown download of the complete document.
- **[For educators](https://justtheconstitution.org/en/for-educators/)** — a
  dedicated page for classroom use.

## Privacy

No ads. No cookies. No accounts. The only measurement is Cloudflare Web
Analytics — cookie-free, anonymized, aggregate page counts — disclosed in
full at [/info/](https://justtheconstitution.org/en/info/). Reading position
and display preferences live in your browser's local storage and never leave
your device.

## How it's built

No framework. Plain HTML, CSS, and JavaScript assembled by a custom build
script:

- `build.js` generates the site from `index.template.html`, `templates/`,
  and per-locale string tables in `data/` (`strings.en.js` / `strings.es.js`,
  `constitution.js` / `constitution.es.js`).
- The build validates EN/ES structural parity (same articles, sections, and
  paragraphs) and injects meta tags, JSON-LD, sitemaps, and cache-busting
  hashes.
- Generated HTML, sitemaps, and locale runtime strings are committed alongside
  source. Other minified assets are ignored and rebuilt for deployment.
  **Edit source, not generated files** — the next build overwrites them.

```
npm install
node build.js
npm test
```

Deployed on Cloudflare Workers as static assets.

## Text provenance

- Articles I–VII and signatures: transcribed from the
  [National Archives](https://www.archives.gov/founding-docs/constitution-transcript).
- Amendments I–XXVII: [National Constitution Center](https://constitutioncenter.org/the-constitution/full-text).
- Spanish text: the [National Archives translation](https://www.archives.gov/espanol/constitucion),
  copied verbatim. Gaps and passage handling are documented in
  [Text provenance and review scope](docs/text-provenance.md).
- Parchment scans: [National Archives downloads](https://www.archives.gov/founding-docs/downloads).

This is an independent project. It is not affiliated with or endorsed by any
government agency.

## Regression checks and deployment notes

`npm test` runs the minified build, deterministic-output and citation checks,
Markdown/clipboard checks, and 43 isolated contact tests with mocked upstreams.
`npm run test:browser` additionally uses an externally installed Playwright
and Edge (`JTC_BROWSER=chrome` selects Chrome). Set `NODE_PATH` to the directory
containing Playwright if it is not on the usual module path. The browser checks
serve local files and submit no real contact messages.

See the
[required production HTTPS/Turnstile configuration](docs/security-delivery-implementation.md).

## Feedback and support

The site is in **beta 0.1** ahead of a full release on Constitution Day,
September 17, 2026.

- **Feedback**: the [contact form](https://justtheconstitution.org/en/info/)
  (with categories for bugs, content, and accessibility) or
  [feedback@justtheconstitution.org](mailto:feedback@justtheconstitution.org).
- **Support**: the site is built and maintained by one person and is
  self-funded. If it's useful to you, [Ko-fi](https://ko-fi.com/justtheconstitution)
  contributions cover the domain and email. Everything else is donated time.

## License

Code is [MIT](LICENSE). The text of the Constitution is public domain.
