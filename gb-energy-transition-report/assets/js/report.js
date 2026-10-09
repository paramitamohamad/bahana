/* Report interactions: contents rail + scrollspy, reading progress, contents drawer on phones,
   copy-link anchors, citation copy, footnote popovers, collapsible appendix, back-to-top. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ── Toast ─────────────────────────────────────────── */
  var toastEl = $('#toast'), toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('on'); }, 1800);
  }

  function copyText(text, okMsg, fallbackEl) {
    function fallback() {
      if (fallbackEl) {
        var range = document.createRange(); range.selectNodeContents(fallbackEl);
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        toast('Selected. Press Ctrl/Cmd + C to copy');
      } else {
        toast('Copy not available here');
      }
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { toast(okMsg); }, fallback);
      } else { fallback(); }
    } catch (e) { fallback(); }
  }

  function pageUrl(hash) {
    var base = location.href.split('#')[0];
    return hash ? base + '#' + hash : base;
  }

  /* ── Open a <details> that contains the target ─────── */
  function revealTarget(id) {
    var el = id && document.getElementById(id);
    if (!el) return null;
    var d = el.closest('details');
    if (d && !d.open) d.open = true;
    if (el.tagName === 'DETAILS' && !el.open) el.open = true;
    return el;
  }
  function onHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    var el = revealTarget(id);
    if (el) setTimeout(function () { el.scrollIntoView(); }, 0);
  }
  window.addEventListener('hashchange', onHash);
  if (location.hash) onHash();

  /* ── Heading anchors: copy section link ───────────── */
  $$('.anchor').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      var id = a.getAttribute('data-copy');
      try { history.replaceState(null, '', '#' + id); } catch (err) {}
      copyText(pageUrl(id), 'Link to section copied');
    });
  });

  /* ── Citation copy ────────────────────────────────── */
  var citeBtn = $('#cite-copy');
  if (citeBtn) citeBtn.addEventListener('click', function () {
    var p = $('#cite-text');
    copyText(p.textContent.trim(), 'Citation copied', p);
  });

  /* ── Contents drawer (phones) ─────────────────────── */
  var toc = $('#toc'), tocBtn = $('#toc-open'), tocClose = $('#toc-close');
  function setDrawer(open) {
    if (!toc) return;
    toc.classList.toggle('drawer-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (tocBtn) tocBtn.setAttribute('aria-expanded', String(open));
    if (open && tocClose) tocClose.focus();
  }
  if (tocBtn) tocBtn.addEventListener('click', function () { setDrawer(true); });
  if (tocClose) tocClose.addEventListener('click', function () { setDrawer(false); if (tocBtn) tocBtn.focus(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && toc && toc.classList.contains('drawer-open')) setDrawer(false); });
  $$('#toc a').forEach(function (a) {
    a.addEventListener('click', function () {
      var id = a.getAttribute('href').slice(1);
      revealTarget(id);
      if (toc.classList.contains('drawer-open')) setDrawer(false);
    });
  });

  /* ── Scrollspy + progress + bar title + back-to-top ─ */
  var links = $$('#toc a[href^="#"]');
  var targets = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  var bar = $('#progress span'), barTitle = $('#bar-title'), hero = $('.hero'), toTop = $('#to-top');
  var ticking = false;
  function update() {
    ticking = false;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var y = window.scrollY || doc.scrollTop;
    if (bar) bar.style.width = (max > 0 ? Math.min(100, (y / max) * 100) : 0) + '%';
    if (barTitle && hero) barTitle.classList.toggle('on', hero.getBoundingClientRect().bottom < 60);
    if (toTop) toTop.classList.toggle('on', y > window.innerHeight * 1.2);

    var line = 140, current = -1;
    for (var i = 0; i < targets.length; i++) {
      var t = targets[i];
      if (!t || t.offsetParent === null) continue; // hidden inside closed details
      if (t.getBoundingClientRect().top - line <= 0) current = i; else break;
    }
    links.forEach(function (a, i) { a.classList.toggle('active', i === current); if (i === current) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    $$('#toc .t1').forEach(function (li) { li.classList.remove('open'); });
    if (current >= 0) {
      var li = links[current].closest('.t1');
      if (li) li.classList.add('open');
      // keep the active link visible in the rail
      var rail = $('#toc');
      if (rail && !rail.classList.contains('drawer-open') && rail.scrollHeight > rail.clientHeight) {
        var a = links[current], ar = a.getBoundingClientRect(), rr = rail.getBoundingClientRect();
        if (ar.top < rr.top + 40 || ar.bottom > rr.bottom - 40) rail.scrollTop += (ar.top - rr.top) - rail.clientHeight / 3;
      }
    }
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0 }); });
  update();

  /* ── Footnote popovers ────────────────────────────── */
  var pop = null;
  function closePop() { if (pop) { pop.remove(); pop = null; } }
  $$('.fnref a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var n = a.textContent.trim();
      var note = document.getElementById('fn-' + n);
      if (!note) return;
      e.preventDefault();
      if (pop && pop.dataset.n === n) { closePop(); return; }
      closePop();
      pop = document.createElement('div');
      pop.className = 'fn-pop'; pop.dataset.n = n; pop.setAttribute('role', 'note');
      var body = note.cloneNode(true);
      $$('.backref', body).forEach(function (b) { b.remove(); });
      pop.innerHTML = '<b>' + n + '</b>' + body.innerHTML;
      document.body.appendChild(pop);
      var r = a.getBoundingClientRect();
      var w = pop.offsetWidth;
      var left = Math.max(16, Math.min(r.left + window.scrollX - w / 2, window.scrollX + document.documentElement.clientWidth - w - 16));
      pop.style.left = left + 'px';
      pop.style.top = (r.bottom + window.scrollY + 8) + 'px';
    });
  });
  document.addEventListener('click', function (e) { if (pop && !e.target.closest('.fn-pop') && !e.target.closest('.fnref')) closePop(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePop(); });

  /* ── Appendix expand / collapse all ───────────────── */
  $$('[data-expand]').forEach(function (b) {
    b.addEventListener('click', function () {
      var open = b.getAttribute('data-expand') === 'all';
      $$('details.appx').forEach(function (d) { d.open = open; });
      update();
    });
  });
  $$('details.appx').forEach(function (d) { d.addEventListener('toggle', update); });

  /* ── Theme toggle ─────────────────────────────────── */
  var themeBtn = $('#theme-toggle');
  if (themeBtn) {
    var stored = null;
    try { stored = localStorage.getItem('gb-theme'); } catch (e) {}
    if (stored) document.documentElement.setAttribute('data-theme', stored);
    themeBtn.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme');
      var dark = cur ? cur === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
      var next = dark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('gb-theme', next); } catch (e) {}
      document.dispatchEvent(new CustomEvent('themechange'));
    });
  }
})();
