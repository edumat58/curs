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
