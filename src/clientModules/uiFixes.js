/**
 * Reparații de crom la runtime:
 *
 * 1. KaTeX în cuprins — Docusaurus extrage textul titlurilor ÎNAINTE de
 *    rehype-katex, așa că formulele ajung în TOC ca text brut (cu sau fără
 *    backslash: „\\dfrac{2}{5}", „(-3)^{13}", „2:3:7"). În loc să ghicim
 *    delimitatorii pierduți, copiem în linkul de cuprins chiar HTML-ul
 *    titlului deja randat din pagină (ancora #... a linkului duce fix la el).
 *    Conținutul lecției nu e atins.
 * 2. Modul proiecție (butonul-ochi) — starea trăiește într-un singur loc, aici:
 *    localStorage o ține între pagini, atributul `data-ui-ascuns` de pe <html>
 *    o dă mai departe CSS-ului, iar evenimentul `uiToggle` componentelor React
 *    (bara de lecție, dock-ul, Doamna Căpșunică, subsolul lecției).
 *    Butonul din navbar dispare odată cu bara pe care stă, așa că punem în
 *    pagină un al doilea buton, plutitor, care se arată doar în modul proiecție.
 *    Fără el ai intra în mod și n-ai mai avea cu ce ieși.
 */

import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

const CHEIE = 'hideUI';

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

/* ── modul proiecție ───────────────────────────────────────────────────── */

function esteAscuns() {
  try {
    return localStorage.getItem(CHEIE) === 'true';
  } catch {
    // Safari în navigare privată aruncă la citirea localStorage.
    return false;
  }
}

const OCHI_TAIAT = `
  <svg viewBox="0 0 24 24" width="19" height="19" xmlns="http://www.w3.org/2000/svg" fill="none"
       stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M10.73 5.08A10.4 10.4 0 0 1 12 5c4.78 0 8.58 3.1 9.94 6.65a1 1 0 0 1 0 .7 13.2 13.2 0 0 1-1.67 2.68"></path>
    <path d="M6.61 6.61A13.5 13.5 0 0 0 2.06 11.65a1 1 0 0 0 0 .7C3.42 15.9 7.22 19 12 19c1.34 0 2.6-.24 3.77-.66"></path>
    <path d="M10 10a3 3 0 0 0 4.13 4.13"></path>
    <line x1="3" y1="3" x2="21" y2="21"></line>
  </svg>
`;

/**
 * Butonul de ieșire. Stă direct în <body>, nu în navbar — navbarul e tocmai
 * ce ascundem. CSS-ul îl arată doar când `data-ui-ascuns` e pus pe <html>.
 */
function creeazaButonulPlutitor() {
  if (!document.body || document.getElementById('ui-toggle-float')) return;
  const btn = document.createElement('button');
  btn.id = 'ui-toggle-float';
  btn.className = 'ui-eye-float';
  btn.type = 'button';
  btn.title = 'Ieși din modul proiecție';
  btn.setAttribute('aria-label', 'Ieși din modul proiecție și arată barele');
  btn.innerHTML = OCHI_TAIAT;
  btn.addEventListener('click', comutaModProiectie);
  document.body.appendChild(btn);
}

function aplicaStarea() {
  const ascuns = esteAscuns();
  document.documentElement.toggleAttribute('data-ui-ascuns', ascuns);

  const btn = document.getElementById('ui-toggle-btn');
  if (btn) {
    btn.dataset.hidden = String(ascuns);
    btn.setAttribute('aria-pressed', String(ascuns));
  }
  creeazaButonulPlutitor();
}

function comutaModProiectie() {
  const nou = !esteAscuns();
  try {
    localStorage.setItem(CHEIE, String(nou));
  } catch {
    // Fără localStorage modul rămâne pe pagina curentă, atât.
  }
  window.dispatchEvent(new CustomEvent('uiToggle'));
  // Cu barele scoase, pagina poate rămâne derulată sub vechiul offset.
  if (nou) window.scrollTo({ top: 0 });
}

if (ExecutionEnvironment.canUseDOM) {
  // Butonul din navbar e HTML brut din docusaurus.config.js și cheamă asta
  // dacă există; altfel are un mic fallback propriu.
  window.toggleUIHiding = comutaModProiectie;

  window.addEventListener('uiToggle', aplicaStarea);
  window.addEventListener('storage', aplicaStarea);
  aplicaStarea();

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
      aplicaStarea();
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

export function onRouteDidUpdate() {
  if (!ExecutionEnvironment.canUseDOM) return;
  renderTocMath();
  aplicaStarea();
}
