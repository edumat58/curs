/**
 * SMOKE TEST al pipeline-ului de voce — toate căile, toate capcanele întâlnite.
 *
 * Se rulează CU variabilele de producție, altfel dă fals negativ:
 *   node --env-file=.env src/smoke.mjs
 *
 * (Fereastra de tokeni vine din `.env`; fără ea, `bugetSursaCaractere` cade pe
 * valoarea moștenită de la Groq și 81 de lecții par segmentate degeaba.)
 *
 * Fiecare verificare corespunde unui defect VĂZUT pe viu: LaTeX rostit literal,
 * „measuredangle" ajuns în audio, formule mapate greșit care rupeau
 * sincronizarea, nume fonetice („be") afișate în transcript, SVG-uri tăiate în
 * două de segmentare.
 */
import fs from 'node:fs';
import { MongoClient } from 'mongodb';
import { toSpeakable, calculeazaFormule, litereMarcate, repuneLitere } from './src/pipeline/speakable.mjs';
import { cleanForSpeech } from './src/pipeline/explain.mjs';
import { curataSursa, imparteLectia, bugetSursaCaractere, speechBudget } from './src/pipeline/prompts.mjs';

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8').split(/\r?\n/).filter((l) => l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

let treceri = 0; let caderi = 0;
const fail = [];
const T = (nume, cond, detaliu) => {
  if (cond) { treceri += 1; } else { caderi += 1; fail.push(`${nume}${detaliu ? ' — ' + detaliu : ''}`); }
};

console.log('═══ A. ROSTIRE: cazuri de risc ═══');
const CAZURI = [
  ['LaTeX relații', '$S = S_1 \\cap S_2 = \\emptyset$', /intersectat cu/, /\\\\/],
  ['plus-minus (fals matematic)', '$x = \\pm 3$', /plus sau minus/, null],
  ['trigonometrie', '$f(x) = \\sin x$', /sinus de/, /\\sin/],
  ['literă grecească', 'Dacă $\\Delta > 0$', /delta/, /\\Delta/],
  ['unghi LaTeX', '$\\measuredangle DAB$', /unghiul D A B/, /DAB/],
  ['marcaj lung greșit', 'Unghiurile <measuredangle M O N>', /unghiul M O N/, /measuredangle/],
  ['grup majuscule marcat', 'Fie <MON> un unghi', /M O N/, /<MON>/],
  ['literă marcată', 'Fie <a> și <b>', /, a,/, null],
  ['mediu aligned', '\\begin{aligned} a = b \\\\ c = d \\end{aligned}', /egal cu/, /aligned|&/],
  ['radical cu ordin', '$\\sqrt[3]{54}$', /radical de ordinul 3/, /\[3\]/],
  ['mulțime N', '$x \\in \\mathbb{N}$', /mulțimea numerelor naturale/, /mathbb/],
  ['procent', '$50\\%$', /la sută/, /\\%/],
  ['culoare comutator', '{\\color{orangered} AB = 3}', /A B/, /orangered/],
  ['numeral roman păstrat', 'clasa a VI-a', /VI/, /V I/],
];
for (const [nume, intrare, trebuie, interzis] of CAZURI) {
  const out = toSpeakable(intrare);
  T(`rostire: ${nume}`, trebuie.test(out) && (!interzis || !interzis.test(out)), JSON.stringify(out.slice(0, 70)));
}

console.log('═══ B. STOCARE: marcaje și formule păstrate ═══');
const brut = 'Unghiul $m(\\measuredangle MON) = 70^\\circ$ și punctele <a>, <b>.';
const stocat = cleanForSpeech(brut, { litere: false, formule: false });
const rostit = cleanForSpeech(stocat);
T('stocare păstrează $...$', /\$/.test(stocat), stocat);
T('stocare păstrează <x>', /<a>/.test(stocat) && /<b>/.test(stocat));
T('sinteza convertește tot', !/\$/.test(rostit) && !/<[a-z]>/.test(rostit) && /unghiul M O N/.test(rostit), rostit);

console.log('═══ C. LITERE: refacere în transcript ═══');
const per = litereMarcate('Fie <a> și <b> și <k>.');
const wordsL = cleanForSpeech('Fie <a> și <b> și <k>.').split(/\s+/).filter(Boolean).map((w, i) => ({ t: i * 300, d: 250, w }));
const refacut = repuneLitere(wordsL, per).map((w) => w.w).join(' ');
T('nume fonetice refăcute în litere', !/\b(be|capa)\b/i.test(refacut), refacut);

console.log('═══ C2. VERSIUNEA PROMPTULUI: aceeași de ambele părți ═══');
/**
 * Site-ul și serviciul își țin fiecare copia lui de `PROMPT_VERSION`, fiindcă
 * unul rulează în browser și celălalt în Node. Dacă se despart, elevul cere un
 * hash pe care serviciul nu l-a scris niciodată: lecția pare pur și simplu
 * fără voce, fără nicio eroare nicăieri. Verificarea rulează din repo, unde
 * ambele fișiere există.
 */
try {
  const { PROMPT_VERSION: alService } = await import('./src/pipeline/prompts.mjs');
  const alSite = /PROMPT_VERSION\s*=\s*(\d+)/.exec(fs.readFileSync('../src/lib/voice/cod.mjs', 'utf8'));
  T('versiunea promptului e aceeași în site și în serviciu',
    alSite && Number(alSite[1]) === alService, `site: ${alSite && alSite[1]} | serviciu: ${alService}`);
} catch (e) {
  console.log('   (site indisponibil de aici — sărit)');
}

console.log('═══ D. FORMULE: mapare pe TOATE lecțiile cu audio ═══');
const client = await new MongoClient(env.MONGODB_URI || env.MONGODB_URI_EDUCONNECT).connect();
const col = client.db(env.VOICE_DB_NAME || 'edupasi').collection('voice_explanations');
const docs = await col.find({ 'audio.words': { $exists: true, $ne: null } }).toArray();
const cheie = (x) => String(x).toLowerCase().replace(/[^\p{L}\d]/gu, '');
for (const d of docs) {
  const t = d.explanationText || '';
  const w = d.audio.words || [];
  const nf = (t.match(/\$[^$\n]+\$/g) || []).length;
  const F = calculeazaFormule(t, w, (x) => cleanForSpeech(x));
  let gresite = 0;
  for (const f of F) {
    const asteptat = cleanForSpeech(`$${f.tex}$`).split(/\s+/).filter((x) => /[\p{L}\d]/u.test(x)).map(cheie).join('|');
    const real = w.slice(f.s, f.e + 1).map((x) => cheie(x.w)).join('|');
    if (asteptat !== real) gresite += 1;
  }
  const nume = (d.heading || '').slice(0, 32);
  T(`formule corecte: ${nume}`, gresite === 0, `${gresite} greșite din ${F.length} (text: ${nf})`);
  // texte fara resturi
  T(`fără LaTeX în afara $: ${nume}`, !(t.replace(/\$[^$\n]+\$/g, ' ').match(/\\[a-zA-Z]{2,}/g)));
  T(`fără marcaje lungi: ${nume}`, !/<[A-Za-z][A-Za-z0-9\s]{4,}>/.test(t));
  T(`fără caractere de control: ${nume}`, !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(t));
  T(`fără nume fonetice: ${nume}`, !/\b(be|capa|igrec|ics|zet)\b/i.test(t));
}

console.log('═══ E. CORPUS: toate cele 158 de surse prin pipeline ═══');
const lectii = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(p);
    else if (/\.(md|mdx)$/.test(e.name)) {
      const src = fs.readFileSync(p, 'utf8');
      if (/^#\s+\s*[CG]\s*\d/m.test(src)) lectii.push({ p, src });
    }
  }
};
try { walk(process.env.VOICE_DOCS_DIR || 'D:/edupasi/docs'); } catch { /* sursele pot lipsi */ }
if (lectii.length) {
  let cuLatex = 0; let cuSvg = 0; let segmenteMulte = 0;
  const buget = bugetSursaCaractere(1100 * 3.5 + 350);
  for (const l of lectii) {
    const curata = curataSursa(l.src);
    if (/<svg[\s>]/i.test(curata)) cuSvg += 1;
    if (toSpeakable(curata).match(/\\[a-zA-Z]{2,}/g)) cuLatex += 1;
    if (imparteLectia(curata, buget).length > 1) segmenteMulte += 1;
  }
  T('corpus: niciun SVG rămas', cuSvg === 0, `${cuSvg} lecții`);
  T('corpus: niciun LaTeX rostit', cuLatex === 0, `${cuLatex} lecții`);
  T('corpus: nicio lecție segmentată', segmenteMulte === 0, `${segmenteMulte} lecții`);
  console.log(`   (${lectii.length} lecții verificate)`);
} else {
  console.log('   surse indisponibile pe PC — sărit');
}

await client.close();
console.log('\n════════════════════════════');
console.log(`TRECERI: ${treceri} | CĂDERI: ${caderi}`);
if (fail.length) { console.log('\nCE A CĂZUT:'); fail.forEach((f) => console.log('  ✗', f)); }
process.exit(caderi ? 1 : 0);
