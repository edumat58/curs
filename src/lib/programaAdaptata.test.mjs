/**
 * Pragul legal al programei adaptate se verifică aici, nu din ochi.
 *
 * Legea nr. 198/2023, art. 69: la nivelul II de sprijin, reducerea componentei
 * curriculare e de „cel mult 20%". O listă editată de mână alunecă ușor peste
 * prag — s-a și întâmplat în prima redactare, unde clasa a VII-a ajunsese la
 * 37% fără ca cineva să observe. De atunci pragul e test, nu intenție.
 *
 *   node --test src/lib/programaAdaptata.test.mjs
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { PROGRAMA_ADAPTATA, TEMEI_LEGAL, verificaPragul } from './programaAdaptata.mjs';

test('reducerea nu depășește pragul legal de 20% la nicio clasă', () => {
  for (const r of verificaPragul()) {
    assert.ok(
      r.inLimita,
      `clasa a ${r.clasa}-a reduce ${r.procent}% — peste pragul de `
      + `${TEMEI_LEGAL.reducereMaxima}% din ${TEMEI_LEGAL.lege}`
    );
  }
});

test('reducerea e aproape de prag, uniform între clase', () => {
  // Cerința e uniformitatea: adaptarea folosește spațiul legal disponibil la
  // fiecare clasă, nu 5% la una și 19% la alta. Sub 15% înseamnă că s-au ținut
  // conținuturi care puteau fi lăsate — adică o adaptare care nu adaptează.
  for (const r of verificaPragul()) {
    assert.ok(
      r.procent >= 15,
      `clasa a ${r.clasa}-a reduce doar ${r.procent}% — adaptarea nu folosește pragul`
    );
  }
});

test('fiecare reducere are un temei citat', () => {
  for (const [clasa, domenii] of Object.entries(PROGRAMA_ADAPTATA)) {
    for (const d of domenii) {
      for (const r of d.redus) {
        assert.ok(r.ce && r.ce.length > 5, `clasa ${clasa}, ${d.domeniu}: reducere fără nume`);
        assert.ok(
          r.temei && r.temei.includes('éduscol'),
          `clasa ${clasa}, „${r.ce}": reducere fără temei citat`
        );
      }
    }
  }
});

test('conținuturile esențiale sunt scrise ca acțiuni verificabile', () => {
  // „Fracții ordinare" nu se poate bifa; „Adună și scade fracții ordinare" da.
  // Verbul la început e ce face diferența dintre o programă și un cuprins.
  // Fără `\b` la coadă: în JavaScript granița de cuvânt e definită pe ASCII,
  // deci după „ă" nu există graniță și „Adună " nu s-ar potrivi niciodată.
  const VERB = /^(Scrie|Citește|Adună|Scade|Înmulțește|Împarte|Calculează|Aplică|Recunoaște|Află|Găsește|Rezolvă|Compară|Aduce|Amplifică|Simplifică|Efectuează|Măsoară|Clasifică|Construiește|Transformă|Folosește|Verifică|Face|Descompune|Reduce|Desface|Spune|Reprezintă|Așază|Identifică|Desenează|Estimează|Cunoaște|Scoate)[ ,]/;
  for (const [clasa, domenii] of Object.entries(PROGRAMA_ADAPTATA)) {
    for (const d of domenii) {
      for (const e of d.esential) {
        assert.match(
          e, VERB,
          `clasa ${clasa}, ${d.domeniu}: „${e.slice(0, 50)}" nu începe cu o acțiune`
        );
      }
    }
  }
});

test('toate cele patru clase sunt acoperite', () => {
  assert.deepEqual(Object.keys(PROGRAMA_ADAPTATA).map(Number).sort(), [5, 6, 7, 8]);
  for (const domenii of Object.values(PROGRAMA_ADAPTATA)) {
    assert.ok(domenii.length >= 3, 'o clasă are mai puțin de trei domenii');
  }
});
