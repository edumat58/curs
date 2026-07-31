/**
 * SMOKE TEST EXHAUSTIV — fiecare lecție reală trecută prin fiecare etapă,
 * plus scenariile-limită care au produs defecte în trecut.
 *
 *   node --env-file=.env src/smoke2.mjs
 */
import fs from 'node:fs';
import { MongoClient } from 'mongodb';
import { toSpeakable, calculeazaFormule, litereMarcate, repuneLitere } from './pipeline/speakable.mjs';
import { cleanForSpeech, titluriAcoperite } from './pipeline/explain.mjs';
import { curataSursa, imparteLectia, bugetSursaCaractere, speechBudget, buildNarrationPrompt } from './pipeline/prompts.mjs';

const env = process.env;
let ok = 0; const rele = [];
const T = (nume, cond, det) => { if (cond) ok += 1; else rele.push(`${nume}${det ? ' — ' + det : ''}`); };

// ─────────── 1. CORPUS: fiecare lecție prin fiecare etapă ───────────
const lectii = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(p);
    else if (/\.(md|mdx)$/.test(e.name)) {
      const src = fs.readFileSync(p, 'utf8');
      const h1 = (/^#\s+(.+)$/m.exec(src) || [])[1] || '';
      if (/^\s*[CG]\s*\d/.test(h1)) lectii.push({ p: p.split('/docs/')[1] || p, src, h1: h1.trim() });
    }
  }
};
walk(env.VOICE_DOCS_DIR || 'D:/edupasi/docs');
console.log(`═══ CORPUS: ${lectii.length} lecții, fiecare prin tot pipeline-ul ═══`);

const probleme = { svg: [], latex: [], segmentat: [], promptGol: [], titluriLipsa: [], bucatiMari: [], frontmatter: [] };
const bugetSursa = bugetSursaCaractere(1100 * 3.5 + 350);

for (const l of lectii) {
  const curata = curataSursa(l.src);

  // a) figurile și metadatele au dispărut din material
  if (/<svg[\s>]/i.test(curata)) probleme.svg.push(l.p);
  if (/^---[\s\S]*?---/.test(curata) || /^\s*import\s/m.test(curata)) probleme.frontmatter.push(l.p);

  // b) worst-case: modelul copiază sursa verbatim → nimic nerostibil nu scapă
  const rostit = toSpeakable(curata);
  const rest = rostit.match(/\\[a-zA-Z]{2,}/g);
  if (rest) probleme.latex.push(`${l.p}: ${[...new Set(rest)].slice(0, 3).join(' ')}`);

  // c) segmentarea: o lecție într-o singură cerere
  const seg = imparteLectia(curata, bugetSursa);
  if (seg.length > 1) probleme.segmentat.push(`${l.p} (${seg.length})`);

  // d) promptul chiar are lista de titluri a lecției
  const section = { mode: 'lectie', heading: l.h1, lessonTitle: l.h1, contentText: 'x', sourceCode: curata, latex: [], visuals: [] };
  const p = buildNarrationPrompt(section, {});
  const titluriSursa = [...curata.matchAll(/^#{2,3}\s+(.+?)\s*$/gm)].length;
  if (titluriSursa && !/LISTA DE TITLURI \(/.test(p.user)) probleme.promptGol.push(l.p);
  if (!p.user || p.user.length < 200) probleme.titluriLipsa.push(l.p);

  // e) bucățile de sinteză nu depășesc limita modelului TTS
  const bucatiSinteza = Math.ceil(cleanForSpeech(curata).length / 1400);
  if (bucatiSinteza > 40) probleme.bucatiMari.push(`${l.p} (${bucatiSinteza})`);
}

T('corpus: niciun SVG rămas în material', !probleme.svg.length, probleme.svg.slice(0, 3).join(', '));
T('corpus: fără frontmatter/importuri în material', !probleme.frontmatter.length, probleme.frontmatter.slice(0, 3).join(', '));
T('corpus: niciun LaTeX rostibil rămas', !probleme.latex.length, probleme.latex.slice(0, 3).join(' | '));
T('corpus: nicio lecție segmentată', !probleme.segmentat.length, probleme.segmentat.slice(0, 3).join(', '));
T('corpus: promptul primește lista de titluri', !probleme.promptGol.length, probleme.promptGol.slice(0, 3).join(', '));
T('corpus: promptul e complet la fiecare lecție', !probleme.titluriLipsa.length, probleme.titluriLipsa.slice(0, 3).join(', '));
T('corpus: nicio lecție cu peste 40 de bucăți de sinteză', !probleme.bucatiMari.length, probleme.bucatiMari.slice(0, 3).join(', '));

// ─────────── 2. SCENARII-LIMITĂ (fiecare = un defect real din trecut) ───────────
console.log('═══ SCENARII-LIMITĂ ═══');
const CAZURI = [
  ['relații de mulțimi', '$S = S_1 \\cap S_2 = \\emptyset$', /intersectat cu/, /\\\\/],
  ['± (soluție pierdută)', '$x = \\pm 3$', /plus sau minus/, null],
  ['trigonometrie', '$f(x) = \\sin x$', /sinus de/, /\\sin/],
  ['discriminant', '$\\Delta > 0$', /delta/, /\\Delta/],
  ['unghi LaTeX', '$\\measuredangle DAB$', /unghiul D A B/, /DAB[^ ]/],
  ['marcaj lung greșit', '<measuredangle M O N>', /unghiul M O N/, /measuredangle/],
  ['grup majuscule marcat', '<MON>', /M O N/, /<MON>/],
  ['literă marcată (mijloc)', 'Fie <a> un număr', /, a,/, null],
  ['literă marcată (final)', 'Fie <a>', /, a\./, null],
  ['aligned + separatori', '\\begin{aligned} a=b \\\\ c=d \\end{aligned}', /egal cu/, /aligned|&/],
  ['radical cu ordin', '$\\sqrt[3]{54}$', /radical de ordinul 3/, /\[3\]/],
  ['mulțimea N', '$x \\in \\mathbb{N}$', /mulțimea numerelor naturale/, /mathbb/],
  ['procent', '$50\\%$', /la sută/, /\\%/],
  ['culoare-comutator', '{\\color{orangered} AB=3}', /A B/, /orangered/],
  ['numeral roman', 'clasa a VI-a', /VI/, /V I/],
  ['fracție', '$\\dfrac{3}{4}$', /3 supra 4|3\/4/, /dfrac/],
  ['text gol', '', /^$/, null],
  ['doar punctuație', '...', null, /\\/],
  ['titlu numerotat', '2. Descompunerea numerelor.', /2\./, null],
  ['numere mari', 'Avem 1 000 000 de lei.', /1000000|1 000 000/, null],
  ['zecimale', 'Valoarea este 37540,85.', /37540,85/, null],
];
for (const [nume, intrare, trebuie, interzis] of CAZURI) {
  let out;
  try { out = toSpeakable(intrare); } catch (e) { T(`limită: ${nume}`, false, 'EXCEPȚIE ' + e.message); continue; }
  const bine = (!trebuie || trebuie.test(out)) && (!interzis || !interzis.test(out));
  T(`limită: ${nume}`, bine, JSON.stringify(String(out).slice(0, 60)));
}

// ─────────── 3. REPREZENTAREA DUBLĂ (stocare vs rostire) ───────────
console.log('═══ REPREZENTARE DUBLĂ ═══');
const brut = 'Unghiul $m(\\measuredangle MON) = 70^\\circ$, punctele <a> și <b>.';
const stocat = cleanForSpeech(brut, { litere: false, formule: false });
T('stocarea păstrează formulele', /\$/.test(stocat), stocat);
T('stocarea păstrează marcajele de literă', /<a>/.test(stocat) && /<b>/.test(stocat));
T('sinteza convertește tot', !/\$|<[a-z]>/.test(cleanForSpeech(stocat)));

// ─────────── 4. BAZA: fiecare lecție cu audio, verificată ───────────
console.log('═══ LECȚII CU AUDIO ═══');
const client = await new MongoClient(env.MONGODB_URI || env.MONGODB_URI_EDUCONNECT).connect();
const col = client.db(env.VOICE_DB_NAME || 'edupasi').collection('voice_explanations');
const docs = await col.find({ 'audio.words': { $exists: true, $ne: null } }).toArray();
const cheie = (x) => String(x).toLowerCase().replace(/[^\p{L}\d]/gu, '');

for (const d of docs) {
  const nume = (d.heading || '').slice(0, 30);
  const t = d.explanationText || '';
  const w = d.audio.words || [];

  // formule mapate corect
  const F = calculeazaFormule(t, w, (x) => cleanForSpeech(x));
  let gresite = 0;
  for (const f of F) {
    const a = cleanForSpeech(`$${f.tex}$`).split(/\s+/).filter((x) => /[\p{L}\d]/u.test(x)).map(cheie).join('|');
    const b = w.slice(f.s, f.e + 1).map((x) => cheie(x.w)).join('|');
    if (a !== b) gresite += 1;
  }
  T(`formule exacte: ${nume}`, gresite === 0, `${gresite} greșite`);

  // text curat
  T(`text fără LaTeX: ${nume}`, !(t.replace(/\$[^$\n]+\$/g, ' ').match(/\\[a-zA-Z]{2,}/g)));
  T(`text fără marcaje lungi: ${nume}`, !/<[A-Za-z][A-Za-z0-9\s]{4,}>/.test(t));
  T(`text fără nume fonetice: ${nume}`, !/\b(be|capa|igrec|ics|zet)\b/i.test(t));
  T(`text fără caractere de control: ${nume}`, !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(t));

  // timpii: monotoni, acoperă audio-ul, ritm plauzibil pe sferturi
  let mono = true;
  for (let i = 1; i < w.length; i += 1) if (w[i].t < w[i - 1].t) mono = false;
  T(`timpi monotoni: ${nume}`, mono);
  const ultim = w[w.length - 1];
  const acoperire = ultim ? (ultim.t + ultim.d) / 1000 / (d.audio.durationSec || 1) : 0;
  T(`timpii acoperă audio-ul: ${nume}`, acoperire > 0.9, `${(acoperire * 100).toFixed(0)}%`);

  // Ritmul se măsoară în EFORT DE ROSTIRE, nu în cuvinte: "97" e un token, dar
  // se rostește "nouăzeci și șapte". O cifră costă ~5 litere de vorbire.
  const cost = (x) => (String(x).match(/\p{L}/gu) || []).length + (String(x).match(/\d/g) || []).length * 5;
  const ritmuri = [];
  for (let q = 0; q < 4; q += 1) {
    const a = Math.floor(w.length * q / 4); const b = Math.floor(w.length * (q + 1) / 4) - 1;
    if (b <= a) continue;
    const dt = ((w[b].t + w[b].d) - w[a].t) / 1000;
    let c = 0; for (let i = a; i <= b; i += 1) c += cost(w[i].w);
    if (dt > 0) ritmuri.push(c / dt);
  }
  const min = Math.min(...ritmuri); const max = Math.max(...ritmuri);
  T(`ritm constant (aliniere sănătoasă): ${nume}`, ritmuri.length < 2 || max / min < 1.6, `${ritmuri.map((r) => r.toFixed(1)).join('/')} semne/s`);

  // durata plauzibilă = sinteza n-a improvizat masiv
  const asteptat = (w.length / 150) * 60;
  T(`durată plauzibilă (fără repetiții): ${nume}`, (d.audio.durationSec || 0) < asteptat * 1.5, `${Math.round(d.audio.durationSec)}s vs ~${Math.round(asteptat)}s`);

  // acoperirea titlurilor
  if (d.titluriLectie && d.titluriLectie.length) {
    const norm = (x) => String(x).toLowerCase().replace(/[^\p{L}\d ]/gu, ' ').replace(/\s+/g, ' ').trim();
    const corp = norm(t);
    let cursor = 0; let ordonat = true;
    for (const titlu of d.titluriLectie) { const poz = corp.indexOf(norm(titlu), cursor); if (poz < 0) { ordonat = false; break; } cursor = poz + 1; }
    T(`secțiuni în ordine: ${nume}`, ordonat);
  }
}
await client.close();

console.log(`\n════════════════════════════`);
console.log(`TRECERI: ${ok} | CĂDERI: ${rele.length}`);
if (rele.length) { console.log('\nCE A CĂZUT:'); rele.forEach((r) => console.log('  ✗', r)); }
process.exit(rele.length ? 1 : 0);
