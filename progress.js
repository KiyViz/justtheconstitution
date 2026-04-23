/* ===== justtheconstitution — progress =====
   Progress bar (segments + fill + "seen" markers), active-section tracking
   (drives TOC highlight + image pane auto-follow).
   Depends on: core (el, scrollToId), images (setCurrentPage, manualImageMode
               read), window.CONSTITUTION. */
(() => {
  const JTC = window.JTC;
  const { el, scrollToId } = JTC;
  const C = window.CONSTITUTION;

  // ---- Flat chapter list for progress bar ----
  // Each article, the signatures block, and each of the 27 amendments gets its own
  // segment. Roman numerals for articles (I–VII); Arabic 1–27 for amendment short
  // labels so the two ranges don't collide visually.
  const chapters = [
    { id: "preamble", label: JTC.t("progress.preamble"), short: JTC.t("progress.preamble_short") },
    ...C.articles.map(a => ({ id: a.id, label: a.label, short: a.label.replace("Article ", "") })),
    { id: "signatures", label: JTC.t("progress.signatures"), short: JTC.t("progress.signatures_short") },
    ...C.amendments.map((am, i) => ({ id: am.id, label: `${JTC.t("prefix.amendment")} ${am.num}`, short: String(i + 1) }))
  ];

  // Section list for TOC (first entry used as updateActive's default)
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

  // ---- Progress bar ----
  // Cached content-space measurements shared between renderProgress (segment
  // layout) and updateProgress (fill + seen). Keeps them perfectly in sync.
  let progressGeom = null;

  function renderProgress() {
    const track = document.getElementById("progress-track");
    track.innerHTML = "";
    track.appendChild(el("div", { class: "progress__fill", id: "progress-fill" }));

    // Measure each chapter's top position once. Everything below (segment
    // layout, fill width, seen markers, labels) shares the same content-space
    // so they all stay in lockstep as the reader scrolls.
    const positions = chapters.map(ch => {
      const sec = document.getElementById(ch.id);
      return sec ? sec.getBoundingClientRect().top + window.scrollY : null;
    });
    const firstIdx = positions.findIndex(p => p !== null);
    if (firstIdx < 0) return;

    const startY = positions[firstIdx];
    const endY = document.documentElement.scrollHeight;
    const range = endY - startY;
    if (range <= 0) return;

    progressGeom = { positions, startY, endY, range };

    const labels = document.getElementById("progress-labels");
    if (labels) labels.innerHTML = "";

    chapters.forEach((ch, i) => {
      if (positions[i] === null) return;
      const top = positions[i];
      // Next chapter's start is this chapter's right edge. Fall back to doc end.
      let bottom = endY;
      for (let j = i + 1; j < chapters.length; j++) {
        if (positions[j] !== null) { bottom = positions[j]; break; }
      }
      const left = (top - startY) / range * 100;
      const width = (bottom - top) / range * 100;

      const chapEl = el("div", {
        class: "progress__chapter",
        "data-chapter-id": ch.id,
        onClick: () => scrollToId(ch.id)
      });
      chapEl.style.left = `${left}%`;
      chapEl.style.width = `${width}%`;
      chapEl.appendChild(el("div", { class: "progress__tip" }, ch.label));
      track.appendChild(chapEl);

      // Align each label to its segment's centre, so what you see above a
      // label is what you'll hover/click.
      if (labels) {
        const span = el("span", {}, ch.short);
        span.style.left = `${left + width / 2}%`;
        labels.appendChild(span);
      }
    });
  }

  function updateProgress() {
    const fill = document.getElementById("progress-fill");
    if (!fill || !progressGeom) return;
    const { startY, endY, range, positions } = progressGeom;

    // Fill tracks the reader's focus point (30% down the viewport) rather than
    // the viewport bottom — so clicking chapter N makes the fill reach
    // segment N instead of overshooting into N+1. The 0.3 multiplier mirrors
    // updateActive's 0.25 cutoff so fill and active-section highlight agree.
    const readingPosition = window.scrollY + window.innerHeight * 0.3;
    const pct = Math.max(0, Math.min(1, (readingPosition - startY) / range));
    fill.style.width = `${pct * 100}%`;

    // Seen markers: mark a chapter once the fill has fully covered it.
    document.querySelectorAll(".progress__chapter").forEach(ce => {
      const idx = chapters.findIndex(c => c.id === ce.dataset.chapterId);
      if (idx < 0) return;
      let nextStart = endY;
      for (let j = idx + 1; j < positions.length; j++) {
        if (positions[j] !== null) { nextStart = positions[j]; break; }
      }
      const rightPct = (nextStart - startY) / range;
      ce.classList.toggle("progress__chapter--seen", pct >= rightPct);
    });

    // Persist reading position
    localStorage.setItem("jtc:lastScroll", String(window.scrollY));
  }

  // ---- Active TOC & current page tracking ----
  let currentActiveId = null;

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
        const amMatch = sec.id.match(/^am-(\d+)$/);
        if (amMatch) {
          // Amendments I–X share the Bill of Rights scan; XI–XXVII each have their own page.
          const amNum = parseInt(amMatch[1], 10);
          activePage = amNum <= 10 ? "bor" : sec.id;
        } else {
          const art = C.articles.find(a => a.id === chapter);
          if (art) activePage = art.page;
          else if (chapter === "preamble") activePage = 1;
          else if (chapter === "signatures") activePage = 4;
          else if (chapter === "amendments") activePage = "bor"; // the "Amendments" heading section
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

    if (!JTC.manualImageMode) JTC.setCurrentPage(activePage, /*auto*/ true);
  }

  // ---- URL hash sync on scroll ----
  // Keeps location.hash in sync with the anchor sitting in the reader's
  // sweet spot (20-25% from the top of the viewport). scrollToId() in core.js
  // flips JTC.suppressHashSync during smooth-scroll so we don't flicker
  // through every anchor along the way.
  function initHashSync() {
    const observer = new IntersectionObserver(entries => {
      if (JTC.suppressHashSync) return;
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length) {
        const id = visible[0].target.id;
        if (id && `#${id}` !== location.hash) {
          history.replaceState(null, "", `#${id}`);
        }
      }
    }, { rootMargin: "-20% 0px -75% 0px" });

    document.querySelectorAll(".anchor").forEach(el => observer.observe(el));
  }

  JTC.renderProgress = renderProgress;
  JTC.updateProgress = updateProgress;
  JTC.updateActive = updateActive;
  JTC.initHashSync = initHashSync;
})();
