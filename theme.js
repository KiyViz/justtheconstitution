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
    theme: saved.theme || 'parchment',
    saturation: saved.saturation || 'default'
  };

  const root = document.documentElement;
  root.dataset.mode = t.mode;
  root.dataset.theme = t.theme;
  root.dataset.saturation = t.saturation;

  const btn = document.getElementById('mode-toggle');
  if (btn) btn.addEventListener('click', () => {
    const idx = MODES.indexOf(t.mode);
    t.mode = MODES[(idx + 1) % MODES.length];
    root.dataset.mode = t.mode;
    saved.mode = t.mode;
    try { localStorage.setItem('jtc:tweaks', JSON.stringify(saved)); } catch (e) { /* quota/private */ }
  });

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
          throw new Error('Submit failed');
        }
      } catch {
        status.textContent = status.dataset.error || 'Something went wrong.';
        status.className = 'contact-form__status is-error';
        status.hidden = false;
      }
      btn.disabled = false;
    });
  }
})();
