# Security and delivery implementation

This change implements S01 contact hardening and removes the R09 cache-rule
conflict. R08 HTTPS enforcement for static pages **requires the zone rule below**;
committing or deploying this repository alone does not complete that fix. No
production settings, credentials, or mail submissions were exercised here.

## Required production HTTPS rule (R08)

In the **justtheconstitution.org zone**, open **Rules → Overview → Create rule →
Redirect Rule** and create a **Single Redirect** named `JTC HTTP to HTTPS`.
Use a custom filter expression:

```text
(http.request.scheme eq "http" and http.host in {"justtheconstitution.org" "www.justtheconstitution.org"})
```

Choose a **Dynamic** URL redirect, with this target expression:

```text
concat("https://", http.host, http.request.uri.path)
```

Set status **308** and enable **Preserve query string**. Place it before any
other matching Single Redirect. Verify both hostnames are proxied through this
zone and covered by a valid edge certificate. If another HTTPS redirect feature
already intercepts these requests, reconcile it so API POSTs receive 308 rather
than a method-changing 301/302. Existing root and `/info` path redirects remain
in `_redirects` and execute after the scheme upgrade.

This preserves host, path, and query; 308 preserves the method/body when a client
follows it. The client must still submit directly over HTTPS: a redirect cannot
undo exposure of a body already sent over HTTP. The existing relative contact
action is appropriate once the page is reached over HTTPS.

The Worker also upgrades HTTP `/api/*` requests with 308 before parsing any body.
This is defense in depth for the API; static assets bypass it. We retain
`run_worker_first: ["/api/*"]`: changing this to `true` would invoke the Worker
for every static request and make those requests count against Worker usage,
instead of using direct asset delivery. No paid Worker routing is needed just
to enforce HTTPS. `_redirects` source rules are path-only; a guessed
`http://...` source is unsupported. HSTS remains in `_headers` but is not a
universal first-visit redirect.

After the authorized zone change and deployment, inspect redirects **without
following them** for HTTP `/`, `/en/`, `/es/info/?q=a%2Fb&x=1`, and an asset URL.
Expect an initial 308 to the same host/path/query over HTTPS and no loop when
following ordinary page requests. Check the API with an **empty** POST and no
redirect following (e.g. `curl.exe -i --request POST --data ""` against the HTTP
API URL): expect 308 and preserved query. No valid token, user message, or real
test email is necessary. These live checks are deployment requirements, not
checks completed in this task.

Official references checked for this implementation:

- [Single Redirect settings](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/settings/)
- [Create a redirect rule](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/create-dashboard/)
- [Static asset redirects](https://developers.cloudflare.com/workers/static-assets/redirects/)
- [Worker routing and billing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/)

## Runtime string integration and caching (R09)

The integration task adds `/en/strings.min.js?v=<content hash>` and
`/es/strings.min.js?v=<content hash>` to generated HTML. Header rules cannot
match the query string, so both versioned and legacy unversioned URLs receive
one conservative one-hour/revalidate policy. The new query value gives changed
content a new browser cache key, avoiding the previous unversioned cache entry
that may already contain a one-year immutable header. Deploy the string files
with their matching HTML; the build owns generation of the content hash.

Root JS/CSS rules use a single path-segment placeholder. Locale HTML page rules
and locale strings rules are disjoint. They no longer combine a one-year
JS policy with a one-hour locale wildcard policy. When adding a new page depth
or asset naming convention, verify it against these rules; unmatched paths
retain Cloudflare's default revalidating cache policy.

Cloudflare [combines matching header values](https://developers.cloudflare.com/workers/static-assets/headers/),
so rule order alone does not fix conflicts. After integration, check the
actual EN/ES script URLs and page URLs for exactly one `Cache-Control` policy.

## Contact hardening and environment configuration (S01)

- Turnstile must return boolean `success: true`, action `contact`, and a hostname
  exactly equal to the request URL hostname. The fixed production allowlist is
  `justtheconstitution.org` and `www.justtheconstitution.org`.
- **Deploy the form's `data-action="contact"` change with this Worker.** The
  integration task owns `templates/info.template.html` and the generated pages.
  Without the widget action, otherwise valid submissions will be rejected.
- Approved previews need an exact comma-separated `TURNSTILE_ALLOWED_HOSTNAMES`
  value in their separate deployment environment, plus a Turnstile widget that
  allows those hosts and uses action `contact`. No wildcard/suffix matching is
  implemented. Keep production mail credentials out of automated preview tests.
- `.dev.vars.example` makes local HTTP an explicit loopback-only exception via
  `CONTACT_LOCAL_DEVELOPMENT=true`. Production request hosts cannot use that
  exception or accept a local/preview token. Local hostname/action checks are
  still enforced. Turnstile dummy keys may return dummy metadata rather than
  the requested hostname/action; use the mocked suite for reliable local
  verification, not a metadata-validation bypass.
- Incoming forms are limited to 64 KiB of actual bytes and a 10-second body-read
  deadline before multipart/urlencoded parsing. The existing 5,000-character
  message and email/category/rating validation remains; all file fields are
  rejected. Tokens are limited to 2,048 characters.
- Both upstream requests have an 8-second deadline including body consumption,
  a 16 KiB response cap, and no redirects. Non-2xx, malformed/empty/oversized JSON,
  network failures, timeouts, and non-boolean/non-true success values fail closed.
  Web3Forms must return `success: true`, not just HTTP 200. There are no automatic
  relay retries, since an uncertain relay outcome may already have delivered.
- JSON/no-JS EN/ES responses, honeypot behavior, missing-secret failure, and
  `Cache-Control: no-store` are preserved. The browser must reset Turnstile after
  every submission attempt (owned by integration). Logs contain coarse failure
  categories, not upstream error text, token metadata, messages, or credentials.

See [Turnstile server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
for action/hostname verification, token size, and token reuse behavior.
The prior mock findings do not establish a live Turnstile bypass. Former
Web3Forms key rotation remains documented but unverified; no key was revealed,
used for testing, or rotated as part of this work.

## Validation

Run `node --test tests/security-contact.test.mjs`. All upstream services are
mocked; the suite never reads local secret files or makes real network calls.
It covers success, validation, host/action mismatch, exact local/preview opt-in,
EN/ES no-JS behavior, HTTPS method-safe redirects, missing/misleading body size,
stalled inbound streams, upstream HTTP/network/body failures, and timeouts both
before and after upstream headers. Deadline tests accelerate timers without
changing production constants.

`npm run build` also passes with esbuild installed. Worker source is independent
of the build pipeline; unrelated generated date changes are not part of this
security commit. `tests/` and `docs/` are excluded from public asset upload.

Validation completed: 43 endpoint tests passed; minified build passed; Wrangler
4.131.0 `deploy --dry-run` passed without uploading. A credential-free local
Wrangler fixture parsed 2 redirect rules and 17 header rules and returned the
expected single cache policy for EN/ES strings (including a version query),
locale pages, root JS, and data JS. These local checks do not verify the
production zone redirect or production secret configuration.
