/**
 * Teste pentru garda de fidelitate.
 *
 * Citatele „✗" de mai jos sunt luate din explicații generate REAL și ascultate
 * de un elev — nu sunt cazuri inventate ca să treacă testul.
 *
 *   node --test voice-service/src/pipeline/fidelity.test.mjs
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { checkFidelity, detectMetaPhrases } from './fidelity.mjs';

const SECTIUNE = {
  heading: 'Definiție',
  contentText: 'Un număr zecimal conține o virgulă care separă partea întreagă de partea fracționară. Exemplu: 37540,85.',
  latex: [],
  visuals: [],
};

test('prinde exact fraza care a pornit reclamația', () => {
  // ✗ generat de model pentru o secțiune care nu avea niciun desen.
  const meta = detectMetaPhrases(
    'Figura arată o reprezentare grafică a acestei despărțiri, deși nu explică în detaliu legătura cu definiția.'
  );
  assert.ok(meta.some((m) => m.includes('vorbește despre suport')));
  assert.ok(meta.some((m) => m.includes('critică materialul')));
});

test('prinde evaluarea materialului, oricum ar fi formulată', () => {
  assert.ok(detectMetaPhrases('Imaginea de mai jos nu este foarte bine făcută.').length);
  assert.ok(detectMetaPhrases('Formula din material arată structura.').length);
  assert.ok(detectMetaPhrases('Lipsește explicația pentru al doilea caz.').length);
});

test('prinde modelul care se povestește pe sine', () => {
  assert.ok(detectMetaPhrases('Am parcurs definițiile și exemplele.').length);
  assert.ok(detectMetaPhrases('Închei cu speranța că totul este clar.').length);
});

test('ce lipsește dintr-un număr e conținut, nu o reclamație', () => {
  // ✗ Fals pozitiv prins în producție: garda a cerut două rescrieri pentru
  // fraza asta, care e matematică curată.
  assert.deepEqual(
    detectMetaPhrases('Dacă la sfârșitul părții zecimale lipsesc cifre, adăugăm zerouri.'),
    []
  );
  assert.deepEqual(detectMetaPhrases('Dacă nu îți este clar, reia pasul anterior.'), []);
  // Reclamația propriu-zisă rămâne prinsă.
  assert.ok(detectMetaPhrases('Lipsește explicația pentru al doilea caz.').length);
  assert.ok(detectMetaPhrases('Din material lipsesc detaliile despre împrumut.').length);
});

test('nu confundă vocabularul de manual cu vorbitul despre lecție', () => {
  // „figură" și „imagine" sunt termeni de matematică; a le interzice ca simple
  // cuvinte ar tăia exact conținutul corect.
  assert.deepEqual(detectMetaPhrases('Un triunghi este o figură geometrică plană.'), []);
  assert.deepEqual(detectMetaPhrases('Imaginea unui punct prin simetrie se notează cu prim.'), []);
  assert.deepEqual(detectMetaPhrases('Secțiunea axială a conului este un triunghi.'), []);
  assert.deepEqual(detectMetaPhrases('Materialul din care e făcut cubul nu contează.'), []);
});

test('formulările meta cer o rescriere, nu doar o notă în raport', () => {
  const curat = checkFidelity(SECTIUNE, 'Un număr zecimal are o virgulă care desparte partea întreagă de cea fracționară. La 37540,85 partea întreagă este 37540.');
  assert.equal(curat.needsReview, false);
  assert.equal(curat.metaPhrases.length, 0);

  const meta = checkFidelity(SECTIUNE, 'Figura arată cum se desparte numărul. La 37540,85 partea întreagă este 37540, iar restul urmează după virgulă.');
  assert.equal(meta.needsReview, true, 'o explicație care vorbește despre desen trebuie rescrisă');
  assert.ok(meta.metaPhrases.length);
});

test('valorile inventate rămân prinse', () => {
  const inventat = checkFidelity(SECTIUNE, 'Un număr zecimal are o virgulă. Să luăm 47,32 ca exemplu și să vedem cum se desparte în două părți distincte.');
  assert.ok(inventat.unsupportedNumbers.includes('47.32'));
  assert.equal(inventat.needsReview, true);
});

test('bucățile unui număr din sursă nu sunt invenții', () => {
  // Lecția cere exact despărțirea asta; garda o pedepsea ca halucinație.
  const corect = checkFidelity(SECTIUNE, 'Partea întreagă a lui 37540,85 este 37540, iar partea fracționară este 85 de sutimi, adică ce urmează după virgulă.');
  assert.deepEqual(corect.unsupportedNumbers, []);
});

test('numerele din codul sursă nu mai trec drept inventate', () => {
  // Măsurat pe „C1 - Scrierea sub forma zecimala": garda raporta 5 valori
  // inventate — 37.540, 23.6, 2360, 53.2, 5.32 — toate scrise în lecție, dar
  // în notație LaTeX. Scor 0,4 și două rescrieri cerute degeaba.
  const section = {
    heading: 'C1 - Scrierea sub forma zecimala',
    sourceCode: String.raw`
      \text{Exemplu: } 37\,540{,}85
      23{,}6 \times 100 = 2\,360
      53{,}2 \div 10 = 5{,}32
    `,
  };
  const transcript = 'Numărul 37.540,85 se descompune. Apoi 23,6 înmulțit cu 100 dă 2360, '
    + 'iar 53,2 împărțit la 10 dă 5,32.';
  const r = checkFidelity(section, transcript);
  assert.deepEqual(r.unsupportedNumbers, []);
  assert.equal(r.needsReview, false);
});

test('o valoare chiar inventată este în continuare prinsă', () => {
  const section = { heading: 'Definiție', sourceCode: 'Un număr zecimal are o virgulă.' };
  const r = checkFidelity(section, 'Să luăm numărul 3,5 ca exemplu.');
  assert.deepEqual(r.unsupportedNumbers, ['3.5']);
});

test('meta-frazele cu cuvinte între suport și verb sunt prinse', () => {
  // Citate din explicația generată REAL pentru „C1 - Scrierea sub forma
  // zecimala": trei formule anunțate, niciuna explicată. Tiparul vechi cerea
  // „formula arată" lipite, deci nu prindea niciuna.
  const rele = [
    'O formulă care reprezintă un exemplu de număr zecimal arată astfel.',
    'Apoi, o altă formulă arată reprezentarea pozițională a unui număr zecimal.',
    'Și, în final, o a treia formulă prezintă modul de citire a numerelor zecimale.',
    'În sfârșit, exemplul de împărțire la puteri zecimale ne arată cum se efectuează operația.',
  ];
  for (const text of rele) {
    assert.ok(detectMetaPhrases(text).length > 0, `nu a prins: ${text}`);
  }
});

test('matematica adevărată nu declanșează garda de meta-fraze', () => {
  // Fiecare propoziție de aici e conținut curat. O falsă alarmă costă o
  // rescriere din bugetul zilnic și poate strica un text bun.
  const bune = [
    'Virgula separă partea întreagă de partea fracționară.',
    'Un pătrat este o figură geometrică cu patru laturi egale.',
    'Aria dreptunghiului se calculează înmulțind lungimea cu lățimea.',
    'Împărțim 53,2 la 10 și obținem 5,32, pentru că virgula se mută spre stânga.',
    'Când la sfârșitul părții zecimale lipsesc cifre, adăugăm zerouri.',
    'Secțiunea axială a unui con este un triunghi isoscel.',
    'Dacă nu îți este clar, reia partea cu rangurile.',
    'Desenăm un unghi drept în punctul O și măsurăm laturile.',
  ];
  for (const text of bune) {
    assert.deepEqual(detectMetaPhrases(text), [], `fals pozitiv la: ${text}`);
  }
});

test('miile despărțite prin spațiu nu mai par valori inventate', () => {
  // Sursa scrie 2\,360; modelul scrie „2 360". Garda raporta „360" ca inventat.
  const section = { heading: 'Operații', sourceCode: String.raw`23{,}6 \times 100 = 2\,360` };
  const r = checkFidelity(section, 'Deci 23,6 înmulțit cu 100 face 2 360.');
  assert.deepEqual(r.unsupportedNumbers, []);
});

test('o zecimală cu trei cifre nu e confundată cu mii', () => {
  // „0.125" era citit ca grupare de mii și devenea „125", în timp ce „0,125"
  // din explicație rămânea „0.125": aceeași valoare, declarată inventată.
  const s = { heading: 'x', sourceCode: 'Avem 0.125 aici.' };
  assert.deepEqual(checkFidelity(s, 'Avem 0,125 aici.').unsupportedNumbers, []);
  // Iar gruparea reală de mii rămâne grupare.
  const t = { heading: 'x', sourceCode: String.raw`Avem 37\,540{,}85.` };
  assert.deepEqual(checkFidelity(t, 'Avem 37.540,85 deci.').unsupportedNumbers, []);
});

test('vocabularul de geometrie nu declanșează garda de meta-fraze', () => {
  // Golul de 60 de caractere între substantiv și verb prindea matematică bună.
  const bune = [
    'Graficul funcției trece prin origine și indică panta.',
    'Schema de calcul a ariei conține lungimea și lățimea.',
    'Desenul tehnic al unei case conține pereți.',
    'Figura geometrică se numește romb.',
    'Formula ariei unui dreptunghi se scrie lungime înmulțit cu lățime.',
  ];
  for (const text of bune) {
    assert.deepEqual(detectMetaPhrases(text), [], `fals pozitiv la: ${text}`);
  }
});
