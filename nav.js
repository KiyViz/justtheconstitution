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
    if (JTC.openTool) JTC.openTool('drawer');
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
  // The popover is a singleton (#share-pop). It opens with a per-trigger
  // "context": page-level (source=null, falls back to document.title +
  // location.href) or clause/section/article/amendment/etc. — driven by
  // reader.js when the user clicks a per-passage share button.
  //
  // SOCIAL_INTENTS builders receive an opts bag with already-encoded
  // params. Instagram and TikTok have no web share intent — handled
  // separately as copy-to-clipboard with a "paste into ..." toast.
  const SOCIAL_INTENTS = {
    x:        ({ u, t }) => `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
    facebook: ({ u })    => `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    linkedin: ({ u })    => `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    reddit:   ({ u, t }) => `https://www.reddit.com/submit?url=${u}&title=${t}`
  };

  // Apps without a public web share intent — Instagram and TikTok both
  // require the user to paste content inside their composer. We copy the
  // share text + URL to the clipboard and tell the user which app to
  // open. "More" (Web Share API) is the better path on mobile devices
  // that have the app installed; this is the desktop fallback.
  const CLIPBOARD_ONLY = {
    instagram: "share.toast_paste_instagram",
    tiktok:    "share.toast_paste_tiktok"
  };

  // Position the popover near `trigger`. Falls back to the header-default
  // position if no trigger is provided. The popover is `position: fixed`;
  // we set inline top/left and clear `right` so JS positioning wins.
  function positionPopover(pop, trigger) {
    if (!trigger) {
      pop.style.top = "";
      pop.style.left = "";
      pop.style.right = "";
      return;
    }
    const rect = trigger.getBoundingClientRect();
    const popW = pop.offsetWidth || 220;
    const popH = pop.offsetHeight || 320;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 6;
    let top = rect.bottom + gap;
    let left = rect.right - popW;
    if (top + popH > vh - 8) top = Math.max(8, rect.top - popH - gap);
    if (left < 8) left = 8;
    if (left + popW > vw - 8) left = vw - popW - 8;
    pop.style.top = top + "px";
    pop.style.left = left + "px";
    pop.style.right = "auto";
  }

  // Open the popover with a specific context. context = { source, text,
  // url, title } where source is null for page-level share. reader.js
  // calls this via JTC.openShareFor for per-passage triggers.
  let _activeTrigger = null;
  function openShareFor(context, triggerEl) {
    const pop = document.getElementById("share-pop");
    if (!pop) return;
    if (JTC.openTool) JTC.openTool('share');
    pop._context = context || null;
    _activeTrigger = triggerEl || null;
    // Make it temporarily visible-but-hidden so we can measure for placement.
    pop.style.visibility = "hidden";
    pop.hidden = false;
    positionPopover(pop, triggerEl);
    pop.style.visibility = "";
  }

  function initShare() {
    const btn = document.getElementById("share-btn");
    const pop = document.getElementById("share-pop");
    if (!pop) return;

    // Reveal native share row on supported browsers (mostly mobile)
    if (typeof navigator !== "undefined" && "share" in navigator) {
      const native = pop.querySelector('[data-action="native"]');
      if (native) native.hidden = false;
    }

    const closePop = () => {
      pop.hidden = true;
      pop._context = null;
      _activeTrigger = null;
    };
    if (JTC.registerTool) JTC.registerTool('share', closePop);

    if (btn) {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!pop.hidden && _activeTrigger === btn) { closePop(); return; }
        openShareFor(null, btn);
      });
    }
    document.addEventListener("click", (e) => {
      if (pop.hidden) return;
      if (pop.contains(e.target)) return;
      if (_activeTrigger && _activeTrigger.contains(e.target)) return;
      closePop();
    });
    document.addEventListener("keydown", (e) => {
      if (!pop.hidden && e.key === "Escape") {
        const t = _activeTrigger;
        closePop();
        if (t && t.focus) t.focus();
      }
    });

    pop.addEventListener("click", async (e) => {
      const row = e.target.closest(".share-row");
      if (!row) return;
      const action = row.dataset.action;
      const ctx = pop._context;
      const source = ctx ? ctx.source : null;
      const kind = source && source.kind ? source.kind : "page";
      const locale = document.documentElement.dataset.currentLocale
                  || document.documentElement.lang || "en";
      const opts = {
        locale,
        url: JTC.SITE_URL,
        fallbackUrl: ctx ? ctx.url : location.href,
        fallbackTitle: ctx ? ctx.title : document.title
      };
      const passage = ctx ? ctx.text : "";
      const payload = JTC.buildSharePayload(source, passage, action, opts);
      JTC.trackEvent(`share:${action}:${kind}`, { dedupe: false });

      // Close immediately so the tap registers visibly and the toast for
      // "copy" isn't competing with an open menu for attention. Anything
      // async (clipboard write, native share sheet) runs afterwards.
      closePop();

      if (action === "copy") {
        const ok = await copyText(payload.text || payload.url);
        showToast(ok ? JTC.t("toast.link_copied") : JTC.t("toast.copy_failed"));
      } else if (CLIPBOARD_ONLY[action]) {
        // Instagram / TikTok — copy and show a "paste into X" toast.
        const ok = await copyText(payload.text || payload.url);
        showToast(ok ? JTC.t(CLIPBOARD_ONLY[action]) : JTC.t("toast.copy_failed"));
      } else if (action === "email") {
        const subject = encodeURIComponent(payload.title || "");
        const body = encodeURIComponent(payload.text || "");
        location.href = `mailto:?subject=${subject}&body=${body}`;
      } else if (action === "native") {
        try {
          const arg = { url: payload.url };
          if (payload.title) arg.title = payload.title;
          if (payload.text)  arg.text  = payload.text;
          await navigator.share(arg);
        } catch { /* user cancelled or unsupported */ }
      } else if (SOCIAL_INTENTS[action]) {
        const intent = SOCIAL_INTENTS[action]({
          u: encodeURIComponent(payload.url || ""),
          t: encodeURIComponent(payload.text || payload.title || "")
        });
        window.open(intent, "_blank", "noopener,noreferrer");
      }
    });
  }

  JTC.renderToc = renderToc;
  JTC.openDrawer = openDrawer;
  JTC.closeDrawer = closeDrawer;
  JTC.initShare = initShare;
  JTC.openShareFor = openShareFor;
  if (JTC.registerTool) JTC.registerTool('drawer', closeDrawer);
})();
