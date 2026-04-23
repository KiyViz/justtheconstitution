/* ===== justtheconstitution — lang =====
   Language/locale switcher popover.
   Depends on: core (el). */
(() => {
  const JTC = window.JTC;
  const { el } = JTC;

  function init() {
    const root = document.documentElement;
    let locales;
    try { locales = JSON.parse(root.dataset.locales || "[]"); } catch { return; }
    const current = root.dataset.currentLocale || "en";
    if (locales.length < 2) return;  // No switcher needed for single locale

    const btn = document.getElementById("lang-btn");
    const pop = document.getElementById("lang-pop");
    if (!btn || !pop) return;

    // Populate popover
    pop.innerHTML = "";
    locales.forEach(loc => {
      const row = el("button", {
        class: "lang-row" + (loc.code === current ? " is-active" : ""),
        type: "button",
        onClick: () => {
          if (loc.code !== current) {
            localStorage.setItem("jtc:lang", loc.code);
            location.href = "../" + loc.code + "/" + location.hash;
          }
          pop.hidden = true;
        }
      }, loc.name);
      pop.appendChild(row);
    });

    // Toggle
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
  }

  JTC.initLang = init;
})();
