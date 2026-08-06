/**
 * Verifică metamorfoza cu exact funcțiile pe care le folosește componenta.
 *
 * Rulare:
 *   node src/components/EduPasiHero/morf.test.mjs [/cale/spre/contact.svg]
 *
 * Verifică invariantele care, dacă se strică, se văd direct în titlu: același
 * număr de contururi și de puncte în toate fonturile, cuvântul rămâne întreg la
 * orice moment, iar valul chiar decalează literele. Cu un argument, scrie și o
 * planșă SVG cu stările intermediare, ca să poată fi privite.
 */

import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { amesteca, aplatizeaza, caleDin, cateAreInitiala, usor } from './morf.mjs';

const aici = dirname(fileURLToPath(import.meta.url));
const date = JSON.parse(readFileSync(join(aici, 'morfIncluziva.json'), 'utf8'));
const fonturi = date.fonturi;
const asezate = fonturi.map(aplatizeaza);
const initiala = cateAreInitiala(fonturi[0]);

// 1. structură identică: fără asta, interpolarea ar amesteca litera cu golul ei
const nrContururi = asezate[0].length;
assert.equal(nrContururi, date.litere.reduce((s, l) => s + l.contururi, 0));
for (const f of asezate) {
  assert.equal(f.length, nrContururi, 'toate fonturile au același număr de contururi');
  f.forEach((c, i) => assert.equal(c.length, asezate[0][i].length, `conturul ${i} are alt număr de puncte`));
}

// 2. la orice moment, cuvântul e întreg și stă în cadrul desenat
const cadru = { sus: -date.sus, jos: -date.jos, lat: Math.max(...date.fonturi.map((f) => f.latime)) };
for (let k = 0; k <= 20; k += 1) {
  const t = k / 20;
  const c = amesteca(fonturi[0], fonturi[1], t);
  assert.equal(c.length, nrContururi);
  for (const contur of c) {
    for (let i = 0; i < contur.length; i += 2) {
      assert.ok(Number.isFinite(contur[i]) && Number.isFinite(contur[i + 1]), 'punct valid');
      assert.ok(contur[i] >= -1 && contur[i] <= cadru.lat + 1, 'rămâne în lățimea cutiei');
      assert.ok(contur[i + 1] >= cadru.sus - 1 && contur[i + 1] <= cadru.jos + 1, 'rămâne în înălțimea cutiei');
    }
  }
}

// 3. capetele sunt fonturile în sine (până la eroarea de virgulă mobilă, care e
//    cu multe ordine de mărime sub unitatea de font)
const laFelCu = (obtinut, asteptat, mesaj) => {
  obtinut.forEach((c, i) => c.forEach((v, k) => {
    assert.ok(Math.abs(v - asteptat[i][k]) < 1e-6, `${mesaj}: conturul ${i}, valoarea ${k}`);
  }));
};
for (const [a, b] of [[0, 1], [1, 2], [2, 0]]) {
  laFelCu(amesteca(fonturi[a], fonturi[b], 0), asezate[a], 't=0 e fontul de plecare');
  laFelCu(amesteca(fonturi[a], fonturi[b], 1), asezate[b], 't=1 e fontul de sosire');
}

// 4. valul: la mijloc, prima literă e mai avansată decât ultima
const mijloc = amesteca(fonturi[0], fonturi[2], 0.5);
// se măsoară pe ÎNĂLȚIME: pe orizontală, coordonatele includ și așezarea
// literei pe rând, care merge cu alt ceas decât forma
const avansForma = (idxLitera, idxContur) => {
  const de_la = fonturi[0].litere[idxLitera].contururi[0];
  const la = fonturi[2].litere[idxLitera].contururi[0];
  const dl = la[1] - de_la[1];
  return dl === 0 ? null : (mijloc[idxContur][1] - de_la[1]) / dl;
};
let k = 0;
const indiciLitere = date.litere.map((l) => { const i = k; k += l.contururi; return i; });
const prima = avansForma(0, indiciLitere[0]);
const ultima = avansForma(date.litere.length - 1, indiciLitere[date.litere.length - 1]);
if (prima !== null && ultima !== null) {
  assert.ok(prima > ultima, `prima literă (${prima.toFixed(2)}) o ia înaintea ultimei (${ultima.toFixed(2)})`);
}

// 5. curba de mișcare pornește și se termină lin
assert.equal(usor(0), 0);
assert.equal(usor(1), 1);
assert.ok(usor(0.1) < 0.1 && usor(0.9) > 0.9, 'accelerează la plecare, frânează la sosire');

console.log(`morf: ${fonturi.length} fonturi × ${nrContururi} contururi × ${asezate[0][0].length / 2} puncte — toate verificările trec`);

const iesire = process.argv[2];
if (iesire) {
  const stari = [
    ['implicit', asezate[0]],
    ['implicit → lizibil 0,35', amesteca(fonturi[0], fonturi[1], 0.35)],
    ['implicit → lizibil 0,7', amesteca(fonturi[0], fonturi[1], 0.7)],
    ['lizibil', asezate[1]],
    ['lizibil → dislexie 0,35', amesteca(fonturi[1], fonturi[2], 0.35)],
    ['lizibil → dislexie 0,65', amesteca(fonturi[1], fonturi[2], 0.65)],
    ['dislexie', asezate[2]],
    ['dislexie → implicit 0,5', amesteca(fonturi[2], fonturi[0], 0.5)],
  ];
  const H = 1000;
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cadru.lat + 300} ${stari.length * H + 200}">`,
    `<rect width="100%" height="100%" fill="#eaf3fa"/>`,
  ];
  stari.forEach(([nume, contururi], k) => {
    const y = 800 + k * H;
    svg.push(`<g transform="translate(150,${y})">`);
    svg.push(`<path d="${caleDin(contururi, 0, initiala)}" fill="#003058" fill-rule="evenodd"/>`);
    svg.push(`<path d="${caleDin(contururi, initiala, contururi.length - initiala)}" fill="#161616" fill-rule="evenodd"/>`);
    svg.push(`<text x="0" y="200" font-size="150" fill="#8a97a3" font-family="monospace">${nume}</text></g>`);
  });
  svg.push('</svg>');
  writeFileSync(iesire, svg.join('\n'));
  console.log(`planșă scrisă în ${iesire}`);
}
