/* ===== justtheconstitution — reader =====
   Renders the Constitution text into #text-pane. Owns copy buttons, citation
   builders, full-text flatteners, and Markdown export.
   Depends on: core (el, copyText, showToast, SITE_URL), tweaks (getTweaks),
               images (setCurrentPage, openLightbox, manualImageMode write),
               window.CONSTITUTION. */
(() => {
  const JTC = window.JTC;
  const { el, copyText, showToast, SITE_URL } = JTC;
  const C = window.CONSTITUTION;

  const COPY_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

  function formatCopyPayload(text, cite, mode) {
    if (mode === "plain") return text;
    return `"${text}"\n\n— ${cite}\nSource: ${SITE_URL}`;
  }

  function addCopyButton(host, getText, cite, label) {
    const btn = el("button", {
      class: "copy-btn",
      type: "button",
      "aria-label": `Copy — ${cite}`,
      title: JTC.t("copy.to_clipboard")
    });
    btn.innerHTML = COPY_SVG;
    if (label) btn.appendChild(el("span", { class: "copy-label" }, label));
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const text = (typeof getText === "function" ? getText() : getText).trim();
      const payload = formatCopyPayload(text, cite, JTC.getTweaks().copyMode);
      const ok = await copyText(payload);
      showToast(ok ? JTC.t("toast.copied") : JTC.t("toast.copy_failed"));
    });
    host.appendChild(btn);
    return btn;
  }

  // Citation builders
  function citeArticle(art, sectionLabel, sectionHeading, paraIndex, totalParas) {
    const parts = [JTC.t("cite.us_constitution"), `${JTC.t("prefix.article")} ${art}`];
    if (sectionLabel) parts.push(sectionLabel); // "Section 1", "Section 2", …
    else if (sectionHeading) parts.push(sectionHeading);
    if (paraIndex && totalParas > 1) parts.push(JTC.t("prefix.paragraph") + " " + paraIndex);
    return parts.join(", ");
  }
  function citeAmendment(num, paraIndex, totalParas) {
    const parts = [JTC.t("cite.us_constitution"), `${JTC.t("prefix.amendment")} ${num}`];
    if (paraIndex && totalParas > 1) parts.push(JTC.t("prefix.paragraph") + " " + paraIndex);
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
    // If the pane already has element children, the content was pre-rendered
    // by build.js — just hydrate (attach copy buttons, page chips, download
    // handler). This is the production path. The client-side render below is
    // the fallback for local dev against the template or for unbuilt forks.
    if (pane.children.length > 0) {
      hydrateText(pane);
      return;
    }

    // Title
    pane.appendChild(el("h1", { class: "doc-title" }, JTC.t("doc.title")));
    pane.appendChild(el("div", { class: "doc-tag" }, JTC.t("doc.tag")));

    // Preamble — English locale gets the engrossed-"We" dropcap (JTC mark,
    // Shallus's iconic letterform). Real "We" stays in DOM (visually hidden
    // via .dropcap-letters) for screen readers and copy-paste. Other locales
    // fall through to the standard ::first-letter Caslon dropcap.
    const pre = el("section", { id: "preamble", class: "anchor", "data-chapter": "preamble" });
    const isEN = (document.documentElement.dataset.currentLocale || document.documentElement.lang || "en") === "en";
    let preP;
    if (isEN && /^We /.test(C.preamble.text)) {
      preP = el("p", { class: "preamble has-dropcap-we" }, [
        el("span", { class: "dropcap-we", "aria-hidden": "true" }),
        el("span", { class: "dropcap-letters" }, "We"),
        C.preamble.text.slice(2)
      ]);
    } else {
      preP = el("p", { class: "preamble" }, C.preamble.text);
    }
    addCopyButton(preP, C.preamble.text, `${JTC.t("cite.us_constitution")}, ${JTC.t("section.preamble")}`, JTC.t("copy.excerpt"));
    pre.appendChild(preP);
    pane.appendChild(pre);

    // Articles
    C.articles.forEach(a => {
      const artNum = a.label.replace("Article ", "");
      const art = el("section", { id: a.id, class: "anchor", "data-chapter": a.id });
      const head = el("div", { class: "section-drop" });
      const h2 = el("h2", {}, a.label);
      addCopyButton(h2, () => articleFullText(a), `${JTC.t("cite.us_constitution")}, ${JTC.t("prefix.article")} ${artNum}`, JTC.t("copy.passage"));
      const headText = el("div", { class: "article-head" }, [
        h2,
        a.subtitle ? el("div", { class: "article-sub" }, a.subtitle) : null
      ]);
      const pageBtn = el("button", {
        class: "page-chip",
        title: JTC.t("image.view_original"),
        onClick: () => {
          // Explicit click in text resumes auto-follow.
          JTC.manualImageMode = false;
          JTC.setCurrentPage(a.page);
          // On mobile the side pane is hidden; open the lightbox directly so
          // the parchment still pops up on tap.
          if (window.matchMedia("(max-width: 960px)").matches) JTC.openLightbox();
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
            addCopyButton(h3, () => sectionFullText(s), citeArticle(artNum, s.label, s.heading), JTC.t("copy.passage"));
            sh.appendChild(h3);
          } else {
            // Only a section label (no heading) — attach copy to the label itself.
            addCopyButton(sh, () => sectionFullText(s), citeArticle(artNum, s.label, ""), JTC.t("copy.passage"));
          }
          sec.appendChild(sh);
        }
        const total = s.paragraphs.length;
        s.paragraphs.forEach((p, i) => {
          const paraEl = el("p", {}, p);
          const paraCite = citeArticle(artNum, s.label, s.heading, i + 1, total);
          addCopyButton(paraEl, p, paraCite, JTC.t("copy.excerpt"));
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
    addCopyButton(presBlock, signaturesFullText, `${JTC.t("cite.us_constitution")}, ${JTC.t("section.signatures")}`, JTC.t("copy.all"));
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
        ol.appendChild(el("li", {}, JTC.t("prefix.commonly_known") + " " + f.common + end));
      });
      sig.appendChild(ol);
    }
    pane.appendChild(sig);

    // Amendments heading
    const amHead = el("section", { id: "amendments", class: "anchor amendments-head", "data-chapter": "amendments" });
    amHead.appendChild(el("h2", {}, JTC.t("section.amendments")));
    amHead.appendChild(el("div", { class: "sub" }, JTC.t("section.amendments_intro")));
    pane.appendChild(amHead);

    // Amendments
    C.amendments.forEach(am => {
      const box = el("section", { id: am.id, class: "anchor amendment", "data-chapter": "amendments", "data-amnum": am.num });
      box.appendChild(el("div", { class: "amendment__meta" }, [
        el("span", { class: "amendment__num" }, `${JTC.t("prefix.amendment")} ${am.num}`),
        el("span", { class: "amendment__year" }, `${JTC.t("prefix.ratified")} ${am.year}`)
      ]));
      const amH3 = el("h3", {}, am.label);
      addCopyButton(amH3, () => amendmentFullText(am), `${JTC.t("cite.us_constitution")}, ${JTC.t("prefix.amendment")} ${am.num}`, JTC.t("copy.passage"));
      box.appendChild(amH3);
      box.appendChild(el("div", { class: "amendment__sub" }, am.subtitle));
      const totalAm = am.paragraphs.length;
      am.paragraphs.forEach((p, i) => {
        const paraEl = el("p", {}, p);
        addCopyButton(paraEl, p, citeAmendment(am.num, i + 1, totalAm), JTC.t("copy.excerpt"));
        box.appendChild(paraEl);
      });
      pane.appendChild(box);
    });

    renderDownloadCta(pane);
  }

  // Walk pre-rendered DOM and attach interactive elements that build.js omits:
  // copy buttons on every copyable element, page-chip buttons on each article,
  // and the download CTA button. Structure must mirror what renderText() emits
  // above (and what build.js produces).
  function hydrateText(pane) {
    // Preamble
    const preP = pane.querySelector("#preamble > p.preamble");
    if (preP) addCopyButton(preP, C.preamble.text, `${JTC.t("cite.us_constitution")}, ${JTC.t("section.preamble")}`, JTC.t("copy.excerpt"));

    // Articles
    C.articles.forEach(a => {
      const artNum = a.label.replace("Article ", "");
      const art = document.getElementById(a.id);
      if (!art) return;
      const h2 = art.querySelector(".article-head h2");
      if (h2) addCopyButton(h2, () => articleFullText(a), `${JTC.t("cite.us_constitution")}, ${JTC.t("prefix.article")} ${artNum}`, JTC.t("copy.passage"));

      const sectionDrop = art.querySelector(":scope > .section-drop");
      if (sectionDrop && !sectionDrop.querySelector(".page-chip")) {
        const pageBtn = el("button", {
          class: "page-chip",
          title: JTC.t("image.view_original"),
          onClick: () => {
            JTC.manualImageMode = false;
            JTC.setCurrentPage(a.page);
            if (window.matchMedia("(max-width: 960px)").matches) JTC.openLightbox();
          }
        }, `Page ${a.page} →`);
        sectionDrop.appendChild(pageBtn);
      }

      a.sections.forEach(s => {
        const sec = document.getElementById(s.id);
        if (!sec) return;
        const sh = sec.querySelector(":scope > .section-head");
        if (sh) {
          const h3 = sh.querySelector("h3");
          if (h3) {
            addCopyButton(h3, () => sectionFullText(s), citeArticle(artNum, s.label, s.heading), JTC.t("copy.passage"));
          } else {
            addCopyButton(sh, () => sectionFullText(s), citeArticle(artNum, s.label, ""), JTC.t("copy.passage"));
          }
        }
        const paras = sec.querySelectorAll(":scope > p");
        const total = s.paragraphs.length;
        paras.forEach((paraEl, i) => {
          const p = s.paragraphs[i];
          const paraCite = citeArticle(artNum, s.label, s.heading, i + 1, total);
          addCopyButton(paraEl, p, paraCite, JTC.t("copy.excerpt"));
        });
      });
    });

    // Signatures
    const presBlock = pane.querySelector(".signatures__pres");
    if (presBlock) addCopyButton(presBlock, signaturesFullText, `${JTC.t("cite.us_constitution")}, ${JTC.t("section.signatures")}`, JTC.t("copy.all"));

    // Amendments
    C.amendments.forEach(am => {
      const box = document.getElementById(am.id);
      if (!box) return;
      const h3 = box.querySelector(":scope > h3");
      if (h3) addCopyButton(h3, () => amendmentFullText(am), `${JTC.t("cite.us_constitution")}, ${JTC.t("prefix.amendment")} ${am.num}`, JTC.t("copy.passage"));
      const paras = box.querySelectorAll(":scope > p");
      const totalAm = am.paragraphs.length;
      paras.forEach((paraEl, i) => {
        const p = am.paragraphs[i];
        addCopyButton(paraEl, p, citeAmendment(am.num, i + 1, totalAm), JTC.t("copy.excerpt"));
      });
    });

    // Download CTA — insert the button before the hint text, matching
    // renderDownloadCta's order (heading, paragraph, button, hint).
    const cta = pane.querySelector(".download-cta");
    if (cta && !cta.querySelector(".download-cta__btn")) {
      const btn = el("button", { class: "download-cta__btn", type: "button", onClick: downloadMarkdown });
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg><span>' + JTC.t("download.button") + '</span>';
      const hint = cta.querySelector(".download-cta__hint");
      if (hint) cta.insertBefore(btn, hint);
      else cta.appendChild(btn);
    }
  }

  // ---- Download (Markdown) ----
  function renderDownloadCta(pane) {
    const cta = el("section", { class: "download-cta" });
    cta.appendChild(el("h2", {}, JTC.t("download.heading")));
    cta.appendChild(el("p", {}, JTC.t("download.description")));
    const btn = el("button", { class: "download-cta__btn", type: "button", onClick: downloadMarkdown });
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg><span>' + JTC.t("download.button") + '</span>';
    cta.appendChild(btn);
    cta.appendChild(el("div", { class: "download-cta__hint" }, JTC.t("download.hint")));
    pane.appendChild(cta);
  }

  function buildMarkdown() {
    const L = [];
    L.push(`# ${JTC.t("doc.title")}`, "");
    L.push(`*${JTC.t("doc.tag")}*`, "");
    L.push(`## ${JTC.t("section.preamble")}`, "");
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
    L.push(`## ${JTC.t("section.signatures")}`, "");
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
        L.push(`[^sig${i + 1}]: ${JTC.t("prefix.commonly_known")} ${f.common}${end}`);
      });
      L.push("");
    }

    L.push(`## ${JTC.t("section.amendments")}`, "");
    L.push(JTC.t("section.amendments_intro"), "");
    C.amendments.forEach(am => {
      L.push(`### ${JTC.t("prefix.amendment")} ${am.num} — ${am.subtitle}`, "");
      L.push(`*${JTC.t("prefix.ratified")} ${am.year}*`, "");
      am.paragraphs.forEach(p => L.push(p, ""));
    });

    L.push("---", "");
    L.push(JTC.t("md.source_footer"), "");
    return L.join("\n");
  }

  function downloadMarkdown() {
    const blob = new Blob([buildMarkdown()], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = JTC.t("download.filename");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  JTC.renderText = renderText;
  JTC.addCopyButton = addCopyButton;
  JTC.citeArticle = citeArticle;
  JTC.citeAmendment = citeAmendment;
  JTC.articleFullText = articleFullText;
  JTC.sectionFullText = sectionFullText;
  JTC.amendmentFullText = amendmentFullText;
  JTC.signaturesFullText = signaturesFullText;
  JTC.buildMarkdown = buildMarkdown;
  JTC.downloadMarkdown = downloadMarkdown;
})();
