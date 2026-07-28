/**
 * Teste pentru împărțirea lecției în bucăți de predat.
 *
 * Regula pe care o apără: din lecție NU are voie să dispară nimic. Tăierea la
 * plafon, varianta de dinainte, lăsa 40% dintre lecțiile reale explicate pe
 * jumătate, fără ca elevul să afle.
 *
 *   node --test voice-service/src/pipeline/prompts.test.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { bugetSursaCaractere, imparteLectia } from './prompts.mjs';

const DOCS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../docs');

test('o lecție care încape rămâne dintr-o bucată', () => {
  const scurt = '# Titlu\n\n## Parte\n\nText scurt.';
  assert.deepEqual(imparteLectia(scurt, 4000), [scurt]);
});

test('lecția lungă se taie la titluri, nu la mijloc de frază', () => {
  const lectie = '# Lecție\n\n'
    + ['A', 'B', 'C'].map((s) => `## Partea ${s}\n\n${'x'.repeat(1200)}`).join('\n');
  const bucati = imparteLectia(lectie, 1500);
  assert.ok(bucati.length >= 3, `așteptam cel puțin 3 bucăți, am primit ${bucati.length}`);
  // Fiecare bucată începe fie cu titlul lecției, fie cu un titlu de nivel 2.
  bucati.slice(1).forEach((b) => assert.match(b, /^##\s/));
});

test('nicio bucată nu depășește plafonul cerut', () => {
  const plafon = bugetSursaCaractere(1100 * 3.5 + 350);
  const fisiere = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.mdx?$/.test(e.name) && !e.name.startsWith('_')) fisiere.push(p);
    }
  })(DOCS);
  assert.ok(fisiere.length > 50, 'nu am găsit lecțiile');

  for (const f of fisiere) {
    const sursa = fs.readFileSync(f, 'utf8');
    const bucati = imparteLectia(sursa, plafon);
    for (const b of bucati) {
      assert.ok(b.length <= plafon, `${f}: bucată de ${b.length} peste plafonul ${plafon}`);
    }
    // Reasamblarea trebuie să dea înapoi exact aceleași caractere ne-albe.
    const fara = (s) => s.replace(/\s+/g, '');
    assert.equal(fara(bucati.join('\n')), fara(sursa), `${f}: s-a pierdut conținut la împărțire`);
  }
});
