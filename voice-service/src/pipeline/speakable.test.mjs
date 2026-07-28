/**
 * Teste pentru stratul de rostire.
 *
 * Fiecare caz de aici a fost întâi MĂSURAT pe espeak-ng cu vocea românească:
 * în stânga e ce scria modelul, în dreapta ce trebuie să ajungă la sinteză ca
 * elevul să audă un număr, nu o înșiruire de cifre.
 *
 * Caracterele invizibile se scriu cu cod, niciodată literal: un test pe care
 * nu îl poți citi nu dovedește nimic.
 *
 *   node --test voice-service/src/pipeline/speakable.test.mjs
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { toSpeakable } from './speakable.mjs';

/** Spațiul îngust pe care îl scrie modelul ca separator de mii. */
const INGUST = ' ';
const NEINTRERUPT = ' ';
const SUBTIRE = ' ';

test('separatorul de mii al modelului nu mai rupe numărul', () => {
  // Cu U+202F, espeak citea „unu zero zero zero" în loc de „o mie".
  assert.equal(toSpeakable(`Înmulțim cu 1${INGUST}000.`), 'Înmulțim cu 1000.');
  assert.equal(toSpeakable(`Avem 37${INGUST}540,85 aici.`), 'Avem 37540,85 aici.');
  assert.equal(toSpeakable(`Obținem 1${INGUST}234${INGUST}567.`), 'Obținem 1234567.');
  assert.equal(toSpeakable(`Sunt 5${NEINTRERUPT}140 de lei.`), 'Sunt 5140 de lei.');
  assert.equal(toSpeakable(`Sunt 2${SUBTIRE}360 de lei.`), 'Sunt 2360 de lei.');
});

test('spațiul obișnuit dintre cuvinte rămâne spațiu', () => {
  // Numai grupele de exact trei cifre se lipesc. „12,4, 3,9" sunt două numere.
  assert.equal(toSpeakable('Adună 12,4, 3,9 și 2,6.'), 'Adună 12,4, 3,9 și 2,6.');
  assert.equal(toSpeakable('Sunt 5 mere și 3 pere.'), 'Sunt 5 mere și 3 pere.');
  assert.equal(toSpeakable('Pagina 12 34 nu e un număr.'), 'Pagina 12 34 nu e un număr.');
});

test('liniuțele tipografice nu mai rup cuvântul și nu mai comută pe engleză', () => {
  // U+2011 se auzea „într o"; U+2212 se auzea „mainăs".
  assert.equal(toSpeakable('Într‑o zi.'), 'Într-o zi.');
  assert.equal(toSpeakable('Rezultă −5 aici.'), 'Rezultă minus 5 aici.');
  assert.equal(toSpeakable('Suma – adică 8 – este mare.'), 'Suma, adică 8, este mare.');
});

test('minusul dintre numere se rostește', () => {
  // espeak îl ignoră complet: „7 - 3 = 4" se auzea „șapte trei egal patru".
  assert.equal(toSpeakable('Avem 7 - 3 = 4.'), 'Avem 7 minus 3 = 4.');
  // Cratima dinăuntrul cuvintelor rămâne neatinsă.
  assert.equal(toSpeakable('Într-un caz oarecare.'), 'Într-un caz oarecare.');
});

test('simbolurile matematice se scriu în cuvinte', () => {
  assert.equal(toSpeakable('Avem 5 × 3.'), 'Avem 5 înmulțit cu 3.');
  assert.equal(toSpeakable('Avem 10 ÷ 2.'), 'Avem 10 împărțit la 2.');
  assert.equal(toSpeakable('Avem √2.'), 'Avem radical din 2.');
  assert.equal(toSpeakable('Este ≈ 3.'), 'Este aproximativ egal cu 3.');
  assert.equal(toSpeakable('Aria e π ori r.'), 'Aria e pi ori r.');
  assert.equal(toSpeakable('Latura AB ∥ CD.'), 'Latura AB paralel cu CD.');
  assert.equal(toSpeakable('Măsura ∠A este dreaptă.'), 'Măsura unghiul A este dreaptă.');
  assert.equal(toSpeakable('În ΔABC avem.'), 'În triunghiul ABC avem.');
});

test('comparațiile nu mai dispar în tăcere', () => {
  assert.equal(toSpeakable('Avem 8 < 9.'), 'Avem 8 mai mic decât 9.');
  assert.equal(toSpeakable('Avem 9 > 8.'), 'Avem 9 mai mare decât 8.');
  assert.equal(toSpeakable('Este ≤ 5.'), 'Este mai mic sau egal cu 5.');
});

test('puterile se rostesc ca la clasă', () => {
  assert.equal(toSpeakable('Calculăm x².'), 'Calculăm x la pătrat.');
  assert.equal(toSpeakable('Calculăm 5³.'), 'Calculăm 5 la cub.');
  assert.equal(toSpeakable('Calculăm 2^10.'), 'Calculăm 2 la puterea 10.');
  assert.equal(toSpeakable('Calculăm x^{n}.'), 'Calculăm x la puterea n.');
});

test('fracțiile dintr-un singur caracter nu mai sunt citite în engleză', () => {
  assert.equal(toSpeakable('Ia ½ din tort.'), 'Ia o doime din tort.');
  assert.equal(toSpeakable('Ia ¾ din tort.'), 'Ia trei pătrimi din tort.');
  assert.equal(toSpeakable('Avem 3/4 dintr-un întreg.'), 'Avem 3 supra 4 dintr-un întreg.');
});

test('unitățile citite ca nume de literă se scriu în cuvinte', () => {
  // „5 m" se auzea „cinci me", „5 g" se auzea „cinci ge".
  assert.equal(toSpeakable('Are 5 m lungime.'), 'Are 5 metri lungime.');
  assert.equal(toSpeakable('Are 1 m lungime.'), 'Are 1 metru lungime.');
  assert.equal(toSpeakable('Cântărește 250 g.'), 'Cântărește 250 grame.');
  assert.equal(toSpeakable('Sunt 3 l de apă.'), 'Sunt 3 litri de apă.');
  assert.equal(toSpeakable('Durează 45 min.'), 'Durează 45 minute.');
  assert.equal(toSpeakable('Aria e 12 m2.'), 'Aria e 12 metri pătrați.');
  assert.equal(toSpeakable('Volumul e 8 cm³.'), 'Volumul e 8 centimetri cubi.');
  // Unitățile pe care espeak le rostește corect rămân neatinse.
  assert.equal(toSpeakable('Are 5 cm și 2 kg.'), 'Are 5 cm și 2 kg.');
  // Un cuvânt care începe cu litera unei unități nu e o unitate.
  assert.equal(toSpeakable('Sunt 5 lei aici.'), 'Sunt 5 lei aici.');
  assert.equal(toSpeakable('Sunt 5 grame aici.'), 'Sunt 5 grame aici.');
});

test('rândurile devin spații, ca pauza dintre paragrafe să existe', () => {
  // Piper sintetizează fiecare linie separat și NU pune pauză între linii.
  assert.equal(toSpeakable('Prima frază.\n\nA doua frază.'), 'Prima frază. A doua frază.');
});

test('marcajele și ghilimelele nu ajung la sinteză', () => {
  assert.equal(toSpeakable('Un **număr** _zecimal_.'), 'Un număr zecimal.');
  assert.equal(toSpeakable('Spunem „virgulă” aici.'), 'Spunem virgulă aici.');
  assert.equal(toSpeakable('Text​cu﻿invizibile.'), 'Textcuinvizibile.');
});

test('zecimalele, orele și enumerările rămân intacte', () => {
  assert.equal(toSpeakable('Rezultatul este 8,82.'), 'Rezultatul este 8,82.');
  assert.equal(toSpeakable('Pașii sunt: 1. aduni, 2. scazi.'), 'Pașii sunt: 1. aduni, 2. scazi.');
  // Împărțirea se scrie cu spații; ora nu — de aceea ora rămâne oră.
  assert.equal(toSpeakable('Avem 12 : 4 = 3.'), 'Avem 12 împărțit la 4 = 3.');
  assert.equal(toSpeakable('Ora este 12:30 fix.'), 'Ora este 12:30 fix.');
});

test('notația LaTeX din material nu ajunge rostită', () => {
  // De când modelul primește codul sursă al lecției, poate copia notația din el.
  // Măsurat pe espeak: „37\,540{,}85" se auzea „treizeci și șapte virgulă cinci
  // patru zero, optzeci și cinci" — cifre pierdute, exact ce s-a reclamat.
  assert.equal(toSpeakable('Avem 37\\,540{,}85 aici.'), 'Avem 37540,85 aici.');
  assert.equal(toSpeakable('Este 0{,}1 din întreg.'), 'Este 0,1 din întreg.');
  assert.equal(toSpeakable('Scriem $37{,}5$ pe tablă.'), 'Scriem 37,5 pe tablă.');
  assert.equal(toSpeakable('\\text{Parte întreagă: } 37\\,540'), 'Parte întreagă: 37540');
  // Textul obișnuit nu are de suferit.
  assert.equal(toSpeakable('Rezultatul este 8,82.'), 'Rezultatul este 8,82.');
});

test('comenzile LaTeX cu înțeles se traduc, nu se șterg', () => {
  // Ștergerea oarbă transforma „\frac{3}{4}" în „34" — un număr plauzibil și
  // greșit, adică singurul fel de eroare pe care elevul nu are cum să o prindă.
  assert.equal(toSpeakable('Avem \\frac{3}{4} din tort.'), 'Avem 3 supra 4 din tort.');
  assert.equal(toSpeakable('Avem $\\dfrac{1}{2}$ aici.'), 'Avem 1 supra 2 aici.');
  assert.equal(toSpeakable('Calculăm \\sqrt{9}.'), 'Calculăm radical din 9.');
  assert.equal(toSpeakable('Avem 5 \\cdot 3.'), 'Avem 5 înmulțit cu 3.');
  assert.equal(toSpeakable('Avem 10 \\div 2.'), 'Avem 10 împărțit la 2.');
  assert.equal(toSpeakable('Este \\le 5.'), 'Este mai mic sau egal cu 5.');
  assert.equal(toSpeakable('Calculăm 2^{10}.'), 'Calculăm 2 la puterea 10.');
  assert.equal(toSpeakable('Avem \\left( 3 \\right) aici.'), 'Avem ( 3 ) aici.');
});
