/* ===== justtheconstitution — core =====
   DOM helper, clipboard + toast, scroll-to-id, site URL.
   Depends on: nothing. Must load before every other JTC module. */
(() => {
  window.JTC = window.JTC || {};

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

  function scrollToId(id) {
    const target = document.getElementById(id);
    if (!target) return;
    // Suppress the hash-sync observer for the duration of the smooth scroll,
    // so the URL doesn't flicker through every anchor the scroll passes over.
    window.JTC.suppressHashSync = true;
    const headerH = 132;
    const y = target.getBoundingClientRect().top + window.scrollY - headerH;
    window.scrollTo({ top: y, behavior: "smooth" });
    history.replaceState(null, "", `#${id}`);
    setTimeout(() => { window.JTC.suppressHashSync = false; }, 1200);
  }

  function trapFocus(container) {
    const focusable = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
    const prev = document.activeElement;
    const first = container.querySelector(focusable);
    if (first) first.focus();
    function handler(e) {
      if (e.key !== 'Tab') return;
      const els = Array.from(container.querySelectorAll(focusable));
      if (!els.length) return;
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === els[0]) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); els[0].focus();
      }
    }
    container.addEventListener('keydown', handler);
    return function release() {
      container.removeEventListener('keydown', handler);
      if (prev && prev.focus) prev.focus();
    };
  }

  const tracked = {};
  function trackEvent(name) {
    if (tracked[name]) return;
    tracked[name] = true;
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark('jtc:' + name);
    }
  }

  const JTC = window.JTC;
  JTC.el = el;
  JTC.copyText = copyText;
  JTC.showToast = showToast;
  JTC.scrollToId = scrollToId;
  JTC.trapFocus = trapFocus;
  JTC.trackEvent = trackEvent;
  JTC.SITE_URL = "https://justtheconstitution.org";
  JTC.suppressHashSync = false;
})();
