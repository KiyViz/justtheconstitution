#!/usr/bin/env node
/* ===== justtheconstitution — build =====
   Reads data/constitution.js, emits the text pane's static HTML into
   index.template.html's <!-- BUILD:CONTENT --> marker, and writes
   index.html + sitemap.xml + robots.txt.

   Zero runtime dependencies. Node stdlib only.
   Run: node build.js
   Must be idempotent: two runs produce byte-identical output.
*/
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = __dirname;
const SITE_URL = 'https://justtheconstitution.org/';
const TEMPLATE = path.join(ROOT, 'index.template.html');
const DATA = path.join(ROOT, 'data', 'constitution.js');
const OUT_HTML = path.join(ROOT, 'index.html');
const OUT_SITEMAP = path.join(ROOT, 'sitemap.xml');
const ROBOTS = path.join(ROOT, 'robots.txt');
const MARKER = '<!-- BUILD:CONTENT -->';

function esc(s) {
  return String(s).replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

function loadConstitution() {
  const src = fs.readFileSync(DATA, 'utf8');
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(src, ctx, { filename: 'data/constitution.js' });
  if (!ctx.window.CONSTITUTION) {
    throw new Error('data/constitution.js did not set window.CONSTITUTION');
  }
  return ctx.window.CONSTITUTION;
}

function renderContent(C) {
  const L = [];
  const ind = '      '; // indent inside <article>

  L.push(`${ind}<h1 class="doc-title">The Constitution of the United States</h1>`);
  L.push(`${ind}<div class="doc-tag">We the People · September 17, 1787</div>`);

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
    // page-chip button is added by hydrateText on the client
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

  // Signatures — parchment-first, with numbered footnotes for common names.
  // Numbering order matches renderText(): president gets #1, then each state
  // group in order. Plain-string signatories are inline and don't get numbers.
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
      L.push(`${ind}    <li>Commonly known as ${esc(f.common)}${end}</li>`);
    });
    L.push(`${ind}  </ol>`);
  }
  L.push(`${ind}</section>`);

  // Amendments heading
  L.push(`${ind}<section id="amendments" class="anchor amendments-head" data-chapter="amendments">`);
  L.push(`${ind}  <h2>Amendments</h2>`);
  L.push(`${ind}  <div class="sub">Twenty-seven amendments ratified between 1791 and 1992. The first ten form the Bill of Rights.</div>`);
  L.push(`${ind}</section>`);

  // Amendments
  C.amendments.forEach(am => {
    L.push(`${ind}<section id="${esc(am.id)}" class="anchor amendment" data-chapter="amendments" data-amnum="${esc(am.num)}">`);
    L.push(`${ind}  <div class="amendment__meta">`);
    L.push(`${ind}    <span class="amendment__num">Amendment ${esc(am.num)}</span>`);
    L.push(`${ind}    <span class="amendment__year">Ratified ${esc(am.year)}</span>`);
    L.push(`${ind}  </div>`);
    L.push(`${ind}  <h3>${esc(am.label)}</h3>`);
    L.push(`${ind}  <div class="amendment__sub">${esc(am.subtitle)}</div>`);
    am.paragraphs.forEach(p => L.push(`${ind}  <p>${esc(p)}</p>`));
    L.push(`${ind}</section>`);
  });

  // Download CTA — text-only in static HTML. The button + handler are added by
  // hydrateText on the client. Without JS, the section still reads correctly.
  L.push(`${ind}<section class="download-cta">`);
  L.push(`${ind}  <h2>Take it with you.</h2>`);
  L.push(`${ind}  <p>The full document — preamble, articles, signatures, all twenty-seven amendments — as a single Markdown file. Readable anywhere.</p>`);
  L.push(`${ind}  <div class="download-cta__hint">us-constitution.md</div>`);
  L.push(`${ind}</section>`);

  return L.join('\n');
}

// Inject canonical + og + twitter + Schema.org JSON-LD into <head>.
// Idempotent: if the build marker is present, replace between markers; otherwise insert.
const HEAD_MARK_START = '<!-- BUILD:HEAD-START -->';
const HEAD_MARK_END = '<!-- BUILD:HEAD-END -->';

function renderHeadExtras() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Legislation',
    name: 'Constitution of the United States',
    legislationType: 'Constitution',
    inLanguage: 'en',
    datePublished: '1787-09-17',
    url: SITE_URL
  };
  const lines = [
    `  <link rel="canonical" href="${SITE_URL}" />`,
    `  <meta property="og:url" content="${SITE_URL}" />`,
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
    const before = html.slice(0, startIdx - 2); // strip the '  ' indent before the marker
    const after = html.slice(endIdx + HEAD_MARK_END.length);
    return before + extras + after;
  }
  // No markers yet — inject before </head> and preserve markers for future idempotent runs.
  const idx = html.indexOf('</head>');
  if (idx === -1) throw new Error('Template has no </head>.');
  return html.slice(0, idx) + extras + '\n' + html.slice(idx);
}

function renderSitemap(C) {
  const anchors = [
    'preamble',
    ...C.articles.flatMap(a => [a.id, ...a.sections.map(s => s.id)]),
    'signatures',
    'amendments',
    ...C.amendments.map(am => am.id)
  ];
  const urls = [
    `  <url><loc>${SITE_URL}</loc></url>`,
    ...anchors.map(id => `  <url><loc>${SITE_URL}#${id}</loc></url>`)
  ].join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function updateRobotsTxt() {
  const sitemapLine = `Sitemap: ${SITE_URL}sitemap.xml`;
  let body = '';
  if (fs.existsSync(ROBOTS)) {
    body = fs.readFileSync(ROBOTS, 'utf8');
    if (body.split(/\r?\n/).some(ln => ln.trim() === sitemapLine)) return 'unchanged';
    if (body.length && !body.endsWith('\n')) body += '\n';
  } else {
    body = 'User-agent: *\nAllow: /\n\n';
  }
  body += sitemapLine + '\n';
  fs.writeFileSync(ROBOTS, body);
  return 'updated';
}

function main() {
  if (!fs.existsSync(TEMPLATE)) {
    throw new Error(`Missing ${path.relative(ROOT, TEMPLATE)}. Rename index.html → index.template.html and insert ${MARKER} inside <article id="text-pane"> first.`);
  }
  const template = fs.readFileSync(TEMPLATE, 'utf8');
  if (!template.includes(MARKER)) {
    throw new Error(`Template is missing ${MARKER}. Insert it inside <article id="text-pane">.`);
  }
  const C = loadConstitution();
  const content = renderContent(C);
  let out = template.replace(MARKER, content.trimStart());
  out = injectHead(out, renderHeadExtras());
  fs.writeFileSync(OUT_HTML, out);
  const sizeHtml = Buffer.byteLength(out, 'utf8');
  console.log(`wrote ${path.relative(ROOT, OUT_HTML)} (${sizeHtml} bytes)`);

  const sitemap = renderSitemap(C);
  fs.writeFileSync(OUT_SITEMAP, sitemap);
  console.log(`wrote ${path.relative(ROOT, OUT_SITEMAP)} (${Buffer.byteLength(sitemap, 'utf8')} bytes, ${(sitemap.match(/<url>/g) || []).length} urls)`);

  const robotsStatus = updateRobotsTxt();
  console.log(`robots.txt ${robotsStatus}`);
}

main();
