# SOP — justtheconstitution.org

Standard operating procedure for pushing changes. Not a full README — just
the steps you actually need to deploy.

## One-time setup (per machine)

After cloning this repo fresh on any machine, run once:

```
git config core.hooksPath .githooks
```

This activates the pre-commit hook that auto-rebuilds `index.html` and
`sitemap.xml` before every commit, so you can't ship a stale bundle.

Requires Node.js on your `PATH`. If Node is missing the hook will warn
and let the commit through — install Node before pushing content changes.

## The push loop

```
edit → git add → git commit → git push
```

The pre-commit hook runs `node build.js` and stages the regenerated files
into the commit automatically. Cloudflare Pages deploys whatever you push.

## When to manually run `node build.js`

Almost never — the hook handles it. The only reason to run it by hand is
to preview what your changes will look like before committing:

```
node build.js      # writes index.html + sitemap.xml
# open http://localhost:8765/ in a browser
```

## Source vs generated

Commit everything. Both lists live in git. The hook keeps them in sync.

**Source (you edit these):**

- `data/constitution.js` — document text (don't edit casually)
- `index.template.html` — the page shell with `<!-- BUILD:CONTENT -->`
- `*.js` modules — `core`, `tweaks`, `images`, `reader`, `progress`, `nav`, `search`, `app`
- `styles.css`
- `_headers`, `.well-known/security.txt`
- `fonts/*.woff2`, `images/*`
- `build.js`, `_scripts/extract-fonts.js`, `.githooks/pre-commit`

**Generated (build.js writes these; don't hand-edit):**

- `index.html`
- `sitemap.xml`
- `robots.txt` (first run only — afterwards left alone)

## Troubleshooting

**Pre-commit hook failed with a build error.** Read the stderr — `build.js`
printed the actual problem. Usually means `data/constitution.js` or
`index.template.html` has a syntax issue. Fix it, retry the commit.

**Committed from a machine without Node.** The hook warned and let the
commit through, so `index.html` may now be stale. Install Node, pull the
commit back, run `node build.js`, commit the regenerated files, push.

**CSP violation on live site after deploy.** Open DevTools Console on the
live URL — the browser logs which resource was blocked. If it's legit
(new third-party script you added intentionally), amend the `Content-Security-Policy`
line in `_headers`. If it's unexpected, figure out what introduced the
external request.

**Roll back CSP to Report-Only if things break.** Edit `_headers` line 8:
change `Content-Security-Policy:` back to `Content-Security-Policy-Report-Only:`,
commit, push. Violations will be logged to the browser console instead of
blocking resources while you investigate.
