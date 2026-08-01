/**
 * Test tipărit, făcut din automatismele unui capitol.
 *
 * Automatismele se lucrează pe ecran, cu corectură imediată — bun pentru
 * antrenament, inutil pentru o notă. Profesorul are nevoie de foaie. Componenta
 * ia aceleași generatoare, trage la sorți câte întrebări s-au cerut și le așază
 * în forma testelor din catalogul profesorului.
 *
 * Forma NU e inventată aici: e șablonul din `teste/template.mdx`, urmat bucată
 * cu bucată — antetul cu Nume/Prenume pe linii de completat, cele patru
 * condiții de lucru, caseta „Nu completați!" pentru evaluator, grila de notare
 * cu subiectele I/II/III (35+30+15 = 80, plus 20 din oficiu), calificativele pe
 * capitole cu N|S|B|E, legenda, subiectele cu bandă portocalie #e65100,
 * exercițiile cu subpuncte a), b), c) și formula de punctaj în titlu, banda
 * „SFÂRȘIT TEST" la coadă. Un test care arată altfel decât celelalte ale
 * profesorului se corectează mai greu și miroase a generat.
 *
 * Tipărirea folosește dialogul browserului: de acolo se salvează PDF pe orice
 * sistem și se vede exact ce iese pe hârtie. Caseta pentru evaluator promite că
 * „testul începe de pe pagina următoare" — la tipărire, promisiunea se ține
 * printr-o rupere de pagină înainte de Subiectul I.
 */
import React, { useCallback, useMemo, useState } from 'react';
import katex from 'katex';
import Admonition from '@theme/Admonition';

import { REGISTRY } from './generators';
import styles from './evaluare.module.css';

const CANTITATI = [5, 10, 15, 20, 25, 30];

/** Punctajul din oficiu și împărțirea pe subiecte, ca în șablonul testelor. */
const OFICIU = 20;
const TOTALURI = { 1: [80], 2: [45, 35], 3: [35, 30, 15] };

const NUME_CLASA = { 5: 'a V-a', 6: 'a VI-a', 7: 'a VII-a', 8: 'a VIII-a' };
const NUMERAL = ['I', 'al II-lea', 'al III-lea'];
const LITERE = 'abcdefghij';

/* Banda subiectului, copiată din `teste/template.mdx`: aceleași valori, ca
   testul generat să nu se deosebească de cele scrise de mână. */
const BANDA = {
  backgroundColor: '#e65100',
  color: 'white',
  padding: '4px 8px',
  borderRadius: '4px',
};

/** Timpul de lucru crește cu testul, în trepte de manual. */
const MINUTE = { 5: 20, 10: 30, 15: 40, 20: 45, 25: 50, 30: 50 };

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Text cu matematică între `$...$`, randat cu KaTeX. */
function bogat(text) {
  return String(text)
    .split(/\$([^$]+)\$/g)
    .map((p, i) => (i % 2 === 1
      ? katex.renderToString(p, { throwOnError: false })
      : escapeHtml(p)))
    .join('');
}

/** `total` puncte pe `cate` întrebări, cu suma exactă — restul, câte unu, primelor. */
function impartePuncte(total, cate) {
  const baza = Math.floor(total / cate);
  const rest = total - baza * cate;
  return Array.from({ length: cate }, (_, i) => baza + (i < rest ? 1 : 0));
}

/**
 * Construiește foaia: întrebările, grupate pe exerciții și subiecte.
 *
 * Un exercițiu = un automatism, cu întrebările lui ca subpuncte a), b), c) —
 * așa arată și testele scrise de mână („Să se calculeze: a) … b) …"), nu ca
 * treizeci de exerciții separate de câte un rând.
 */
function construiesteFoaie(cate, chei) {
  // Câte întrebări primește fiecare automatism: se împart pe rând, ca niciunul
  // să nu domine testul.
  const ordinea = [...chei].sort(() => Math.random() - 0.5);
  const cateDe = new Map(ordinea.map((k) => [k, 0]));
  for (let i = 0; i < cate; i += 1) {
    const k = ordinea[i % ordinea.length];
    cateDe.set(k, cateDe.get(k) + 1);
  }

  const exercitii = ordinea
    .filter((k) => cateDe.get(k) > 0)
    .map((k) => ({
      cheie: k,
      titlu: REGISTRY[k].title,
      items: Array.from({ length: cateDe.get(k) }, () => REGISTRY[k].fn()),
    }));

  // Subiectele I/II/III taie ÎNTRE exerciții, cu numărul de întrebări cât mai
  // aproape de proporția punctajelor (35/30/15).
  const nSubiecte = Math.min(exercitii.length, 3);
  const totaluri = TOTALURI[nSubiecte];
  const subiecte = Array.from({ length: nSubiecte }, () => []);
  let indice = 0;
  let acoperit = 0;
  const totalIntrebari = exercitii.reduce((s, e) => s + e.items.length, 0);
  for (const ex of exercitii) {
    const tintaCumulata = totaluri.slice(0, indice + 1).reduce((s, x) => s + x, 0) / 80;
    if (indice < nSubiecte - 1 && acoperit / totalIntrebari >= tintaCumulata) indice += 1;
    subiecte[indice].push(ex);
    acoperit += ex.items.length;
  }
  // Un subiect nu rămâne gol: dacă tăierea a lăsat unul fără exerciții, se ia
  // ultimul exercițiu al subiectului precedent.
  for (let s = 1; s < nSubiecte; s += 1) {
    if (subiecte[s].length === 0 && subiecte[s - 1].length > 1) {
      subiecte[s].push(subiecte[s - 1].pop());
    }
  }

  // Punctele: fiecare subiect își împarte totalul pe întrebările lui.
  const cuPuncte = subiecte.map((exs, s) => {
    const items = exs.reduce((sum, e) => sum + e.items.length, 0);
    const puncte = impartePuncte(totaluri[s], items);
    let i = 0;
    return {
      total: totaluri[s],
      exercitii: exs.map((e) => ({
        ...e,
        puncte: e.items.map(() => puncte[i++]),
      })),
    };
  });

  return cuPuncte;
}

export default function Evaluare({ capitol, clasa, automatisme }) {
  const [cate, setCate] = useState(10);
  const [cuBarem, setCuBarem] = useState(false);
  const [foaie, setFoaie] = useState(null);

  const chei = useMemo(() => automatisme.filter((k) => REGISTRY[k]), [automatisme]);

  const pregateste = useCallback(() => {
    setFoaie({ subiecte: construiesteFoaie(cate, chei), cuBarem, cate });
  }, [cate, cuBarem, chei]);

  const tipareste = useCallback(() => {
    pregateste();
    // Foaia trebuie să existe în pagină când se deschide dialogul; altfel s-ar
    // tipări o coală goală.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const foaie = document.querySelector('[data-evaluare-tiparita]');
      if (!foaie) { window.print(); return; }

      /*
       * Ascundem restul paginii cu `display: none`, nu cu `visibility`.
       *
       * `visibility: hidden` păstrează spațiul: cele opt casete de automatisme
       * rămâneau în pagină, invizibile dar late cât o coală, iar testul ieșea
       * pe patru file cu mari zone albe și cu antetul rupt între pagini.
       * `display: none` le scoate din așezare, deci hârtia conține doar testul.
       *
       * Marcăm frații de pe drumul spre `body`, nu „tot": un selector care
       * ascunde totul ar ascunde și strămoșii foii, adică foaia însăși.
       */
      // Marcajele rămase de la o tipărire anterioară (dacă `afterprint` n-a
      // venit) se șterg acum: altfel s-ar aduna pe elemente care între timp
      // nu mai sunt pe drumul spre foaie.
      document.querySelectorAll('[data-ascuns-la-tipar]').forEach((el) => el.removeAttribute('data-ascuns-la-tipar'));
      document.querySelectorAll('[data-lant-tipar]').forEach((el) => el.removeAttribute('data-lant-tipar'));

      const ascunse = [];
      const lant = [];
      for (let el = foaie; el && el !== document.body; el = el.parentElement) {
        for (const frate of el.parentElement.children) {
          if (frate !== el) {
            frate.setAttribute('data-ascuns-la-tipar', '');
            ascunse.push(frate);
          }
        }
        /*
         * Strămoșii foii îi marcăm ca să le putem desface, la tipar, lățimile
         * lor de ecran. Coloana de lecție, `.container`, `main` — fiecare are
         * un `max-width` gândit pentru monitor; foaia trebuie să poată lua
         * lățimea colii, nu pe a lor. Vezi `data-lant-tipar` în CSS.
         */
        if (el !== foaie) {
          el.setAttribute('data-lant-tipar', '');
          lant.push(el);
        }
      }

      // Numele documentului ajunge în PDF-ul salvat. Fără asta, fișierul se
      // cheamă după pagina din care s-a tipărit („AV.1 — Numere naturale"),
      // ceea ce nu spune că e un test.
      const titluVechi = document.title;
      document.title = `Automatisme ${NUME_CLASA[clasa]} — ${capitol}`;

      /*
       * Curățarea NU merge pe temporizator.
       *
       * Pe iOS așezarea pentru tipar e leneșă și se repetă: UIKit cere întâi
       * numărul de pagini, iar coala propriu-zisă abia la `drawInRect:`. În
       * plus, WebKit invalidează starea de tipar când aplicația trece în
       * fundal — adică exact când utilizatorul intră în foaia de partajare.
       * Reașezarea se face cu DOM-ul DE ATUNCI, așa că orice răgaz ales prost
       * scoate marcajele înainte să fie folosite, iar coala iese din pagina
       * nemarcată. Nu există răgaz corect: depinde cât zăbovește omul în
       * previzualizare.
       *
       * Așa că marcajele rămân până la `afterprint`, iar dacă acela nu vine,
       * până la următoarea tipărire, care începe prin a șterge ce-a rămas.
       * Pe ecran sunt inerte: regulile lor stau doar în `@media print`.
       */
      const curata = () => {
        ascunse.forEach((el) => el.removeAttribute('data-ascuns-la-tipar'));
        lant.forEach((el) => el.removeAttribute('data-lant-tipar'));
        document.title = titluVechi;
        window.removeEventListener('afterprint', curata);
      };
      window.addEventListener('afterprint', curata);

      window.print();
    }));
  }, [pregateste, capitol, clasa]);

  if (chei.length === 0) return null;

  return (
    <>
      <section className={styles.panou} aria-label={`Test tipărit — ${capitol}`}>
        <div className={styles.panouText}>
          <h3 className={styles.panouTitlu}>Test tipărit</h3>
          <p className={styles.panouNota}>
            Trage la sorți întrebări din acest capitol și le așază în forma
            testelor de clasă, gata de tipărit sau de salvat ca PDF.
          </p>
        </div>

        <fieldset className={styles.grup}>
          <legend className={styles.eticheta}>Câte întrebări</legend>
          <div className={styles.optiuni}>
            {CANTITATI.map((n) => (
              <button
                type="button"
                key={n}
                className={n === cate ? styles.optiuneAleasa : styles.optiune}
                aria-pressed={n === cate}
                onClick={() => setCate(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </fieldset>

        <label className={styles.barem}>
          <input
            type="checkbox"
            checked={cuBarem}
            onChange={(e) => setCuBarem(e.target.checked)}
          />
          <span>Adaugă baremul la sfârșit, pe pagină separată</span>
        </label>

        <div className={styles.actiuni}>
          <button type="button" className={styles.tipar} onClick={tipareste}>
            Tipărește
          </button>
          <button type="button" className={styles.previzualizare} onClick={pregateste}>
            Vezi întâi pe ecran
          </button>
        </div>

        {foaie && (
          <p className={styles.confirmare}>
            Testul e pregătit, mai jos. Apasă din nou <strong>Tipărește</strong> ca
            să-l trimiți la imprimantă sau să-l salvezi ca PDF.
          </p>
        )}
      </section>

      {foaie && (
        <div className={styles.foaie} data-evaluare-tiparita>
          <FoaieTest capitol={capitol} clasa={clasa} {...foaie} />
        </div>
      )}
    </>
  );
}

/** Foaia propriu-zisă — urmează `teste/template.mdx`, bucată cu bucată. */
function FoaieTest({ capitol, clasa, subiecte, cuBarem, cate }) {
  const toateExercitiile = subiecte.flatMap((s) => s.exercitii);

  return (
    <article className={styles.coala}>
      {/* ── antetul: o singură unitate, ca legenda să nu treacă pe pagina a doua ── */}
      <header className={styles.antet}>
      <h1 className={styles.titlu}>Automatisme: {capitol}</h1>

      <p className={styles.subtitlu}>Matematică · Clasa {NUME_CLASA[clasa]}</p>

      <p className={styles.identitate}>
        <strong>Nume:</strong><br />
        <span className={styles.linieScris} /><br />
        <strong>Prenume:</strong><br />
        <span className={styles.linieScris} />
      </p>

      <ul className={styles.conditii}>
        <li>Toate subiectele sunt obligatorii</li>
        <li>Timpul efectiv de lucru este de <strong>{MINUTE[cate] || 50} de minute</strong></li>
        <li>Utilizarea instrumentelor de geometrie este <strong>permisă și recomandată</strong></li>
        <li>Se acordă <strong>{OFICIU} puncte</strong> din oficiu</li>
      </ul>

      <Admonition type="warning" title="Nu completați!">
        <p>Rubrica aceasta se completează <strong>doar de profesorul evaluator</strong>!</p>
        <p><strong>Testul începe de pe pagina următoare.</strong></p>
      </Admonition>

      {/* Învelișul e bloc, nu flex: `break-inside: avoid` se cere pe EL, fiindcă
          WebKit nu are reguli scrise pentru fragmentarea containerelor flex
          (bug 70795), iar pe un flex regula e ignorată tăcut. */}
      <div className={styles.blocColoane}>
      <div className={styles.coloane}>
        <div className={styles.coloanaGrila}>
          <h2 className={styles.subtitluAntet}>Grila de notare</h2>
          <table className={styles.grila}>
            <thead>
              <tr><th>Subiect</th><th>Punctaj total</th><th>Punctaj obținut</th></tr>
            </thead>
            <tbody>
              {subiecte.map((s, i) => (
                <tr key={i}><td>{['I', 'II', 'III'][i]}</td><td>{s.total}</td><td /></tr>
              ))}
              <tr><td>Total</td><td>{subiecte.reduce((x, s) => x + s.total, 0)}</td><td /></tr>
              <tr><td>Oficiu</td><td>{OFICIU}</td><td>{OFICIU}</td></tr>
            </tbody>
          </table>
        </div>

        <div className={styles.coloanaCalificative}>
          <h2 className={styles.subtitluAntet}>Calificativ capitole incluse</h2>
          {toateExercitiile.map((e) => (
            <p className={styles.calificativ} key={e.cheie}>
              <em className={styles.calificativNume}>{e.titlu}</em>
              <span className={styles.calificativCasete}>
                {['N', 'S', 'B', 'E'].map((litera) => (
                  <span key={litera} className={styles.bifa}>
                    <input type="checkbox" readOnly value={litera} /> {litera}
                  </span>
                ))}
              </span>
            </p>
          ))}
        </div>
      </div>
      </div>

      <blockquote className={styles.legenda}>
        <p>Legendă:</p>
        <p><strong>N - Nesatisfăcător | S - Satisfăcător | B - Bine | E - Excelent</strong></p>
      </blockquote>
      </header>

      {/* ── subiectele — de pe pagina următoare, cum promite caseta; ruperea
             o cere antetul, prin `break-after`, nu subiectul ── */}
      {subiecte.map((subiect, s) => {
        let numarExercitiu = 0;
        return (
          <section key={s}>
            <h2 className={styles.titluSubiect}>
              <span style={BANDA}>Subiectul {NUMERAL[s]} - {subiect.total} puncte</span>
            </h2>
            {subiect.exercitii.map((ex) => {
              numarExercitiu += 1;
              return (
                <Exercitiu
                  key={ex.cheie}
                  numar={numarExercitiu}
                  exercitiu={ex}
                />
              );
            })}
          </section>
        );
      })}

      <h2 className={styles.titluSubiect}><span style={BANDA}>SFÂRȘIT TEST</span></h2>

      {cuBarem && (
        <section className={styles.baremFoaie}>
          <h2 className={styles.titluSubiect}><span style={BANDA}>Barem de corectare</span></h2>
          <p className={styles.baremNota}>
            Pagina aceasta este pentru profesor. Nu se distribuie elevilor.
          </p>
          {subiecte.map((subiect, s) => (
            <div key={s}>
              <p className={styles.baremSubiect}>Subiectul {NUMERAL[s]}</p>
              <ol className={styles.baremLista}>
                {subiect.exercitii.map((ex) => (
                  <li key={ex.cheie}>
                    {ex.items.map((q, i) => (
                      <span key={i} className={styles.baremRaspuns}>
                        {LITERE[i]}) {q.blanks.map((b) => `${b.label}: ${b.answer}`).join('; ')}
                        {i < ex.items.length - 1 ? ' · ' : ''}
                      </span>
                    ))}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </section>
      )}
    </article>
  );
}

/**
 * Titlul exercițiului poartă formula de punctaj, ca în testele scrise de mână:
 * „(3x5p = 15p)" când subpunctele valorează la fel, „(16p)" când nu.
 */
function formulaPunctaj(puncte) {
  const total = puncte.reduce((s, p) => s + p, 0);
  const uniform = puncte.every((p) => p === puncte[0]);
  if (uniform && puncte.length > 1) return `(${puncte.length}x${puncte[0]}p = ${total}p)`;
  return `(${total}p)`;
}

/** Un exercițiu: cerința în casetă, subpunctele a), b), c) și loc de rezolvare. */
function Exercitiu({ numar, exercitiu }) {
  const { items, puncte } = exercitiu;

  // Cerința comună: dacă toate subpunctele sunt calcule pure (doar formulă),
  // enunțul devine „Să se calculeze:", ca în testele profesorului.
  const doarCalcule = items.every((q) => q.prompt.latex && !q.prompt.text && !q.prompt.svg);

  return (
    <div className={styles.exercitiu}>
      <h3 className={styles.exercitiuTitlu}>
        Exercițiul {numar} <strong>{formulaPunctaj(puncte)}</strong>
      </h3>

      <Admonition type="note">
        {doarCalcule && <p className={styles.enunt}>Să se calculeze:</p>}
        <ol className={styles.subpuncte} type="a">
          {items.map((q, i) => (
            <li key={i} className={styles.subpunct}>
              {q.prompt.text && (
                <span dangerouslySetInnerHTML={{ __html: bogat(q.prompt.text) }} />
              )}
              {q.prompt.latex && (
                <span
                  className={styles.formula}
                  dangerouslySetInnerHTML={{
                    __html: katex.renderToString(q.prompt.latex, { throwOnError: false }),
                  }}
                />
              )}
              {q.prompt.svg && (
                <span
                  className={styles.figura}
                  dangerouslySetInnerHTML={{ __html: q.prompt.svg }}
                />
              )}
              <CerintaSuplimentara blanks={q.blanks} />
            </li>
          ))}
        </ol>
      </Admonition>

      <div className={styles.spatiu} aria-hidden="true" />
    </div>
  );
}

/**
 * Ce se cere, când nu reiese din enunț: la alegeri se încercuiește, la
 * răspunsuri multiple se numesc. „Rezultatul" singur nu se mai spune — la un
 * calcul scris pe foaie, ce se cere e evident.
 */
function CerintaSuplimentara({ blanks }) {
  const alegeri = blanks.filter((b) => b.kind === 'choice');
  const numite = blanks.filter((b) => b.kind !== 'choice' && b.label !== 'Rezultatul');

  if (alegeri.length === 0 && numite.length <= 1) return null;

  return (
    <span className={styles.seCere}>
      {alegeri.map((b, i) => (
        <span key={`c${i}`}>
          {' '}Încercuiește răspunsul corect: <strong>{b.options.join(' / ')}</strong>.
        </span>
      ))}
      {numite.length > 1 && (
        <span>
          {' '}Se cer: {numite.map((b) => b.label.toLowerCase()).join(' și ')}.
        </span>
      )}
    </span>
  );
}
