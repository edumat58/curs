/**
 * Evaluare tipărită, făcută din automatismele unui capitol.
 *
 * Automatismele se lucrează pe ecran, cu corectură imediată — bun pentru
 * antrenament, inutil pentru o notă. Profesorul are nevoie de foaie: cu nume,
 * cu punctaj, cu loc de scris rezolvarea. Componenta asta ia aceleași
 * generatoare, trage la sorți câte întrebări s-au cerut și le așază în forma
 * lucrării de la clasă.
 *
 * Formatul îl copiază pe cel al testelor scrise deja de profesor (vezi
 * `docs/c5/modul-5/testm4-5.mdx`): antet cu nume, condițiile de lucru, grila de
 * notare pentru evaluator, subiecte marcate, exerciții cu punctaj. Nu inventăm
 * un format nou — un test care arată altfel decât celelalte se corectează mai
 * greu și arată a temă generată de calculator.
 *
 * Tipărirea folosește dialogul browserului, nu o bibliotecă de PDF. Din el se
 * salvează PDF pe orice sistem, se alege imprimanta și se vede exact ce iese pe
 * hârtie — iar noi nu ducem în pagină un megabyte de cod ca să redesenăm ce
 * știe deja să facă browserul.
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import katex from 'katex';

import { REGISTRY } from './generators';
import styles from './evaluare.module.css';

const CANTITATI = [5, 10, 15, 20, 25, 30];

/** Punctajul din oficiu, ca la lucrările din clasă. */
const OFICIU = 20;
const DE_LUCRU = 100 - OFICIU;

const NUME_CLASA = { 5: 'a V-a', 6: 'a VI-a', 7: 'a VII-a', 8: 'a VIII-a' };
const NUMERAL = ['I', 'al II-lea', 'al III-lea'];

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

/**
 * Împarte punctele pe întrebări, în așa fel încât suma să dea exact 80.
 *
 * Împărțirea simplă lasă rest: 80 la 30 de întrebări dă 2,66. Rotunjirea la
 * fiecare întrebare ar duce la un total care nu mai e 80, iar grila de notare
 * n-ar mai închide. Dăm deci partea întreagă tuturor și împărțim restul, câte
 * un punct, primelor întrebări.
 */
function impartePuncte(cate) {
  const baza = Math.floor(DE_LUCRU / cate);
  const rest = DE_LUCRU - baza * cate;
  return Array.from({ length: cate }, (_, i) => baza + (i < rest ? 1 : 0));
}

/** Întrebările se așază în trei subiecte, ca în lucrările de la clasă. */
function inSubiecte(intrebari) {
  const cate = intrebari.length;
  const grupe = cate <= 6 ? 2 : 3;
  const marime = Math.ceil(cate / grupe);
  const out = [];
  for (let i = 0; i < cate; i += marime) out.push(intrebari.slice(i, i + marime));
  return out;
}

export default function Evaluare({ capitol, clasa, automatisme }) {
  const [cate, setCate] = useState(10);
  const [cuBarem, setCuBarem] = useState(false);
  const [foaie, setFoaie] = useState(null);
  const zonaDeTiparit = useRef(null);

  const chei = useMemo(
    () => automatisme.filter((k) => REGISTRY[k]),
    [automatisme]
  );

  const pregateste = useCallback(() => {
    // Trecem prin toate automatismele capitolului înainte să repetăm unul:
    // altfel, la 30 de întrebări dintr-un capitol cu patru automatisme, sorții
    // ar putea da de cinci ori la rând aceeași procedură.
    const intrebari = [];
    let rezerva = [];
    while (intrebari.length < cate) {
      if (rezerva.length === 0) {
        rezerva = [...chei].sort(() => Math.random() - 0.5);
      }
      const cheie = rezerva.pop();
      intrebari.push({ cheie, titlu: REGISTRY[cheie].title, q: REGISTRY[cheie].fn() });
    }
    const puncte = impartePuncte(cate);
    setFoaie({ intrebari: intrebari.map((x, i) => ({ ...x, puncte: puncte[i] })), cuBarem });
  }, [cate, cuBarem, chei]);

  const tipareste = useCallback(() => {
    pregateste();
    // Așteptăm o pictare, ca foaia să existe în pagină când se deschide
    // dialogul; altfel s-ar tipări o coală goală.
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
  }, [pregateste]);

  if (chei.length === 0) return null;

  return (
    <>
      <section className={styles.panou} aria-label={`Evaluare tipărită — ${capitol}`}>
        <div className={styles.panouText}>
          <h3 className={styles.panouTitlu}>Evaluare tipărită</h3>
          <p className={styles.panouNota}>
            Trage la sorți întrebări din acest capitol și le așază în forma unei
            lucrări de clasă, gata de tipărit sau de salvat ca PDF.
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
          <span>Adaugă baremul la sfârșit</span>
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
            Lucrarea e pregătită, mai jos. Apasă din nou <strong>Tipărește</strong> ca
            s-o trimiți la imprimantă sau s-o salvezi ca PDF.
          </p>
        )}
      </section>

      {foaie && (
        <div className={styles.foaie} ref={zonaDeTiparit} data-evaluare-tiparita>
          <FoaieEvaluare capitol={capitol} clasa={clasa} {...foaie} />
        </div>
      )}
    </>
  );
}

/** Foaia propriu-zisă — ce ajunge pe hârtie. */
function FoaieEvaluare({ capitol, clasa, intrebari, cuBarem }) {
  const subiecte = inSubiecte(intrebari);
  let numar = 0;

  return (
    <article className={styles.coala}>
      <header className={styles.antet}>
        <h1 className={styles.titlu}>Evaluare — {capitol}</h1>
        <p className={styles.subtitlu}>Matematică · Clasa {NUME_CLASA[clasa]}</p>

        <div className={styles.identitate}>
          <span>Nume și prenume: <span className={styles.linieScris} /></span>
          <span>Data: <span className={styles.linieScurta} /></span>
        </div>

        <ul className={styles.conditii}>
          <li>Toate subiectele sunt obligatorii.</li>
          <li>Se acordă <strong>{OFICIU} de puncte</strong> din oficiu.</li>
          <li>Se scrie rezolvarea, nu doar rezultatul.</li>
        </ul>

        <table className={styles.grila}>
          <caption className={styles.grilaTitlu}>
            Grila de notare — se completează de profesorul evaluator
          </caption>
          <thead>
            <tr><th>Subiect</th><th>Punctaj total</th><th>Punctaj obținut</th></tr>
          </thead>
          <tbody>
            {subiecte.map((grup, i) => (
              <tr key={i}>
                <td>{NUMERAL[i]}</td>
                <td>{grup.reduce((s, x) => s + x.puncte, 0)}</td>
                <td />
              </tr>
            ))}
            <tr><td>Oficiu</td><td>{OFICIU}</td><td>{OFICIU}</td></tr>
            <tr className={styles.grilaTotal}><td>Total</td><td>100</td><td /></tr>
          </tbody>
        </table>
      </header>

      {subiecte.map((grup, i) => (
        <section key={i} className={styles.subiect}>
          <h2 className={styles.subiectTitlu}>
            Subiectul {NUMERAL[i]} — {grup.reduce((s, x) => s + x.puncte, 0)} puncte
          </h2>
          {grup.map((item) => {
            numar += 1;
            return <Exercitiu key={numar} numar={numar} {...item} />;
          })}
        </section>
      ))}

      {cuBarem && (
        <section className={styles.baremFoaie}>
          <h2 className={styles.subiectTitlu}>Barem de corectare</h2>
          <p className={styles.baremNota}>
            Această pagină este pentru profesor. Nu se distribuie elevilor.
          </p>
          <ol className={styles.baremLista}>
            {intrebari.map((item, i) => (
              <li key={i}>
                <span className={styles.baremRaspuns}>
                  {item.q.blanks.map((b) => `${b.label}: ${b.answer}`).join(' · ')}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </article>
  );
}

/** Un exercițiu: cerința, enunțul și spațiul de rezolvare. */
function Exercitiu({ numar, titlu, puncte, q }) {
  return (
    <div className={styles.exercitiu}>
      <h3 className={styles.exercitiuTitlu}>
        <span>Exercițiul {numar}</span>
        <span className={styles.puncte}>{puncte}p</span>
      </h3>

      <div className={styles.cerinta}>
        {q.prompt.text && (
          <p
            className={styles.enunt}
            dangerouslySetInnerHTML={{ __html: bogat(q.prompt.text) }}
          />
        )}
        {q.prompt.latex && (
          <p
            className={styles.enuntMath}
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(q.prompt.latex, { throwOnError: false, displayMode: true }),
            }}
          />
        )}
        {q.prompt.svg && (
          <div className={styles.figura} dangerouslySetInnerHTML={{ __html: q.prompt.svg }} />
        )}

        {/* Ce anume se cere — aceleași etichete ca pe ecran, ca elevul care s-a
            antrenat online să recunoască sarcina. */}
        <ul className={styles.cerute}>
          {q.blanks.map((b, i) => (
            <li key={i}>
              {b.label}: <span className={styles.linieRaspuns} />
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.spatiu} aria-hidden="true" />
    </div>
  );
}
