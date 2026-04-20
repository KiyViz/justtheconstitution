/* ===== justtheconstitution — search =====
   Client-side full-text search. Walks text nodes inside #text-pane, wraps
   matches in <mark class="search-hit"> without ever using innerHTML on user
   input. Works against the pre-rendered DOM — no knowledge of the data
   structure, so it drops into any future "Just the ___" site unchanged.
   Depends on: core (scrollToId for suppress flag hand-off). */
(() => {
  const JTC = window.JTC;

  // State
  let matches = [];
  let currentIndex = -1;
  let lastQuery = '';
  let debounceTimer = null;

  // Elements resolved in init()
  let bar, input, countEl, prevBtn, nextBtn;

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function clearHighlights() {
    const marks = document.querySelectorAll('#text-pane mark.search-hit');
    marks.forEach(mark => {
      const parent = mark.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    });
    matches = [];
    currentIndex = -1;
  }

  function buildRegex(query) {
    // Case-insensitive, escaped. Empty query returns null so callers skip.
    if (!query) return null;
    return new RegExp(escapeRegex(query), 'gi');
  }

  function collectTextNodes(pane) {
    const walker = document.createTreeWalker(pane, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        // Skip text inside <mark>, <script>, <style>, <button> (copy-btn labels etc.)
        let p = node.parentElement;
        while (p && p !== pane) {
          const tag = p.tagName;
          if (tag === 'MARK' || tag === 'SCRIPT' || tag === 'STYLE' || tag === 'BUTTON') {
            return NodeFilter.FILTER_REJECT;
          }
          p = p.parentElement;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    return nodes;
  }

  function highlight(query) {
    const pane = document.getElementById('text-pane');
    if (!pane) return [];
    const re = buildRegex(query);
    if (!re) return [];
    const hits = [];
    const textNodes = collectTextNodes(pane);
    textNodes.forEach(textNode => {
      const text = textNode.nodeValue;
      // Reset lastIndex; matchAll handles /g for us but we use exec-style below.
      const allMatches = Array.from(text.matchAll(re));
      if (!allMatches.length) return;

      const frag = document.createDocumentFragment();
      let lastIdx = 0;
      for (const m of allMatches) {
        const start = m.index;
        const end = start + m[0].length;
        if (start > lastIdx) frag.appendChild(document.createTextNode(text.slice(lastIdx, start)));
        const mark = document.createElement('mark');
        mark.className = 'search-hit';
        // textContent — never innerHTML — keeps user input inert.
        mark.textContent = m[0];
        frag.appendChild(mark);
        hits.push(mark);
        lastIdx = end;
      }
      if (lastIdx < text.length) frag.appendChild(document.createTextNode(text.slice(lastIdx)));
      textNode.parentNode.replaceChild(frag, textNode);
    });
    return hits;
  }

  function scrollMatchIntoView(mark) {
    const rect = mark.getBoundingClientRect();
    const headerH = 132;
    const targetY = rect.top + window.scrollY - headerH - 40;
    // Borrow scrollToId's suppress window so the hash observer doesn't fire
    // while we cross anchors on the way to the match.
    JTC.suppressHashSync = true;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
    setTimeout(() => { JTC.suppressHashSync = false; }, 1200);
  }

  function activate(i) {
    if (!matches.length) {
      currentIndex = -1;
      updateCount();
      return;
    }
    const wrapped = ((i % matches.length) + matches.length) % matches.length;
    matches.forEach(m => m.classList.remove('search-hit--active'));
    currentIndex = wrapped;
    const mark = matches[currentIndex];
    mark.classList.add('search-hit--active');
    scrollMatchIntoView(mark);
    updateCount();
  }

  function updateCount() {
    if (!countEl) return;
    if (!lastQuery) { countEl.textContent = ''; prevBtn.disabled = true; nextBtn.disabled = true; return; }
    if (!matches.length) { countEl.textContent = 'No results'; prevBtn.disabled = true; nextBtn.disabled = true; return; }
    countEl.textContent = `${currentIndex + 1} of ${matches.length}`;
    prevBtn.disabled = false;
    nextBtn.disabled = false;
  }

  function runSearch(query) {
    clearHighlights();
    lastQuery = query;
    if (!query) { updateCount(); return; }
    matches = highlight(query);
    if (matches.length) {
      activate(0);
    } else {
      updateCount();
    }
  }

  function open() {
    if (!bar) return;
    bar.hidden = false;
    input.focus();
    input.select();
  }

  function close() {
    if (!bar) return;
    clearHighlights();
    lastQuery = '';
    if (input) input.value = '';
    bar.hidden = true;
    updateCount();
  }

  function next() { if (matches.length) activate(currentIndex + 1); }
  function prev() { if (matches.length) activate(currentIndex - 1); }

  function init() {
    bar = document.getElementById('search-bar');
    input = document.getElementById('search-input');
    countEl = document.getElementById('search-count');
    prevBtn = document.getElementById('search-prev');
    nextBtn = document.getElementById('search-next');
    if (!bar || !input) return;

    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => runSearch(input.value), 200);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        // If the debounce hasn't fired yet, run immediately so Enter has
        // something to navigate over.
        if (input.value !== lastQuery) {
          clearTimeout(debounceTimer);
          runSearch(input.value);
          return;
        }
        if (e.shiftKey) prev(); else next();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    });

    prevBtn.addEventListener('click', prev);
    nextBtn.addEventListener('click', next);
    document.getElementById('search-close').addEventListener('click', close);

    // Global Ctrl/Cmd+F — intercept native find so users get the
    // in-document highlight/counter instead.
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        open();
      } else if (e.key === 'Escape' && bar && !bar.hidden) {
        e.preventDefault();
        close();
      }
    });
  }

  JTC.openSearch = open;
  JTC.closeSearch = close;
  JTC.initSearch = init;
})();
