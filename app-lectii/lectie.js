
(function () {
  var CANDIDATI = 'div, figure, table, section, aside, span.katex-display';
  var EXCEPTII = 'pre, [class*="codeBlock"], .katex';
  var PRAG = 4, MARGINE = 2;

  function stare(el, depasire) {
    if (depasire <= PRAG) return null;
    if (el.scrollLeft <= MARGINE) return 'start';
    if (el.scrollLeft >= depasire - MARGINE) return 'end';
    return 'mid';
  }
  function aplica(el, valoare) {
    if (valoare) { if (el.dataset.scrollX !== valoare) el.dataset.scrollX = valoare; }
    else if (el.dataset.scrollX) { delete el.dataset.scrollX; }
  }
  function marcheaza() {
    var zona = document.querySelector('main') || document.body;
    if (!zona) return;
    var masuratori = [];
    zona.querySelectorAll(CANDIDATI).forEach(function (el) {
      if (el.closest(EXCEPTII)) return;
      var depasire = el.scrollWidth - el.clientWidth;
      if (depasire <= PRAG) { masuratori.push([el, null]); return; }
      var overflow = getComputedStyle(el).overflowX;
      var scrollabil = overflow === 'auto' || overflow === 'scroll';
      masuratori.push([el, scrollabil ? stare(el, depasire) : null]);
    });
    masuratori.forEach(function (p) { aplica(p[0], p[1]); });
  }
  function laDerulare(ev) {
    var el = ev.target;
    if (!el || el.nodeType !== 1 || !el.dataset || !el.dataset.scrollX) return;
    aplica(el, stare(el, el.scrollWidth - el.clientWidth));
  }

  var cadru = null, rezerva = null;
  function executa() {
    if (cadru) cancelAnimationFrame(cadru);
    if (rezerva) clearTimeout(rezerva);
    cadru = null; rezerva = null;
    marcheaza();
  }
  function cere() {
    if (cadru || rezerva) return;
    cadru = requestAnimationFrame(executa);
    rezerva = setTimeout(executa, 300);
  }

  cere();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(cere).catch(function () {});
  window.addEventListener('resize', cere);
  window.addEventListener('orientationchange', cere);
  document.addEventListener('scroll', laDerulare, { capture: true, passive: true });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) cere(); });
})();
