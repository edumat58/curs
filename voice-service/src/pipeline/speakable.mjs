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

/**
 * Resturile de LaTeX, scoase ÎNAINTE de orice altceva.
 *
 * De când modelul primește codul sursă al lecției, poate copia notația din el
 * întocmai — și atunci espeak o citește literal, cu rezultate care sună exact
 * ca niște cifre tăiate. Măsurat pe espeak-ng, în română:
 *
 *   „37\,540{,}85" → „treizeci și șapte VIRGULĂ CINCI PATRU ZERO, optzeci…"  ✘
 *   „0{,}1"         → „zero, unu"  — virgula zecimală devine pauză           ✘
 *
 * Nu e o problemă de sinteză: Piper rostește uniform, verificat la ~51 ms pe
 * fonem indiferent de conținut. E textul care ajunge la el.
 *
 * Ordinea contează de două ori:
 * - `\,` dispare înainte de lipirea grupelor de mii, ca „37\,540" să devină
 *   „37540", nu „37 540";
 * - comenzile cu ÎNȚELES se traduc înainte de ștergerea generică. Fără asta,
 *   `\frac{3}{4}` ar rămâne „34" — un număr plauzibil și complet greșit, adică
 *   exact felul de eroare pe care un elev nu are cum să o prindă.
 */

/**
 * Argumentul unei comenzi, citit cu acolade ECHILIBRATE.
 *
 * Cu regex nu se poate: `[^{}]*` nu trece peste o acoladă interioară, deci
 * `\dfrac{1}{2^{3}}` nu se potrivea deloc și cădea la ștergerea generică, care
 * lipea cifrele: „12 la cub". Un număr plauzibil și fals — exact ce trebuia
 * evitat. Cazul nu e teoretic: în lecțiile din curs sunt 115 fracții cu acoladă
 * imbricată și 183 cu o comandă în operand.
 *
 * @returns {{corp: string, sfarsit: number}|null} null dacă acolada nu se
 *   închide — atunci textul rămâne neatins, că nu e LaTeX valid.
 */
function citesteArgument(text, start) {
  if (text[start] !== '{') return null;
  let adancime = 0;
  for (let i = start; i < text.length; i += 1) {
    if (text[i] === '{') adancime += 1;
    else if (text[i] === '}') {
      adancime -= 1;
      if (adancime === 0) return { corp: text.slice(start + 1, i), sfarsit: i + 1 };
    }
  }
  return null;
}

/** Comenzile cu argumente, și ce rămâne rostit din ele. */
const COMENZI = [
  // Fracțiile devin forma „3/4", pe care regula de mai jos o rostește „3 supra 4".
  { nume: ['frac', 'dfrac', 'tfrac'], argumente: 2, iesire: (a, b) => `${a}/${b}` },
  { nume: ['sqrt'], argumente: 1, iesire: (a) => `√${a}` },
  { nume: ['text', 'textrm', 'mathrm', 'mathbf', 'mathit', 'operatorname'], argumente: 1, iesire: (a) => a },
  /**
   * Culoarea nu se rostește, dar conținutul ei DA.
   *
   * Lecțiile colorează masiv (`\color{#FF6B6B}{37\,540}`). Ștearsă ca o comandă
   * oarecare, rămâneau două acolade lipite și codul culorii ajungea în text:
   * „#FF6B6B37540". Culoarea e formatare; numărul dinăuntru e lecția.
   */
  { nume: ['color'], argumente: 2, iesire: (_culoare, continut) => continut },
  { nume: ['textcolor', 'colorbox'], argumente: 2, iesire: (_culoare, continut) => continut },
];

/** Simbolurile fără argumente au deja echivalent rostit în `simboluriMatematice`. */
const SIMBOLURI_LATEX = [
  [/\\(?:cdot|times)(?![a-zA-Z])/g, '×'],
  [/\\div(?![a-zA-Z])/g, '÷'],
  [/\\(?:le|leq)(?![a-zA-Z])/g, '≤'],
  [/\\(?:ge|geq)(?![a-zA-Z])/g, '≥'],
  [/\\(?:ne|neq)(?![a-zA-Z])/g, '≠'],
  [/\\approx(?![a-zA-Z])/g, '≈'],
  [/\\pi(?![a-zA-Z])/g, 'π'],
  [/\\circ(?![a-zA-Z])/g, '°'],
];

/**
 * Aplică o singură dată comenzile cu argumente, de la stânga la dreapta.
 * Se rulează în buclă până nu se mai schimbă nimic: așa se desfac și
 * imbricările, dinspre exterior spre interior.
 */
function desfaComenzi(text) {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const m = /^\\([a-zA-Z]+)/.exec(text.slice(i));
    if (!m) { out += text[i]; i += 1; continue; }
    const regula = COMENZI.find((c) => c.nume.includes(m[1]));
    if (!regula) { out += m[0]; i += m[0].length; continue; }

    let poz = i + m[0].length;
    while (text[poz] === ' ') poz += 1;
    const argumente = [];
    // Spațiul se sare doar ÎNTRE argumente. Sărindu-l și după ultimul, comanda
    // se lipea de cuvântul următor: „\frac{3}{4} din tort" ieșea „3 supra 4din
    // tort", iar sinteza rostea un cuvânt inexistent.
    for (let k = 0; k < regula.argumente; k += 1) {
      if (k > 0) while (text[poz] === ' ') poz += 1;
      const arg = citesteArgument(text, poz);
      if (!arg) break;
      argumente.push(arg.corp);
      poz = arg.sfarsit;
    }
    // Comandă fără argumentele ei: o lăsăm ștergerii generice de mai jos.
    if (argumente.length < regula.argumente) { out += m[0]; i += m[0].length; continue; }
    out += regula.iesire(...argumente);
    i = poz;
  }
  return out;
}

function faraLatex(text) {
  let out = String(text)
    // spațiile fine din formule: \, \; \: \!
    .replace(/\\[,;:!]/g, '')
    // virgula zecimală protejată de acolade
    .replace(/\{\s*,\s*\}/g, ',');

  /**
   * Punct fix: `\dfrac{1}{\sqrt{2}}` are nevoie de două treceri — una pentru
   * fracție, alta pentru radicalul care abia atunci ajunge la suprafață.
   * Șase treceri acoperă orice imbricare din lecțiile reale (maximul văzut e 3).
   */
  for (let i = 0; i < 6; i += 1) {
    const inainte = out;
    out = desfaIndici(desfaComenzi(out));
    if (out === inainte) break;
  }

  for (const [re, semn] of SIMBOLURI_LATEX) out = out.replace(re, semn);

  return out
    // orice altă comandă rămasă (\left, \right, \quad, \displaystyle…)
    .replace(/\\[a-zA-Z]+/g, ' ')
    /**
     * Acoladele devin SPAȚIU, nu nimic.
     *
     * Dacă tot scapă o construcție pe care nu am prevăzut-o, „1 2" sună ciudat
     * și se aude că lipsește ceva; „12" sună perfect normal și e fals. Din două
     * rele, îl alegem pe cel pe care elevul îl poate sesiza. Garda de
     * fidelitate face deja la fel, în `faraNotatie`.
     */
    .replace(/[{}$]/g, ' ')
    .replace(/\s{2,}/g, ' ');
}

/** Exponenții și indicii cu acolade: `2^{3}` → `2^3`, `a_{n}` → `an`. */
function desfaIndici(text) {
  let out = '';
  let i = 0;
  while (i < text.length) {
    if ((text[i] === '^' || text[i] === '_') && text[i + 1] === '{') {
      const arg = citesteArgument(text, i + 1);
      if (arg) {
        out += text[i] === '^' ? `^${arg.corp}` : arg.corp;
        i = arg.sfarsit;
        continue;
      }
    }
    out += text[i];
    i += 1;
  }
  return out;
}

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
  // Titlurile de secțiune „[[Definiție]]" (marcajul cerut modelului): rostite ca
  // un titlu — propoziție de sine stătătoare, cu pauze de o parte și de alta, ca
  // profesorul care anunță pasul. Clientul le recunoaște în fluxul de cuvinte
  // după titlurile H2 ale lecției și le face clicabile spre secțiune.
  out = out.replace(/\[\[\s*([^\]]+?)\s*\]\]/g, '. $1. ');
  out = faraLatex(out);

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

  // Gradele se scriu „45^\circ" în lecțiile de geometrie. Fără regula asta,
  // circumflexul rămâne orfan și regula generală de mai jos face din el
  // „la puterea", pe un simbol care nu e exponent.
  out = out.replace(/\s*\^\s*°/g, ' grade');

  // Ridicare la putere scrisă cu circumflex: „2^10", „x^{n}".
  out = out.replace(/\^\s*\{([^}]{1,12})\}/g, (_all, exp) => spusaPutere(exp.trim()));
  /**
   * Exponentul se oprește la prima literă care începe un cuvânt nou.
   *
   * `\w{1,6}` înghițea cuvântul de după un circumflex rămas orfan: „2^ este"
   * dădea „la puterea este". Un exponent e ori numeric, ori o singură literă
   * (n, x, k) eventual cu cifră — nu un cuvânt.
   */
  out = out.replace(/\^\s*(-?(?:\d+|[a-zA-Z]\d?))(?![\p{L}])/gu, (_all, exp) => spusaPutere(exp));

  // Comparațiile: espeak taie „<" și „>" fără să scoată vreun sunet.
  out = out
    .replace(/(\d)\s*<\s*(\d)/g, '$1 mai mic decât $2')
    .replace(/(\d)\s*>\s*(\d)/g, '$1 mai mare decât $2')
    .replace(/\s<\s/g, ' mai mic decât ')
    .replace(/\s>\s/g, ' mai mare decât ')
    .replace(/(\d)\s*\*\s*(\d)/g, '$1 înmulțit cu $2');

  /**
   * Adunarea, scăderea și egalul scrise cu simboluri.
   *
   * Fără ele, o sumă lungă ca „3×10000+7×1000+5×100+…" se aude ca un singur
   * număr lipit și grăbit: Azure înghite „+" și nu lasă nicio pauză, așa că
   * ordinea termenilor se pierde (elevul aude „3 ori" apoi instant restul).
   * Punem CUVÂNTUL („plus", „minus", „egal cu") ȘI, la adunare/scădere, o
   * virgulă înainte — pauza scurtă face ca termenii unei sume lungi să fie
   * rostiți pe rând, în ordine, ca la tablă. Operanzii pot fi cifre, paranteze,
   * radical sau un exponent deja rostit (² ³), nu litere (ca să nu atingem
   * „A+" sau enumerări). Scăderea între cifre lipite („7-3") o prindem aici;
   * minusul dintr-un semn („rezultă -5") rămâne pentru `spokenMinus`.
   */
  out = out
    .replace(/([\d)%²³])\s*\+\s*(?=[\d(√])/g, '$1, plus ')
    .replace(/([\d)%²³])\s*=\s*(?=[\s\d(√+-]|minus|radical)/g, '$1 egal cu ')
    .replace(/(\d)\s*[-−–]\s*(?=\d)/g, '$1, minus ');

  // Împărțirea scrisă cu două puncte cere spații de o parte și de alta: așa se
  // scrie la clasă („12 : 4"), și tot așa se deosebește de o oră („12:30") sau
  // de o enumerare („Pașii sunt: 1. aduni").
  out = out
    .replace(/(\d) +: +(\d)/g, '$1 împărțit la $2')
    /**
     * Bara de fracție, și când operandul nu e o cifră.
     *
     * `\dfrac{1}{\sqrt{2}}` ajunge aici ca „1/radical din 2". Cu regula veche,
     * care cerea cifre de ambele părți, bara rămânea nerostită și elevul auzea
     * „unu radical din doi" — un PRODUS în loc de o împărțire. Cel mai urât fel
     * de greșeală: sună corect și garda de fidelitate nu are ce semnala.
     */
    /**
     * Partea dreaptă se verifică prin lookahead, ca să nu fie consumată: la
     * „1/2/3" regula veche lua „1/2" și pierdea a doua bară, pentru că „2" era
     * deja mâncat. Partea stângă rămâne cifră, paranteză sau radical — altfel
     * „și/sau" ar deveni „și supra sau".
     */
    .replace(/([\d)√])\s*\/\s*(?=\d|\(|√|radical|[a-zA-Z](?![a-zA-Z]))/g, '$1 supra ');

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
