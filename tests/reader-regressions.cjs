/* Run after node build.js. Uses an externally installed Playwright, no app dependency.
   NODE_PATH may point to the bundled runtime; JTC_BROWSER defaults to msedge. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  fs.readFile(file, (error, body) => {
    if (error) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }); res.end(body);
  });
});
let browser, base;
const errors = [];
async function fresh(width = 1440, setup) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  if (setup) await setup(page);
  return page;
}
async function ready(page, url) {
  await page.goto(base + url);
  await page.waitForFunction(() => window.JTC?.readerReady);
  await page.waitForTimeout(400);
}
async function atPassage(page, id) {
  const state = await page.evaluate(id => ({
    hash: decodeURIComponent(location.hash),
    top: document.getElementById(id).getBoundingClientRect().top,
    offset: JTC.scrollOffset(),
  }), id);
  assert.equal(state.hash, '#' + id);
  assert.ok(Math.abs(state.top - state.offset) < 3, JSON.stringify(state));
}
async function close(page) { await page.context().close(); }
async function test(name, run) { await run(); console.log('PASS ' + name); }
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ channel: process.env.JTC_BROWSER || 'msedge', headless: true });

  for (const locale of ['en', 'es']) for (const width of [390, 1440]) {
    await test(`${locale} ${width}: fresh clause link, fonts/settings, language`, async () => {
      const page = await fresh(width, async page => {
        await page.addInitScript(() => localStorage.setItem('jtc:tweaks', JSON.stringify({ fontSize: 22, font: 'serif', pane: 'closed' })));
        await page.route('**/*.woff2*', async route => { await new Promise(resolve => setTimeout(resolve, 250)); await route.continue(); });
      });
      await ready(page, `/${locale}/#a1-s8-c3`);
      await atPassage(page, 'a1-s8-c3');
      assert.ok((await page.locator('#a1-s8-c3 .copy-btn').getAttribute('aria-label')).startsWith(locale === 'es' ? 'Copiar pasaje' : 'Copy passage'));
      assert.ok((await page.locator('#a1-s8-c3 .share-btn-passage').getAttribute('aria-label')).startsWith(locale === 'es' ? 'Compartir' : 'Share'));
      await page.evaluate(() => document.getElementById('lang-btn').click());
      await page.waitForURL(`**/${locale === 'en' ? 'es' : 'en'}/#a1-s8-c3`);
      await page.waitForFunction(() => JTC.readerReady);
      await page.waitForTimeout(400);
      await atPassage(page, 'a1-s8-c3');
      await close(page);
    });
  }
  await test('local passage resume, changed locale/layout, deep-link priority, invalid resume', async () => {
    const page = await fresh();
    await ready(page, '/en/#a1-s8-c3');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('jtc:readingPosition')).id), 'a1-s8-c3');
    await page.setViewportSize({ width: 390, height: 850 });
    await ready(page, '/es/');
    await atPassage(page, 'a1-s8-c3');
    await ready(page, '/es/#am-14-s2');
    await atPassage(page, 'am-14-s2');
    await page.addInitScript(() => localStorage.setItem('jtc:readingPosition', JSON.stringify({ version: 1, id: 'no-such-passage' })));
    await ready(page, '/en/');
    assert.equal(await page.evaluate(() => scrollY), 0);
    await close(page);
  });
  for (const value of ['{broken', 'null', '[]', '42', '{"fontSize":"huge","reader":"bad","pane":false}']) {
    await test('malformed preferences ' + value, async () => {
      const page = await fresh(390, page => page.addInitScript(value => localStorage.setItem('jtc:tweaks', value), value));
      await ready(page, '/en/#a1-s8-c3');
      await atPassage(page, 'a1-s8-c3');
      assert.equal(await page.evaluate(() => JTC.getTweaks().fontSize), 17);
      await close(page);
    });
  }
  await test('storage denial: preferences, reset, progress, language and reading remain functional', async () => {
    const page = await fresh(390, page => page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } });
    }));
    await ready(page, '/en/#a1-s8-c3');
    await atPassage(page, 'a1-s8-c3');
    await page.evaluate(() => { JTC.setTweak('fontSize', 20); JTC.setTweak('mode', 'dark'); });
    assert.deepEqual(await page.evaluate(() => [JTC.getTweaks().fontSize, JTC.getTweaks().mode]), [20, 'dark']);
    await page.evaluate(() => JTC.resetTweaks());
    assert.equal(await page.evaluate(() => JTC.getTweaks().fontSize), 17);
    await page.evaluate(() => document.getElementById('lang-btn').click());
    await page.waitForURL('**/es/**');
    await close(page);
  });
  await test('panel focus entry, Tab, Escape, return, and mutual exclusion', async () => {
    const page = await fresh(390);
    await ready(page, '/en/');
    await page.locator('#tweaks-btn').click();
    assert.equal(await page.evaluate(() => document.getElementById('tweaks').contains(document.activeElement)), true);
    assert.equal(await page.locator('#tweaks').getAttribute('aria-modal'), null);
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.getElementById('tweaks').contains(document.activeElement)), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'tweaks-btn');
    await page.locator('#menu-btn').click();
    assert.equal(await page.evaluate(() => document.activeElement.id), 'drawer-close');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => document.getElementById('toc-drawer').contains(document.activeElement)), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'menu-btn');
    await page.locator('#search-btn').click();
    assert.equal(await page.evaluate(() => document.activeElement.id), 'search-input');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'search-btn');
    await page.locator('#share-btn').click();
    assert.equal(await page.evaluate(() => document.getElementById('share-pop').contains(document.activeElement)), true);
    assert.equal(await page.locator('#share-pop').getAttribute('role'), 'region');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'share-btn');
    await page.locator('#tweaks-btn').click();
    await page.evaluate(() => JTC.openSearch());
    assert.equal(await page.locator('#tweaks').evaluate(el => el.classList.contains('is-open')), false);
    await close(page);
  });
  await test('phrase search across drop cap/inline nodes; inert input; clearing preserves text and controls', async () => {
    const page = await fresh();
    await ready(page, '/en/');
    const original = await page.locator('#preamble').textContent();
    const buttons = await page.locator('#text-pane button').count();
    await page.locator('#search-btn').click();
    await page.locator('#search-input').fill('We the People');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#preamble mark.search-hit').allTextContents().then(parts => parts.join('')), 'We the People');
    assert.match(await page.locator('#search-count').textContent(), /2/);
    await page.locator('#search-input').fill('<img src=x onerror=alert(1)>');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#text-pane img[src="x"]').count(), 0);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#preamble').textContent(), original);
    assert.equal(await page.locator('#text-pane button').count(), buttons);
    // A queued search must not run after dismissal.
    await page.locator('#search-btn').click();
    await page.locator('#search-input').fill('Congress');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    assert.equal(await page.locator('mark.search-hit').count(), 0);
    await close(page);
  });
  await test('hidden mobile images defer until page chip; resize and pane reopening load current scan', async () => {
    const page = await fresh(390);
    const requests = [];
    page.on('request', req => { if (/\/images\/.*\.(webp|jpg)/.test(req.url())) requests.push(req.url()); });
    await ready(page, '/en/');
    assert.equal(requests.length, 0);
    await page.locator('#article-1 > .section-drop .page-chip').click();
    await page.waitForFunction(() => document.getElementById('lb-img').naturalWidth > 0);
    assert.equal(requests.length, 1);
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForFunction(() => document.getElementById('page-img').dataset.pageKey === '1');
    await page.evaluate(() => { JTC.setTweak('pane', 'closed'); JTC.setCurrentPage(3); });
    const before = requests.length;
    await page.waitForTimeout(200);
    assert.equal(requests.length, before);
    await page.evaluate(() => JTC.setTweak('pane', 'open'));
    await page.waitForFunction(() => document.getElementById('page-img').src.includes('Pg3of4'));
    await close(page);
  });
  await test('failed scan has bounded fallback and no undefined URL', async () => {
    const page = await fresh(390);
    const requests = [];
    page.on('request', req => requests.push(req.url()));
    await page.route('**/images/**', route => route.abort());
    await ready(page, '/en/');
    await page.evaluate(() => { JTC.setCurrentPage('am-11'); JTC.openLightbox(); });
    await page.waitForFunction(() => document.getElementById('lb-img').hidden);
    assert.ok(!requests.some(url => url.endsWith('/undefined')));
    await close(page);
  });
  await test('late layout cannot undo newer navigation; overlapping smooth navigation preserves final target', async () => {
    const page = await fresh(1440, page => page.route('**/*.woff2*', async route => {
      await new Promise(resolve => setTimeout(resolve, 800)); await route.continue();
    }));
    await page.goto(base + '/en/#a1-s8-c3', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => JTC.scrollToId('am-14-s2'));
    await page.waitForFunction(() => JTC.readerReady);
    await page.waitForTimeout(400);
    await atPassage(page, 'am-14-s2');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(() => JTC.scrollToId('preamble'));
    await page.waitForTimeout(300);
    await page.evaluate(() => JTC.scrollToId('a1-s8-c3'));
    await page.waitForTimeout(1800);
    await atPassage(page, 'a1-s8-c3');
    await close(page);
  });
  await test('height-only resize (phone address bar) does not snap mid-paragraph reading position', async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 788 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await ready(page, '/en/#a1-s8-c1');
    await atPassage(page, 'a1-s8-c1');
    await page.mouse.wheel(0, 40);
    await page.waitForTimeout(400);
    const before = await page.evaluate(() => ({ y: scrollY, current: JTC.currentPassage }));
    assert.equal(before.current, 'a1-s8-c1', JSON.stringify(before));
    for (const height of [844, 788]) {
      await page.setViewportSize({ width: 390, height });
      await page.waitForTimeout(300);
      const y = await page.evaluate(() => scrollY);
      assert.ok(Math.abs(y - before.y) < 2, `height ${height}: scrollY ${before.y} -> ${y}`);
    }
    await context.close();
  });
  await test('quota failure preserves in-memory preferences over stale stored settings', async () => {
    const page = await fresh(1440, page => page.addInitScript(() => {
      localStorage.setItem('jtc:tweaks', JSON.stringify({ fontSize: 15 }));
      Storage.prototype.setItem = () => { throw new DOMException('full', 'QuotaExceededError'); };
      Storage.prototype.removeItem = () => { throw new DOMException('blocked', 'SecurityError'); };
    }));
    await ready(page, '/en/');
    await page.evaluate(() => JTC.setTweak('fontSize', 20));
    assert.equal(await page.evaluate(() => JTC.getTweaks().fontSize), 20);
    await page.evaluate(() => JTC.resetTweaks());
    assert.equal(await page.evaluate(() => JTC.getTweaks().fontSize), 17);
    await close(page);
  });
  await test('EN/ES source text remains readable without JavaScript', async () => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    for (const locale of ['en', 'es']) {
      await page.goto(base + '/' + locale + '/#a1-s8-c3');
      assert.ok((await page.locator('#a1-s8-c3').textContent()).length > 50);
    }
    await context.close();
  });
  assert.deepEqual(errors, [], 'uncaught browser errors');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  server.close();
});
