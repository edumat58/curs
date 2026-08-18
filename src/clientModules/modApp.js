/**
 * MODUL APLICAȚIE — cursul, când e deschis în aplicația Kulturosfera.
 *
 * Aplicația (`~/GitHub/kulto`) încarcă paginile reale ale produselor într-un
 * WebView, cu bara ei de tab-uri nativă dedesubt și cu semnătura Kulturosfera
 * deasupra. Cursul primește două semne că e acolo:
 *
 *   - atributul `data-app="kulturosfera"` scris pe <html> înainte de încărcarea
 *     documentului (`injectedJavaScriptBeforeContentLoaded`);
 *   - parametrul `?app=kulturosfera` pe adresa de pornire a tabului.
 *
 * Al doilea există fiindcă primul a fost prins ratând pe un tab: injecția e o
 * cursă cu începerea încărcării. Modulul de aici citește ce găsește, pune
 * atributul (dacă lipsește) și scrie un cookie de sesiune, ca semnul să țină și
 * peste o reîncărcare întreagă, când parametrul s-a pierdut.
 *
 * CE ASCUNDE CSS-UL (vezi `src/css/custom.css`, secțiunea „modul aplicație"):
 * subsolul cursului. Autorul: „as vrea ca in aplicatie sa nu se mai afiseze:
 * […] in edumat footerul cu cursuri platforma etc." Într-o pagină web subsolul
 * e harta site-ului; într-o aplicație cu bară de tab-uri e o a doua hartă,
 * lipită exact peste prima.
 *
 * CE NU ASCUNDE: bara de sus a cursului. Aceea nu e o a doua navigare a
 * aplicației — e cuprinsul cursului, meniul care deschide modulele și căutarea.
 * Fără ea, cursul n-ar avea cum să fie parcurs.
 */

import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

const SEMN = 'kulturosfera';

function esteInAplicatie() {
  if (document.documentElement.getAttribute('data-app') === SEMN) return true;
  try {
    const p = new URLSearchParams(window.location.search).get('app');
    if (p === SEMN) return true;
  } catch {
    /* adresă strâmbă: nu e un motiv de eroare */
  }
  return document.cookie.split('; ').some((c) => c === `app=${SEMN}`);
}

function aplica() {
  if (!ExecutionEnvironment.canUseDOM) return;
  if (!esteInAplicatie()) return;
  document.documentElement.setAttribute('data-app', SEMN);
  try {
    document.cookie = `app=${SEMN}; path=/; SameSite=Lax`;
  } catch {
    /* cookie-uri oprite: atributul e deja pus, atât e nevoie în sesiunea asta */
  }
}

if (ExecutionEnvironment.canUseDOM) aplica();

export function onRouteDidUpdate() {
  aplica();
}
