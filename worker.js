/* ===== justtheconstitution — Worker entry =====
   Serves the static site (ASSETS binding) and proxies contact-form
   submissions through POST /api/contact.

   The form used to POST straight to Web3Forms with the access key embedded in
   the page. Bots scraped the key and posted to Web3Forms directly, skipping
   the page and every client-side check. The key now lives only in
   WEB3FORMS_ACCESS_KEY (Worker secret) and every submission must carry a
   Turnstile token this Worker verifies server-side.

   Not part of the build.js pipeline — wrangler bundles it, and .assetsignore
   keeps it from being uploaded as a public asset. */

const CATEGORIES = [
  'General Feedback',
  'Bug Report',
  'Content Suggestion',
  'Accessibility Issue'
];
const RATINGS = ['1', '2', '3', '4', '5'];
const MAX_MESSAGE = 5000;
const MAX_EMAIL = 254;
const MAX_TOKEN = 2048;
const MAX_BODY_BYTES = 64 * 1024;
const MAX_UPSTREAM_BYTES = 16 * 1024;
const BODY_TIMEOUT_MS = 10_000;
const UPSTREAM_TIMEOUT_MS = 8_000;
const PRODUCTION_HOSTNAMES = ['justtheconstitution.org', 'www.justtheconstitution.org'];
const SUPPORT_EMAIL = 'feedback@justtheconstitution.org';

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const WEB3FORMS = 'https://api.web3forms.com/submit';

// _headers only decorates static-asset responses, so Worker replies need their
// own. The style-src allowance covers the error page's inline <style>.
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'"
};

// Only reached on the no-JS failure path, so these stay inline rather than
// coupling the Worker to data/strings.*.js. Keep in sync with info.contact_*.
const COPY = {
  en: {
    lang: 'English',
    title: 'Message not sent',
    invalid_input: 'That submission didn’t look right. Please go back and check the form.',
    verification_failed: 'Verification didn’t complete. Please go back and try again.',
    upstream_error: 'Something went wrong on our end. Please try again in a moment.',
    not_configured: 'The contact form is temporarily unavailable.',
    back: 'Back to the contact form',
    alt: 'Or email directly:'
  },
  es: {
    lang: 'Español',
    title: 'Mensaje no enviado',
    invalid_input: 'El envío no parece válido. Vuelve atrás y revisa el formulario.',
    verification_failed: 'No se pudo completar la verificación. Vuelve atrás e inténtalo de nuevo.',
    upstream_error: 'Algo salió mal de nuestro lado. Inténtalo de nuevo en un momento.',
    not_configured: 'El formulario de contacto no está disponible temporalmente.',
    back: 'Volver al formulario de contacto',
    alt: 'O escribe directamente a:'
  }
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      // Static requests bypass this script: the zone redirect documented in
      // docs/security-delivery-implementation.md is still required.
      const localHttp = env.CONTACT_LOCAL_DEVELOPMENT === 'true' &&
        ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
      if (url.protocol === 'http:' && !localHttp) {
        url.protocol = 'https:';
        return new Response(null, { status: 308, headers: {
          Location: url.href, 'Cache-Control': 'no-store', ...SECURITY_HEADERS
        } });
      }
      if (url.pathname !== '/api/contact') return json({ success: false, error: 'not_found' }, 404);
      if (request.method !== 'POST') {
        return json({ success: false, error: 'method_not_allowed' }, 405, { Allow: 'POST' });
      }
      return handleContact(request, env);
    }

    // Everything else is the static site, unchanged.
    return env.ASSETS.fetch(request);
  }
};

async function handleContact(request, env) {
  // The fetch() path in theme.js sets this; a plain no-JS form POST does not.
  const wantsJson = (request.headers.get('Accept') || '').includes('application/json');

  let form;
  try {
    const length = request.headers.get('Content-Length');
    if (length && (!/^\d+$/.test(length) || Number(length) > MAX_BODY_BYTES)) {
      return fail(wantsJson, 'en', 'invalid_input', 413);
    }
    const type = (request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
    if (!['multipart/form-data', 'application/x-www-form-urlencoded'].includes(type)) {
      return fail(wantsJson, 'en', 'invalid_input', 400);
    }
    // Count actual bytes too: Content-Length can be absent or misleading.
    const body = await withDeadline(BODY_TIMEOUT_MS, signal =>
      readLimitedBody(request.body, MAX_BODY_BYTES, signal));
    form = await new Response(body, { headers: {
      'Content-Type': request.headers.get('Content-Type')
    } }).formData();
  } catch {
    return fail(wantsJson, 'en', 'invalid_input', 400);
  }

  const locale = form.get('locale') === 'es' ? 'es' : 'en';

  // This endpoint accepts text only, including optional/unknown fields.
  if ([...form.values()].some(value => typeof value !== 'string')) {
    return fail(wantsJson, locale, 'invalid_input', 400);
  }

  if (!env.WEB3FORMS_ACCESS_KEY || !env.TURNSTILE_SECRET_KEY) {
    console.log('contact: missing secrets');
    return fail(wantsJson, locale, 'not_configured', 503);
  }

  // Honeypot: report success and forward nothing, so bots can't tell.
  if (str(form.get('botcheck'))) {
    console.log('contact: honeypot tripped');
    return succeed(wantsJson, locale);
  }

  const email = str(form.get('email'));
  const category = str(form.get('category'));
  const rating = str(form.get('rating'));
  const message = str(form.get('message'));

  if (!email || email.length > MAX_EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !CATEGORIES.includes(category) ||
      (rating && !RATINGS.includes(rating)) ||
      !message || message.length > MAX_MESSAGE) {
    return fail(wantsJson, locale, 'invalid_input', 400);
  }

  const token = str(form.get('cf-turnstile-response'));
  if (!token || token.length > MAX_TOKEN || !(await verifyTurnstile(token, env, request))) {
    return fail(wantsJson, locale, 'verification_failed', 403);
  }

  const payload = {
    access_key: env.WEB3FORMS_ACCESS_KEY,
    subject: 'JTC Feedback',
    from_name: 'JTC Contact Form',
    email,
    category,
    message,
    locale
  };
  if (rating) payload.rating = rating;

  let upstream;
  try {
    upstream = await fetchJson(WEB3FORMS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch {
    console.log('contact: web3forms request failed');
    return fail(wantsJson, locale, 'upstream_error', 502);
  }
  if (upstream?.success !== true) {
    console.log('contact: web3forms rejected submission');
    return fail(wantsJson, locale, 'upstream_error', 502);
  }

  return succeed(wantsJson, locale);
}

async function verifyTurnstile(token, env, request) {
  try {
    const outcome = await fetchJson(SITEVERIFY, {
      method: 'POST',
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: request.headers.get('CF-Connecting-IP') || ''
      })
    });
    const hostname = new URL(request.url).hostname;
    // Production hosts cannot be weakened by preview/local configuration.
    const allowed = PRODUCTION_HOSTNAMES.includes(hostname) ? PRODUCTION_HOSTNAMES :
      String(env.TURNSTILE_ALLOWED_HOSTNAMES || '').split(',').map(value => value.trim()).filter(Boolean);
    const valid = outcome?.success === true && outcome.action === 'contact' &&
      outcome.hostname === hostname && allowed.includes(hostname);
    if (!valid) console.log('contact: turnstile rejected');
    return valid;
  } catch {
    console.log('contact: turnstile request failed');
    return false;
  }
}

// Keep the deadline active through response-body consumption, not just headers.
async function withDeadline(ms, operation) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await operation(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

async function readLimitedBody(body, limit, signal) {
  if (!body) return new Uint8Array();
  const reader = body.getReader();
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      if (signal.aborted) throw new Error('Body deadline exceeded');
      const { done, value } = await reader.read();
      if (signal.aborted) throw new Error('Body deadline exceeded');
      if (done) break;
      size += value.byteLength;
      if (size > limit) throw new Error('Body too large');
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return bytes;
  } catch (error) {
    cancel();
    throw error;
  } finally {
    signal.removeEventListener('abort', cancel);
    reader.releaseLock();
  }
}

async function fetchJson(url, init) {
  return withDeadline(UPSTREAM_TIMEOUT_MS, async signal => {
    const response = await fetch(url, { ...init, signal, redirect: 'error' });
    if (!response.ok) {
      if (response.body) void response.body.cancel().catch(() => {});
      throw new Error('Upstream HTTP error');
    }
    const bytes = await readLimitedBody(response.body, MAX_UPSTREAM_BYTES, signal);
    return JSON.parse(new TextDecoder().decode(bytes));
  });
}

// ── Responses ──
// JS path gets JSON; the no-JS path gets a redirect on success (so a refresh
// can't re-post) and a small self-contained page on failure.

function succeed(wantsJson, locale) {
  if (wantsJson) return json({ success: true }, 200);
  return new Response(null, {
    status: 303,
    headers: {
      Location: `/${locale}/info/?sent=1#contact`,
      'Cache-Control': 'no-store',
      ...SECURITY_HEADERS
    }
  });
}

function fail(wantsJson, locale, error, status) {
  if (wantsJson) return json({ success: false, error }, status);
  return new Response(errorPage(locale, error), {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      ...SECURITY_HEADERS
    }
  });
}

function json(body, status, extraHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...SECURITY_HEADERS,
      ...extraHeaders
    }
  });
}

function errorPage(locale, error) {
  const c = COPY[locale];
  const detail = c[error] || c.upstream_error;
  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${esc(c.title)}</title>
<style>
  body { margin: 0; padding: 3rem 1.5rem; font: 1rem/1.6 Georgia, 'Times New Roman', serif;
         color: #1a1a1a; background: #fdfcf8; }
  main { max-width: 34rem; margin: 0 auto; }
  h1 { font-size: 1.5rem; margin: 0 0 1rem; }
  a { color: #7b1113; }
  @media (prefers-color-scheme: dark) { body { color: #e8e6e1; background: #14161a; } a { color: #e0a3a4; } }
</style>
</head>
<body>
<main>
  <h1>${esc(c.title)}</h1>
  <p>${esc(detail)}</p>
  <p><a href="/${locale}/info/#contact">${esc(c.back)}</a></p>
  <p>${esc(c.alt)} <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
</main>
</body>
</html>`;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

// FormData values are File objects when a field is sent as a file — coerce
// only real strings so a crafted multipart upload can't reach validation.
function str(v) {
  return typeof v === 'string' ? v.trim() : '';
}
