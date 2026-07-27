/**
 * Ultimul strat dinaintea sintezei: transformă textul „ca la carte" în text
 * ROSTIBIL de espeak-ng în română.
 *
 * De ce e nevoie de el. Piper nu citește litere, ci foneme produse de
 * espeak-ng. Tot ce espeak nu recunoaște e fie tăiat în tăcere, fie citit în
 * altă limbă, fie rupt în bucăți — iar elevul aude o voce care se poticnește.
 * Regulile de mai jos nu sunt preferințe: fiecare corespunde unui caz măsurat
 * pe vocea `ro_RO-raluca-high`, cu fonemele scoase direct din espeak-ng.
 *
 * Cazul cel mai grav, cel care a pornit acest fișier — separatorul de mii.
 * Modelul de limbaj scrie „1 000" cu SPAȚIU ÎNGUST (U+202F), nu cu spațiu
 * obișnuit. Măsurat:
 *
 *   „1 000 de lei" cu spațiu normal  → „o mie de lei"          ✔
 *   „1 000 de lei" cu U+202F         → „unu zero zero zero…"   ✘
 *   „37 540,85" cu U+202F            → pierde complet „de mii" ✘
 *   „2 360" cu U+202F                → „doi trei sute șaizeci" ✘
 *
 * Exact asta se auzea ca „întrerupere la numere": numărul nu era rupt de o
 * pauză, ci citit grup cu grup, ca și cum ar fi fost mai multe numere.
 *
 * Caracterele invizibile sunt scrise cu coduri, nu literal: o clasă de
 * caractere pe care nu o poți vedea în editor nu o poate verifica nimeni.
 */

/** Spațiile care nu sunt spațiul obișnuit — inclusiv cel îngust, de la mii. */
const SPATII = '\\u00A0\\u1680\\u2000-\\u200A\\u202F\\u205F\\u3000';
const SPATII_EXOTICE = new RegExp(`[${SPATII}]`, 'g');
/** Separatorul de mii: cifră, spațiu exotic, exact trei cifre. */
const GRUPE_DE_MII = new RegExp(`(\\d)[${SPATII}](\\d{3})(?!\\d)`, 'g');
/** Lățime zero, marcaj de ordine, cratimă opțională — se șterg pur și simplu. */
const INVIZIBILE = /[­​-‍⁠﻿]/g;

/**
 * Unitățile pe care espeak le citește ca NUME DE LITERĂ, nu ca unitate.
 * Verificat: „5 cm" → „cinci centimetri" ✔, dar „5 m" → „cinci me" ✘,
 * „5 g" → „cinci ge" ✘, „5 l" → „cinci le" ✘, „5 dm" → „cinci deme" ✘.
 * Le scriem noi în cuvinte; pe cele pe care espeak le rostește corect
 * (cm, mm, km, kg, ml) nu le atingem.
 */
const UNITATI = {
  min: ['minut', 'minute'],
  dm: ['decimetru', 'decimetri'],
  m: ['metru', 'metri'],
  g: ['gram', 'grame'],
  l: ['litru', 'litri'],
  h: ['oră', 'ore'],
};
/** Cele mai lungi primele: altfel „m" ar mușca din „min". */
const UNITATI_ALTERNATIVA = Object.keys(UNITATI)
  .sort((a, b) => b.length - a.length)
  .join('|');

/** Unități de suprafață și volum: „m2", „cm³". */
const UNITATI_LUNGIME = {
  mm: 'milimetri', cm: 'centimetri', dm: 'decimetri', m: 'metri', km: 'kilometri',
};
const PUTERI_UNITATE = { 2: 'pătrați', 3: 'cubi' };

/**
 * Simboluri matematice pe care espeak fie le taie, fie le rostește în engleză.
 * Verificat: „×" și „÷" dispar complet, „≈" devine „approximately" (engleză),
 * „√2" devine doar „doi", „π" comută pe greacă.
 */
const SIMBOLURI = [
  [/[×✕✖]/g, ' înmulțit cu '],
  [/÷/g, ' împărțit la '],
  [/[·⋅∙]/g, ' înmulțit cu '],
  [/√\s*/g, ' radical din '],
  [/π/g, ' pi '],
  [/∞/g, ' infinit '],
  [/[≈≅≃]/g, ' aproximativ egal cu '],
  [/≠/g, ' diferit de '],
  [/[≤⩽]/g, ' mai mic sau egal cu '],
  [/[≥⩾]/g, ' mai mare sau egal cu '],
  [/[∥‖]/g, ' paralel cu '],
  [/⊥/g, ' perpendicular pe '],
  [/[∠∡]/g, ' unghiul '],
  [/[∆Δ△](?=[A-Z])/g, ' triunghiul '],
  [/∈/g, ' aparține lui '],
  [/∉/g, ' nu aparține lui '],
  [/∪/g, ' reunit cu '],
  [/∩/g, ' intersectat cu '],
  [/∅/g, ' mulțimea vidă '],
  [/⇒/g, ' deci '],
  [/⇔/g, ' echivalent cu '],
  [/[→↦]/g, ' tinde spre '],
  [/±/g, ' plus sau minus '],
  [/∓/g, ' minus sau plus '],
];

/** Fracțiile scrise cu un singur caracter — espeak le citește în engleză. */
const FRACTII = {
  '½': 'o doime', '⅓': 'o treime', '⅔': 'două treimi', '¼': 'o pătrime',
  '¾': 'trei pătrimi', '⅕': 'o cincime', '⅙': 'o șesime', '⅛': 'o optime',
};

/** Exponenții Unicode: „x²" e citit „iks doi", nu „iks la pătrat". */
const EXPONENTI = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
};

/** „la pătrat" / „la cub" / „la puterea n" — cum se spune la clasă. */
function spusaPutere(exponent) {
  if (exponent === '2') return ' la pătrat ';
  if (exponent === '3') return ' la cub ';
  return ` la puterea ${exponent} `;
}

/**
 * Separatorul de mii: îl ȘTERGEM, nu îl înlocuim cu spațiu.
 *
 * „1000" și „1 000" (cu spațiu obișnuit) sunt amândouă citite corect, dar
 * lipirea cifrelor e singura formă care nu depinde de felul spațiului. Se
 * aplică repetat, pentru numere cu mai multe grupe: „1 234 567".
 */
function lipesteGrupeleDeCifre(text) {
  let out = String(text);
  let previous;
  do {
    previous = out;
    out = out.replace(GRUPE_DE_MII, '$1$2');
  } while (out !== previous);
  return out;
}

/** Liniuțele tipografice: unele rup cuvântul, altele comută pe engleză. */
function normalizeazaLiniute(text) {
  return String(text)
    // Cratima care nu se rupe (U+2011) e citită ca despărțire de cuvinte:
    // „într‑o" se aude „într o". Cratima obișnuită se citește lipit.
    .replace(/[‐‑‒]/g, '-')
    // Minusul matematic (U+2212) comută espeak pe engleză: „mainăs".
    .replace(/−/g, '-')
    // Linia de dialog sau de paranteză, între spații, e o pauză — o virgulă.
    .replace(/\s[–—―]\s/g, ', ')
    .replace(/[–—―]/g, '-');
}

/**
 * Semnul minus scris („rezultă -5") nu are echivalent fonetic: espeak îl
 * ignoră complet, iar „7 - 3 = 4" se aude „șapte trei egal patru". Îl scriem
 * în cuvinte. Nu atingem cratima din interiorul cuvintelor.
 */
export function spokenMinus(text) {
  return String(text).replace(/(^|[\s(„"])[-−–]\s?(?=\d)/g, '$1minus ');
}

/**
 * Textul, pregătit pentru espeak-ng în română.
 *
 * Rezultatul e și textul salvat ca `explanationText`: ce se citește pe ecran
 * este exact ce se aude, ca o explicație suspectă să poată fi verificată fără
 * să fie reascultată.
 */
export function toSpeakable(text) {
  let out = String(text == null ? '' : text).normalize('NFC').replace(INVIZIBILE, '');

  out = lipesteGrupeleDeCifre(out);
  out = out.replace(SPATII_EXOTICE, ' ');
  out = normalizeazaLiniute(out);

  // Ghilimelele tipografice nu există în inventarul fonetic al modelului; sunt
  // ignorate oricum, dar le scoatem ca să nu se lipească de cuvântul următor.
  out = out.replace(/[„”“‟«»‹›]/g, ' ').replace(/[’‘]/g, "'");
  out = out.replace(/…/g, '...');

  // Marcajele Markdown rămase. `>` se tratează mai jos: e și marcaj de citat,
  // și „mai mare decât".
  out = out.replace(/```[\s\S]*?```/g, ' ').replace(/[*_#`]+/g, ' ');

  for (const [character, spoken] of Object.entries(FRACTII)) {
    out = out.split(character).join(` ${spoken} `);
  }

  // Unități de suprafață/volum, înaintea regulii generale de exponent:
  // „5 cm²" trebuie să devină „centimetri pătrați", nu „centimetri la pătrat".
  out = out.replace(
    /(?<=\d ?)(mm|cm|dm|km|m) ?([23²³])(?![\p{L}\d])/gu,
    (_all, unit, power) => {
      const digit = power === '²' ? '2' : power === '³' ? '3' : power;
      return `${UNITATI_LUNGIME[unit]} ${PUTERI_UNITATE[digit]}`;
    }
  );

  out = out.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (group) =>
    spusaPutere([...group].map((c) => EXPONENTI[c]).join(''))
  );

  for (const [pattern, spoken] of SIMBOLURI) out = out.replace(pattern, spoken);

  // Ridicare la putere scrisă cu circumflex: „2^10", „x^{n}".
  out = out.replace(/\^\s*\{([^}]{1,12})\}/g, (_all, exp) => spusaPutere(exp.trim()));
  out = out.replace(/\^\s*(-?\w{1,6})/g, (_all, exp) => spusaPutere(exp));

  // Comparațiile: espeak taie „<" și „>" fără să scoată vreun sunet.
  out = out
    .replace(/(\d)\s*<\s*(\d)/g, '$1 mai mic decât $2')
    .replace(/(\d)\s*>\s*(\d)/g, '$1 mai mare decât $2')
    .replace(/\s<\s/g, ' mai mic decât ')
    .replace(/\s>\s/g, ' mai mare decât ')
    .replace(/(\d)\s*\*\s*(\d)/g, '$1 înmulțit cu $2');

  // Împărțirea scrisă cu două puncte cere spații de o parte și de alta: așa se
  // scrie la clasă („12 : 4"), și tot așa se deosebește de o oră („12:30") sau
  // de o enumerare („Pașii sunt: 1. aduni").
  out = out
    .replace(/(\d) +: +(\d)/g, '$1 împărțit la $2')
    .replace(/(\d)\s*\/\s*(\d)/g, '$1 supra $2');

  out = spokenMinus(out);

  // Unitățile citite ca nume de literă. Cer o cifră înainte și sfârșit de
  // cuvânt după, ca să nu prindem „5 mere" sau prescurtări din text.
  out = out.replace(
    new RegExp(`(\\d+(?:[.,]\\d+)?) ?(${UNITATI_ALTERNATIVA})(?![\\p{L}\\d])`, 'gu'),
    (_all, value, unit) => {
      const [singular, plural] = UNITATI[unit];
      return `${value} ${value === '1' ? singular : plural}`;
    }
  );

  // Ce a mai rămas din marcajele Markdown, plus bara verticală.
  out = out.replace(/(^|\s)>+(\s|$)/g, '$1$2').replace(/\|/g, ' ');

  /**
   * Rândurile devin spații, intenționat.
   *
   * Piper sintetizează fiecare LINIE separat și NU pune pauză între linii
   * (contorul de propoziții repornește la fiecare rând). Cu textul pe un
   * singur rând, granița dintre paragrafe redevine o graniță normală de
   * propoziție, deci primește pauza obișnuită. Paradoxal, ștergând rândurile
   * câștigăm pauzele, nu le pierdem.
   */
  return out
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([,;:])(?=[^\s\d])/g, '$1 ')
    .replace(/\s+/g, ' ')
    .trim();
}
