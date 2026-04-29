/* ===== justtheconstitution — tweaks =====
   Mode / theme / typography / saturation / text-size / copy-mode / reader.
   Persists via localStorage. Owns the settings panel and the reset action.
   Depends on: core (el, showToast). */
(() => {
  const JTC = window.JTC;
  const { el } = JTC;

  // Text-size swatch presets — used by the above-the-fold size picker.
  // The slider in Advanced Settings can fine-tune to any value 14–22.
  const SIZE_PRESETS = { small: 15, medium: 17, large: 20 };

  const TWEAK_DEFAULTS = {
    mode: "light",
    theme: "parchment",
    reader: "default",
    toc: "open",
    pane: "open",
    fontSize: 17,
    copyMode: "plain",
    saturation: "default",
    font: "default"
  };
  // Citation formats — applies to all in-document copy buttons.
  // "plain" = just the passage text. The rest wrap the text with a
  // formatted citation per their respective style guides.
  const VALID_COPY_MODES = new Set([
    "plain", "bluebook", "mla", "chicago", "markdown", "bibtex"
  ]);
  // Two saturation levels — Default leaves the authored theme alone;
  // Vibrant punches up bg/ink/accent per-theme. The old "low-sat" tier
  // was visually too subtle on monochromatic themes to justify the chip.
  const VALID_SATURATION = new Set(["default", "vibrant"]);
  // "default" means typography follows the active theme. The other three
  // are explicit user overrides.
  const VALID_FONT = new Set(["default", "serif", "sans", "mono"]);

  // Legacy theme ids → new ids for the 2026 3×3 restructure
  // (3 themes — Parchment / Modern / Civic — each available in
  // light, dark, and OLED). Map every previously-shipped id onto
  // its closest replacement so existing localStorage values land
  // somewhere coherent on first load.
  const THEME_MIGRATIONS = {
    // Warm-family → Parchment
    warm:      "parchment",
    burgundy:  "parchment",
    mango:     "parchment",
    amber:     "parchment",
    sepia:     "parchment",
    clay:      "parchment",
    olive:     "parchment",
    rose:      "parchment",
    // Neutral / cool family → Modern
    neutral:   "modern",
    pure:      "modern",
    cool:      "modern",
    slate:     "modern",
    forest:    "modern",
    ocean:     "modern",
    moss:      "modern",
    pine:      "modern",
    paper:     "modern",
    green:     "modern",
    // Civic / vibrant family → Civic
    liberty:   "civic",
    poppy:     "civic",
    electric:  "civic",
    orchid:    "civic",
    indigo:    "civic",
    plum:      "civic"
  };
  const VALID_THEMES      = new Set(["parchment", "modern", "civic"]);
  const VALID_OLED_THEMES = new Set(["parchment", "modern", "civic"]);

  function getTweaks() {
    const saved = JSON.parse(localStorage.getItem("jtc:tweaks") || "{}");
    const merged = { ...TWEAK_DEFAULTS, ...saved };
    // Follow OS prefers-color-scheme when the user hasn't picked a mode
    // explicitly. Once they touch the mode toggle their choice persists in
    // localStorage and overrides this. Reset (which clears localStorage)
    // bounces back to OS preference.
    if (!saved.mode && typeof matchMedia === "function") {
      try {
        if (matchMedia("(prefers-color-scheme: dark)").matches) merged.mode = "dark";
      } catch (_) { /* SSR / older browsers — leave default */ }
    }
    if (!["open", "closed"].includes(merged.toc)) merged.toc = "open";
    if (!["open", "closed"].includes(merged.pane)) merged.pane = "open";
    if (merged.theme === "oled") { merged.mode = "oled"; merged.theme = "modern"; }
    if (!["light", "dark", "oled"].includes(merged.mode)) merged.mode = "light";
    // Migrate the legacy two-value enum (full / plain) to the new six-format
    // enum. "full" used to mean "with citation"; map it to Bluebook (the
    // most authoritative format for a constitutional source), preserving
    // the user's "I want citations" intent.
    if (merged.copyMode === "full") merged.copyMode = "bluebook";
    if (!VALID_COPY_MODES.has(merged.copyMode)) merged.copyMode = "plain";
    // Migrate any retired saturation ids (Pkg-7 mono/low, Pkg-8 low-sat)
    // onto "default". Only "vibrant" survives as a non-default level.
    if (saved.saturation && saved.saturation !== "vibrant") merged.saturation = "default";
    if (!VALID_SATURATION.has(merged.saturation)) merged.saturation = "default";
    // Migrate legacy font ids: simple→sans, traditional→serif, technical→mono.
    if (merged.font === "simple") merged.font = "sans";
    if (merged.font === "traditional") merged.font = "serif";
    if (merged.font === "technical") merged.font = "mono";
    if (!VALID_FONT.has(merged.font)) merged.font = "default";
    // Theme migration — legacy ids → parchment/modern/civic.
    if (THEME_MIGRATIONS[merged.theme]) merged.theme = THEME_MIGRATIONS[merged.theme];
    if (merged.mode === "oled") {
      if (!VALID_OLED_THEMES.has(merged.theme)) merged.theme = "modern";
    } else {
      if (!VALID_THEMES.has(merged.theme)) merged.theme = "modern";
    }
    // CVD picker has been retired; clear any leftover key.
    delete merged.cvd;
    delete merged.layout;
    return merged;
  }
  function resetTweaks() {
    // Order matters: rebuild the panel DOM first, THEN sync state. If
    // applyTweaks runs before renderTweaks, the freshly-built grids never
    // get the .is-hidden class for non-active modes, and all 9 swatches
    // appear at once.
    localStorage.removeItem("jtc:tweaks");
    renderTweaks();
    applyTweaks();
    if (JTC.showToast) JTC.showToast(JTC.t("settings.reset_toast"));
  }
  function setTweak(key, val) {
    const t = getTweaks();
    t[key] = val;
    localStorage.setItem("jtc:tweaks", JSON.stringify(t));
    applyTweaks();
  }

  function applyTweaks() {
    const t = getTweaks();
    const root = document.documentElement;
    root.dataset.mode = t.mode;
    root.dataset.theme = t.theme;
    root.dataset.saturation = t.saturation;
    // data-font is only set when the user explicitly overrides typography.
    // "default" means no attribute, so theme-bound CSS rules apply.
    if (t.font === "default") {
      delete root.dataset.font;
    } else {
      root.dataset.font = t.font;
    }
    root.dataset.reader = t.reader;
    root.dataset.toc = t.toc;
    root.dataset.pane = t.pane;
    root.style.setProperty("--fs-body", `${t.fontSize}px`);

    // Reflect in tweak panel
    document.querySelectorAll(".theme-swatch").forEach(sw => {
      const active = sw.dataset.theme === t.theme && sw.dataset.mode === t.mode;
      sw.classList.toggle("is-active", active);
    });
    document.querySelectorAll(".theme-grid").forEach(g => {
      g.classList.toggle("is-hidden", g.dataset.mode !== t.mode);
    });
    document.querySelectorAll("[data-reader-toggle]").forEach(b => {
      b.classList.toggle("is-active", b.dataset.readerToggle === t.reader);
    });
    document.querySelectorAll("[data-mode-toggle]").forEach(b => {
      b.classList.toggle("is-active", b.dataset.modeToggle === t.mode);
    });
    document.querySelectorAll("[data-copy-toggle]").forEach(b => {
      b.classList.toggle("is-active", b.dataset.copyToggle === t.copyMode);
    });
    document.querySelectorAll("[data-saturation-toggle]").forEach(b => {
      b.classList.toggle("is-active", b.dataset.saturationToggle === t.saturation);
    });
    document.querySelectorAll("[data-font-toggle]").forEach(b => {
      b.classList.toggle("is-active", b.dataset.fontToggle === t.font);
    });
    document.querySelectorAll("[data-size-toggle]").forEach(b => {
      b.classList.toggle("is-active", SIZE_PRESETS[b.dataset.sizeToggle] === t.fontSize);
    });
    const colorDetail = document.getElementById("color-row-detail");
    if (colorDetail) {
      const active = (MODE_THEMES[t.mode] || []).find(th => th.id === t.theme);
      colorDetail.textContent = active ? "· " + active.name : "";
    }
    const fs = document.getElementById("fs-slider");
    if (fs) { fs.value = t.fontSize; document.getElementById("fs-val").textContent = `${t.fontSize}px`; }

    // Mode toggle icon (sun in light, moon in dark, lightning bolt in oled).
    // Mirror into #reader-mode-icon so the reader-mode floating button stays
    // in sync with the header one.
    let modeSvg;
    if (t.mode === "oled") {
      modeSvg = '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" stroke="none"/>';
    } else if (t.mode === "dark") {
      modeSvg = '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>';
    } else {
      modeSvg = '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>';
    }
    const mi = document.getElementById("mode-icon");
    if (mi) mi.innerHTML = modeSvg;
    const rmi = document.getElementById("reader-mode-icon");
    if (rmi) rmi.innerHTML = modeSvg;
    const tmi = document.getElementById("tools-mode-icon");
    if (tmi) tmi.innerHTML = modeSvg;
    const mb = document.getElementById("mode-toggle");
    if (mb) {
      const next = t.mode === "light" ? "dark" : t.mode === "dark" ? "oled" : "light";
      const nextUpper = t.mode === "light" ? "Dark" : t.mode === "dark" ? "OLED" : "Light";
      const ariaKey = t.mode === "light" ? "settings.switch_dark" : t.mode === "dark" ? "settings.switch_oled" : "settings.switch_light";
      mb.setAttribute("aria-label", JTC.t(ariaKey));
      mb.setAttribute("title", JTC.t(ariaKey + "_short"));
    }

    // Reader toggle state
    const rb = document.getElementById("reader-toggle");
    if (rb) rb.setAttribute("aria-pressed", t.reader === "pure" ? "true" : "false");

    // Image pane collapse icon direction
    const pcb = document.getElementById("pane-collapse");
    if (pcb) pcb.setAttribute("aria-expanded", t.pane === "open" ? "true" : "false");
  }

  // 3 themes × 3 modes (light, dark, oled).
  // Only Civic carries a non-monochrome `accent`; Parchment and Modern
  // are deliberately monochrome (accent = ink) to keep the page quiet.
  const LIGHT_THEMES = [
    { id: "parchment", name: "Parchment", bg: "#f0e6d0", ink: "#2a1c0a" },
    { id: "modern",    name: "Modern",    bg: "#fafaf7", ink: "#1a1a1a" },
    { id: "civic",     name: "Civic",     bg: "#f0e4cf", ink: "#2c3a4f", accent: "#b04a35" }
  ];
  const DARK_THEMES = [
    { id: "parchment", name: "Parchment", bg: "#1a140a", ink: "#ebd69a" },
    { id: "modern",    name: "Modern",    bg: "#14161a", ink: "#ededed" },
    { id: "civic",     name: "Civic",     bg: "#141a26", ink: "#e8d9b4", accent: "#d5725b" }
  ];
  // OLED — pure black bg, ink/accent inherit each theme's identity.
  const OLED_THEMES = [
    { id: "parchment", name: "Parchment", bg: "#000000", ink: "#ebd69a" },
    { id: "modern",    name: "Modern",    bg: "#000000", ink: "#f5f5f5" },
    { id: "civic",     name: "Civic",     bg: "#000000", ink: "#e8d9b4", accent: "#e87053" }
  ];
  const MODE_THEMES = { light: LIGHT_THEMES, dark: DARK_THEMES, oled: OLED_THEMES };

  // Build a swatch grid for one mode. Each swatch fills with a large "Aa"
  // rendered in the theme's bg/ink and that theme's body typography, so the
  // tile previews both colour AND type personality at once. The active
  // theme name appears in the row caption (handled in applyTweaks), not on
  // the swatch itself, to keep each tile clean.
  function buildGrid(mode, themes) {
    const grid = el("div", { class: "theme-grid", "data-mode": mode });
    const row = el("div", { class: "theme-row" });

    themes.forEach(th => {
      const sw = el("button", {
        class: "theme-swatch",
        "data-theme": th.id,
        "data-mode": mode,
        title: th.name,
        "aria-label": `${mode} · ${th.name}`,
        onClick: () => { setTweaks({ mode, theme: th.id }); }
      });
      sw.style.background = th.bg;
      sw.style.color = th.ink;

      // Big Aa preview that fills the tile.
      const aa = el("span", { class: "swatch-aa" }, "Aa");
      sw.appendChild(aa);

      // Accent dot (Civic only) — small mark in the corner so the
      // non-monochrome theme is identifiable without text overlay.
      if (th.accent) {
        const dot = el("span", { class: "swatch-dot" });
        dot.style.background = th.accent;
        sw.appendChild(dot);
      }

      row.appendChild(sw);
    });

    grid.appendChild(row);
    return grid;
  }

  function renderTweaks() {
    const body = document.getElementById("tweaks-body");
    body.innerHTML = "";

    // Above-the-fold layout:
    //   0. Tools     (lang / reader / mode icons — mirrors the desktop header
    //                 icons that get hidden on mobile)
    //   1. Mode      (Light / Dark / OLED)
    //   2. Color     (3 Aa swatches; theme name appears in the row caption)
    //   3. Text size (3 size swatches; precise slider lives in Advanced)
    //   4. Copy      (With citation / Plain text — applies to all in-doc
    //                 copy buttons, not the share-popover Copy Link)

    // Tools — icon buttons for the same actions as the desktop header
    // (language switcher, reader-mode toggle, mode toggle). On mobile the
    // header strips these out for space; the Tools row keeps them reachable.
    const toolsRow = el("div", { class: "tweak-row tools-row" });
    toolsRow.appendChild(el("label", {}, JTC.t("settings.tools")));
    const toolsBar = el("div", { class: "tools-bar" });

    // Each Tools button is icon-only by default; the label slides in on
    // hover/focus, mirroring the desktop language switcher's behavior.

    // Language switcher — delegate to the existing #lang-btn so the locale
    // logic in lang.js stays single-source.
    const langBtn = el("button", {
      class: "tools-btn",
      id: "tools-lang-btn",
      type: "button",
      "aria-label": JTC.t("lang.button_aria"),
      title: JTC.t("lang.button_title"),
      onClick: () => { const b = document.getElementById("lang-btn"); if (b) b.click(); }
    });
    langBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg><span class="tools-btn__label">' + JTC.t("lang.button_title") + '</span>';
    toolsBar.appendChild(langBtn);

    // Reader-mode toggle.
    const readerBtn = el("button", {
      class: "tools-btn",
      id: "tools-reader-toggle",
      type: "button",
      "aria-label": JTC.t("btn.reader_aria"),
      title: JTC.t("btn.reader_title"),
      onClick: () => JTC.toggleReader && JTC.toggleReader()
    });
    readerBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h8M8 17h5"/></svg><span class="tools-btn__label">' + JTC.t("btn.reader_title") + '</span>';
    toolsBar.appendChild(readerBtn);

    // Mode (Light → Dark → OLED) cycle. applyTweaks keeps #tools-mode-icon
    // in sync with the header's mode icon.
    const modeCycle = el("button", {
      class: "tools-btn",
      id: "tools-mode-toggle",
      type: "button",
      "aria-label": JTC.t("btn.mode_aria"),
      title: JTC.t("btn.mode_title"),
      onClick: () => JTC.toggleMode && JTC.toggleMode()
    });
    modeCycle.innerHTML = '<svg id="tools-mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg><span class="tools-btn__label">' + JTC.t("btn.mode_title") + '</span>';
    toolsBar.appendChild(modeCycle);

    toolsRow.appendChild(toolsBar);
    body.appendChild(toolsRow);

    // Mode — light / dark / oled segmented control
    const modeRow = el("div", { class: "tweak-row" });
    modeRow.appendChild(el("label", {}, JTC.t("settings.mode")));
    const modeToggle = el("div", { class: "toggle-row" }, [
      el("button", { class: "toggle-chip", "data-mode-toggle": "light", onClick: () => setMode("light") }, JTC.t("settings.mode_light")),
      el("button", { class: "toggle-chip", "data-mode-toggle": "dark",  onClick: () => setMode("dark")  }, JTC.t("settings.mode_dark")),
      el("button", { class: "toggle-chip", "data-mode-toggle": "oled",  onClick: () => setMode("oled")  }, JTC.t("settings.mode_oled"))
    ]);
    modeRow.appendChild(modeToggle);
    body.appendChild(modeRow);

    // Color — one grid per mode (only active mode is visible).
    // The label gets a `<span#color-row-detail>` that applyTweaks() updates
    // with "· {ThemeName}" so the active theme name is always visible without
    // crowding the swatch tiles themselves.
    const themeRow = el("div", { class: "tweak-row" });
    const colorLabel = el("label", {}, [
      document.createTextNode(JTC.t("settings.color")),
      el("span", { id: "color-row-detail", class: "label-detail" }, "")
    ]);
    themeRow.appendChild(colorLabel);
    themeRow.appendChild(buildGrid("light", LIGHT_THEMES));
    themeRow.appendChild(buildGrid("dark", DARK_THEMES));
    themeRow.appendChild(buildGrid("oled", OLED_THEMES));
    body.appendChild(themeRow);

    // Text size — three Aa swatches (small/medium/large) at preset values.
    // Slider for fine-tune lives in Advanced.
    const sizeRow = el("div", { class: "tweak-row" });
    sizeRow.appendChild(el("label", {}, JTC.t("settings.text_size")));
    const sizeGrid = el("div", { class: "size-grid" });
    [
      { id: "small",  label: JTC.t("settings.size_small"),  px: SIZE_PRESETS.small  },
      { id: "medium", label: JTC.t("settings.size_medium"), px: SIZE_PRESETS.medium },
      { id: "large",  label: JTC.t("settings.size_large"),  px: SIZE_PRESETS.large  }
    ].forEach(s => {
      const sw = el("button", {
        class: "size-swatch",
        "data-size-toggle": s.id,
        title: s.label,
        "aria-label": `${JTC.t("settings.text_size")} · ${s.label}`,
        onClick: () => setTweak("fontSize", s.px)
      });
      const aa = el("span", { class: "size-aa" }, "Aa");
      aa.style.fontSize = `${s.px + 6}px`;
      sw.appendChild(aa);
      sizeGrid.appendChild(sw);
    });
    sizeRow.appendChild(sizeGrid);
    body.appendChild(sizeRow);

    // Citation format — applies to all in-document copy buttons. "Plain" is
    // the default; the others wrap the copied passage with a formatted
    // citation per the respective style guide. Bluebook is the legal
    // standard for constitutional citations; MLA and Chicago serve
    // academic/humanities audiences; Markdown ("MD") is for blogs and
    // note-taking apps; BibTeX serves academic LaTeX users.
    const copyRow = el("div", { class: "tweak-row" });
    copyRow.appendChild(el("label", {}, JTC.t("settings.copy_label")));
    const copyToggle = el("div", { class: "toggle-row" }, [
      el("button", { class: "toggle-chip", "data-copy-toggle": "plain",    onClick: () => setTweak("copyMode", "plain") },    JTC.t("settings.copy_plain")),
      el("button", { class: "toggle-chip", "data-copy-toggle": "bluebook", onClick: () => setTweak("copyMode", "bluebook") }, JTC.t("settings.copy_bluebook")),
      el("button", { class: "toggle-chip", "data-copy-toggle": "mla",      onClick: () => setTweak("copyMode", "mla") },      JTC.t("settings.copy_mla")),
      el("button", { class: "toggle-chip", "data-copy-toggle": "chicago",  onClick: () => setTweak("copyMode", "chicago") },  JTC.t("settings.copy_chicago")),
      el("button", { class: "toggle-chip", "data-copy-toggle": "markdown", onClick: () => setTweak("copyMode", "markdown") }, JTC.t("settings.copy_markdown")),
      el("button", { class: "toggle-chip", "data-copy-toggle": "bibtex",   onClick: () => setTweak("copyMode", "bibtex") },   JTC.t("settings.copy_bibtex"))
    ]);
    copyRow.appendChild(copyToggle);
    body.appendChild(copyRow);

    // ── Advanced settings (collapsed by default) ──
    const adv = el("details", { class: "tweak-more" });
    adv.appendChild(el("summary", { class: "tweak-more__summary" }, JTC.t("settings.advanced")));

    // Typography — four chips (Default / Serif / Sans-serif / Mono).
    // "Default" follows the active theme; the others override via [data-font].
    const typoRow = el("div", { class: "tweak-row" });
    typoRow.appendChild(el("label", {}, JTC.t("settings.typeface")));
    const typoToggle = el("div", { class: "toggle-row" }, [
      el("button", { class: "toggle-chip", "data-font-toggle": "default", onClick: () => setTweak("font", "default") }, JTC.t("settings.font_default")),
      el("button", { class: "toggle-chip", "data-font-toggle": "serif",   onClick: () => setTweak("font", "serif") },   JTC.t("settings.font_serif")),
      el("button", { class: "toggle-chip", "data-font-toggle": "sans",    onClick: () => setTweak("font", "sans") },    JTC.t("settings.font_sans")),
      el("button", { class: "toggle-chip", "data-font-toggle": "mono",    onClick: () => setTweak("font", "mono") },    JTC.t("settings.font_mono"))
    ]);
    typoRow.appendChild(typoToggle);
    adv.appendChild(typoRow);

    // Saturation sub-theme — three chips. Each level has explicit per-theme
    // values in styles.css so all themes show a visible difference, not
    // just Civic. Default is the authored theme; Low desaturates everything;
    // Vibrant amplifies bg/ink/accent.
    const satRow = el("div", { class: "tweak-row" });
    satRow.appendChild(el("label", {}, JTC.t("settings.saturation")));
    const satToggle = el("div", { class: "toggle-row" }, [
      el("button", { class: "toggle-chip", "data-saturation-toggle": "default", onClick: () => setTweak("saturation", "default") }, JTC.t("settings.sat_default")),
      el("button", { class: "toggle-chip", "data-saturation-toggle": "vibrant", onClick: () => setTweak("saturation", "vibrant") }, JTC.t("settings.sat_vibrant"))
    ]);
    satRow.appendChild(satToggle);
    adv.appendChild(satRow);

    // Text size — fine slider (14–22px).
    const fsRow = el("div", { class: "tweak-row slider-row" });
    fsRow.appendChild(el("label", {}, [document.createTextNode(JTC.t("settings.text_size")), el("span", { id: "fs-val", class: "val" }, "17px")]));
    const slider = el("input", { type: "range", min: "14", max: "22", step: "1", id: "fs-slider" });
    slider.addEventListener("input", e => setTweak("fontSize", parseInt(e.target.value, 10)));
    fsRow.appendChild(slider);
    adv.appendChild(fsRow);

    body.appendChild(adv);
  }

  // Batch set multiple tweaks at once (e.g. mode + theme together)
  function setTweaks(patch) {
    const t = getTweaks();
    Object.assign(t, patch);
    localStorage.setItem("jtc:tweaks", JSON.stringify(t));
    applyTweaks();
  }

  // Switch mode and pick a theme valid for that mode.
  // Preserves the current theme id if it exists in the target mode; otherwise falls back to "neutral".
  function setMode(mode) {
    const themes = MODE_THEMES[mode] || LIGHT_THEMES;
    const t = getTweaks();
    const theme = themes.some(th => th.id === t.theme) ? t.theme : "neutral";
    setTweaks({ mode, theme });
  }

  // Cycle Light → Dark → OLED → Light on the quick header button
  function toggleMode() {
    const t = getTweaks();
    const next = t.mode === "light" ? "dark" : t.mode === "dark" ? "oled" : "light";
    setMode(next);
  }
  function toggleReader() {
    const t = getTweaks();
    setTweak("reader", t.reader === "pure" ? "default" : "pure");
  }

  JTC.getTweaks = getTweaks;
  JTC.setTweak = setTweak;
  JTC.setTweaks = setTweaks;
  JTC.setMode = setMode;
  JTC.toggleMode = toggleMode;
  JTC.toggleReader = toggleReader;
  JTC.resetTweaks = resetTweaks;
  JTC.applyTweaks = applyTweaks;
  JTC.renderTweaks = renderTweaks;
})();
