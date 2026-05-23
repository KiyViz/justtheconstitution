/* ===== justtheconstitution — lang =====
   Language/locale switcher. Globe icon expands on hover to show
   the current language name; clicking switches to the next locale.
   Depends on: core (el). */
(() => {
  const JTC = window.JTC;

  function init() {
    const root = document.documentElement;
    let locales;
    try { locales = JSON.parse(root.dataset.locales || "[]"); } catch { return; }
    const current = root.dataset.currentLocale || "en";
    if (locales.length < 2) return;

    const btn = document.getElementById("lang-btn");
    const label = document.getElementById("lang-label");
    if (!btn || !label) return;

    // Show current language name + keyboard shortcut on hover. The shortcut
    // suffix mirrors how other header tool buttons advertise their bindings
    // in their slide-out labels (e.g., "Reader mode (Shift+R)").
    const currentLocale = locales.find(l => l.code === current);
    if (currentLocale) label.textContent = currentLocale.name + " (Shift+L)";

    // Find the next locale to switch to
    const currentIdx = locales.findIndex(l => l.code === current);
    const nextLocale = locales[(currentIdx + 1) % locales.length];

    btn.addEventListener("click", () => {
      JTC.trackEvent('language_switched');
      localStorage.setItem("jtc:lang", nextLocale.code);
      location.href = "../" + nextLocale.code + "/" + location.hash;
    });
  }

  JTC.initLang = init;
})();
