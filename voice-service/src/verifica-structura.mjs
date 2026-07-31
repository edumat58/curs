/**
 * Verificatorul de STRUCTURĂ al unui transcript: fiecare secțiune vorbește
 * despre conținutul EI.
 *
 * Defectul pe care îl prinde e unul observat pe lecții reale: materialul are un
 * exemplu în prima secțiune și altul în a doua, iar transcriptul repetă
 * exemplul primei secțiuni și în a doua. Textul sună bine, poarta de calitate
 * trece — dar elevul primește aceeași socoteală de două ori și pe a doua
 * niciodată.
 *
 * Cum îl prinde: numerele nu mint. Exemplele de matematică sunt făcute din
 * numere, iar numerele unei secțiuni din material trebuie să apară în ACEEAȘI
 * secțiune a transcriptului. Se măsoară acoperirea numerelor pe fiecare
 * secțiune în parte, nu pe tot textul — pe tot textul, exemplul rătăcit ar
 * trece neobservat.
 *
 *   node src/verifica-structura.mjs transcripts/c6/modul-1/01.md
 *   node src/verifica-structura.mjs --toate        # tot depozitul
 *
 * Iese cu cod 1 dacă ceva nu e în regulă; raportul spune exact ce lipsește.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { curataSursa } from './pipeline/prompts.mjs';
import { toSpeakable } from './pipeline/speakable.mjs';

const RADACINA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Frontmatter YAML simplu: chei scalare + o listă de titluri. */
export function citesteTranscript(cale) {
  const brut = fs.readFileSync(cale, 'utf8');
  const m = /^---\n([\s\S]*?)\n---\n/.exec(brut);
  if (!m) throw new Error(`${cale}: lipsește frontmatter-ul`);
  const meta = { titluri: [] };
  for (const linie of m[1].split('\n')) {
    const kv = /^(\w+):\s*(.*)$/.exec(linie);
    if (kv && kv[2]) meta[kv[1]] = kv[2].startsWith('"') ? JSON.parse(kv[2]) : kv[2];
    const item = /^\s+-\s+(.*)$/.exec(linie);
    if (item) meta.titluri.push(item[1].startsWith('"') ? JSON.parse(item[1]) : item[1]);
  }
  return { meta, text: brut.slice(m[0].length).trim() };
}

const norm = (x) => String(x).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^\p{L}\d ]/gu, ' ').replace(/\s+/g, ' ').trim();

/**
 * Numerele dintr-un text, normalizate: separatorii de mii dispar („3 850",
 * „3\,850" → „3850"), zecimalele rămân cu virgulă. Numerele din titluri de
 * lecție (C5.1) nu sunt exemple — le sare cine ne dă corpul secțiunii.
 */
const CUVINTE_NUMAR = {
  zero: '0', unu: '1', una: '1', doi: '2', două: '2', doua: '2', trei: '3',
  patru: '4', cinci: '5', șase: '6', sase: '6', șapte: '7', sapte: '7',
  opt: '8', nouă: '9', noua: '9', zece: '10', unsprezece: '11', doisprezece: '12',
  douăsprezece: '12', treisprezece: '13', paisprezece: '14', cincisprezece: '15',
  șaisprezece: '16', șaptesprezece: '17', optsprezece: '18', nouăsprezece: '19', douăzeci: '20',
};

export function numereDin(text) {
  const curat = String(text)
    /**
     * Spațierile LaTeX („\\[20pt]", „\\[8pt]") sunt așezare în pagină, nu
     * conținut — aceeași speță ca atributele de stil: numerele lor sunt
     * puncte tipografice, nu exemple. Lăsate în text, fiecare secțiune cu un
     * bloc KaTeX aerisit părea să „ceară" transcriptului numerele 20, 10, 8.
     */
    .replace(/\\+\[\s*-?[\d.]+\s*(?:pt|em|ex|mu|cm|mm|in|bp)\s*\]/g, ' ')
    .replace(/\\,/g, '')
    .replace(/(\d)[\s.](?=\d{3}\b)/g, '$1')
    .replace(/(\d)\{,\}(\d)/g, '$1,$2')
    // Numeralele în litere sunt tot numere: transcriptul scrie firesc „trei
    // divizori" unde sursa are „3 divizori" — nu e o lipsă, e ortografie.
    .replace(/\b(\p{L}+)\b/gu, (cuv) => CUVINTE_NUMAR[cuv.toLowerCase()] || cuv)
    // Numerele de ordine ale pașilor („1. Căutăm", „| 2. Concluzie |") sunt
    // etichete de listă, nu conținut.
    .replace(/^\s*\d+\.\s/gm, ' ')
    .replace(/\|\s*\d+\.\s/g, '| ');
  const gasite = curat.match(/\d+(?:,\d+)?/g) || [];
  return gasite;
}

/** Taie textul în secțiuni după titluri, în ordinea lor. */
export function inSectiuni(text, titluri) {
  const corp = norm(text);
  const pozitii = [];
  let cursor = 0;
  for (const t of titluri) {
    const p = corp.indexOf(norm(t), cursor);
    if (p < 0) return null;
    pozitii.push(p);
    cursor = p + 1;
  }
  // Ca să tăiem textul REAL (nu forma normalizată), refacem pozițiile aproximativ:
  // normalizarea păstrează ordinea, deci căutăm titlurile și în textul brut.
  const sectiuni = [];
  let cursorBrut = 0;
  for (let i = 0; i < titluri.length; i += 1) {
    /**
     * Dolarul se potrivește și dublat: în sursă, o formulă din titlu poate fi
     * scrisă `$$...$$` (pe rând separat), iar în transcript `$...$` — aceeași
     * formulă, altă scriere. Fără toleranța asta, titlul nu era găsit în textul
     * brut, secțiunea începea unde se terminase cea dinainte și înghițea corpul
     * ei; verificatorul raporta apoi că exemplul „lipsește" din secțiunea greșită.
     */
    const tipar = titluri[i]
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\s+/g, '\\s+')
      .replace(/\\\$/g, '\\$+');
    const re = new RegExp(tipar, 'i');
    const m = re.exec(text.slice(cursorBrut));
    const start = m ? cursorBrut + m.index : cursorBrut;
    if (i > 0) sectiuni[i - 1].pana = start;
    sectiuni.push({ titlu: titluri[i], dela: start, pana: text.length });
    cursorBrut = start + titluri[i].length;
  }
  return sectiuni.map((s) => ({ titlu: s.titlu, corp: text.slice(s.dela, s.pana) }));
}

/** Titlurile reale ale unei lecții, ca în poarta serviciului. */
export function titluriDinSursa(mdxCurat) {
  return [...mdxCurat.matchAll(/^#{2,4}\s+(.+?)\s*$/gm)]
    .map((m) => m[1].replace(/\*\*/g, '').trim())
    .filter((t) => t.length > 1);
}

export function verifica(caleTranscript) {
  const { meta, text } = citesteTranscript(caleTranscript);
  const probleme = [];
  const avertismente = [];

  const caleSursa = path.join(RADACINA, meta.sursa || '');
  if (!meta.sursa || !fs.existsSync(caleSursa)) {
    return { probleme: [`sursa lipsește: ${meta.sursa}`], avertismente };
  }
  /**
   * Etichetele casetelor („:::tip Definiție 2", „:::note Exemplu 1") nu sunt
   * conținut: numărul lor e un număr de ordine, nu un exemplu. Lăsate în text,
   * fiecare secțiune părea să „aibă" numerele 1, 2, 3 din propriile etichete.
   */
  const sursa = curataSursa(fs.readFileSync(caleSursa, 'utf8'))
    .replace(/^:{3,}\s*\S.*$/gm, '')
    .replace(/^\|[-\s|:]+\|$/gm, '')
    /**
     * Atributele de stil și marcajul de așezare („style={{ gap: '3rem',
     * color: '#228B22', height: '200px' }}", `<div>`, `<h3>`) sunt decor, nu
     * conținut: numerele lor sunt pixeli și coduri de culoare, nu exemple —
     * nu au ce căuta printre numerele cerute transcriptului.
     */
    .replace(/\s+style=\{\{[^}]*\}\}/g, '')
    /**
     * Comentariile JSX („{/* Figura 14a *\/}") sunt note pentru dezvoltator,
     * nu conținut: numărul figurii nu se rostește niciodată — transcriptul
     * nici nu are voie să pomenească figura ca obiect.
     */
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/<\/?(?:div|span|p|section|h[1-6]|br|hr)\b[^>]*\/?>/gi, ' ')
    /**
     * Îngroșarea Markdown e tot decor: titlurile ca „## Metoda 1 — Calculul
     * **cantității finale**" trebuie găsite de tăietorul de secțiuni exact cum
     * le rostește transcriptul (fără asteriscuri) — la fel cum le curăță deja
     * titluriDinSursa(). Lăsate în text, titlul nu se mai găsește și secțiunile
     * se taie aiurea.
     */
    .replace(/\*\*/g, '');
  const titluri = meta.titluri.length ? meta.titluri : titluriDinSursa(sursa);

  // 1. Titlul lecției e primul lucru rostit.
  if (meta.titlu && !norm(text).startsWith(norm(meta.titlu).slice(0, 20))) {
    probleme.push('textul nu începe cu titlul lecției');
  }

  // 2. Toate secțiunile, în ordinea materialului.
  const sectTrans = inSectiuni(text, titluri);
  if (!sectTrans) {
    let cursor = 0; const lipsesc = [];
    for (const t of titluri) {
      const p = norm(text).indexOf(norm(t), cursor);
      if (p < 0) lipsesc.push(t); else cursor = p + 1;
    }
    probleme.push(`secțiuni lipsă sau în altă ordine: ${lipsesc.join(' | ') || '(ordine greșită)'}`);
  }

  // 3. Structura pe NUMERE: exemplele fiecărei secțiuni stau în secțiunea lor.
  const sectSursa = inSectiuni(sursa, titluri);
  if (sectTrans && sectSursa) {
    for (let i = 0; i < titluri.length; i += 1) {
      /**
       * Numerele din blocurile [FIGURĂ:] nu se cer în transcript: reperele
       * unei drepte numerice sau gradațiile unei axe se VĂD pe ecran, nu se
       * recită. Ce e didactic din figură a ajuns deja în faptele ei.
       */
      /**
       * Numerele care nu sunt conținut: legenda unei figuri („Fig. 1"), numărul
       * ei de ordine. Nu se rostesc — vorbim despre ce ARATĂ desenul, nu despre
       * al câtelea e — dar, numărate, făceau secțiunea să pară că a pierdut
       * exemple pe care nu le-a avut niciodată.
       */
      const fara = sectSursa[i].corp
        .replace(/\[FIGURĂ:[\s\S]*?\n\]/g, ' ')
        .replace(/\bfig(?:ura)?\.?\s*\d+/gi, ' ')
        // Numerotarea nu e conținut: „Exemplul 3", „Problema 2", „Pasul 1".
        // Ele spun al câtelea e ceva, nu ce anume — iar cerute, făceau
        // secțiunea să pară că a pierdut un exemplu pe care îl are întreg.
        .replace(/\b(exemplul|exemplu|problema|pasul|etapa|cazul|definiția|observația|proprietatea|metoda)\s*\d+/gi, ' ');
      const aleSursei = numereDin(fara);
      if (!aleSursei.length) continue;
      const aleTrans = new Set(numereDin(sectTrans[i].corp));
      const lipsesc = [...new Set(aleSursei)].filter((n) => !aleTrans.has(n));
      const acoperire = 1 - lipsesc.length / new Set(aleSursei).size;
      if (acoperire < 0.85) {
        probleme.push(`„${titluri[i]}": lipsesc numerele ${lipsesc.slice(0, 8).join(', ')} — exemplul secțiunii nu e acolo (acoperire ${(acoperire * 100).toFixed(0)}%)`);
      } else if (lipsesc.length) {
        avertismente.push(`„${titluri[i]}": fără ${lipsesc.slice(0, 5).join(', ')}`);
      }
    }
  }

  // 3b. FORMULELE: unde materialul are matematică scrisă, transcriptul o are
  // ca formulă KaTeX, nu povestită în cuvinte. „m unghiului A O B" scris în
  // text simplu e exact defectul reclamat: se pierde randarea și dispare
  // notația pe care elevul trebuie să o vadă.
  const formuleDin = (t) => (t.match(/\$[^$\n]+\$/g) || []).length
    + (t.match(/String\.raw`[^`]*`/g) || []).length;
  if (sectTrans && sectSursa) {
    for (let i = 0; i < titluri.length; i += 1) {
      const inSursa = formuleDin(sectSursa[i].corp);
      const inTrans = (sectTrans[i].corp.match(/\$[^$\n]+\$/g) || []).length;
      if (inSursa >= 1 && inTrans === 0) {
        probleme.push(`„${titluri[i]}": materialul are ${inSursa} formule, transcriptul niciuna — matematica s-a pierdut sau e povestită în cuvinte`);
      } else if (inSursa >= 4 && inTrans < Math.ceil(inSursa * 0.4)) {
        avertismente.push(`„${titluri[i]}": ${inSursa} formule în material, doar ${inTrans} în transcript`);
      }
    }
  }
  const notatiiInCuvinte = text.replace(/\$[^$\n]+\$/g, ' ')
    .match(/\b(?:măsura|m)\s+unghiului\s+[A-Z](?:\s+[A-Z]){1,3}\b|\bunghiul\s+[A-Z](?:\s+[A-Z]){2}\s+egal cu\b/g);
  if (notatiiInCuvinte) {
    probleme.push(`notație matematică scrisă în cuvinte în loc de formulă: ${[...new Set(notatiiInCuvinte)].slice(0, 3).join(' | ')}`);
  }

  // 4. Curățenia textului stocat — aceleași reguli ca poarta serviciului.
  const faraFormule = text.replace(/\$[^$\n]+\$/g, ' ');
  const latex = faraFormule.match(/\\[a-zA-Z]{2,}/g);
  if (latex) probleme.push(`LaTeX în afara formulelor: ${[...new Set(latex)].slice(0, 5).join(' ')}`);
  if (/<[A-Za-z][A-Za-z0-9\s]{4,}>/.test(text)) probleme.push('marcaj lung <...>');
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text)) probleme.push('caractere de control');
  if (/\b(be|capa|igrec|ics|zet)\b/i.test(faraFormule)) probleme.push('nume fonetice de litere în textul scris');
  /**
   * „Imaginea" e și termen matematic, nu doar poză: imaginea lui <x> printr-o
   * funcție, imaginea unui punct printr-o simetrie. Cerem context de desen —
   * altfel lecția de funcții era semnalată la fiecare frază despre imagini.
   */
  const desen = /\bfigur[ăa]\b|\bdesenul\b|\bimaginea de (?:mai sus|alături)\b|\bîn imagine\b|\bimaginea al[ăa]turat[ăa]\b/i;
  if (desen.test(faraFormule)) avertismente.push('pomenește figura ca obiect');

  // 5. Conversia la rostire nu lasă nimic în urmă.
  const rostit = toSpeakable(text);
  const reziduu = rostit.match(/\\[a-zA-Z]{2,}|\$|\^|(?<!\d)[{}](?!\d)/g);
  if (reziduu) probleme.push(`rămân semne nerostite: ${[...new Set(reziduu)].slice(0, 6).join(' ')}`);

  return { probleme, avertismente };
}

// ─── rulare directă ───
const eDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (eDirect) {
  const tinte = process.argv.includes('--toate')
    ? (function aduna(d) {
        return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
          const p = path.join(d, e.name);
          // STIL.md e ghidul, nu un transcript.
          return e.isDirectory() ? aduna(p) : (e.name.endsWith('.md') && e.name !== 'STIL.md' ? [p] : []);
        });
      })(path.join(RADACINA, 'transcripts'))
    : process.argv.slice(2).filter((a) => !a.startsWith('-'));

  let cazute = 0;
  for (const t of tinte) {
    const { probleme, avertismente } = verifica(t);
    const rel = path.relative(RADACINA, t);
    if (probleme.length) {
      cazute += 1;
      console.log(`✗ ${rel}`);
      probleme.forEach((p) => console.log(`    ${p}`));
    } else {
      console.log(`✓ ${rel}${avertismente.length ? '  (' + avertismente.length + ' avertismente)' : ''}`);
    }
    avertismente.forEach((a) => console.log(`    ~ ${a}`));
  }
  console.log(`\n${tinte.length - cazute}/${tinte.length} curate`);
  process.exit(cazute ? 1 : 0);
}
