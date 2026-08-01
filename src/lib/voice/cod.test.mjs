/**
 * Identitatea unei lecții trebuie să fie UNICĂ.
 *
 * Când două lecții primesc același cod, nimic nu se plânge: în indexul de
 * transcripturi una o suprascrie tăcut pe cealaltă, iar la sinteză ar ajunge să
 * împartă același fișier audio — elevul ar asculta explicația altei lecții. S-a
 * întâmplat de trei ori (C5 „(1)" și „(2)" din clasa a VII-a, plus perechile
 * EXTRA din a VIII-a) și s-a văzut abia când o lecție lipsea din panou.
 *
 * Testul rulează pe indexul REAL al site-ului, nu pe titluri inventate, ca să
 * prindă și titluri viitoare cu forme la care nu ne-am gândit.
 *
 *   node --test src/lib/voice/cod.test.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { identitateLectie, parseTitlu } from './cod.mjs';

const RADACINA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const INDEX = path.join(RADACINA, 'static', 'lessons-index.json');

/** Doar lecțiile propriu-zise; restul paginilor n-au voce și n-au cod. */
function lectiiReale() {
  const brut = JSON.parse(fs.readFileSync(INDEX, 'utf8'));
  return (brut.lessons || []).filter((l) => /^\s*[CG]\s*\d/.test(l.title || ''));
}

test('fiecare lecție de pe site are o identitate proprie', () => {
  const dupaIdentitate = new Map();
  for (const lectie of lectiiReale()) {
    const id = identitateLectie(lectie);
    if (!id) continue;
    if (!dupaIdentitate.has(id)) dupaIdentitate.set(id, []);
    dupaIdentitate.get(id).push(lectie);
  }
  const ciocniri = [...dupaIdentitate].filter(([, l]) => l.length > 1);
  const raport = ciocniri
    .map(([id, l]) => `${id}\n    ${l.map((x) => `${x.url}  ${x.title}`).join('\n    ')}`)
    .join('\n  ');
  assert.equal(ciocniri.length, 0, `lecții care împart aceeași identitate:\n  ${raport}`);
});

test('subdiviziunea se citește din ambele forme folosite în curs', () => {
  assert.equal(parseTitlu('C6.1 – Ceva').subdiviziune, 1);
  assert.equal(parseTitlu('C5 - Mulțimea nr. reale (1)').subdiviziune, 1);
  assert.equal(parseTitlu('C5 - Mulțimea nr. reale (2)').subdiviziune, 2);
  // O paranteză care nu e număr rămâne parte din titlu, nu subdiviziune.
  assert.equal(parseTitlu('C14 - Operații cu numere reale (recapitulare)').subdiviziune, 0);
  assert.equal(parseTitlu('C10 - Modulul unui număr întreg (valoarea absolută)').subdiviziune, 0);
});

test('lecțiile EXTRA nu cad peste lecția cu același număr', () => {
  const obisnuita = { course: 'c8', title: 'C1 - Notații și simboluri matematice' };
  const extra = { course: 'c8', title: 'C1 | EXTRA - Triunghiuri asemenea (recapitulare)' };
  const cuAsterisc = { course: 'c8', title: 'C1* | EXTRA - Triunghiuri asemenea (recapitulare)' };

  assert.notEqual(identitateLectie(obisnuita), identitateLectie(extra));
  // Titlul e scris cu și fără asterisc, în surse diferite; ambele forme trebuie
  // să dea același cod, altfel transcriptul nu se mai potrivește cu lecția.
  assert.equal(identitateLectie(extra), identitateLectie(cuAsterisc));
});

test('identitățile deja emise nu se schimbă', () => {
  // Fișierele audio poartă aceste nume. Dacă un cod se schimbă, audio-ul de
  // dinainte devine orfan și lecția tace — deci ele se verifică explicit.
  assert.equal(identitateLectie({ course: 'c6', title: 'C1 - Multiplii si divizori' }), 'MAT-06-C01-0-0');
  assert.equal(identitateLectie({ course: 'c5', title: 'C7.1 – Ilustrarea fracţiilor' }), 'MAT-05-C07-1-0');
  assert.equal(
    identitateLectie({ course: 'c5', title: 'C1 - Scrierea sub forma zecimala', collection: 'edupasi' }),
    'MAT-05-C01-0-1'
  );
});
