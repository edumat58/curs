import { useEffect } from 'react';
import { useLocation } from '@docusaurus/router';

/**
 * Spune care elemente se pot trage pe orizontală ȘI încotro, prin
 * `data-scroll-x="start" | "mid" | "end"`. Desenul îl face `custom.css`
 * (secțiunea 7): stinge conținutul spre marginea unde mai urmează ceva.
 *
 * Starea trebuie calculată aici, nu în CSS: „mai e ceva la dreapta" depinde de
 * `scrollLeft`, iar CSS-ul nu are acces la el. Fără atribut nu se aplică nimic,
 * deci un tabel care încape arată exact ca înainte.
 *
 * Prinde tot ce are scroll propriu în pagină — formule KaTeX, tabele, figuri
 * geometrice, grafice, cadrele componentelor de lecție — inclusiv componente
 * care nu există încă. Sar peste blocurile de cod: acolo bara de scroll e deja
 * vizibilă și codul nu suportă să fie estompat la capăt.
 */

const CANDIDATI = 'div, figure, table, section, aside, span.katex-display';
const EXCEPTII = 'pre, [class*="codeBlock"], .katex';
const PRAG = 4; // px; sub atâta e rotunjire de subpixel, nu conținut ascuns
const MARGINE = 2; // px de toleranță la capete, pentru scroll fracționar

/** `null` = nu se poate trage; altfel unde mai e conținut ascuns. */
function stare(el, depasire) {
  if (depasire <= PRAG) return null;
  if (el.scrollLeft <= MARGINE) return 'start';
  if (el.scrollLeft >= depasire - MARGINE) return 'end';
  return 'mid';
}

function aplica(el, valoare) {
  if (valoare) {
    if (el.dataset.scrollX !== valoare) el.dataset.scrollX = valoare;
  } else if (el.dataset.scrollX) {
    delete el.dataset.scrollX;
  }
}

function marcheaza() {
  const zona = document.querySelector('main') || document.body;
  if (!zona) return;

  /* Întâi TOATE măsurătorile, abia apoi scrierile. Invers, fiecare `dataset`
     scris între două citiri de `scrollWidth` ar forța browserul să recalculeze
     layoutul de la zero — pe o lecție cu zeci de formule se simte. */
  const masuratori = [];
  zona.querySelectorAll(CANDIDATI).forEach((el) => {
    if (el.closest(EXCEPTII)) return;
    const depasire = el.scrollWidth - el.clientWidth;
    if (depasire <= PRAG) {
      masuratori.push([el, null]);
      return;
    }
    const overflow = getComputedStyle(el).overflowX;
    const scrollabil = overflow === 'auto' || overflow === 'scroll';
    masuratori.push([el, scrollabil ? stare(el, depasire) : null]);
  });

  masuratori.forEach(([el, valoare]) => aplica(el, valoare));
}

/** La tras, se schimbă doar elementul tras — nu se remăsoară toată pagina. */
function laDerulare(ev) {
  const el = ev.target;
  if (!el || el.nodeType !== 1 || !el.dataset || !el.dataset.scrollX) return;
  aplica(el, stare(el, el.scrollWidth - el.clientWidth));
}

export default function ScrollOrizontal() {
  const { pathname } = useLocation();

  useEffect(() => {
    let cadru = null;
    let rezerva = null;

    const executa = () => {
      if (cadru) cancelAnimationFrame(cadru);
      if (rezerva) clearTimeout(rezerva);
      cadru = null;
      rezerva = null;
      marcheaza();
    };

    const cere = () => {
      if (cadru || rezerva) return; // deja programat, o singură măsurare ajunge
      cadru = requestAnimationFrame(executa);
      /* `requestAnimationFrame` e suspendat în tabul ascuns și la prerandare, deci
         singur ar lăsa pagina să ajungă vizibilă fără niciun marcaj. Temporizatorul
         rulează și acolo; dacă lățimile ies încă 0, elementele pur și simplu nu se
         marchează, iar `visibilitychange` reia măsurarea cu valorile adevărate. */
      rezerva = setTimeout(executa, 300);
    };

    const laVizibilitate = () => {
      if (!document.hidden) cere();
    };

    /* Prima trecere după ce s-au așezat fonturile: KaTeX își schimbă lățimile
       când sosește fontul matematic, iar o formulă măsurată înainte pare că
       încape. */
    cere();
    if (document.fonts?.ready) document.fonts.ready.then(cere).catch(() => {});

    window.addEventListener('resize', cere);
    window.addEventListener('orientationchange', cere);
    /* `scroll` nu urcă spre document, dar se poate prinde în faza de captare —
       așa e nevoie de un singur ascultător pentru toate elementele, oricâte apar. */
    document.addEventListener('scroll', laDerulare, { capture: true, passive: true });
    document.addEventListener('visibilitychange', laVizibilitate);

    /* Două observatoare, pentru două feluri de schimbare:
       - conținut nou în lecție (o figură randată după montare) → childList pe main;
       - preferințele EduPAȘI (mărimea textului, spațierea, fontul) → ele schimbă
         doar atribute pe <html>, dar rescriu tot layoutul lecției. Fără al doilea
         observator, elevul care mărește textul ajunge cu formule tăiate și fără
         niciun semn că se pot trage — exact cazul pentru care există indiciul. */
    const observatorContinut = new MutationObserver(cere);
    const zona = document.querySelector('main');
    if (zona) observatorContinut.observe(zona, { childList: true, subtree: true });

    const observatorPreferinte = new MutationObserver(cere);
    observatorPreferinte.observe(document.documentElement, { attributes: true });

    return () => {
      if (cadru) cancelAnimationFrame(cadru);
      if (rezerva) clearTimeout(rezerva);
      window.removeEventListener('resize', cere);
      window.removeEventListener('orientationchange', cere);
      document.removeEventListener('scroll', laDerulare, { capture: true });
      document.removeEventListener('visibilitychange', laVizibilitate);
      observatorContinut.disconnect();
      observatorPreferinte.disconnect();
    };
  }, [pathname]);

  return null;
}
