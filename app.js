/* ===== justtheconstitution — app ===== */
(() => {
  const C = window.CONSTITUTION;

  // ---- Flat chapter list for progress bar ----
  // Each article, the signatures block, and each of the 27 amendments gets its own
  // segment. Roman numerals for articles (I–VII); Arabic 1–27 for amendment short
  // labels so the two ranges don't collide visually.
  const chapters = [
    { id: "preamble", label: "Preamble", short: "Pre" },
    ...C.articles.map(a => ({ id: a.id, label: a.label, short: a.label.replace("Article ", "") })),
    { id: "signatures", label: "Signatures", short: "Sig" },
    ...C.amendments.map((am, i) => ({ id: am.id, label: `Amendment ${am.num}`, short: String(i + 1) }))
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
      tag: "BILL OF RIGHTS",
      caption: "Ratified December 15, 1791 — Amendments I–X",
      local: "images/Bill_of_Rights_Pg1of1_AC.webp",
      fallback: "https://www.archives.gov/files/founding-docs/bill-of-rights.jpg",
      download: "https://www.archives.gov/founding-docs/downloads"
    }
  };

  // Extend PAGE_IMAGES with individual amendment scans for XI–XXVII. Amendments
  // I–X share the Bill of Rights image above. Multi-page amendments use page 1
  // as the primary view; users can open the lightbox for the full set.
  const AMENDMENT_PAGE_COUNT = { 14: 2, 20: 2, 25: 2, 27: 3 };
  function ordinalSuffix(n) {
    const m100 = n % 100;
    if (m100 >= 11 && m100 <= 13) return "th";
    const m10 = n % 10;
    return m10 === 1 ? "st" : m10 === 2 ? "nd" : m10 === 3 ? "rd" : "th";
  }
  C.amendments.forEach(am => {
    const n = parseInt(am.id.slice(3), 10);
    if (n < 11) return;
    const ordinal = `${n}${ordinalSuffix(n)}`;
    const total = AMENDMENT_PAGE_COUNT[n] || 1;
    PAGE_IMAGES[am.id] = {
      title: am.label,
      tag: `AMENDMENT ${am.num}`,
      caption: `Ratified ${am.year} — ${am.subtitle}`,
      local: `images/${ordinal}_Amendment_Pg1of${total}_AC.webp`,
      download: "https://www.archives.gov/founding-docs/downloads"
    };
  });

  // Linear order for manual prev/next cycling through the parchments.
  const PAGE_ORDER = [1, 2, 3, 4, "bor", ...C.amendments
    .filter(am => parseInt(am.id.slice(3), 10) >= 11)
    .map(am => am.id)];


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

  // ---- Clipboard + toast (shared by share popover and per-section copy) ----
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
      return ok;
    }
  }
  let _toastTimer = null;
  function showToast(msg) {
    const t = document.getElementById("share-toast");
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => { t.hidden = true; }, 1600);
  }

  // ---- Copy-to-clipboard for sections/paragraphs ----
  const COPY_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  const SITE_URL = "https://justtheconstitution.org";

  function formatCopyPayload(text, cite, mode) {
    if (mode === "plain") return text;
    return `"${text}"\n\n— ${cite}\nSource: ${SITE_URL}`;
  }

  function addCopyButton(host, getText, cite) {
    const btn = el("button", {
      class: "copy-btn",
      type: "button",
      "aria-label": `Copy — ${cite}`,
      title: "Copy to clipboard"
    });
    btn.innerHTML = COPY_SVG;
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const text = (typeof getText === "function" ? getText() : getText).trim();
      const payload = formatCopyPayload(text, cite, getTweaks().copyMode);
      const ok = await copyText(payload);
      showToast(ok ? "Copied" : "Copy failed");
    });
    host.appendChild(btn);
    return btn;
  }

  // Citation builders
  function citeArticle(art, sectionLabel, sectionHeading, paraIndex, totalParas) {
    const parts = ["U.S. Constitution", `Article ${art}`];
    if (sectionLabel) parts.push(sectionLabel); // "Section 1", "Section 2", …
    else if (sectionHeading) parts.push(sectionHeading);
    if (paraIndex && totalParas > 1) parts.push(`¶ ${paraIndex}`);
    return parts.join(", ");
  }
  function citeAmendment(num, paraIndex, totalParas) {
    const parts = ["U.S. Constitution", `Amendment ${num}`];
    if (paraIndex && totalParas > 1) parts.push(`¶ ${paraIndex}`);
    return parts.join(", ");
  }

  // Flatten helpers — build text blobs at render time
  function articleFullText(a) {
    const lines = [`${a.label} — ${a.subtitle}`];
    a.sections.forEach(s => {
      if (s.label || s.heading) {
        lines.push("");
        lines.push([s.label, s.heading].filter(Boolean).join(" — "));
      }
      s.paragraphs.forEach(p => { lines.push(""); lines.push(p); });
    });
    return lines.join("\n");
  }
  function sectionFullText(s) {
    const lines = [];
    if (s.label || s.heading) lines.push([s.label, s.heading].filter(Boolean).join(" — "));
    s.paragraphs.forEach(p => { if (lines.length) lines.push(""); lines.push(p); });
    return lines.join("\n");
  }
  function amendmentFullText(am) {
    const lines = [`Amendment ${am.num} — ${am.subtitle}`];
    am.paragraphs.forEach(p => { lines.push(""); lines.push(p); });
    return lines.join("\n");
  }
  function signaturesFullText() {
    const S = C.signatures;
    const lines = [`${S.president.signed}, ${S.president.role}`, ""];
    S.groups.forEach(g => {
      lines.push(g.state + ":");
      g.names.forEach(n => {
        const name = typeof n === "string" ? n : n.signed;
        lines.push(`  ${name}`);
      });
      lines.push("");
    });
    return lines.join("\n").trim();
  }

  // ---- Text pane ----
  function renderText() {
    const pane = document.getElementById("text-pane");

    // Title
    pane.appendChild(el("h1", { class: "doc-title" }, "The Constitution of the United States"));
    pane.appendChild(el("div", { class: "doc-tag" }, "We the People · September 17, 1787"));

    // Preamble
    const pre = el("section", { id: "preamble", class: "anchor", "data-chapter": "preamble" });
    const preP = el("p", { class: "preamble" }, C.preamble.text);
    addCopyButton(preP, C.preamble.text, "U.S. Constitution, Preamble");
    pre.appendChild(preP);
    pane.appendChild(pre);

    // Articles
    C.articles.forEach(a => {
      const artNum = a.label.replace("Article ", "");
      const art = el("section", { id: a.id, class: "anchor", "data-chapter": a.id });
      const head = el("div", { class: "section-drop" });
      const h2 = el("h2", {}, a.label);
      addCopyButton(h2, () => articleFullText(a), `U.S. Constitution, Article ${artNum}`);
      const headText = el("div", { class: "article-head" }, [
        h2,
        a.subtitle ? el("div", { class: "article-sub" }, a.subtitle) : null
      ]);
      const pageBtn = el("button", {
        class: "page-chip",
        title: "View original page",
        onClick: () => {
          // Explicit click in text resumes auto-follow.
          manualImageMode = false;
          setCurrentPage(a.page);
          // On mobile the side pane is hidden; open the lightbox directly so
          // the parchment still pops up on tap.
          if (window.matchMedia("(max-width: 960px)").matches) openLightbox();
        }
      }, `Page ${a.page} →`);
      head.append(headText, pageBtn);
      art.appendChild(head);

      a.sections.forEach(s => {
        const sec = el("section", { id: s.id, class: "anchor", "data-chapter": a.id });
        if (s.label || s.heading) {
          const sh = el("div", { class: "section-head" });
          if (s.label) sh.appendChild(el("span", { class: "section-num" }, s.label));
          if (s.heading) {
            const h3 = el("h3", {}, s.heading);
            addCopyButton(h3, () => sectionFullText(s), citeArticle(artNum, s.label, s.heading));
            sh.appendChild(h3);
          } else {
            // Only a section label (no heading) — attach copy to the label itself.
            addCopyButton(sh, () => sectionFullText(s), citeArticle(artNum, s.label, ""));
          }
          sec.appendChild(sh);
        }
        const total = s.paragraphs.length;
        s.paragraphs.forEach((p, i) => {
          const paraEl = el("p", {}, p);
          const paraCite = citeArticle(artNum, s.label, s.heading, i + 1, total);
          addCopyButton(paraEl, p, paraCite);
          sec.appendChild(paraEl);
        });
        if (s.page && s.page !== a.page) sec.dataset.page = s.page;
        art.appendChild(sec);
      });
      pane.appendChild(art);
    });

    // Signatures — parchment-first, with a footnote block for common names
    const sig = el("section", { id: "signatures", class: "anchor signatures", "data-chapter": "signatures" });
    const footnotes = []; // [{ signed, common }] — 1-indexed display order

    // Helper: render one signatory. Returns { node, footnoteNum|null }
    function renderSigner(entry) {
      if (typeof entry === "string") return { text: entry, num: null };
      footnotes.push({ signed: entry.signed, common: entry.common });
      return { text: entry.signed, num: footnotes.length };
    }
    function signerLine(entry, tag) {
      const r = renderSigner(entry);
      const node = el(tag, {});
      node.appendChild(document.createTextNode(r.text));
      if (r.num) node.appendChild(el("sup", {}, String(r.num)));
      return node;
    }

    const pres = C.signatures.president;
    const presBlock = el("div", { class: "signatures__pres" });
    presBlock.appendChild(signerLine(pres, "div"));
    presBlock.querySelector("div").classList.add("name");
    presBlock.appendChild(el("div", { class: "role" }, pres.role));
    addCopyButton(presBlock, signaturesFullText, "U.S. Constitution, Signatures");
    sig.appendChild(presBlock);

    const grid = el("div", { class: "signatures__grid" });
    C.signatures.groups.forEach(g => {
      const grp = el("div", { class: "sig-group" });
      grp.appendChild(el("div", { class: "state" }, g.state));
      const ul = el("ul");
      g.names.forEach(n => ul.appendChild(signerLine(n, "li")));
      grp.appendChild(ul);
      grid.appendChild(grp);
    });
    sig.appendChild(grid);

    if (footnotes.length) {
      const ol = el("ol", { class: "sig-footnotes" });
      footnotes.forEach(f => {
        const end = f.common.endsWith(".") ? "" : ".";
        ol.appendChild(el("li", {}, `Commonly known as ${f.common}${end}`));
      });
      sig.appendChild(ol);
    }
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
      const amH3 = el("h3", {}, am.label);
      addCopyButton(amH3, () => amendmentFullText(am), `U.S. Constitution, Amendment ${am.num}`);
      box.appendChild(amH3);
      box.appendChild(el("div", { class: "amendment__sub" }, am.subtitle));
      const totalAm = am.paragraphs.length;
      am.paragraphs.forEach((p, i) => {
        const paraEl = el("p", {}, p);
        addCopyButton(paraEl, p, citeAmendment(am.num, i + 1, totalAm));
        box.appendChild(paraEl);
      });
      pane.appendChild(box);
    });

    renderDownloadCta(pane);
  }

  // ---- Download (Markdown) ----
  function renderDownloadCta(pane) {
    const cta = el("section", { class: "download-cta" });
    cta.appendChild(el("h2", {}, "Take it with you."));
    cta.appendChild(el("p", {}, "The full document — preamble, articles, signatures, all twenty-seven amendments — as a single Markdown file. Readable anywhere."));
    const btn = el("button", { class: "download-cta__btn", type: "button", onClick: downloadMarkdown });
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg><span>Download Markdown</span>';
    cta.appendChild(btn);
    cta.appendChild(el("div", { class: "download-cta__hint" }, "us-constitution.md"));
    pane.appendChild(cta);
  }

  function buildMarkdown() {
    const L = [];
    L.push("# The Constitution of the United States", "");
    L.push("*We the People · September 17, 1787*", "");
    L.push("## Preamble", "");
    L.push(C.preamble.text, "");

    C.articles.forEach(a => {
      L.push(`## ${a.label}${a.subtitle ? ` — ${a.subtitle}` : ""}`, "");
      a.sections.forEach(s => {
        if (s.label || s.heading) {
          const head = [s.label, s.heading].filter(Boolean).join(" — ");
          L.push(`### ${head}`, "");
        }
        s.paragraphs.forEach(p => L.push(p, ""));
      });
    });

    // Signatures: parchment-first, with numbered footnotes for common names
    L.push("## Signatures", "");
    const fns = [];
    const sigMd = (entry) => {
      if (typeof entry === "string") return entry;
      fns.push(entry);
      return `${entry.signed}[^sig${fns.length}]`;
    };
    const pres = C.signatures.president;
    L.push(`**${sigMd(pres)}** — *${pres.role}*`, "");
    C.signatures.groups.forEach(g => {
      L.push(`### ${g.state}`, "");
      g.names.forEach(n => L.push(`- ${sigMd(n)}`));
      L.push("");
    });
    if (fns.length) {
      fns.forEach((f, i) => {
        const end = f.common.endsWith(".") ? "" : ".";
        L.push(`[^sig${i + 1}]: Commonly known as ${f.common}${end}`);
      });
      L.push("");
    }

    L.push("## Amendments", "");
    L.push("Twenty-seven amendments ratified between 1791 and 1992. The first ten form the Bill of Rights.", "");
    C.amendments.forEach(am => {
      L.push(`### Amendment ${am.num} — ${am.subtitle}`, "");
      L.push(`*Ratified ${am.year}*`, "");
      am.paragraphs.forEach(p => L.push(p, ""));
    });

    L.push("---", "");
    L.push("Source: [justtheconstitution.org](https://justtheconstitution.org)", "");
    return L.join("\n");
  }

  function downloadMarkdown() {
    const blob = new Blob([buildMarkdown()], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "us-constitution.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 500);
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

    // Fill = how much of the content is above the viewport bottom, expressed
    // in the same content-space the segments live in. The edge of the fill
    // therefore tracks segment boundaries exactly.
    const viewportBottom = window.scrollY + window.innerHeight;
    const pct = Math.max(0, Math.min(1, (viewportBottom - startY) / range));
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
  // When true, the image pane stays on whatever the user last picked manually
  // (prev/next buttons). Cleared by clicking a page-chip in the text or by
  // reloading. Scrolling does NOT auto-clear — that was the old bug.
  let manualImageMode = false;

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

    if (!manualImageMode) setCurrentPage(activePage, /*auto*/ true);
  }

  // ---- Image pane ----
  let currentPage = 1;
  function setCurrentPage(pageKey, auto = false) {
    // Ignore auto-tracking while the user has taken manual control of the pane.
    if (auto && manualImageMode) return;
    if (currentPage === pageKey) return;
    currentPage = pageKey;
    const info = PAGE_IMAGES[pageKey] || PAGE_IMAGES[1];
    updateImageNavButtons();
    const label = document.getElementById("img-label-title");
    const tag = document.getElementById("img-label-tag");
    const caption = document.getElementById("img-caption");
    const src = document.getElementById("img-source");
    const img = document.getElementById("page-img");
    const placeholder = document.getElementById("img-placeholder");

    if (label) label.textContent = info.title;
    if (tag) tag.textContent = info.tag || (typeof pageKey === "number" ? `PAGE 0${pageKey}` : "");
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

  // Manual prev/next cycling through PAGE_ORDER.
  function cycleImage(direction) {
    const idx = PAGE_ORDER.indexOf(currentPage);
    if (idx < 0) return;
    const nextIdx = Math.max(0, Math.min(PAGE_ORDER.length - 1, idx + direction));
    if (nextIdx === idx) return;
    manualImageMode = true;
    setCurrentPage(PAGE_ORDER[nextIdx]);
  }
  function updateImageNavButtons() {
    const idx = PAGE_ORDER.indexOf(currentPage);
    const prev = document.getElementById("img-prev");
    const next = document.getElementById("img-next");
    if (prev) prev.disabled = idx <= 0;
    if (next) next.disabled = idx < 0 || idx >= PAGE_ORDER.length - 1;
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

    // Mode toggle icon (sun in light, moon in dark, monospace "O" in oled)
    const mi = document.getElementById("mode-icon");
    if (mi) {
      if (t.mode === "oled") {
        mi.innerHTML = '<text x="12" y="17" text-anchor="middle" fill="currentColor" stroke="none" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="16" font-weight="700">O</text>';
      } else if (t.mode === "dark") {
        mi.innerHTML = '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>';
      } else {
        mi.innerHTML = '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>';
      }
    }
    const mb = document.getElementById("mode-toggle");
    if (mb) {
      const next = t.mode === "light" ? "dark" : t.mode === "dark" ? "OLED" : "light";
      mb.setAttribute("aria-label", `Switch to ${next} mode`);
      mb.setAttribute("title", `Switch to ${next}`);
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
    modeRow.appendChild(el("label", {}, "Mode"));
    const modeToggle = el("div", { class: "toggle-row" }, [
      el("button", { class: "toggle-chip", "data-mode-toggle": "light", onClick: () => setMode("light") }, "Light"),
      el("button", { class: "toggle-chip", "data-mode-toggle": "dark",  onClick: () => setMode("dark")  }, "Dark"),
      el("button", { class: "toggle-chip", "data-mode-toggle": "oled",  onClick: () => setMode("oled")  }, "OLED")
    ]);
    modeRow.appendChild(modeToggle);
    body.appendChild(modeRow);

    // Color — one grid per mode, only active mode is visible
    const themeRow = el("div", { class: "tweak-row" });
    themeRow.appendChild(el("label", {}, "Color"));
    themeRow.appendChild(buildGrid("light", LIGHT_THEMES));
    themeRow.appendChild(buildGrid("dark", DARK_THEMES));
    themeRow.appendChild(buildGrid("oled", OLED_THEMES));
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

    // Copy to clipboard behaviour
    const copyRow = el("div", { class: "tweak-row" });
    copyRow.appendChild(el("label", {}, "Copy to clipboard"));
    const copyToggle = el("div", { class: "toggle-row" }, [
      el("button", { class: "toggle-chip", "data-copy-toggle": "full",  onClick: () => setTweak("copyMode", "full")  }, "With citation"),
      el("button", { class: "toggle-chip", "data-copy-toggle": "plain", onClick: () => setTweak("copyMode", "plain") }, "Plain text")
    ]);
    copyRow.appendChild(copyToggle);
    body.appendChild(copyRow);

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

  // ---- Share popover ----
  function initShare() {
    const btn = document.getElementById("share-btn");
    const pop = document.getElementById("share-pop");
    if (!btn || !pop) return;

    // Reveal native share row on supported browsers (mostly mobile)
    if (typeof navigator !== "undefined" && "share" in navigator) {
      const native = pop.querySelector('[data-action="native"]');
      if (native) native.hidden = false;
    }

    const closePop = () => { pop.hidden = true; };
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      pop.hidden = !pop.hidden;
    });
    document.addEventListener("click", (e) => {
      if (pop.hidden) return;
      if (!pop.contains(e.target) && e.target !== btn && !btn.contains(e.target)) closePop();
    });
    document.addEventListener("keydown", (e) => {
      if (!pop.hidden && e.key === "Escape") closePop();
    });

    pop.addEventListener("click", async (e) => {
      const row = e.target.closest(".share-row");
      if (!row) return;
      const action = row.dataset.action;
      const url = location.href;
      const title = document.title;

      if (action === "copy") {
        const ok = await copyText(url);
        showToast(ok ? "Link copied" : "Copy failed");
        closePop();
      } else if (action === "email") {
        const subject = encodeURIComponent(title);
        const body = encodeURIComponent(`Thought you might find this useful:\n\n${url}`);
        location.href = `mailto:?subject=${subject}&body=${body}`;
        closePop();
      } else if (action === "native") {
        try {
          await navigator.share({ title, url });
        } catch { /* user cancelled or unsupported */ }
        closePop();
      }
    });
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
    document.getElementById("tweaks-btn").addEventListener("click", () => {
      document.getElementById("tweaks").classList.toggle("is-open");
    });
    document.getElementById("tweaks-close").addEventListener("click", () => {
      document.getElementById("tweaks").classList.remove("is-open");
    });

    initShare();
    document.getElementById("download-btn").addEventListener("click", downloadMarkdown);

    // Image pane controls
    document.getElementById("img-zoom").addEventListener("click", openLightbox);
    document.getElementById("img-download").addEventListener("click", downloadCurrent);
    document.getElementById("img-prev").addEventListener("click", () => cycleImage(-1));
    document.getElementById("img-next").addEventListener("click", () => cycleImage(1));
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
