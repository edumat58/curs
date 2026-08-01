/**
 * Automatismele — întrebările propriu-zise, una pe procedură.
 *
 * Lista urmează programa școlară de matematică pentru clasele a V-a – a VIII-a
 * (OMEN 3393/28.02.2017), capitol cu capitol. Fiecare intrare din registrul de
 * la sfârșit poartă capitolul din care vine, ca să se vadă dintr-o privire ce e
 * acoperit.
 *
 * Ideea de „automatism" vine din didactica franceză (Éduscol, „Les automatismes
 * au collège"): o procedură atât de bine fixată încât nu mai cere atenție,
 * lăsând memoria de lucru liberă pentru raționament. De acolo e luată forma —
 * întrebări scurte, generate din nou de fiecare dată, cu corectură imediată —
 * dar conținutul e cel din programa românească, nu din cea franceză. Cele două
 * nu se suprapun: sistemul de axe, de pildă, e clasa a VII-a la noi și a VI-a
 * acolo, iar geometria în spațiu e materie de clasa a VIII-a.
 *
 * ── Contractul unei întrebări ────────────────────────────────────────────────
 *
 *   {
 *     prompt:  { text?, latex?, svg? },
 *     blanks:  [ { label, answer, kind, tol?, options? } ],
 *     solutionLatex?: string,
 *   }
 *
 *   kind:  'int'    număr întreg
 *          'dec'    număr cu zecimale (se acceptă și virgulă, și punct)
 *          'text'   un cuvânt
 *          'choice' alegere din `options`, afișată ca butoane
 *
 * Două reguli, respectate peste tot:
 *
 *   **Elevul nu tastează matematică.** Nu are pe tastatură radical, fracție sau
 *   exponent. O fracție se cere pe două casete — numărător și numitor — iar o
 *   clasificare se alege dintr-o listă. Nimeni nu pierde un punct fiindcă n-a
 *   nimerit cum se scrie o expresie.
 *
 *   **Cerința spune ce se completează, fără indicii.** Eticheta fiecărei casete
 *   e explicită, iar în enunț nu se strecoară sugestii între paranteze de tipul
 *   „scrie ca fracție" — acelea nu sunt cerință, sunt ajutor deghizat.
 *
 * Codul e JavaScript simplu, fără React, ca să poată fi folosit și în afara
 * componentei.
 */

/* ─────────────────────────── unelte de lucru ─────────────────────────── */

/** Întreg aleator din intervalul închis [min, max]. */
export function ri(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Un element oarecare dintr-o listă. */
export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Întreg nenul din [min, max] — pentru numitori, coeficienți, rapoarte. */
function nz(min, max) {
  let v = 0;
  while (v === 0) v = ri(min, max);
  return v;
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x || 1;
}

function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

/** Fracția, adusă la formă ireductibilă, cu semnul la numărător. */
function simplifica(n, d) {
  const semn = d < 0 ? -1 : 1;
  const k = gcd(n, d);
  return [(semn * n) / k, (semn * d) / k];
}

function estePrim(n) {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d += 1) if (n % d === 0) return false;
  return true;
}

/** Descompunerea în factori primi, ca listă de perechi [factor, exponent]. */
function factoriPrimi(n) {
  const out = [];
  let m = n;
  for (let d = 2; d * d <= m; d += 1) {
    let e = 0;
    while (m % d === 0) { m /= d; e += 1; }
    if (e) out.push([d, e]);
  }
  if (m > 1) out.push([m, 1]);
  return out;
}

function divizori(n) {
  const out = [];
  for (let d = 1; d <= n; d += 1) if (n % d === 0) out.push(d);
  return out;
}

/** Fracție în LaTeX; întregii se scriu ca atare, nu ca fracție cu numitor 1. */
function fracLatex(n, d) {
  if (d === 1) return `${n}`;
  if (n < 0) return `-\\dfrac{${Math.abs(n)}}{${d}}`;
  return `\\dfrac{${n}}{${d}}`;
}

/** Termen cu semn, pentru concatenare: „+ 3", „- 3". */
function cuSemn(n) {
  return n < 0 ? `- ${Math.abs(n)}` : `+ ${n}`;
}

/** Coeficient literal: 1x → x, −1x → −x. */
function coef(c, v = 'x') {
  if (c === 1) return v;
  if (c === -1) return `-${v}`;
  return `${c}${v}`;
}

/** Termen literal cu semn: „+ x", „- 3x" — niciodată „+ 1x". */
function termenCuSemn(c, v = 'x') {
  const a = Math.abs(c);
  const t = a === 1 ? v : `${a}${v}`;
  return c < 0 ? `- ${t}` : `+ ${t}`;
}

/** Numărul, scris cu virgulă zecimală, cum se scrie în manualele românești. */
function zec(x, cifre = 2) {
  return Number(x.toFixed(cifre)).toString().replace('.', ',');
}

/* Etichete folosite des — scrise o dată, ca să sune la fel peste tot. */
const REZULTATUL = 'Rezultatul';

/** Cele două casete ale unei fracții, cerute ca numere. */
function campuriFractie(n, d) {
  return [
    { label: 'Numărătorul rezultatului', answer: n, kind: 'int' },
    { label: 'Numitorul rezultatului', answer: d, kind: 'int' },
  ];
}

/* ════════════════════════════════════════════════════════════════════════
   CLASA a V-a
   ════════════════════════════════════════════════════════════════════════ */

/** Numere naturale — înmulțire și împărțire din tablă. */
export function vTablaInmultirii() {
  const a = ri(2, 9);
  const b = ri(2, 9);
  const fel = pick(['produs', 'cat', 'factor']);
  if (fel === 'produs') {
    return {
      prompt: { latex: `${a} \\cdot ${b}` },
      blanks: [{ label: REZULTATUL, answer: a * b, kind: 'int' }],
      solutionLatex: `${a} \\cdot ${b} = ${a * b}`,
    };
  }
  if (fel === 'cat') {
    return {
      prompt: { latex: `${a * b} : ${a}` },
      blanks: [{ label: REZULTATUL, answer: b, kind: 'int' }],
      solutionLatex: `${a * b} : ${a} = ${b}`,
    };
  }
  return {
    prompt: { text: `Ce număr înmulțit cu $${a}$ dă $${a * b}$?` },
    blanks: [{ label: 'Numărul', answer: b, kind: 'int' }],
    solutionLatex: `${a} \\cdot ${b} = ${a * b}`,
  };
}

/** Ordinea efectuării operațiilor, cu și fără paranteze. */
export function vOrdineaOperatiilor() {
  const a = ri(2, 9); const b = ri(2, 9); const c = ri(2, 9);
  const fel = pick(['fara', 'paranteze', 'trei']);
  if (fel === 'fara') {
    return {
      prompt: { latex: `${a} + ${b} \\cdot ${c}` },
      blanks: [{ label: REZULTATUL, answer: a + b * c, kind: 'int' }],
      solutionLatex: `${a} + ${b} \\cdot ${c} = ${a} + ${b * c} = ${a + b * c}`,
    };
  }
  if (fel === 'paranteze') {
    return {
      prompt: { latex: `(${a} + ${b}) \\cdot ${c}` },
      blanks: [{ label: REZULTATUL, answer: (a + b) * c, kind: 'int' }],
      solutionLatex: `(${a} + ${b}) \\cdot ${c} = ${a + b} \\cdot ${c} = ${(a + b) * c}`,
    };
  }
  const d = ri(1, 9);
  return {
    prompt: { latex: `${a} + ${b} \\cdot ${c} - ${d}` },
    blanks: [{ label: REZULTATUL, answer: a + b * c - d, kind: 'int' }],
    solutionLatex: `${a} + ${b * c} - ${d} = ${a + b * c - d}`,
  };
}

/** Puteri cu exponent natural și reguli de calcul cu puteri. */
export function vPuteri() {
  const fel = pick(['valoare', 'produs', 'cat', 'putereaPuterii']);
  if (fel === 'valoare') {
    const a = pick([2, 3, 4, 5, 10]);
    const n = a === 2 ? ri(2, 8) : ri(2, 4);
    return {
      prompt: { latex: `${a}^{${n}}` },
      blanks: [{ label: REZULTATUL, answer: a ** n, kind: 'int' }],
      solutionLatex: `${a}^{${n}} = ${a ** n}`,
    };
  }
  const a = ri(2, 7);
  const m = ri(2, 6); const n = ri(2, 5);
  if (fel === 'produs') {
    return {
      prompt: { text: `Scrie $${a}^{${m}} \\cdot ${a}^{${n}}$ ca o singură putere a lui $${a}$.` },
      blanks: [{ label: 'Exponentul', answer: m + n, kind: 'int' }],
      solutionLatex: `${a}^{${m}} \\cdot ${a}^{${n}} = ${a}^{${m + n}}`,
    };
  }
  if (fel === 'cat') {
    const mare = m + n;
    return {
      prompt: { text: `Scrie $${a}^{${mare}} : ${a}^{${n}}$ ca o singură putere a lui $${a}$.` },
      blanks: [{ label: 'Exponentul', answer: mare - n, kind: 'int' }],
      solutionLatex: `${a}^{${mare}} : ${a}^{${n}} = ${a}^{${mare - n}}`,
    };
  }
  return {
    prompt: { text: `Scrie $\\left(${a}^{${m}}\\right)^{${n}}$ ca o singură putere a lui $${a}$.` },
    blanks: [{ label: 'Exponentul', answer: m * n, kind: 'int' }],
    solutionLatex: `\\left(${a}^{${m}}\\right)^{${n}} = ${a}^{${m * n}}`,
  };
}

/** Pătrate perfecte: recunoaștere și rădăcină. */
export function vPatratPerfect() {
  if (Math.random() < 0.5) {
    const perfect = Math.random() < 0.5;
    let n;
    if (perfect) {
      n = ri(2, 20) ** 2;
    } else {
      do { n = ri(5, 400); } while (Number.isInteger(Math.sqrt(n)));
    }
    return {
      prompt: { text: `Numărul $${n}$ este pătrat perfect?` },
      blanks: [{ label: 'Alege', answer: perfect ? 'da' : 'nu', kind: 'choice', options: ['da', 'nu'] }],
      solutionLatex: perfect
        ? `${n} = ${Math.sqrt(n)}^2`
        : `${n} \\text{ nu este pătratul niciunui număr natural}`,
    };
  }
  const r = ri(2, 25);
  return {
    prompt: { text: `Ce număr natural ridicat la pătrat dă $${r * r}$?` },
    blanks: [{ label: 'Numărul', answer: r, kind: 'int' }],
    solutionLatex: `${r}^2 = ${r * r}`,
  };
}

/** Împărțirea cu rest: câtul și restul. */
export function vImpartireCuRest() {
  const b = ri(3, 12);
  const q = ri(2, 30);
  const r = ri(0, b - 1);
  const a = b * q + r;
  return {
    prompt: { text: `Împarte $${a}$ la $${b}$.` },
    blanks: [
      { label: 'Câtul', answer: q, kind: 'int' },
      { label: 'Restul', answer: r, kind: 'int' },
    ],
    solutionLatex: `${a} = ${b} \\cdot ${q} + ${r}`,
  };
}

/** Criteriile de divizibilitate cu 2, 3, 5, 9 și 10. */
export function vCriteriiDivizibilitate() {
  const d = pick([2, 3, 5, 9, 10]);
  const n = Math.random() < 0.5 ? d * ri(4, 120) : ri(20, 999);
  return {
    prompt: { text: `Numărul $${n}$ se divide cu $${d}$?` },
    blanks: [{ label: 'Alege', answer: n % d === 0 ? 'da' : 'nu', kind: 'choice', options: ['da', 'nu'] }],
    solutionLatex: n % d === 0
      ? `${n} = ${d} \\cdot ${n / d}`
      : `${n} : ${d} \\text{ dă restul } ${n % d}`,
  };
}

/** Divizori și multipli ai unui număr natural. */
export function vDivizoriMultipli() {
  const fel = pick(['numarDivizori', 'esteDivizor', 'multiplu']);
  if (fel === 'numarDivizori') {
    const n = ri(12, 60);
    return {
      prompt: { text: `Câți divizori naturali are numărul $${n}$?` },
      blanks: [{ label: 'Numărul de divizori', answer: divizori(n).length, kind: 'int' }],
      solutionLatex: `D_{${n}} = \\{${divizori(n).join(';\\,')}\\}`,
    };
  }
  if (fel === 'esteDivizor') {
    const n = ri(20, 120);
    const d = Math.random() < 0.5 ? pick(divizori(n)) : ri(2, 15);
    return {
      prompt: { text: `Numărul $${d}$ este divizor al lui $${n}$?` },
      blanks: [{ label: 'Alege', answer: n % d === 0 ? 'da' : 'nu', kind: 'choice', options: ['da', 'nu'] }],
      solutionLatex: n % d === 0 ? `${n} = ${d} \\cdot ${n / d}` : `${n} : ${d} \\text{ dă restul } ${n % d}`,
    };
  }
  const n = ri(3, 15);
  const k = ri(3, 9);
  return {
    prompt: { text: `Care este al $${k}$-lea multiplu nenul al lui $${n}$?` },
    blanks: [{ label: 'Multiplul', answer: n * k, kind: 'int' }],
    solutionLatex: `${n} \\cdot ${k} = ${n * k}`,
  };
}

/** Numere prime și numere compuse. */
export function vPrimCompus() {
  const n = Math.random() < 0.5
    ? pick([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47])
    : pick([4, 6, 8, 9, 10, 12, 15, 21, 25, 27, 33, 35, 39, 49, 51]);
  return {
    prompt: { text: `Numărul $${n}$ este prim sau compus?` },
    blanks: [{
      label: 'Alege',
      answer: estePrim(n) ? 'prim' : 'compus',
      kind: 'choice',
      options: ['prim', 'compus'],
    }],
    solutionLatex: estePrim(n)
      ? `${n} \\text{ are doar divizorii } 1 \\text{ și } ${n}`
      : `${n} = ${factoriPrimi(n).map(([p, e]) => (e === 1 ? `${p}` : `${p}^{${e}}`)).join(' \\cdot ')}`,
  };
}

/** Cel mai mare divizor comun și cel mai mic multiplu comun. */
export function vCmmdcCmmmc() {
  const a = ri(6, 48);
  const b = ri(6, 48);
  return {
    prompt: { text: `Se dau numerele $${a}$ și $${b}$.` },
    blanks: [
      { label: 'Cel mai mare divizor comun', answer: gcd(a, b), kind: 'int' },
      { label: 'Cel mai mic multiplu comun', answer: lcm(a, b), kind: 'int' },
    ],
    solutionLatex: `(${a},\\,${b}) = ${gcd(a, b)}, \\quad [${a},\\,${b}] = ${lcm(a, b)}`,
  };
}

/** Fracții subunitare, echiunitare și supraunitare. */
export function vTipulFractiei() {
  const d = ri(2, 12);
  const fel = pick(['sub', 'echi', 'supra']);
  let n;
  if (fel === 'echi') n = d;
  else if (fel === 'sub') n = ri(1, d - 1);
  else n = ri(d + 1, d + 12);
  let raspuns = 'supraunitară';
  if (n < d) raspuns = 'subunitară';
  else if (n === d) raspuns = 'echiunitară';
  let relatie = '>';
  if (n < d) relatie = '<';
  else if (n === d) relatie = '=';
  return {
    prompt: { latex: fracLatex(n, d) },
    blanks: [{
      label: 'Fracția este',
      answer: raspuns,
      kind: 'choice',
      options: ['subunitară', 'echiunitară', 'supraunitară'],
    }],
    solutionLatex: `${n} ${relatie} ${d}`,
  };
}

/** Amplificarea și simplificarea fracțiilor. */
export function vAmplificareSimplificare() {
  if (Math.random() < 0.5) {
    const n = ri(1, 9);
    const d = ri(2, 11);
    const k = ri(2, 6);
    return {
      prompt: { text: `Amplifică fracția $${fracLatex(n, d)}$ cu $${k}$.` },
      blanks: campuriFractie(n * k, d * k),
      solutionLatex: `${fracLatex(n, d)} = ${fracLatex(n * k, d * k)}`,
    };
  }
  const n0 = ri(1, 9);
  const d0 = ri(2, 11);
  const k = ri(2, 7);
  const [n, d] = simplifica(n0 * k, d0 * k);
  return {
    prompt: { text: `Scrie fracția $${fracLatex(n0 * k, d0 * k)}$ sub formă ireductibilă.` },
    blanks: campuriFractie(n, d),
    solutionLatex: `${fracLatex(n0 * k, d0 * k)} = ${fracLatex(n, d)}`,
  };
}

/** Adunarea și scăderea fracțiilor ordinare. */
export function vAdunareaFractiilor() {
  const d1 = ri(2, 9); const d2 = ri(2, 9);
  const n1 = ri(1, d1 * 2); const n2 = ri(1, d2 * 2);
  const scadere = Math.random() < 0.4 && n1 * d2 > n2 * d1;
  const num = scadere ? n1 * d2 - n2 * d1 : n1 * d2 + n2 * d1;
  const [n, d] = simplifica(num, d1 * d2);
  const semn = scadere ? '-' : '+';
  return {
    prompt: { latex: `${fracLatex(n1, d1)} ${semn} ${fracLatex(n2, d2)}` },
    blanks: campuriFractie(n, d),
    solutionLatex: `${fracLatex(n1, d1)} ${semn} ${fracLatex(n2, d2)} = ${fracLatex(n, d)}`,
  };
}

/** Înmulțirea și împărțirea fracțiilor ordinare. */
export function vInmultireaFractiilor() {
  const n1 = ri(1, 9); const d1 = ri(2, 9);
  const n2 = ri(1, 9); const d2 = ri(2, 9);
  const impartire = Math.random() < 0.4;
  const [n, d] = impartire ? simplifica(n1 * d2, d1 * n2) : simplifica(n1 * n2, d1 * d2);
  const semn = impartire ? ':' : '\\cdot';
  return {
    prompt: { latex: `${fracLatex(n1, d1)} ${semn} ${fracLatex(n2, d2)}` },
    blanks: campuriFractie(n, d),
    solutionLatex: `${fracLatex(n1, d1)} ${semn} ${fracLatex(n2, d2)} = ${fracLatex(n, d)}`,
  };
}

/** Procent dintr-un număr. */
export function vProcentDin() {
  const p = pick([5, 10, 20, 25, 40, 50, 75]);
  const total = pick([20, 40, 60, 80, 100, 120, 160, 200, 240, 300]);
  return {
    prompt: { text: `Cât înseamnă $${p}\\%$ din $${total}$?` },
    blanks: [{ label: REZULTATUL, answer: (p * total) / 100, kind: 'dec' }],
    solutionLatex: `\\dfrac{${p}}{100} \\cdot ${total} = ${(p * total) / 100}`,
  };
}

/** Adunarea, scăderea și înmulțirea fracțiilor zecimale. */
export function vZecimale() {
  const fel = pick(['adunare', 'scadere', 'inmultire']);
  const a = ri(10, 400) / 10;
  const b = ri(10, 300) / 10;
  if (fel === 'adunare') {
    return {
      prompt: { latex: `${zec(a, 1)} + ${zec(b, 1)}` },
      blanks: [{ label: REZULTATUL, answer: a + b, kind: 'dec', tol: 1e-6 }],
      solutionLatex: `${zec(a, 1)} + ${zec(b, 1)} = ${zec(a + b, 1)}`,
    };
  }
  if (fel === 'scadere') {
    const mare = Math.max(a, b);
    const mic = Math.min(a, b);
    return {
      prompt: { latex: `${zec(mare, 1)} - ${zec(mic, 1)}` },
      blanks: [{ label: REZULTATUL, answer: mare - mic, kind: 'dec', tol: 1e-6 }],
      solutionLatex: `${zec(mare, 1)} - ${zec(mic, 1)} = ${zec(mare - mic, 1)}`,
    };
  }
  const x = ri(11, 99) / 10;
  const k = ri(2, 9);
  return {
    prompt: { latex: `${zec(x, 1)} \\cdot ${k}` },
    blanks: [{ label: REZULTATUL, answer: x * k, kind: 'dec', tol: 1e-6 }],
    solutionLatex: `${zec(x, 1)} \\cdot ${k} = ${zec(x * k, 1)}`,
  };
}

/** Înmulțiri și împărțiri cu 10, 100 și 1000. */
export function vInmultireCu10() {
  const x = ri(105, 9995) / 100;
  const k = pick([10, 100, 1000]);
  const impartire = Math.random() < 0.5;
  const rezultat = impartire ? x / k : x * k;
  return {
    prompt: { latex: `${zec(x, 2)} ${impartire ? ':' : '\\cdot'} ${k}` },
    blanks: [{ label: REZULTATUL, answer: rezultat, kind: 'dec', tol: 1e-9 }],
    solutionLatex: `${zec(x, 2)} ${impartire ? ':' : '\\cdot'} ${k} = ${zec(rezultat, 6)}`,
  };
}

/** Media aritmetică a unui set de numere. */
export function vMediaAritmetica() {
  const cate = ri(3, 5);
  let numere = [];
  let suma = 0;
  // Numerele se aleg astfel încât media să iasă întreagă. Altfel întrebarea ar
  // măsura împărțirea cu zecimale, nu procedura mediei.
  do {
    numere = Array.from({ length: cate }, () => ri(2, 40));
    suma = numere.reduce((s, x) => s + x, 0);
  } while (suma % cate !== 0);
  return {
    prompt: { text: `Care este media aritmetică a numerelor $${numere.join('$, $')}$?` },
    blanks: [{ label: 'Media', answer: suma / cate, kind: 'dec' }],
    solutionLatex: `\\dfrac{${numere.join(' + ')}}{${cate}} = \\dfrac{${suma}}{${cate}} = ${suma / cate}`,
  };
}

/** Clasificarea unghiurilor după măsură. */
export function vClasificareaUnghiurilor() {
  const feluri = [
    { nume: 'nul', masura: 0 },
    { nume: 'ascuțit', masura: ri(1, 89) },
    { nume: 'drept', masura: 90 },
    { nume: 'obtuz', masura: ri(91, 179) },
    { nume: 'alungit', masura: 180 },
  ];
  const ales = pick(feluri);
  return {
    prompt: { text: `Un unghi are măsura de $${ales.masura}^\\circ$. Cum se numește?` },
    blanks: [{
      label: 'Unghiul este',
      answer: ales.nume,
      kind: 'choice',
      options: ['nul', 'ascuțit', 'drept', 'obtuz', 'alungit'],
    }],
    solutionLatex: `${ales.masura}^\\circ \\Rightarrow \\text{unghi ${ales.nume}}`,
  };
}

/** Calcule cu măsuri de unghiuri exprimate în grade și minute. */
export function vGradeMinute() {
  const g1 = ri(10, 70); const m1 = ri(5, 55);
  const g2 = ri(10, 70); const m2 = ri(5, 55);
  const totalMinute = m1 + m2;
  const g = g1 + g2 + Math.floor(totalMinute / 60);
  const m = totalMinute % 60;
  return {
    prompt: { text: `Adună $${g1}^\\circ\\,${m1}'$ cu $${g2}^\\circ\\,${m2}'$.` },
    blanks: [
      { label: 'Gradele', answer: g, kind: 'int' },
      { label: 'Minutele', answer: m, kind: 'int' },
    ],
    solutionLatex: `${g1}^\\circ ${m1}' + ${g2}^\\circ ${m2}' = ${g}^\\circ ${m}'`,
  };
}

/** Perimetrul și aria pătratului și ale dreptunghiului. */
export function vPerimetruArie() {
  if (Math.random() < 0.4) {
    const l = ri(3, 20);
    return {
      prompt: { text: `Un pătrat are latura de $${l}$ cm.` },
      blanks: [
        { label: 'Perimetrul, în centimetri', answer: 4 * l, kind: 'int' },
        { label: 'Aria, în centimetri pătrați', answer: l * l, kind: 'int' },
      ],
      solutionLatex: `P = 4 \\cdot ${l} = ${4 * l}, \\quad A = ${l}^2 = ${l * l}`,
    };
  }
  const L = ri(4, 20);
  const l = ri(2, L - 1);
  return {
    prompt: { text: `Un dreptunghi are lungimea de $${L}$ cm și lățimea de $${l}$ cm.` },
    blanks: [
      { label: 'Perimetrul, în centimetri', answer: 2 * (L + l), kind: 'int' },
      { label: 'Aria, în centimetri pătrați', answer: L * l, kind: 'int' },
    ],
    solutionLatex: `P = 2(${L} + ${l}) = ${2 * (L + l)}, \\quad A = ${L} \\cdot ${l} = ${L * l}`,
  };
}

/** Volumul cubului și al paralelipipedului dreptunghic. */
export function vVolumCubParalelipiped() {
  if (Math.random() < 0.4) {
    const a = ri(2, 12);
    return {
      prompt: { text: `Un cub are muchia de $${a}$ cm.` },
      blanks: [{ label: 'Volumul, în centimetri cubi', answer: a ** 3, kind: 'int' }],
      solutionLatex: `V = ${a}^3 = ${a ** 3}`,
    };
  }
  const L = ri(2, 12); const l = ri(2, 12); const h = ri(2, 12);
  return {
    prompt: { text: `Un paralelipiped dreptunghic are dimensiunile $${L}$ cm, $${l}$ cm și $${h}$ cm.` },
    blanks: [{ label: 'Volumul, în centimetri cubi', answer: L * l * h, kind: 'int' }],
    solutionLatex: `V = ${L} \\cdot ${l} \\cdot ${h} = ${L * l * h}`,
  };
}

/** Transformări ale unităților de măsură. */
export function vTransformariUnitati() {
  const familii = [
    { unitati: [['km', 1000], ['m', 1], ['dm', 0.1], ['cm', 0.01], ['mm', 0.001]] },
    { unitati: [['kg', 1000], ['g', 1], ['mg', 0.001]] },
    { unitati: [['l', 1], ['dl', 0.1], ['cl', 0.01], ['ml', 0.001]] },
    { unitati: [['m²', 1], ['dm²', 0.01], ['cm²', 0.0001]] },
    { unitati: [['m³', 1], ['dm³', 0.001], ['cm³', 0.000001]] },
  ];
  const f = pick(familii);
  const i = ri(0, f.unitati.length - 1);
  let j = ri(0, f.unitati.length - 1);
  while (j === i) j = ri(0, f.unitati.length - 1);
  const [nume1, val1] = f.unitati[i];
  const [nume2, val2] = f.unitati[j];
  const cantitate = pick([1, 2, 3, 5, 10, 25, 50]);
  const rezultat = (cantitate * val1) / val2;
  return {
    prompt: { text: `Transformă $${cantitate}$ ${nume1} în ${nume2}.` },
    blanks: [{
      label: `Rezultatul, în ${nume2}`,
      answer: rezultat,
      kind: 'dec',
      tol: Math.abs(rezultat) * 1e-9 + 1e-9,
    }],
    solutionLatex: `${cantitate}\\ \\text{${nume1}} = ${rezultat}\\ \\text{${nume2}}`,
  };
}

/** Scrierea unui număr natural în baza 2. */
export function vBaza2() {
  const n = ri(3, 63);
  if (Math.random() < 0.5) {
    return {
      prompt: { text: `Scrie numărul $${n}$ în baza $2$.` },
      blanks: [{ label: 'Scrierea în baza 2', answer: n.toString(2), kind: 'text' }],
      solutionLatex: `${n} = \\overline{${n.toString(2)}}^{(2)}`,
    };
  }
  return {
    prompt: { text: `Numărul $\\overline{${n.toString(2)}}^{(2)}$ este scris în baza $2$. Cât este în baza $10$?` },
    blanks: [{ label: 'Scrierea în baza 10', answer: n, kind: 'int' }],
    solutionLatex: `\\overline{${n.toString(2)}}^{(2)} = ${n}`,
  };
}

/** Mijlocul unui segment și distanța, pe axa numerelor. */
export function vMijloculSegmentului() {
  const a = ri(-20, 20);
  const b = a + 2 * ri(1, 12);
  return {
    prompt: {
      text: `Pe axa numerelor, punctul $A$ are coordonata $${a}$, iar punctul $B$ are coordonata $${b}$.`,
    },
    blanks: [
      { label: 'Coordonata mijlocului segmentului $AB$', answer: (a + b) / 2, kind: 'dec' },
      { label: 'Lungimea segmentului $AB$', answer: b - a, kind: 'int' },
    ],
    solutionLatex: `M = \\dfrac{${a} + ${b}}{2} = ${(a + b) / 2}, \\quad AB = ${b} - (${a}) = ${b - a}`,
  };
}

/* ════════════════════════════════════════════════════════════════════════
   CLASA a VI-a
   ════════════════════════════════════════════════════════════════════════ */

/** Operații cu mulțimi: reuniune, intersecție, diferență. */
export function viOperatiiMultimi() {
  const A = Array.from(new Set(Array.from({ length: ri(4, 6) }, () => ri(1, 12)))).sort((x, y) => x - y);
  const B = Array.from(new Set(Array.from({ length: ri(4, 6) }, () => ri(1, 12)))).sort((x, y) => x - y);
  const variante = {
    reuniune: { simbol: 'A \\cup B', multime: Array.from(new Set([...A, ...B])) },
    intersectie: { simbol: 'A \\cap B', multime: A.filter((x) => B.includes(x)) },
    diferenta: { simbol: 'A \\setminus B', multime: A.filter((x) => !B.includes(x)) },
  };
  const aleasa = variante[pick(['reuniune', 'intersectie', 'diferenta'])];
  return {
    prompt: {
      text: `Se dau mulțimile $A = \\{${A.join(';\\,')}\\}$ și $B = \\{${B.join(';\\,')}\\}$.`,
      latex: `\\text{Câte elemente are } ${aleasa.simbol}\\,\\text{?}`,
    },
    blanks: [{ label: 'Numărul de elemente', answer: aleasa.multime.length, kind: 'int' }],
    solutionLatex: `${aleasa.simbol} = \\{${aleasa.multime.join(';\\,') || '\\;'}\\}`,
  };
}

/** Descompunerea unui număr natural în produs de puteri de numere prime. */
export function viDescompunereFactoriPrimi() {
  const n = ri(12, 200);
  const f = factoriPrimi(n);
  return {
    prompt: { text: `Descompune numărul $${n}$ în produs de puteri de numere prime.` },
    blanks: [
      { label: 'Cel mai mic factor prim', answer: f[0][0], kind: 'int' },
      { label: 'Câți factori primi diferiți are', answer: f.length, kind: 'int' },
    ],
    solutionLatex: `${n} = ${f.map(([p, e]) => (e === 1 ? `${p}` : `${p}^{${e}}`)).join(' \\cdot ')}`,
  };
}

/** Termenul necunoscut dintr-o proporție. */
export function viProportie() {
  const k = ri(2, 9);
  const a = ri(2, 12);
  const b = ri(2, 12);
  const valori = [a, b, a * k, b * k];
  const pozitie = ri(0, 3);
  const afisat = valori.map((v, i) => (i === pozitie ? 'x' : v));
  return {
    prompt: { latex: `\\dfrac{${afisat[0]}}{${afisat[1]}} = \\dfrac{${afisat[2]}}{${afisat[3]}}` },
    blanks: [{ label: 'Valoarea lui $x$', answer: valori[pozitie], kind: 'dec' }],
    solutionLatex: `x = ${valori[pozitie]}`,
  };
}

/** Șir de rapoarte egale. */
export function viSirRapoarteEgale() {
  const k = ri(2, 8);
  const a = ri(2, 9);
  const b = ri(2, 9);
  return {
    prompt: {
      text: `Numerele $x$ și $y$ verifică $\\dfrac{x}{${a}} = \\dfrac{y}{${b}}$ și $x + y = ${(a + b) * k}$.`,
    },
    blanks: [
      { label: 'Valoarea lui $x$', answer: a * k, kind: 'dec' },
      { label: 'Valoarea lui $y$', answer: b * k, kind: 'dec' },
    ],
    solutionLatex: `\\dfrac{x}{${a}} = \\dfrac{y}{${b}} = \\dfrac{x+y}{${a + b}} = ${k}`,
  };
}

/** Mărimi direct și invers proporționale. */
export function viDirectInversProportionale() {
  if (Math.random() < 0.5) {
    const k = ri(2, 9);
    const x1 = ri(2, 9);
    const x2 = ri(2, 12);
    return {
      prompt: {
        text: `Mărimile $x$ și $y$ sunt direct proporționale. Când $x = ${x1}$, avem $y = ${x1 * k}$.`,
      },
      blanks: [{ label: `Valoarea lui $y$ când $x = ${x2}$`, answer: x2 * k, kind: 'dec' }],
      solutionLatex: `\\dfrac{y}{x} = ${k} \\Rightarrow y = ${k} \\cdot ${x2} = ${x2 * k}`,
    };
  }
  const p = pick([12, 24, 36, 48, 60, 72]);
  const candidati = divizori(p).filter((d) => d > 1 && d < p);
  const x1 = pick(candidati);
  const x2 = pick(candidati.filter((d) => d !== x1)) ?? x1;
  return {
    prompt: {
      text: `Mărimile $x$ și $y$ sunt invers proporționale. Când $x = ${x1}$, avem $y = ${p / x1}$.`,
    },
    blanks: [{ label: `Valoarea lui $y$ când $x = ${x2}$`, answer: p / x2, kind: 'dec' }],
    solutionLatex: `x \\cdot y = ${p} \\Rightarrow y = \\dfrac{${p}}{${x2}} = ${p / x2}`,
  };
}

/** Regula de trei simplă. */
export function viRegulaDeTreiSimpla() {
  const pretUnitar = ri(2, 15);
  const n1 = ri(2, 9);
  const n2 = ri(2, 12);
  return {
    prompt: {
      text: `$${n1}$ caiete costă $${n1 * pretUnitar}$ lei. Cât costă $${n2}$ caiete de același fel?`,
    },
    blanks: [{ label: 'Prețul, în lei', answer: n2 * pretUnitar, kind: 'dec' }],
    solutionLatex: `\\dfrac{${n1 * pretUnitar}}{${n1}} = ${pretUnitar} \\Rightarrow ${n2} \\cdot ${pretUnitar} = ${n2 * pretUnitar}`,
  };
}

/** Probabilitatea unui eveniment, în cazuri simple. */
export function viProbabilitate() {
  const rosii = ri(2, 8);
  const albastre = ri(2, 8);
  const verzi = ri(1, 5);
  const total = rosii + albastre + verzi;
  const alegere = pick([['roșie', rosii], ['albastră', albastre], ['verde', verzi]]);
  const [n, d] = simplifica(alegere[1], total);
  return {
    prompt: {
      text: `Într-o cutie sunt $${rosii}$ bile roșii, $${albastre}$ bile albastre și $${verzi}$ bile verzi. `
        + `Se extrage o bilă la întâmplare. Care este probabilitatea ca bila extrasă să fie ${alegere[0]}?`,
    },
    blanks: campuriFractie(n, d),
    solutionLatex: `P = \\dfrac{${alegere[1]}}{${total}} = ${fracLatex(n, d)}`,
  };
}

/** Adunarea și scăderea numerelor întregi. */
export function viIntregiAdunare() {
  const a = nz(-20, 20);
  const b = nz(-20, 20);
  const scadere = Math.random() < 0.5;
  const rezultat = scadere ? a - b : a + b;
  const scriere = scadere ? `(${a}) - (${b})` : `(${a}) + (${b})`;
  return {
    prompt: { latex: scriere },
    blanks: [{ label: REZULTATUL, answer: rezultat, kind: 'int' }],
    solutionLatex: `${scriere} = ${rezultat}`,
  };
}

/** Înmulțirea și împărțirea numerelor întregi. */
export function viIntregiInmultire() {
  const a = nz(-12, 12);
  const b = nz(-12, 12);
  if (Math.random() < 0.5) {
    return {
      prompt: { latex: `(${a}) \\cdot (${b})` },
      blanks: [{ label: REZULTATUL, answer: a * b, kind: 'int' }],
      solutionLatex: `(${a}) \\cdot (${b}) = ${a * b}`,
    };
  }
  return {
    prompt: { latex: `(${a * b}) : (${b})` },
    blanks: [{ label: REZULTATUL, answer: a, kind: 'int' }],
    solutionLatex: `(${a * b}) : (${b}) = ${a}`,
  };
}

/** Modulul unui număr întreg și compararea numerelor întregi. */
export function viModulIntreg() {
  if (Math.random() < 0.5) {
    const a = nz(-99, 99);
    return {
      prompt: { latex: `\\left|${a}\\right|` },
      blanks: [{ label: REZULTATUL, answer: Math.abs(a), kind: 'int' }],
      solutionLatex: `\\left|${a}\\right| = ${Math.abs(a)}`,
    };
  }
  const a = nz(-40, 40);
  let b = nz(-40, 40);
  while (b === a) b = nz(-40, 40);
  return {
    prompt: { text: `Care dintre numerele $${a}$ și $${b}$ este mai mare?` },
    blanks: [{
      label: 'Numărul mai mare',
      answer: String(Math.max(a, b)),
      kind: 'choice',
      options: [String(a), String(b)],
    }],
    solutionLatex: `${Math.min(a, b)} < ${Math.max(a, b)}`,
  };
}

/** Puteri cu exponent natural ale unui număr întreg. */
export function viPuteriIntregi() {
  const a = nz(-6, 6);
  const n = ri(2, 5);
  return {
    prompt: { latex: `\\left(${a}\\right)^{${n}}` },
    blanks: [{ label: REZULTATUL, answer: a ** n, kind: 'int' }],
    solutionLatex: `\\left(${a}\\right)^{${n}} = ${a ** n}`,
  };
}

/** Ecuații în mulțimea numerelor întregi. */
export function viEcuatiiIntregi() {
  const a = nz(-9, 9);
  const x = nz(-12, 12);
  const fel = pick(['suma', 'produs', 'liniara']);
  if (fel === 'suma') {
    return {
      prompt: { latex: `x ${cuSemn(a)} = ${x + a}` },
      blanks: [{ label: 'Valoarea lui $x$', answer: x, kind: 'int' }],
      solutionLatex: `x = ${x + a} ${cuSemn(-a)} = ${x}`,
    };
  }
  if (fel === 'produs') {
    return {
      prompt: { latex: `${coef(a)} = ${a * x}` },
      blanks: [{ label: 'Valoarea lui $x$', answer: x, kind: 'int' }],
      solutionLatex: `x = \\dfrac{${a * x}}{${a}} = ${x}`,
    };
  }
  const b = nz(-9, 9);
  return {
    prompt: { latex: `${coef(a)} ${cuSemn(b)} = ${a * x + b}` },
    blanks: [{ label: 'Valoarea lui $x$', answer: x, kind: 'int' }],
    solutionLatex: `${coef(a)} = ${a * x} \\Rightarrow x = ${x}`,
  };
}

/** Operații cu numere raționale. */
export function viRationaleOperatii() {
  const n1 = nz(-9, 9); const d1 = ri(2, 9);
  const n2 = nz(-9, 9); const d2 = ri(2, 9);
  const adunare = Math.random() < 0.5;
  const [n, d] = adunare
    ? simplifica(n1 * d2 + n2 * d1, d1 * d2)
    : simplifica(n1 * n2, d1 * d2);
  return {
    prompt: {
      latex: `${fracLatex(n1, d1)} ${adunare ? '+' : '\\cdot'} \\left(${fracLatex(n2, d2)}\\right)`,
    },
    blanks: campuriFractie(n, d),
    solutionLatex: `= ${fracLatex(n, d)}`,
  };
}

/** Ecuații cu numere raționale, de tipul ax + b = c. */
export function viEcuatiiRationale() {
  const a = nz(-9, 9);
  const x = nz(-10, 10);
  const b = nz(-15, 15);
  return {
    prompt: { latex: `${coef(a)} ${cuSemn(b)} = ${a * x + b}` },
    blanks: [{ label: 'Valoarea lui $x$', answer: x, kind: 'dec' }],
    solutionLatex: `${coef(a)} = ${a * x} \\Rightarrow x = \\dfrac{${a * x}}{${a}} = ${x}`,
  };
}

/** Unghiuri opuse la vârf, suplementare și complementare. */
export function viPerechiDeUnghiuri() {
  const fel = pick(['opuse', 'suplementare', 'complementare']);
  if (fel === 'opuse') {
    const m = ri(15, 165);
    return {
      prompt: { text: `Două unghiuri sunt opuse la vârf. Unul are măsura de $${m}^\\circ$.` },
      blanks: [{ label: 'Măsura celuilalt unghi, în grade', answer: m, kind: 'int' }],
      solutionLatex: `\\text{Unghiurile opuse la vârf sunt congruente: } ${m}^\\circ`,
    };
  }
  if (fel === 'suplementare') {
    const m = ri(15, 165);
    return {
      prompt: { text: `Două unghiuri sunt suplementare. Unul are măsura de $${m}^\\circ$.` },
      blanks: [{ label: 'Măsura celuilalt unghi, în grade', answer: 180 - m, kind: 'int' }],
      solutionLatex: `180^\\circ - ${m}^\\circ = ${180 - m}^\\circ`,
    };
  }
  const m = ri(10, 80);
  return {
    prompt: { text: `Două unghiuri sunt complementare. Unul are măsura de $${m}^\\circ$.` },
    blanks: [{ label: 'Măsura celuilalt unghi, în grade', answer: 90 - m, kind: 'int' }],
    solutionLatex: `90^\\circ - ${m}^\\circ = ${90 - m}^\\circ`,
  };
}

/** Bisectoarea unui unghi. */
export function viBisectoarea() {
  const m = 2 * ri(8, 88);
  return {
    prompt: {
      text: `Semidreapta $[OM$ este bisectoarea unghiului $AOB$, care are măsura de $${m}^\\circ$.`,
    },
    blanks: [{ label: 'Măsura unghiului $AOM$, în grade', answer: m / 2, kind: 'int' }],
    solutionLatex: `\\dfrac{${m}^\\circ}{2} = ${m / 2}^\\circ`,
  };
}

/** Unghiuri formate de două drepte paralele cu o secantă. */
export function viParaleleSecanta() {
  const m = ri(25, 155);
  const variante = [
    { text: 'alterne interne', raspuns: m, congruente: true },
    { text: 'corespondente', raspuns: m, congruente: true },
    { text: 'interne de aceeași parte a secantei', raspuns: 180 - m, congruente: false },
  ];
  const v = pick(variante);
  return {
    prompt: {
      text: `Două drepte paralele sunt tăiate de o secantă. Un unghi are măsura de $${m}^\\circ$. `
        + `Cât măsoară unghiul ${v.text} cu el?`,
    },
    blanks: [{ label: 'Măsura, în grade', answer: v.raspuns, kind: 'int' }],
    solutionLatex: v.congruente
      ? `\\text{Unghiurile ${v.text} sunt congruente: } ${m}^\\circ`
      : `180^\\circ - ${m}^\\circ = ${180 - m}^\\circ`,
  };
}

/** Suma măsurilor unghiurilor unui triunghi și unghiul exterior. */
export function viSumaUnghiurilorTriunghi() {
  const a = ri(20, 100);
  const b = ri(20, 170 - a);
  const c = 180 - a - b;
  if (Math.random() < 0.5) {
    return {
      prompt: { text: `Într-un triunghi, două unghiuri au măsurile de $${a}^\\circ$ și $${b}^\\circ$.` },
      blanks: [{ label: 'Măsura celui de-al treilea unghi, în grade', answer: c, kind: 'int' }],
      solutionLatex: `180^\\circ - ${a}^\\circ - ${b}^\\circ = ${c}^\\circ`,
    };
  }
  return {
    prompt: {
      text: `Într-un triunghi, două unghiuri au măsurile de $${a}^\\circ$ și $${b}^\\circ$. `
        + 'Cât măsoară unghiul exterior celui de-al treilea unghi?',
    },
    blanks: [{ label: 'Măsura, în grade', answer: a + b, kind: 'int' }],
    solutionLatex: `${a}^\\circ + ${b}^\\circ = ${a + b}^\\circ`,
  };
}

/** Inegalitatea triunghiului. */
export function viInegalitateaTriunghiului() {
  const a = ri(3, 15);
  const b = ri(3, 15);
  const c = Math.random() < 0.5
    ? ri(Math.abs(a - b) + 1, a + b - 1)
    : pick([a + b + ri(0, 5), Math.max(1, Math.abs(a - b) - ri(0, 3))]);
  const posibil = c > Math.abs(a - b) && c < a + b;
  return {
    prompt: { text: `Poate exista un triunghi cu laturile de $${a}$ cm, $${b}$ cm și $${c}$ cm?` },
    blanks: [{ label: 'Alege', answer: posibil ? 'da' : 'nu', kind: 'choice', options: ['da', 'nu'] }],
    solutionLatex: posibil
      ? `${Math.abs(a - b)} < ${c} < ${a + b}`
      : `${c} \\text{ nu se află între } ${Math.abs(a - b)} \\text{ și } ${a + b}`,
  };
}

/** Triplete pitagoreice: verificarea unui triunghi dreptunghic. */
export function viTripletePitagoreice() {
  const triplete = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [7, 24, 25], [20, 21, 29]];
  const t = pick(triplete);
  const [a, b, c] = Math.random() < 0.5 ? t : [t[0], t[1], t[2] + pick([1, 2, -1])];
  const dreptunghic = a * a + b * b === c * c;
  return {
    prompt: { text: `Un triunghi are laturile de $${a}$, $${b}$ și $${c}$. Este dreptunghic?` },
    blanks: [{ label: 'Alege', answer: dreptunghic ? 'da' : 'nu', kind: 'choice', options: ['da', 'nu'] }],
    solutionLatex: `${a}^2 + ${b}^2 = ${a * a + b * b}, \\quad ${c}^2 = ${c * c}`,
  };
}

/** Elemente în cerc: rază, diametru, unghi la centru. */
export function viElementeInCerc() {
  if (Math.random() < 0.5) {
    const r = ri(2, 20);
    const dinRaza = Math.random() < 0.5;
    return {
      prompt: dinRaza
        ? { text: `Un cerc are raza de $${r}$ cm.` }
        : { text: `Un cerc are diametrul de $${2 * r}$ cm.` },
      blanks: [{
        label: dinRaza ? 'Diametrul, în centimetri' : 'Raza, în centimetri',
        answer: dinRaza ? 2 * r : r,
        kind: 'dec',
      }],
      solutionLatex: `d = 2r \\Rightarrow ${2 * r} = 2 \\cdot ${r}`,
    };
  }
  const m = ri(20, 170);
  return {
    prompt: {
      text: `Un unghi la centru are măsura de $${m}^\\circ$. Cât măsoară arcul cuprins între laturile lui?`,
    },
    blanks: [{ label: 'Măsura arcului, în grade', answer: m, kind: 'int' }],
    solutionLatex: `\\text{Măsura arcului este egală cu a unghiului la centru: } ${m}^\\circ`,
  };
}

/* ════════════════════════════════════════════════════════════════════════
   CLASA a VII-a
   ════════════════════════════════════════════════════════════════════════ */

/** Rădăcina pătrată a unui pătrat perfect. */
export function viiRadicalPatratPerfect() {
  const r = ri(2, 30);
  return {
    prompt: { latex: `\\sqrt{${r * r}}` },
    blanks: [{ label: REZULTATUL, answer: r, kind: 'int' }],
    solutionLatex: `\\sqrt{${r * r}} = ${r}`,
  };
}

/** Scoaterea factorilor de sub radical. */
export function viiScoatereDeSubRadical() {
  const k = pick([2, 3, 5, 6, 7, 10]);
  const a = ri(2, 9);
  return {
    prompt: {
      text: `Scrie $\\sqrt{${a * a * k}}$ sub forma $a\\sqrt{${k}}$, unde $a$ este număr natural.`,
    },
    blanks: [{ label: 'Valoarea lui $a$', answer: a, kind: 'int' }],
    solutionLatex: `\\sqrt{${a * a * k}} = \\sqrt{${a * a} \\cdot ${k}} = ${a}\\sqrt{${k}}`,
  };
}

/** Operații cu radicali: adunarea radicalilor asemenea. */
export function viiOperatiiRadicali() {
  const k = pick([2, 3, 5, 6, 7]);
  const a = ri(2, 9);
  const b = ri(2, 9);
  if (Math.random() < 0.5) {
    return {
      prompt: {
        text: `Scrie $${a}\\sqrt{${k}} + ${b}\\sqrt{${k}}$ sub forma $c\\sqrt{${k}}$.`,
      },
      blanks: [{ label: 'Valoarea lui $c$', answer: a + b, kind: 'int' }],
      solutionLatex: `${a}\\sqrt{${k}} + ${b}\\sqrt{${k}} = ${a + b}\\sqrt{${k}}`,
    };
  }
  return {
    prompt: { latex: `\\sqrt{${k}} \\cdot \\sqrt{${k}}` },
    blanks: [{ label: REZULTATUL, answer: k, kind: 'int' }],
    solutionLatex: `\\sqrt{${k}} \\cdot \\sqrt{${k}} = ${k}`,
  };
}

/** Raționalizarea numitorului de forma a√b. */
export function viiRationalizare() {
  const b = pick([2, 3, 5, 6, 7]);
  const a = ri(1, 6);
  const n = a * b;
  return {
    prompt: {
      text: `Se raționalizează numitorul fracției $\\dfrac{${n}}{\\sqrt{${b}}}$. `
        + `Rezultatul se scrie sub forma $c\\sqrt{${b}}$.`,
    },
    blanks: [{ label: 'Valoarea lui $c$', answer: a, kind: 'int' }],
    solutionLatex: `\\dfrac{${n}}{\\sqrt{${b}}} = \\dfrac{${n}\\sqrt{${b}}}{${b}} = ${a}\\sqrt{${b}}`,
  };
}

/** Modulul unui număr real. */
export function viiModulReal() {
  const a = nz(-30, 30);
  const b = nz(-30, 30);
  if (Math.random() < 0.5) {
    return {
      prompt: { latex: `\\left|${a}\\right|` },
      blanks: [{ label: REZULTATUL, answer: Math.abs(a), kind: 'int' }],
      solutionLatex: `\\left|${a}\\right| = ${Math.abs(a)}`,
    };
  }
  return {
    prompt: { latex: `\\left|${a} - ${b > 0 ? b : `(${b})`}\\right|` },
    blanks: [{ label: REZULTATUL, answer: Math.abs(a - b), kind: 'int' }],
    solutionLatex: `\\left|${a - b}\\right| = ${Math.abs(a - b)}`,
  };
}

/** Media aritmetică ponderată. */
export function viiMediePonderata() {
  const n1 = ri(2, 5); const v1 = ri(4, 10);
  const n2 = ri(2, 5); const v2 = ri(4, 10);
  const suma = n1 * v1 + n2 * v2;
  const cate = n1 + n2;
  return {
    prompt: {
      text: `Un elev are $${n1}$ note de $${v1}$ și $${n2}$ note de $${v2}$. Care este media lui?`,
    },
    blanks: [{ label: 'Media', answer: suma / cate, kind: 'dec', tol: 0.005 }],
    solutionLatex: `\\dfrac{${n1} \\cdot ${v1} + ${n2} \\cdot ${v2}}{${cate}} = \\dfrac{${suma}}{${cate}} = ${zec(suma / cate, 2)}`,
  };
}

/** Media geometrică a două numere reale pozitive. */
export function viiMedieGeometrica() {
  const g = ri(2, 15);
  const k = pick([1, 2, 3, 4]);
  const a = g * k;
  const b = g / k;
  const [x, y] = Number.isInteger(b) ? [a, b] : [g, g];
  return {
    prompt: { text: `Care este media geometrică a numerelor $${x}$ și $${y}$?` },
    blanks: [{ label: 'Media geometrică', answer: Math.sqrt(x * y), kind: 'dec', tol: 1e-6 }],
    solutionLatex: `\\sqrt{${x} \\cdot ${y}} = \\sqrt{${x * y}} = ${Math.sqrt(x * y)}`,
  };
}

/** Ecuația de forma x² = a. */
export function viiEcuatiaPatratica() {
  const r = ri(2, 15);
  return {
    prompt: { latex: `x^2 = ${r * r}` },
    blanks: [
      { label: 'Soluția pozitivă', answer: r, kind: 'int' },
      { label: 'Soluția negativă', answer: -r, kind: 'int' },
    ],
    solutionLatex: `x = ${r} \\text{ sau } x = -${r}`,
  };
}

/** Ecuații de forma ax + b = 0. */
export function viiEcuatiaLiniara() {
  const a = nz(-9, 9);
  const x = nz(-12, 12);
  const b = -a * x;
  return {
    prompt: { latex: `${coef(a)} ${cuSemn(b)} = 0` },
    blanks: [{ label: 'Valoarea lui $x$', answer: x, kind: 'dec' }],
    solutionLatex: `${coef(a)} = ${-b} \\Rightarrow x = \\dfrac{${-b}}{${a}} = ${x}`,
  };
}

/** Sisteme de două ecuații liniare cu două necunoscute. */
export function viiSistemEcuatii() {
  const x = nz(-8, 8);
  const y = nz(-8, 8);
  const a = nz(1, 4); const b = nz(1, 4);
  const c = nz(1, 4); const d = nz(-4, 4);
  if (a * d - b * c === 0) return viiSistemEcuatii();
  return {
    prompt: {
      latex: `\\begin{cases} ${coef(a)} ${termenCuSemn(b, 'y')} = ${a * x + b * y} \\\\`
        + ` ${coef(c)} ${termenCuSemn(d, 'y')} = ${c * x + d * y} \\end{cases}`,
    },
    blanks: [
      { label: 'Valoarea lui $x$', answer: x, kind: 'dec' },
      { label: 'Valoarea lui $y$', answer: y, kind: 'dec' },
    ],
    solutionLatex: `x = ${x}, \\quad y = ${y}`,
  };
}

/** Coordonatele unui punct într-un sistem de axe ortogonale. */
export function viiCoordonate() {
  const x = nz(-6, 6);
  const y = nz(-6, 6);
  const pas = 26;
  const cx = 130 + x * pas;
  const cy = 130 - y * pas;
  const linii = [];
  for (let i = -5; i <= 5; i += 1) {
    linii.push(`<line x1="${130 + i * pas}" y1="10" x2="${130 + i * pas}" y2="250" stroke="#e3e3e3"/>`);
    linii.push(`<line x1="10" y1="${130 + i * pas}" x2="250" y2="${130 + i * pas}" stroke="#e3e3e3"/>`);
  }
  const svg = `<svg viewBox="0 0 260 260" width="240" height="240" role="img" aria-label="Punct într-un sistem de axe">
    ${linii.join('')}
    <line x1="10" y1="130" x2="250" y2="130" stroke="#333" stroke-width="1.5"/>
    <line x1="130" y1="250" x2="130" y2="10" stroke="#333" stroke-width="1.5"/>
    <text x="243" y="145" font-size="12">x</text><text x="118" y="20" font-size="12">y</text>
    <circle cx="${cx}" cy="${cy}" r="5" fill="#e8590c"/>
    <text x="${cx + 8}" y="${cy - 8}" font-size="13" font-weight="700">A</text>
  </svg>`;
  return {
    prompt: { text: 'Ce coordonate are punctul $A$ din figură?', svg },
    blanks: [
      { label: 'Abscisa', answer: x, kind: 'int' },
      { label: 'Ordonata', answer: y, kind: 'int' },
    ],
    solutionLatex: `A(${x};\\,${y})`,
  };
}

/** Distanța dintre două puncte din plan. */
export function viiDistantaPuncte() {
  const triplete = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]];
  const [dx, dy, d] = pick(triplete);
  const x1 = ri(-6, 4);
  const y1 = ri(-6, 4);
  return {
    prompt: {
      text: `Se dau punctele $A(${x1};\\,${y1})$ și $B(${x1 + dx};\\,${y1 + dy})$. Cât este distanța $AB$?`,
    },
    blanks: [{ label: 'Distanța', answer: d, kind: 'dec', tol: 1e-6 }],
    solutionLatex: `AB = \\sqrt{${dx}^2 + ${dy}^2} = \\sqrt{${dx * dx + dy * dy}} = ${d}`,
  };
}

/** Suma măsurilor unghiurilor unui patrulater convex. */
export function viiSumaUnghiurilorPatrulater() {
  const a = ri(50, 120);
  const b = ri(50, 120);
  const c = ri(50, Math.max(51, 350 - a - b));
  const d = 360 - a - b - c;
  if (d < 20 || d > 200) return viiSumaUnghiurilorPatrulater();
  return {
    prompt: {
      text: `Într-un patrulater convex, trei unghiuri au măsurile de $${a}^\\circ$, $${b}^\\circ$ și $${c}^\\circ$.`,
    },
    blanks: [{ label: 'Măsura celui de-al patrulea unghi, în grade', answer: d, kind: 'int' }],
    solutionLatex: `360^\\circ - ${a}^\\circ - ${b}^\\circ - ${c}^\\circ = ${d}^\\circ`,
  };
}

/** Proprietățile paralelogramului. */
export function viiParalelogram() {
  const fel = pick(['unghiuri', 'laturi', 'diagonale']);
  if (fel === 'unghiuri') {
    const m = ri(35, 145);
    return {
      prompt: {
        text: `În paralelogramul $ABCD$, unghiul $A$ are măsura de $${m}^\\circ$. `
          + 'Cât măsoară unghiul $B$?',
      },
      blanks: [{ label: 'Măsura, în grade', answer: 180 - m, kind: 'int' }],
      solutionLatex: `\\text{Unghiurile alăturate sunt suplementare: } 180^\\circ - ${m}^\\circ = ${180 - m}^\\circ`,
    };
  }
  if (fel === 'laturi') {
    const a = ri(3, 15);
    const b = ri(3, 15);
    return {
      prompt: {
        text: `Paralelogramul $ABCD$ are $AB = ${a}$ cm și $BC = ${b}$ cm. Cât este perimetrul lui?`,
      },
      blanks: [{ label: 'Perimetrul, în centimetri', answer: 2 * (a + b), kind: 'int' }],
      solutionLatex: `P = 2(${a} + ${b}) = ${2 * (a + b)}`,
    };
  }
  const d = 2 * ri(3, 12);
  return {
    prompt: {
      text: `În paralelogramul $ABCD$, diagonalele se intersectează în $O$, iar $AC = ${d}$ cm. `
        + 'Cât este $AO$?',
    },
    blanks: [{ label: 'Lungimea $AO$, în centimetri', answer: d / 2, kind: 'dec' }],
    solutionLatex: `\\text{Diagonalele se înjumătățesc: } AO = \\dfrac{${d}}{2} = ${d / 2}`,
  };
}

/** Linia mijlocie în triunghi și în trapez. */
export function viiLinieMijlocie() {
  if (Math.random() < 0.5) {
    const bc = 2 * ri(3, 15);
    return {
      prompt: {
        text: `În triunghiul $ABC$, punctele $M$ și $N$ sunt mijloacele laturilor $[AB]$ și $[AC]$. `
          + `Se știe că $BC = ${bc}$ cm.`,
      },
      blanks: [{ label: 'Lungimea $MN$, în centimetri', answer: bc / 2, kind: 'dec' }],
      solutionLatex: `MN = \\dfrac{BC}{2} = \\dfrac{${bc}}{2} = ${bc / 2}`,
    };
  }
  const b = ri(4, 20);
  const B = b + 2 * ri(1, 10);
  return {
    prompt: {
      text: `Un trapez are bazele de $${B}$ cm și $${b}$ cm. Cât este linia mijlocie?`,
    },
    blanks: [{ label: 'Linia mijlocie, în centimetri', answer: (B + b) / 2, kind: 'dec' }],
    solutionLatex: `\\dfrac{${B} + ${b}}{2} = ${(B + b) / 2}`,
  };
}

/** Ariile patrulaterelor: paralelogram, romb, trapez. */
export function viiAriiPatrulatere() {
  const fel = pick(['paralelogram', 'romb', 'trapez']);
  if (fel === 'paralelogram') {
    const b = ri(3, 20); const h = ri(2, 15);
    return {
      prompt: { text: `Un paralelogram are baza de $${b}$ cm și înălțimea de $${h}$ cm.` },
      blanks: [{ label: 'Aria, în centimetri pătrați', answer: b * h, kind: 'dec' }],
      solutionLatex: `A = ${b} \\cdot ${h} = ${b * h}`,
    };
  }
  if (fel === 'romb') {
    const d1 = 2 * ri(2, 10); const d2 = 2 * ri(2, 10);
    return {
      prompt: { text: `Un romb are diagonalele de $${d1}$ cm și $${d2}$ cm.` },
      blanks: [{ label: 'Aria, în centimetri pătrați', answer: (d1 * d2) / 2, kind: 'dec' }],
      solutionLatex: `A = \\dfrac{${d1} \\cdot ${d2}}{2} = ${(d1 * d2) / 2}`,
    };
  }
  const b = ri(3, 12);
  const B = b + 2 * ri(1, 8);
  const h = ri(2, 12);
  return {
    prompt: { text: `Un trapez are bazele de $${B}$ cm și $${b}$ cm, iar înălțimea de $${h}$ cm.` },
    blanks: [{ label: 'Aria, în centimetri pătrați', answer: ((B + b) * h) / 2, kind: 'dec' }],
    solutionLatex: `A = \\dfrac{(${B} + ${b}) \\cdot ${h}}{2} = ${((B + b) * h) / 2}`,
  };
}

/** Lungimea cercului și aria discului. */
export function viiCercLungimeArie() {
  const r = ri(2, 15);
  if (Math.random() < 0.5) {
    return {
      prompt: {
        text: `Un cerc are raza de $${r}$ cm. Lungimea lui este $L = k \\pi$ cm.`,
      },
      blanks: [{ label: 'Valoarea lui $k$', answer: 2 * r, kind: 'dec' }],
      solutionLatex: `L = 2\\pi r = ${2 * r}\\pi`,
    };
  }
  return {
    prompt: {
      text: `Un disc are raza de $${r}$ cm. Aria lui este $A = k \\pi$ centimetri pătrați.`,
    },
    blanks: [{ label: 'Valoarea lui $k$', answer: r * r, kind: 'dec' }],
    solutionLatex: `A = \\pi r^2 = ${r * r}\\pi`,
  };
}

/** Unghiul înscris în cerc. */
export function viiUnghiInscris() {
  const arc = 2 * ri(10, 85);
  if (Math.random() < 0.5) {
    return {
      prompt: {
        text: `Un unghi înscris într-un cerc cuprinde un arc de $${arc}^\\circ$.`,
      },
      blanks: [{ label: 'Măsura unghiului înscris, în grade', answer: arc / 2, kind: 'dec' }],
      solutionLatex: `\\dfrac{${arc}^\\circ}{2} = ${arc / 2}^\\circ`,
    };
  }
  return {
    prompt: {
      text: `Un unghi înscris într-un cerc are măsura de $${arc / 2}^\\circ$. `
        + 'Cât măsoară arcul cuprins între laturile lui?',
    },
    blanks: [{ label: 'Măsura arcului, în grade', answer: arc, kind: 'dec' }],
    solutionLatex: `2 \\cdot ${arc / 2}^\\circ = ${arc}^\\circ`,
  };
}

/** Teorema lui Thales. */
export function viiThales() {
  const k = ri(2, 5);
  const am = ri(2, 8);
  const an = ri(2, 8);
  const ab = am * k;
  const ac = an * k;
  return {
    prompt: {
      text: `În triunghiul $ABC$, punctele $M \\in (AB)$ și $N \\in (AC)$ sunt astfel încât $MN \\parallel BC$. `
        + `Se dau $AM = ${am}$, $AB = ${ab}$ și $AN = ${an}$.`,
    },
    blanks: [{ label: 'Lungimea $AC$', answer: ac, kind: 'dec', tol: 1e-6 }],
    solutionLatex: `\\dfrac{AM}{AB} = \\dfrac{AN}{AC} \\Rightarrow AC = \\dfrac{${an} \\cdot ${ab}}{${am}} = ${ac}`,
  };
}

/** Triunghiuri asemenea: raportul de asemănare și raportul ariilor. */
export function viiAsemanare() {
  const k = ri(2, 5);
  const latura = ri(3, 12);
  if (Math.random() < 0.5) {
    return {
      prompt: {
        text: `Triunghiurile $ABC$ și $A'B'C'$ sunt asemenea, cu raportul de asemănare $${k}$. `
          + `Latura $AB$ are $${latura}$ cm.`,
      },
      blanks: [{ label: `Lungimea $A'B'$, în centimetri`, answer: latura * k, kind: 'dec' }],
      solutionLatex: `A'B' = ${k} \\cdot ${latura} = ${latura * k}`,
    };
  }
  const arie = ri(2, 20);
  return {
    prompt: {
      text: `Triunghiurile $ABC$ și $A'B'C'$ sunt asemenea, cu raportul de asemănare $${k}$. `
        + `Aria triunghiului $ABC$ este de $${arie}$ centimetri pătrați.`,
    },
    blanks: [{ label: `Aria triunghiului $A'B'C'$, în centimetri pătrați`, answer: arie * k * k, kind: 'dec' }],
    solutionLatex: `\\dfrac{A'}{A} = ${k}^2 = ${k * k} \\Rightarrow A' = ${arie * k * k}`,
  };
}

/** Teorema lui Pitagora: calculul unei laturi. */
export function viiPitagora() {
  const triplete = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [7, 24, 25], [20, 21, 29]];
  const [a, b, c] = pick(triplete);
  if (Math.random() < 0.6) {
    return {
      prompt: {
        text: `Triunghiul $ABC$ este dreptunghic în $A$, cu $AB = ${a}$ și $AC = ${b}$.`,
      },
      blanks: [{ label: 'Lungimea ipotenuzei $BC$', answer: c, kind: 'dec', tol: 1e-6 }],
      solutionLatex: `BC = \\sqrt{${a}^2 + ${b}^2} = \\sqrt{${c * c}} = ${c}`,
    };
  }
  return {
    prompt: {
      text: `Triunghiul $ABC$ este dreptunghic în $A$, cu ipotenuza $BC = ${c}$ și cateta $AB = ${a}$.`,
    },
    blanks: [{ label: 'Lungimea catetei $AC$', answer: b, kind: 'dec', tol: 1e-6 }],
    solutionLatex: `AC = \\sqrt{${c}^2 - ${a}^2} = \\sqrt{${b * b}} = ${b}`,
  };
}

/** Teorema catetei și teorema înălțimii. */
export function viiCatetaInaltime() {
  // Proiecțiile catetelor pe ipotenuză se aleg astfel încât rezultatele să fie
  // numere întregi: altfel întrebarea ar cere calculator, nu automatism.
  const perechi = [[9, 16], [4, 9], [16, 9], [1, 4], [4, 16], [9, 4]];
  const [p, q] = pick(perechi);
  const ipotenuza = p + q;
  if (Math.random() < 0.5) {
    const inaltime = Math.sqrt(p * q);
    return {
      prompt: {
        text: `În triunghiul dreptunghic $ABC$, înălțimea din unghiul drept împarte ipotenuza `
          + `în segmente de $${p}$ și $${q}$.`,
      },
      blanks: [{ label: 'Lungimea înălțimii', answer: inaltime, kind: 'dec', tol: 1e-6 }],
      solutionLatex: `h = \\sqrt{${p} \\cdot ${q}} = \\sqrt{${p * q}} = ${inaltime}`,
    };
  }
  const cateta = Math.sqrt(p * ipotenuza);
  return {
    prompt: {
      text: `În triunghiul dreptunghic $ABC$, ipotenuza are $${ipotenuza}$, iar proiecția unei catete `
        + `pe ipotenuză are $${p}$.`,
    },
    blanks: [{ label: 'Lungimea catetei', answer: cateta, kind: 'dec', tol: 0.005 }],
    solutionLatex: `c = \\sqrt{${p} \\cdot ${ipotenuza}} = \\sqrt{${p * ipotenuza}} = ${zec(cateta, 3)}`,
  };
}

/** Valorile funcțiilor trigonometrice pentru unghiurile de 30°, 45° și 60°. */
export function viiTrigonometrie() {
  const tabel = [
    { unghi: 30, sin: '1/2', cos: '√3/2', tg: '√3/3' },
    { unghi: 45, sin: '√2/2', cos: '√2/2', tg: '1' },
    { unghi: 60, sin: '√3/2', cos: '1/2', tg: '√3' },
  ];
  const rand = pick(tabel);
  const functie = pick(['sin', 'cos', 'tg']);
  const toate = ['1/2', '√2/2', '√3/2', '√3/3', '1', '√3'];
  return {
    prompt: { text: `Cât este $\\${functie === 'tg' ? 'operatorname{tg}' : functie}\\,${rand.unghi}^\\circ$?` },
    blanks: [{ label: 'Alege valoarea', answer: rand[functie], kind: 'choice', options: toate }],
    solutionLatex: `\\${functie === 'tg' ? 'operatorname{tg}' : functie}\\,${rand.unghi}^\\circ = ${
      { '1/2': '\\dfrac{1}{2}', '√2/2': '\\dfrac{\\sqrt{2}}{2}', '√3/2': '\\dfrac{\\sqrt{3}}{2}', '√3/3': '\\dfrac{\\sqrt{3}}{3}', 1: '1', '√3': '\\sqrt{3}' }[rand[functie]]
    }`,
  };
}

/** Elemente în triunghiul echilateral, în pătrat și în hexagonul regulat. */
export function viiFiguriRegulate() {
  const l = 2 * ri(2, 10);
  const fel = pick(['echilateralInaltime', 'patratDiagonala', 'hexagonPerimetru']);
  if (fel === 'echilateralInaltime') {
    return {
      prompt: {
        text: `Un triunghi echilateral are latura de $${l}$ cm. Înălțimea lui se scrie $h = k\\sqrt{3}$ cm.`,
      },
      blanks: [{ label: 'Valoarea lui $k$', answer: l / 2, kind: 'dec' }],
      solutionLatex: `h = \\dfrac{${l}\\sqrt{3}}{2} = ${l / 2}\\sqrt{3}`,
    };
  }
  if (fel === 'patratDiagonala') {
    return {
      prompt: {
        text: `Un pătrat are latura de $${l}$ cm. Diagonala lui se scrie $d = k\\sqrt{2}$ cm.`,
      },
      blanks: [{ label: 'Valoarea lui $k$', answer: l, kind: 'dec' }],
      solutionLatex: `d = ${l}\\sqrt{2}`,
    };
  }
  return {
    prompt: { text: `Un hexagon regulat are latura de $${l}$ cm. Cât este perimetrul lui?` },
    blanks: [{ label: 'Perimetrul, în centimetri', answer: 6 * l, kind: 'dec' }],
    solutionLatex: `P = 6 \\cdot ${l} = ${6 * l}`,
  };
}

/* ════════════════════════════════════════════════════════════════════════
   CLASA a VIII-a
   ════════════════════════════════════════════════════════════════════════ */

/** Intervale de numere reale: intersecție și reuniune. */
export function viiiIntervale() {
  const a = ri(-8, 2);
  const b = a + ri(2, 6);
  const c = a + ri(1, 4);
  const d = c + ri(2, 6);
  const intersectieJos = Math.max(a, c);
  const intersectieSus = Math.min(b, d);
  return {
    prompt: {
      text: `Se dau intervalele $A = [${a};\\,${b}]$ și $B = [${c};\\,${d}]$. `
        + 'Care sunt capetele intervalului $A \\cap B$?',
    },
    blanks: [
      { label: 'Capătul din stânga', answer: intersectieJos, kind: 'dec' },
      { label: 'Capătul din dreapta', answer: intersectieSus, kind: 'dec' },
    ],
    solutionLatex: `A \\cap B = [${intersectieJos};\\,${intersectieSus}]`,
  };
}

/** Inecuații de forma ax + b ≥ 0. */
export function viiiInecuatii() {
  const a = ri(1, 8);
  const x = nz(-10, 10);
  const b = -a * x;
  return {
    prompt: {
      text: `Rezolvă inecuația $${coef(a)} ${cuSemn(b)} \\ge 0$. `
        + 'Soluțiile sunt numerele mai mari sau egale cu o valoare.',
    },
    blanks: [{ label: 'Valoarea', answer: x, kind: 'dec' }],
    solutionLatex: `${coef(a)} \\ge ${-b} \\Rightarrow x \\ge ${x}`,
  };
}

/** Reducerea termenilor asemenea. */
export function viiiReducereaTermenilor() {
  const a = nz(-9, 9); const b = nz(-9, 9);
  const c = nz(-9, 9); const d = nz(-9, 9);
  return {
    prompt: {
      text: `Se reduce expresia $${coef(a)} ${cuSemn(b)} ${termenCuSemn(c)} ${cuSemn(d)}$ `
        + 'la forma $mx + n$.',
    },
    blanks: [
      { label: 'Valoarea lui $m$', answer: a + c, kind: 'int' },
      { label: 'Valoarea lui $n$', answer: b + d, kind: 'int' },
    ],
    solutionLatex: `${coef(a + c)} ${cuSemn(b + d)}`,
  };
}

/** Distributivitatea simplă și dublă. */
export function viiiDistributivitate() {
  if (Math.random() < 0.5) {
    const a = nz(-8, 8);
    const b = nz(-8, 8);
    const c = nz(-8, 8);
    return {
      prompt: {
        text: `Se desface paranteza din $${a}(${coef(b)} ${cuSemn(c)})$. Rezultatul are forma $mx + n$.`,
      },
      blanks: [
        { label: 'Valoarea lui $m$', answer: a * b, kind: 'int' },
        { label: 'Valoarea lui $n$', answer: a * c, kind: 'int' },
      ],
      solutionLatex: `${coef(a * b)} ${cuSemn(a * c)}`,
    };
  }
  const p = nz(-6, 6); const q = nz(-6, 6);
  return {
    prompt: {
      text: `Se desfac parantezele din $(x ${cuSemn(p)})(x ${cuSemn(q)})$. `
        + 'Rezultatul are forma $x^2 + mx + n$.',
    },
    blanks: [
      { label: 'Valoarea lui $m$', answer: p + q, kind: 'int' },
      { label: 'Valoarea lui $n$', answer: p * q, kind: 'int' },
    ],
    solutionLatex: `x^2 ${termenCuSemn(p + q)} ${cuSemn(p * q)}`,
  };
}

/** Formulele de calcul prescurtat. */
export function viiiFormuleCalculPrescurtat() {
  const a = ri(1, 9);
  const fel = pick(['patratSuma', 'patratDiferenta', 'diferentaPatrate']);
  if (fel === 'patratSuma') {
    return {
      prompt: { text: `Se dezvoltă $(x + ${a})^2$. Rezultatul are forma $x^2 + mx + n$.` },
      blanks: [
        { label: 'Valoarea lui $m$', answer: 2 * a, kind: 'int' },
        { label: 'Valoarea lui $n$', answer: a * a, kind: 'int' },
      ],
      solutionLatex: `(x + ${a})^2 = x^2 + ${2 * a}x + ${a * a}`,
    };
  }
  if (fel === 'patratDiferenta') {
    return {
      prompt: { text: `Se dezvoltă $(x - ${a})^2$. Rezultatul are forma $x^2 + mx + n$.` },
      blanks: [
        { label: 'Valoarea lui $m$', answer: -2 * a, kind: 'int' },
        { label: 'Valoarea lui $n$', answer: a * a, kind: 'int' },
      ],
      solutionLatex: `(x - ${a})^2 = x^2 - ${2 * a}x + ${a * a}`,
    };
  }
  return {
    prompt: { text: `Se dezvoltă $(x - ${a})(x + ${a})$. Rezultatul are forma $x^2 + n$.` },
    blanks: [{ label: 'Valoarea lui $n$', answer: -a * a, kind: 'int' }],
    solutionLatex: `(x - ${a})(x + ${a}) = x^2 - ${a * a}`,
  };
}

/** Descompuneri în factori: factor comun, formule, grupare. */
export function viiiDescompuneri() {
  const fel = pick(['factorComun', 'diferentaPatrate', 'grupare']);
  if (fel === 'factorComun') {
    const k = ri(2, 9);
    const b = ri(2, 9);
    return {
      prompt: {
        text: `Se scoate factorul comun din $${k}x + ${k * b}$. Rezultatul are forma $k(x + n)$.`,
      },
      blanks: [
        { label: 'Valoarea lui $k$', answer: k, kind: 'int' },
        { label: 'Valoarea lui $n$', answer: b, kind: 'int' },
      ],
      solutionLatex: `${k}x + ${k * b} = ${k}(x + ${b})`,
    };
  }
  if (fel === 'diferentaPatrate') {
    const a = ri(2, 12);
    return {
      prompt: {
        text: `Se descompune $x^2 - ${a * a}$ în produsul $(x - n)(x + n)$.`,
      },
      blanks: [{ label: 'Valoarea lui $n$', answer: a, kind: 'int' }],
      solutionLatex: `x^2 - ${a * a} = (x - ${a})(x + ${a})`,
    };
  }
  const p = ri(2, 8);
  const q = ri(2, 8);
  return {
    prompt: {
      text: `Se descompune $x^2 + ${p + q}x + ${p * q}$ în produsul $(x + m)(x + n)$, cu $m \\le n$.`,
    },
    blanks: [
      { label: 'Valoarea lui $m$', answer: Math.min(p, q), kind: 'int' },
      { label: 'Valoarea lui $n$', answer: Math.max(p, q), kind: 'int' },
    ],
    solutionLatex: `x^2 + ${p + q}x + ${p * q} = (x + ${Math.min(p, q)})(x + ${Math.max(p, q)})`,
  };
}

/** Fracții algebrice: condiții de existență și simplificare. */
export function viiiFractiiAlgebrice() {
  const a = nz(-9, 9);
  if (Math.random() < 0.5) {
    return {
      prompt: {
        text: `Pentru ce valoare a lui $x$ fracția $\\dfrac{1}{x ${cuSemn(a)}}$ nu are sens?`,
      },
      blanks: [{ label: 'Valoarea lui $x$', answer: -a, kind: 'dec' }],
      solutionLatex: `x ${cuSemn(a)} = 0 \\Rightarrow x = ${-a}`,
    };
  }
  const b = ri(2, 9);
  return {
    prompt: {
      text: `Se simplifică fracția $\\dfrac{x^2 - ${b * b}}{x - ${b}}$. Rezultatul are forma $x + n$.`,
    },
    blanks: [{ label: 'Valoarea lui $n$', answer: b, kind: 'int' }],
    solutionLatex: `\\dfrac{(x - ${b})(x + ${b})}{x - ${b}} = x + ${b}`,
  };
}

/** Ecuația de gradul al doilea. */
export function viiiEcuatiaGradulDoi() {
  const p = nz(-8, 8);
  const q = nz(-8, 8);
  const b = -(p + q);
  const c = p * q;
  return {
    prompt: {
      text: `Rezolvă ecuația $x^2 ${termenCuSemn(b)} ${cuSemn(c)} = 0$.`,
    },
    blanks: [
      { label: 'Soluția mai mică', answer: Math.min(p, q), kind: 'dec' },
      { label: 'Soluția mai mare', answer: Math.max(p, q), kind: 'dec' },
    ],
    solutionLatex: `(x ${cuSemn(-p)})(x ${cuSemn(-q)}) = 0 \\Rightarrow x_1 = ${Math.min(p, q)},\\ x_2 = ${Math.max(p, q)}`,
  };
}

/** Funcția de gradul I: imaginea unui număr. */
export function viiiFunctieImagine() {
  const a = nz(-6, 6);
  const b = nz(-9, 9);
  const x = nz(-6, 6);
  return {
    prompt: {
      text: `Se dă funcția $f(x) = ${coef(a)} ${cuSemn(b)}$. Cât este $f(${x})$?`,
    },
    blanks: [{ label: `Valoarea lui $f(${x})$`, answer: a * x + b, kind: 'dec' }],
    solutionLatex: `f(${x}) = ${a} \\cdot (${x}) ${cuSemn(b)} = ${a * x + b}`,
  };
}

/** Funcția de gradul I: antecedentul unui număr. */
export function viiiFunctieAntecedent() {
  const a = nz(-6, 6);
  const b = nz(-9, 9);
  const x = nz(-6, 6);
  return {
    prompt: {
      text: `Se dă funcția $f(x) = ${coef(a)} ${cuSemn(b)}$. Pentru ce valoare a lui $x$ avem $f(x) = ${a * x + b}$?`,
    },
    blanks: [{ label: 'Valoarea lui $x$', answer: x, kind: 'dec' }],
    solutionLatex: `${coef(a)} = ${a * x} \\Rightarrow x = ${x}`,
  };
}

/** Funcția de gradul I: intersecțiile graficului cu axele. */
export function viiiFunctieGrafic() {
  const a = nz(-6, 6);
  const x = nz(-6, 6);
  const b = -a * x;
  if (Math.random() < 0.5) {
    return {
      prompt: {
        text: `Graficul funcției $f(x) = ${coef(a)} ${cuSemn(b)}$ taie axa $Oy$ într-un punct. `
          + 'Ce ordonată are acel punct?',
      },
      blanks: [{ label: 'Ordonata', answer: b, kind: 'dec' }],
      solutionLatex: `f(0) = ${b}`,
    };
  }
  return {
    prompt: {
      text: `Graficul funcției $f(x) = ${coef(a)} ${cuSemn(b)}$ taie axa $Ox$ într-un punct. `
        + 'Ce abscisă are acel punct?',
    },
    blanks: [{ label: 'Abscisa', answer: x, kind: 'dec' }],
    solutionLatex: `${coef(a)} ${cuSemn(b)} = 0 \\Rightarrow x = ${x}`,
  };
}

/** Indicatorii tendinței centrale: media, mediana, modul, amplitudinea. */
export function viiiStatistica() {
  const cate = pick([5, 7]);
  const date = Array.from({ length: cate }, () => ri(1, 10));
  // Un element se repetă, ca modul să fie unic determinat.
  date[ri(0, cate - 1)] = date[0];
  const sortate = [...date].sort((a, b) => a - b);
  const mediana = sortate[(cate - 1) / 2];
  const amplitudine = sortate[cate - 1] - sortate[0];
  const frecvente = {};
  sortate.forEach((x) => { frecvente[x] = (frecvente[x] || 0) + 1; });
  const maxim = Math.max(...Object.values(frecvente));
  const moduri = Object.keys(frecvente).filter((k) => frecvente[k] === maxim).map(Number);
  if (moduri.length > 1) return viiiStatistica();
  const fel = pick(['mediana', 'amplitudine', 'mod']);
  const raspuns = { mediana, amplitudine, mod: moduri[0] }[fel];
  const eticheta = { mediana: 'Mediana', amplitudine: 'Amplitudinea', mod: 'Modul' }[fel];
  return {
    prompt: { text: `Se dă setul de date: $${date.join('$, $')}$.` },
    blanks: [{ label: eticheta, answer: raspuns, kind: 'dec' }],
    solutionLatex: `\\text{Date ordonate: } ${sortate.join(',\\ ')} \\Rightarrow \\text{${eticheta}} = ${raspuns}`,
  };
}

/** Prisma dreaptă: aria laterală și volumul. */
export function viiiPrisma() {
  const latura = ri(2, 10);
  const h = ri(3, 15);
  return {
    prompt: {
      text: `O prismă dreaptă are baza pătrat cu latura de $${latura}$ cm și înălțimea de $${h}$ cm.`,
    },
    blanks: [
      { label: 'Aria laterală, în centimetri pătrați', answer: 4 * latura * h, kind: 'dec' },
      { label: 'Volumul, în centimetri cubi', answer: latura * latura * h, kind: 'dec' },
    ],
    solutionLatex: `A_\\ell = 4 \\cdot ${latura} \\cdot ${h} = ${4 * latura * h}, \\quad V = ${latura}^2 \\cdot ${h} = ${latura * latura * h}`,
  };
}

/** Diagonala paralelipipedului dreptunghic. */
export function viiiDiagonalaParalelipiped() {
  const seturi = [[1, 2, 2, 3], [2, 3, 6, 7], [1, 4, 8, 9], [2, 6, 9, 11], [4, 4, 7, 9], [3, 4, 12, 13]];
  const [a, b, c, d] = pick(seturi);
  return {
    prompt: {
      text: `Un paralelipiped dreptunghic are dimensiunile $${a}$ cm, $${b}$ cm și $${c}$ cm.`,
    },
    blanks: [{ label: 'Lungimea diagonalei, în centimetri', answer: d, kind: 'dec', tol: 1e-6 }],
    solutionLatex: `d = \\sqrt{${a}^2 + ${b}^2 + ${c}^2} = \\sqrt{${d * d}} = ${d}`,
  };
}

/** Piramida regulată: volumul. */
export function viiiPiramida() {
  const latura = ri(2, 10);
  const h = 3 * ri(1, 6);
  return {
    prompt: {
      text: `O piramidă regulată are baza pătrat cu latura de $${latura}$ cm și înălțimea de $${h}$ cm.`,
    },
    blanks: [{ label: 'Volumul, în centimetri cubi', answer: (latura * latura * h) / 3, kind: 'dec', tol: 1e-6 }],
    solutionLatex: `V = \\dfrac{${latura}^2 \\cdot ${h}}{3} = ${(latura * latura * h) / 3}`,
  };
}

/** Cilindrul circular drept: aria laterală și volumul. */
export function viiiCilindru() {
  const r = ri(2, 10);
  const h = ri(2, 12);
  return {
    prompt: {
      text: `Un cilindru circular drept are raza bazei de $${r}$ cm și înălțimea de $${h}$ cm. `
        + 'Aria laterală se scrie $A = k \\pi$, iar volumul $V = p \\pi$.',
    },
    blanks: [
      { label: 'Valoarea lui $k$', answer: 2 * r * h, kind: 'dec' },
      { label: 'Valoarea lui $p$', answer: r * r * h, kind: 'dec' },
    ],
    solutionLatex: `A_\\ell = 2\\pi r h = ${2 * r * h}\\pi, \\quad V = \\pi r^2 h = ${r * r * h}\\pi`,
  };
}

/** Conul circular drept: generatoarea și volumul. */
export function viiiCon() {
  const triplete = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15]];
  const [r, h, g] = pick(triplete);
  if (Math.random() < 0.5) {
    return {
      prompt: {
        text: `Un con circular drept are raza bazei de $${r}$ cm și înălțimea de $${h}$ cm.`,
      },
      blanks: [{ label: 'Lungimea generatoarei, în centimetri', answer: g, kind: 'dec', tol: 1e-6 }],
      solutionLatex: `G = \\sqrt{${r}^2 + ${h}^2} = \\sqrt{${g * g}} = ${g}`,
    };
  }
  return {
    prompt: {
      text: `Un con circular drept are raza bazei de $${r}$ cm și înălțimea de $${h}$ cm. `
        + 'Volumul se scrie $V = p \\pi$.',
    },
    blanks: [{ label: 'Valoarea lui $p$', answer: (r * r * h) / 3, kind: 'dec', tol: 1e-6 }],
    solutionLatex: `V = \\dfrac{\\pi r^2 h}{3} = ${(r * r * h) / 3}\\pi`,
  };
}

/** Sfera: aria și volumul. */
export function viiiSfera() {
  const r = pick([3, 6, 9, 12]);
  if (Math.random() < 0.5) {
    return {
      prompt: {
        text: `O sferă are raza de $${r}$ cm. Aria ei se scrie $A = k \\pi$ centimetri pătrați.`,
      },
      blanks: [{ label: 'Valoarea lui $k$', answer: 4 * r * r, kind: 'dec' }],
      solutionLatex: `A = 4\\pi r^2 = ${4 * r * r}\\pi`,
    };
  }
  return {
    prompt: {
      text: `O sferă are raza de $${r}$ cm. Volumul ei se scrie $V = p \\pi$ centimetri cubi.`,
    },
    blanks: [{ label: 'Valoarea lui $p$', answer: (4 * r ** 3) / 3, kind: 'dec', tol: 1e-6 }],
    solutionLatex: `V = \\dfrac{4\\pi r^3}{3} = ${(4 * r ** 3) / 3}\\pi`,
  };
}

/** Trunchiul de piramidă și trunchiul de con: volumul. */
export function viiiTrunchiuri() {
  if (Math.random() < 0.5) {
    const L = 2 * ri(2, 5);
    const l = ri(1, L / 2);
    const h = 3 * ri(1, 4);
    const V = (h * (L * L + L * l + l * l)) / 3;
    return {
      prompt: {
        text: `Un trunchi de piramidă regulată are bazele pătrate cu laturile de $${L}$ cm și $${l}$ cm, `
          + `iar înălțimea de $${h}$ cm.`,
      },
      blanks: [{ label: 'Volumul, în centimetri cubi', answer: V, kind: 'dec', tol: 0.005 }],
      solutionLatex: `V = \\dfrac{${h}}{3}\\left(${L * L} + ${L * l} + ${l * l}\\right) = ${V}`,
    };
  }
  const R = ri(3, 8);
  const r = ri(1, R - 1);
  const h = 3 * ri(1, 4);
  const p = (h * (R * R + R * r + r * r)) / 3;
  return {
    prompt: {
      text: `Un trunchi de con circular drept are razele bazelor de $${R}$ cm și $${r}$ cm, `
        + `iar înălțimea de $${h}$ cm. Volumul se scrie $V = p \\pi$.`,
    },
    blanks: [{ label: 'Valoarea lui $p$', answer: p, kind: 'dec', tol: 0.005 }],
    solutionLatex: `V = \\dfrac{\\pi ${h}}{3}\\left(${R * R} + ${R * r} + ${r * r}\\right) = ${p}\\pi`,
  };
}

/** Unghiul dintre o dreaptă și un plan, în corpurile studiate. */
export function viiiUnghiDreaptaPlan() {
  const l = 2 * ri(2, 8);
  return {
    prompt: {
      text: `Cubul $ABCDA'B'C'D'$ are muchia de $${l}$ cm. `
        + `Cât măsoară unghiul dintre dreapta $AA'$ și planul bazei $ABCD$?`,
    },
    blanks: [{ label: 'Măsura, în grade', answer: 90, kind: 'int' }],
    solutionLatex: `AA' \\perp (ABCD) \\Rightarrow 90^\\circ`,
  };
}

/* ════════════════════════════════════════════════════════════════════════
   Registrul — ce automatism aparține cărui capitol din programă
   ════════════════════════════════════════════════════════════════════════ */

export const REGISTRY = {
  /* ── Clasa a V-a ─────────────────────────────────────────────────────── */
  vTablaInmultirii: { title: 'Tabla înmulțirii', capitol: 'Numere naturale', fn: vTablaInmultirii },
  vOrdineaOperatiilor: { title: 'Ordinea efectuării operațiilor', capitol: 'Numere naturale', fn: vOrdineaOperatiilor },
  vPuteri: { title: 'Puteri cu exponent natural', capitol: 'Numere naturale', fn: vPuteri },
  vPatratPerfect: { title: 'Pătrate perfecte', capitol: 'Numere naturale', fn: vPatratPerfect },
  vImpartireCuRest: { title: 'Împărțirea cu rest', capitol: 'Numere naturale', fn: vImpartireCuRest },
  vBaza2: { title: 'Scrierea în baza 2', capitol: 'Numere naturale', fn: vBaza2 },
  vCriteriiDivizibilitate: { title: 'Criterii de divizibilitate', capitol: 'Divizibilitate', fn: vCriteriiDivizibilitate },
  vDivizoriMultipli: { title: 'Divizori și multipli', capitol: 'Divizibilitate', fn: vDivizoriMultipli },
  vPrimCompus: { title: 'Numere prime și numere compuse', capitol: 'Divizibilitate', fn: vPrimCompus },
  vCmmdcCmmmc: { title: 'Cel mai mare divizor comun și cel mai mic multiplu comun', capitol: 'Divizibilitate', fn: vCmmdcCmmmc },
  vTipulFractiei: { title: 'Fracții subunitare, echiunitare și supraunitare', capitol: 'Fracții ordinare', fn: vTipulFractiei },
  vAmplificareSimplificare: { title: 'Amplificarea și simplificarea fracțiilor', capitol: 'Fracții ordinare', fn: vAmplificareSimplificare },
  vAdunareaFractiilor: { title: 'Adunarea și scăderea fracțiilor', capitol: 'Fracții ordinare', fn: vAdunareaFractiilor },
  vInmultireaFractiilor: { title: 'Înmulțirea și împărțirea fracțiilor', capitol: 'Fracții ordinare', fn: vInmultireaFractiilor },
  vProcentDin: { title: 'Procent dintr-un număr', capitol: 'Fracții ordinare', fn: vProcentDin },
  vZecimale: { title: 'Operații cu fracții zecimale', capitol: 'Fracții zecimale', fn: vZecimale },
  vInmultireCu10: { title: 'Înmulțiri și împărțiri cu 10, 100 și 1000', capitol: 'Fracții zecimale', fn: vInmultireCu10 },
  vMediaAritmetica: { title: 'Media aritmetică', capitol: 'Organizarea datelor', fn: vMediaAritmetica },
  vClasificareaUnghiurilor: { title: 'Clasificarea unghiurilor', capitol: 'Elemente de geometrie', fn: vClasificareaUnghiurilor },
  vGradeMinute: { title: 'Calcule cu grade și minute', capitol: 'Elemente de geometrie', fn: vGradeMinute },
  vMijloculSegmentului: { title: 'Mijlocul unui segment', capitol: 'Elemente de geometrie', fn: vMijloculSegmentului },
  vPerimetruArie: { title: 'Perimetrul și aria pătratului și dreptunghiului', capitol: 'Unități de măsură', fn: vPerimetruArie },
  vVolumCubParalelipiped: { title: 'Volumul cubului și al paralelipipedului', capitol: 'Unități de măsură', fn: vVolumCubParalelipiped },
  vTransformariUnitati: { title: 'Transformări de unități de măsură', capitol: 'Unități de măsură', fn: vTransformariUnitati },

  /* ── Clasa a VI-a ────────────────────────────────────────────────────── */
  viOperatiiMultimi: { title: 'Operații cu mulțimi', capitol: 'Mulțimi', fn: viOperatiiMultimi },
  viDescompunereFactoriPrimi: { title: 'Descompunerea în factori primi', capitol: 'Mulțimi', fn: viDescompunereFactoriPrimi },
  viProportie: { title: 'Termenul necunoscut dintr-o proporție', capitol: 'Rapoarte și proporții', fn: viProportie },
  viSirRapoarteEgale: { title: 'Șir de rapoarte egale', capitol: 'Rapoarte și proporții', fn: viSirRapoarteEgale },
  viDirectInversProportionale: { title: 'Mărimi direct și invers proporționale', capitol: 'Rapoarte și proporții', fn: viDirectInversProportionale },
  viRegulaDeTreiSimpla: { title: 'Regula de trei simplă', capitol: 'Rapoarte și proporții', fn: viRegulaDeTreiSimpla },
  viProbabilitate: { title: 'Probabilități', capitol: 'Organizarea datelor', fn: viProbabilitate },
  viIntregiAdunare: { title: 'Adunarea și scăderea numerelor întregi', capitol: 'Numere întregi', fn: viIntregiAdunare },
  viIntregiInmultire: { title: 'Înmulțirea și împărțirea numerelor întregi', capitol: 'Numere întregi', fn: viIntregiInmultire },
  viModulIntreg: { title: 'Modulul și compararea numerelor întregi', capitol: 'Numere întregi', fn: viModulIntreg },
  viPuteriIntregi: { title: 'Puteri ale numerelor întregi', capitol: 'Numere întregi', fn: viPuteriIntregi },
  viEcuatiiIntregi: { title: 'Ecuații în mulțimea numerelor întregi', capitol: 'Numere întregi', fn: viEcuatiiIntregi },
  viRationaleOperatii: { title: 'Operații cu numere raționale', capitol: 'Numere raționale', fn: viRationaleOperatii },
  viEcuatiiRationale: { title: 'Ecuații cu numere raționale', capitol: 'Numere raționale', fn: viEcuatiiRationale },
  viPerechiDeUnghiuri: { title: 'Unghiuri opuse la vârf, suplementare, complementare', capitol: 'Noțiuni geometrice fundamentale', fn: viPerechiDeUnghiuri },
  viBisectoarea: { title: 'Bisectoarea unui unghi', capitol: 'Noțiuni geometrice fundamentale', fn: viBisectoarea },
  viParaleleSecanta: { title: 'Unghiuri formate de paralele cu o secantă', capitol: 'Noțiuni geometrice fundamentale', fn: viParaleleSecanta },
  viElementeInCerc: { title: 'Elemente în cerc', capitol: 'Noțiuni geometrice fundamentale', fn: viElementeInCerc },
  viSumaUnghiurilorTriunghi: { title: 'Suma unghiurilor unui triunghi', capitol: 'Triunghiul', fn: viSumaUnghiurilorTriunghi },
  viInegalitateaTriunghiului: { title: 'Inegalitatea triunghiului', capitol: 'Triunghiul', fn: viInegalitateaTriunghiului },
  viTripletePitagoreice: { title: 'Triplete pitagoreice', capitol: 'Triunghiul', fn: viTripletePitagoreice },

  /* ── Clasa a VII-a ───────────────────────────────────────────────────── */
  viiRadicalPatratPerfect: { title: 'Rădăcina pătrată', capitol: 'Mulțimea numerelor reale', fn: viiRadicalPatratPerfect },
  viiScoatereDeSubRadical: { title: 'Scoaterea factorilor de sub radical', capitol: 'Mulțimea numerelor reale', fn: viiScoatereDeSubRadical },
  viiOperatiiRadicali: { title: 'Operații cu radicali', capitol: 'Mulțimea numerelor reale', fn: viiOperatiiRadicali },
  viiRationalizare: { title: 'Raționalizarea numitorului', capitol: 'Mulțimea numerelor reale', fn: viiRationalizare },
  viiModulReal: { title: 'Modulul unui număr real', capitol: 'Mulțimea numerelor reale', fn: viiModulReal },
  viiMediePonderata: { title: 'Media aritmetică ponderată', capitol: 'Mulțimea numerelor reale', fn: viiMediePonderata },
  viiMedieGeometrica: { title: 'Media geometrică', capitol: 'Mulțimea numerelor reale', fn: viiMedieGeometrica },
  viiEcuatiaPatratica: { title: 'Ecuația de forma x² = a', capitol: 'Mulțimea numerelor reale', fn: viiEcuatiaPatratica },
  viiEcuatiaLiniara: { title: 'Ecuația de forma ax + b = 0', capitol: 'Ecuații și sisteme', fn: viiEcuatiaLiniara },
  viiSistemEcuatii: { title: 'Sisteme de două ecuații liniare', capitol: 'Ecuații și sisteme', fn: viiSistemEcuatii },
  viiCoordonate: { title: 'Coordonatele unui punct în plan', capitol: 'Organizarea datelor', fn: viiCoordonate },
  viiDistantaPuncte: { title: 'Distanța dintre două puncte', capitol: 'Organizarea datelor', fn: viiDistantaPuncte },
  viiSumaUnghiurilorPatrulater: { title: 'Suma unghiurilor unui patrulater', capitol: 'Patrulaterul', fn: viiSumaUnghiurilorPatrulater },
  viiParalelogram: { title: 'Proprietățile paralelogramului', capitol: 'Patrulaterul', fn: viiParalelogram },
  viiLinieMijlocie: { title: 'Linia mijlocie în triunghi și în trapez', capitol: 'Patrulaterul', fn: viiLinieMijlocie },
  viiAriiPatrulatere: { title: 'Ariile patrulaterelor', capitol: 'Patrulaterul', fn: viiAriiPatrulatere },
  viiCercLungimeArie: { title: 'Lungimea cercului și aria discului', capitol: 'Cercul', fn: viiCercLungimeArie },
  viiUnghiInscris: { title: 'Unghiul înscris în cerc', capitol: 'Cercul', fn: viiUnghiInscris },
  viiThales: { title: 'Teorema lui Thales', capitol: 'Asemănarea triunghiurilor', fn: viiThales },
  viiAsemanare: { title: 'Triunghiuri asemenea', capitol: 'Asemănarea triunghiurilor', fn: viiAsemanare },
  viiPitagora: { title: 'Teorema lui Pitagora', capitol: 'Relații metrice', fn: viiPitagora },
  viiCatetaInaltime: { title: 'Teorema catetei și teorema înălțimii', capitol: 'Relații metrice', fn: viiCatetaInaltime },
  viiTrigonometrie: { title: 'Valori trigonometrice pentru 30°, 45° și 60°', capitol: 'Relații metrice', fn: viiTrigonometrie },
  viiFiguriRegulate: { title: 'Triunghiul echilateral, pătratul și hexagonul regulat', capitol: 'Relații metrice', fn: viiFiguriRegulate },

  /* ── Clasa a VIII-a ──────────────────────────────────────────────────── */
  viiiIntervale: { title: 'Intervale de numere reale', capitol: 'Intervale. Inecuații', fn: viiiIntervale },
  viiiInecuatii: { title: 'Inecuații de gradul I', capitol: 'Intervale. Inecuații', fn: viiiInecuatii },
  viiiReducereaTermenilor: { title: 'Reducerea termenilor asemenea', capitol: 'Calcul algebric', fn: viiiReducereaTermenilor },
  viiiDistributivitate: { title: 'Distributivitatea simplă și dublă', capitol: 'Calcul algebric', fn: viiiDistributivitate },
  viiiFormuleCalculPrescurtat: { title: 'Formule de calcul prescurtat', capitol: 'Calcul algebric', fn: viiiFormuleCalculPrescurtat },
  viiiDescompuneri: { title: 'Descompuneri în factori', capitol: 'Calcul algebric', fn: viiiDescompuneri },
  viiiFractiiAlgebrice: { title: 'Fracții algebrice', capitol: 'Calcul algebric', fn: viiiFractiiAlgebrice },
  viiiEcuatiaGradulDoi: { title: 'Ecuația de gradul al doilea', capitol: 'Calcul algebric', fn: viiiEcuatiaGradulDoi },
  viiiFunctieImagine: { title: 'Funcția de gradul I — imaginea unui număr', capitol: 'Funcții', fn: viiiFunctieImagine },
  viiiFunctieAntecedent: { title: 'Funcția de gradul I — antecedentul', capitol: 'Funcții', fn: viiiFunctieAntecedent },
  viiiFunctieGrafic: { title: 'Graficul funcției de gradul I', capitol: 'Funcții', fn: viiiFunctieGrafic },
  viiiStatistica: { title: 'Media, mediana, modul și amplitudinea', capitol: 'Elemente de statistică', fn: viiiStatistica },
  viiiUnghiDreaptaPlan: { title: 'Unghiul dintre o dreaptă și un plan', capitol: 'Geometrie în spațiu', fn: viiiUnghiDreaptaPlan },
  viiiDiagonalaParalelipiped: { title: 'Diagonala paralelipipedului dreptunghic', capitol: 'Geometrie în spațiu', fn: viiiDiagonalaParalelipiped },
  viiiPrisma: { title: 'Prisma dreaptă — arie și volum', capitol: 'Arii și volume', fn: viiiPrisma },
  viiiPiramida: { title: 'Piramida regulată — volum', capitol: 'Arii și volume', fn: viiiPiramida },
  viiiCilindru: { title: 'Cilindrul circular drept — arie și volum', capitol: 'Arii și volume', fn: viiiCilindru },
  viiiCon: { title: 'Conul circular drept — generatoare și volum', capitol: 'Arii și volume', fn: viiiCon },
  viiiTrunchiuri: { title: 'Trunchiul de piramidă și trunchiul de con', capitol: 'Arii și volume', fn: viiiTrunchiuri },
  viiiSfera: { title: 'Sfera — arie și volum', capitol: 'Arii și volume', fn: viiiSfera },
};
