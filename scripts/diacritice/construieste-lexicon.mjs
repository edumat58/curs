#!/usr/bin/env node
/**
 * Construiește lexiconul de diacritice pornind de la dicționarul hunspell ro_RO.
 *
 * Ideea centrală: restaurarea diacriticelor e o căutare INVERSĂ. Omul tastează
 * „impartirea"; noi vrem să știm ce cuvinte românești reale se scriu așa după ce
 * le scoți diacriticele. Deci cheia hărții e forma DEZBRĂCATĂ, iar valoarea e
 * lista formelor reale care se pliază pe ea.
 *
 * De unde vin cuvintele: `@cspell/dict-ro-ro` împachetează dicționarul hunspell
 * ro_RO (rospell) deja DESFĂCUT — adică toate formele flexionare, nu doar
 * rădăcinile. Sunt 1.213.189 de forme. Dacă am fi pornit din fișierele `.dic`+
 * `.aff` brute, ar fi trebuit să implementăm expandarea afixelor hunspell, care
 * pentru română înseamnă sute de reguli de flexiune — muncă multă și o sursă
 * bogată de greșeli. Trie-ul cspell ne scutește de tot pasul ăsta.
 *
 * Ce iese: `date/lexicon.txt`, SORTAT, o intrare pe linie:
 *
 *     impartirea\tîmpărțirea
 *     fata\tfata|fată|fața|față
 *
 * Sortat, pentru că motorul nu-l încarcă într-un Map. Un Map cu sute de mii de
 * chei ar mânca 150–200 MB în procesul de extensie al VS Code, ceea ce e mult
 * pentru un editor care mai are de făcut și altceva. În schimb, motorul ține
 * fișierul ca Buffer brut (doar octeți) și caută binar în el: ~20 de comparații
 * per cuvânt, fiecare uitându-se la câteva zeci de octeți. E mai rapid decât
 * construirea Map-ului și costă de zece ori mai puțină memorie.
 *
 * ── De ce mai avem nevoie de o listă de frecvențe ──────────────────────────
 *
 * Dicționarul hunspell e o listă de cuvinte ACCEPTABILE, nu de cuvinte
 * PROBABILE, iar pentru noi diferența e totul. Două defecte îl fac inutilizabil
 * singur:
 *
 *  1. Tolerează scrierea fără diacritice. „patrat" și „inmultire" sunt intrări
 *     valide în rospell — dicționarul e făcut să nu-i sublinieze cu roșu pe cei
 *     care scriu fără semne. Pentru noi asta înseamnă că nu ne poate spune
 *     niciodată „«patrat» e greșit, trebuie «pătrat»".
 *  2. Pune pe același plan cuvinte uzuale și forme flexionare pe care nu le
 *     scrie nimeni. Cheia „fata" primește 12 candidați, printre care „fâță",
 *     „făța", „fătă" — forme reale, dar cu zero apariții în limba vie. Trimise
 *     la dezambiguizare, sunt doar zgomot care strică decizia.
 *
 * Lista de frecvențe (OpenSubtitles, prin hermitdave/FrequencyWords) taie
 * ambele. ATENȚIE însă la felul în care o folosim: în subtitrări româna e
 * scrisă majoritar FĂRĂ diacritice — „si" apare de 1.078.118 ori, „și" doar de
 * 392.140; „tara" îl bate pe „țara" de opt ori. Frecvența brută împinge deci
 * exact în direcția greșită.
 *
 * De aceea frecvența e folosită AICI DOAR ca să TAIE candidații inexistenți
 * (zero apariții), niciodată ca să ALEAGĂ între variante plauzibile. Alegerea
 * între „fata" și „fată" se face la rulare, din context, în `motor.mjs`.
 *
 * Rulare:  node scripts/diacritice/construieste-lexicon.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import { decodeTrie } from 'cspell-trie-lib';

import { construiesteCorpus } from './corpus.mjs';

const require = createRequire(import.meta.url);
const AICI = path.dirname(fileURLToPath(import.meta.url));
const DATE = path.join(AICI, 'date');
const RADACINA = path.resolve(AICI, '..', '..');

/**
 * Literele românești cu semne și corespondentul lor fără semne.
 *
 * Sunt trecute AICI, explicit, și nu prin `String.normalize('NFD')` fiindcă
 * NFD nu descompune „ș" și „ț" în literă + virgulă dedesubt în toate variantele
 * Unicode. Româna are în circulație două perechi aproape identice: cele corecte,
 * cu VIRGULĂ dedesubt (U+0219 ș, U+021B ț), și cele greșite, cu SEDILĂ
 * (U+015F ş, U+0163 ţ), moștenite din fonturile vechi Windows. Dicționarul
 * folosește virgula; texte copiate de pe web vin adesea cu sedila. Le tratăm pe
 * ambele ca fiind „s" și „t", ca să nu ratăm potrivirea.
 */
const SEMNE = new Map(Object.entries({
  ă: 'a', â: 'a', î: 'i', ș: 's', ț: 't',
  Ă: 'A', Â: 'A', Î: 'I', Ș: 'S', Ț: 'T',
  ş: 's', ţ: 't', Ş: 'S', Ţ: 'T',
}));

/** Scoate semnele diacritice românești, păstrând restul literelor neatinse. */
export function dezbraca(cuvant) {
  let iesire = '';
  for (const litera of cuvant) iesire += SEMNE.get(litera) ?? litera;
  return iesire;
}

/**
 * Trie-ul cspell amestecă printre cuvinte și intrări de serviciu: cele cu `~`
 * sunt indexul insensibil la majuscule (duplicate normalizate), `!` marchează
 * cuvinte interzise, iar `+` marchează bucăți de compunere care nu stau singure.
 * Niciuna nu e un cuvânt pe care l-ar tasta un om, deci le aruncăm.
 */
function esteCuvantAdevarat(cuvant) {
  if (!cuvant || /[~!+*]/.test(cuvant)) return false;
  // Doar litere românești, cratimă și apostrof: „nu-i", „într-un", „s-au".
  return /^[a-zA-ZăâîșțĂÂÎȘȚşţŞŢ]+(?:[-'’][a-zA-ZăâîșțĂÂÎȘȚşţŞŢ]+)*$/.test(cuvant);
}

/**
 * Pachetul `@cspell/dict-ro-ro` își expune prin `exports` DOAR manifestul
 * `cspell-ext.json`; trie-ul propriu-zis e blocat pentru `require.resolve`
 * direct. Așa că rezolvăm manifestul — singura poartă deschisă — și citim din
 * el calea declarată a dicționarului, relativ la folderul pachetului.
 */
function caleaTrieului() {
  const caleManifest = require.resolve('@cspell/dict-ro-ro/cspell-ext.json');
  const manifest = JSON.parse(fs.readFileSync(caleManifest, 'utf8'));
  const declarat = manifest.dictionaryDefinitions?.[0]?.path;
  return path.resolve(path.dirname(caleManifest), declarat || './dict/ro-ro.trie');
}

function citesteCuvinteleDictionarului() {
  const trie = decodeTrie(fs.readFileSync(caleaTrieului(), 'utf8'));

  // Cheie dezbrăcată și minusculă → mulțimea formelor reale.
  const harta = new Map();
  let citite = 0;

  for (const cuvant of trie.words()) {
    citite++;
    if (!esteCuvantAdevarat(cuvant)) continue;

    /*
     * Coborâm totul la minuscule și lăsăm „Față"/„față" să se contopească.
     * Majuscula nu schimbă NICIODATĂ ce diacritice poartă un cuvânt, deci ca
     * variantă distinctă e pură dublură: umfla lista de candidați a lui „fata"
     * de la 6 la 12 și ar fi cerut modelului să aleagă între „Fața" și „fața",
     * o întrebare fără sens. Motorul reașază la rulare majuscula tastată de om.
     */
    const forma = cuvant.toLowerCase();
    const cheie = dezbraca(forma);
    let forme = harta.get(cheie);
    if (!forme) harta.set(cheie, (forme = new Set()));
    forme.add(forma);
  }

  return { harta, citite };
}

const ADRESA_FRECVENTE = 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/ro/ro_full.txt';

/**
 * Lista de frecvențe e de 15 MB și se schimbă o dată la câțiva ani, așa că o
 * ținem în cache local. Nu intră în git (vezi `date/.gitignore`): e o unealtă
 * de construcție, nu un rezultat, iar ce contează din ea ajunge oricum topit în
 * `lexicon.txt`.
 */
async function citesteFrecventele() {
  const cale = path.join(DATE, 'ro_full.txt');

  if (!fs.existsSync(cale)) {
    console.log('  descarc lista de frecvențe (15 MB, o singură dată)…');
    const raspuns = await fetch(ADRESA_FRECVENTE);
    if (!raspuns.ok) throw new Error(`Nu pot descărca frecvențele: HTTP ${raspuns.status}`);
    fs.mkdirSync(DATE, { recursive: true });
    fs.writeFileSync(cale, Buffer.from(await raspuns.arrayBuffer()));
  }

  const frecvente = new Map();
  for (const linie of fs.readFileSync(cale, 'utf8').split('\n')) {
    const spatiu = linie.lastIndexOf(' ');
    if (spatiu < 1) continue;
    const cuvant = linie.slice(0, spatiu).toLowerCase();
    const numar = Number(linie.slice(spatiu + 1));
    if (!Number.isFinite(numar)) continue;
    frecvente.set(cuvant, (frecvente.get(cuvant) ?? 0) + numar);
  }
  return frecvente;
}

/**
 * Decide dacă forma FĂRĂ diacritice merită păstrată ca variantă posibilă.
 *
 * Miza: dacă o păstrăm, cheia rămâne ambiguă și motorul se oprește să întrebe;
 * dacă o scoatem, motorul corectează pe loc, tăcut. Pentru „patrat" vrem s-o
 * scoatem (nimeni nu vrea „patrat"), pentru „masa" vrem s-o păstrăm.
 *
 * Verdictele clasificate în `ascii-reale.txt` bat orice. Pentru coada
 * neclasificată — cuvinte rare, sub primele 800 după apariții — folosim o
 * regulă morfologică în locul unei ghiciri:
 *
 *   Dacă singura deosebire față de o formă cu semne e „a" final devenit „ă",
 *   păstrăm forma ASCII.
 *
 * Tiparul „-a / -ă" e chiar cel care deosebește în română infinitivul de
 * persoana a III-a („putem rezolva" / „el rezolvă") și substantivul feminin
 * articulat de cel nearticulat („masa" / „o masă"). În ambele cazuri AMBELE
 * forme sunt reale, deci trebuie păstrate amândouă. Când deosebirea e altundeva
 * — „viata"/„viață" are și „t"→„ț", „inmultire"/„înmulțire" are „i"→„î" — forma
 * ASCII n-are cum să fie altceva decât scriere fără semne, și o scoatem.
 *
 * Regula greșește în direcția SIGURĂ: dacă păstrează din prudență o formă care
 * nu e cuvânt („dupa"), rezultatul e o subliniere în plus, nu un text stricat.
 */
function formaAsciiEsteCuvant(cheie, forme, verdicte) {
  const verdict = verdicte.get(cheie);
  if (verdict !== undefined) return verdict;
  if (!cheie.endsWith('a')) return false;

  const radacina = cheie.slice(0, -1);
  return forme.some((forma) => forma === `${radacina}ă`);
}

/** Sub atâtea apariții în corpusul general, o formă e literă moartă. */
const PRAG_APARITII = 50;

/** Și oricât de des ar apărea, sub a suta parte din fruntașă nu mai contează. */
const PRAG_RELATIV = 1 / 200;

/** Peste atâția candidați, întrebarea pusă modelului devine zgomot. */
const CANDIDATI_MAXIM = 5;

/**
 * Păstrăm doar intrările care ne pot spune ceva, și din ele doar formele pe
 * care le-ar scrie cineva.
 *
 * Dacă singura formă a unei chei e chiar cheia („carte" → {„carte"}), n-avem ce
 * restaura: aproape jumătate din dicționar e așa, iar liniile alea ar fi
 * greutate moartă. Motorul citește absența din fișier ca „cuvântul e corect".
 *
 * Tăierea pe frecvență lucrează pe grupul de candidați, nu pe cuvinte izolate.
 * Un cuvânt rar care e SINGURUL candidat al cheii lui rămâne întotdeauna —
 * altfel am pierde exact termenii tehnici pe care omul îi scrie cel mai des
 * („ipotenuză", „împărțitor"). Tăiem doar cozile unui grup care are oricum un
 * fruntaș limpede.
 */
function pastreazaDoarIntrarileUtile(harta, frecvente, dinLectii, verdicte) {
  const utile = [];
  let taiate = 0;
  let asciiScoase = 0;

  for (const [cheie, forme] of harta) {
    let lista = [...forme];
    if (!lista.some((forma) => dezbraca(forma) !== forma)) continue;

    const aparitii = (forma) => frecvente.get(forma) ?? 0;
    lista.sort((a, b) => aparitii(b) - aparitii(a) || a.localeCompare(b, 'ro'));

    /*
     * ORDINEA celor doi pași de mai jos contează, și am aflat-o pe pielea
     * noastră. Prima variantă scotea forma ASCII ÎNAINTE de tăierea formelor
     * improbabile, iar rezultatul a fost că „cartea" devenea „cârtea" și
     * „este" devenea „ește" — cuvintele cele mai banale din limbă, stricate.
     *
     * Mecanismul: cheia „este" are în dicționar și forma regională „ește", cu
     * zero apariții. Scoțând întâi „este" (formă fără semne, neclasificată),
     * rămânea „ește" singur, devenea automat fruntașul listei și scăpa
     * neatins de tăierea de după — care păstrează mereu fruntașul.
     *
     * Tăiem deci ÎNTÂI formele improbabile. Atunci „ește" pică (zero apariții
     * față de milioanele lui „este"), rămâne doar „este", cheia n-are nicio
     * formă cu diacritice și iese cu totul din lexicon — adică exact ce
     * trebuie: un cuvânt corect pe care motorul nu-l va atinge niciodată.
     */
    if (lista.length > 1) {
      const varf = aparitii(lista[0]);
      const inainte = lista.length;
      lista = lista.filter((forma, pozitie) => (
        pozitie === 0
        // Un cuvânt din lecțiile tale e prin definiție unul pe care-l scrii.
        || dinLectii.has(forma)
        || (aparitii(forma) >= PRAG_APARITII && aparitii(forma) >= varf * PRAG_RELATIV)
      )).slice(0, CANDIDATI_MAXIM);
      taiate += inainte - lista.length;
    }

    // Abia acum scoatem forma fără semne, dacă nu e cuvânt în sine: cheia
    // devine neambiguă și motorul corectează pe loc, fără să mai întrebe.
    if (lista.includes(cheie) && lista.length > 1 && !formaAsciiEsteCuvant(cheie, lista, verdicte)) {
      lista = lista.filter((forma) => forma !== cheie);
      asciiScoase++;
    }

    // Dacă după toate tăierile n-a mai rămas nicio formă cu semne, n-avem ce
    // restaura: cuvântul tastat era deja cel corect.
    if (!lista.some((forma) => dezbraca(forma) !== forma)) continue;

    utile.push(`${cheie}\t${lista.join('|')}`);
  }

  // Sortare BINARĂ, pe octeți, nu după regulile limbii române. Motorul caută cu
  // `Buffer.compare`, deci fișierul trebuie ordonat exact cum compară el; un
  // `localeCompare` aici ar pune „ă" lângă „a" și căutarea binară ar rata.
  utile.sort();
  return { utile, taiate, asciiScoase };
}

/** Verdictele scrise de `curata-ascii.mjs`; lipsa lor nu oprește construcția. */
function citesteVerdictele() {
  const cale = path.join(DATE, 'ascii-reale.txt');
  const verdicte = new Map();
  if (!fs.existsSync(cale)) return verdicte;

  for (const linie of fs.readFileSync(cale, 'utf8').split('\n')) {
    if (!linie || linie.startsWith('#')) continue;
    const [cuvant, verdict] = linie.split('\t');
    if (cuvant && verdict) verdicte.set(cuvant, verdict === 'da');
  }
  return verdicte;
}

async function main() {
  console.log('Citesc lecțiile tale, ca listă de protecție…');
  const { unigrame, fisiere, total } = construiesteCorpus(RADACINA);
  console.log(`  ${fisiere} fișiere, ${total.toLocaleString('ro')} cuvinte, ${unigrame.size.toLocaleString('ro')} distincte`);

  console.log('Citesc lista de frecvențe…');
  const frecvente = await citesteFrecventele();
  console.log(`  ${frecvente.size.toLocaleString('ro')} cuvinte cu apariții numărate`);

  console.log('Citesc dicționarul hunspell ro_RO din @cspell/dict-ro-ro…');
  const { harta, citite } = citesteCuvinteleDictionarului();
  console.log(`  ${citite.toLocaleString('ro')} intrări în trie`);
  console.log(`  ${harta.size.toLocaleString('ro')} chei dezbrăcate distincte`);

  const verdicte = citesteVerdictele();
  console.log(`  ${verdicte.size} forme ASCII clasificate cu mâna sau de model`);

  const { utile, taiate, asciiScoase } = pastreazaDoarIntrarileUtile(
    harta, frecvente, new Set(unigrame.keys()), verdicte,
  );
  const ambigue = utile.filter((linie) => linie.includes('|')).length;
  console.log(`  ${asciiScoase.toLocaleString('ro')} forme fără semne scoase (nu erau cuvinte în sine)`);

  fs.mkdirSync(DATE, { recursive: true });
  const cale = path.join(DATE, 'lexicon.txt');
  fs.writeFileSync(cale, `${utile.join('\n')}\n`, 'utf8');

  const marime = fs.statSync(cale).size;
  console.log(`  ${taiate.toLocaleString('ro')} forme improbabile tăiate din grupuri`);
  console.log(`  ${utile.length.toLocaleString('ro')} chei păstrate (restul n-au diacritice de pus)`);
  console.log(`  ${ambigue.toLocaleString('ro')} chei rămân AMBIGUE → ${(100 * ambigue / utile.length).toFixed(1)}%`);
  console.log(`\nScris ${cale} — ${(marime / 1024 / 1024).toFixed(1)} MB`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
