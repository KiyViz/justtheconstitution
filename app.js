/* ===== justtheconstitution — app ===== */
(() => {
  const C = window.CONSTITUTION;

  // ---- Flat chapter list for progress bar (chapters = articles + amendments group) ----
  const chapters = [
    { id: "preamble", label: "Preamble", short: "Pre" },
    ...C.articles.map(a => ({ id: a.id, label: a.label, short: a.label.replace("Article ", "") })),
    { id: "signatures", label: "Signatures", short: "Sig" },
    { id: "amendments", label: "Amendments", short: "Am" }
  ];

  // Section list for TOC
  const tocItems = [
    { id: "preamble", label: "Preamble", kind: "top" },
    ...C.articles.flatMap(a => [
      { id: a.id, label: a.label, sub: a.subtitle, kind: "article" },
      ...a.sections.map(s => ({ id: s.id, label: `${s.label}${s.heading ? " · " + s.heading : ""}`, kind: "section" }))
    ]),
    { id: "signatures", label: "Signatures", kind: "top" },
    { id: "amendments", label: "Amendments", kind: "top" },
    ...C.amendments.map(am => ({ id: am.id, label: `${am.num}. ${am.subtitle}`, kind: "amendment" }))
  ];

  // ---- Page → source image mapping ----
  // Local filenames match the webp output of optimize-images.ps1 (run from repo root).
  // Remote fallbacks are the National Archives' 630px JPGs; download links point to the
  // Archives' high-res downloads page (TIFFs etc).
  const PAGE_IMAGES = {
    1: {
      title: "Page 1 of 4",
      caption: "Preamble through Article I, §7",
      local: "images/Constitution_Pg1of4_AC.webp",
      fallback: "https://www.archives.gov/files/founding-docs/constitution-page1.jpg",
      download: "https://www.archives.gov/founding-docs/downloads"
    },
    2: {
      title: "Page 2 of 4",
      caption: "Article I, §8 through Article II, §1",
      local: "images/Constitution_Pg2of4_AC.webp",
      fallback: "https://www.archives.gov/files/founding-docs/constitution-page2.jpg",
      download: "https://www.archives.gov/founding-docs/downloads"
    },
    3: {
      title: "Page 3 of 4",
      caption: "Article II, §2 through Article IV",
      local: "images/Constitution_Pg3of4_AC.webp",
      fallback: "https://www.archives.gov/files/founding-docs/constitution-page3.jpg",
      download: "https://www.archives.gov/founding-docs/downloads"
    },
    4: {
      title: "Page 4 of 4",
      caption: "Article V through signatures",
      local: "images/Constitution_Pg4of4_AC.webp",
      fallback: "https://www.archives.gov/files/founding-docs/constitution-page4.jpg",
      download: "https://www.archives.gov/founding-docs/downloads"
    },
    bor: {
      title: "Bill of Rights",
      caption: "Ratified December 15, 1791 — Amendments I–X",
      local: "images/Bill_of_Rights_Pg1of1_AC.webp",
      fallback: "https://www.archives.gov/files/founding-docs/bill-of-rights.jpg",
      download: "https://www.archives.gov/founding-docs/downloads"
    }
  };

  // ---- Build DOM ----

  function el(tag, props = {}, children = []) {
    const e = document.createElement(tag);
    for (const k in props) {
      if (k === "class") e.className = props[k];
      else if (k === "html") e.innerHTML = props[k];
      else if (k.startsWith("on")) e.addEventListener(k.slice(2).toLowerCase(), props[k]);
      else if (k === "data") for (const d in props.data) e.dataset[d] = props.data[d];
      else if (props[k] !== undefined && props[k] !== null) e.setAttribute(k, props[k]);
    }
    (Array.isArray(children) ? children : [children]).forEach(c => {
      if (c == null || c === false) return;
      e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return e;
  }

  // ---- Text pane ----
  function renderText() {
    const pane = document.getElementById("text-pane");

    // Title
    pane.appendChild(el("h1", { class: "doc-title" }, "The Constitution of the United States"));
    pane.appendChild(el("div", { class: "doc-tag" }, "We the People · September 17, 1787"));

    // Preamble
    const pre = el("section", { id: "preamble", class: "anchor", "data-chapter": "preamble" });
    pre.appendChild(el("p", { class: "preamble" }, C.preamble.text));
    pane.appendChild(pre);

    // Articles
    C.articles.forEach(a => {
      const art = el("section", { id: a.id, class: "anchor", "data-chapter": a.id });
      const head = el("div", { class: "section-drop" });
      const headText = el("div", { class: "article-head" }, [
        el("h2", {}, a.label),
        a.subtitle ? el("div", { class: "article-sub" }, a.subtitle) : null
      ]);
      const pageBtn = el("button", {
        class: "page-chip",
        title: "View original page",
        onClick: () => setCurrentPage(a.page)
      }, `Page ${a.page} →`);
      head.append(headText, pageBtn);
      art.appendChild(head);

      a.sections.forEach(s => {
        const sec = el("section", { id: s.id, class: "anchor", "data-chapter": a.id });
        if (s.label || s.heading) {
          const sh = el("div", { class: "section-head" });
          if (s.label) sh.appendChild(el("span", { class: "section-num" }, s.label));
          if (s.heading) sh.appendChild(el("h3", {}, s.heading));
          sec.appendChild(sh);
        }
        s.paragraphs.forEach(p => sec.appendChild(el("p", {}, p)));
        if (s.page && s.page !== a.page) sec.dataset.page = s.page;
        art.appendChild(sec);
      });
      pane.appendChild(art);
    });

    // Signatures
    const sig = el("section", { id: "signatures", class: "anchor signatures", "data-chapter": "signatures" });
    sig.appendChild(el("div", { class: "signatures__pres" }, [
      el("div", { class: "name" }, C.signatures.president.name),
      el("div", { class: "role" }, C.signatures.president.role)
    ]));
    const grid = el("div", { class: "signatures__grid" });
    C.signatures.groups.forEach(g => {
      const grp = el("div", { class: "sig-group" });
      grp.appendChild(el("div", { class: "state" }, g.state));
      const ul = el("ul");
      g.names.forEach(n => ul.appendChild(el("li", {}, n)));
      grp.appendChild(ul);
      grid.appendChild(grp);
    });
    sig.appendChild(grid);
    pane.appendChild(sig);

    // Amendments heading
    const amHead = el("section", { id: "amendments", class: "anchor amendments-head", "data-chapter": "amendments" });
    amHead.appendChild(el("h2", {}, "Amendments"));
    amHead.appendChild(el("div", { class: "sub" }, "Twenty-seven amendments ratified between 1791 and 1992. The first ten form the Bill of Rights."));
    pane.appendChild(amHead);

    // Amendments
    C.amendments.forEach(am => {
      const box = el("section", { id: am.id, class: "anchor amendment", "data-chapter": "amendments", "data-amnum": am.num });
      box.appendChild(el("div", { class: "amendment__meta" }, [
        el("span", { class: "amendment__num" }, `Amendment ${am.num}`),
        el("span", { class: "amendment__year" }, `Ratified ${am.year}`)
      ]));
      box.appendChild(el("h3", {}, am.label));
      box.appendChild(el("div", { class: "amendment__sub" }, am.subtitle));
      am.paragraphs.forEach(p => box.appendChild(el("p", {}, p)));
      pane.appendChild(box);
    });
  }

  // ---- TOC ----
  function renderToc(container) {
    container.innerHTML = "";
    container.appendChild(el("h3", {}, "Main Document"));
    const mainList = el("ul");
    mainList.appendChild(tocLink({ id: "preamble", label: "Preamble" }));
    C.articles.forEach(a => {
      mainList.appendChild(tocLink({ id: a.id, label: `${a.label}${a.subtitle ? " · " + a.subtitle : ""}` }));
      const sub = el("ul", { class: "toc-sub" });
      a.sections.forEach(s => {
        const t = s.heading ? `${s.label} · ${s.heading}` : s.label;
        sub.appendChild(tocLink({ id: s.id, label: t }));
      });
      mainList.appendChild(sub);
    });
    mainList.appendChild(tocLink({ id: "signatures", label: "Signatures" }));
    container.appendChild(mainList);

    container.appendChild(el("h3", {}, "Amendments"));
    const amList = el("ul");
    C.amendments.forEach(am => {
      amList.appendChild(tocLink({ id: am.id, label: `${am.num} · ${am.subtitle}` }));
    });
    container.appendChild(amList);
  }

  function tocLink({ id, label }) {
    const a = el("a", { href: `#${id}`, "data-toc": id, onClick: (ev) => {
      ev.preventDefault();
      scrollToId(id);
      closeDrawer();
    }}, label);
    return el("li", {}, a);
  }

  function scrollToId(id) {
    const target = document.getElementById(id);
    if (!target) return;
    const headerH = 132;
    const y = target.getBoundingClientRect().top + window.scrollY - headerH;
    window.scrollTo({ top: y, behavior: "smooth" });
    history.replaceState(null, "", `#${id}`);
  }

  // ---- Progress bar ----
  function renderProgress() {
    const track = document.getElementById("progress-track");
    track.innerHTML = "";
    track.appendChild(el("div", { class: "progress__fill", id: "progress-fill" }));

    // Weight chapters by content length so the ticks line up with real reading effort.
    const weights = chapters.map(ch => {
      const sec = document.getElementById(ch.id);
      if (!sec) return 1;
      // end = next chapter start
      const nextIdx = chapters.indexOf(ch) + 1;
      const nextEl = nextIdx < chapters.length ? document.getElementById(chapters[nextIdx].id) : null;
      const start = sec.getBoundingClientRect().top + window.scrollY;
      const end = nextEl ? nextEl.getBoundingClientRect().top + window.scrollY : (document.documentElement.scrollHeight);
      return Math.max(1, end - start);
    });
    const totalWeight = weights.reduce((a,b) => a + b, 0);

    let acc = 0;
    chapters.forEach((ch, i) => {
      const w = weights[i] / totalWeight * 100;
      const chapEl = el("div", {
        class: "progress__chapter",
        "data-chapter-id": ch.id,
        onClick: () => scrollToId(ch.id)
      });
      chapEl.style.left = `${acc}%`;
      chapEl.style.width = `${w}%`;
      chapEl.appendChild(el("div", { class: "progress__tip" }, ch.label));
      track.appendChild(chapEl);
      acc += w;
    });

    // Labels under track
    const labels = document.getElementById("progress-labels");
    if (labels) {
      labels.innerHTML = "";
      chapters.forEach(ch => {
        labels.appendChild(el("span", {}, ch.short));
      });
    }
  }

  function updateProgress() {
    const doc = document.documentElement;
    const total = doc.scrollHeight - window.innerHeight;
    const pct = Math.max(0, Math.min(1, window.scrollY / total));
    const fill = document.getElementById("progress-fill");
    if (fill) fill.style.width = `${pct * 100}%`;

    // Mark seen chapters
    const scrollMid = window.scrollY + window.innerHeight * 0.25;
    let activeId = chapters[0].id;
    chapters.forEach(ch => {
      const sec = document.getElementById(ch.id);
      if (!sec) return;
      const top = sec.getBoundingClientRect().top + window.scrollY;
      if (top <= scrollMid) activeId = ch.id;
    });

    document.querySelectorAll(".progress__chapter").forEach(ce => {
      const id = ce.dataset.chapterId;
      const chIdx = chapters.findIndex(c => c.id === id);
      const actIdx = chapters.findIndex(c => c.id === activeId);
      ce.classList.toggle("progress__chapter--seen", chIdx < actIdx);
    });

    // Persist reading position
    localStorage.setItem("jtc:lastScroll", String(window.scrollY));
  }

  // ---- Active TOC & current page tracking ----
  let currentActiveId = null;
  let userOverridePage = null;

  function updateActive() {
    const scrollMid = window.scrollY + window.innerHeight * 0.25;
    let activeId = tocItems[0].id;
    let activePage = 1;

    // Find the deepest section that's scrolled past
    document.querySelectorAll(".anchor").forEach(sec => {
      const top = sec.getBoundingClientRect().top + window.scrollY;
      if (top <= scrollMid) {
        activeId = sec.id;
        // Page inference
        const chapter = sec.dataset.chapter;
        const chapterObj = chapters.find(c => c.id === chapter);
        if (chapterObj) {
          const art = C.articles.find(a => a.id === chapter);
          if (art) activePage = art.page;
          else if (chapter === "preamble") activePage = 1;
          else if (chapter === "signatures") activePage = 4;
          else if (chapter === "amendments") activePage = "bor";
        }
        if (sec.dataset.page) activePage = parseInt(sec.dataset.page, 10);
      }
    });

    if (activeId !== currentActiveId) {
      currentActiveId = activeId;
      document.querySelectorAll("[data-toc]").forEach(a => {
        a.classList.toggle("is-active", a.dataset.toc === activeId);
      });
      // scroll toc into view
      document.querySelectorAll(".toc").forEach(tocEl => {
        const link = tocEl.querySelector(`[data-toc="${activeId}"]`);
        if (link) {
          const lr = link.getBoundingClientRect();
          const tr = tocEl.getBoundingClientRect();
          if (lr.top < tr.top + 40 || lr.bottom > tr.bottom - 40) {
            link.scrollIntoView({ block: "nearest" });
          }
        }
      });
    }

    if (userOverridePage === null) setCurrentPage(activePage, /*auto*/ true);
  }

  // ---- Image pane ----
  let currentPage = 1;
  function setCurrentPage(pageKey, auto = false) {
    if (currentPage === pageKey && !auto) return;
    currentPage = pageKey;
    if (!auto) userOverridePage = pageKey;
    const info = PAGE_IMAGES[pageKey] || PAGE_IMAGES[1];
    const label = document.getElementById("img-label-title");
    const tag = document.getElementById("img-label-tag");
    const caption = document.getElementById("img-caption");
    const src = document.getElementById("img-source");
    const img = document.getElementById("page-img");
    const placeholder = document.getElementById("img-placeholder");

    if (label) label.textContent = info.title;
    if (tag) tag.textContent = typeof pageKey === "number" ? `PAGE 0${pageKey}` : "BILL OF RIGHTS";
    if (caption) caption.textContent = info.caption;
    if (src) {
      src.innerHTML = "";
      src.appendChild(el("a", { href: info.download, target: "_blank", rel: "noopener" }, "High-res ↗"));
    }

    if (img) {
      img.classList.add("is-loading");
      img.dataset.pageKey = pageKey;
      // Try local webp first, fallback to remote jpg
      const testImg = new Image();
      testImg.onload = () => {
        img.src = info.local;
        img.style.display = "";
        if (placeholder) placeholder.style.display = "none";
        img.classList.remove("is-loading");
      };
      testImg.onerror = () => {
        // No local optimised image; use remote fallback (works online; in offline demo, show placeholder)
        const remote = new Image();
        remote.onload = () => {
          img.src = info.fallback;
          img.style.display = "";
          if (placeholder) placeholder.style.display = "none";
          img.classList.remove("is-loading");
        };
        remote.onerror = () => {
          img.style.display = "none";
          if (placeholder) {
            placeholder.style.display = "";
            placeholder.innerHTML = `
              <b>${info.title}</b>
              <div>Missing <code>${info.local}</code>. Run <code>optimize-images.ps1</code> from the repo root to generate it.</div>
              <div>Or view the <a href="${info.download}" target="_blank" rel="noopener">high-res originals</a> on the National Archives.</div>
            `;
          }
          img.classList.remove("is-loading");
        };
        remote.src = info.fallback;
      };
      testImg.src = info.local;
    }
  }

  // ---- Lightbox ----
  let lbZoom = 1;
  let lbOffset = { x: 0, y: 0 };
  let lbDragging = false;
  let lbStart = { x: 0, y: 0 };

  function openLightbox() {
    const info = PAGE_IMAGES[currentPage] || PAGE_IMAGES[1];
    const lb = document.getElementById("lightbox");
    const img = document.getElementById("lb-img");
    const title = document.getElementById("lb-title");
    const sub = document.getElementById("lb-sub");
    title.textContent = info.title;
    sub.textContent = info.caption;
    // Use the full-res image when zoomed
    img.src = info.local;
    img.onerror = () => { img.onerror = null; img.src = info.fallback; };
    lbZoom = 1;
    lbOffset = { x: 0, y: 0 };
    applyLbTransform();
    lb.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    document.getElementById("lightbox").classList.remove("is-open");
    document.body.style.overflow = "";
  }
  function applyLbTransform() {
    const img = document.getElementById("lb-img");
    img.style.transform = `translate(${lbOffset.x}px, ${lbOffset.y}px) scale(${lbZoom})`;
  }
  function zoomLb(delta) {
    lbZoom = Math.max(0.5, Math.min(5, lbZoom + delta));
    applyLbTransform();
  }
  function resetLb() { lbZoom = 1; lbOffset = { x: 0, y: 0 }; applyLbTransform(); }

  function downloadCurrent() {
    const info = PAGE_IMAGES[currentPage] || PAGE_IMAGES[1];
    // Link out to the Archives' high-res download page (authoritative source for print-quality files)
    window.open(info.download, "_blank", "noopener");
  }

  // ---- Drawer (hamburger) ----
  function openDrawer() {
    const d = document.getElementById("toc-drawer");
    d.classList.add("is-open");
    renderToc(d.querySelector(".toc"));
    document.body.style.overflow = "hidden";
  }
  function closeDrawer() {
    document.getElementById("toc-drawer").classList.remove("is-open");
    document.body.style.overflow = "";
  }

  // ---- Tweaks ----
  const TWEAK_DEFAULTS = {
    mode: "light",
    theme: "neutral",
    font: "simple",
    reader: "default",
    toc: "open",
    pane: "open",
    fontSize: 17
  };

  function getTweaks() {
    const saved = JSON.parse(localStorage.getItem("jtc:tweaks") || "{}");
    const merged = { ...TWEAK_DEFAULTS, ...saved };
    // Migrate legacy values
    if (merged.font === "sans") merged.font = "simple";
    if (merged.font === "serif") merged.font = "traditional";
    if (!["simple", "traditional", "technical"].includes(merged.font)) merged.font = "simple";
    if (!["open", "closed"].includes(merged.toc)) merged.toc = "open";
    if (!["open", "closed"].includes(merged.pane)) merged.pane = "open";
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
    const fs = document.getElementById("fs-slider");
    if (fs) { fs.value = t.fontSize; document.getElementById("fs-val").textContent = `${t.fontSize}px`; }

    // Mode toggle icon (sun in light, moon in dark)
    const mi = document.getElementById("mode-icon");
    if (mi) {
      if (t.mode === "dark") {
        mi.innerHTML = '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>';
      } else {
        mi.innerHTML = '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>';
      }
    }
    const mb = document.getElementById("mode-toggle");
    if (mb) mb.setAttribute("aria-label", t.mode === "dark" ? "Switch to light mode" : "Switch to dark mode");

    // Reader toggle state
    const rb = document.getElementById("reader-toggle");
    if (rb) rb.setAttribute("aria-pressed", t.reader === "pure" ? "true" : "false");

    // Pane collapse icon direction
    const tcb = document.getElementById("toc-collapse");
    if (tcb) tcb.setAttribute("aria-expanded", t.toc === "open" ? "true" : "false");
    const pcb = document.getElementById("pane-collapse");
    if (pcb) pcb.setAttribute("aria-expanded", t.pane === "open" ? "true" : "false");
  }

  // Earthy rainbow — ordered as a muted rainbow; paper/oled tacked on the end of each row
  const LIGHT_THEMES = [
    { id: "neutral",   name: "Neutral",   bg: "#ffffff", ink: "#111111" },
    { id: "parchment", name: "Parchment", bg: "#f3efe3", ink: "#1f1a10" },
    { id: "sepia",     name: "Sepia",     bg: "#ede1cc", ink: "#2a1e0c" },
    { id: "clay",      name: "Clay",      bg: "#eadcd3", ink: "#2a140d" },
    { id: "amber",     name: "Amber",     bg: "#ecdec2", ink: "#2a1d04" },
    { id: "olive",     name: "Olive",     bg: "#e3ddc3", ink: "#1f1e08" },
    { id: "moss",      name: "Moss",      bg: "#dbe0cf", ink: "#122414" },
    { id: "pine",      name: "Pine",      bg: "#d7ddd4", ink: "#0d1d18" },
    { id: "slate",     name: "Slate",     bg: "#dbdee2", ink: "#121a22" },
    { id: "ocean",     name: "Ocean",     bg: "#d6dde2", ink: "#0c1e2c" },
    { id: "indigo",    name: "Indigo",    bg: "#d9d7e0", ink: "#141031" },
    { id: "plum",      name: "Plum",      bg: "#e0d7de", ink: "#221129" },
    { id: "rose",      name: "Rose",      bg: "#e9d9d5", ink: "#2a0f16" },
    { id: "paper",     name: "Paper",     bg: "#ffffff", ink: "#000000" }
  ];
  const DARK_THEMES = [
    { id: "neutral",   name: "Neutral",   bg: "#121212", ink: "#ededed" },
    { id: "parchment", name: "Parchment", bg: "#1a1712", ink: "#e8e2d1" },
    { id: "sepia",     name: "Sepia",     bg: "#1a140b", ink: "#e5d5b4" },
    { id: "clay",      name: "Clay",      bg: "#180e0a", ink: "#ecd1c2" },
    { id: "amber",     name: "Amber",     bg: "#1a1408", ink: "#ebd69a" },
    { id: "olive",     name: "Olive",     bg: "#121208", ink: "#d6d39a" },
    { id: "moss",      name: "Moss",      bg: "#0e160f", ink: "#c7d6b8" },
    { id: "pine",      name: "Pine",      bg: "#0a120f", ink: "#bccfc4" },
    { id: "slate",     name: "Slate",     bg: "#0c1016", ink: "#c9d0db" },
    { id: "ocean",     name: "Ocean",     bg: "#081219", ink: "#bccfda" },
    { id: "indigo",    name: "Indigo",    bg: "#0e0c18", ink: "#c9c5dd" },
    { id: "plum",      name: "Plum",      bg: "#160d16", ink: "#d6c6d4" },
    { id: "rose",      name: "Rose",      bg: "#170c0f", ink: "#ebc9cc" },
    { id: "oled",      name: "OLED",      bg: "#000000", ink: "#ffffff" }
  ];

  function buildGrid(mode, themes) {
    const grid = el("div", { class: "theme-grid", "data-mode": mode });
    themes.forEach(th => {
      const sw = el("button", {
        class: "theme-swatch",
        "data-theme": th.id,
        "data-mode": mode,
        title: th.name,
        "aria-label": `${mode} · ${th.name}`,
        onClick: () => { setTweaks({ mode, theme: th.id }); }
      });
      sw.style.background = `linear-gradient(135deg, ${th.bg} 50%, ${th.ink} 50%)`;
      grid.appendChild(sw);
    });
    return grid;
  }

  function renderTweaks() {
    const body = document.getElementById("tweaks-body");
    body.innerHTML = "";

    // Themes — one grid per mode, only active mode is visible
    const themeRow = el("div", { class: "tweak-row" });
    themeRow.appendChild(el("label", {}, "Color"));
    themeRow.appendChild(buildGrid("light", LIGHT_THEMES));
    themeRow.appendChild(buildGrid("dark", DARK_THEMES));
    body.appendChild(themeRow);

    // Typeface
    const fontRow = el("div", { class: "tweak-row" });
    fontRow.appendChild(el("label", {}, "Typeface"));
    const fontToggle = el("div", { class: "toggle-row" }, [
      el("button", { class: "toggle-chip", "data-font-toggle": "simple",      onClick: () => setTweak("font", "simple") },      "Simple"),
      el("button", { class: "toggle-chip", "data-font-toggle": "traditional", onClick: () => setTweak("font", "traditional") }, "Traditional"),
      el("button", { class: "toggle-chip", "data-font-toggle": "technical",   onClick: () => setTweak("font", "technical") },   "Technical")
    ]);
    fontRow.appendChild(fontToggle);
    body.appendChild(fontRow);


    // Reader mode
    const rdrRow = el("div", { class: "tweak-row" });
    rdrRow.appendChild(el("label", {}, "Reading mode"));
    const rdrToggle = el("div", { class: "toggle-row" }, [
      el("button", { class: "toggle-chip", "data-reader-toggle": "default", onClick: () => setTweak("reader", "default") }, "Default"),
      el("button", { class: "toggle-chip", "data-reader-toggle": "pure", onClick: () => setTweak("reader", "pure") }, "Pure reader")
    ]);
    rdrRow.appendChild(rdrToggle);
    body.appendChild(rdrRow);

    // Font size
    const fsRow = el("div", { class: "tweak-row slider-row" });
    fsRow.appendChild(el("label", {}, [document.createTextNode("Text size "), el("span", { id: "fs-val", class: "val" }, "17px")]));
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

  // Toggle light/dark on quick button
  function toggleMode() {
    const t = getTweaks();
    setTweak("mode", t.mode === "dark" ? "light" : "dark");
  }
  function toggleReader() {
    const t = getTweaks();
    setTweak("reader", t.reader === "pure" ? "default" : "pure");
  }

  // ---- Init ----
  function init() {
    renderText();
    document.querySelectorAll(".toc.toc--inline").forEach(t => renderToc(t));
    renderProgress();
    renderTweaks();

    // Image pane — initial
    setCurrentPage(1, true);

    // Wiring
    document.getElementById("menu-btn").addEventListener("click", openDrawer);
    document.getElementById("drawer-close").addEventListener("click", closeDrawer);
    document.getElementById("toc-drawer").addEventListener("click", e => {
      if (e.target.id === "toc-drawer") closeDrawer();
    });

    document.getElementById("mode-toggle").addEventListener("click", toggleMode);
    document.getElementById("reader-toggle").addEventListener("click", toggleReader);
    document.getElementById("reader-exit").addEventListener("click", () => setTweak("reader", "default"));
    document.getElementById("toc-collapse").addEventListener("click", () => { const t = getTweaks(); setTweak("toc", t.toc === "open" ? "closed" : "open"); });
    document.getElementById("toc-expand").addEventListener("click", () => setTweak("toc", "open"));
    document.getElementById("pane-collapse").addEventListener("click", () => { const t = getTweaks(); setTweak("pane", t.pane === "open" ? "closed" : "open"); });
    document.getElementById("pane-expand").addEventListener("click", () => setTweak("pane", "open"));
    document.getElementById("tweaks-btn").addEventListener("click", () => {
      document.getElementById("tweaks").classList.toggle("is-open");
    });
    document.getElementById("tweaks-close").addEventListener("click", () => {
      document.getElementById("tweaks").classList.remove("is-open");
    });

    // Image pane controls
    document.getElementById("img-zoom").addEventListener("click", openLightbox);
    document.getElementById("img-download").addEventListener("click", downloadCurrent);
    document.getElementById("image-frame").addEventListener("click", (e) => {
      // Only trigger if clicking on the frame itself or the image, not buttons
      if (e.target.closest("button")) return;
      openLightbox();
    });

    // Lightbox
    document.getElementById("lb-close").addEventListener("click", closeLightbox);
    document.getElementById("lb-zoom-in").addEventListener("click", () => zoomLb(0.3));
    document.getElementById("lb-zoom-out").addEventListener("click", () => zoomLb(-0.3));
    document.getElementById("lb-reset").addEventListener("click", resetLb);
    document.getElementById("lb-download").addEventListener("click", downloadCurrent);
    const lbImg = document.getElementById("lb-img");
    lbImg.addEventListener("mousedown", (e) => {
      lbDragging = true; lbImg.classList.add("is-dragging");
      lbStart = { x: e.clientX - lbOffset.x, y: e.clientY - lbOffset.y };
    });
    window.addEventListener("mousemove", (e) => {
      if (!lbDragging) return;
      lbOffset = { x: e.clientX - lbStart.x, y: e.clientY - lbStart.y };
      applyLbTransform();
    });
    window.addEventListener("mouseup", () => {
      lbDragging = false; lbImg.classList.remove("is-dragging");
    });
    document.getElementById("lightbox").addEventListener("wheel", (e) => {
      if (!document.getElementById("lightbox").classList.contains("is-open")) return;
      e.preventDefault();
      zoomLb(e.deltaY > 0 ? -0.15 : 0.15);
    }, { passive: false });
    document.addEventListener("keydown", e => {
      if (!document.getElementById("lightbox").classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "+" || e.key === "=") zoomLb(0.3);
      if (e.key === "-") zoomLb(-0.3);
      if (e.key === "0") resetLb();
    });

    // Scroll handlers
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateProgress();
          updateActive();
          // Let auto page-tracking take over once user scrolls away
          if (userOverridePage !== null) {
            // Release override when user scrolls ~1 viewport away
            userOverridePage = null;
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    window.addEventListener("resize", () => {
      renderProgress();
      updateProgress();
    });

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
