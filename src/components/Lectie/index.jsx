import React from 'react';
import TeX from '@matejmazur/react-katex';
import Katex from '@site/src/components/Katex';
import styles from './styles.module.css';

/**
 * Elementele grafice care se repetă în lecțiile EduPAȘI de aritmetică:
 * tabelul pozițional, tabelul de descompunere fracție → cifre, bulele de
 * dialog și cantitățile desenate cu pătrățele.
 *
 * Se înregistrează global în `src/theme/MDXComponents.js`, deci în lecție NU se
 * importă nimic — se scrie direct <TabelPozitional cifre="_ 3 1 4 7 8" />.
 *
 * Toate stilurile stau în module CSS (clase generate, imposibil să scape în
 * alte lecții), iar culorile rangurilor sunt aceleași în toate componentele:
 * un elev care a văzut bulina verde la „unități" în tabel o recunoaște în
 * pătrățelele de la exercițiu. De aceea catalogul e unul singur, aici.
 */
export const RANGURI = {
  milioane:  { eticheta: 'Milioane',        genitiv: 'Milioanelor',       valoare: '1 000 000', culoare: '#8a6fae' },
  sutedemii: { eticheta: 'Sute de mii',     genitiv: 'Sutelor de mii',    valoare: '100 000',   culoare: '#6d7fb8' },
  zecidemii: { eticheta: 'Zeci de mii',     genitiv: 'Zecilor de mii',    valoare: '10 000',    culoare: '#4f8fa8' },
  mii:       { eticheta: 'Unități de mii',  genitiv: 'Unităților de mii', valoare: '1 000',     culoare: '#3f8f7e' },
  sute:      { eticheta: 'Sute',            genitiv: 'Sutelor',           valoare: '100',       culoare: '#b03a2a' },
  zeci:      { eticheta: 'Zeci',            genitiv: 'Zecilor',           valoare: '10',        culoare: '#5f9cbb' },
  unitati:   { eticheta: 'Unități',         genitiv: 'Unităților',        valoare: '1',         culoare: '#93a72f' },
  zecimi:    { eticheta: 'Zecimi',          genitiv: 'Zecimilor',         valoare: '0,1',       culoare: '#86b1b5' },
  sutimi:    { eticheta: 'Sutimi',          genitiv: 'Sutimilor',         valoare: '0,01',      culoare: '#c5808f' },
  miimi:     { eticheta: 'Miimi',           genitiv: 'Miimilor',          valoare: '0,001',     culoare: '#a9bd3f' },
};

const RANGURI_IMPLICITE = 'sute zeci unitati zecimi sutimi miimi';

/** „sute zeci unitati" → [{cheie, ...date}]. Un rang scris greșit e sărit, nu aruncă pagina. */
function citesteRanguri(lista) {
  return String(lista)
    .trim()
    .split(/\s+/)
    .filter((cheie) => RANGURI[cheie])
    .map((cheie) => ({ cheie, ...RANGURI[cheie] }));
}

/**
 * „_ 3 1 4 7 8" → ['', '3', '1', '4', '7', '8'].
 *
 * `_` e o căsuță care rămâne GOALĂ, nu cifra zero și nici o căsuță de completat:
 * la 26,478 rangul sutelor pur și simplu nu există. Lipsa cifrelor cu totul
 * (`cifre` nedat) e altceva — atunci tot rândul e de completat de elev.
 */
function citesteCifre(cifre) {
  if (cifre === undefined || cifre === null) return null;
  if (Array.isArray(cifre)) return cifre.map((c) => (c === '_' ? '' : String(c)));
  return String(cifre)
    .trim()
    .split(/\s+/)
    .map((c) => (c === '_' ? '' : c));
}

/**
 * 26478 → „26\,478".
 *
 * Grupele de trei se despart cu spațiu fin de KaTeX (`\,`), nu cu spațiu
 * obișnuit și nici cu U+202F: în lecția citită de sintetizatorul de voce
 * caracterul invizibil rupea numărul în două bucăți citite separat.
 */
function grupeaza(numar) {
  return String(numar).replace(/\B(?=(\d{3})+(?!\d))/g, '\\,');
}

/**
 * „26478/1000" → fracție KaTeX; orice altceva e lăsat neatins (poate fi deja TeX).
 *
 * Grupele de trei se pun doar la numărător. Numitorul rămâne „1000", ca în
 * manual: acolo nu e un număr de citit, e unitatea fracției — „miimi".
 */
function fractieTeX(text) {
  const bucati = String(text).split('/');
  if (bucati.length !== 2) return String(text);
  return `\\dfrac{${grupeaza(bucati[0].trim())}}{${bucati[1].trim()}}`;
}

function Bulina({ culoare, marime = 14 }) {
  return (
    <span className={styles.bulina} style={{ background: culoare, width: marime, height: marime }} aria-hidden="true" />
  );
}

/**
 * Cantitatea unui rang, desenată cu pătrățele — ca materialul de pe masă.
 *
 * Se așează pe rânduri de câte trei, nu în șir: nouă pătrate într-o linie nu se
 * numără din privire, iar în celula unui tabel n-ar încăpea.
 */
function Patrate({ cate, culoare }) {
  if (!cate) return null;
  return (
    <span className={styles.patrate} aria-hidden="true">
      {Array.from({ length: cate }, (_, i) => (
        <span key={i} className={styles.patrat} style={{ background: culoare }} />
      ))}
    </span>
  );
}

/** Cifră scrisă, căsuță goală (`''`) sau linie de completat (`null`). */
function Casuta({ valoare }) {
  if (valoare === null || valoare === undefined) {
    return <span className={styles.gol} aria-label="de completat" />;
  }
  if (valoare === '') return null;
  return <span className={styles.cifra}>{valoare}</span>;
}

/**
 * Tabelul pozițional: „ce valoare are cifra, după locul ei".
 *
 * <TabelPozitional cifre="_ 3 1 4 7 8" />
 * <TabelPozitional ranguri="mii sute zeci unitati zecimi" cifre="1 2 3 4 5" valori={false} />
 * <TabelPozitional cifre="4 2 1 6 5 1 3" patrate />   // cu cantitățile desenate
 *
 * Virgula stă într-o coloană îngustă a ei, între partea întreagă și cea
 * zecimală. Prima variantă o lipea în colțul căsuței de la „unități" și, pe
 * ecran îngust, ajungea peste cifră.
 */
export function TabelPozitional({
  cifre,
  ranguri = RANGURI_IMPLICITE,
  valori = true,
  capete = true,
  patrate = false,
  virgulaDupa = 'unitati',
}) {
  const coloane = citesteRanguri(ranguri);
  const valoriCifre = citesteCifre(cifre) || coloane.map(() => null);
  const taietura = coloane.findIndex((r) => r.cheie === virgulaDupa) + 1;
  const areVirgula = taietura > 0 && taietura < coloane.length;
  const intregi = areVirgula ? taietura : coloane.length;
  const zecimale = areVirgula ? coloane.length - taietura : 0;

  const randuri = coloane.map((rang, i) => ({ rang, cifra: valoriCifre[i] ?? '' }));
  const insereazaVirgula = (celule, celulaVirgula) =>
    areVirgula ? [...celule.slice(0, taietura), celulaVirgula, ...celule.slice(taietura)] : celule;

  return (
    <div className={styles.wrap}>
      <table className={styles.tabel}>
        <tbody>
          {capete && (
            <tr>
              <th colSpan={intregi} className={`${styles.cap} ${styles.capIntreg}`}>Partea întreagă</th>
              {areVirgula && <th className={styles.capGol} aria-hidden="true" />}
              {zecimale > 0 && (
                <th colSpan={zecimale} className={`${styles.cap} ${styles.capZecimal}`}>Partea zecimală</th>
              )}
            </tr>
          )}
          <tr>
            {insereazaVirgula(
              randuri.map(({ rang }) => (
                <th key={rang.cheie} className={styles.rang} scope="col">
                  <Bulina culoare={rang.culoare} />
                  <span className={styles.rangText}>{rang.eticheta}</span>
                </th>
              )),
              <th key="virgula" className={styles.capGol} aria-hidden="true" />,
            )}
          </tr>
          {valori && (
            <tr>
              {insereazaVirgula(
                randuri.map(({ rang }) => (
                  <td key={rang.cheie} className={styles.valoare}>{rang.valoare}</td>
                )),
                <td key="virgula" className={styles.celulaVirgula} aria-hidden="true" />,
              )}
            </tr>
          )}
          {patrate && (
            <tr>
              {insereazaVirgula(
                randuri.map(({ rang, cifra }) => (
                  <td key={rang.cheie} className={styles.celulaPatrate}>
                    <Patrate cate={Number(cifra) || 0} culoare={rang.culoare} />
                  </td>
                )),
                <td key="virgula" className={styles.celulaVirgula} aria-hidden="true" />,
              )}
            </tr>
          )}
          <tr>
            {insereazaVirgula(
              randuri.map(({ rang, cifra }) => (
                <td key={rang.cheie} className={styles.celulaCifra}>
                  <Casuta valoare={cifra === undefined ? null : cifra} />
                </td>
              )),
              <td key="virgula" className={styles.celulaVirgula}><span className={styles.virgula}>,</span></td>,
            )}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/**
 * Tabelul de descompunere: fracție zecimală → cifre pe ranguri → număr zecimal.
 *
 * <TabelDescompunere randuri={[
 *   '* 26478/1000 | _ 2 6 4 7 8 | 26,478', // `*` = rândul dat ca model, ușor colorat
 *   '12527/1000 | _ 1 2 5 2 7 | 12,527',   // rând rezolvat
 *   '935/100',                             // fără cifre → căsuțe de completat
 * ]} />
 *
 * Bulinele rangurilor stau lipite de etichetă, nu pe un rând separat: rândul de
 * buline dubla înălțimea capului de tabel fără să adauge informație.
 */
export function TabelDescompunere({ randuri = [], ranguri = RANGURI_IMPLICITE, virgulaDupa = 'unitati' }) {
  const coloane = citesteRanguri(ranguri);
  const taietura = coloane.findIndex((r) => r.cheie === virgulaDupa) + 1;
  const areVirgula = taietura > 0 && taietura < coloane.length;
  const insereazaVirgula = (celule, celulaVirgula) =>
    areVirgula ? [...celule.slice(0, taietura), celulaVirgula, ...celule.slice(taietura)] : celule;

  const date = randuri.map((rand) => {
    const [brut = '', cifre = '', rezultat = ''] = String(rand).split('|').map((b) => b.trim());
    const exemplu = brut.startsWith('*');
    return {
      fractie: exemplu ? brut.slice(1).trim() : brut,
      cifre: cifre ? citesteCifre(cifre) : null,
      rezultat,
      exemplu,
    };
  });

  return (
    <div className={styles.wrap}>
      <table className={`${styles.tabel} ${styles.tabelDescompunere}`}>
        <thead>
          <tr>
            <th rowSpan={2} className={styles.capLateral} scope="col">Fracția<br />zecimală</th>
            <th colSpan={coloane.length + (areVirgula ? 1 : 0)} className={`${styles.cap} ${styles.capCifre}`}>
              Cifra...
            </th>
            <th rowSpan={2} className={styles.capLateral} scope="col">Numărul<br />zecimal</th>
          </tr>
          <tr>
            {insereazaVirgula(
              coloane.map((rang) => (
                <th key={rang.cheie} className={styles.rang} scope="col">
                  <Bulina culoare={rang.culoare} />
                  <span className={styles.rangText}>{rang.genitiv}</span>
                </th>
              )),
              <th key="virgula" className={styles.capGol} aria-hidden="true" />,
            )}
          </tr>
        </thead>
        <tbody>
          {date.map((rand, idx) => (
            <tr key={idx} className={rand.exemplu ? styles.randExemplu : undefined}>
              <td className={styles.celulaFractie}>
                <Katex>{fractieTeX(rand.fractie)}</Katex>
              </td>
              {insereazaVirgula(
                coloane.map((rang, i) => (
                  <td key={rang.cheie} className={styles.celulaCifra}>
                    <Casuta valoare={rand.cifre ? rand.cifre[i] : ''} />
                  </td>
                )),
                <td key="virgula" className={styles.celulaVirgula}><span className={styles.virgula}>,</span></td>,
              )}
              <td className={styles.celulaRezultat}><Casuta valoare={rand.rezultat} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Replica unui personaj — bulă de dialog, ca într-o conversație.
 *
 * <Bula>Acest număr se citește: treizeci și una de unități</Bula>
 * <Bula parte="dreapta">...și patru sute șaptezeci și opt de miimi</Bula>
 *
 * Două bule una după alta se citesc ca un schimb de replici: prima la stânga, a
 * doua la dreapta. Vârful e un pătrat rotit, tăiat din același fundal ca bula, nu
 * un triunghi desenat separat — varianta cu SVG lăsa o cusătură vizibilă între
 * vârf și bulă la orice zoom. Textul e închis pe fond deschis: alb pe mov, în
 * scris de mână, era greu de citit exact pentru cine are nevoie de lecția asta.
 *
 * `coada="stanga"` din prima versiune rămâne valid și înseamnă acum „la dreapta".
 */
export function Bula({ children, parte, coada }) {
  const laDreapta = parte === 'dreapta' || coada === 'stanga' || coada === 'dreapta';
  return (
    <div className={`${styles.bulaRand} ${laDreapta ? styles.bulaDreapta : styles.bulaStanga}`}>
      <div className={styles.bula}>{children}</div>
    </div>
  );
}

/**
 * Cantitatea desenată cu pătrățele, un pătrat pentru fiecare unitate de rang.
 *
 * <Blocuri cifre="1 8 3 2 5 8" />            → linii goale, de completat
 * <Blocuri cifre="1 8 3 2 5 8" rezolvat />   → cu cifrele scrise pe linii
 *
 * Sub fiecare coloană rămâne o linie de aceeași culoare: acolo scrie elevul
 * cifra, sau o scriem noi când desenul e dat ca exemplu rezolvat. Descrierea din
 * `aria-label` spune cantitatea pe ranguri și numărul obținut, altfel desenul e
 * mut pentru cine folosește cititor de ecran.
 */
export function Blocuri({
  cifre,
  ranguri = RANGURI_IMPLICITE,
  virgulaDupa = 'unitati',
  linii = true,
  rezolvat = false,
}) {
  const coloane = citesteRanguri(ranguri);
  const valoriCifre = (citesteCifre(cifre) || []).map((c) => Number(c) || 0);
  const taietura = coloane.findIndex((r) => r.cheie === virgulaDupa) + 1;
  const areVirgula = taietura > 0 && taietura < coloane.length;

  const L = 22;        // latura pătratului
  const G = 5;         // spațiul dintre pătrate
  const PAS = 34;      // pasul dintre coloane
  const RUPTURA = 26;  // spațiul suplimentar dinaintea zecimilor, acolo unde cade virgula
  const x = (i) => i * PAS + (areVirgula && i >= taietura ? RUPTURA : 0);

  const maxim = Math.max(9, ...valoriCifre);
  const baza = maxim * (L + G) + 26;
  const latime = x(coloane.length - 1) + L + 6;
  const inaltime = baza + (rezolvat ? 46 : linii ? 22 : 6);
  const yVirgula = rezolvat ? baza + 34 : baza + 8;

  const descriere = coloane
    .map((rang, i) => `${valoriCifre[i] || 0} ${rang.eticheta.toLowerCase()}`)
    .join(', ');

  /* Numărul citit din desen: cifrele din stânga virgulei fără zerourile de la
     început (18 zeci nu se scrie „018"), cele din dreapta exact cum sunt. */
  const numar = areVirgula
    ? `${valoriCifre.slice(0, taietura).join('').replace(/^0+(?=\d)/, '')},${valoriCifre.slice(taietura).join('')}`
    : valoriCifre.join('').replace(/^0+(?=\d)/, '');

  return (
    <svg
      className={styles.blocuri}
      viewBox={`0 0 ${latime} ${inaltime}`}
      width={latime}
      height={inaltime}
      role="img"
      aria-label={
        rezolvat
          ? `Cantitate desenată cu pătrățele: ${descriere}. Numărul zecimal este ${numar}.`
          : `Cantitate desenată cu pătrățele: ${descriere}.`
      }
    >
      {coloane.map((rang, i) => (
        <g key={rang.cheie}>
          {Array.from({ length: valoriCifre[i] || 0 }, (_, k) => (
            <rect key={k} x={x(i)} y={k * (L + G)} width={L} height={L} fill={rang.culoare} rx="2" />
          ))}
          {linii && (
            <line x1={x(i)} y1={baza} x2={x(i) + L} y2={baza} stroke={rang.culoare} strokeWidth="3" />
          )}
          {rezolvat && (
            <text
              className={styles.cifraBlocuri}
              x={x(i) + L / 2}
              y={baza + 34}
              textAnchor="middle"
              fill={rang.culoare}
            >
              {valoriCifre[i] || 0}
            </text>
          )}
        </g>
      ))}
      {areVirgula && linii && (
        <text className={styles.virgulaBlocuri} x={x(taietura) - RUPTURA / 2 - 3} y={yVirgula}>,</text>
      )}
    </svg>
  );
}

/**
 * Două-trei desene puse una lângă alta, care trec una sub alta pe ecran îngust.
 *
 * <Alaturi>
 *   <Blocuri cifre="1 8 3 2 5 8" />
 *   <Blocuri cifre="3 7 0 8 1 5" />
 * </Alaturi>
 */
export function Alaturi({ children }) {
  return <div className={styles.alaturi}>{children}</div>;
}

/** Operațiile așezate, trei pe rând pe ecran lat, una sub alta pe telefon. */
export function Operatii({ children }) {
  return <div className={styles.operatii}>{children}</div>;
}


/**
 * Scara cartonașelor-numere, materialul de pe masă: 1000, 100, 10, 1, 0,1 ș.a.m.d.
 *
 * <CartonaseNumere numere="1000 100 10 1 0,1 0,01 0,001" />
 *
 * Cartonașele se așază pe coloane de rang, nu unul lângă altul: fiecare cifră
 * cade în coloana rangului ei, așa cum ar sta pe masă. Pentru numerele întregi
 * asta înseamnă un pas la dreapta la fiecare rând, deci 1 alunecă pe diagonală —
 * exact ce trebuie să vadă copilul: același 1, de zece ori mai mic la fiecare pas.
 *
 * La zecimale, cartonașul începe cu „0," care e cifra UNITĂȚILOR, deci 0,1, 0,01 și
 * 0,001 pornesc toate din coloana unităților, unul sub altul, sub cartonașul 1 —
 * și doar cifra 1 continuă să coboare spre dreapta. Prima variantă le muta și pe
 * ele cu un pas, iar zeroul ajungea în coloana zecimilor: greșit ca poziționare și
 * derutant tocmai la pasul unde copilul trece peste virgulă.
 */
export function CartonaseNumere({ numere = '1000 100 10 1 0,1 0,01 0,001' }) {
  const ordineaRangurilor = Object.keys(RANGURI);
  const indiceUnitati = ordineaRangurilor.indexOf('unitati');

  const dupaValoare = {};
  Object.entries(RANGURI).forEach(([cheie, date], i) => {
    dupaValoare[date.valoare.replace(/\s/g, '')] = { ...date, indice: i };
  });

  const lista = String(numere).trim().split(/\s+/);

  /* Din ce coloană începe cartonașul. La întregi e chiar rangul lui; la zecimale
     prima casetă e „0,", adică unitățile, deci se oprește acolo. Scăderea de la
     final aduce primul cartonaș la coloana zero, oricare ar fi lista. */
  const coloanaDe = (numar) => {
    const rang = dupaValoare[numar.replace(/\s/g, '')];
    return rang ? Math.min(rang.indice, indiceUnitati) : indiceUnitati;
  };
  const coloane = lista.map(coloanaDe);
  const prima = Math.min(...coloane);

  /* Cifrele unui cartonaș, cu virgula lipită de cifra dinaintea ei: „0,1" se
     citește pe cartonaș ca „0," și „1", nu ca trei semne separate. */
  const cifreleLui = (numar) => {
    const bucati = [];
    for (const ch of numar.replace(/\s/g, '')) {
      if (ch === ',' && bucati.length) bucati[bucati.length - 1] += ',';
      else bucati.push(ch);
    }
    return bucati;
  };

  return (
    <div className={styles.scara} role="img"
         aria-label={`Cartonașe-numere, de la ${lista[0]} până la ${lista[lista.length - 1]}, fiecare cu un rang mai jos.`}>
      {lista.map((numar, i) => {
        const rang = dupaValoare[numar.replace(/\s/g, '')];
        return (
          <div key={numar + i} className={styles.cartonas}
               style={{ marginLeft: `${(coloane[i] - prima) * 2.3}rem` }}>
            {cifreleLui(numar).map((cifra, j) => (
              <span key={j} className={styles.cartonasCifra} style={{ color: rang ? rang.culoare : 'inherit' }}>
                {cifra}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}


/**
 * Tabelul cu alunecarea unui număr între ranguri: „×10 îl mută o coloană la
 * stânga, ÷100 două la dreapta".
 *
 * <TabelAlunecare />                                  // 0,8 cu ×10, ×100, ÷100
 * <TabelAlunecare numar="2,4" ranguri="sute zeci unitati zecimi sutimi" />
 *
 * E desenat ca SVG, nu ca tabel HTML cu săgeți scrise din text: săgeata trebuie să
 * înceapă exact sub cifra care se mută și să se oprească exact în coloana în care
 * ajunge — altfel figura nu mai demonstrează nimic, e doar un decor lângă un tabel.
 * Cu SVG, capătul săgeții și coloana sunt aceeași coordonată, prin construcție.
 */
export function TabelAlunecare({
  ranguri = 'zeci unitati zecimi sutimi miimi',
  numar = '0,8',
  sageti = [
    { eticheta: '× 10', pasi: 1, sens: 'stanga' },
    { eticheta: '× 100', pasi: 2, sens: 'stanga' },
    { eticheta: '÷ 100', pasi: 2, sens: 'dreapta' },
  ],
}) {
  const coloane = citesteRanguri(ranguri);
  const indiceUnitati = coloane.findIndex((r) => r.cheie === 'unitati');

  const L = 108;   // lățimea unei coloane
  const H_CAP = 46;
  const H_CARTONAS = 78;
  const H_SAGEATA = 46;
  const latime = coloane.length * L;
  const inaltime = H_CAP + H_CARTONAS + sageti.length * H_SAGEATA + 10;

  const centrul = (i) => i * L + L / 2;

  /* Cifrele cartonașului, cu virgula lipită de cifra dinaintea ei. Prima casetă e
     unitățile, ca la cartonașele de pe masă. */
  const cifreCartonas = [];
  for (const ch of String(numar).replace(/\s/g, '')) {
    if (ch === ',' && cifreCartonas.length) cifreCartonas[cifreCartonas.length - 1] += ',';
    else cifreCartonas.push(ch);
  }
  const startCartonas = Math.max(0, indiceUnitati);
  const xCartonas = startCartonas * L;
  const latCartonas = cifreCartonas.length * L;

  /* Coloana de unde pleacă săgețile: cifra care se mută, adică ultima a cartonașului. */
  const coloanaPlecare = startCartonas + cifreCartonas.length - 1;
  const yCap = H_CAP;

  const descriere = `Tabel cu rangurile ${coloane.map((r) => r.valoare).join(', ')}; `
    + `numărul ${numar} așezat în tabel, cu săgeți care arată ${sageti.map((s) => s.eticheta).join(', ')}.`;

  return (
    <div className={styles.wrap}>
      <svg viewBox={`0 0 ${latime} ${inaltime}`} width={latime} height={inaltime}
           className={styles.alunecare} role="img" aria-label={descriere}>
        {/* capetele de coloană, colorate pe rang */}
        {coloane.map((rang, i) => (
          <g key={rang.cheie}>
            <rect x={i * L} y={0} width={L} height={H_CAP} fill={rang.culoare} opacity="0.85" />
            <text x={centrul(i)} y={H_CAP / 2 + 7} textAnchor="middle" className={styles.alunecareCap}>
              {rang.valoare}
            </text>
          </g>
        ))}

        {/* corpul tabelului */}
        <rect x={0} y={yCap} width={latime} height={inaltime - yCap} fill="none" stroke="#8f8f97" />
        {coloane.map((rang, i) => (
          <line key={`l${rang.cheie}`} x1={i * L} y1={yCap} x2={i * L} y2={inaltime} stroke="#8f8f97" />
        ))}
        <line x1={0} y1={yCap + H_CARTONAS} x2={latime} y2={yCap + H_CARTONAS} stroke="#8f8f97" />

        {/* cartonașul-număr, așezat peste coloanele lui */}
        <rect x={xCartonas + 6} y={yCap + 8} width={latCartonas - 12} height={H_CARTONAS - 16}
              fill="var(--ifm-background-surface-color, #fff)" stroke="#8f8f97" rx="4" />
        {cifreCartonas.map((cifra, i) => (
          <text key={i} x={centrul(startCartonas + i)} y={yCap + H_CARTONAS / 2 + 12}
                textAnchor="middle" className={styles.alunecareCifra}>
            {cifra}
          </text>
        ))}

        {/* săgețile: pleacă de sub cifra care se mută și se opresc în coloana țintă */}
        {sageti.map((s, i) => {
          const y = yCap + H_CARTONAS + i * H_SAGEATA + H_SAGEATA / 2;
          const laStanga = s.sens === 'stanga';
          const tinta = coloanaPlecare + (laStanga ? -s.pasi : s.pasi);
          const xStart = centrul(coloanaPlecare);
          const xCap = centrul(Math.max(0, Math.min(coloane.length - 1, tinta)));
          const varf = laStanga ? xCap : xCap;
          const semn = laStanga ? 1 : -1;
          return (
            <g key={s.eticheta}>
              <line x1={xStart} y1={y} x2={varf + semn * 10} y2={y} stroke="currentColor" strokeWidth="2" />
              <path d={`M${varf} ${y} l${semn * 12} -6 v12 z`} fill="currentColor" />
              <text x={xStart + (laStanga ? 16 : -16)} y={y + 6}
                    textAnchor={laStanga ? 'start' : 'end'} className={styles.alunecareEticheta}>
                {s.eticheta}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}


/**
 * Operație așezată în coloane, cu benzile colorate pe ranguri — ca în caiet.
 *
 * <OperatieAsezata eticheta="a" a="292,736" semn="+" b="64,078" rezultat="356,814" />
 * <OperatieAsezata eticheta="b" a="219,7" semn="+" b="745,39" enunt />  // de rezolvat
 *
 * `eticheta` pune litera exercițiului, `enunt` scrie și operația pe un rând, cu
 * KaTeX — așa cum e dată în manual înainte de a fi așezată. Fără rezultat, ultimul
 * rând rămâne gol: exercițiul e de făcut, nu de citit.
 *
 * Cifrele se aliniază după VIRGULĂ, nu după capătul din dreapta: 456,75 minus
 * 175,642 are un rang în minus la zecimale, iar dacă numerele s-ar lipi la dreapta,
 * sutimile ar cădea peste miimi. De aceea coloanele se construiesc din câte cifre
 * are fiecare parte, întreagă și zecimală, luate separat.
 *
 * Banda colorată din spate ține locul benzilor tipărite: aceeași culoare de rang
 * din tabele și din pătrățele, ca elevul să regăsească „coloana sutelor" oriunde.
 */
export function OperatieAsezata({ a, b, semn = '+', rezultat, enunt = false, eticheta, ranguri = 'sutedemii zecidemii mii sute zeci unitati zecimi sutimi miimi' }) {
  /* Virgula zecimală în KaTeX cere acoladele: `219{,}7`, altfel rămâne un spațiu
     după ea, ca la o enumerare. */
  const teXNumar = (n) => String(n).replace(',', '{,}');
  const partile = (numar) => {
    const [intreg = '', zecimal = ''] = String(numar).trim().split(',');
    return { intreg, zecimal };
  };

  const numere = [a, b, rezultat].filter(Boolean).map(partile);
  const nrIntregi = Math.max(...numere.map((n) => n.intreg.length));
  const nrZecimale = Math.max(...numere.map((n) => n.zecimal.length));

  /* Rangul fiecărei coloane: unitățile sunt ultima coloană dinaintea virgulei, iar
     de acolo se numără în ambele sensuri prin catalogul de ranguri. */
  const catalog = Object.entries(RANGURI);
  const indiceUnitati = catalog.findIndex(([cheie]) => cheie === 'unitati');
  const permise = new Set(String(ranguri).trim().split(/\s+/));
  const rangColoanei = (pozitie) => {
    const idx = indiceUnitati + pozitie; // pozitie: -1 zeci, 0 unități, +1 zecimi…
    const intrare = catalog[idx];
    return intrare && permise.has(intrare[0]) ? intrare[1] : null;
  };

  const coloane = [];
  for (let i = 0; i < nrIntregi; i += 1) coloane.push({ tip: 'cifra', pozitie: i - (nrIntregi - 1) });
  coloane.push({ tip: 'virgula' });
  for (let i = 0; i < nrZecimale; i += 1) coloane.push({ tip: 'cifra', pozitie: i + 1 });

  /* Cifra unui număr pentru o coloană dată; lipsă înseamnă casetă goală, nu zero. */
  const cifraLa = (numar, col) => {
    if (!numar) return '';
    const { intreg, zecimal } = partile(numar);
    if (col.tip === 'virgula') return ',';
    if (col.pozitie <= 0) {
      const i = intreg.length - 1 + col.pozitie;
      return i >= 0 ? intreg[i] : '';
    }
    return zecimal[col.pozitie - 1] || '';
  };

  const randuri = [
    { cheie: 'a', numar: a, semn: '' },
    { cheie: 'b', numar: b, semn },
    { cheie: 'r', numar: rezultat, semn: '', rezultat: true },
  ];

  return (
    <div className={styles.operatie}
         role="img"
         aria-label={`${a} ${semn === '+' ? 'plus' : 'minus'} ${b}${rezultat ? ` egal ${rezultat}` : ''}`}>
      {(eticheta || enunt) && (
        <div className={styles.operatieCap}>
          {eticheta && <span className={styles.operatieEticheta}>{eticheta})</span>}
          {enunt && <TeX math={`${teXNumar(a)} ${semn === '-' ? '-' : '+'} ${teXNumar(b)}`} />}
        </div>
      )}
      <div className={styles.operatieGrila}
           style={{
             gridTemplateColumns: `1.4rem ${coloane.map((c) => (c.tip === 'virgula' ? '0.7rem' : '1.6rem')).join(' ')}`,
             /* Rândurile trebuie declarate explicit, altfel benzile nu se întind:
                `grid-row: 1 / -1` numără liniile grilei EXPLICITE, iar într-o grilă
                cu rânduri implicite `-1` cade pe prima linie și banda rămâne cât
                un singur rând. */
             gridTemplateRows: 'repeat(3, auto)',
           }}>
        {/* benzile de rang, câte una pe coloană, sub cifre */}
        {coloane.map((col, i) => {
          const rang = col.tip === 'cifra' ? rangColoanei(col.pozitie) : null;
          return (
            <span key={`banda${i}`} className={styles.banda}
                  style={{ gridColumn: i + 2, background: rang ? rang.culoare : 'transparent' }} />
          );
        })}

        {randuri.map((rand, r) => (
          <React.Fragment key={rand.cheie}>
            <span className={styles.operatieSemn} style={{ gridRow: r + 1, gridColumn: 1 }}>{rand.semn}</span>
            {coloane.map((col, i) => (
              <span key={`${rand.cheie}${i}`}
                    className={`${styles.operatieCifra} ${rand.rezultat ? styles.operatieRezultat : ''}`}
                    style={{ gridRow: r + 1, gridColumn: i + 2 }}>
                {cifraLa(rand.numar, col)}
              </span>
            ))}
          </React.Fragment>
        ))}

        {/* Linia de sub al doilea termen. Stă peste benzi, nu sub ele: benzile sunt
            elemente nepoziționate, deci orice element poziționat le acoperă. */}
        <span className={styles.operatieLinie}
              style={{ gridRow: 2, gridColumn: `1 / ${coloane.length + 2}` }} />
      </div>
    </div>
  );
}


/**
 * Schimbul de rang cu cartonașe: „6 zecimi înmulțite cu 10 fac 6 unități".
 *
 * <SchimbRang cate={6} din="zecimi" catre="unitati" operatie="× 10"
 *             regula="10 zecimi = 1 unitate" />
 *
 * Se vede cantitatea, nu doar rezultatul: șase cartonașe rămân șase cartonașe, se
 * schimbă doar rangul lor. De aceea numărul de cartonașe e același de o parte și
 * de alta a săgeții — ideea lecției e că virgula se mută, nu că apar cifre noi.
 *
 * Egalitatea de dedesubt se calculează din rang, nu se scrie de mână: rangul dă
 * exponentul (unități = 0, zecimi = −1…), iar numărul se compune din cifre, ca să
 * nu intervină erorile de virgulă mobilă.
 */
export function SchimbRang({ cate = 6, din, catre, operatie = '× 10', regula }) {
  const chei = Object.keys(RANGURI);
  const expus = (cheie) => chei.indexOf('unitati') - chei.indexOf(cheie);

  /* cate × 10^exponent, compus din cifre. */
  const valoarea = (cheie) => {
    const e = expus(cheie);
    const c = String(cate);
    if (e >= 0) return c + '0'.repeat(e);
    const zecimale = -e;
    if (c.length <= zecimale) return `0,${'0'.repeat(zecimale - c.length)}${c}`;
    return `${c.slice(0, c.length - zecimale)},${c.slice(c.length - zecimale)}`;
  };

  const rangDin = RANGURI[din];
  const rangCatre = RANGURI[catre];
  if (!rangDin || !rangCatre) return null;

  const grup = (rang, cheie) => (
    <span className={styles.schimbGrup}>
      <span className={styles.schimbCartonase}>
        {Array.from({ length: cate }, (_, i) => (
          <span key={i} className={styles.schimbCartonas} style={{ background: rang.culoare }}>
            {rang.valoare}
          </span>
        ))}
      </span>
      <span className={styles.schimbEticheta}>{cate} {rang.eticheta.toLowerCase()}</span>
    </span>
  );

  return (
    <div className={styles.schimb}
         role="img"
         aria-label={`${cate} ${rangDin.eticheta.toLowerCase()} ${operatie} fac ${cate} ${rangCatre.eticheta.toLowerCase()}: ${valoarea(din)} ${operatie} = ${valoarea(catre)}`}>
      {/* Grupele stau una sub alta, cu săgeata în sus, ca în manual: cantitatea de
          jos „devine" cea de sus. Așezate una lângă alta, pe lățimea coloanei de
          text se rupeau, iar săgeata rămânea agățată de grupul din stânga. */}
      <div className={styles.schimbColoana}>
        {grup(rangCatre, catre)}
        <span className={styles.schimbSageata}>
          <svg width="18" height="42" viewBox="0 0 18 42" aria-hidden="true">
            <line x1="9" y1="42" x2="9" y2="14" stroke="currentColor" strokeWidth="2" />
            <path d="M9 0 L2 14 L16 14 Z" fill="currentColor" />
          </svg>
          <span className={styles.schimbOperatie}>{operatie}</span>
        </span>
        {grup(rangDin, din)}
      </div>
      {regula && <div className={styles.schimbRegula}>{regula}</div>}
      <div className={styles.schimbEgalitate}>
        {valoarea(din)} {operatie.replace('×', '×').replace('÷', '÷')} = {valoarea(catre)}
      </div>
    </div>
  );
}


/** Cifrele unui număr, ca listă de numere. */
function cifreleLui(numar) {
  return String(numar).replace(/\D/g, '').split('').map(Number);
}

/**
 * Înmulțirea „per gelosia" (cu jaluzele), tehnica din cartea lui Fibonacci, 1202.
 *
 * <Gelosia a="987" b="987" />
 *
 * Fiecare căsuță ține produsul a două cifre, tăiat de diagonală: zecile sus,
 * unitățile jos. Rezultatul se citește pe dungile diagonale, adunate de la
 * dreapta-jos spre stânga, cu tot cu ce se transportă.
 *
 * Grila și rezultatul se CALCULEAZĂ din cele două numere, nu se scriu de mână:
 * altfel figura ar fi doar un desen, iar la alt exemplu ar trebui refăcută.
 */
export function Gelosia({ a = '987', b = '987' }) {
  const ca = cifreleLui(a);
  const cb = cifreleLui(b);
  const n = ca.length;
  const m = cb.length;

  const C = 62;          // latura căsuței
  /* Marginile sunt diferite pe fiecare latură, nu una singură: sus și în dreapta
     stau cifrele factorilor (mici), iar în stânga și jos rezultatul, scris de mână
     și mai mare. Cu o margine comună, cifrele rezultatului urcau peste ultimul
     rând de căsuțe. */
  const M_SUS = 30;
  const M_DREAPTA = 34;
  const M_STANGA = 40;
  const M_JOS = 44;
  const x0 = M_STANGA;
  const y0 = M_SUS;
  const latime = M_STANGA + n * C + M_DREAPTA;
  const inaltime = M_SUS + m * C + M_JOS;

  /* Dungile diagonale, numărate de la colțul din dreapta-jos: unitățile unei
     căsuțe cad pe dunga ei, zecile pe următoarea. */
  const dungi = new Array(n + m).fill(0);
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < m; j += 1) {
      const produs = ca[i] * cb[j];
      const s = (n - 1 - i) + (m - 1 - j);
      dungi[s] += produs % 10;
      dungi[s + 1] += Math.floor(produs / 10);
    }
  }
  let rest = 0;
  const cifreRezultat = dungi.map((suma) => {
    const total = suma + rest;
    rest = Math.floor(total / 10);
    return total % 10;
  });
  while (rest > 0) { cifreRezultat.push(rest % 10); rest = Math.floor(rest / 10); }
  const rezultat = cifreRezultat.slice().reverse().join('')
    .replace(/^0+(?=\d)/, '')
    /* Spațiu OBIȘNUIT la grupele de mii, nu U+202F: caracterul îngust invizibil
       rupea numerele în două la citirea cu voce a lecției. */
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  return (
    <div className={styles.wrap}>
      <svg viewBox={`0 0 ${latime} ${inaltime}`} width={latime} height={inaltime}
           className={styles.gelosia} role="img"
           aria-label={`Înmulțire per gelosia: ${a} ori ${b} egal ${rezultat}.`}>
        {/* cifrele primului număr, deasupra coloanelor */}
        {ca.map((c, i) => (
          <text key={`a${i}`} x={x0 + i * C + C / 2} y={y0 - 9} textAnchor="middle" className={styles.gelosiaCifraFactor}>{c}</text>
        ))}
        {/* cifrele celui de-al doilea, în dreapta rândurilor */}
        {cb.map((c, j) => (
          <text key={`b${j}`} x={x0 + n * C + 12} y={y0 + j * C + C / 2 + 6} className={styles.gelosiaCifraFactor}>{c}</text>
        ))}

        {ca.map((ci, i) => cb.map((cj, j) => {
          const produs = ci * cj;
          const cx = x0 + i * C;
          const cy = y0 + j * C;
          return (
            <g key={`c${i}${j}`}>
              <rect x={cx} y={cy} width={C} height={C} fill="none" stroke="#8f8f97" />
              <line x1={cx + C} y1={cy} x2={cx} y2={cy + C} stroke="#8f8f97" />
              <text x={cx + C * 0.3} y={cy + C * 0.38} textAnchor="middle" className={styles.gelosiaCifra}>
                {Math.floor(produs / 10)}
              </text>
              <text x={cx + C * 0.72} y={cy + C * 0.86} textAnchor="middle" className={styles.gelosiaCifra}>
                {produs % 10}
              </text>
            </g>
          );
        }))}

        {/* rezultatul: pe stânga în jos, apoi pe sub grilă spre dreapta */}
        {cifreRezultat.map((cifra, k) => {
          const total = cifreRezultat.length;
          const pozitie = total - 1 - k; // de la stânga-sus spre dreapta-jos
          const peStanga = pozitie < m;
          const x = peStanga ? x0 - 19 : x0 + (pozitie - m) * C + C / 2;
          const y = peStanga ? y0 + pozitie * C + C / 2 + 8 : y0 + m * C + 32;
          return (
            <text key={`r${k}`} x={x} y={y} textAnchor="middle" className={styles.gelosiaRezultat}>{cifra}</text>
          );
        })}
      </svg>
      <div className={styles.gelosiaCitire}>Se citește {a} × {b} = {rezultat}.</div>
    </div>
  );
}

/**
 * Înmulțirea japoneză: se numără intersecțiile mănunchiurilor de linii.
 *
 * <InmultireJaponeza a="41" b="23" />
 *
 * Fiecare cifră e un mănunchi de linii; câte intersecții are un grup, atâtea
 * unități, zeci sau sute aduce el. E aceeași înmulțire, dar văzută geometric:
 * grupul din mijloc adună două produse, exact ca la înmulțirea scrisă.
 */
export function InmultireJaponeza({ a = '41', b = '23' }) {
  const ca = cifreleLui(a);
  const cb = cifreleLui(b);
  const PAS = 13;        // distanța dintre liniile aceleiași cifre
  const GOL = 30;        // distanța dintre mănunchiuri
  const CULORI = ['#b03a2a', '#5f9cbb', '#93a72f', '#8a6fae'];

  /* Fiecare linie are o „cotă": y = x + c pentru primul număr, y = −x + d pentru
     al doilea. Intersecția a două linii se află rezolvând sistemul — de aceea
     punctele cad exact pe încrucișări, nu aproximate din ochi. */
  const cote = (cifre) => {
    const rez = [];
    let c = 0;
    cifre.forEach((cifra, idx) => {
      const grup = [];
      for (let k = 0; k < cifra; k += 1) { grup.push(c); c += PAS; }
      rez.push(grup);
      c += GOL;
    });
    return rez;
  };

  const coteA = cote(ca);
  const coteB = cote(cb);
  const toateA = coteA.flat();
  const toateB = coteB.flat();
  const maxA = Math.max(...toateA, 0);
  const maxB = Math.max(...toateB, 0);

  const L = 40;
  const latime = maxA + maxB + 2 * L;
  const inaltime = maxA + maxB + 2 * L;
  const dus = (cA, cB) => ({ x: L + (cB - cA + maxA) / 1, y: L + (cA + cB) / 1 });

  const grupuri = [];
  coteA.forEach((gA, i) => coteB.forEach((gB, j) => {
    const puncte = [];
    gA.forEach((cA) => gB.forEach((cB) => puncte.push(dus(cA, cB))));
    grupuri.push({ i, j, rang: i + j, cate: ca[i] * cb[j], puncte });
  }));

  const peRang = {};
  grupuri.forEach((g) => { peRang[g.rang] = (peRang[g.rang] || 0) + g.cate; });

  /* `rang` numără de la stânga: 0 e grupul cifrelor celor mai mari. Puterea lui 10
     merge invers, de la dreapta — grupul cel mai din dreapta aduce unități. Prima
     variantă folosea direct rangul ca exponent și scotea 448 în loc de 943. */
  const rangMaxim = (ca.length - 1) + (cb.length - 1);
  const ranguri = Object.keys(peRang).map(Number).sort((x, y) => y - x); // unități întâi
  const puterea = (r) => 10 ** (rangMaxim - r);
  const rezultat = ranguri.reduce((acc, r) => acc + peRang[r] * puterea(r), 0);

  const linie = (cA, cB, tip) => {
    if (tip === 'a') {
      const p1 = dus(cA, Math.min(...toateB) - L / 2);
      const p2 = dus(cA, Math.max(...toateB) + L / 2);
      return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
    }
    const p1 = dus(Math.min(...toateA) - L / 2, cB);
    const p2 = dus(Math.max(...toateA) + L / 2, cB);
    return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
  };

  const citire = ranguri.map((r) => `${peRang[r]} × ${puterea(r)}`).join(' + ');

  return (
    <div className={styles.wrap}>
      <svg viewBox={`0 0 ${latime} ${inaltime}`} width={latime} height={inaltime}
           className={styles.japoneza} role="img"
           aria-label={`Înmulțire japoneză: ${a} ori ${b}, grupurile de intersecții dau ${rezultat}.`}>
        {coteA.map((grup, i) => grup.map((c, k) => {
          const l = linie(c, null, 'a');
          return <line key={`a${i}${k}`} {...l} stroke={CULORI[i % CULORI.length]} strokeWidth="1.6" />;
        }))}
        {coteB.map((grup, j) => grup.map((c, k) => {
          const l = linie(null, c, 'b');
          /* Și mănunchiurile celui de-al doilea număr primesc culori diferite:
             altfel grupurile de intersecții nu se disting unul de altul. */
          return <line key={`b${j}${k}`} {...l} stroke={CULORI[(j + 2) % CULORI.length]} strokeWidth="1.6" strokeDasharray="4 3" />;
        }))}
        {grupuri.map((g) => g.puncte.map((p, k) => (
          <circle key={`p${g.i}${g.j}${k}`} cx={p.x} cy={p.y} r="3.4" fill="#1c1a16" />
        )))}
      </svg>
      <div className={styles.gelosiaCitire}>Se citește {a} × {b} = {citire} = {rezultat}.</div>
    </div>
  );
}


/**
 * Înmulțire așezată în coloane, cu produsele parțiale — ca în caiet.
 *
 * <InmultireAsezata eticheta="a" a="25,98" b="3,6" rezolvat />
 * <InmultireAsezata eticheta="b" a="37,8" b="2,4" />        // de completat
 *
 * Rândurile se aliniază la DREAPTA, ca la înmulțirea scrisă: fiecare produs parțial
 * e deja înmulțit cu puterea lui de zece (254 × 1 zeci se scrie 2540), exact cum îl
 * scrie elevul. Virgula apare doar la factori și la rezultat, fiindcă produsele
 * parțiale se fac cu numerele întregi.
 *
 * Rezultatul se calculează din cifre, nu cu numere zecimale: câte zecimale au
 * împreună factorii, atâtea are produsul.
 */
export function InmultireAsezata({ a, b, rezolvat = false, eticheta }) {
  const zecimale = (x) => (String(x).split(',')[1] || '').length;
  const intreg = (x) => String(x).replace(',', '').replace(/\s/g, '');

  const ai = intreg(a);
  const bi = intreg(b);
  const cifreB = bi.split('').map(Number);

  /* Produsele parțiale, de la cifra unităților spre stânga. */
  const partiale = cifreB
    .slice()
    .reverse()
    .map((cifra, k) => String(BigInt(ai) * BigInt(cifra) * BigInt(10) ** BigInt(k)));

  const totalIntreg = (BigInt(ai) * BigInt(bi)).toString();
  const nrZec = zecimale(a) + zecimale(b);
  const cuVirgula = nrZec === 0
    ? totalIntreg
    : `${totalIntreg.slice(0, -nrZec) || '0'},${totalIntreg.slice(-nrZec).padStart(nrZec, '0')}`;

  const randuri = [
    { semn: '', text: String(a) },
    { semn: '×', text: String(b) },
    { linie: true },
    ...partiale.map((valoare, i) => ({
      semn: i === partiale.length - 1 && partiale.length > 1 ? '+' : '',
      text: valoare,
      ascuns: !rezolvat,
    })),
    { linie: true },
    { semn: '=', text: cuVirgula, ascuns: !rezolvat, rezultat: true },
  ];

  const latimeMax = Math.max(...randuri.filter((r) => r.text).map((r) => r.text.length));

  return (
    <div className={styles.operatie}>
      {eticheta && (
        <div className={styles.operatieCap}>
          <span className={styles.operatieEticheta}>{eticheta})</span>
          <TeX math={`${String(a).replace(',', '{,}')} \\times ${String(b).replace(',', '{,}')}`} />
        </div>
      )}
      <div className={styles.inmultire}
           role="img"
           aria-label={`${a} ori ${b}${rezolvat ? ` egal ${cuVirgula}` : ''}, așezate în coloane`}>
        {randuri.map((rand, i) => {
          if (rand.linie) return <span key={i} className={styles.inmultireLinie} />;
          const caractere = (rand.text || '').padStart(latimeMax, ' ').split('');
          return (
            <div key={i} className={styles.inmultireRand}>
              <span className={styles.inmultireSemn}>{rand.semn}</span>
              {caractere.map((ch, j) => (
                <span key={j} className={styles.inmultireCelula}>
                  {rand.ascuns ? (ch === ' ' ? '' : <span className={styles.gol} />) : (ch === ' ' ? '' : ch)}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default { TabelPozitional, TabelDescompunere, Bula, Blocuri, Alaturi, Operatii, CartonaseNumere, TabelAlunecare, OperatieAsezata, InmultireAsezata, SchimbRang, Gelosia, InmultireJaponeza, RANGURI };
