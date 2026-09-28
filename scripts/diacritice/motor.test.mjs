/**
 * Teste pentru masca MDX și motorul de diacritice.
 *
 * Accentul cade pe ce STRICĂ, nu pe ce repară: o corectură ratată e o supărare,
 * dar un `id="vImpartireCuRest"` diacritizat rupe pagina, iar un `\frac` atins
 * strică formula. Cazurile de mai jos sunt cele întâlnite chiar în lecțiile din
 * `docs/`, plus regresiile pe bugele găsite în timpul construcției.
 *
 * Rulare:  node --test scripts/diacritice/
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { mascaMdx } from './masca-mdx.mjs';
import { textCurat } from './corpus.mjs';
import {
  Lexicon, analizeaza, aplica, areDiacritice, dezbraca, potrivesteMajuscula, propozitii, tokenizeaza,
} from './motor.mjs';

const lexicon = Lexicon.dinFisier();
const repara = (text) => aplica(text, analizeaza(text, { lexicon }).sigure);
const nesigurele = (text) => analizeaza(text, { lexicon }).nesigure.map((n) => n.text);

test('dezbracă semnele românești, inclusiv sedila greșită', () => {
  assert.equal(dezbraca('împărțire'), 'impartire');
  assert.equal(dezbraca('fracţiilor'), 'fractiilor', 'sedila ţ (U+0163) trebuie tratată ca ţ');
  assert.equal(dezbraca('ȘTIINȚĂ'), 'STIINTA');
  assert.equal(areDiacritice('carte'), false);
  assert.equal(areDiacritice('fată'), true);
});

test('potrivește majuscula cuvântului tastat', () => {
  assert.equal(potrivesteMajuscula('fata', 'fată'), 'fată');
  assert.equal(potrivesteMajuscula('Fata', 'fată'), 'Fată');
  assert.equal(potrivesteMajuscula('FATA', 'fată'), 'FATĂ');
});

test('masca ferește codul, formulele, importurile și adresele', () => {
  const protejat = (text, bucata) => {
    const masca = mascaMdx(text);
    const start = text.indexOf(bucata);
    assert.notEqual(start, -1, `„${bucata}" lipsește din probă`);
    return [...bucata].every((_, i) => masca[start + i] === 1);
  };

  assert.ok(protejat('import Katex from "@site/x";', 'Katex'), 'importurile');
  assert.ok(protejat('Scrie `impartire` aici.', 'impartire'), 'codul din rând');
  assert.ok(protejat('Formula $\\frac{a}{b}$ merge.', '\\frac'), 'formulele');
  assert.ok(protejat('Vezi [aici](https://scoala.ro/clasa) acum.', 'https://scoala.ro/clasa'), 'adresele');
  assert.ok(protejat('<Automatism id="vImpartireCuRest" />', 'vImpartireCuRest'), 'identificatorii JSX');
});

test('masca lasă proza din atributele de proză', () => {
  const text = '<Automatism id="vAdunarea" title="Adunarea si scaderea" />';
  const masca = mascaMdx(text);
  const start = text.indexOf('Adunarea si');
  assert.equal(masca[start], 0, 'valoarea lui title trebuie să rămână editabilă');
  assert.equal(repara(text), '<Automatism id="vAdunarea" title="Adunarea și scăderea" />');
});

test('„a < b" nu e etichetă JSX', () => {
  // Un `<` fără `>` a înghițit cândva tot restul fișierului ca „etichetă".
  assert.equal(repara('Daca a < b atunci impartirea merge.'), 'Dacă a < b atunci împărțirea merge.');
});

test('frontmatterul: proza da, identificatorii nu', () => {
  const text = '---\nslug: /edupasi/c5/impartire\ntitle: Impartirea cu rest\n---\n\nText nou.';
  const iesit = repara(text);
  assert.match(iesit, /slug: \/edupasi\/c5\/impartire/, 'slug-ul rămâne neatins');
  assert.match(iesit, /title: Împărțirea cu rest/, 'titlul se diacritizează');
});

test('blocul de cod e ferit, proza de după el nu', () => {
  const text = ['```js', 'const scoala = 1; // impartire', '```', '', 'Iar aici impartirea merge.'].join('\n');
  const iesit = repara(text);
  assert.match(iesit, /const scoala = 1; \/\/ impartire/, 'codul rămâne neatins');
  assert.match(iesit, /Iar aici împărțirea merge\./, 'proza de după se corectează');
});

test('REGRESIE: masca se aplică pe fișierul întreg, nu pe bucăți', () => {
  /*
   * Bug găsit la construirea corpusului: textul era tăiat în propoziții și abia
   * apoi mascat, așa că o bucată din mijlocul unui bloc de cod nu-și mai vedea
   * gardul de deschidere și trecea drept proză. Din tabelul JavaScript din
   * `docs/c7/organigrama.md` au intrat astfel în corpus 67 de „si" și 38 de
   * „in" — exact greșelile pe care corpusul trebuia să ne ajute să le găsim.
   */
  const text = ['```js', "const a = 'Calcul algebric in multimea reala';", "const b = 'x si y';", '```'].join('\n');
  assert.equal(textCurat(text).trim(), '', 'nimic din blocul de cod nu trebuie să iasă ca proză');
});

test('REGRESIE: cuvintele corecte nu se strică', () => {
  /*
   * „cartea" ajunsese „cârtea" și „este" ajunsese „ește": forma fără semne era
   * scoasă din lista de candidați ÎNAINTE de tăierea formelor improbabile, așa
   * că rămânea în picioare tocmai varianta regională inexistentă.
   */
  for (const cuvant of ['cartea', 'este', 'carte', 'sunt', 'unde', 'care', 'poate']) {
    assert.equal(repara(cuvant), cuvant, `„${cuvant}" trebuie lăsat în pace`);
  }
});

test('nu atinge cuvintele care au deja diacritice', () => {
  assert.equal(repara('Am scris fată și față în aceeași frază.'), 'Am scris fată și față în aceeași frază.');
});

test('corectează proza obișnuită din lecții', () => {
  assert.equal(
    repara('Impartirea euclidiana a numarului da catul si restul.'),
    'Împărțirea euclidiană a numărului da câtul și restul.',
  );
  assert.equal(repara('stim ca patratul unui numar e pozitiv'), 'știm ca pătratul unui număr e pozitiv');
});

test('lasă nelămurite exact ambiguitățile reale', () => {
  const gasite = nesigurele('Fata a pus cartea pe masa.');
  assert.deepEqual(gasite, ['Fata', 'masa']);

  const variante = analizeaza('Fata a pus cartea pe masa.', { lexicon }).nesigure[0].variante;
  assert.ok(variante.includes('Fata') && variante.includes('Fată'), `variante: ${variante}`);
});

test('infinitivul și persoana a III-a rămân amândouă posibile', () => {
  // Clasa pe care clasificarea o greșise sistematic: „putem rezolva" (infinitiv)
  // și „el rezolvă" (persoana a III-a) sunt amândouă forme reale.
  for (const cuvant of ['rezolva', 'verifica', 'transforma', 'forma', 'sa']) {
    assert.ok(nesigurele(cuvant).includes(cuvant), `„${cuvant}" trebuia lăsat ambiguu`);
  }
});

test('cuvintele care nu există fără semne se corectează pe loc', () => {
  for (const [tastat, asteptat] of [['patrat', 'pătrat'], ['inmultire', 'înmulțire'], ['si', 'și'], ['in', 'în'], ['dupa', 'după']]) {
    assert.equal(repara(tastat), asteptat);
  }
});

test('perechile articulat/nearticulat rămân de lămurit din context', () => {
  /*
   * „scoala" pare la prima vedere o corectură evidentă spre „școala", dar are
   * trei citiri reale: „școala" (articulat), „școală" (nearticulat) și „scoală"
   * (verbul „a se scula"). La fel „viata": „viața" și „viață". Motorul nu are
   * voie să aleagă singur aici — alegerea vine din context, nu din dicționar.
   */
  for (const cuvant of ['scoala', 'viata', 'masa', 'fata']) {
    assert.ok(nesigurele(cuvant).includes(cuvant), `„${cuvant}" trebuia lăsat ambiguu`);
    assert.equal(repara(cuvant), cuvant, `„${cuvant}" nu trebuie schimbat fără context`);
  }
});

test('poate revizui doar cuvintele puse chiar de motor', () => {
  const text = 'Fata a plecat.';
  const fara = analizeaza(text, { lexicon }).nesigure;
  assert.equal(fara.length, 1);

  // Cu „Fată" deja scris de om, nu se mai atinge nimeni de el…
  assert.equal(analizeaza('Fată a plecat.', { lexicon }).nesigure.length, 0);
  // …dar dacă l-am scris noi, îl putem cântări din nou.
  const alNostru = analizeaza('Fată a plecat.', { lexicon, puseDeNoi: new Set([0]) }).nesigure;
  assert.equal(alNostru.length, 1);
  assert.ok(alNostru[0].variante.includes('Fata'));
});

test('tăierea în propoziții urmează punctuația, nu rândurile', () => {
  const text = 'Prima frază aici.\nA doua\nfrază rupta pe randuri.';
  const grupuri = propozitii(tokenizeaza(text), text);
  assert.equal(grupuri.length, 2);
  assert.deepEqual(
    grupuri[1].map((b) => b.text),
    ['A', 'doua', 'frază', 'rupta', 'pe', 'randuri'],
    'fraza ruptă pe rânduri rămâne o singură propoziție',
  );
});

test('lexiconul răspunde repede', () => {
  const cuvinte = ['impartire', 'fata', 'scoala', 'necunoscut', 'xyzzy', 'numarul'];
  const start = performance.now();
  for (let i = 0; i < 20000; i++) lexicon.formele(cuvinte[i % cuvinte.length]);
  const perCautare = (performance.now() - start) * 1000 / 20000;
  assert.ok(perCautare < 20, `${perCautare.toFixed(1)} µs pe căutare — prea încet pentru scris în timp real`);
});
