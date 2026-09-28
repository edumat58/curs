#!/usr/bin/env node
/**
 * Decide, o dată la construcție, care forme fără diacritice sunt cuvinte pe
 * care omul chiar voia să le scrie așa.
 *
 * ── Problema ───────────────────────────────────────────────────────────────
 *
 * Dicționarul hunspell ro_RO acceptă și scrierea fără semne — e făcut ca să nu
 * sublinieze cu roșu jumătate de internet românesc. Pentru el „patrat" și
 * „inmultire" sunt cuvinte la fel de bune ca „pătrat" și „înmulțire". Ceea ce
 * înseamnă că fiecare cheie de-asta iese AMBIGUĂ din lexicon, iar motorul, în
 * loc să corecteze pe loc, se oprește și întreabă. Pentru „patrat" e absurd:
 * nu există niciun context în care omul să fi vrut „patrat".
 *
 * ── De ce nu se rezolvă statistic ──────────────────────────────────────────
 *
 * Am încercat: raportul dintre aparițiile formei ASCII și ale celor cu semne,
 * în lista de frecvențe. Pe eșantionul de perechi unde forma ASCII sigur NU e
 * cuvânt, raportul are mediana 0,15 și percentila 90 la 1,00 — deci un prag pe
 * la 1,0 ar trebui să separe. Și chiar separă bine capetele: „in" iese 0,12 și
 * „si" iese 0,23 (corect: aproape nimeni nu vrea planta in sau nota si), iar
 * „patrat" iese 0,19 (corect: nimeni nu vrea „patrat").
 *
 * Dar cade fix la mijloc, unde ne doare: „masa" iese 0,96, sub prag, deci ar fi
 * șters — și am transforma „am pus farfuria pe masa" în „pe masă". „masa" e un
 * cuvânt cât se poate de real. Raportul nu-i de vină: subtitrările sunt scrise
 * majoritar fără diacritice, așa că aparițiile formei ASCII amestecă inseparabil
 * oamenii care voiau „masa" cu cei care voiau „masă" și n-aveau tastatura.
 *
 * ── Ce facem în schimb ─────────────────────────────────────────────────────
 *
 * Întrebarea e lexicală, nu statistică, așa că o punem ca atare — unui model,
 * o singură dată, la construcție. Și nu întrebăm „e «X» un cuvânt românesc?",
 * fiindcă răspunsul strict adevărat ne-ar încurca: „in" CHIAR e un cuvânt
 * (planta), doar că nimeni care tastează „in" nu se referă la ea. Întrebăm ce
 * ne interesează de fapt: „scriind fără diacritice, e plauzibil ca omul să fi
 * vrut exact forma asta?"
 *
 * Rezultatul e un fișier text, citibil și de corectat cu mâna. Odată scris, nu
 * se mai atinge nimeni de rețea: motorul rulează pur local.
 *
 * Rulare:  node scripts/diacritice/curata-ascii.mjs
 *          node scripts/diacritice/curata-ascii.mjs --reia   (ignoră ce e deja)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { cereGemini } from './gemini.mjs';

const AICI = path.dirname(fileURLToPath(import.meta.url));
const DATE = path.join(AICI, 'date');
const IESIRE = path.join(DATE, 'ascii-reale.txt');

const asteapta = (ms) => new Promise((gata) => { setTimeout(gata, ms); });

/** Câte chei clasificăm. Primele 800 acoperă 96% din aparițiile reale. */
const CATE = 800;

/** Într-un singur răspuns; mai mari încep să scape cuvinte nerăspunse. */
const PACHET = 40;

const INSTRUCTIUNI = `Ești lexicograf al limbii române.

Un om scrie text în română FĂRĂ să folosească diacritice (tastatură fără ele, grabă).
Pentru fiecare cuvânt din listă, spune dacă e PLAUZIBIL — în cel puțin ~5% din cazuri —
ca omul să fi vrut exact forma aceea, așa cum e scrisă, fără semne.

Răspunde "da" dacă forma fără semne e ea însăși un cuvânt românesc uzual.
Răspunde "nu" dacă e aproape sigur doar scrierea leneșă a unui cuvânt cu diacritice.

Cântărește TOATE sensurile și TOATE părțile de vorbire ale formei, nu doar pe cel
mai evident. Două capcane în care se cade ușor:

  · INFINITIVELE verbelor de conjugarea I se termină în „-a", iar persoana a III-a
    în „-ă". Amândouă sunt forme reale: „putem rezolva" și „el rezolvă".
  · SUBSTANTIVELE feminine articulate se termină în „-a", cele nearticulate în „-ă".
    Amândouă sunt forme reale: „masa din bucătărie" și „o masă".

Exemple:
  "fata"      -> da   (fata = copila, articulat; se scrie chiar așa)
  "masa"      -> da   (masa = mobila, articulat; „masă" e nearticulat)
  "peste"     -> da   (peste = prepoziția; „pește" e animalul)
  "sa"        -> da   (posesivul din „cartea sa"; „să" e conjuncția)
  "rezolva"   -> da   (infinitivul din „putem rezolva"; „rezolvă" e pers. a III-a)
  "forma"     -> da   (substantiv articulat și infinitiv; „formă" e nearticulat)
  "in"        -> nu   (planta „in" există, dar cine tastează „in" vrea „în")
  "si"        -> nu   (nota muzicală există, dar cine tastează „si" vrea „și")
  "dupa"      -> nu   (nu există niciun cuvânt „dupa"; e „după" fără semne)
  "patrat"    -> nu   (nu există; e „pătrat" scris fără semne)
  "inmultire" -> nu   (nu există; e „înmulțire" scris fără semne)
  "viata"     -> nu   (nu există; e „viață" scris fără semne)

Răspunde DOAR cu JSON: {"cuvant": "da"|"nu", ...}. Toate cuvintele primite, niciunul în plus.`;

function citesteFrecventele() {
  const cale = path.join(DATE, 'ro_full.txt');
  if (!fs.existsSync(cale)) throw new Error('Lipsește date/ro_full.txt — rulează întâi construieste-lexicon.mjs');

  const frecvente = new Map();
  for (const linie of fs.readFileSync(cale, 'utf8').split('\n')) {
    const spatiu = linie.lastIndexOf(' ');
    if (spatiu < 1) continue;
    const cuvant = linie.slice(0, spatiu).toLowerCase();
    frecvente.set(cuvant, (frecvente.get(cuvant) ?? 0) + (Number(linie.slice(spatiu + 1)) || 0));
  }
  return frecvente;
}

/**
 * Cheile care merită întrebate: cele ambigue unde forma ASCII e ea însăși unul
 * dintre candidați. Restul n-au ce clarifica. Le luăm în ordinea aparițiilor,
 * ca bugetul de întrebări să se ducă pe cuvintele care chiar se tastează.
 */
function cheiDeIntrebat(frecvente) {
  const cale = path.join(DATE, 'lexicon.txt');
  const chei = [];

  for (const linie of fs.readFileSync(cale, 'utf8').split('\n')) {
    const [cheie, forme] = linie.split('\t');
    if (!forme) continue;
    const lista = forme.split('|');
    if (lista.length > 1 && lista.includes(cheie)) chei.push(cheie);
  }

  chei.sort((a, b) => (frecvente.get(b) ?? 0) - (frecvente.get(a) ?? 0));
  return chei.slice(0, CATE);
}

function citesteRaspunsurileVechi() {
  if (!fs.existsSync(IESIRE)) return new Map();
  const vechi = new Map();
  for (const linie of fs.readFileSync(IESIRE, 'utf8').split('\n')) {
    if (!linie || linie.startsWith('#')) continue;
    const [cuvant, verdict] = linie.split('\t');
    if (cuvant && verdict) vechi.set(cuvant, verdict === 'da');
  }
  return vechi;
}

function scrie(raspunsuri) {
  const linii = [...raspunsuri.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'ro'))
    .map(([cuvant, real]) => `${cuvant}\t${real ? 'da' : 'nu'}`);

  fs.writeFileSync(IESIRE, [
    '# Forme fără diacritice care sunt ele însele cuvinte pe care omul chiar le-ar scrie așa.',
    '# „da" = păstrăm forma ASCII ca variantă posibilă (cheia rămâne ambiguă, se cere context).',
    '# „nu" = o scoatem; cheia devine neambiguă și motorul corectează pe loc, fără să întrebe.',
    '# Generat de scripts/diacritice/curata-ascii.mjs. Se poate corecta cu mâna oricând.',
    '',
    ...linii,
    '',
  ].join('\n'), 'utf8');
}

async function main() {
  const reia = process.argv.includes('--reia');
  const frecvente = citesteFrecventele();
  const chei = cheiDeIntrebat(frecvente);
  const raspunsuri = reia ? new Map() : citesteRaspunsurileVechi();

  const deIntrebat = chei.filter((cheie) => !raspunsuri.has(cheie));
  console.log(`${chei.length} chei de clarificat, ${raspunsuri.size} deja știute, ${deIntrebat.length} de întrebat.`);

  for (let i = 0; i < deIntrebat.length; i += PACHET) {
    const pachet = deIntrebat.slice(i, i + PACHET);
    const raspuns = await cereGemini({
      instructiuni: INSTRUCTIUNI,
      intrebare: JSON.stringify(pachet),
    });

    let primite = 0;
    for (const [cuvant, verdict] of Object.entries(raspuns ?? {})) {
      if (!pachet.includes(cuvant)) continue;
      raspunsuri.set(cuvant, String(verdict).toLowerCase().startsWith('da'));
      primite++;
    }

    scrie(raspunsuri);
    console.log(`  ${Math.min(i + PACHET, deIntrebat.length)}/${deIntrebat.length} — ${primite}/${pachet.length} clasificate`);

    /*
     * Nivelul gratuit limitează cererile pe MINUT, nu doar pe zi. Fără pauza
     * asta, prima rulare a mers zece pachete în câteva secunde și apoi a lovit
     * 429 la 640 din 800. Mergem cu răbdare: e un script de construcție care se
     * rulează o dată, nu ceva ce așteaptă cineva.
     */
    if (i + PACHET < deIntrebat.length) await asteapta(5000);
  }

  const reale = [...raspunsuri.values()].filter(Boolean).length;
  console.log(`\n${raspunsuri.size} chei clasificate: ${reale} forme ASCII reale, ${raspunsuri.size - reale} doar scriere fără semne.`);
  console.log(`Scris ${IESIRE}`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
