/* ===== justtheconstitution — app =====
   Thin orchestrator. Renders everything in the right order, wires up the
   header-bar buttons and scroll handler, then delegates. All behavior lives
   in the other JTC modules.
   Depends on: every other JTC module having loaded first. */
(() => {
  const JTC = window.JTC;
  const {
    renderText, renderToc, renderProgress, renderTweaks,
    updateProgress, updateActive, applyTweaks, initHashSync,
    setCurrentPage, initImagePane, initLightbox,
    openDrawer, closeDrawer, initShare,
    toggleMode, toggleReader, setTweak, getTweaks,
    scrollToId
  } = JTC;

  function init() {
    renderText();
    document.querySelectorAll(".toc.toc--inline").forEach(t => renderToc(t));
    renderProgress();
    renderTweaks();
    // Wire URL-hash observer after .anchor elements exist.
    initHashSync();

    // Image pane — initial
    setCurrentPage(1, true);

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
    const toggleTweaksPanel = () => {
      document.getElementById("tweaks").classList.toggle("is-open");
    };
    document.getElementById("tweaks-btn").addEventListener("click", toggleTweaksPanel);
    document.getElementById("tweaks-close").addEventListener("click", () => {
      document.getElementById("tweaks").classList.remove("is-open");
    });

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

    // Scroll handlers
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateProgress();
          updateActive();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    window.addEventListener("resize", () => {
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

    // Initial state
    updateProgress();
    updateActive();

    // Deep link
    if (location.hash) {
      setTimeout(() => scrollToId(location.hash.slice(1)), 60);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
