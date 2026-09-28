/**
 * Corpusul propriu: româna deja scrisă corect din lecțiile acestui site.
 *
 * Cele ~365 de fișiere MDX din `docs/`, `blog/` și `teste/` sunt material
 * publicat, trecut prin corectură, cu diacritice puse cum trebuie. Sunt deci
 * exact ce ne lipsea din dicționar: nu o listă de cuvinte POSIBILE, ci o probă
 * de română REALĂ, și încă una de pe domeniul în care scrie omul — matematică
 * de gimnaziu. Cuvinte ca „ipotenuză", „descompunere", „amplificare" apar aici
 * des, iar în subtitrările de film aproape deloc.
 *
 * Corpusul e folosit în două locuri:
 *
 *  1. La construirea lexiconului, ca LISTĂ DE PROTECȚIE: un cuvânt care apare
 *     în lecțiile tale nu e tăiat niciodată ca improbabil, oricât de rar ar fi
 *     în corpusul general.
 *  2. La rulare, ca MODEL DE CONTEXT: perechile de cuvinte vecine spun, fără
 *     niciun apel la rețea, că după „la" vine „împărțire" și nu „impartire".
 *
 * Textul e trecut întâi prin masca MDX, altfel am învăța ca „românesc" numele
 * componentelor („Katex", „HighlightText") și bucăți de LaTeX („frac", „cdot").
 */

import fs from 'node:fs';
import path from 'node:path';

import { mascaMdx } from './masca-mdx.mjs';

/** Doar litere românești; cratima ține „într-un" și „s-au" într-o bucată. */
const CUVANT = /[a-zA-ZăâîșțĂÂÎȘȚşţŞŢ]+(?:[-'’][a-zA-ZăâîșțĂÂÎȘȚşţŞŢ]+)*/gu;

const DOSARE = ['docs', 'blog', 'teste'];
const EXTENSII = new Set(['.md', '.mdx']);

function* fisiereRecursiv(radacina) {
  if (!fs.existsSync(radacina)) return;
  for (const intrare of fs.readdirSync(radacina, { withFileTypes: true })) {
    const cale = path.join(radacina, intrare.name);
    if (intrare.isDirectory()) {
      if (intrare.name === 'node_modules' || intrare.name.startsWith('.')) continue;
      yield* fisiereRecursiv(cale);
    } else if (EXTENSII.has(path.extname(intrare.name))) {
      yield cale;
    }
  }
}

/**
 * Șterge din text tot ce e protejat, lăsând în loc spații.
 *
 * ATENȚIE, aici a fost un bug care a costat: masca TREBUIE aplicată pe fișierul
 * ÎNTREG, nu pe bucăți. Prima variantă tăia întâi textul în propoziții și abia
 * apoi masca fiecare bucată — dar o bucată ruptă din mijlocul unui bloc de cod
 * nu mai știe că e în bloc de cod: nu-i vede gardul de deschidere, deci se
 * crede proză. Așa au intrat în corpus 67 de „si" și 38 de „in" culese dintr-un
 * tabel JavaScript din `docs/c7/organigrama.md`, adică exact cuvintele
 * nediacritizate pe care corpusul trebuia să ne ajute să le RECUNOAȘTEM ca
 * greșeli. Un corpus care conține chiar greșelile pe care le vânează e mai rău
 * decât niciunul.
 *
 * Înlocuim cu spații și nu ștergem, ca liniile și punctuația din jur să rămână
 * la locul lor și tăierea în propoziții de după să nu lipească fraze care în
 * fișier erau despărțite de un bloc de cod.
 */
export function textCurat(text) {
  const masca = mascaMdx(text);
  let iesire = '';
  for (let i = 0; i < text.length; i++) {
    iesire += masca[i] ? (text[i] === '\n' ? '\n' : ' ') : text[i];
  }
  return iesire;
}

/** Cuvintele unui text DEJA curățat de mască, în ordine, cu minuscule. */
export function cuvinteleTextului(textDejaCurat) {
  return [...textDejaCurat.matchAll(CUVANT)].map((gasit) => gasit[0].toLowerCase());
}

/**
 * Parcurge lecțiile și numără cuvintele și perechile de vecini.
 *
 * Propozițiile sunt rupte la punct/semn de întrebare/două puncte, iar la
 * capetele fiecăreia punem jaloanele „‹" și „›". Fără ele, primul cuvânt al
 * unei propoziții n-ar avea context din stânga, tocmai când are cea mai mare
 * nevoie: începuturile de frază sunt pline de „Împărțirea", „În", „Și".
 */
export function construiesteCorpus(radacina, { dosare = DOSARE } = {}) {
  const unigrame = new Map();
  const bigrame = new Map();
  let fisiere = 0;
  let total = 0;

  const numara = (harta, cheie) => harta.set(cheie, (harta.get(cheie) ?? 0) + 1);

  for (const dosar of dosare) {
    for (const cale of fisiereRecursiv(path.join(radacina, dosar))) {
      fisiere++;
      // Masca pe fișierul întreg, ÎNAINTE de orice tăiere. Vezi `textCurat`.
      const text = textCurat(fs.readFileSync(cale, 'utf8'));

      for (const propozitie of text.split(/(?<=[.!?:;])\s+|\n{2,}/)) {
        const cuvinte = cuvinteleTextului(propozitie);
        if (!cuvinte.length) continue;
        total += cuvinte.length;

        const sir = ['‹', ...cuvinte, '›'];
        for (const cuvant of cuvinte) numara(unigrame, cuvant);
        for (let i = 0; i < sir.length - 1; i++) numara(bigrame, `${sir[i]} ${sir[i + 1]}`);
      }
    }
  }

  return { unigrame, bigrame, fisiere, total };
}
