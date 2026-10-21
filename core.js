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

  // Storage can be unavailable even when reading the localStorage property.
  // Keep a session copy so controls still work after denial or quota errors.
  const memory = new Map();
  const storage = {
    getItem(key) {
      if (memory.has(key)) return memory.get(key);
      try { return window.localStorage.getItem(key); } catch { return null; }
    },
    setItem(key, value) {
      memory.set(key, String(value));
      try { window.localStorage.setItem(key, String(value)); } catch {}
    },
    removeItem(key) {
      memory.set(key, null);
      try { window.localStorage.removeItem(key); } catch {}
    },
    readJSON(key) {
      try { return JSON.parse(this.getItem(key)); } catch { return null; }
    }
  };

  function scrollOffset() {
    return ['.site-header', '.progress'].reduce((bottom, selector) => {
      const node = document.querySelector(selector);
      return node && node.getClientRects().length
        ? Math.max(bottom, node.getBoundingClientRect().bottom) : bottom;
    }, 0) + 16;
  }
  let scrollTimer;
  function scrollToPosition(top, behavior = 'smooth') {
    window.JTC.layoutPassage = null;
    window.JTC.suppressHashSync = true;
    clearTimeout(scrollTimer);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : behavior;
    window.scrollTo({ top: Math.max(0, top), behavior: motion });
    scrollTimer = setTimeout(() => {
      window.JTC.suppressHashSync = false;
      if (window.JTC.saveReadingPosition) window.JTC.saveReadingPosition();
    }, motion === 'smooth' ? 1200 : 100);
  }
  function scrollToId(id, options = {}) {
    const target = document.getElementById(id);
    if (!target) return;
    window.JTC.currentPassage = id;
    scrollToPosition(target.getBoundingClientRect().top + window.scrollY - scrollOffset(), options.behavior);
    if (!window.JTC.readerReady) window.JTC.layoutPassage = id;
    history.replaceState(null, "", `#${encodeURIComponent(id)}`);
  }

  function focusFirst(container) {
    const first = Array.from(container.querySelectorAll('a[href],button,input,select,textarea,summary,[tabindex]'))
      .find(node => !node.disabled && node.tabIndex >= 0 && node.getClientRects().length);
    if (first) first.focus({ preventScroll: true });
  }
  function returnFocus(node) {
    if (node && node.isConnected && node.getClientRects().length) node.focus({ preventScroll: true });
  }

  function trapFocus(container) {
    const focusable = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
    const prev = document.activeElement;
    focusFirst(container);
    function handler(e) {
      if (e.key !== 'Tab') return;
      const els = Array.from(container.querySelectorAll(focusable)).filter(node => node.getClientRects().length);
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
      returnFocus(prev);
    };
  }

  const tracked = {};
  function trackEvent(name, opts) {
    const dedupe = !opts || opts.dedupe !== false;
    if (dedupe) {
      if (tracked[name]) return;
      tracked[name] = true;
    }
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark('jtc:' + name);
    }
  }

  // Tool mutual-exclusion coordinator. Each top-level panel (search,
  // drawer, share, settings) registers its own close fn at init time;
  // opening any one panel closes every other registered one. This keeps
  // overlapping popovers from stacking — without an event bus, just a
  // shared registry on JTC.
  const _tools = {};
  function registerTool(name, closeFn) { _tools[name] = closeFn; }
  function openTool(name) {
    for (const k in _tools) if (k !== name) _tools[k]();
  }

  const JTC = window.JTC;
  JTC.el = el;
  JTC.copyText = copyText;
  JTC.showToast = showToast;
  JTC.scrollToId = scrollToId;
  JTC.scrollToPosition = scrollToPosition;
  JTC.scrollOffset = scrollOffset;
  JTC.storage = storage;
  JTC.focusFirst = focusFirst;
  JTC.returnFocus = returnFocus;
  JTC.readerReady = false;
  JTC.trapFocus = trapFocus;
  JTC.trackEvent = trackEvent;
  JTC.registerTool = registerTool;
  JTC.openTool = openTool;
  JTC.SITE_URL = "https://justtheconstitution.org";
  JTC.suppressHashSync = false;
})();
