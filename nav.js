/* ===== justtheconstitution — nav =====
   Table of contents (inline + drawer) and share popover.
   Depends on: core (el, scrollToId, copyText, showToast),
               reader (downloadMarkdown), window.CONSTITUTION. */
(() => {
  const JTC = window.JTC;
  const { el, scrollToId, copyText, showToast } = JTC;
  const C = window.CONSTITUTION;

  function renderToc(container) {
    container.innerHTML = "";
    // "Main Document" subheader + inline download-transcript button.
    const head = el("div", { class: "toc-head" });
    head.appendChild(el("h3", {}, JTC.t("section.main_document")));
    const dlBtn = el("button", {
      class: "toc-download",
      type: "button",
      "aria-label": JTC.t("toc.download_aria"),
      title: JTC.t("toc.download_title"),
      onClick: (e) => { e.preventDefault(); JTC.downloadMarkdown(); }
    });
    dlBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>';
    head.appendChild(dlBtn);
    container.appendChild(head);
    const mainList = el("ul");
    mainList.appendChild(tocLink({ id: "preamble", label: JTC.t("section.preamble") }));
    C.articles.forEach(a => {
      mainList.appendChild(tocLink({ id: a.id, label: `${a.label}${a.subtitle ? " · " + a.subtitle : ""}` }));
      const sub = el("ul", { class: "toc-sub" });
      a.sections.forEach(s => {
        const t = s.heading ? `${s.label} · ${s.heading}` : s.label;
        sub.appendChild(tocLink({ id: s.id, label: t }));
      });
      mainList.appendChild(sub);
    });
    mainList.appendChild(tocLink({ id: "signatures", label: JTC.t("section.signatures") }));
    container.appendChild(mainList);

    container.appendChild(el("h3", {}, JTC.t("section.amendments")));
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

  // ---- Drawer (hamburger) ----
  let releaseDrawerTrap = null;
  function openDrawer() {
    const d = document.getElementById("toc-drawer");
    d.classList.add("is-open");
    d.setAttribute("aria-modal", "true");
    renderToc(d.querySelector(".toc"));
    document.body.style.overflow = "hidden";
    releaseDrawerTrap = JTC.trapFocus(d);
  }
  function closeDrawer() {
    const d = document.getElementById("toc-drawer");
    d.classList.remove("is-open");
    d.removeAttribute("aria-modal");
    document.body.style.overflow = "";
    if (releaseDrawerTrap) { releaseDrawerTrap(); releaseDrawerTrap = null; }
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
      JTC.trackEvent('share_clicked');

      if (action === "copy") {
        const ok = await copyText(url);
        showToast(ok ? JTC.t("toast.link_copied") : JTC.t("toast.copy_failed"));
        closePop();
      } else if (action === "email") {
        const subject = encodeURIComponent(title);
        const body = encodeURIComponent(JTC.t("share.email_body_prefix") + url);
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

  JTC.renderToc = renderToc;
  JTC.openDrawer = openDrawer;
  JTC.closeDrawer = closeDrawer;
  JTC.initShare = initShare;
})();
