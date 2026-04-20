/* ===== justtheconstitution — images =====
   Parchment-facsimile image pane + lightbox. Document-specific.
   Owns the shared `manualImageMode` flag (on JTC namespace) — set by the
   image pane's prev/next and cleared by in-text page chips / reloads.
   Depends on: core (el), window.CONSTITUTION. */
(() => {
  const JTC = window.JTC;
  const { el } = JTC;
  const C = window.CONSTITUTION;

  // ---- Page → source image mapping ----
  // Local filenames match the webp output of optimize-images.ps1 (run from repo root).
  // Fallbacks are locally-hosted JPGs (Step 0 removed the archives.gov network dep);
  // download links point to the National Archives' high-res downloads page (TIFFs etc).
  const PAGE_IMAGES = {
    1: {
      title: "Page 1 of 4",
      caption: "Preamble through Article I, §7",
      local: "images/Constitution_Pg1of4_AC.webp",
      fallback: "images/constitution-page1.jpg",
      download: "https://www.archives.gov/founding-docs/downloads"
    },
    2: {
      title: "Page 2 of 4",
      caption: "Article I, §8 through Article II, §1",
      local: "images/Constitution_Pg2of4_AC.webp",
      fallback: "images/constitution-page2.jpg",
      download: "https://www.archives.gov/founding-docs/downloads"
    },
    3: {
      title: "Page 3 of 4",
      caption: "Article II, §2 through Article IV",
      local: "images/Constitution_Pg3of4_AC.webp",
      fallback: "images/constitution-page3.jpg",
      download: "https://www.archives.gov/founding-docs/downloads"
    },
    4: {
      title: "Page 4 of 4",
      caption: "Article V through signatures",
      local: "images/Constitution_Pg4of4_AC.webp",
      fallback: "images/constitution-page4.jpg",
      download: "https://www.archives.gov/founding-docs/downloads"
    },
    bor: {
      title: "Bill of Rights",
      tag: "BILL OF RIGHTS",
      caption: "Ratified December 15, 1791 — Amendments I–X",
      local: "images/Bill_of_Rights_Pg1of1_AC.webp",
      fallback: "images/bill-of-rights.jpg",
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

  // When true, the image pane stays on whatever the user last picked manually
  // (prev/next buttons). Cleared by clicking a page-chip in the text or by
  // reloading. Scrolling does NOT auto-clear — that was the old bug.
  // Lives on JTC so reader (page chips) and progress (updateActive) can touch it.
  JTC.manualImageMode = false;

  // Intentionally `null` so the first setCurrentPage call is never treated as
  // a no-op — app.js init calls setCurrentPage(1, true) and we need the img.src
  // assignment (and .is-loading lifecycle) to actually run on that call.
  let currentPage = null;

  function setCurrentPage(pageKey, auto = false) {
    // Ignore auto-tracking while the user has taken manual control of the pane.
    if (auto && JTC.manualImageMode) return;
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

    const frame = document.getElementById("image-frame");
    if (img && frame) {
      // Spinner on the frame, img hidden by CSS until it actually loads.
      frame.classList.add("is-loading");
      img.dataset.pageKey = pageKey;
      img.style.display = "";
      if (placeholder) placeholder.style.display = "none";

      let triedFallback = false;
      img.onload = () => { frame.classList.remove("is-loading"); };
      img.onerror = () => {
        if (!triedFallback && info.fallback) {
          triedFallback = true;
          img.src = info.fallback;
          return;
        }
        // Both local and remote failed — reveal the placeholder.
        frame.classList.remove("is-loading");
        img.style.display = "none";
        if (placeholder) {
          placeholder.style.display = "";
          placeholder.innerHTML = `
            <b>${info.title}</b>
            <div>Couldn't load <code>${info.local}</code>.</div>
            <div>View the <a href="${info.download}" target="_blank" rel="noopener">high-res originals</a> on the National Archives.</div>
          `;
        }
      };
      img.src = info.local;
      // Safety net: if the browser serves from cache, onload may already have
      // fired (or may fire before the next paint). Clear is-loading now.
      if (img.complete && img.naturalWidth > 0) {
        frame.classList.remove("is-loading");
      }
    }
  }

  // Manual prev/next cycling through PAGE_ORDER.
  function cycleImage(direction) {
    const idx = PAGE_ORDER.indexOf(currentPage);
    if (idx < 0) return;
    const nextIdx = Math.max(0, Math.min(PAGE_ORDER.length - 1, idx + direction));
    if (nextIdx === idx) return;
    JTC.manualImageMode = true;
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

  // Event wiring split off so app.js init() stays thin.
  function initImagePane() {
    document.getElementById("img-zoom").addEventListener("click", openLightbox);
    document.getElementById("img-download").addEventListener("click", downloadCurrent);
    document.getElementById("img-prev").addEventListener("click", () => cycleImage(-1));
    document.getElementById("img-next").addEventListener("click", () => cycleImage(1));
    document.getElementById("image-frame").addEventListener("click", (e) => {
      // Only trigger if clicking on the frame itself or the image, not buttons
      if (e.target.closest("button")) return;
      openLightbox();
    });
  }

  function initLightbox() {
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
  }

  JTC.PAGE_IMAGES = PAGE_IMAGES;
  JTC.PAGE_ORDER = PAGE_ORDER;
  JTC.setCurrentPage = setCurrentPage;
  JTC.cycleImage = cycleImage;
  JTC.openLightbox = openLightbox;
  JTC.closeLightbox = closeLightbox;
  JTC.downloadCurrent = downloadCurrent;
  JTC.initImagePane = initImagePane;
  JTC.initLightbox = initLightbox;
})();
