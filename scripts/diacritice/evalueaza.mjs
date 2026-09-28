#!/usr/bin/env node
/**
 * Cât de bine repune motorul diacriticele? Măsurăm, nu presupunem.
 *
 * Proba se face singură: lecțiile tale sunt deja scrise corect, deci le
 * dezbrăcăm de semne, dăm textul motorului și comparăm ce iese cu originalul.
 * Fiecare cuvânt are un răspuns corect știut dinainte, fără să adnoteze nimeni
 * nimic cu mâna.
 *
 * Cifra care contează nu e „câte a nimerit", ci CÂTE A STRICAT: un cuvânt
 * corect transformat în altceva e mult mai rău decât unul lăsat neatins. De
 * aceea numărăm separat:
 *
 *   corectate   erau fără semne, le-a pus bine        (câștig)
 *   stricate    erau bune sau le-a schimbat greșit    (pagubă — pe asta o vânăm)
 *   lăsate      n-a îndrăznit; rămân de rezolvat cu context
 *
 * ATENȚIE la o limită a probei: modelul de context e construit din ACELEAȘI
 * lecții, deci pe ele e avantajat. Cu `--fara-context` vezi cât face motorul
 * pur lexical, care e cifra sinceră pentru text nou.
 *
 * Rulare:  node scripts/diacritice/evalueaza.mjs
 *          node scripts/diacritice/evalueaza.mjs --fara-context
 *          node scripts/diacritice/evalueaza.mjs --arata 40
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { textCurat } from './corpus.mjs';
import { Context } from './context.mjs';
import { Lexicon, analizeaza, dezbraca, tokenizeaza } from './motor.mjs';

const AICI = path.dirname(fileURLToPath(import.meta.url));
const RADACINA = path.resolve(AICI, '..', '..');

const EXTENSII = new Set(['.md', '.mdx']);

function* fisiere(radacina) {
  if (!fs.existsSync(radacina)) return;
  for (const intrare of fs.readdirSync(radacina, { withFileTypes: true })) {
    const cale = path.join(radacina, intrare.name);
    if (intrare.isDirectory()) {
      if (intrare.name.startsWith('.') || intrare.name === 'node_modules') continue;
      yield* fisiere(cale);
    } else if (EXTENSII.has(path.extname(intrare.name))) yield cale;
  }
}

function main() {
  const faraContext = process.argv.includes('--fara-context');
  const cateSaArate = Number(process.argv[process.argv.indexOf('--arata') + 1]) || 25;

  const lexicon = Lexicon.dinFisier();
  const context = faraContext ? new Context(null) : Context.dinFisier();

  let corectate = 0;
  let stricate = 0;
  let normalizate = 0;
  let peGresealaTa = 0;
  let lasate = 0;
  let neatinse = 0;
  const exemple = [];

  /**
   * Cu ce fel de nepotrivire avem de-a face.
   *
   * Prima variantă a probei punea totul într-un singur sac de „stricate" și
   * scotea 3,94% — cifră care arăta rău degeaba. Uitându-mă la exemple, mare
   * parte erau de fapt REPARAȚII: `fracţiilor → fracțiilor` schimbă sedila
   * greșită (ţ, U+0163, moștenită din fonturile vechi Windows) în virgula
   * corectă (ț, U+021B), iar `Definitie → Definiție` îndreaptă o scăpare din
   * lecție. Amestecate cu pagubele adevărate, ascundeau exact ce trebuia văzut.
   *
   * Singura categorie care contează cu adevărat e `stricat`: în original
   * cuvântul avea semne puse cu grijă, iar motorul l-a schimbat în altceva.
   */
  const felulNepotrivirii = (original, propunere) => {
    if (dezbraca(original) !== dezbraca(propunere)) return 'stricat';
    if (/[şţŞŢ]/.test(original)) return 'normalizat';
    if (dezbraca(original) === original) return 'gresealaTa';
    return 'stricat';
  };

  for (const cale of fisiere(path.join(RADACINA, 'docs'))) {
    const original = textCurat(fs.readFileSync(cale, 'utf8'));
    const adevarul = tokenizeaza(original);
    if (!adevarul.length) continue;

    // Textul de probă: același text, fără semne. Pozițiile se păstrează,
    // fiindcă dezbrăcarea nu schimbă numărul de caractere.
    const proba = dezbraca(original);
    const { sigure, nesigure } = analizeaza(proba, { lexicon });

    const propuse = new Map();
    for (const schimbare of sigure) propuse.set(schimbare.start, schimbare.propunere);

    for (const nesigura of nesigure) {
      const stanga = adevarul.find((b) => b.sfarsit <= nesigura.start && b.sfarsit >= nesigura.start - 3);
      const dreapta = adevarul.find((b) => b.start >= nesigura.sfarsit && b.start <= nesigura.sfarsit + 3);
      const ales = context.alege(nesigura.variante, {
        vecinStanga: dezbraca(stanga?.text ?? '‹').toLowerCase(),
        vecinDreapta: dezbraca(dreapta?.text ?? '›').toLowerCase(),
      });
      if (ales) propuse.set(nesigura.start, ales);
    }

    for (const bucata of adevarul) {
      const propunere = propuse.get(bucata.start);
      const eraFaraSemne = dezbraca(bucata.text) === bucata.text;

      if (propunere === undefined) {
        if (eraFaraSemne) neatinse++;
        else lasate++;
        continue;
      }

      if (propunere === bucata.text) { corectate++; continue; }

      const fel = felulNepotrivirii(bucata.text, propunere);
      if (fel === 'normalizat') normalizate++;
      else if (fel === 'gresealaTa') peGresealaTa++;
      else {
        stricate++;
        if (exemple.length < cateSaArate) {
          exemple.push(`${path.relative(RADACINA, cale)}: „${bucata.text}" → „${propunere}"`);
        }
      }
    }
  }

  const atinse = corectate + stricate + normalizate + peGresealaTa;
  const total = atinse + lasate + neatinse;

  console.log(`Model de context: ${faraContext ? 'OPRIT (doar lexicon)' : 'pornit'}`);
  console.log(`\n${total.toLocaleString('ro')} cuvinte de proză verificate, ${atinse.toLocaleString('ro')} atinse de motor\n`);
  console.log(`  corectate    ${String(corectate).padStart(6)}  ${(100 * corectate / atinse).toFixed(2)}%  au ieșit exact ca originalul`);
  console.log(`  normalizate  ${String(normalizate).padStart(6)}  ${(100 * normalizate / atinse).toFixed(2)}%  sedila ţ/ş → virgula corectă ț/ș`);
  console.log(`  îndreptate   ${String(peGresealaTa).padStart(6)}  ${(100 * peGresealaTa / atinse).toFixed(2)}%  lecția n-avea semne acolo; motorul le-a pus`);
  console.log(`  STRICATE     ${String(stricate).padStart(6)}  ${(100 * stricate / atinse).toFixed(2)}%  aveau semne bune și le-a schimbat  ← paguba`);
  console.log(`\n  lăsate       ${String(lasate).padStart(6)}  ambigue, motorul n-a îndrăznit`);
  console.log(`  neatinse     ${String(neatinse).padStart(6)}  n-aveau nevoie de nimic`);

  if (exemple.length) {
    console.log('\nCe a stricat cu adevărat:');
    for (const exemplu of exemple) console.log(`  ${exemplu}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
