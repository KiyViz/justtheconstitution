/* ===== justtheconstitution — theme (subpages) =====
   Reads stored theme preferences and applies them.
   Shares localStorage key with the main reader's tweaks.js.
   No dependencies. */
(() => {
  const MODES = ['light', 'dark', 'oled'];
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('jtc:tweaks') || '{}'); } catch (e) { /* private browsing */ }
  const t = {
    mode: saved.mode || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    theme: saved.theme || 'civic',
    saturation: saved.saturation || 'default'
  };

  const root = document.documentElement;
  root.dataset.mode = t.mode;
  root.dataset.theme = t.theme;
  root.dataset.saturation = t.saturation;

  // Match the Turnstile widget to the page. This runs before Turnstile's own
  // script (which is deferred after this one), so the attribute is in place
  // when the widget renders. A later mode toggle won't restyle it.
  const turnstileEl = document.querySelector('.cf-turnstile');
  if (turnstileEl) turnstileEl.dataset.theme = t.mode === 'light' ? 'light' : 'dark';

  const btn = document.getElementById('mode-toggle');
  if (btn) btn.addEventListener('click', () => {
    const idx = MODES.indexOf(t.mode);
    t.mode = MODES[(idx + 1) % MODES.length];
    root.dataset.mode = t.mode;
    saved.mode = t.mode;
    try { localStorage.setItem('jtc:tweaks', JSON.stringify(saved)); } catch (e) { /* quota/private */ }
  });

  // Language toggle (info + educators subpages). The main reader wires the globe
  // button in lang.js via the <html data-locales> attributes, but subpages load
  // only this file — so derive the locale from the path and swap just the leading
  // /en|/es segment, preserving the rest of the path (/info/, /for-educators/).
  const langBtn = document.getElementById('lang-btn');
  if (langBtn) {
    const NAMES = { en: 'English', es: 'Español' };
    const current = /^\/es(\/|$)/.test(location.pathname) ? 'es' : 'en';
    const next = current === 'es' ? 'en' : 'es';
    const langLabel = document.getElementById('lang-label');
    if (langLabel) langLabel.textContent = NAMES[current] + ' (Shift+L)';
    const swapLang = () => {
      try { localStorage.setItem('jtc:lang', next); } catch (e) { /* quota/private */ }
      location.href = location.pathname.replace(/^\/(en|es)/, '/' + next);
    };
    langBtn.addEventListener('click', swapLang);
    // Mirror the main reader's Shift+L shortcut, but ignore it while typing.
    document.addEventListener('keydown', (e) => {
      if (e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey &&
          e.key.toLowerCase() === 'l' &&
          !(e.target.closest && e.target.closest('input, textarea, select'))) {
        e.preventDefault();
        swapLang();
      }
    });
  }

  // Locale detection for 404 page
  const isEs = /^\/es(\/|$)/.test(location.pathname);
  document.querySelectorAll('[data-locale-es]').forEach(el => {
    el.textContent = isEs ? el.dataset.localeEs : el.textContent;
  });
  document.querySelectorAll('[data-href-locale]').forEach(el => {
    el.href = isEs ? '/es/' : '/en/';
  });

  // Star rating (info page)
  const starRating = document.getElementById('star-rating');
  if (starRating) {
    const labels = starRating.querySelectorAll('label');
    const inputs = starRating.querySelectorAll('input');
    function updateStars() {
      const checked = starRating.querySelector('input:checked');
      const val = checked ? parseInt(checked.value) : 0;
      labels.forEach((lbl, i) => {
        lbl.classList.toggle('is-active', i < val);
      });
    }
    inputs.forEach(inp => inp.addEventListener('change', updateStars));
    labels.forEach(lbl => {
      lbl.addEventListener('mouseenter', () => {
        const idx = Array.from(labels).indexOf(lbl);
        labels.forEach((l, i) => l.classList.toggle('is-hover', i <= idx));
      });
      lbl.addEventListener('mouseleave', () => {
        labels.forEach(l => l.classList.remove('is-hover'));
      });
    });
  }

  // Contact form (info page)
  const form = document.getElementById('contact-form');

  // The no-JS path posts the form normally and the Worker redirects back here
  // with ?sent=1. Show the same confirmation, then drop the param so a reload
  // doesn't repeat it.
  if (form && new URLSearchParams(location.search).has('sent')) {
    const status = document.getElementById('form-status');
    status.textContent = status.dataset.success || 'Message sent. Thank you.';
    status.className = 'contact-form__status is-success';
    status.hidden = false;
    history.replaceState(null, '', location.pathname + '#contact');
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const status = document.getElementById('form-status');
      btn.disabled = true;
      status.hidden = true;
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(form)
        });
        if (res.ok) {
          status.textContent = status.dataset.success || 'Message sent. Thank you.';
          status.className = 'contact-form__status is-success';
          status.hidden = false;
          form.reset();
          if (starRating) starRating.querySelectorAll('label').forEach(l => l.classList.remove('is-active'));
        } else {
          // Turnstile tokens expire after a few minutes, so a slow typer gets a
          // retryable failure — worth its own message rather than sending them
          // to the email fallback.
          const body = await res.json().catch(() => ({}));
          if (body.error === 'verification_failed') {
            status.textContent = status.dataset.errorVerify || status.dataset.error || 'Verification failed.';
            status.className = 'contact-form__status is-error';
            status.hidden = false;
          } else {
            throw new Error('Submit failed');
          }
        }
      } catch {
        status.textContent = status.dataset.error || 'Something went wrong.';
        status.className = 'contact-form__status is-error';
        status.hidden = false;
      }
      // Tokens are single-use: clear it so a retry gets a fresh one.
      if (window.turnstile) { try { window.turnstile.reset(); } catch (e) { /* not rendered */ } }
      btn.disabled = false;
    });
  }
})();
