// Run after npm run build with Playwright on NODE_PATH. No live submissions.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.svg':'image/svg+xml','.webp':'image/webp'};
const server = http.createServer((req,res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file,'index.html');
  let status = 200;
  if (!fs.existsSync(file)) { file=path.join(root,'404.html'); status=404; }
  res.writeHead(status,{'Content-Type':types[path.extname(file)]||'application/octet-stream'}).end(fs.readFileSync(file));
});
let browser;
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({channel:process.env.JTC_BROWSER||'msedge',headless:true});
  const errors=[];
  for (const locale of ['en','es']) for (const width of [320,390,768,1280]) {
    const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
    // Avoid external service activity during local UI checks.
    await context.route(/^https:\/\//,route=>route.abort());
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    for (const suffix of ['', 'info/', 'for-educators/']) {
      await page.goto(`${base}/${locale}/${suffix}`);
      await page.evaluate(()=>document.fonts.ready);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), `${locale}/${suffix} overflows at ${width}`);
      if (!suffix) {
        await page.waitForFunction(()=>JTC.readerReady);
        const controls=await page.locator('.site-header button').evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length).map(n=>({id:n.id,left:n.getBoundingClientRect().left,right:n.getBoundingClientRect().right})));
        const right=await page.evaluate(()=>document.documentElement.clientWidth);
        for(const c of controls) assert.ok(c.left>=0&&c.right<=right,`${width} clipped ${JSON.stringify(c)} viewport ${right}`);
        // Exercise larger reading text at the same narrow CSS viewport (zoom reflow).
        await page.evaluate(()=>JTC.setTweak('fontSize',22));
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
        if(width===320) {
          await page.locator('#tweaks-btn').click();
          assert.ok(await page.evaluate(()=>document.getElementById('tweaks').contains(document.activeElement)));
          await page.keyboard.press('Escape');
          assert.equal(await page.evaluate(()=>document.activeElement.id),'tweaks-btn');
          await page.screenshot({path:path.join(os.tmpdir(),`jtc-integrated-${locale}-320.png`)});
        }
        // Validate accessible transcript labels through the rendered download button.
        assert.ok(await page.locator(`[aria-label="${locale==='en'?'Download Markdown transcript':'Descargar transcripción en Markdown'}"]`).count());
      }
    }
    console.log(`PASS ${locale} ${width}: reader/info/educator reflow and header access`);
    await context.close();
  }
  for (const locale of ['en','es']) {
    const context=await browser.newContext({viewport:{width:320,height:900},acceptDownloads:true});
    await context.route(/^https:\/\//,route=>route.abort());
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>localStorage.setItem('jtc:tweaks','null'));
    await page.goto(`${base}/${locale}/missing404`);
    assert.equal(await page.locator('html').getAttribute('lang'),locale);
    assert.equal(await page.locator('.page-404__btn').getAttribute('href'),`/${locale}/`);
    assert.equal(await page.locator('.wordmark').getAttribute('href'),`/${locale}/`);
    assert.ok(await page.evaluate(()=>[...document.styleSheets].some(s=>s.href?.includes('/styles.min.css'))));
    await page.goto(`${base}/${locale}/`);
    await page.waitForFunction(()=>JTC.readerReady);
    const result=page.waitForEvent('download');
    await page.locator('#menu-btn').click();
    await page.locator('#toc-drawer .toc-download').click();
    const file=await result;
    assert.equal(file.suggestedFilename(), locale==='en'?'us-constitution.md':'constitucion-eeuu.md');
    assert.ok(fs.statSync(await file.path()).size>40000);
    console.log(`PASS ${locale}: nested 404 recovery with null preferences and native Markdown download`);
    await context.close();
  }
  assert.deepEqual(errors,[]);
  console.log('PASS no uncaught browser errors');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
