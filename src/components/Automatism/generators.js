// ============================================================
// EduPAȘI / EduMat58 — Generatoare de automatisme
// ------------------------------------------------------------
// Fiecare generator este o funcție PURĂ care întoarce o întrebare
// NOUĂ, generată aleator la fiecare apel — elevul nu poate memora
// răspunsurile, doar automatiza procedura.
//
// Contract al unei întrebări:
//   {
//     prompt: { text?, latex?, svg?, imageUrl? },  // enunțul
//     blanks: [ { answer, kind, tol?, label?, placeholder? } ],
//     solutionLatex?: string,   // răspunsul corect, afișat frumos
//     hint?: string,
//   }
// kind ∈ 'int' | 'dec' | 'fraction' | 'text'
//
// Codul e JS pur (fără React) ca să poată fi folosit atât în
// componenta Docusaurus, cât și în pagina de previzualizare.
// ============================================================

/* ------------------------- utilitare ------------------------- */
export function ri(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function nz(min, max) {
  // întreg nenul
  let v = 0;
  while (v === 0) v = ri(min, max);
  return v;
}
function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}
function fracLatex(n, d) {
  if (d === 1) return `${n}`;
  if (n < 0) return `-\\dfrac{${Math.abs(n)}}{${d}}`;
  return `\\dfrac{${n}}{${d}}`;
}
// scrie un întreg cu semn pentru concatenare: +3  /  -3
function signed(n) {
  return n < 0 ? `- ${Math.abs(n)}` : `+ ${n}`;
}
// termen literal cu semn: +x, -x, +3x, -3x  (nu „+1x")
function signedTerm(c, v = 'x') {
  const a = Math.abs(c);
  const t = a === 1 ? v : `${a}${v}`;
  return c < 0 ? `- ${t}` : `+ ${t}`;
}
// coeficient literal: 1x -> x, -1x -> -x
function coefTerm(c, v = 'x') {
  if (c === 1) return v;
  if (c === -1) return `-${v}`;
  return `${c}${v}`;
}

/* ============================================================
   CLASA a V-a  (≈ 6e)
   ============================================================ */

// A1 — Tabla înmulțirii (declarativ + reciproc)
export function multTable() {
  const mode = pick(['direct', 'quotient', 'missing']);
  const a = ri(2, 9);
  const b = ri(2, 9);
  if (mode === 'direct') {
    return {
      prompt: { latex: `${a} \\times ${b} = \\square` },
      blanks: [{ answer: a * b, kind: 'int' }],
      solutionLatex: `${a} \\times ${b} = ${a * b}`,
    };
  }
  if (mode === 'quotient') {
    const p = a * b;
    return {
      prompt: { text: `În $${p}$ de câte ori se cuprinde $${a}$?`, latex: `${p} : ${a} = \\square` },
      blanks: [{ answer: b, kind: 'int' }],
      solutionLatex: `${p} : ${a} = ${b}`,
    };
  }
  return {
    prompt: { latex: `${a} \\times \\square = ${a * b}` },
    blanks: [{ answer: b, kind: 'int' }],
    solutionLatex: `${a} \\times ${b} = ${a * b}`,
  };
}

// A2 — Ordinea operațiilor
export function orderOfOps() {
  const a = ri(2, 9);
  const b = ri(2, 9);
  const c = ri(2, 9);
  const shape = pick(['a+bc', 'bc+a', 'a+b*c-d']);
  if (shape === 'a+bc') {
    return {
      prompt: { latex: `${a} + ${b} \\times ${c} = \\square` },
      blanks: [{ answer: a + b * c, kind: 'int' }],
      solutionLatex: `${a} + ${b}\\times ${c} = ${a} + ${b * c} = ${a + b * c}`,
    };
  }
  if (shape === 'bc+a') {
    return {
      prompt: { latex: `${b} \\times ${c} + ${a} = \\square` },
      blanks: [{ answer: b * c + a, kind: 'int' }],
      solutionLatex: `${b}\\times ${c} + ${a} = ${b * c} + ${a} = ${b * c + a}`,
    };
  }
  const d = ri(1, 9);
  return {
    prompt: { latex: `${a} + ${b} \\times ${c} - ${d} = \\square` },
    blanks: [{ answer: a + b * c - d, kind: 'int' }],
    solutionLatex: `${a} + ${b * c} - ${d} = ${a + b * c - d}`,
  };
}

// A3 — Operația/factorul lipsă
export function missingNumber() {
  const type = pick(['mul', 'add', 'sub']);
  if (type === 'mul') {
    const a = ri(2, 9);
    const q = ri(2, 12);
    return {
      prompt: { latex: `${a} \\times \\square = ${a * q}` },
      blanks: [{ answer: q, kind: 'int' }],
      solutionLatex: `\\square = ${a * q} : ${a} = ${q}`,
    };
  }
  if (type === 'add') {
    const a = ri(20, 400);
    const s = a + ri(20, 400);
    return {
      prompt: { latex: `${a} + \\square = ${s}` },
      blanks: [{ answer: s - a, kind: 'int' }],
      solutionLatex: `\\square = ${s} - ${a} = ${s - a}`,
    };
  }
  const b = ri(20, 300);
  const a = b + ri(20, 300);
  return {
    prompt: { latex: `${a} - \\square = ${b}` },
    blanks: [{ answer: a - b, kind: 'int' }],
    solutionLatex: `\\square = ${a} - ${b} = ${a - b}`,
  };
}

// A4 — Înmulțiri / împărțiri cu 10, 100, 1000
export function powersOfTen() {
  const p = pick([10, 100, 1000]);
  const op = pick(['mul', 'div']);
  if (op === 'mul') {
    const a = ri(2, 99) / pick([1, 10]); // uneori zecimal
    const val = Math.round(a * p * 100) / 100;
    return {
      prompt: { latex: `${fmt(a)} \\times ${p} = \\square` },
      blanks: [{ answer: val, kind: 'dec' }],
      solutionLatex: `${fmt(a)} \\times ${p} = ${fmt(val)}`,
    };
  }
  const base = ri(1, 99);
  const a = base * p;
  return {
    prompt: { latex: `${a} : ${p} = \\square` },
    blanks: [{ answer: base, kind: 'int' }],
    solutionLatex: `${a} : ${p} = ${base}`,
  };
}

// A5 — Adunarea și scăderea numerelor zecimale
export function decimalAddSub() {
  let a = ri(10, 900) / 10;
  let b = ri(10, 900) / 10;
  const op = pick(['+', '-']);
  // la clasa a V-a nu ieșim în numere negative: scădem mereu mai mic din mai mare
  if (op === '-' && b > a) [a, b] = [b, a];
  const res = op === '+' ? a + b : a - b;
  const r = Math.round(res * 10) / 10;
  return {
    prompt: { latex: `${fmt(a)} ${op} ${fmt(b)} = \\square` },
    blanks: [{ answer: r, kind: 'dec' }],
    solutionLatex: `${fmt(a)} ${op} ${fmt(b)} = ${fmt(r)}`,
  };
}

function fmt(x) {
  // afișare numerică cu virgulă zecimală (stil RO), fără zerouri inutile
  const s = (Math.round(x * 1000) / 1000).toString();
  return s.replace('.', ',');
}

/* ============================================================
   CLASA a VI-a  (≈ 5e)
   ============================================================ */

// A1 — Numere întregi: adunare și scădere
export function intAddSub() {
  const a = nz(-12, 12);
  const b = nz(-12, 12);
  const op = pick(['+', '-']);
  const res = op === '+' ? a + b : a - b;
  const aL = a < 0 ? `(${a})` : `${a}`;
  const bL = b < 0 ? `(${b})` : `${b}`;
  return {
    prompt: { latex: `${aL} ${op} ${bL} = \\square` },
    blanks: [{ answer: res, kind: 'int' }],
    solutionLatex: `${aL} ${op} ${bL} = ${res}`,
  };
}

// A2 — Numere întregi: înmulțire
export function intMult() {
  const a = nz(-12, 12);
  const b = nz(-9, 9);
  const aL = a < 0 ? `(${a})` : `${a}`;
  const bL = b < 0 ? `(${b})` : `${b}`;
  return {
    prompt: { latex: `${aL} \\times ${bL} = \\square` },
    blanks: [{ answer: a * b, kind: 'int' }],
    solutionLatex: `${aL} \\times ${bL} = ${a * b}`,
  };
}

// A3 — Fracții: adunare
export function fracAdd() {
  let d1 = ri(2, 8);
  let d2 = ri(2, 8);
  let n1 = ri(1, d1 - 1);
  let n2 = ri(1, d2 - 1);
  const op = pick(['+', '-']);
  // la scădere ținem rezultatul pozitiv (fracția mai mare prima)
  if (op === '-' && n1 / d1 < n2 / d2) {
    [n1, d1, n2, d2] = [n2, d2, n1, d1];
  }
  const D = (d1 * d2) / gcd(d1, d2);
  let N = op === '+' ? n1 * (D / d1) + n2 * (D / d2) : n1 * (D / d1) - n2 * (D / d2);
  const g = gcd(N, D);
  const rn = N / g;
  const rd = D / g;
  return {
    prompt: { latex: `${fracLatex(n1, d1)} ${op} ${fracLatex(n2, d2)} = \\square` },
    blanks: [{ answer: rn / rd, kind: 'fraction', placeholder: 'ex: 5/6' }],
    solutionLatex: `= ${fracLatex(rn, rd)}`,
  };
}

// A4 — Fracții: înmulțire
export function fracMult() {
  const d1 = ri(2, 7);
  const d2 = ri(2, 7);
  const n1 = ri(1, d1 - 1); // fracții proprii (n < d), fără 6/2 etc.
  const n2 = ri(1, d2 - 1);
  const N = n1 * n2;
  const D = d1 * d2;
  const g = gcd(N, D);
  return {
    prompt: { latex: `${fracLatex(n1, d1)} \\times ${fracLatex(n2, d2)} = \\square` },
    blanks: [{ answer: N / D, kind: 'fraction', placeholder: 'ex: 3/10' }],
    solutionLatex: `= ${fracLatex(N / g, D / g)}`,
  };
}

// A5 — A patra proporțională (regula de trei)
export function fourthProportional() {
  const k = ri(2, 9);
  const a = ri(2, 12);
  const c = ri(2, 12);
  const b = a * k;
  const d = c * k;
  // tabel:  a -> b ,  c -> ?
  const svg = proportionTableSVG(a, b, c, '?');
  return {
    prompt: {
      text: 'Completează tabelul de proporționalitate. Cât este valoarea lipsă?',
      svg,
    },
    blanks: [{ answer: d, kind: 'dec' }],
    solutionLatex: `\\dfrac{${b}}{${a}} = ${k}\\;\\Rightarrow\\; ${c}\\times ${k} = ${d}`,
  };
}

// A6 — Procente simple dintr-o cantitate
export function percentage() {
  const p = pick([10, 20, 25, 50, 5, 75]);
  const base = pick([20, 40, 60, 80, 120, 200, 240, 400]);
  const val = (p / 100) * base;
  return {
    prompt: { latex: `${p}\\% \\text{ din } ${base} = \\square` },
    blanks: [{ answer: val, kind: 'dec' }],
    solutionLatex: `\\dfrac{${p}}{100}\\times ${base} = ${fmt(val)}`,
  };
}

/* ============================================================
   CLASA a VII-a  (≈ 4e)
   ============================================================ */

// A1 — Distributivitate simplă (dezvoltare) — două casete
export function distributeSimple() {
  const k = pick([-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]); // fără 1 și −1
  const b = nz(-9, 9);
  const inside = `x ${signed(b)}`; // x + 5 / x - 5
  return {
    prompt: {
      text: 'Dezvoltă expresia:',
      latex: `${k}(${inside})`,
    },
    blanks: [
      { answer: k, kind: 'int', label: 'coeficientul lui x' },
      { answer: k * b, kind: 'int', label: 'termenul liber (cu semn)' },
    ],
    solutionLatex: `${k}(${inside}) = ${coefTerm(k)} ${signed(k * b)}`,
  };
}

// A2 — Reducerea termenilor asemenea
export function reduceLikeTerms() {
  const a = nz(-8, 8);
  let b = nz(-8, 8);
  while (a + b === 0) b = nz(-8, 8); // evită „= 0x"
  return {
    prompt: { latex: `${coefTerm(a)} ${signedTerm(b)} = \\square\\,x`, text: 'Reduce termenii asemenea:' },
    blanks: [{ answer: a + b, kind: 'int', label: 'coeficientul lui x' }],
    solutionLatex: `${coefTerm(a)} ${signedTerm(b)} = ${coefTerm(a + b)}`,
  };
}

// A3 — Evaluarea unei expresii
export function evalExpression() {
  const a = nz(-5, 6);
  const b = nz(-9, 9);
  const x = nz(-5, 5);
  const val = a * x + b;
  return {
    prompt: { latex: `\\text{Pentru } x = ${x},\\quad ${coefTerm(a)} ${signed(b)} = \\square` },
    blanks: [{ answer: val, kind: 'int' }],
    solutionLatex: `${a}\\times(${x}) ${signed(b)} = ${a * x} ${signed(b)} = ${val}`,
  };
}

// A4 — Ecuații de gradul I (simple)
export function linearEqSimple() {
  const type = pick(['ax', 'x+a']);
  if (type === 'ax') {
    const a = nz(2, 9);
    const x = nz(-9, 9);
    return {
      prompt: { latex: `${a}x = ${a * x} \\qquad x = \\square` },
      blanks: [{ answer: x, kind: 'int' }],
      solutionLatex: `x = ${a * x} : ${a} = ${x}`,
    };
  }
  const a = nz(-15, 15);
  const x = nz(-15, 15);
  return {
    prompt: { latex: `x ${signed(a)} = ${x + a} \\qquad x = \\square` },
    blanks: [{ answer: x, kind: 'int' }],
    solutionLatex: `x = ${x + a} ${signed(-a)} = ${x}`,
  };
}

// A5 — Teorema lui Pitagora (ipotenuza) — cu figură SVG
export function pythagoras() {
  // triplete pitagoreice ca să iasă întreg
  const [a, b, c] = pick([
    [3, 4, 5],
    [6, 8, 10],
    [5, 12, 13],
    [8, 15, 17],
    [9, 12, 15],
    [7, 24, 25],
  ]);
  const svg = rightTriangleSVG(a, b);
  return {
    prompt: {
      text: `Triunghiul $ABC$ este dreptunghic în $A$, cu $AB = ${a}$ și $AC = ${b}$. Cât este ipotenuza $BC$?`,
      svg,
    },
    blanks: [{ answer: c, kind: 'dec' }],
    solutionLatex: `BC^2 = ${a}^2 + ${b}^2 = ${a * a} + ${b * b} = ${c * c}\\;\\Rightarrow\\; BC = ${c}`,
  };
}

// A6 — Viteză (mărimi cot: v = d / t)
export function speed() {
  const v = pick([10, 12, 15, 20, 40, 60, 80, 90]);
  const t = pick([1, 2, 3, 0.5, 1.5, 2.5]);
  const d = v * t;
  return {
    prompt: {
      latex: `v = ${v}\\ \\text{km/h},\\quad t = ${fmt(t)}\\ \\text{h}. \\quad d = \\square\\ \\text{km}`,
    },
    blanks: [{ answer: d, kind: 'dec' }],
    solutionLatex: `d = v \\times t = ${v}\\times ${fmt(t)} = ${fmt(d)}\\ \\text{km}`,
  };
}

/* ============================================================
   CLASA a VIII-a  (≈ 3e)
   ============================================================ */

// A1 — Funcții: calculul unei imagini
export function functionEval() {
  const a = nz(-4, 5);
  const b = nz(-9, 9);
  const x = nz(-5, 5);
  const val = a * x + b;
  return {
    prompt: {
      latex: `f(x) = ${coefTerm(a)} ${signed(b)}. \\qquad f(${x}) = \\square`,
    },
    blanks: [{ answer: val, kind: 'int' }],
    solutionLatex: `f(${x}) = ${a}\\times(${x}) ${signed(b)} = ${val}`,
  };
}

// A2 — Dublă distributivitate — dezvoltare (două casete)
export function doubleDistribute() {
  const a = nz(-5, 5);
  let b = nz(-5, 5);
  while (a + b === 0) b = nz(-5, 5); // păstrează termenul din mijloc
  // (x+a)(x+b) = x^2 + (a+b)x + ab
  return {
    prompt: {
      text: 'Dezvoltă și reduce:',
      latex: `(x ${signed(a)})(x ${signed(b)})`,
    },
    blanks: [
      { answer: a + b, kind: 'int', label: 'coeficientul lui x (cu semn)' },
      { answer: a * b, kind: 'int', label: 'termenul liber (cu semn)' },
    ],
    solutionLatex: `x^2 ${signedTerm(a + b)} ${signed(a * b)}`,
  };
}

// A3 — Identitatea a²−b² : factorizare
export function diffOfSquaresFactor() {
  const b = ri(2, 12);
  // x^2 - b^2 = (x - b)(x + b)
  return {
    prompt: {
      text: 'Factorizează folosind formula $a^2 - b^2 = (a-b)(a+b)$:',
      latex: `x^2 - ${b * b} = (x - \\square)(x + \\square)`,
    },
    blanks: [
      { answer: b, kind: 'int' },
      { answer: b, kind: 'int' },
    ],
    solutionLatex: `x^2 - ${b * b} = (x - ${b})(x + ${b})`,
  };
}

// A4 — Ecuații de gradul I (cu x în ambii membri)
export function linearEqDouble() {
  // ax + b = cx + d  cu soluție întreagă
  const x = nz(-6, 6);
  const a = nz(2, 6);
  let c = nz(-4, 4);
  while (c === a) c = nz(-4, 4);
  const b = nz(-9, 9);
  const d = (a - c) * x + b; // asigură soluția x
  const left = `${coefTerm(a)} ${signed(b)}`;
  const right = `${coefTerm(c)} ${signed(d)}`;
  return {
    prompt: { latex: `${left} = ${right} \\qquad x = \\square` },
    blanks: [{ answer: x, kind: 'dec' }],
    solutionLatex: `(${a - c})x = ${d - b}\\;\\Rightarrow\\; x = ${x}`,
  };
}

/* ============================================================
   Figuri SVG (geometrie) — moștenesc culoarea prin currentColor
   ============================================================ */
function rightTriangleSVG(a, b) {
  // desen schematic (nu la scară), cu unghi drept marcat în A
  return `<svg viewBox="0 0 200 150" width="200" height="150" role="img" aria-label="triunghi dreptunghic">
  <polygon points="30,120 30,30 170,120" fill="none" stroke="currentColor" stroke-width="2.5"/>
  <rect x="30" y="105" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"/>
  <text x="22" y="128" font-size="13" fill="currentColor">A</text>
  <text x="22" y="26" font-size="13" fill="currentColor">B</text>
  <text x="174" y="126" font-size="13" fill="currentColor">C</text>
  <text x="12" y="78" font-size="12" fill="currentColor">${a}</text>
  <text x="95" y="140" font-size="12" fill="currentColor">${b}</text>
</svg>`;
}

function proportionTableSVG(a, b, c, q) {
  return `<svg viewBox="0 0 240 80" width="240" height="80" role="img" aria-label="tabel de proporționalitate">
  <rect x="1" y="1" width="238" height="78" fill="none" stroke="currentColor" stroke-width="2"/>
  <line x1="120" y1="1" x2="120" y2="79" stroke="currentColor" stroke-width="1.5"/>
  <line x1="1" y1="40" x2="239" y2="40" stroke="currentColor" stroke-width="1.5"/>
  <text x="45" y="27" font-size="16" fill="currentColor" text-anchor="middle">${a}</text>
  <text x="180" y="27" font-size="16" fill="currentColor" text-anchor="middle">${c}</text>
  <text x="45" y="67" font-size="16" fill="currentColor" text-anchor="middle">${b}</text>
  <text x="180" y="67" font-size="16" fill="currentColor" text-anchor="middle" font-weight="bold">${q}</text>
</svg>`;
}

/* ============================================================
   GEOMETRIE (plan & spațiu) — figuri SVG desenate parametric.
   Tipurile de automatisme urmează documentul MEN „Les automatismes
   au collège" (Pitagora p.26–29, Thalès, translație, repere,
   arii/volume — p.16/18/20) și programa oficială de colegiu.
   Culoarea figurilor = currentColor (moștenește portocaliul temei).
   ============================================================ */
function gridSVG(points) {
  const min = -5, max = 5, step = 22, pad = 18;
  const size = (max - min) * step + 2 * pad;
  const ox = pad + -min * step, oy = pad + max * step;
  const X = (x) => ox + x * step, Y = (y) => oy - y * step;
  let g = '';
  for (let i = min; i <= max; i++) {
    g += `<line x1="${X(i)}" y1="${Y(min)}" x2="${X(i)}" y2="${Y(max)}" stroke="currentColor" stroke-width="0.5" opacity="0.22"/>`;
    g += `<line x1="${X(min)}" y1="${Y(i)}" x2="${X(max)}" y2="${Y(i)}" stroke="currentColor" stroke-width="0.5" opacity="0.22"/>`;
  }
  g += `<line x1="${X(min)}" y1="${Y(0)}" x2="${X(max)}" y2="${Y(0)}" stroke="currentColor" stroke-width="1.6"/>`;
  g += `<line x1="${X(0)}" y1="${Y(min)}" x2="${X(0)}" y2="${Y(max)}" stroke="currentColor" stroke-width="1.6"/>`;
  for (let i = min; i <= max; i++) {
    if (i === 0) continue;
    g += `<text x="${X(i)}" y="${Y(0) + 13}" font-size="9" fill="currentColor" text-anchor="middle" opacity="0.75">${i}</text>`;
    g += `<text x="${X(0) - 9}" y="${Y(i) + 3}" font-size="9" fill="currentColor" text-anchor="middle" opacity="0.75">${i}</text>`;
  }
  for (const p of points) {
    g += `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="4" fill="currentColor"/>`;
    if (p.label) g += `<text x="${X(p.x) + 7}" y="${Y(p.y) - 7}" font-size="14" fill="currentColor" font-weight="bold">${p.label}</text>`;
  }
  return `<svg viewBox="0 0 ${size} ${size}" width="240" height="240" role="img" aria-label="reper cartezian">${g}</svg>`;
}
function rectSVG(L, l) {
  return `<svg viewBox="0 0 200 135" width="200" height="135" role="img" aria-label="dreptunghi">
  <rect x="30" y="28" width="140" height="88" fill="none" stroke="currentColor" stroke-width="2.5"/>
  <text x="100" y="20" font-size="13" fill="currentColor" text-anchor="middle">${L}</text>
  <text x="18" y="76" font-size="13" fill="currentColor" text-anchor="middle">${l}</text>
</svg>`;
}
function triAreaSVG(b, h) {
  return `<svg viewBox="0 0 200 150" width="200" height="150" role="img" aria-label="triunghi dreptunghic">
  <polygon points="30,120 170,120 30,30" fill="none" stroke="currentColor" stroke-width="2.5"/>
  <rect x="30" y="106" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"/>
  <text x="100" y="138" font-size="13" fill="currentColor" text-anchor="middle">${b}</text>
  <text x="16" y="78" font-size="13" fill="currentColor" text-anchor="middle">${h}</text>
</svg>`;
}
function angleTriSVG(al, be) {
  return `<svg viewBox="0 0 220 150" width="220" height="150" role="img" aria-label="triunghi cu unghiuri">
  <polygon points="20,128 200,128 78,28" fill="none" stroke="currentColor" stroke-width="2.5"/>
  <text x="42" y="121" font-size="13" fill="currentColor">${al}°</text>
  <text x="182" y="121" font-size="13" fill="currentColor" text-anchor="end">${be}°</text>
  <text x="80" y="47" font-size="15" fill="currentColor" text-anchor="middle">?</text>
</svg>`;
}
function circleSVG(r) {
  return `<svg viewBox="0 0 170 170" width="170" height="170" role="img" aria-label="cerc cu rază">
  <circle cx="82" cy="82" r="62" fill="none" stroke="currentColor" stroke-width="2.5"/>
  <line x1="82" y1="82" x2="144" y2="82" stroke="currentColor" stroke-width="2"/>
  <circle cx="82" cy="82" r="2.6" fill="currentColor"/>
  <text x="108" y="76" font-size="13" fill="currentColor">${r}</text>
</svg>`;
}
function boxSVG(L, l, h) {
  return `<svg viewBox="0 0 230 185" width="220" height="176" role="img" aria-label="paralelipiped dreptunghic">
  <line x1="40" y1="150" x2="80" y2="120" stroke="currentColor" stroke-width="1.4" stroke-dasharray="4 3" opacity="0.7"/>
  <line x1="80" y1="120" x2="80" y2="40" stroke="currentColor" stroke-width="1.4" stroke-dasharray="4 3" opacity="0.7"/>
  <line x1="80" y1="120" x2="190" y2="120" stroke="currentColor" stroke-width="1.4" stroke-dasharray="4 3" opacity="0.7"/>
  <rect x="40" y="70" width="110" height="80" fill="none" stroke="currentColor" stroke-width="2.4"/>
  <line x1="40" y1="70" x2="80" y2="40" stroke="currentColor" stroke-width="2.2"/>
  <line x1="150" y1="70" x2="190" y2="40" stroke="currentColor" stroke-width="2.2"/>
  <line x1="150" y1="150" x2="190" y2="120" stroke="currentColor" stroke-width="2.2"/>
  <line x1="80" y1="40" x2="190" y2="40" stroke="currentColor" stroke-width="2.2"/>
  <line x1="190" y1="40" x2="190" y2="120" stroke="currentColor" stroke-width="2.2"/>
  <text x="95" y="170" font-size="13" fill="currentColor" text-anchor="middle">${L}</text>
  <text x="27" y="114" font-size="13" fill="currentColor" text-anchor="middle">${h}</text>
  <text x="170" y="52" font-size="13" fill="currentColor" text-anchor="middle">${l}</text>
</svg>`;
}

// V — repere: coordonatele unui punct
export function coordinates() {
  const x = nz(-4, 4);
  const y = nz(-4, 4);
  return {
    prompt: { text: 'Citește coordonatele punctului $P$ din reper:', svg: gridSVG([{ x, y, label: 'P' }]) },
    blanks: [
      { answer: x, kind: 'int', label: 'abscisa (x)' },
      { answer: y, kind: 'int', label: 'ordonata (y)' },
    ],
    solutionLatex: `P(${x}\\,;\\,${y})`,
  };
}

// V — perimetrul și aria dreptunghiului
export function rectanglePerimeterArea() {
  const L = ri(3, 12);
  const l = ri(2, 9);
  if (pick(['aria', 'perim']) === 'aria') {
    return {
      prompt: { text: `Dreptunghiul are lungimea $${L}$ și lățimea $${l}$. Cât este aria?`, svg: rectSVG(L, l) },
      blanks: [{ answer: L * l, kind: 'int', label: 'aria' }],
      solutionLatex: `A = ${L}\\times ${l} = ${L * l}`,
    };
  }
  return {
    prompt: { text: `Dreptunghiul are lungimea $${L}$ și lățimea $${l}$. Cât este perimetrul?`, svg: rectSVG(L, l) },
    blanks: [{ answer: 2 * (L + l), kind: 'int', label: 'perimetrul' }],
    solutionLatex: `P = 2\\times(${L} + ${l}) = ${2 * (L + l)}`,
  };
}

// VI — aria triunghiului dreptunghic
export function triangleArea() {
  let b = ri(3, 12);
  let h = ri(2, 10);
  if ((b * h) % 2 !== 0) h = h % 2 === 0 ? h : h + 1; // arie întreagă
  return {
    prompt: { text: `Triunghi dreptunghic cu baza $${b}$ și înălțimea $${h}$. Cât este aria?`, svg: triAreaSVG(b, h) },
    blanks: [{ answer: (b * h) / 2, kind: 'dec', label: 'aria' }],
    solutionLatex: `A = \\dfrac{${b}\\times ${h}}{2} = ${(b * h) / 2}`,
  };
}

// VI — suma unghiurilor unui triunghi
export function angleSum() {
  const a = ri(30, 80);
  const b = ri(30, 150 - a);
  const g = 180 - a - b;
  return {
    prompt: { text: 'Suma unghiurilor unui triunghi este $180^\\circ$. Cât este al treilea unghi?', svg: angleTriSVG(a, b) },
    blanks: [{ answer: g, kind: 'int', label: 'al treilea unghi' }],
    solutionLatex: `180^\\circ - ${a}^\\circ - ${b}^\\circ = ${g}^\\circ`,
  };
}

// VII — translația unui punct
export function pointTranslation() {
  const ax = nz(-4, 3);
  const ay = nz(-4, 3);
  const vx = nz(-3, 3);
  const vy = nz(-3, 3);
  return {
    prompt: {
      text: `Punctul $A(${ax}\\,;\\,${ay})$ este translatat cu vectorul $\\vec{u}(${vx}\\,;\\,${vy})$. Ce coordonate are imaginea $A'$?`,
      svg: gridSVG([{ x: ax, y: ay, label: 'A' }]),
    },
    blanks: [
      { answer: ax + vx, kind: 'int', label: "abscisa lui A'" },
      { answer: ay + vy, kind: 'int', label: "ordonata lui A'" },
    ],
    solutionLatex: `A'(${ax} ${signed(vx)}\\,;\\, ${ay} ${signed(vy)}) = A'(${ax + vx}\\,;\\,${ay + vy})`,
  };
}

// VII — cercul: arie și lungime scrise cu π (coeficientul lui π)
export function diskPi() {
  const r = ri(2, 9);
  if (pick(['aria', 'lung']) === 'aria') {
    return {
      prompt: { text: `Discul are raza $r = ${r}$. Aria se scrie sub forma $\\square \\times \\pi$. Cât este $\\square$?`, svg: circleSVG(r) },
      blanks: [{ answer: r * r, kind: 'int', label: 'coeficientul lui π' }],
      solutionLatex: `A = \\pi r^2 = ${r * r}\\pi`,
    };
  }
  return {
    prompt: { text: `Cercul are raza $r = ${r}$. Lungimea se scrie sub forma $\\square \\times \\pi$. Cât este $\\square$?`, svg: circleSVG(r) },
    blanks: [{ answer: 2 * r, kind: 'int', label: 'coeficientul lui π' }],
    solutionLatex: `L = 2\\pi r = ${2 * r}\\pi`,
  };
}

// VIII — volumul paralelipipedului dreptunghic (spațiu)
export function boxVolume() {
  const L = ri(2, 9);
  const l = ri(2, 8);
  const h = ri(2, 8);
  return {
    prompt: { text: `Paralelipipedul dreptunghic are dimensiunile $${L}$, $${l}$ și $${h}$. Cât este volumul?`, svg: boxSVG(L, l, h) },
    blanks: [{ answer: L * l * h, kind: 'int', label: 'volumul' }],
    solutionLatex: `V = ${L}\\times ${l}\\times ${h} = ${L * l * h}`,
  };
}

/* ============================================================
   Registru: ce automatisme are fiecare clasă (A1, A2, …)
   ============================================================ */
export const REGISTRY = {
  // fiecare intrare = o lecție "A{n}"
  multTable: { title: 'Tabla înmulțirii', fn: multTable },
  orderOfOps: { title: 'Ordinea operațiilor', fn: orderOfOps },
  missingNumber: { title: 'Numărul lipsă', fn: missingNumber },
  powersOfTen: { title: 'Înmulțiri și împărțiri cu 10, 100, 1000', fn: powersOfTen },
  decimalAddSub: { title: 'Adunarea și scăderea zecimalelor', fn: decimalAddSub },

  intAddSub: { title: 'Numere întregi — adunare și scădere', fn: intAddSub },
  intMult: { title: 'Numere întregi — înmulțire', fn: intMult },
  fracAdd: { title: 'Fracții — adunare și scădere', fn: fracAdd },
  fracMult: { title: 'Fracții — înmulțire', fn: fracMult },
  fourthProportional: { title: 'A patra proporțională', fn: fourthProportional },
  percentage: { title: 'Procente dintr-o cantitate', fn: percentage },

  distributeSimple: { title: 'Distributivitate — dezvoltare', fn: distributeSimple },
  reduceLikeTerms: { title: 'Reducerea termenilor asemenea', fn: reduceLikeTerms },
  evalExpression: { title: 'Evaluarea unei expresii', fn: evalExpression },
  linearEqSimple: { title: 'Ecuații de gradul I (simple)', fn: linearEqSimple },
  pythagoras: { title: 'Teorema lui Pitagora', fn: pythagoras },
  speed: { title: 'Viteză (mărimi cot)', fn: speed },

  functionEval: { title: 'Funcții — calculul unei imagini', fn: functionEval },
  doubleDistribute: { title: 'Dublă distributivitate', fn: doubleDistribute },
  diffOfSquaresFactor: { title: 'Formula a² − b² (factorizare)', fn: diffOfSquaresFactor },
  linearEqDouble: { title: 'Ecuații de gradul I', fn: linearEqDouble },

  // Geometrie (plan & spațiu)
  coordinates: { title: 'Repere — coordonatele unui punct', fn: coordinates },
  rectanglePerimeterArea: { title: 'Perimetrul și aria dreptunghiului', fn: rectanglePerimeterArea },
  triangleArea: { title: 'Aria triunghiului', fn: triangleArea },
  angleSum: { title: 'Suma unghiurilor unui triunghi', fn: angleSum },
  pointTranslation: { title: 'Translația unui punct', fn: pointTranslation },
  diskPi: { title: 'Cercul: arie și lungime (cu π)', fn: diskPi },
  boxVolume: { title: 'Volumul paralelipipedului', fn: boxVolume },
};

// Progresia pe clase (ordinea A1, A2, …)
export const LEVELS = {
  c5: ['multTable', 'orderOfOps', 'missingNumber', 'powersOfTen', 'decimalAddSub', 'coordinates', 'rectanglePerimeterArea'],
  c6: ['intAddSub', 'intMult', 'fracAdd', 'fracMult', 'fourthProportional', 'percentage', 'triangleArea', 'angleSum'],
  c7: ['distributeSimple', 'reduceLikeTerms', 'evalExpression', 'linearEqSimple', 'pythagoras', 'speed', 'pointTranslation', 'diskPi'],
  c8: ['functionEval', 'doubleDistribute', 'diffOfSquaresFactor', 'linearEqDouble', 'boxVolume'],
};
