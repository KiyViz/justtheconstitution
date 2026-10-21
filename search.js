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
  let searchTrigger = null;

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
        if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
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
    // Group inline text by its closest block. A drop cap or emphasized span
    // can split a phrase, but distinct paragraphs must never become one hit.
    const groups = new Map();
    collectTextNodes(pane).forEach(node => {
      const block = node.parentElement.closest('p,h1,h2,h3,h4,li,div,section') || pane;
      if (!groups.has(block)) groups.set(block, []);
      groups.get(block).push(node);
    });
    groups.forEach(nodes => {
      let text = '';
      const spans = nodes.map(node => {
        const start = text.length;
        text += node.nodeValue;
        return { node, start, end: text.length };
      });
      const found = Array.from(text.matchAll(re)).map(m => ({ start: m.index, end: m.index + m[0].length, marks: [] }));
      spans.forEach(({ node, start, end }) => {
        const overlaps = found.filter(hit => hit.start < end && hit.end > start);
        if (!overlaps.length) return;
        const fragment = document.createDocumentFragment();
        let cursor = 0;
        overlaps.forEach(hit => {
          const from = Math.max(start, hit.start) - start;
          const to = Math.min(end, hit.end) - start;
          fragment.appendChild(document.createTextNode(node.nodeValue.slice(cursor, from)));
          const mark = document.createElement('mark');
          mark.className = 'search-hit';
          mark.textContent = node.nodeValue.slice(from, to);
          fragment.appendChild(mark);
          hit.marks.push(mark);
          cursor = to;
        });
        fragment.appendChild(document.createTextNode(node.nodeValue.slice(cursor)));
        node.parentNode.replaceChild(fragment, node);
      });
      hits.push(...found.map(hit => hit.marks));
    });
    return hits;
  }

  function scrollMatchIntoView(mark) {
    const rect = mark.getBoundingClientRect();
    const headerH = JTC.scrollOffset();
    const targetY = rect.top + window.scrollY - headerH - 40;
    // Borrow scrollToId's suppress window so the hash observer doesn't fire
    // while we cross anchors on the way to the match.
    JTC.scrollToPosition(targetY);
    const passage = mark.closest('p[id],.anchor[id]');
    if (passage) {
      JTC.currentPassage = passage.id;
      history.replaceState(null, '', '#' + encodeURIComponent(passage.id));
    }
  }

  function activate(i) {
    if (!matches.length) {
      currentIndex = -1;
      updateCount();
      return;
    }
    const wrapped = ((i % matches.length) + matches.length) % matches.length;
    matches.flat().forEach(m => m.classList.remove('search-hit--active'));
    currentIndex = wrapped;
    const marks = matches[currentIndex];
    marks.forEach(mark => mark.classList.add('search-hit--active'));
    scrollMatchIntoView(marks[0]);
    updateCount();
  }

  function updateCount() {
    if (!countEl) return;
    if (!lastQuery) {
      countEl.textContent = '';
      countEl.classList.remove('search-bar__count--active');
      prevBtn.disabled = true; nextBtn.disabled = true;
      return;
    }
    if (!matches.length) {
      countEl.textContent = JTC.t("search.no_results");
      countEl.classList.remove('search-bar__count--active');
      prevBtn.disabled = true; nextBtn.disabled = true;
      return;
    }
    // Echo the query in the counter so users see their input was registered —
    // without it, the typed text on the left and the count on the right feel
    // disconnected. Capped at 30 chars so long queries don't push the bar around.
    const queryEcho = lastQuery.length > 30 ? lastQuery.slice(0, 30) + '…' : lastQuery;
    countEl.textContent = JTC.t("search.counter")
      .replace("{current}", currentIndex + 1)
      .replace("{total}", matches.length)
      .replace("{query}", queryEcho);
    countEl.classList.add('search-bar__count--active');
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
    if (JTC.openTool) JTC.openTool('search');
    if (bar.hidden) searchTrigger = document.activeElement;
    bar.hidden = false;
    input.focus();
    input.select();
  }

  function close() {
    if (!bar || bar.hidden) return;
    clearTimeout(debounceTimer);
    const returnToTrigger = bar.contains(document.activeElement);
    clearHighlights();
    lastQuery = '';
    if (input) input.value = '';
    bar.hidden = true;
    updateCount();
    if (returnToTrigger) JTC.returnFocus(searchTrigger);
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
    if (JTC.registerTool) JTC.registerTool('search', close);

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
