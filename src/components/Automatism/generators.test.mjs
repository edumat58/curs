/**
 * Fiecare automatism e generat din nou la fiecare afișare, cu numere alese
 * aleator. Asta înseamnă că un caz prost — o împărțire la zero, un răspuns
 * care nu e număr, o listă de opțiuni în care răspunsul corect lipsește — nu
 * apare la prima rulare, ci la a treia sută, în fața unui elev.
 *
 * Testul rulează fiecare generator de multe ori și verifică nu doar că nu
 * crapă, ci și că întrebarea rezultată e una la care se poate răspunde.
 *
 *   node --test src/components/Automatism/generators.test.mjs
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { REGISTRY } from './generators.js';

const RULARI = 400;
const FELURI = new Set(['int', 'dec', 'text', 'choice']);

/** Toate întrebările produse de un generator, într-o serie lungă. */
function serie(fn) {
  return Array.from({ length: RULARI }, () => fn());
}

test('registrul are intrări complete', () => {
  const chei = Object.keys(REGISTRY);
  assert.ok(chei.length > 0, 'registrul e gol');
  for (const cheie of chei) {
    const intrare = REGISTRY[cheie];
    assert.equal(typeof intrare.fn, 'function', `${cheie}: lipsește funcția`);
    assert.ok(intrare.title, `${cheie}: lipsește titlul`);
    assert.ok(intrare.capitol, `${cheie}: lipsește capitolul din programă`);
  }
});

test('fiecare întrebare are enunț și cel puțin o casetă', () => {
  for (const [cheie, { fn }] of Object.entries(REGISTRY)) {
    for (const q of serie(fn)) {
      assert.ok(q && q.prompt, `${cheie}: fără enunț`);
      assert.ok(
        q.prompt.text || q.prompt.latex || q.prompt.svg,
        `${cheie}: enunțul e gol`
      );
      assert.ok(Array.isArray(q.blanks) && q.blanks.length > 0, `${cheie}: fără casete`);
    }
  }
});

test('fiecare casetă spune ce se completează', () => {
  for (const [cheie, { fn }] of Object.entries(REGISTRY)) {
    for (const q of serie(fn)) {
      for (const camp of q.blanks) {
        assert.ok(
          typeof camp.label === 'string' && camp.label.trim().length > 2,
          `${cheie}: casetă fără etichetă`
        );
        assert.ok(FELURI.has(camp.kind), `${cheie}: fel necunoscut „${camp.kind}"`);
      }
    }
  }
});

test('răspunsurile numerice sunt numere bune', () => {
  for (const [cheie, { fn }] of Object.entries(REGISTRY)) {
    for (const q of serie(fn)) {
      for (const camp of q.blanks) {
        if (camp.kind !== 'int' && camp.kind !== 'dec') continue;
        const v = Number(camp.answer);
        assert.ok(Number.isFinite(v), `${cheie}: răspuns care nu e număr (${camp.answer})`);
        if (camp.kind === 'int') {
          assert.ok(Number.isInteger(v), `${cheie}: răspuns întreg cerut, primit ${v}`);
        }
        // Un răspuns cu mai mult de patru zecimale nu se poate scrie într-o
        // casetă fără să ghicești câte zecimale vrea corectorul.
        if (camp.kind === 'dec' && !Number.isInteger(v)) {
          const zecimale = String(v).split('.')[1]?.length ?? 0;
          assert.ok(
            zecimale <= 4 || (camp.tol ?? 0) > 0,
            `${cheie}: răspuns cu ${zecimale} zecimale și fără toleranță (${v})`
          );
        }
      }
    }
  }
});

test('la alegere, răspunsul corect se află printre opțiuni', () => {
  for (const [cheie, { fn }] of Object.entries(REGISTRY)) {
    for (const q of serie(fn)) {
      for (const camp of q.blanks) {
        if (camp.kind !== 'choice') continue;
        assert.ok(Array.isArray(camp.options) && camp.options.length >= 2,
          `${cheie}: alegere cu mai puțin de două opțiuni`);
        assert.ok(camp.options.includes(String(camp.answer)),
          `${cheie}: răspunsul „${camp.answer}" nu e printre opțiuni`);
        assert.equal(new Set(camp.options).size, camp.options.length,
          `${cheie}: opțiuni duplicate`);
      }
    }
  }
});

test('enunțurile nu strecoară indicii între paranteze', () => {
  // Cerința trebuie să spună ce se completează, nu cum. Parantezele de tipul
  // „(scrie ca fracție)" sunt ajutor deghizat: elevul care le citește rezolvă
  // altă sarcină decât cel care nu le citește.
  const INDICII = /\((?:scrie|folosește|atenție|indiciu|hint|dacă e cazul|rotunj)/i;
  for (const [cheie, { fn }] of Object.entries(REGISTRY)) {
    for (const q of serie(fn)) {
      const text = `${q.prompt.text || ''} ${q.blanks.map((b) => b.label).join(' ')}`;
      assert.doesNotMatch(text, INDICII, `${cheie}: indiciu în enunț`);
    }
  }
});

test('nu se cere niciodată tastarea unui simbol matematic', () => {
  // Elevul nu are pe tastatură radical, fracție sau exponent. Dacă răspunsul
  // corect conține așa ceva, întrebarea măsoară altceva decât automatismul.
  const SIMBOLURI = /[√^{}\\∙·×÷≤≥∈π]|\//;
  for (const [cheie, { fn }] of Object.entries(REGISTRY)) {
    for (const q of serie(fn)) {
      for (const camp of q.blanks) {
        if (camp.kind === 'choice') continue; // se alege cu butonul, nu se scrie
        assert.doesNotMatch(String(camp.answer), SIMBOLURI,
          `${cheie}: răspunsul „${camp.answer}" cere simboluri`);
      }
    }
  }
});

test('automatismele acoperă toate cele patru clase', () => {
  const prefixe = { V: /^v[A-Z]/, VI: /^vi[A-Z]/, VII: /^vii[A-Z]/, VIII: /^viii[A-Z]/ };
  const numar = { V: 0, VI: 0, VII: 0, VIII: 0 };
  for (const cheie of Object.keys(REGISTRY)) {
    if (prefixe.VIII.test(cheie)) numar.VIII += 1;
    else if (prefixe.VII.test(cheie)) numar.VII += 1;
    else if (prefixe.VI.test(cheie)) numar.VI += 1;
    else if (prefixe.V.test(cheie)) numar.V += 1;
  }
  for (const clasa of Object.keys(numar)) {
    assert.ok(numar[clasa] >= 15, `clasa ${clasa} are doar ${numar[clasa]} automatisme`);
  }
});
