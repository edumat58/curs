/**
 * Reparații de crom la runtime:
 *
 * 1. KaTeX în cuprins — Docusaurus extrage textul titlurilor ÎNAINTE de
 *    rehype-katex, așa că formulele ajung în TOC ca sursă brută
 *    („\dfrac{2}{5}"). Randăm aici fragmentele LaTeX din linkurile de
 *    cuprins, fără să atingem conținutul lecției.
 * 2. Butonul-ochi din navbar (ascunde bara de navigație) — ținem atributul
 *    data-hidden sincron cu localStorage, ca iconița să reflecte starea.
 */

import katex from 'katex';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

const LATEX_FRAGMENT = /\\[a-zA-Z]+(?:\s*\{[^{}]*\})*/g;

function renderTocMath() {
  document.querySelectorAll('.table-of-contents__link').forEach((link) => {
    if (link.dataset.mathRendered === 'true') return;
    if (!link.textContent.includes('\\')) return;

    const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) {
      if (walker.currentNode.nodeValue.includes('\\')) {
        textNodes.push(walker.currentNode);
      }
    }

    textNodes.forEach((node) => {
      const text = node.nodeValue;
      LATEX_FRAGMENT.lastIndex = 0;
      if (!LATEX_FRAGMENT.test(text)) return;
      LATEX_FRAGMENT.lastIndex = 0;

      const frag = document.createDocumentFragment();
      let last = 0;
      let m;
      while ((m = LATEX_FRAGMENT.exec(text)) !== null) {
        if (m.index > last) {
          frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        }
        const span = document.createElement('span');
        try {
          katex.render(m[0], span, { throwOnError: true });
          frag.appendChild(span);
        } catch (e) {
          frag.appendChild(document.createTextNode(m[0]));
        }
        last = m.index + m[0].length;
      }
      if (last < text.length) {
        frag.appendChild(document.createTextNode(text.slice(last)));
      }
      node.parentNode.replaceChild(frag, node);
    });

    link.dataset.mathRendered = 'true';
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
