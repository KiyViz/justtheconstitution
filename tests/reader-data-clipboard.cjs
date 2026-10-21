// Run with node tests/reader-data-clipboard.cjs; no dependencies or network.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = file => fs.readFileSync(path.join(root, file), 'utf8');
(async () => {
  for (const locale of ['en', 'es']) {
    const ctx = { window: {}, document: { documentElement: { dataset: { currentLocale: locale }, lang: locale } } };
    vm.createContext(ctx);
    for (const file of [`data/constitution${locale === 'es' ? '.es' : ''}.js`, `${locale}/strings.min.js`, 'reader.js']) vm.runInContext(source(file), ctx);
    const markdown = ctx.window.JTC.buildMarkdown();
    const C = ctx.window.CONSTITUTION;
    const paragraphs = [C.preamble.text, ...C.articles.flatMap(a => a.sections.flatMap(s => s.paragraphs)), ...C.amendments.flatMap(a => a.paragraphs)];
    assert.ok(paragraphs.every(text => markdown.includes(text)));
    console.log(`PASS ${locale}: all ${paragraphs.length} source paragraphs in Markdown`);
  }
  for (const success of [true, false]) {
    const actions = [];
    const ctx = { window: {}, navigator: { clipboard: { writeText: async () => { throw Error('denied'); } } },
      document: {
        createElement: () => ({ style: {}, select() { actions.push('select'); } }),
        body: { appendChild() {}, removeChild() { actions.push('remove'); } },
        execCommand: () => { actions.push('copy'); return success; }
      }
    };
    vm.runInNewContext(source('core.js'), ctx);
    assert.equal(await ctx.window.JTC.copyText('source text'), success);
    assert.deepEqual(actions, ['select', 'copy', 'remove']);
  }
  console.log('PASS clipboard fallback success and failure, with cleanup');
})().catch(error => { console.error(error); process.exitCode = 1; });
