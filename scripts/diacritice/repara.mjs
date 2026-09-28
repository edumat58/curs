#!/usr/bin/env node
/**
 * Pune diacriticele într-un fișier, din linia de comandă.
 *
 * Parcurge exact aceiași pași ca extensia — lexicon, context local, Gemini —
 * ceea ce o face și unealtă, și probă: dacă merge aici, motorul e bun, iar în
 * editor mai rămâne doar învelișul de verificat.
 *
 * Fără `--scrie` nu atinge nimic: arată ce ar schimba și atât. Într-un fișier
 * de lecție e bine să te uiți întâi.
 *
 * Rulare:
 *   node scripts/diacritice/repara.mjs docs/c5/modul-1/05.mdx
 *   node scripts/diacritice/repara.mjs docs/c5/modul-1/05.mdx --scrie
 *   echo "fata a pus cartea pe masa" | node scripts/diacritice/repara.mjs
 */

import fs from 'node:fs';

import { Context } from './context.mjs';
import { alegeFormele } from './gemini.mjs';
import { Lexicon, analizeaza, aplica, dezbraca, propozitii, tokenizeaza } from './motor.mjs';

const CULOARE = process.stdout.isTTY
  ? { verde: '[32m', galben: '[33m', stins: '[2m', gata: '[0m' }
  : { verde: '', galben: '', stins: '', gata: '' };

function vecinii(bucata, text) {
  const inainte = text.slice(Math.max(0, bucata.start - 40), bucata.start).match(/([\p{L}-]+)\W*$/u);
  const dupa = text.slice(bucata.sfarsit, bucata.sfarsit + 40).match(/^\W*([\p{L}-]+)/u);
  return {
    vecinStanga: inainte ? dezbraca(inainte[1]).toLowerCase() : '‹',
    vecinDreapta: dupa ? dezbraca(dupa[1]).toLowerCase() : '›',
  };
}

/**
 * Trecerea prin Gemini, grupată pe propoziții: o cerere per frază, nu per
 * cuvânt. O frază cu patru nelămuriri costă tot un apel, iar modelul le judecă
 * împreună — ceea ce e și mai bine, fiindcă alegerile dintr-o frază depind una
 * de alta („o masă mare" vs „masa mare").
 */
async function intreabaGemini(text, nesigure) {
  if (!nesigure.length) return [];

  const grupuri = propozitii(tokenizeaza(text), text);
  const schimbari = [];
  let cereri = 0;

  for (const grup of grupuri) {
    const fante = nesigure.filter((n) => grup.some((b) => b.start === n.start));
    if (!fante.length) continue;

    let propozitie = '';
    let ultima = grup[0].start;
    const numerotate = [];

    for (const bucata of grup) {
      propozitie += text.slice(ultima, bucata.start);
      const indice = fante.findIndex((f) => f.start === bucata.start);
      if (indice >= 0) {
        propozitie += `{${indice + 1}}`;
        numerotate.push({ numar: indice + 1, variante: fante[indice].variante, bucata: fante[indice] });
      } else {
        propozitie += bucata.text;
      }
      ultima = bucata.sfarsit;
    }

    cereri++;
    const alese = await alegeFormele({
      propozitie,
      fante: numerotate.map(({ numar, variante }) => ({ numar, variante })),
    });

    for (const { numar, bucata } of numerotate) {
      const forma = alese.get(numar);
      if (forma && forma !== bucata.text) schimbari.push({ ...bucata, propunere: forma });
    }
  }

  process.stderr.write(`${CULOARE.stins}${cereri} cereri la Gemini${CULOARE.gata}\n`);
  return schimbari;
}

async function citesteIntrarea(cale) {
  if (cale) return fs.readFileSync(cale, 'utf8');
  const bucati = [];
  for await (const bucata of process.stdin) bucati.push(bucata);
  return Buffer.concat(bucati).toString('utf8');
}

async function main() {
  const argumente = process.argv.slice(2);
  const scrie = argumente.includes('--scrie');
  const faraGemini = argumente.includes('--fara-gemini');
  const cale = argumente.find((a) => !a.startsWith('--'));

  const text = await citesteIntrarea(cale);
  const lexicon = Lexicon.dinFisier();
  const context = Context.dinFisier();

  const { sigure, nesigure } = analizeaza(text, { lexicon });
  const schimbari = [...sigure];
  const raman = [];

  for (const nesigura of nesigure) {
    const ales = context.alege(nesigura.variante, vecinii(nesigura, text));
    if (ales && ales !== nesigura.text) schimbari.push({ ...nesigura, propunere: ales, local: true });
    else if (!ales) raman.push(nesigura);
  }

  if (!faraGemini && raman.length) {
    try {
      schimbari.push(...(await intreabaGemini(text, raman)).map((s) => ({ ...s, gemini: true })));
    } catch (eroare) {
      process.stderr.write(`${CULOARE.galben}Gemini n-a răspuns (${eroare.message}); rămân nelămurite.${CULOARE.gata}\n`);
    }
  }

  const rezultat = aplica(text, schimbari);

  if (scrie && cale) {
    fs.writeFileSync(cale, rezultat, 'utf8');
    console.log(`${schimbari.length} cuvinte corectate în ${cale}.`);
    return;
  }

  if (cale) {
    for (const s of schimbari.sort((a, b) => a.start - b.start)) {
      const semn = s.gemini ? 'gemini' : s.local ? 'context' : 'lexicon';
      console.log(`  ${CULOARE.verde}${s.text} → ${s.propunere}${CULOARE.gata} ${CULOARE.stins}(${semn})${CULOARE.gata}`);
    }
    console.log(`\n${schimbari.length} de schimbat. Adaugă --scrie ca să le pună în fișier.`);
  } else {
    process.stdout.write(rezultat);
  }
}

await main();
