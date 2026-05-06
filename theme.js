/* ===== justtheconstitution — theme (subpages) =====
   Reads stored theme preferences and applies them.
   Shares localStorage key with the main reader's tweaks.js.
   No dependencies. */
(() => {
  const MODES = ['light', 'dark', 'oled'];
  const saved = JSON.parse(localStorage.getItem('jtc:tweaks') || '{}');
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
    localStorage.setItem('jtc:tweaks', JSON.stringify(saved));
  });

  // Locale detection for 404 page
  const isEs = /^\/es(\/|$)/.test(location.pathname);
  document.querySelectorAll('[data-locale-es]').forEach(el => {
    el.textContent = isEs ? el.dataset.localeEs : el.textContent;
  });
  document.querySelectorAll('[data-href-locale]').forEach(el => {
    el.href = isEs ? '/es/' : '/en/';
  });

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
