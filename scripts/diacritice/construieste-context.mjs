#!/usr/bin/env node
/**
 * Modelul local de context: ce vecini are fiecare formă ambiguă în lecțiile tale.
 *
 * ── De ce ne trebuie, dacă avem Gemini ─────────────────────────────────────
 *
 * Din cauza cotei. Nivelul gratuit taie cererile pe MINUT, nu doar pe zi — la
 * construirea listei de forme ASCII am lovit 429 după vreo șaisprezece cereri
 * trimise una după alta. Un editor care întreabă modelul la fiecare propoziție
 * ar consuma cota în câteva minute de scris și ar rămâne apoi mut exact când
 * omul e în ritm.
 *
 * Așa că punem în față un model local ieftin. Nu trebuie să fie deștept, doar
 * să prindă cazurile limpezi: după „putem" vine „rezolva", nu „rezolvă"; după
 * „o" vine „masă", nu „masa". Ce rămâne cu adevărat neclar se duce la Gemini.
 *
 * ── Ce numărăm ─────────────────────────────────────────────────────────────
 *
 * Perechi de cuvinte vecine, dar DOAR cele care ating o formă ambiguă. Restul
 * ar umfla fișierul fără să ne folosească vreodată: nu vom întreba niciodată
 * „ce vine după «împărțire»", fiindcă „impartire" n-are variante între care să
 * alegem. Din ~64.000 de cuvinte rămân câteva mii de perechi utile.
 *
 * ── Cât de mult să ne bazăm pe el ──────────────────────────────────────────
 *
 * Corpusul e mic — 64.000 de cuvinte, cât un roman scurt. E de ajuns pentru
 * tipare frecvente și prea puțin pentru restul, așa că modelul are voie să
 * decidă numai când e limpede: vezi `PRAG_INCREDERE` în `context.mjs`. Când nu
 * e, tace și lasă întrebarea mai departe. Un model mic care știe când să tacă e
 * folositor; unul care ghicește ar fi mai rău decât niciunul.
 *
 * Rulare:  node scripts/diacritice/construieste-context.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { construiesteCorpus } from './corpus.mjs';
import { Lexicon, dezbraca } from './motor.mjs';

const AICI = path.dirname(fileURLToPath(import.meta.url));
const DATE = path.join(AICI, 'date');
const RADACINA = path.resolve(AICI, '..', '..');

/** Sub atâtea apariții, o pereche e zgomot, nu tipar. */
const PRAG_PERECHE = 2;

function main() {
  console.log('Citesc lecțiile…');
  const { unigrame, bigrame, fisiere, total } = construiesteCorpus(RADACINA);
  console.log(`  ${fisiere} fișiere, ${total.toLocaleString('ro')} cuvinte`);

  const lexicon = Lexicon.dinFisier();

  /*
   * Formele care ne interesează: cele care apar ca variantă într-o cheie
   * ambiguă. „masă" ne interesează pentru că e în concurență cu „masa";
   * „împărțire" nu, pentru că n-are cu ce concura.
   */
  const formeAmbigue = new Set();
  for (const forma of unigrame.keys()) {
    const variante = lexicon.formele(dezbraca(forma).toLowerCase());
    if (variante && variante.length > 1) formeAmbigue.add(forma);
  }
  console.log(`  ${formeAmbigue.size} forme ambigue văzute în lecții`);

  const stanga = new Map();  // "vecin formă" → de câte ori
  const dreapta = new Map(); // "formă vecin" → de câte ori

  for (const [pereche, numar] of bigrame) {
    if (numar < PRAG_PERECHE) continue;
    const [primul, alDoilea] = pereche.split(' ');
    if (formeAmbigue.has(alDoilea)) stanga.set(pereche, numar);
    if (formeAmbigue.has(primul)) dreapta.set(pereche, numar);
  }

  const model = {
    // Câte apariții are fiecare formă ambiguă: rezerva de decizie când nu
    // cunoaștem niciun vecin.
    forme: Object.fromEntries([...formeAmbigue].map((forma) => [forma, unigrame.get(forma)])),
    stanga: Object.fromEntries(stanga),
    dreapta: Object.fromEntries(dreapta),
  };

  const cale = path.join(DATE, 'context.json');
  fs.writeFileSync(cale, JSON.stringify(model), 'utf8');

  console.log(`  ${stanga.size} perechi cu vecin la stânga, ${dreapta.size} la dreapta`);
  console.log(`\nScris ${cale} — ${(fs.statSync(cale).size / 1024).toFixed(0)} KB`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
