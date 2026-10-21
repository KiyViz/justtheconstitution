// Isolated endpoint tests: no real secrets, network requests, or mail sends.
// Run with node --test tests/security-contact.test.mjs (Node 22+).
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const source = await readFile(new URL('../worker.js', import.meta.url));
const worker = (await import(`data:text/javascript;base64,${source.toString('base64')}`)).default;
const env = { TURNSTILE_SECRET_KEY: 'mock-secret', WEB3FORMS_ACCESS_KEY: 'mock-key' };
const validToken = { success: true, hostname: 'justtheconstitution.org', action: 'contact' };

function request(fields = {}, options = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    email: 'test@example.invalid', category: 'General Feedback', rating: '4',
    message: 'A local mock message.', locale: 'en', 'cf-turnstile-response': 'mock-token',
    ...fields
  })) {
    if (value !== null) form.set(key, value);
  }
  return new Request(options.url || 'https://justtheconstitution.org/api/contact', {
    method: 'POST', headers: { Accept: options.html ? 'text/html' : 'application/json' }, body: form
  });
}

function mockUpstreams(t, { verify = () => Response.json(validToken), relay = () => Response.json({ success: true }) } = {}) {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ url, init });
    assert.equal(init.method, 'POST');
    assert.equal(init.redirect, 'error');
    assert.ok(init.signal instanceof AbortSignal);
    if (url === 'https://challenges.cloudflare.com/turnstile/v0/siteverify') return verify(init);
    assert.equal(url, 'https://api.web3forms.com/submit', 'unexpected network destination');
    return relay(init);
  });
  t.mock.method(console, 'log', () => {});
  return calls;
}

async function result(response, status, error) {
  assert.equal(response.status, status);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.deepEqual(await response.json(), error ? { success: false, error } : { success: true });
}

test('valid multipart submission forwards only approved fields after verification', async t => {
  const calls = mockUpstreams(t);
  await result(await worker.fetch(request({ ccemail: 'ignored@example.invalid' }), env), 200);
  assert.equal(calls.length, 2);
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    access_key: 'mock-key', subject: 'JTC Feedback', from_name: 'JTC Contact Form',
    email: 'test@example.invalid', category: 'General Feedback', rating: '4',
    message: 'A local mock message.', locale: 'en'
  });
});

test('urlencoded maximum-length Unicode message and token fit the body limit', async t => {
  mockUpstreams(t);
  const form = await request({ message: '界'.repeat(5000), 'cf-turnstile-response': 'a'.repeat(2048) }).formData();
  const req = new Request('https://justtheconstitution.org/api/contact', {
    method: 'POST', headers: { Accept: 'application/json' }, body: new URLSearchParams(form)
  });
  await result(await worker.fetch(req, env), 200);
});

for (const [name, fields, status, error] of [
  ['missing token', { 'cf-turnstile-response': null }, 403, 'verification_failed'],
  ['oversized token', { 'cf-turnstile-response': 'x'.repeat(2049) }, 403, 'verification_failed'],
  ['invalid email', { email: 'invalid' }, 400, 'invalid_input'],
  ['oversized message', { message: 'x'.repeat(5001) }, 400, 'invalid_input'],
  ['invalid rating', { rating: '6' }, 400, 'invalid_input'],
  ['invalid category', { category: 'Other' }, 400, 'invalid_input'],
  ['file message', { message: new Blob(['upload']) }, 400, 'invalid_input'],
  ['unknown file field', { attachment: new Blob(['upload']) }, 400, 'invalid_input']
]) test(name, async t => {
  const calls = mockUpstreams(t);
  await result(await worker.fetch(request(fields), env), status, error);
  assert.equal(calls.length, 0);
});

for (const [name, outcome] of [
  ['invalid token', { ...validToken, success: false }],
  ['unrelated hostname', { ...validToken, hostname: 'unrelated.example' }],
  ['different production hostname', { ...validToken, hostname: 'www.justtheconstitution.org' }],
  ['missing hostname', { success: true, action: 'contact' }],
  ['wrong action', { ...validToken, action: 'login' }],
  ['missing action', { success: true, hostname: validToken.hostname }],
  ['non-boolean success', { ...validToken, success: 'true' }]
]) test(`Turnstile rejects ${name}`, async t => {
  const calls = mockUpstreams(t, { verify: () => Response.json(outcome) });
  await result(await worker.fetch(request(), env), 403, 'verification_failed');
  assert.equal(calls.length, 1);
});

for (const service of ['verify', 'relay']) {
  for (const [name, response] of [
    ['HTTP failure', () => Response.json({ success: true }, { status: 500 })],
    ['network failure', () => { throw new Error('mock network failure'); }],
    ['malformed JSON', () => new Response('{')],
    ['empty body', () => new Response(null)],
    ['null JSON', () => Response.json(null)],
    ['oversized body', () => new Response('x'.repeat(16385))],
    ['success false', () => Response.json({ success: false })]
  ]) test(`${service}: ${name} fails closed`, async t => {
    const calls = mockUpstreams(t, { [service]: response });
    await result(await worker.fetch(request(), env), service === 'verify' ? 403 : 502,
      service === 'verify' ? 'verification_failed' : 'upstream_error');
    assert.equal(calls.length, service === 'verify' ? 1 : 2);
  });
}

test('missing secrets and honeypot never contact upstreams', async t => {
  const calls = mockUpstreams(t);
  await result(await worker.fetch(request(), {}), 503, 'not_configured');
  await result(await worker.fetch(request({ botcheck: 'filled', email: 'invalid' }), env), 200);
  assert.equal(calls.length, 0);
});

for (const locale of ['en', 'es']) test(`${locale} no-JS success and retry page`, async t => {
  mockUpstreams(t);
  const success = await worker.fetch(request({ locale }, { html: true }), env);
  assert.equal(success.status, 303);
  assert.equal(success.headers.get('Location'), `/${locale}/info/?sent=1#contact`);
  assert.equal(success.headers.get('Cache-Control'), 'no-store');
  const failure = await worker.fetch(request({ locale, 'cf-turnstile-response': null }, { html: true }), env);
  assert.equal(failure.status, 403);
  assert.equal(failure.headers.get('Cache-Control'), 'no-store');
  const html = await failure.text();
  assert.ok(html.includes(`<html lang="${locale}">`));
  assert.ok(html.includes(`href="/${locale}/info/#contact"`));
  assert.ok(html.includes(locale === 'es' ? 'inténtalo de nuevo' : 'try again'));
});

test('body limits cover missing and misleading Content-Length', async t => {
  const calls = mockUpstreams(t);
  for (const declared of [undefined, '1', '65537']) {
    const headers = { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' };
    if (declared) headers['Content-Length'] = declared;
    const req = new Request('https://justtheconstitution.org/api/contact', {
      method: 'POST', headers, body: `padding=${'x'.repeat(65537)}`
    });
    await result(await worker.fetch(req, env), declared === '65537' ? 413 : 400, 'invalid_input');
  }
  assert.equal(calls.length, 0);
});

test('HTTP API redirect preserves method semantics, path and encoded query without consuming body', async t => {
  const calls = mockUpstreams(t);
  const req = request({}, { url: 'http://justtheconstitution.org/api/contact?next=%2Fen%2F&x=1' });
  const response = await worker.fetch(req, env);
  assert.equal(response.status, 308);
  assert.equal(response.headers.get('Location'), 'https://justtheconstitution.org/api/contact?next=%2Fen%2F&x=1');
  assert.equal(req.bodyUsed, false);
  assert.equal(calls.length, 0);
});

test('preview and local hostnames need explicit configuration; production cannot accept a local token', async t => {
  let hostname = 'preview.example';
  mockUpstreams(t, { verify: () => Response.json({ ...validToken, hostname }) });
  const preview = () => request({}, { url: 'https://preview.example/api/contact' });
  await result(await worker.fetch(preview(), env), 403, 'verification_failed');
  await result(await worker.fetch(preview(), { ...env, TURNSTILE_ALLOWED_HOSTNAMES: hostname }), 200);
  hostname = 'localhost';
  const local = () => request({}, { url: 'http://localhost:8787/api/contact' });
  assert.equal((await worker.fetch(local(), env)).status, 308);
  const localEnv = { ...env, CONTACT_LOCAL_DEVELOPMENT: 'true', TURNSTILE_ALLOWED_HOSTNAMES: 'localhost' };
  await result(await worker.fetch(local(), localEnv), 200);
  await result(await worker.fetch(request(), localEnv), 403, 'verification_failed');
  assert.equal((await worker.fetch(request({}, { url: 'http://justtheconstitution.org/api/contact' }), localEnv)).status, 308);
});

// Accelerate only Worker deadlines; leave stream/microtask scheduling untouched.
function fastDeadlines(t) {
  const realSetTimeout = globalThis.setTimeout;
  const deadlines = [];
  t.mock.method(globalThis, 'setTimeout', (callback, ms, ...args) => {
    deadlines.push(ms);
    return realSetTimeout(callback, 25, ...args);
  });
  return deadlines;
}

for (const service of ['verify', 'relay']) {
  test(`${service}: timeout before response headers aborts the request`, async t => {
    const deadlines = fastDeadlines(t);
    let aborted = false;
    mockUpstreams(t, { [service]: ({ signal }) => new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => { aborted = true; reject(new Error('mock abort')); }, { once: true });
    }) });
    await result(await worker.fetch(request(), env), service === 'verify' ? 403 : 502,
      service === 'verify' ? 'verification_failed' : 'upstream_error');
    assert.ok(aborted);
    assert.ok(deadlines.includes(8000));
  });
  test(`${service}: timeout after headers cancels a stalled response body`, async t => {
    fastDeadlines(t);
    let cancelled = false;
    mockUpstreams(t, { [service]: () => new Response(new ReadableStream({
      start(controller) { controller.enqueue(new TextEncoder().encode('{"success":')); },
      cancel() { cancelled = true; }
    })) });
    await result(await worker.fetch(request(), env), service === 'verify' ? 403 : 502,
      service === 'verify' ? 'verification_failed' : 'upstream_error');
    assert.ok(cancelled);
  });
}

test('stalled inbound body is cancelled and never reaches verification', async t => {
  const deadlines = fastDeadlines(t);
  const calls = mockUpstreams(t);
  let cancelled = false;
  const req = new Request('https://justtheconstitution.org/api/contact', {
    method: 'POST', duplex: 'half', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new ReadableStream({ cancel() { cancelled = true; } })
  });
  await result(await worker.fetch(req, env), 400, 'invalid_input');
  assert.ok(cancelled);
  assert.ok(deadlines.includes(10000));
  assert.equal(calls.length, 0);
});

test('API method/not-found handling and static passthrough are preserved', async t => {
  const calls = mockUpstreams(t);
  const method = await worker.fetch(new Request('https://justtheconstitution.org/api/contact'), env);
  assert.equal(method.headers.get('Allow'), 'POST');
  await result(method, 405, 'method_not_allowed');
  await result(await worker.fetch(new Request('https://justtheconstitution.org/api/missing'), env), 404, 'not_found');
  const assetRequest = new Request('https://justtheconstitution.org/en/?x=1');
  const response = await worker.fetch(assetRequest, { ASSETS: { fetch(req) {
    assert.equal(req, assetRequest);
    return new Response('asset');
  } } });
  assert.equal(await response.text(), 'asset');
  assert.equal(calls.length, 0);
});
