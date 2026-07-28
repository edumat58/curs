/**
 * Teste pentru potrivirea dintre vorbire și pagină.
 *
 *   node --test src/lib/voice/sincronizare.test.mjs
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { aliniaza, imparteFraze, semne, timpiFraze, frazaLaMoment } from './sincronizare.mjs';

/** Blocuri de pagină, ca și cum ar veni din DOM. */
function bloc(text) {
  return { el: null, text, semne: semne(text), vizual: false };
}

test('împarte frazele exact ca sinteza', () => {
  assert.deepEqual(
    imparteFraze('Prima frază. A doua frază! A treia?'),
    ['Prima frază.', 'A doua frază!', 'A treia?']
  );
  // Virgula și punctul-virgulă NU sunt sfârșit de propoziție pentru Piper.
  assert.equal(imparteFraze('Unu, doi; trei. Patru.').length, 2);
});

test('numerele trag potrivirea către blocul din care provin', () => {
  const blocuri = [
    bloc('Definiție: un număr zecimal conține o virgulă zecimală.'),
    bloc('Exemplu: 37540,85 are partea întreagă 37540.'),
    bloc('Reprezentarea pozițională se face în tabel.'),
  ];
  const fraze = [
    'Un număr zecimal conține o virgulă zecimală.',
    'La 37540,85 partea întreagă este 37540.',
  ];
  assert.deepEqual(aliniaza(fraze, blocuri), [0, 1]);
});

test('alinierea rămâne monotonă chiar dacă lexical ar sări înapoi', () => {
  const blocuri = [
    bloc('Adunarea numerelor zecimale se face în coloană.'),
    bloc('Scăderea numerelor zecimale cere împrumut.'),
    bloc('Exemplu de adunare în coloană cu 345,20 și 7,92.'),
  ];
  const fraze = [
    'Adunarea se face în coloană.',
    'Scăderea cere împrumut.',
    // Fraza asta seamănă lexical și cu blocul 0, dar e după blocul 1.
    'La adunarea în coloană folosim 345,20 și 7,92.',
  ];
  const drum = aliniaza(fraze, blocuri);
  assert.deepEqual(drum, [0, 1, 2]);
  for (let i = 1; i < drum.length; i += 1) {
    assert.ok(drum[i] >= drum[i - 1], 'alinierea nu are voie să dea înapoi');
  }
});

test('o frază de tranziție nu inventează o țintă', () => {
  const blocuri = [bloc('Virgula separă partea întreagă de partea fracționară.')];
  const drum = aliniaza(['Virgula separă partea întreagă.', 'Hai să mergem mai departe.'], blocuri);
  assert.equal(drum[0], 0);
  assert.equal(drum[1], -1, 'fără potrivire reală, fraza rămâne fără bloc propriu');
});

test('timpii reali au prioritate, estimarea intră doar când lipsesc', () => {
  const fraze = ['Una.', 'Alta mult mai lungă decât prima.'];
  const reali = [{ start: 0, end: 1 }, { start: 1.2, end: 4 }];
  assert.equal(timpiFraze(fraze, reali, 4), reali);

  const estimati = timpiFraze(fraze, null, 10);
  assert.equal(estimati.length, 2);
  assert.ok(estimati[0].estimat);
  // Fraza mai lungă primește mai mult timp.
  assert.ok(estimati[1].end - estimati[1].start > estimati[0].end - estimati[0].start);
  assert.equal(Math.round(estimati[1].end), 10);
});

test('găsește fraza care se rostește la o secundă dată', () => {
  const timpi = [{ start: 0, end: 2 }, { start: 2.2, end: 5 }, { start: 5.2, end: 7 }];
  assert.equal(frazaLaMoment(timpi, 0.5), 0);
  assert.equal(frazaLaMoment(timpi, 2.1), 1, 'în pauză rămâne fraza care urmează');
  assert.equal(frazaLaMoment(timpi, 6), 2);
  assert.equal(frazaLaMoment(timpi, 99), 2);
});
