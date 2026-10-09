/* Figures: each .fig-body[data-chart="figN"] shows assets/img/figN.(png|jpg) with click-to-zoom.
   The zoom viewer supports wheel / pinch zoom, drag to pan, +/- buttons, and Esc to close. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var MANIFEST = window.GB_FIGURES || {}; // { "1": {"src": "assets/img/fig01.png", "w": 1600, "h": 750, "alt": "..."} }

  function build() {
    $$('.fig').forEach(function (fig) {
      var n = fig.getAttribute('data-fig');
      var body = $('.fig-body', fig);
      var meta = MANIFEST[n];
      var cap = $('figcaption', fig);
      var capText = 'Figure ' + n + '.';
      if (cap) { var c2 = cap.cloneNode(true); var num = $('.fig-num', c2); if (num) num.remove(); capText += ' ' + c2.textContent.replace(/\s+/g, ' ').trim(); }
      if (!meta) {
        body.innerHTML = '<div class="fig-pending"><b>Figure ' + n + '</b><span>Image to be added from the source document.</span></div>';
        return;
      }
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fig-zoom';
      btn.setAttribute('aria-label', 'Enlarge ' + capText);
      var img = new Image();
      img.src = meta.src; img.alt = meta.alt || capText; img.loading = 'lazy'; img.decoding = 'async';
      if (meta.w && meta.h) { img.width = meta.w; img.height = meta.h; }
      btn.appendChild(img);
      var hint = document.createElement('span');
      hint.className = 'zoom-hint';
      hint.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4M11 8v6M8 11h6"/></svg>Zoom';
      btn.appendChild(hint);
      body.innerHTML = '';
      body.appendChild(btn);
      btn.addEventListener('click', function () { openViewer(meta, img.alt, capText, btn); });
    });
  }

  /* ── Viewer ─────────────────────────────────────────── */
  var v, stage, pic, label, scale = 1, minScale = 1, tx = 0, ty = 0, lastFocus = null;
  var pointers = {}, startDist = 0, startScale = 1, dragging = false, lastX = 0, lastY = 0;

  function ensureViewer() {
    if (v) return;
    v = document.createElement('div');
    v.className = 'viewer'; v.hidden = true;
    v.setAttribute('role', 'dialog'); v.setAttribute('aria-modal', 'true'); v.setAttribute('aria-label', 'Figure viewer');
    v.innerHTML =
      '<div class="viewer-bar">' +
        '<p class="viewer-cap" id="viewer-cap"></p>' +
        '<div class="viewer-tools">' +
          '<button type="button" class="vbtn" data-z="out" aria-label="Zoom out"><svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button>' +
          '<button type="button" class="vbtn" data-z="fit" aria-label="Fit to screen"><svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>' +
          '<button type="button" class="vbtn" data-z="in" aria-label="Zoom in"><svg viewBox="0 0 24 24"><path d="M5 12h14M12 5v14"/></svg></button>' +
          '<button type="button" class="vbtn" data-z="close" aria-label="Close viewer"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
        '</div>' +
      '</div>' +
      '<div class="viewer-stage"><img alt="" draggable="false"></div>' +
      '<p class="viewer-help">Scroll or pinch to zoom · drag to move · Esc to close</p>';
    document.body.appendChild(v);
    stage = $('.viewer-stage', v); pic = $('img', stage); label = $('#viewer-cap', v);

    $$('[data-z]', v).forEach(function (b) {
      b.addEventListener('click', function () {
        var z = b.getAttribute('data-z');
        if (z === 'close') return closeViewer();
        if (z === 'fit') return fit();
        zoomAt(z === 'in' ? 1.4 : 1 / 1.4, stage.clientWidth / 2, stage.clientHeight / 2);
      });
    });
    stage.addEventListener('wheel', function (e) {
      e.preventDefault();
      var r = stage.getBoundingClientRect();
      zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });
    stage.addEventListener('dblclick', function (e) {
      var r = stage.getBoundingClientRect();
      if (scale > minScale * 1.05) fit(); else zoomAt(2.2, e.clientX - r.left, e.clientY - r.top);
    });
    stage.addEventListener('pointerdown', function (e) {
      stage.setPointerCapture(e.pointerId);
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pointers);
      if (ids.length === 1) { dragging = true; lastX = e.clientX; lastY = e.clientY; }
      if (ids.length === 2) { dragging = false; startDist = dist(); startScale = scale; }
    });
    stage.addEventListener('pointermove', function (e) {
      if (!pointers[e.pointerId]) return;
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pointers);
      if (ids.length === 2 && startDist) {
        var r = stage.getBoundingClientRect(), a = pointers[ids[0]], b = pointers[ids[1]];
        var target = startScale * dist() / startDist;
        zoomAt(target / scale, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
      } else if (dragging) {
        tx += e.clientX - lastX; ty += e.clientY - lastY; lastX = e.clientX; lastY = e.clientY; apply();
      }
    });
    function up(e) { delete pointers[e.pointerId]; if (Object.keys(pointers).length < 2) startDist = 0; if (!Object.keys(pointers).length) dragging = false; }
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
    v.addEventListener('click', function (e) { if (e.target === v) closeViewer(); });
    document.addEventListener('keydown', function (e) {
      if (v.hidden) return;
      if (e.key === 'Escape') closeViewer();
      if (e.key === '+' || e.key === '=') zoomAt(1.4, stage.clientWidth / 2, stage.clientHeight / 2);
      if (e.key === '-') zoomAt(1 / 1.4, stage.clientWidth / 2, stage.clientHeight / 2);
      if (e.key === '0') fit();
      if (e.key === 'Tab') { // keep focus inside the dialog
        var f = $$('button', v), i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    window.addEventListener('resize', function () { if (!v.hidden) fit(); });
  }
  function dist() { var ids = Object.keys(pointers), a = pointers[ids[0]], b = pointers[ids[1]]; return Math.hypot(a.x - b.x, a.y - b.y); }
  function apply() {
    var sw = stage.clientWidth, sh = stage.clientHeight, w = pic.naturalWidth * scale, h = pic.naturalHeight * scale;
    // keep the image on screen: centre when smaller, clamp edges when larger
    tx = w <= sw ? (sw - w) / 2 : Math.min(0, Math.max(sw - w, tx));
    ty = h <= sh ? (sh - h) / 2 : Math.min(0, Math.max(sh - h, ty));
    pic.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
  }
  function fit() {
    var sw = stage.clientWidth, sh = stage.clientHeight;
    minScale = Math.min(sw / pic.naturalWidth, sh / pic.naturalHeight, 2);
    scale = minScale; tx = 0; ty = 0; apply();
  }
  function zoomAt(f, cx, cy) {
    var ns = Math.max(minScale, Math.min(scale * f, Math.max(4, minScale * 6)));
    var k = ns / scale;
    tx = cx - (cx - tx) * k; ty = cy - (cy - ty) * k; scale = ns; apply();
  }
  function openViewer(meta, alt, cap, opener) {
    ensureViewer();
    lastFocus = opener;
    label.textContent = cap;
    pic.alt = alt;
    v.hidden = false;
    document.body.style.overflow = 'hidden';
    var go = function () { fit(); $('[data-z="close"]', v).focus(); };
    if (pic.getAttribute('src') === meta.src && pic.complete) go();
    else { pic.onload = go; pic.src = meta.src; }
  }
  function closeViewer() {
    v.hidden = true; document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
