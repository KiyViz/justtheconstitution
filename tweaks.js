/* ===== justtheconstitution — tweaks =====
   Theme / mode / font / reader / copy-mode / font-size.
   Persists via localStorage. Owns the settings panel.
   Depends on: core (el). */
(() => {
  const JTC = window.JTC;
  const { el } = JTC;

  const TWEAK_DEFAULTS = {
    mode: "light",
    theme: "neutral",
    font: "simple",
    reader: "default",
    toc: "open",
    pane: "open",
    fontSize: 17,
    copyMode: "full"
  };

  // Old theme ids → new ids for the 12-theme palette rollout.
  const THEME_MIGRATIONS = {
    parchment: "warm",
    sepia:     "amber",
    clay:      "burgundy",
    olive:     "amber",
    moss:      "forest",
    pine:      "forest",
    indigo:    "electric",
    plum:      "orchid",
    rose:      "burgundy",
    paper:     "neutral"
  };
  const VALID_THEMES = new Set([
    "neutral", "cool", "warm",
    "burgundy", "mango", "amber",
    "forest", "ocean", "slate",
    "poppy", "electric", "orchid"
  ]);
  const VALID_OLED_THEMES = new Set(["neutral", "amber", "green"]);

  function getTweaks() {
    const saved = JSON.parse(localStorage.getItem("jtc:tweaks") || "{}");
    const merged = { ...TWEAK_DEFAULTS, ...saved };
    // Migrate legacy values
    if (merged.font === "sans") merged.font = "simple";
    if (merged.font === "serif") merged.font = "traditional";
    if (!["simple", "traditional", "technical"].includes(merged.font)) merged.font = "simple";
    if (!["open", "closed"].includes(merged.toc)) merged.toc = "open";
    if (!["open", "closed"].includes(merged.pane)) merged.pane = "open";
    if (merged.theme === "oled") { merged.mode = "oled"; merged.theme = "neutral"; }
    if (!["light", "dark", "oled"].includes(merged.mode)) merged.mode = "light";
    if (!["full", "plain"].includes(merged.copyMode)) merged.copyMode = "full";
    // Theme migration: map retired palettes onto the new 12-theme set, then
    // clamp anything still unknown to the default neutral.
    if (THEME_MIGRATIONS[merged.theme]) merged.theme = THEME_MIGRATIONS[merged.theme];
    if (merged.mode === "oled") {
      if (!VALID_OLED_THEMES.has(merged.theme)) merged.theme = "neutral";
    } else {
      if (!VALID_THEMES.has(merged.theme)) merged.theme = "neutral";
    }
    // One-shot default reset: force the typeface back to "simple" on first load
    // after this migration runs. Lets everyone start on the intended default.
    if (merged.schemaVersion !== 2) {
      merged.font = "simple";
      merged.schemaVersion = 2;
    }
    delete merged.layout;
    return merged;
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
    root.dataset.font = t.font;
    root.dataset.reader = t.reader;
    root.dataset.toc = t.toc;
    root.dataset.pane = t.pane;
    root.style.setProperty("--fs-body", `${t.fontSize}px`);

    // Reflect in tweak panel
    document.querySelectorAll(".theme-swatch").forEach(sw => {
      const active = sw.dataset.theme === t.theme && sw.dataset.mode === t.mode;
      sw.classList.toggle("is-active", active);
    });
    // Show only the swatches for the active mode
    document.querySelectorAll(".theme-grid").forEach(g => {
      g.classList.toggle("is-hidden", g.dataset.mode !== t.mode);
    });
    document.querySelectorAll("[data-font-toggle]").forEach(b => {
      b.classList.toggle("is-active", b.dataset.fontToggle === t.font);
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

  // 12 themes × 2 modes (light, dark), grouped into 4 categories of 3.
  // `group` is the label shown above each row of 3 swatches.
  // Vibrant themes include an `accent` so the swatch preview shows their
  // saturated colour alongside the base bg/ink.
  const LIGHT_THEMES = [
    { id: "neutral",  name: "Pure",     group: "Neutral",      bg: "#ffffff", ink: "#111111" },
    { id: "cool",     name: "Cool",     group: "Neutral",      bg: "#f6f7f9", ink: "#13161c" },
    { id: "warm",     name: "Warm",     group: "Neutral",      bg: "#faf7f1", ink: "#1b1812" },
    { id: "burgundy", name: "Burgundy", group: "Earthy warm",  bg: "#ebd7d7", ink: "#2c0912" },
    { id: "mango",    name: "Mango",    group: "Earthy warm",  bg: "#f2d3a8", ink: "#3a1802" },
    { id: "amber",    name: "Amber",    group: "Earthy warm",  bg: "#ecdec2", ink: "#2a1d04" },
    { id: "forest",   name: "Forest",   group: "Earthy cool",  bg: "#d0dbc8", ink: "#0b1d14" },
    { id: "ocean",    name: "Ocean",    group: "Earthy cool",  bg: "#d6dde2", ink: "#0c1e2c" },
    { id: "slate",    name: "Slate",    group: "Earthy cool",  bg: "#dbdee2", ink: "#121a22" },
    { id: "poppy",    name: "Poppy",    group: "Vibrant",      bg: "#fffbf4", ink: "#0c0c10", accent: "#c1123f" },
    { id: "electric", name: "Electric", group: "Vibrant",      bg: "#faf6d4", ink: "#171935", accent: "#1d4ed8" },
    { id: "orchid",   name: "Orchid",   group: "Vibrant",      bg: "#f8efef", ink: "#1d0a21", accent: "#a020b0" }
  ];
  const DARK_THEMES = [
    { id: "neutral",  name: "Pure",     group: "Neutral",      bg: "#121212", ink: "#ededed" },
    { id: "cool",     name: "Cool",     group: "Neutral",      bg: "#10141a", ink: "#e8edf3" },
    { id: "warm",     name: "Warm",     group: "Neutral",      bg: "#16130d", ink: "#eee9dd" },
    { id: "burgundy", name: "Burgundy", group: "Earthy warm",  bg: "#170a0d", ink: "#ebc9cd" },
    { id: "mango",    name: "Mango",    group: "Earthy warm",  bg: "#1b1006", ink: "#f0cb9a" },
    { id: "amber",    name: "Amber",    group: "Earthy warm",  bg: "#1a1408", ink: "#ebd69a" },
    { id: "forest",   name: "Forest",   group: "Earthy cool",  bg: "#0a150f", ink: "#c4d7c5" },
    { id: "ocean",    name: "Ocean",    group: "Earthy cool",  bg: "#081219", ink: "#bccfda" },
    { id: "slate",    name: "Slate",    group: "Earthy cool",  bg: "#0c1016", ink: "#c9d0db" },
    { id: "poppy",    name: "Poppy",    group: "Vibrant",      bg: "#0f0a0d", ink: "#f5e5e8", accent: "#ff6b88" },
    { id: "electric", name: "Electric", group: "Vibrant",      bg: "#0d0e1a", ink: "#e8e8f0", accent: "#60a5fa" },
    { id: "orchid",   name: "Orchid",   group: "Vibrant",      bg: "#150e17", ink: "#e9d8e8", accent: "#e879f9" }
  ];
  // OLED mode — pure black bg across all variants; accent varies
  const OLED_THEMES = [
    { id: "neutral",  name: "Neutral",  group: "OLED", bg: "#000000", ink: "#ffffff" },
    { id: "amber",    name: "Amber",    group: "OLED", bg: "#000000", ink: "#ebd69a" },
    { id: "green",    name: "Green",    group: "OLED", bg: "#000000", ink: "#c7d6b8" }
  ];
  const MODE_THEMES = { light: LIGHT_THEMES, dark: DARK_THEMES, oled: OLED_THEMES };

  function buildGrid(mode, themes) {
    const grid = el("div", { class: "theme-grid", "data-mode": mode });
    // Bucket by `group` preserving array order
    const groups = [];
    const byName = {};
    themes.forEach(th => {
      if (!byName[th.group]) {
        byName[th.group] = { label: th.group, themes: [] };
        groups.push(byName[th.group]);
      }
      byName[th.group].themes.push(th);
    });

    groups.forEach(g => {
      grid.appendChild(el("div", { class: "theme-group__label" }, g.label));
      const row = el("div", { class: "theme-row" });
      g.themes.forEach(th => {
        const sw = el("button", {
          class: "theme-swatch",
          "data-theme": th.id,
          "data-mode": mode,
          title: th.name,
          "aria-label": `${mode} · ${g.label} · ${th.name}`,
          onClick: () => { setTweaks({ mode, theme: th.id }); }
        });
        // Vibrant themes get a 3-stop slice showing bg, ink, and the saturated accent.
        if (th.accent) {
          sw.style.background = `linear-gradient(135deg, ${th.bg} 0 40%, ${th.ink} 40% 70%, ${th.accent} 70% 100%)`;
        } else {
          sw.style.background = `linear-gradient(135deg, ${th.bg} 50%, ${th.ink} 50%)`;
        }
        row.appendChild(sw);
      });
      grid.appendChild(row);
    });
    return grid;
  }

  function renderTweaks() {
    const body = document.getElementById("tweaks-body");
    body.innerHTML = "";

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

    // Color — one grid per mode, only active mode is visible
    const themeRow = el("div", { class: "tweak-row" });
    themeRow.appendChild(el("label", {}, JTC.t("settings.color")));
    themeRow.appendChild(buildGrid("light", LIGHT_THEMES));
    themeRow.appendChild(buildGrid("dark", DARK_THEMES));
    themeRow.appendChild(buildGrid("oled", OLED_THEMES));
    body.appendChild(themeRow);

    // Typeface
    const fontRow = el("div", { class: "tweak-row" });
    fontRow.appendChild(el("label", {}, JTC.t("settings.typeface")));
    const fontToggle = el("div", { class: "toggle-row" }, [
      el("button", { class: "toggle-chip", "data-font-toggle": "simple",      onClick: () => setTweak("font", "simple") },      JTC.t("settings.font_simple")),
      el("button", { class: "toggle-chip", "data-font-toggle": "traditional", onClick: () => setTweak("font", "traditional") }, JTC.t("settings.font_traditional")),
      el("button", { class: "toggle-chip", "data-font-toggle": "technical",   onClick: () => setTweak("font", "technical") },   JTC.t("settings.font_technical"))
    ]);
    fontRow.appendChild(fontToggle);
    body.appendChild(fontRow);


    // Reader mode
    const rdrRow = el("div", { class: "tweak-row" });
    rdrRow.appendChild(el("label", {}, JTC.t("settings.reading_mode")));
    const rdrToggle = el("div", { class: "toggle-row" }, [
      el("button", { class: "toggle-chip", "data-reader-toggle": "default", onClick: () => setTweak("reader", "default") }, JTC.t("settings.reader_default")),
      el("button", { class: "toggle-chip", "data-reader-toggle": "pure", onClick: () => setTweak("reader", "pure") }, JTC.t("settings.reader_pure"))
    ]);
    rdrRow.appendChild(rdrToggle);
    body.appendChild(rdrRow);

    // Copy to clipboard behaviour
    const copyRow = el("div", { class: "tweak-row" });
    copyRow.appendChild(el("label", {}, JTC.t("settings.copy_label")));
    const copyToggle = el("div", { class: "toggle-row" }, [
      el("button", { class: "toggle-chip", "data-copy-toggle": "full",  onClick: () => setTweak("copyMode", "full")  }, JTC.t("settings.copy_citation")),
      el("button", { class: "toggle-chip", "data-copy-toggle": "plain", onClick: () => setTweak("copyMode", "plain") }, JTC.t("settings.copy_plain"))
    ]);
    copyRow.appendChild(copyToggle);
    body.appendChild(copyRow);

    // Font size
    const fsRow = el("div", { class: "tweak-row slider-row" });
    fsRow.appendChild(el("label", {}, [document.createTextNode(JTC.t("settings.text_size")), el("span", { id: "fs-val", class: "val" }, "17px")]));
    const slider = el("input", { type: "range", min: "14", max: "22", step: "1", id: "fs-slider" });
    slider.addEventListener("input", e => setTweak("fontSize", parseInt(e.target.value, 10)));
    fsRow.appendChild(slider);
    body.appendChild(fsRow);
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
  JTC.applyTweaks = applyTweaks;
  JTC.renderTweaks = renderTweaks;
})();
