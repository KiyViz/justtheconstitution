const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
process.chdir(path.resolve(__dirname, '..'));
const read = p => fs.readFileSync(p, 'utf8');
function load(locale) {
  const ctx = {window:{}};
  for (const p of [`data/constitution${locale === 'es' ? '.es' : ''}.js`, `${locale}/strings.min.js`, 'citations.js']) vm.runInNewContext(read(p), ctx);
  return ctx.window;
}
for (const locale of ['en', 'es']) {
  const html = read(`${locale}/index.html`);
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
  const edu = read(`${locale}/for-educators/index.html`);
  const links = [...edu.matchAll(/href="\.\.\/#([^"]+)"/g)];
  assert.equal(links.length, 9);
  for (const [, id] of links) assert.ok(ids.has(id), `${locale} broken educator link ${id}`);
  assert.ok(html.includes('href="for-educators/"'));
  assert.equal((read(`${locale}/sitemap.xml`).match(/<url>/g)||[]).length, 3);
  assert.doesNotMatch(read(`${locale}/sitemap.xml`), /<lastmod>|<loc>[^<]*#/);
  const runtime = read(`${locale}/strings.min.js`);
  const hash = crypto.createHash('md5').update(runtime).digest('hex').slice(0,8);
  assert.ok(html.includes(`/${locale}/strings.min.js?v=${hash}`));
  const {JTC, CONSTITUTION:C} = load(locale);
  for (const key of ['toc.download_aria', 'toc.download_title', 'copy.passage', 'btn.share']) assert.notEqual(JTC.t(key), key);
  for (const amendment of C.amendments) {
    const source = {kind:'amendment',am:Number(amendment.id.slice(3)),anchor:amendment.id};
    assert.ok(JTC.cite.bibtex(source,'Text',{locale}).includes(`year   = {${amendment.year}}`));
  }
  assert.ok(JTC.cite.bibtex({kind:'preamble'},'Text',{}).includes('year   = {1787}'));
  assert.ok(!JTC.cite.bibtex({kind:'amendment',am:99},'Text',{}).includes('year'));
  assert.equal(JTC.cite._bluebookCite({kind:'clause',art:1,sec:8,cl:3,hasMultipleSections:true,hasMultipleClauses:true}), 'U.S. Const. art. I, § 8, cl. 3');
  const info = read(`${locale}/info/index.html`);
  assert.ok(info.includes('data-action="contact"'));
  assert.ok(info.includes('https://www.archives.gov/espanol/constitucion'));
  assert.ok(!info.includes('loc.gov'));
  assert.ok(info.includes('Web3Forms'));
}
const es = load('es').CONSTITUTION;
// Spanish text is the National Archives translation, verbatim (typos kept).
assert.ok(es.preamble.text.startsWith('NOSOTROS, el Pueblo de los Estados Unidos'));
assert.ok(es.articles[0].sections[7].paragraphs[0].startsWith('El Congreso tendra facultad:'));
assert.ok(es.amendments[26].paragraphs[0].includes('remuneracisn'));
assert.doesNotMatch(read('data/constitution.es.js'), /ascertained|nuestros Posteridad|uno tercio/);
for (const asset of ['styles.min.css', 'theme.min.js', 'assets/favicon-we.svg']) assert.ok(read('404.html').includes(`"/${asset}?v=`));
assert.doesNotMatch(read('sitemap.xml'), /lastmod/);
const outputs = ['index.html','404.html','sitemap.xml', ...['en','es'].flatMap(l => [`${l}/index.html`,`${l}/info/index.html`,`${l}/for-educators/index.html`,`${l}/strings.min.js`,`${l}/sitemap.xml`])];
const before = outputs.map(read);
// A different calendar day must not alter sitemaps or any other generated output.
execFileSync(process.execPath, ['-e', "const D=Date;global.Date=class extends D{constructor(...a){super(...(a.length?a:['2030-01-01T00:00:00Z']))}};require('./build.js')"], {stdio:'pipe'});
outputs.forEach((p,i) => assert.ok(read(p) === before[i], `${p} changed across build dates`));
console.log('PASS educator anchors, runtime labels/version, all amendment citation years, NARA Spanish text, 404 assets, cross-date build determinism');

function lum(hex) { const c=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4); return c[0]*.2126+c[1]*.7152+c[2]*.0722; }
const blocks=[...read('styles.css').matchAll(/\[data-mode="(light|dark|oled)"\]\[data-theme="(parchment|modern|civic)"\]\s*\{([^}]+)\}/g)];
let combinations=0;
for (const [,mode,theme,body] of blocks) {
  const color=k=>body.match(new RegExp('--'+k+':\\s*(#[a-f0-9]{6})'))?.[1];
  if(!color('ink-faint')) continue;
  combinations++;
  for(const ink of ['ink','ink-soft','ink-faint']) for(const bg of ['bg','bg-elev','bg-sunken']) {
    const values=[lum(color(ink)),lum(color(bg))].sort((a,b)=>b-a);
    const ratio=(values[0]+.05)/(values[1]+.05);
    assert.ok(ratio>=4.5, `${mode} ${theme} ${ink}/${bg}: ${ratio.toFixed(2)}`);
  }
}
assert.equal(combinations,9);
console.log('PASS normal text contrast >= 4.5:1 for all 9 theme/mode palettes and 3 surfaces');
