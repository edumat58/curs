/**
 * Reparații de crom la runtime:
 *
 * 1. KaTeX în cuprins — Docusaurus extrage textul titlurilor ÎNAINTE de
 *    rehype-katex, așa că formulele ajung în TOC ca text brut (cu sau fără
 *    backslash: „\\dfrac{2}{5}", „(-3)^{13}", „2:3:7"). În loc să ghicim
 *    delimitatorii pierduți, copiem în linkul de cuprins chiar HTML-ul
 *    titlului deja randat din pagină (ancora #... a linkului duce fix la el).
 *    Conținutul lecției nu e atins.
 * 2. Butonul-ochi din navbar (ascunde bara de navigație) — ținem atributul
 *    data-hidden sincron cu localStorage, ca iconița să reflecte starea.
 */

import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

function renderTocMath() {
  document.querySelectorAll('.table-of-contents__link').forEach((link) => {
    const href = link.getAttribute('href') || '';
    const hashIndex = href.indexOf('#');
    if (hashIndex === -1) return;
    let id = href.slice(hashIndex + 1);
    try {
      id = decodeURIComponent(id);
    } catch {
      // id-ul rămâne cum e
    }
    const heading = document.getElementById(id);
    if (!heading || !heading.querySelector('.katex')) return;

    const clone = heading.cloneNode(true);
    clone.querySelectorAll('a, button').forEach((el) => el.remove());
    const html = clone.innerHTML.trim();
    if (!html || link.dataset.mathHtml === html) return;
    link.innerHTML = html;
    link.dataset.mathHtml = html;
  });
}

function syncEyeButton() {
  const btn = document.getElementById('ui-toggle-btn');
  if (!btn) return;
  btn.dataset.hidden = String(localStorage.getItem('hideUI') === 'true');
}

if (ExecutionEnvironment.canUseDOM) {
  window.addEventListener('uiToggle', syncEyeButton);
  window.addEventListener('storage', syncEyeButton);

  // TOC-ul (desktop și „On this page" pe mobil) se montează după navigare —
  // observăm DOM-ul în loc să ghicim momentul; debounce pe frame ca să nu
  // rulăm la fiecare mutație măruntă.
  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      renderTocMath();
      syncEyeButton();
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

export function onRouteDidUpdate() {
  if (!ExecutionEnvironment.canUseDOM) return;
  renderTocMath();
  syncEyeButton();
}
