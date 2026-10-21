/* ===== justtheconstitution — app =====
   Thin orchestrator. Renders everything in the right order, wires up the
   header-bar buttons and scroll handler, then delegates. All behavior lives
   in the other JTC modules.
   Depends on: every other JTC module having loaded first. */
(() => {
  const JTC = window.JTC;
  // Capture before rendering, observers, or browser scroll restoration run.
  const incomingHash = location.hash;
  const {
    renderText, renderToc, renderProgress, renderTweaks,
    updateProgress, updateActive, applyTweaks, initHashSync,
    initImagePane, initLightbox,
    openDrawer, closeDrawer, initShare,
    toggleMode, toggleReader, setTweak, getTweaks,
    scrollToId
  } = JTC;

  function init() {
    renderText();
    document.querySelectorAll(".toc.toc--inline").forEach(t => renderToc(t));
    renderProgress();
    renderTweaks();

    // Initialize language system
    if (JTC.initLang) JTC.initLang();


    // Wiring
    // Menu button opens the TOC drawer — only surfaced on narrower viewports
    // where the inline sidebar is auto-hidden by CSS.
    document.getElementById("menu-btn").addEventListener("click", openDrawer);
    document.getElementById("drawer-close").addEventListener("click", closeDrawer);
    document.getElementById("toc-drawer").addEventListener("click", e => {
      if (e.target.id === "toc-drawer") closeDrawer();
    });

    document.getElementById("mode-toggle").addEventListener("click", toggleMode);
    document.getElementById("reader-toggle").addEventListener("click", toggleReader);
    document.getElementById("reader-exit").addEventListener("click", () => setTweak("reader", "default"));
    document.getElementById("pane-collapse").addEventListener("click", () => { const t = getTweaks(); setTweak("pane", t.pane === "open" ? "closed" : "open"); });
    document.getElementById("pane-expand").addEventListener("click", () => setTweak("pane", "open"));
    const tweaksEl = document.getElementById("tweaks");
    let settingsTrigger;
    const settingsButtons = ['tweaks-btn', 'reader-settings-btn'].map(id => document.getElementById(id)).filter(Boolean);
    settingsButtons.forEach(btn => { btn.setAttribute('aria-controls', 'tweaks'); btn.setAttribute('aria-expanded', 'false'); });
    tweaksEl.setAttribute('role', 'region');
    const openTweaks = () => {
      if (tweaksEl.classList.contains('is-open')) return;
      if (JTC.openTool) JTC.openTool('settings');
      settingsTrigger = document.activeElement;
      tweaksEl.classList.add("is-open");
      settingsButtons.forEach(btn => btn.setAttribute('aria-expanded', 'true'));
      JTC.focusFirst(tweaksEl);
    };
    const closeTweaks = () => {
      if (!tweaksEl.classList.contains('is-open')) return;
      const returnToTrigger = tweaksEl.contains(document.activeElement);
      tweaksEl.classList.remove("is-open");
      settingsButtons.forEach(btn => btn.setAttribute('aria-expanded', 'false'));
      if (returnToTrigger) JTC.returnFocus(settingsTrigger);
    };
    JTC.closeTweaks = closeTweaks;
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && tweaksEl.classList.contains('is-open')) { e.preventDefault(); closeTweaks(); }
    });
    const toggleTweaksPanel = () => {
      if (tweaksEl.classList.contains("is-open")) closeTweaks();
      else openTweaks();
    };
    if (JTC.registerTool) JTC.registerTool('settings', closeTweaks);
    document.getElementById("tweaks-btn").addEventListener("click", toggleTweaksPanel);
    document.getElementById("tweaks-close").addEventListener("click", closeTweaks);
    const tweaksReset = document.getElementById("tweaks-reset");
    if (tweaksReset && JTC.resetTweaks) tweaksReset.addEventListener("click", JTC.resetTweaks);

    // Reader-mode floating controls (only shown in pure reader via CSS).
    const readerModeBtn = document.getElementById("reader-mode-toggle");
    if (readerModeBtn) readerModeBtn.addEventListener("click", toggleMode);
    const readerSettingsBtn = document.getElementById("reader-settings-btn");
    if (readerSettingsBtn) readerSettingsBtn.addEventListener("click", toggleTweaksPanel);

    initShare();
    initImagePane();
    initLightbox();
    // Search (open via header button or Ctrl/Cmd+F).
    if (JTC.initSearch) {
      JTC.initSearch();
      const searchBtn = document.getElementById("search-btn");
      if (searchBtn) searchBtn.addEventListener("click", JTC.openSearch);
    }
    initShortcuts();

    // Scroll handlers
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateProgress();
          updateActive();
          const pct = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
          if (pct > 0.5) JTC.trackEvent('scroll_depth_50');
          if (pct > 0.95) JTC.trackEvent('scroll_depth_100');
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Re-anchor only on width changes: phones fire height-only resizes when
    // the address bar shows or hides, and snapping then jumps mid-paragraph.
    let lastWidth = window.innerWidth;
    window.addEventListener("resize", () => {
      const widthChanged = window.innerWidth !== lastWidth;
      lastWidth = window.innerWidth;
      if (widthChanged && JTC.readerReady && JTC.currentPassage && window.scrollY > 0) scrollToId(JTC.currentPassage, { behavior: 'instant' });
      renderProgress();
      updateProgress();
    });

    // Re-measure after fonts swap in (line heights change — invalidates section positions)
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { renderProgress(); updateProgress(); });
    }
    // And once more on full load (images, async CSS, etc.)
    window.addEventListener("load", () => { renderProgress(); updateProgress(); });

    // Apply tweaks (theme, layout, fs)
    applyTweaks();

    // Initial layout must settle before restoring a passage. An explicit link
    // always takes precedence over local resume, even if the link is invalid.
    initHashSync();
    updateProgress();
    updateActive();
    let initialId = null;
    try { initialId = incomingHash ? decodeURIComponent(incomingHash.slice(1)) : JTC.getSavedPassage(); } catch {}
    const interrupt = () => { JTC.layoutPassage = null; };
    const interruptKey = e => { if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) interrupt(); };
    window.addEventListener('wheel', interrupt, { passive: true });
    window.addEventListener('touchmove', interrupt, { passive: true });
    window.addEventListener('pointerdown', interrupt, { passive: true });
    window.addEventListener('keydown', interruptKey);
    if (initialId) scrollToId(initialId, { behavior: 'instant' });
    const loaded = document.readyState === 'complete' ? Promise.resolve() : new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
    Promise.all([loaded, document.fonts ? document.fonts.ready : Promise.resolve()]).then(() => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        // A newer intentional navigation replaces the startup target. Manual
        // scrolling cancels it, so late fonts never pull the reader backward.
        if (JTC.layoutPassage) scrollToId(JTC.layoutPassage, { behavior: 'instant' });
        JTC.layoutPassage = null;
        JTC.readerReady = true;
        renderProgress(); updateProgress(); updateActive();
        window.removeEventListener('wheel', interrupt);
        window.removeEventListener('touchmove', interrupt);
        window.removeEventListener('pointerdown', interrupt);
        window.removeEventListener('keydown', interruptKey);
      }));
    });
    window.addEventListener('hashchange', () => {
      try { scrollToId(decodeURIComponent(location.hash.slice(1))); } catch {}
    });

    // Sticky footer expand/collapse
    const footerEl = document.getElementById('site-footer');
    const sentinel = document.getElementById('footer-sentinel');
    if (footerEl && sentinel) {
      new IntersectionObserver(([entry]) => {
        footerEl.classList.toggle('is-expanded', entry.isIntersecting);
      }).observe(sentinel);
    }
  }

  // Centralized keyboard shortcuts. Each fires the click on the corresponding
  // header button so the existing handlers (state, telemetry, focus mgmt) run
  // exactly as if the user had clicked. Ctrl/Cmd+F is handled separately in
  // search.js — it's an older binding that fires even from inside inputs.
  //
  // Shortcut table (matches the tooltip strings in data/strings.*.js):
  //   /        Open search
  //   ,        Toggle settings panel
  //   Shift+R  Toggle reader mode
  //   Shift+S  Toggle share popover
  //   Shift+D  Cycle display mode (light → dark → OLED)
  //   Shift+L  Switch language (cycles configured locales)
  //   Shift+M  Open the TOC drawer (mobile/narrow viewports only)
  //
  // All shortcuts bail when the user is typing into an input/textarea, and
  // bail when Ctrl/Cmd/Alt are pressed so they don't collide with browser
  // chords. Shift is the only modifier our shortcuts use.
  function initShortcuts() {
    document.addEventListener("keydown", (e) => {
      const t = document.activeElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const click = (id) => {
        const btn = document.getElementById(id);
        if (btn) { btn.click(); return true; }
        return false;
      };

      if (e.shiftKey) {
        switch (e.key) {
          case "R": if (click("reader-toggle")) e.preventDefault(); return;
          case "S": if (click("share-btn"))     e.preventDefault(); return;
          case "D": if (click("mode-toggle"))   e.preventDefault(); return;
          case "L": if (click("lang-btn"))      e.preventDefault(); return;
          case "M": {
            // Only fire at viewport widths where the menu button is actually
            // visible — on desktop the inline TOC is always shown and the
            // drawer is hidden chrome.
            const mb = document.getElementById("menu-btn");
            if (mb && mb.offsetParent !== null) { e.preventDefault(); mb.click(); }
            return;
          }
        }
        return;
      }

      switch (e.key) {
        case "/":
          if (JTC.openSearch) { e.preventDefault(); JTC.openSearch(); }
          return;
        case ",":
          if (click("tweaks-btn")) e.preventDefault();
          return;
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
