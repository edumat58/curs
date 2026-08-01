/**
 * Scrie paginile rubricii de automatisme, pornind de la registrul din
 * `src/components/Automatism/generators.js`.
 *
 * Paginile nu se mai țin de mână: registrul spune, pentru fiecare automatism,
 * din ce clasă și din ce capitol al programei vine, iar scriptul le grupează pe
 * capitole și scrie câte o pagină de fiecare. Când se adaugă un automatism nou,
 * pagina lui apare de la sine, la locul potrivit; când unul dispare, dispare și
 * din site. Alternativa — fișiere scrise de mână — s-a dovedit deja: rubrica
 * ajunsese să aibă 35 de automatisme, dintre care trei predate în altă clasă
 * decât cea în care apăreau.
 *
 * O pagină per capitol, nu per automatism: un capitol se lucrează dintr-o
 * ședință, iar o listă de 89 de intrări în bara laterală n-ar ajuta pe nimeni.
 *
 * Fiecare pagină primește la sfârșit și generatorul de evaluare tipărită, cu
 * lista automatismelor capitolului: aceleași întrebări care se exersează pe
 * ecran ajung, la cerere, pe o foaie de lucrare.
 *
 *   node scripts/build-automatisme-pages.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { REGISTRY } from '../src/components/Automatism/generators.js';

const RADACINA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOSAR = path.join(RADACINA, 'docs', 'automatisme');

/** Clasa se citește din prefixul cheii: vX → a V-a, viiX → a VII-a. */
function clasaDin(cheie) {
  if (/^viii[A-Z]/.test(cheie)) return 8;
  if (/^vii[A-Z]/.test(cheie)) return 7;
  if (/^vi[A-Z]/.test(cheie)) return 6;
  if (/^v[A-Z]/.test(cheie)) return 5;
  return null;
}

const NUME_CLASA = { 5: 'a V-a', 6: 'a VI-a', 7: 'a VII-a', 8: 'a VIII-a' };
const ROMAN = { 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII' };

/** Slug scurt și stabil pentru numele unui capitol. */
function slug(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[ăâ]/g, 'a').replace(/[îi]/g, 'i').replace(/[șş]/g, 's').replace(/[țţ]/g, 't')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Grupăm pe clasă, apoi pe capitol, păstrând ordinea din registru — acolo
// automatismele stau deja în ordinea în care se predau.
const peClase = new Map();
for (const [cheie, intrare] of Object.entries(REGISTRY)) {
  const clasa = clasaDin(cheie);
  if (!clasa) continue;
  if (!peClase.has(clasa)) peClase.set(clasa, new Map());
  const capitole = peClase.get(clasa);
  if (!capitole.has(intrare.capitol)) capitole.set(intrare.capitol, []);
  capitole.get(intrare.capitol).push({ cheie, ...intrare });
}

let scrise = 0;
for (const [clasa, capitole] of [...peClase].sort((a, b) => a[0] - b[0])) {
  const dosarClasa = path.join(DOSAR, `clasa-${clasa}`);
  fs.mkdirSync(dosarClasa, { recursive: true });

  // Ștergem paginile vechi ale clasei: dacă un capitol dispare din registru,
  // n-are ce căuta mai departe în bara laterală.
  for (const f of fs.readdirSync(dosarClasa)) {
    if (f.endsWith('.mdx') || f.endsWith('.md')) fs.unlinkSync(path.join(dosarClasa, f));
  }

  fs.writeFileSync(path.join(dosarClasa, '_category_.json'), `${JSON.stringify({
    label: `Clasa ${NUME_CLASA[clasa]}`,
    position: clasa - 4,
    collapsible: true,
    collapsed: true,
    link: {
      type: 'generated-index',
      slug: `/automatisme/clasa-${clasa}`,
      title: `Automatisme — clasa ${NUME_CLASA[clasa]}`,
      description: 'Exerciții scurte de antrenament, grupate pe capitolele programei. '
        + 'Fiecare întrebare se generează din nou, iar răspunsul se verifică pe loc.',
    },
  }, null, 2)}\n`);

  let pozitie = 0;
  for (const [capitol, automatisme] of capitole) {
    pozitie += 1;
    const cod = `A${ROMAN[clasa]}.${pozitie}`;
    const fisier = path.join(dosarClasa, `${String(pozitie).padStart(2, '0')}-${slug(capitol)}.mdx`);

    const blocuri = automatisme.map((a) => (
      `## ${a.title}\n\n`
      + `<Automatism id="${a.cheie}" title="${a.title}" subtitle="Clasa ${NUME_CLASA[clasa]} · ${capitol}" />`
    )).join('\n\n');

    const chei = automatisme.map((a) => `'${a.cheie}'`).join(', ');
    const continut = `---
sidebar_position: ${pozitie}
sidebar_label: "${capitol}"
title: "${cod} — ${capitol}"
description: "Automatisme pentru clasa ${NUME_CLASA[clasa]}, capitolul ${capitol}."
---

import Automatism from '@site/src/components/Automatism';
import Evaluare from '@site/src/components/Automatism/Evaluare';

# ${capitol}

${automatisme.length === 1
  ? 'Un exercițiu de antrenament pentru acest capitol.'
  : `${automatisme.length} exerciții de antrenament pentru acest capitol.`} Fiecare întrebare se
generează din nou la fiecare încercare, așa că nu se memorează răspunsuri, ci se
automatizează procedura. Scrie răspunsul și apasă **Verifică**.

${blocuri}

## Evaluare pe hârtie

<Evaluare capitol="${capitol}" clasa={${clasa}} automatisme={[${chei}]} />
`;
    fs.writeFileSync(fisier, continut);
    scrise += 1;
  }
}

const total = Object.keys(REGISTRY).length;
console.log(`automatisme: ${total} → ${scrise} pagini, pe ${peClase.size} clase`);
