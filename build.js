#!/usr/bin/env node
/* ===== justtheconstitution — build =====
   Multi-locale static build. Reads data/constitution.{locale}.js and
   data/strings.{locale}.js, emits per-locale HTML + sitemap + a tiny
   runtime strings file into {locale}/index.html.

   Zero runtime dependencies. Node stdlib only.
   Run: node build.js
   Must be idempotent: two runs produce byte-identical output.
*/
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');

const ROOT = __dirname;
const SITE_URL = 'https://justtheconstitution.org/';
const TEMPLATE = path.join(ROOT, 'index.template.html');
const MARKER = '<!-- BUILD:CONTENT -->';
const SCRIPTS_MARKER = '<!-- BUILD:SCRIPTS -->';
const HEAD_MARK_START = '<!-- BUILD:HEAD-START -->';
const HEAD_MARK_END = '<!-- BUILD:HEAD-END -->';

// ── Locale configuration ──
const LOCALES = {
  en: {
    data: 'data/constitution.js',
    strings: 'data/strings.en.js',
    nativeName: 'English'
  },
  es: {
    data: 'data/constitution.es.js',
    strings: 'data/strings.es.js',
    nativeName: 'Español'
  }
};

// ── Helpers ──
function esc(s) {
  return String(s).replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

function loadConstitution(filePath) {
  const src = fs.readFileSync(path.join(ROOT, filePath), 'utf8');
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(src, ctx, { filename: filePath });
  if (!ctx.window.CONSTITUTION) {
    throw new Error(`${filePath} did not set window.CONSTITUTION`);
  }
  return ctx.window.CONSTITUTION;
}

function loadStrings(filePath) {
  // strings files are CommonJS modules
  return require(path.join(ROOT, filePath));
}

// ── Structural validation ──
function validateLocaleData(en, locale, localeName) {
  const errors = [];
  if (locale.articles.length !== en.articles.length)
    errors.push(`Article count mismatch: en=${en.articles.length}, ${localeName}=${locale.articles.length}`);
  en.articles.forEach((a, i) => {
    const la = locale.articles[i];
    if (!la) { errors.push(`Missing article ${a.id}`); return; }
    if (la.sections.length !== a.sections.length)
      errors.push(`${a.id}: section count mismatch (en=${a.sections.length}, ${localeName}=${la.sections.length})`);
    a.sections.forEach((s, j) => {
      if (!la.sections[j]) { errors.push(`Missing section ${s.id}`); return; }
      if (la.sections[j].paragraphs.length !== s.paragraphs.length)
        errors.push(`${s.id}: paragraph count mismatch (en=${s.paragraphs.length}, ${localeName}=${la.sections[j].paragraphs.length})`);
    });
  });
  if (locale.amendments.length !== en.amendments.length)
    errors.push(`Amendment count mismatch: en=${en.amendments.length}, ${localeName}=${locale.amendments.length}`);
  en.amendments.forEach((am, i) => {
    const la = locale.amendments[i];
    if (!la) { errors.push(`Missing amendment ${am.id}`); return; }
    if (la.paragraphs.length !== am.paragraphs.length)
      errors.push(`${am.id}: paragraph count mismatch (en=${am.paragraphs.length}, ${localeName}=${la.paragraphs.length})`);
  });
  if (errors.length) {
    throw new Error(`Locale "${localeName}" structural validation failed:\n  ${errors.join('\n  ')}`);
  }
}

// ── Content rendering ──
function renderContent(C, S) {
  const L = [];
  const ind = '      ';

  L.push(`${ind}<h1 class="doc-title">${esc(S["doc.title"])}</h1>`);
  L.push(`${ind}<div class="doc-tag">${esc(S["doc.tag"])}</div>`);

  // Preamble
  L.push(`${ind}<section id="${esc(C.preamble.id)}" class="anchor" data-chapter="preamble">`);
  L.push(`${ind}  <p class="preamble">${esc(C.preamble.text)}</p>`);
  L.push(`${ind}</section>`);

  // Articles
  C.articles.forEach(a => {
    L.push(`${ind}<section id="${esc(a.id)}" class="anchor" data-chapter="${esc(a.id)}">`);
    L.push(`${ind}  <div class="section-drop">`);
    L.push(`${ind}    <div class="article-head">`);
    L.push(`${ind}      <h2>${esc(a.label)}</h2>`);
    if (a.subtitle) L.push(`${ind}      <div class="article-sub">${esc(a.subtitle)}</div>`);
    L.push(`${ind}    </div>`);
    L.push(`${ind}  </div>`);

    a.sections.forEach(s => {
      const dataPage = (s.page && s.page !== a.page) ? ` data-page="${esc(s.page)}"` : '';
      L.push(`${ind}  <section id="${esc(s.id)}" class="anchor" data-chapter="${esc(a.id)}"${dataPage}>`);
      if (s.label || s.heading) {
        L.push(`${ind}    <div class="section-head">`);
        if (s.label) L.push(`${ind}      <span class="section-num">${esc(s.label)}</span>`);
        if (s.heading) L.push(`${ind}      <h3>${esc(s.heading)}</h3>`);
        L.push(`${ind}    </div>`);
      }
      s.paragraphs.forEach(p => L.push(`${ind}    <p>${esc(p)}</p>`));
      L.push(`${ind}  </section>`);
    });
    L.push(`${ind}</section>`);
  });

  // Signatures
  const footnotes = [];
  const pres = C.signatures.president;
  footnotes.push({ signed: pres.signed, common: pres.common });
  const presNum = footnotes.length;

  L.push(`${ind}<section id="signatures" class="anchor signatures" data-chapter="signatures">`);
  L.push(`${ind}  <div class="signatures__pres">`);
  L.push(`${ind}    <div class="name">${esc(pres.signed)}<sup>${presNum}</sup></div>`);
  L.push(`${ind}    <div class="role">${esc(pres.role)}</div>`);
  L.push(`${ind}  </div>`);
  L.push(`${ind}  <div class="signatures__grid">`);
  C.signatures.groups.forEach(g => {
    L.push(`${ind}    <div class="sig-group">`);
    L.push(`${ind}      <div class="state">${esc(g.state)}</div>`);
    L.push(`${ind}      <ul>`);
    g.names.forEach(n => {
      if (typeof n === 'string') {
        L.push(`${ind}        <li>${esc(n)}</li>`);
      } else {
        footnotes.push({ signed: n.signed, common: n.common });
        L.push(`${ind}        <li>${esc(n.signed)}<sup>${footnotes.length}</sup></li>`);
      }
    });
    L.push(`${ind}      </ul>`);
    L.push(`${ind}    </div>`);
  });
  L.push(`${ind}  </div>`);
  if (footnotes.length) {
    L.push(`${ind}  <ol class="sig-footnotes">`);
    footnotes.forEach(f => {
      const end = f.common.endsWith('.') ? '' : '.';
      L.push(`${ind}    <li>${esc(S["prefix.commonly_known"])} ${esc(f.common)}${end}</li>`);
    });
    L.push(`${ind}  </ol>`);
  }
  L.push(`${ind}</section>`);

  // Amendments heading
  L.push(`${ind}<section id="amendments" class="anchor amendments-head" data-chapter="amendments">`);
  L.push(`${ind}  <h2>${esc(S["section.amendments"])}</h2>`);
  L.push(`${ind}  <div class="sub">${esc(S["section.amendments_intro"])}</div>`);
  L.push(`${ind}</section>`);

  // Amendments
  C.amendments.forEach(am => {
    L.push(`${ind}<section id="${esc(am.id)}" class="anchor amendment" data-chapter="amendments" data-amnum="${esc(am.num)}">`);
    L.push(`${ind}  <div class="amendment__meta">`);
    L.push(`${ind}    <span class="amendment__num">${esc(S["prefix.amendment"])} ${esc(am.num)}</span>`);
    L.push(`${ind}    <span class="amendment__year">${esc(S["prefix.ratified"])} ${esc(am.year)}</span>`);
    L.push(`${ind}  </div>`);
    L.push(`${ind}  <h3>${esc(am.label)}</h3>`);
    L.push(`${ind}  <div class="amendment__sub">${esc(am.subtitle)}</div>`);
    am.paragraphs.forEach(p => L.push(`${ind}  <p>${esc(p)}</p>`));
    L.push(`${ind}</section>`);
  });

  // Download CTA
  L.push(`${ind}<section class="download-cta">`);
  L.push(`${ind}  <h2>${esc(S["download.heading"])}</h2>`);
  L.push(`${ind}  <p>${esc(S["download.description"])}</p>`);
  L.push(`${ind}  <div class="download-cta__hint">${esc(S["download.hint"])}</div>`);
  L.push(`${ind}</section>`);

  return L.join('\n');
}

// ── Head injection (canonical, hreflang, OG, JSON-LD) ──
function renderHeadExtras(locale, S) {
  const localeUrl = `${SITE_URL}${locale}/`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Legislation',
    name: S['schema.name'],
    legislationType: 'Constitution',
    inLanguage: locale,
    datePublished: '1787-09-17',
    url: localeUrl
  };
  const lines = [
    `  <link rel="canonical" href="${localeUrl}" />`,
    ...Object.keys(LOCALES).map(l =>
      `  <link rel="alternate" hreflang="${l}" href="${SITE_URL}${l}/" />`
    ),
    `  <link rel="alternate" hreflang="x-default" href="${SITE_URL}en/" />`,
    `  <meta property="og:url" content="${localeUrl}" />`,
    `  <meta property="og:title" content="${esc(S['meta.og_title'] || S['meta.title'])}" />`,
    `  <meta property="og:description" content="${esc(S['meta.og_description'])}" />`,
    `  <meta property="og:image" content="${SITE_URL}og-image.png" />`,
    `  <meta name="twitter:card" content="summary_large_image" />`,
    `  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`
  ];
  return [`  ${HEAD_MARK_START}`, ...lines, `  ${HEAD_MARK_END}`].join('\n');
}

function injectHead(html, extras) {
  const startIdx = html.indexOf(HEAD_MARK_START);
  if (startIdx !== -1) {
    const endIdx = html.indexOf(HEAD_MARK_END, startIdx);
    if (endIdx === -1) throw new Error('Template has HEAD-START marker but no HEAD-END.');
    const before = html.slice(0, startIdx - 2);
    const after = html.slice(endIdx + HEAD_MARK_END.length);
    return before + extras + after;
  }
  const idx = html.indexOf('</head>');
  if (idx === -1) throw new Error('Template has no </head>.');
  return html.slice(0, idx) + extras + '\n' + html.slice(idx);
}

// ── Runtime strings injection ──
// Client JS modules call JTC.t(key) for strings created dynamically at runtime.
// build.js emits a per-locale strings.min.js with only the keys the client needs.
const CLIENT_KEYS = [
  'toast.copied', 'toast.copy_failed', 'toast.link_copied',
  'copy.excerpt', 'copy.passage', 'copy.all', 'copy.to_clipboard',
  'search.no_results', 'search.counter',
  'settings.switch_dark', 'settings.switch_dark_short',
  'settings.switch_oled', 'settings.switch_oled_short',
  'settings.switch_light', 'settings.switch_light_short',
  'settings.mode', 'settings.mode_light', 'settings.mode_dark',
  'settings.mode_oled', 'settings.color', 'settings.typeface',
  'settings.font_simple', 'settings.font_traditional', 'settings.font_technical',
  'settings.reading_mode', 'settings.reader_default', 'settings.reader_pure',
  'settings.copy_label', 'settings.copy_citation', 'settings.copy_plain',
  'settings.text_size',
  'section.main_document', 'section.amendments', 'section.preamble',
  'section.signatures', 'section.amendments_intro',
  'prefix.amendment', 'prefix.ratified', 'prefix.commonly_known',
  'prefix.article', 'prefix.section', 'prefix.paragraph',
  'cite.us_constitution', 'cite.source_label',
  'share.email_body_prefix',
  'download.button', 'download.filename', 'download.heading',
  'download.description', 'download.hint',
  'md.source_footer', 'doc.title', 'doc.tag',
  'progress.preamble', 'progress.preamble_short',
  'progress.signatures', 'progress.signatures_short',
  'image.source_link', 'image.error_prefix', 'image.error_view',
  'image.error_link', 'image.error_suffix',
  'image.page_tag_prefix', 'image.view_original',
  'image.page_caption_1', 'image.page_caption_2',
  'image.page_caption_3', 'image.page_caption_4',
  'image.bor_title', 'image.bor_tag', 'image.bor_caption',
  'ordinal.st', 'ordinal.nd', 'ordinal.rd', 'ordinal.th',
  'lang.button_aria', 'lang.button_title'
];

function buildRuntimeStrings(S) {
  const subset = {};
  CLIENT_KEYS.forEach(k => { if (S[k] != null) subset[k] = S[k]; });
  return `window.JTC=window.JTC||{};window.JTC.STRINGS=${JSON.stringify(subset)};window.JTC.t=function(k){return this.STRINGS[k]||k;};`;
}

// ── Template string replacement ──
// Replace <!-- S:key --> markers in the template with string values
function injectTemplateStrings(html, S) {
  return html.replace(/<!-- S:([a-z0-9._]+) -->/g, (_, key) => {
    if (S[key] == null) {
      console.warn(`  warning: string key "${key}" not found in string table`);
      return key;
    }
    return esc(S[key]);
  });
}

// ── Script tags ──
// Short content hash for cache busting — changes when file content changes.
function fileHash(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
}

function renderScripts(locale, config) {
  // Helper: append ?v=hash to a root-relative script path
  function src(relPath) {
    const absPath = path.join(ROOT, relPath.replace(/^\.\.\//, ''));
    const hash = fileHash(absPath);
    return `${relPath}?v=${hash}`;
  }
  const dataPath = `../${config.data}`;
  const lines = [
    `  <script src="strings.min.js"></script>`,
    `  <script src="${src(dataPath)}"></script>`,
    `  <script src="${src('../core.js')}"></script>`,
    `  <script src="${src('../tweaks.js')}"></script>`,
    `  <script src="${src('../images.js')}"></script>`,
    `  <script src="${src('../reader.js')}"></script>`,
    `  <script src="${src('../progress.js')}"></script>`,
    `  <script src="${src('../nav.js')}"></script>`,
    `  <script src="${src('../search.js')}"></script>`,
    `  <script src="${src('../lang.js')}"></script>`,
    `  <script src="${src('../app.js')}"></script>`
  ];
  return lines.join('\n');
}

// ── Locale metadata for the lang switcher ──
function localesMetaJson() {
  return JSON.stringify(
    Object.entries(LOCALES).map(([code, cfg]) => ({ code, name: cfg.nativeName }))
  );
}

// ── Sitemap ──
function renderLocaleSitemap(C, locale) {
  const base = `${SITE_URL}${locale}/`;
  const anchors = [
    'preamble',
    ...C.articles.flatMap(a => [a.id, ...a.sections.map(s => s.id)]),
    'signatures',
    'amendments',
    ...C.amendments.map(am => am.id)
  ];
  const hreflangs = Object.keys(LOCALES).map(l =>
    `      <xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}${l}/"/>`
  ).join('\n');
  const defaultHreflang = `      <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}en/"/>`;

  const urls = [
    `  <url>\n    <loc>${base}</loc>\n${hreflangs}\n${defaultHreflang}\n  </url>`,
    ...anchors.map(id =>
      `  <url>\n    <loc>${base}#${id}</loc>\n  </url>`
    )
  ].join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}

function renderSitemapIndex() {
  const sitemaps = Object.keys(LOCALES).map(l =>
    `  <sitemap>\n    <loc>${SITE_URL}${l}/sitemap.xml</loc>\n  </sitemap>`
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}
</sitemapindex>
`;
}

function updateRobotsTxt() {
  const robotsPath = path.join(ROOT, 'robots.txt');
  const sitemapLine = `Sitemap: ${SITE_URL}sitemap.xml`;
  let body = '';
  if (fs.existsSync(robotsPath)) {
    body = fs.readFileSync(robotsPath, 'utf8');
    if (body.split(/\r?\n/).some(ln => ln.trim() === sitemapLine)) return 'unchanged';
    // Remove old per-locale sitemap lines if present
    body = body.split(/\r?\n/).filter(ln => !ln.trim().startsWith('Sitemap:')).join('\n');
    if (body.length && !body.endsWith('\n')) body += '\n';
  } else {
    body = 'User-agent: *\nAllow: /\n\n';
  }
  body += sitemapLine + '\n';
  fs.writeFileSync(robotsPath, body);
  return 'updated';
}

// ── Main ──
function main() {
  if (!fs.existsSync(TEMPLATE)) {
    throw new Error(`Missing ${path.relative(ROOT, TEMPLATE)}. Rename index.html → index.template.html and insert ${MARKER} inside <article id="text-pane"> first.`);
  }
  const template = fs.readFileSync(TEMPLATE, 'utf8');
  if (!template.includes(MARKER)) {
    throw new Error(`Template is missing ${MARKER}. Insert it inside <article id="text-pane">.`);
  }

  const localesMeta = localesMetaJson();
  const enData = loadConstitution(LOCALES.en.data);

  for (const [locale, config] of Object.entries(LOCALES)) {
    console.log(`\n── Building locale: ${locale} (${config.nativeName}) ──`);

    const C = loadConstitution(config.data);
    const S = loadStrings(config.strings);

    // Validate non-English locales against English structure
    if (locale !== 'en') {
      validateLocaleData(enData, C, locale);
      console.log(`  structural validation passed`);
    }

    // Render content HTML
    const content = renderContent(C, S);

    // Start from template
    let html = template;

    // Set lang attribute
    html = html.replace('lang="en"', `lang="${locale}"`);

    // Rewrite root-relative asset paths for locale subdirectory
    // Pages live at /{locale}/index.html, so root assets need ../
    const cssHash = fileHash(path.join(ROOT, 'styles.css'));
    html = html.replace('href="styles.css"', `href="../styles.css?v=${cssHash}"`);

    // Inject locale metadata for lang switcher
    html = html.replace('<html', `<html data-locales='${esc(localesMeta)}' data-current-locale="${locale}"`);
    // Fix: the above creates <html data-locales="..." data-current-locale="..." lang="..." ...>
    // but we already replaced lang="en" above — just make sure it's clean
    // Actually the replace adds attrs before existing ones, which is fine.

    // Inject content
    html = html.replace(MARKER, content.trimStart());

    // Inject head extras (canonical, hreflang, OG, JSON-LD)
    html = injectHead(html, renderHeadExtras(locale, S));

    // Replace <!-- S:key --> markers with localized strings
    html = injectTemplateStrings(html, S);

    // Inject title and description
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(S['meta.title'])}</title>`);
    html = html.replace(
      /(<meta name="description" content=")[^"]*(")/,
      `$1${esc(S['meta.description'])}$2`
    );

    // Replace script tags
    if (html.includes(SCRIPTS_MARKER)) {
      html = html.replace(SCRIPTS_MARKER, renderScripts(locale, config));
    }

    // Write locale directory
    const outDir = path.join(ROOT, locale);
    fs.mkdirSync(outDir, { recursive: true });

    // Write HTML
    const htmlPath = path.join(outDir, 'index.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`  wrote ${locale}/index.html (${Buffer.byteLength(html, 'utf8')} bytes)`);

    // Write runtime strings
    const stringsJs = buildRuntimeStrings(S);
    const stringsPath = path.join(outDir, 'strings.min.js');
    fs.writeFileSync(stringsPath, stringsJs);
    console.log(`  wrote ${locale}/strings.min.js (${Buffer.byteLength(stringsJs, 'utf8')} bytes)`);

    // Write sitemap
    const sitemap = renderLocaleSitemap(C, locale);
    const sitemapPath = path.join(outDir, 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemap);
    console.log(`  wrote ${locale}/sitemap.xml (${(sitemap.match(/<url>/g) || []).length} urls)`);
  }

  // Sitemap index at root
  const sitemapIndex = renderSitemapIndex();
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemapIndex);
  console.log(`\nwrote sitemap.xml (index, ${Object.keys(LOCALES).length} locales)`);

  // robots.txt
  const robotsStatus = updateRobotsTxt();
  console.log(`robots.txt ${robotsStatus}`);

  // Also write root index.html as a simple copy of en for backwards compat
  // (the _redirects file handles the actual redirect, but this is a fallback)
  const enHtml = fs.readFileSync(path.join(ROOT, 'en', 'index.html'), 'utf8');
  fs.writeFileSync(path.join(ROOT, 'index.html'), enHtml);
  console.log(`wrote index.html (copy of en/ for fallback)`);

  console.log('\nBuild complete.');
}

main();
