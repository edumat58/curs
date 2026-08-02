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
 * condiții de lucru, caseta de atenționare, subiectele cu bandă
 * portocalie #e65100, exercițiile scrise „### Exercițiul N **(3p)**" cu cerința
 * într-o casetă `:::note`, banda „SFÂRȘIT TEST" la coadă. Un test care arată
 * altfel decât celelalte ale profesorului se corectează mai greu și miroase a
 * generat. Butonul „Copiază codul MDX" dă exact acest fișier, ca profesorul
 * să-l poată schimba de mână.
 *
 * Câte subiecte are testul o spune capitolul, nu un tipar fix: fiecare
 * automatism atins devine un subiect, în ordinea capitolului. Divizibilitatea
 * atinge patru automatisme, deci testul ei are patru subiecte. Numerotarea
 * exercițiilor repornește la fiecare subiect, iar răspunsurile se scriu toate
 * în rubrica de pe prima filă, în celule numite „I.1", „III.2" — o rețea cu
 * geometrie fixă, peste care se potrivește folia perforată de corectură.
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

/** Punctajul din oficiu; restul de 80 se împarte pe subiecte. */
const OFICIU = 20;

const NUME_CLASA = { 5: 'a V-a', 6: 'a VI-a', 7: 'a VII-a', 8: 'a VIII-a' };
/* Un capitol are până la opt automatisme, deci testul are până la opt subiecte. */
const NUMERAL = ['I', 'al II-lea', 'al III-lea', 'al IV-lea', 'al V-lea', 'al VI-lea', 'al VII-lea', 'al VIII-lea'];
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

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

/** Amprenta unei întrebări: enunțul ei, ca să nu se repete în același subiect. */
function amprenta(q) {
  return `${q.prompt.text || ''}|${q.prompt.latex || ''}|${q.prompt.svg || ''}`;
}

/** `total` puncte pe `cate` întrebări, cu suma exactă — restul, câte unu, primelor. */
function impartePuncte(total, cate) {
  const baza = Math.floor(total / cate);
  const rest = total - baza * cate;
  return Array.from({ length: cate }, (_, i) => baza + (i < rest ? 1 : 0));
}

/**
 * Construiește foaia: un subiect pentru fiecare automatism al capitolului.
 *
 * Subiectele nu mai sunt trei, cu punctaje fixe și tăieturi arbitrare între
 * exerciții. Un capitol de divizibilitate atinge patru automatisme, deci
 * testul are patru subiecte; unul de mulțimea numerelor reale atinge opt, deci
 * are opt. Așa rândurile din grila de notare, subiectele de pe foaie și
 * rândurile de calificativ se citesc pe aceeași linie, iar profesorul
 * corectează fără să caute ce automatism a fost unde.
 *
 * Într-un subiect intră întrebările automatismului lui, fiecare ca exercițiu
 * de sine stătător, cu cerința lui. Sub exercițiu nu stă nimic: se lucrează pe
 * ciornă, iar răspunsul final se scrie în rubrica de pe prima filă.
 */
function construiesteFoaie(cate, chei) {
  // Câte întrebări primește fiecare automatism: se împart pe rând, ca niciunul
  // să nu domine testul. Tragerea la sorți contează doar când s-au cerut mai
  // puține întrebări decât automatisme — atunci decide care rămân pe dinafară.
  const ordineaImpartirii = [...chei].sort(() => Math.random() - 0.5);
  const cateDe = new Map(chei.map((k) => [k, 0]));
  for (let i = 0; i < cate; i += 1) {
    const k = ordineaImpartirii[i % ordineaImpartirii.length];
    cateDe.set(k, cateDe.get(k) + 1);
  }

  // Ordinea de pe foaie e a capitolului, nu a împărțirii: subiectele urmează
  // firul lecțiilor, iar un automatism fără întrebări nu produce subiect.
  const alese = chei.filter((k) => cateDe.get(k) > 0);

  /* Punctele: cele 80 se împart pe TOATE întrebările testului, deci fiecare
     valorează la fel indiferent în ce subiect a nimerit. Totalul unui subiect
     iese din câte întrebări are — nu mai e o cifră fixă aleasă dinainte. */
  const totalIntrebari = alese.reduce((s, k) => s + cateDe.get(k), 0);
  const puncte = impartePuncte(80, totalIntrebari);
  let i = 0;

  return alese.map((k) => {
    /* Generatoarele trag la sorți, deci pot nimeri de două ori același număr:
       „Exercițiul 1: √225" urmat de „Exercițiul 2: √225" pe aceeași filă. Cerem
       întrebări până iese una nouă, cu un plafon de încercări — la un automatism
       cu puține variante posibile, insistența ar învârti la nesfârșit. */
    const vazute = new Set();
    const intrebari = Array.from({ length: cateDe.get(k) }, () => {
      let q = REGISTRY[k].fn();
      for (let incercari = 0; incercari < 30 && vazute.has(amprenta(q)); incercari += 1) {
        q = REGISTRY[k].fn();
      }
      vazute.add(amprenta(q));
      return { q, puncte: puncte[i++] };
    });
    return {
      cheie: k,
      titlu: REGISTRY[k].title,
      total: intrebari.reduce((s, x) => s + x.puncte, 0),
      intrebari,
    };
  });
}

/** Clipboard prin `execCommand`, pentru Safari fără permisiune de scriere. */
function scrieInAscuns(text, dupa) {
  const zona = document.createElement('textarea');
  zona.value = text;
  zona.setAttribute('readonly', '');
  zona.style.cssText = 'position:fixed;top:-1000px;opacity:0';
  document.body.appendChild(zona);
  zona.select();
  try { document.execCommand('copy'); dupa(); } catch { /* nimic de făcut */ }
  document.body.removeChild(zona);
}

/** Enunțul unei întrebări, în Markdown: text cu `$…$`, formulă, ce se cere. */
function enuntMdx({ prompt, blanks }) {
  const bucati = [];
  if (prompt.latex && !prompt.text && !prompt.svg) bucati.push('Să se calculeze:');
  if (prompt.text) bucati.push(prompt.text);
  if (prompt.latex) bucati.push(`$${prompt.latex}$`);

  const alegeri = blanks.filter((b) => b.kind === 'choice');
  const numite = blanks.filter((b) => b.kind !== 'choice' && b.label !== 'Rezultatul');
  if (alegeri.length) {
    alegeri.forEach((b) => bucati.push(`Scrie **${b.options.join(' sau ')}**.`));
  } else if (numite.length > 1) {
    const lista = numite.map((b) => b.label.toLowerCase()).join(' și ');
    bucati.push(`Scrie, în ordine, ${lista}, despărțite prin punct și virgulă.`);
  }

  const linii = [bucati.join(' ')];
  // Figura merge ca HTML brut; MDX o randează ca atare.
  if (prompt.svg) linii.push('', prompt.svg.replace(/\n\s*/g, ''));
  return linii.join('\n');
}

/**
 * Testul, ca fișier MDX — aceeași formă cu `teste/template.mdx`, ca fișierul
 * copiat să stea lângă celelalte teste fără să se deosebească.
 */
function mdxDinFoaie({ capitol, clasa, subiecte, cuBarem, cate }) {
  const banda = (text) => `## <span style={{backgroundColor: '#e65100', color: 'white', padding: '4px 8px', borderRadius: '4px'}}>${text}</span>`;
  const etichete = etichetePentru(subiecte);
  const coloane = coloaneRubrica(etichete.length);
  const randuri = Math.ceil(etichete.length / coloane);

  const l = [];
  l.push('---', 'sidebar_position: 1', `title: "Automatisme: ${capitol}"`, 'description: ""', '---', '');
  l.push(`# Automatisme: ${capitol}`, '', `Clasa ${NUME_CLASA[clasa]}`, '');
  l.push('**Nume: \\', '_______________________** \\', '**Prenume: \\', '_______________________**', '');
  l.push('- Toate subiectele sunt obligatorii');
  l.push(`- Timpul efectiv de lucru este de **${MINUTE[cate] || 50} de minute**`);
  l.push('- Utilizarea instrumentelor de geometrie este **permisă și recomandată**');
  l.push(`- Se acordă **${OFICIU} puncte** din oficiu`, '');
  l.push(':::warning Atenție', 'În această rubrică puneți direct răspunsul.', ':::', '');

  l.push('## Capitole incluse', '');
  // Pe două coloane, cu idiomul din `teste/`: un capitol poate atinge opt
  // automatisme, iar opt rânduri unul sub altul umflă prima filă.
  const jum = Math.ceil(subiecte.length / 2);
  l.push("<div style={{display: 'flex'}}>", "<div style={{width: '50%'}}>", '');
  subiecte.slice(0, jum).forEach((s, i) => l.push(`- **${ROMAN[i]}.** *${s.titlu}*`));
  l.push('', '</div>', "<div style={{paddingLeft: '20px', width: '47%'}}>", '');
  subiecte.slice(jum).forEach((s, i) => l.push(`- **${ROMAN[i + jum]}.** *${s.titlu}*`));
  l.push('', '</div>', '</div>', '');
  l.push('', '## Răspunsuri', '');
  l.push(`|${' Nr. | Răspuns |'.repeat(coloane)}`);
  l.push(`|${'---|---|'.repeat(coloane)}`);
  for (let r = 0; r < randuri; r += 1) {
    const celule = [];
    for (let c = 0; c < coloane; c += 1) {
      const e = etichete[c * randuri + r];
      // O celulă fără etichetă rămâne goală; `****` ar fi un bold gol.
      celule.push(e ? ` **${e}** |  |` : '  |  |');
    }
    l.push(`|${celule.join('')}`);
  }
  l.push('', '---', '');

  subiecte.forEach((s, i) => {
    l.push(banda(`Subiectul ${NUMERAL[i]} - ${s.total} puncte`), '');
    s.intrebari.forEach((x, j) => {
      l.push(`### Exercițiul ${j + 1} **(${x.puncte}p)**`, '', ':::note', enuntMdx(x.q), ':::', '');
    });
    l.push('---', '');
  });

  l.push(banda('SFÂRȘIT TEST'), '');

  if (cuBarem) {
    l.push('---', '', banda('Barem de corectare'), '', '*Pagina aceasta este pentru profesor. Nu se distribuie elevilor.*', '');
    subiecte.forEach((s, i) => {
      l.push(`**Subiectul ${NUMERAL[i]} — ${s.titlu}**`, '');
      s.intrebari.forEach((x, j) => {
        l.push(`- **${ROMAN[i]}.${j + 1}.** ${x.q.blanks.map((b) => `${b.label}: ${b.answer}`).join('; ')} (${x.puncte}p)`);
      });
      l.push('');
    });
  }

  return l.join('\n');
}

export default function Evaluare({ capitol, clasa, automatisme }) {
  const [cate, setCate] = useState(10);
  const [cuBarem, setCuBarem] = useState(false);
  const [foaie, setFoaie] = useState(null);
  const [copiat, setCopiat] = useState(false);

  const chei = useMemo(() => automatisme.filter((k) => REGISTRY[k]), [automatisme]);

  const pregateste = useCallback(() => {
    setFoaie({ subiecte: construiesteFoaie(cate, chei), cuBarem, cate });
    setCopiat(false);
  }, [cate, cuBarem, chei]);

  /**
   * Codul MDX al testului, în clipboard. Testul generat e un punct de plecare:
   * profesorul mai schimbă un enunț, mai adaugă un exercițiu al lui, mai taie
   * unul. Pe ecran n-are ce schimba, într-un fișier are.
   */
  const copiazaCodul = useCallback(() => {
    const curenta = foaie || { subiecte: construiesteFoaie(cate, chei), cuBarem, cate };
    if (!foaie) setFoaie(curenta);
    const cod = mdxDinFoaie({ capitol, clasa, ...curenta });

    const dupa = () => { setCopiat(true); setTimeout(() => setCopiat(false), 4000); };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(cod).then(dupa, () => scrieInAscuns(cod, dupa));
    } else {
      scrieInAscuns(cod, dupa);
    }
  }, [foaie, cate, cuBarem, chei, capitol, clasa]);

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
          <button type="button" className={styles.previzualizare} onClick={copiazaCodul}>
            {copiat ? 'Codul e copiat' : 'Copiază codul MDX'}
          </button>
        </div>

        {foaie && (
          <p className={styles.confirmare}>
            Testul e pregătit, mai jos. Apasă din nou <strong>Tipărește</strong> ca
            să-l trimiți la imprimantă sau să-l salvezi ca PDF, ori
            <strong> Copiază codul MDX</strong> ca să-l lipești într-un fișier din
            <code> teste/</code> și să-l schimbi de mână.
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

/**
 * Foaia propriu-zisă.
 *
 * Randează exact ce ar randa fișierul MDX copiat de butonul „Copiază codul MDX":
 * aceleași etichete, aceleași stiluri scrise pe element, aceleași tabele ale
 * temei. Nicio clasă proprie pentru înfățișare — doar pentru paginare la tipar.
 *
 * Varianta de dinainte își desena antetul cu CSS de-al ei: linii de scris din
 * `border-bottom`, coloane din `flex` cu clase, rubrica cu lățimi fixe. Ieșea
 * un document care semăna cu al profesorului fără să fie el. Ce se vede pe
 * ecran și ce iese din butonul de cod trebuie să fie același lucru.
 */
function FoaieTest({ capitol, clasa, subiecte, cuBarem, cate }) {
  return (
    <article>
      <h1>Automatisme: {capitol}</h1>

      <p>Clasa {NUME_CLASA[clasa]}</p>

      {/* `**Nume: \` urmat de liniuțe de subliniere, ca în fișierele din
          `teste/`: liniile de scris sunt caractere, nu chenare. */}
      <p>
        <strong>Nume: <br />_______________________</strong> <br />
        <strong>Prenume: <br />_______________________</strong>
      </p>

      <ul>
        <li>Toate subiectele sunt obligatorii</li>
        <li>Timpul efectiv de lucru este de <strong>{MINUTE[cate] || 50} de minute</strong></li>
        <li>Utilizarea instrumentelor de geometrie este <strong>permisă și recomandată</strong></li>
        <li>Se acordă <strong>{OFICIU} puncte</strong> din oficiu</li>
      </ul>

      {/* Un singur rând. Cele două de dinainte — „se completează doar de
          profesorul evaluator" și „testul începe de pe pagina următoare" — au
          rămas fără obiect de când grila de notare a dispărut, iar caseta
          ocupa 136 de pixeli din prima filă pentru ele. */}
      <Admonition type="warning" title="Atenție">
        <p>În această rubrică puneți direct răspunsul.</p>
      </Admonition>

      {/* Fără grilă de notare: punctajul unui subiect stă pe banda lui, iar
          totalul se adună din rubrica de răspunsuri. Rămâne doar ce spune
          profesorului CE s-a verificat. */}
      <div className={styles.blocColoane}>
        <h2>Capitole incluse</h2>
        {/* Pe două coloane, cu idiomul din `teste/`: un capitol poate atinge opt
            automatisme, iar opt rânduri unul sub altul împing rubrica de
            răspunsuri pe fila a doua. */}
        <div style={{ display: 'flex' }}>
          <div style={{ width: '50%' }}>
            <ul>
              {subiecte.slice(0, Math.ceil(subiecte.length / 2)).map((e, i) => (
                <li key={e.cheie}><strong>{ROMAN[i]}.</strong> <em>{e.titlu}</em></li>
              ))}
            </ul>
          </div>
          <div style={{ paddingLeft: '20px', width: '47%' }}>
            <ul>
              {subiecte.slice(Math.ceil(subiecte.length / 2)).map((e, k) => (
                <li key={e.cheie}>
                  <strong>{ROMAN[k + Math.ceil(subiecte.length / 2)]}.</strong> <em>{e.titlu}</em>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <RubricaRaspunsuri subiecte={subiecte} />

      <hr />

      {subiecte.map((subiect, s) => (
        <section key={s}>
          {subiect.intrebari.map((x, j) => {
            const ex = (
              <Exercitiu
                key={`${subiect.cheie}-${j}`}
                numar={j + 1}
                intrebare={x.q}
                puncte={x.puncte}
              />
            );
            /* Banda merge lipită de primul ei exercițiu. WebKit nu implementează
               `break-after: avoid` (bug 294559), așa că singurul mod de a nu lăsa
               banda singură la baza filei e s-o pui împreună cu exercițiul
               într-un bloc care nu se rupe. */
            if (j > 0) return ex;
            return (
              <div className={styles.inceputSubiect} key={`cap-${s}`}>
                <h2>
                  <span style={BANDA}>Subiectul {NUMERAL[s]} - {subiect.total} puncte</span>
                </h2>
                {ex}
              </div>
            );
          })}
        </section>
      ))}

      <h2><span style={BANDA}>SFÂRȘIT TEST</span></h2>

      {cuBarem && (
        <section className={styles.baremFoaie}>
          <hr />
          <h2><span style={BANDA}>Barem de corectare</span></h2>
          <p><em>Pagina aceasta este pentru profesor. Nu se distribuie elevilor.</em></p>
          {subiecte.map((subiect, s) => (
            <div key={s}>
              <p><strong>Subiectul {NUMERAL[s]} — {subiect.titlu}</strong></p>
              <ul>
                {subiect.intrebari.map((x, j) => (
                  <li key={j}>
                    <strong>{ROMAN[s]}.{j + 1}.</strong>{' '}
                    {x.q.blanks.map((b) => `${b.label}: ${b.answer}`).join('; ')} ({x.puncte}p)
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
    </article>
  );
}

const RANDURI_MAXIME = 3;
const coloaneRubrica = (n) => Math.min(5, Math.max(2, Math.ceil(n / RANDURI_MAXIME)));

/** Etichetele celulelor: „I.1", „I.2", „II.1" … — subiectul și exercițiul. */
function etichetePentru(subiecte) {
  return subiecte.flatMap((s, i) => s.intrebari.map((_, j) => `${ROMAN[i]}.${j + 1}`));
}

function RubricaRaspunsuri({ subiecte }) {
  const etichete = etichetePentru(subiecte);
  const coloane = coloaneRubrica(etichete.length);
  const randuri = Math.ceil(etichete.length / coloane);

  return (
    <div className={styles.blocRubrica}>
      <h2>Răspunsuri</h2>
      <table>
        <thead>
          <tr>
            {Array.from({ length: coloane }, (_, c) => (
              <React.Fragment key={c}>
                <th>Nr.</th>
                <th>Răspuns</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: randuri }, (_, r) => (
            <tr key={r}>
              {Array.from({ length: coloane }, (_, c) => {
                /* Se umple pe COLOANE, nu pe rânduri: așa I.1, I.2, I.3 stau
                   unul sub altul, în ordinea de pe foaie. */
                const e = etichete[c * randuri + r];
                return (
                  <React.Fragment key={c}>
                    <td>{e ? <strong>{e}</strong> : ''}</td>
                    <td />
                  </React.Fragment>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Un exercițiu, în forma din `teste/template.mdx`:
 *
 *     ### Exercițiul 1 **(3p)**
 *
 *     :::note
 *     …cerința…
 *     :::
 *
 * Titlu cu punctajul îngroșat, cerința într-o casetă `note`, numerotarea
 * repornind la fiecare subiect. Nu inventăm o formă proprie: profesorul
 * corectează teanc de teste, iar unul care arată altfel se corectează mai greu.
 *
 * Sub exercițiu nu mai stă nimic — nici loc de calcul, nici casetă de răspuns.
 * Se lucrează pe ciornă, iar răspunsul se scrie în rubrica de pe prima filă.
 */
function Exercitiu({ numar, intrebare, puncte }) {
  const { prompt, blanks } = intrebare;
  const doarCalcul = prompt.latex && !prompt.text && !prompt.svg;

  return (
    <div className={styles.exercitiu}>
      <h3>Exercițiul {numar} <strong>({puncte}p)</strong></h3>

      <Admonition type="note">
        <p>
          {doarCalcul && <>Să se calculeze: </>}
          {prompt.text && (
            <span dangerouslySetInnerHTML={{ __html: bogat(prompt.text) }} />
          )}
          {prompt.latex && (
            <span
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(prompt.latex, { throwOnError: false }),
              }}
            />
          )}
          <CeSeCere blanks={blanks} />
        </p>
        {prompt.svg && (
          <span
            className={styles.figura}
            dangerouslySetInnerHTML={{ __html: prompt.svg }}
          />
        )}
      </Admonition>
    </div>
  );
}

/**
 * Ce anume se scrie în celula din rubrică, atunci când enunțul nu spune de la
 * sine. La o alegere se dau variantele; la un exercițiu cu două mărimi cerute
 * se numesc amândouă, în ordinea în care se scriu. La restul, tăcere: la
 * „$\sqrt{729}$" e limpede ce se cere.
 */
function CeSeCere({ blanks }) {
  const alegeri = blanks.filter((b) => b.kind === 'choice');
  const numite = blanks.filter((b) => b.kind !== 'choice' && b.label !== 'Rezultatul');

  if (alegeri.length === 0 && numite.length <= 1) return null;

  return (
    <span>
      {alegeri.map((b, i) => (
        <span key={`c${i}`}> Scrie <strong>{b.options.join(' sau ')}</strong>.</span>
      ))}
      {numite.length > 1 && (
        <span
          dangerouslySetInnerHTML={{
            __html: ` Scrie, în ordine, ${numite.map((b) => bogat(b.label.toLowerCase())).join(' și ')}, despărțite prin punct și virgulă.`,
          }}
        />
      )}
    </span>
  );
}

