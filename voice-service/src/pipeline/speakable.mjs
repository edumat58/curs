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
/** Literele unui nume geometric („AB", „MON"), rostite separat: „A B", „M O N". */
function litereSpatiate(grup) {
  const t = String(grup).replace(/[{}\\]/g, '').trim();
  return t.split('').map((c) => c.trim()).filter(Boolean).join(' ');
}

const COMENZI = [
  // Fracțiile devin forma „3/4", pe care regula de mai jos o rostește „3 supra 4".
  { nume: ['frac', 'dfrac', 'tfrac'], argumente: 2, iesire: (a, b) => `${a}/${b}` },
  { nume: ['sqrt'], argumente: 1, iesire: (a) => `√${a}` },
  // Radicalul cu ordin, adus aici de pre-pasul care rescrie `\sqrt[3]{54}`.
  { nume: ['radord'], argumente: 2, iesire: (ord, x) => ` radical de ordinul ${ord} din ${x} ` },
  { nume: ['text', 'textrm', 'mathrm', 'mathbf', 'mathit', 'operatorname'], argumente: 1, iesire: (a) => a },
  /**
   * Mulțimile de numere: „x ∈ ℝ" trebuie AUZIT ca apartenența la o mulțime cu
   * nume, nu ca o literă orfană. Audit: 242 de apariții \mathbb.
   */
  {
    nume: ['mathbb'],
    argumente: 1,
    iesire: (a) => ({
      N: ' mulțimea numerelor naturale ', Z: ' mulțimea numerelor întregi ',
      Q: ' mulțimea numerelor raționale ', R: ' mulțimea numerelor reale ',
      C: ' mulțimea numerelor complexe ',
    }[a.trim()] || ` ${a} `),
  },
  /**
   * Decorațiile geometrice poartă NUMELE obiectului: fără ele, „\overline{AB}"
   * rămânea „AB" citit ca un cuvânt. Audit: 300+ apariții pe clasa asta.
   */
  { nume: ['overline'], argumente: 1, iesire: (a) => ` segmentul ${litereSpatiate(a)} ` },
  { nume: ['overrightarrow', 'vec'], argumente: 1, iesire: (a) => ` semidreapta ${litereSpatiate(a)} ` },
  { nume: ['widehat', 'hat'], argumente: 1, iesire: (a) => ` unghiul ${litereSpatiate(a)} ` },
  /**
   * \overset{deasupra}{bază}: decorul de deasupra se aruncă — EXCEPTÂND arcul
   * (`\frown`), unde chiar decorul e sensul: „arcul B C".
   */
  {
    nume: ['overset', 'stackrel'],
    argumente: 2,
    iesire: (sus, baza) => (/frown/.test(sus) ? ` arcul ${litereSpatiate(baza)} ` : baza),
  },
  { nume: ['underset', 'underbrace'], argumente: 2, iesire: (_jos, baza) => baza },
  /**
   * Culoarea nu se rostește, dar conținutul ei DA.
   *
   * Lecțiile colorează masiv (`\color{#FF6B6B}{37\,540}`). Ștearsă ca o comandă
   * oarecare, rămâneau două acolade lipite și codul culorii ajungea în text:
   * „#FF6B6B37540". Culoarea e formatare; numărul dinăuntru e lecția.
   */
];

/**
 * Simbolurile fără argumente — fiecare fie spre Unicode-ul deja rostit de
 * `SIMBOLURI`, fie direct spre cuvinte.
 *
 * Tabelul e rezultatul auditului pe toate cele 158 de lecții: 106 comenzi LaTeX
 * unice, din care ~65 cădeau pe ștergerea generică. Consecințele nu erau doar
 * estetice: „x = \\pm 3" devenea „x egal cu 3" (FALS — soluția negativă
 * dispărea), „f(x) = \\sin x" devenea „f(x) = x", iar „d \\nparallel α"
 * devenea „d." — relația, adică lecția însăși, se pierdea în tăcere.
 */
const SIMBOLURI_LATEX = [
  // aritmetică și relații
  [/\\(?:cdot|times)(?![a-zA-Z])/g, '×'],
  [/\\div(?![a-zA-Z])/g, '÷'],
  [/\\(?:le|leq|leqslant)(?![a-zA-Z])/g, '≤'],
  [/\\(?:ge|geq|geqslant)(?![a-zA-Z])/g, '≥'],
  [/\\(?:ne|neq)(?![a-zA-Z])/g, '≠'],
  [/\\approx(?![a-zA-Z])/g, '≈'],
  [/\\pm(?![a-zA-Z])/g, '±'],
  [/\\mp(?![a-zA-Z])/g, '∓'],
  [/\\lt(?![a-zA-Z])/g, ' mai mic decât '],
  [/\\gt(?![a-zA-Z])/g, ' mai mare decât '],
  [/\\(?:dots|ldots|cdots|vdots|ddots)(?![a-zA-Z])/g, ' și așa mai departe '],
  [/\\%/g, ' la sută '],
  [/\\(?:min)(?![a-zA-Z])/g, ' minimul '],
  [/\\(?:max)(?![a-zA-Z])/g, ' maximul '],
  // mulțimi și logică
  [/\\in(?![a-zA-Z])/g, '∈'],
  [/\\notin(?![a-zA-Z])/g, '∉'],
  [/\\cap(?![a-zA-Z])/g, '∩'],
  [/\\cup(?![a-zA-Z])/g, '∪'],
  [/\\setminus(?![a-zA-Z])/g, ' fără '],
  [/\\(?:subset|subseteq|subsetneq)(?![a-zA-Z])/g, ' inclus în '],
  [/\\(?:supset|supseteq)(?![a-zA-Z])/g, ' include pe '],
  [/\\(?:emptyset|varnothing)(?![a-zA-Z])/g, '∅'],
  [/\\infty(?![a-zA-Z])/g, '∞'],
  [/\\mid(?![a-zA-Z])/g, ' astfel încât '],
  [/\\forall(?![a-zA-Z])/g, ' oricare ar fi '],
  [/\\exists(?![a-zA-Z])/g, ' există '],
  [/\\(?:Rightarrow|implies|Longrightarrow)(?![a-zA-Z])/g, '⇒'],
  [/\\(?:Leftrightarrow|iff|Longleftrightarrow)(?![a-zA-Z])/g, '⇔'],
  [/\\(?:rightarrow|to|mapsto)(?![a-zA-Z])/g, '→'],
  // geometrie
  [/\\(?:parallel)(?![a-zA-Z])/g, '∥'],
  [/\\nparallel(?![a-zA-Z])/g, ' neparalel cu '],
  [/\\perp(?![a-zA-Z])/g, '⊥'],
  [/\\equiv(?![a-zA-Z])/g, ' congruent cu '],
  [/\\(?:cong|simeq)(?![a-zA-Z])/g, ' congruent cu '],
  [/\\sim(?![a-zA-Z])/g, ' asemenea cu '],
  [/\\(?:measuredangle|sphericalangle|angle)(?![a-zA-Z])/g, '∡'],
  [/\\triangle(?![a-zA-Z])/g, ' triunghiul '],
  // trigonometrie — glosarul cere „tg"/„ctg", nu „tan"/„cot"
  [/\\sin(?![a-zA-Z])/g, ' sinus de '],
  [/\\cos(?![a-zA-Z])/g, ' cosinus de '],
  [/\\(?:tg|tan)(?![a-zA-Z])/g, ' tangenta de '],
  [/\\(?:ctg|cot)(?![a-zA-Z])/g, ' cotangenta de '],
  // litere grecești — subiectul propoziției în geometrie și la gradul 2
  [/\\alpha(?![a-zA-Z])/g, ' alfa '],
  [/\\beta(?![a-zA-Z])/g, ' beta '],
  [/\\gamma(?![a-zA-Z])/g, ' gama '],
  [/\\Delta(?![a-zA-Z])/g, ' delta '],
  [/\\delta(?![a-zA-Z])/g, ' delta '],
  [/\\(?:rho|varrho)(?![a-zA-Z])/g, ' ro '],
  [/\\mu(?![a-zA-Z])/g, ' miu '],
  [/\\(?:phi|varphi)(?![a-zA-Z])/g, ' fi '],
  [/\\lambda(?![a-zA-Z])/g, ' lambda '],
  [/\\theta(?![a-zA-Z])/g, ' teta '],
  [/\\omega(?![a-zA-Z])/g, ' omega '],
  [/\\sigma(?![a-zA-Z])/g, ' sigma '],
  [/\\(?:epsilon|varepsilon)(?![a-zA-Z])/g, ' epsilon '],
  [/\\ell(?![a-zA-Z])/g, ' l '],
  // constante
  [/\\pi(?![a-zA-Z])/g, 'π'],
  [/\\circ(?![a-zA-Z])/g, '°'],
  // negarea rămasă („\not" + simbol deja tradus) devine „nu"
  [/\\not(?![a-zA-Z])\s*/g, ' nu '],
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
    .replace(/\{\s*,\s*\}/g, ',')
    /**
     * Mediile (`\begin{aligned}` … `\end{aligned}`) se șterg cu TOT cu nume.
     *
     * Șterse generic, comanda pierea dar `{aligned}` rămânea, acoladele deveneau
     * spațiu și „aligned" ajungea ROSTIT — de două ori pe bloc. Audit: 100 de
     * blocuri `\begin` în lecții.
     */
    .replace(/\\begin\{[a-zA-Z*]+\}(\[[^\]]*\])?/g, ' ')
    .replace(/\\end\{[a-zA-Z*]+\}/g, ' ')
    /**
     * Separatorul de rând `\\` (cu sau fără `[10pt]`) închide propoziția:
     * într-un `aligned`, fiecare rând e o afirmație de sine stătătoare.
     */
    .replace(/\\\\(\[[^\]]*\])?/g, '. ')
    // marcatorii de aliniere & nu se rostesc
    .replace(/&&?/g, ' ')
    /**
     * Culoarea, în AMBELE forme. Forma-comutator (`{\color{red} text}`) nu are
     * al doilea argument, deci intrarea din COMENZI nu o prindea și „orangered"
     * ajungea rostit. Ștergând doar comanda + culoarea, conținutul rămâne în
     * ambele forme (la cea cu două argumente, acoladele devin spațiu mai jos).
     */
    .replace(/\\(?:color|textcolor|colorbox)\{[^}]*\}/g, '')
    // radicalul cu ordin: `\sqrt[3]{54}` → comanda radord, tradusă în COMENZI
    .replace(/\\sqrt\[([^\]]+)\]/g, '\\radord{$1}');

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
  [/[∠∡∢]/g, ' unghiul '],
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
  [/[⊂⊆]/g, ' inclus în '],
  [/[⊃⊇]/g, ' include pe '],
  [/≡/g, ' congruent cu '],
  [/∖/g, ' fără '],
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
/**
 * @param {object} [optiuni]
 * @param {boolean} [optiuni.litere=true] Convertește marcajele `<x>` în numele
 *   rostit al literei. La STOCARE se dă `false`: textul păstrat trebuie să
 *   rămână cu marcaje, altfel refacerea transcriptului („be"→„b") nu mai are
 *   după ce să se ghideze — exact defectul văzut pe G1, unde elevul vedea
 *   „punctele, a, și, be" în loc de „punctele A și B".
 */
export function toSpeakable(text, optiuni = {}) {
  let out = String(text == null ? '' : text).normalize('NFC').replace(INVIZIBILE, '');
  // Titlurile de secțiune „[[Definiție]]" (marcajul cerut modelului): rostite ca
  // un titlu — propoziție de sine stătătoare, cu pauze de o parte și de alta, ca
  // profesorul care anunță pasul. Clientul le recunoaște în fluxul de cuvinte
  // după titlurile H2 ale lecției și le face clicabile spre secțiune.
  out = out.replace(/\[\[\s*([^\]]+?)\s*\]\]/g, '. $1. ');
  out = marcheazaTitluriDeRand(out);
  /**
   * Punctul pe care tocmai l-am pus înaintea titlului se poate lipi de punctul
   * cu care se termina fraza dinainte („…pozițional.. Definiție."). Nu se auzea
   * cât punctuația era aruncată la sinteză; acum ea ajunge în transcript, deci
   * s-ar și VEDEA. Strângem orice serie de puncte separate de spații la unul.
   */
  out = out.replace(/([.!?])\s*\.(?=\s)/g, '$1');
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
    /**
     * Egalul dintre LITERE („a = b") rămânea nerostit: regula de mai sus cere
     * operanzi numerici. Aici îl prindem când de o parte și de alta stă o
     * literă singură — cazul formulelor cu variabile.
     */
    .replace(/(^|\s)([\p{L}])\s*=\s*(?=[\p{L}\d(√])/gu, '$1$2 egal cu ')
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
  out = out
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([,;:])(?=[^\s\d])/g, '$1 ')
    .replace(/\s+/g, ' ')
    .trim();

  out = desfaNumeGeometrice(out);
  out = desfaGrupuriDeLitere(out);
  return optiuni.litere === false ? out : marcheazaLitere(out);
}

/* (înlocuit de marcajul explicit `<k>`)
 * 
 *   • „coeficientul k" se auzea „che", nu „capa" (numele literei în română);
 *   • în „numărul a înmulțit cu b", litera „a" trecea atât de repede încât
 *     abia se distingea — un vocală singură nu apucă să sune.
 *
 * Nu putem trimite marcaj SSML de aici: textul e escapat XML la sinteză. Deci
 * doar ÎNCONJURĂM litera cu un caracter santinelă, iar constructorul de SSML îl
 * transformă, după escapare, în pronunția explicită (nume de literă + ritm mai
 * rar). Verificat cu Azure: granițele de cuvânt rămân curate — transcriptul
 * arată tot „k", „a", „b", nu numele rostit.
 *
 * Marcăm CONSERVATOR: doar literele care chiar sunt variabile, adică lipite de
 * o operație („a înmulțit cu b") sau anunțate de un cuvânt de matematică
 * („coeficientul k"). Altfel am prinde „a" din „a fost" sau prepoziții — în
 * română, litere ca „a", „o", „e" sunt și cuvinte întregi.
 */
/** Vocalele sunt și cuvinte în română („a plecat", „o carte"); consoanele, nu. */
const VOCALE = 'aeiou';

/**
 * Numele literelor, așa cum se rostesc în română la matematică.
 *
 * Se scriu ca TEXT OBIȘNUIT, nu ca marcaj SSML. Orice insulă `<phoneme>` sau
 * `<prosody>` de un caracter obligă vocea neurală să resintetizeze bucata
 * separat, iar cusătura se aude — timbrul sare la fiecare literă. Măsurat pe
 * aceeași frază cu șase litere: 10,6 s ca text, 12,5 s cu `phoneme`, 13,1 s cu
 * `phoneme` și `prosody`. Diferența nu e vorbire, sunt îmbinările.
 *
 * Vocalele își păstrează litera (numele lor E litera), dar primesc virgule: o
 * vocală singură trece altfel prea repede ca s-o distingi, iar virgula e o pauză
 * naturală, nu un artificiu de sinteză.
 */
const NUME_LITERE = {
  b: 'be', f: 'ef', g: 'ge', h: 'haș', j: 'je', k: 'capa', m: 'em', n: 'en',
  q: 'chiu', r: 'er', s: 'es', v: 've', w: 'dublu ve', x: 'ics', y: 'igrec',
  z: 'zet',
};

/**
 * Literele al căror nume ar fi un CUVÂNT curent nu se rescriu.
 *
 * „ce", „de", „pe", „te", „el" apar în orice frază românească. Dacă am rosti
 * litera așa, n-am mai putea spune, la refacerea transcriptului, care apariție
 * vine dintr-un marcaj și care e vorbire obișnuită — iar o potrivire greșită
 * schimbă un cuvânt din lecție. Literele astea rămân scrise ca literă; pronunția
 * lor nu e perfectă, dar textul rămâne corect.
 */

/**
 * Vocalele NU se rescriu: numele lor E litera.
 *
 * Le încadram cu virgule, ca să nu treacă neauzite — dar virgulele ajungeau în
 * transcript („Faptul că, a, este un multiplu"), pentru că punctuația se lipește
 * de cuvinte. Acum primesc două tăceri scurte, care se aud la fel de bine și nu
 * lasă nicio urmă în text.
 *
 * E și motivul pentru care refacerea literelor se strica: numele unei vocale e
 * un cuvânt curent („a"), iar potrivirea în ordine îl consuma la prima apariție
 * obișnuită din frază, decalând tot ce urma („be" și „capa" rămâneau nerefăcute).
 * Fără vocale în listă, ambiguitatea dispare.
 */
const VOCALE_MARCATE = 'aeiou';

/** Marcajul literelor-simbol: `<k>`, `<a>`, `<B>` — o singură literă. */
/**
 * Marcajul literelor-simbol: `<k>`, `<a>`, `<B>`.
 *
 * Inghite si spatiul dinaintea lui: virgula pusa pentru auz trebuie sa se
 * lipeasca de cuvantul anterior, nu sa pluteasca intre cuvinte.
 */
const MARCAJ_LITERA = /\s*<([a-zA-Z])>/g;

/**
 * Semnul de PAUZĂ, transformat la sinteză într-un `<break/>`.
 *
 * O pauză e silence curat, nu o schimbare de voce: spre deosebire de `prosody`
 * sau `phoneme`, nu obligă motorul să resintetizeze nimic, deci nu se aude
 * nicio cusătură.
 */


/**
 * Titlurile scrise pe rândul lor primesc pauze de o parte și de alta.
 *
 * Modelul nu marchează titlurile cu `[[...]]`; le lasă pe un rând singur, între
 * rânduri goale. Fără punct la capăt, titlul se lipea de fraza următoare
 * („Vocabular Când restul împărțirii…"), era rostit în goană — 718 ms măsurate —
 * și, la un clic pe secțiune, saltul cădea practic peste el. Aici îl facem
 * propoziție de sine stătătoare, cu tăcere înainte și după: se aude ca un anunț
 * și clicul are unde să aterizeze.
 *
 * Un titlu e un rând scurt, fără punctuație de final, singur între rânduri
 * goale — regula prin care îl recunoaște și cititorul.
 */
function marcheazaTitluriDeRand(text) {
  const linii = String(text).split(/\r?\n/);
  const gol = (i) => i < 0 || i >= linii.length || !linii[i].trim();
  return linii
    .map((linie, i) => {
      const t = linie.trim();
      if (!t || t.length > 60) return linie;
      if (/[.!?:;,]$/.test(t)) return linie;
      if (t.split(/\s+/).length > 8) return linie;
      if (!gol(i - 1) || !gol(i + 1)) return linie;
      return `${t}.`;
    })
    .join('\n');
}

/**
 * Perechile (nume rostit → literă), în ORDINEA din text.
 *
 * Cu ele, după sinteză, punem înapoi litera în lista de cuvinte: vocea spune
 * „capa", dar transcriptul afișează „k". Ordinea contează pentru că unele nume
 * sunt și cuvinte curente („de", „ce", „pe") — nu le putem recunoaște după cum
 * arată, doar după rând.
 */
export function litereMarcate(text) {
  const out = [];
  String(text || '').replace(MARCAJ_LITERA, (intreg, litera) => {
    const mic = litera.toLowerCase();
    // Vocalele se rostesc chiar ca litera lor, deci nu au ce reface — iar numele
    // lor fiind cuvinte curente, ar strica potrivirea în ordine.
    if (!VOCALE_MARCATE.includes(mic) && NUME_LITERE[mic]) {
      out.push({ nume: NUME_LITERE[mic], litera });
    }
    return intreg;
  });
  return out;
}

/**
 * Pune literele înapoi în cuvintele raportate de sinteză.
 *
 * Azure raportează ce a ROSTIT („capa"); elevul trebuie să vadă ce SCRIE lecția
 * („k"). Parcurgem cuvintele o dată, în ordine, și înlocuim a n-a apariție a
 * fiecărui nume cu litera lui — așa „de" dintr-o propoziție obișnuită rămâne
 * neatins, pentru că nu e la rândul unei marcări.
 */
/**
 * Intervalele de cuvinte rostite ale fiecărei formule `$...$` din text.
 *
 * Reprezentarea dublă: elevul VEDE formula randată (KaTeX), vocea o CITEȘTE în
 * cuvinte. Ca evidențierea să curgă prin formulă și clicul să sară la ea, avem
 * nevoie de maparea formulă → [primul, ultimul] cuvânt rostit. O calculăm după
 * sinteză, pe cuvintele REALE raportate: forma rostită a fiecărei formule se
 * caută ca subsecvență monotonă în lista de cuvinte — aceeași tehnică folosită
 * la titluri, robustă la felul în care motorul desparte cuvintele.
 *
 * @param {string} text Textul stocat, cu `$...$` intacte.
 * @param {Array} words Cuvintele sintezei ({t,d,w}).
 * @param {(s: string) => string} rosteste cleanForSpeech-ul serverului.
 * @returns {Array<{s:number,e:number,tex:string}>}
 */
export function calculeazaFormule(text, words, rosteste) {
  if (!Array.isArray(words) || !words.length) return [];
  const formule = [...String(text || '').matchAll(/\$([^$\n]+)\$/g)].map((m) => m[1].trim()).filter(Boolean);
  if (!formule.length) return [];

  const norm = (w) => String(w || '').toLowerCase().replace(/[^\p{L}\d]/gu, '');
  const cuvinteNorm = words.map((w) => norm(w.w));

  const out = [];
  let cursor = 0;
  for (const tex of formule) {
    const rostit = String(rosteste(tex)).split(/\s+/).map(norm).filter(Boolean);
    if (!rostit.length) continue;
    let gasit = -1;
    for (let i = cursor; i <= cuvinteNorm.length - rostit.length; i += 1) {
      let ok = true;
      for (let k = 0; k < rostit.length; k += 1) {
        if (cuvinteNorm[i + k] !== rostit[k]) { ok = false; break; }
      }
      if (ok) { gasit = i; break; }
    }
    if (gasit < 0) continue; // formula nerecunoscută în rostire: rămâne text simplu
    out.push({ s: gasit, e: gasit + rostit.length - 1, tex });
    cursor = gasit + rostit.length;
  }
  return out;
}

export function repuneLitere(words, perechi) {
  if (!Array.isArray(words) || !words.length || !perechi || !perechi.length) return words;
  /**
   * Deterministă, NU în ordine.
   *
   * Prima variantă potrivea perechile una câte una, în ordinea marcajelor: la
   * prima nepotrivire sărea peste restul. Măsurat pe o lecție reală: din 11
   * marcaje, 8 refăcute și 3 rămase „be"/„capa" în transcript.
   *
   * Numele rostite sunt alese acum ca să nu fie cuvinte românești, deci orice
   * apariție a lor vine sigur dintr-un marcaj și se poate reface direct. Nu mai
   * există ordine de ținut, deci nici cum să se decaleze.
   */
  const dupaNume = new Map();
  perechi.forEach((p) => dupaNume.set(p.nume.toLowerCase(), p.litera));
  /**
   * Sinteza lipește uneori un simbol de cuvânt și le raportează împreună:
   * măsurat, „= be" a venit ca un singur cuvânt, iar potrivirea exactă a ratat-o.
   * Despărțim ce e literă de ce e în jurul ei și punem la loc doar miezul.
   */
  const bucati = (brut) => /^([^\p{L}]*)(\p{L}+)([^\p{L}]*)$/u.exec(String(brut || '').trim());
  const refacuteIdx = new Set();
  const refacute = words.map((w, i) => {
    const p = bucati(w.w);
    if (!p) return w;
    const litera = dupaNume.get(p[2].toLowerCase());
    if (!litera) return w;
    refacuteIdx.add(i);
    return { ...w, w: `${p[1]}${litera}${p[3]}` };
  });

  /**
   * Virgulele puse pentru auz nu au ce cauta in transcript — dar se sterg DOAR
   * in jurul literelor pe care le-am marcat noi, nicaieri altundeva.
   *
   * O litera marcata se recunoaste sigur in doua feluri: fie e o consoana pe care
   * tocmai am refacut-o din numele ei rostit, fie e o litera singura ROSTITA LUNG.
   * Diferenta e masurata, nu presupusa: intr-o lectie reala, literele marcate
   * (care primesc virgule) tin 399-439 ms, iar literele care sunt cuvinte
   * obisnuite („a plecat", „o carte") tin 40-53 ms. Pragul de 200 ms le separa
   * fara sa se atinga de virgulele scrise de om.
   */
  const PRAG_LITERA_ROSTITA = 200;
  const doarLitera = (brut) => /^[^\p{L}]*(\p{L})[^\p{L}]*$/u.exec(String(brut || '').trim());
  const eMarcata = (w, refacut) => {
    if (!w) return false;
    const p = doarLitera(w.w);
    if (!p) return false;
    return refacut || w.d >= PRAG_LITERA_ROSTITA;
  };
  const faraVirgula = (brut) => String(brut).replace(/,(?=\s*$)/, '').replace(/,(?=[^\p{L}\d]*$)/u, '');

  return refacute.map((w, i) => {
    const urmator = refacute[i + 1];
    const aceasta = eMarcata(w, refacuteIdx.has(i));
    const urmatoareaEMarcata = eMarcata(urmator, refacuteIdx.has(i + 1));
    if (!aceasta && !urmatoareaEMarcata) return w;
    return { ...w, w: faraVirgula(w.w) };
  });

}

/**
 * Marchează literele-variabilă, în ORICE context matematic.
 *
 * Prima variantă cerea ca litera să fie lipită de o operație sau de un cuvânt de
 * matematică, cu spații de o parte și de alta. Pe text real n-a marcat nimic:
 * modelul scrie literele ÎNTRE GHILIMELE — „un număr întreg «a» la un număr
 * întreg «b»", „spunem că «b» este un divizor al lui «a»" — iar ghilimelele nu
 * erau recunoscute ca delimitator. Trei reguli, de la sigur la prudent:
 *
 *   1. Literă între ghilimele → simbol, întotdeauna. Ghilimelele SUNT semnalul.
 *   2. Consoană de sine stătătoare → variabilă. În română nicio consoană nu e
 *      cuvânt, deci nu avem ce strica (excepție: unitățile după cifră, „5 m").
 *   3. Vocală de sine stătătoare → doar în context matematic, pentru că „a",
 *      „o", „e" sunt cuvinte curente („a plecat", „o carte", „e bine").
 */
/**
 * Grupurile de litere puse din greșeală în paranteze unghiulare („<MON>", „<AB>").
 *
 * Modelul a generalizat marcajul de literă și a început să scrie așa numele
 * unghiurilor și segmentelor. Marcajul recunoaște doar o literă, deci „<MON>"
 * rămânea în text și se rostea ca un cuvânt inventat. Aici îl desfacem în litere
 * separate prin spațiu — exact cum se citește „unghiul M O N" la tablă.
 */
/**
 * Numele geometrice din litere lipite („unghiul DAB", „segmentele OP și ON")
 * se rostesc literă cu literă: „unghiul D A B".
 *
 * După traducerea notațiilor de unghi, literele rămâneau lipite și sinteza le
 * citea ca pe un cuvânt inventat. Se desfac DOAR grupurile care nu pot fi
 * altceva: fie după un cuvânt geometric, fie orfane — dar niciodată numeralele
 * romane („clasa a VI-a" rămâne neatinsă).
 */
function desfaNumeGeometrice(text) {
  const spatiat = (g) => g.split('').join(' ');
  let out = String(text).replace(
    /\b(unghiul|unghiurile|triunghiul|triunghiurile|segmentul|segmentele|arcul|arcele|semidreapta|semidreptele|dreapta|dreptele|punctele|patrulaterul|paralelogramul|trapezul|rombul|dreptunghiul|laturile|latura|cercul|diagonala|diagonalele|mediana|medianele|planul|planele)\s+([A-Z]{2,4})\b/g,
    (_a, cuvant, grup) => `${cuvant} ${spatiat(grup)}`
  );
  // grupurile orfane (2-4 majuscule) care nu sunt numerale romane
  out = out.replace(/\b([A-Z]{2,4})\b/g, (tot, grup) => (/^[IVX]+$/.test(grup) ? tot : spatiat(grup)));
  return out;
}

function desfaGrupuriDeLitere(text) {
  return String(text).replace(/<([A-Za-z]{2,4})>/g, (_all, grup) => grup.split('').join(' '));
}

function marcheazaLitere(text) {
  /**
   * Literele-simbol se marchează EXPLICIT în text: `<k>`, `<a>`, `<b>`.
   *
   * Varianta anterioară le ghicea din context (ghilimele, cuvinte de
   * matematică). Ghicitul e mereu ori prea larg — „a" din „a plecat" —, ori
   * prea îngust: pe textul real n-a prins nimic, pentru că modelul scria
   * literele altfel decât presupusesem. Marcajul mută decizia acolo unde se
   * cunoaște: la cel care scrie lecția (om sau model). Ce nu e marcat se
   * rostește ca până acum.
   */
  return String(text).replace(MARCAJ_LITERA, (intreg, litera) => {
    const mic = litera.toLowerCase();
    const nume = VOCALE_MARCATE.includes(mic) ? litera : NUME_LITERE[mic];
    if (!nume) return intreg;
    /**
     * VIRGULE, nu pauze SSML.
     *
     * O literă singură trece altfel neauzită: măsurat, „a" ținea 80 ms într-o
     * frază normală. Cu virgule ajunge la 386 ms — de aproape cinci ori — pentru
     * că motorul pune el pauza, ca la orice enumerare.
     *
     * Nu folosim `<break/>`: măsurat, o tăcere în mijlocul frazei face sinteza
     * să raporteze tot restul frazei ca un singur „cuvânt", iar transcriptul se
     * umple de fragmente repetate. Virgulele nu au efectul ăsta — verificat,
     * zero granițe corupte. Ele ajung însă în text, deci se curăță la refacere.
     */
    return `, ${nume},`;
  })
    // Curatenie de forma, ca textul rostit sa arate a text scris:
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/,\s*([.!?;:])/g, '$1')
    .replace(/,{2,}/g, ',')
    .replace(/\s{2,}/g, ' ');
}
