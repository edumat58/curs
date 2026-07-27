/**
 * Verificare de regresie pentru calitatea explicațiilor.
 *
 * Rulează pipeline-ul REAL (același cod ca serviciul) pe secțiuni reale și
 * măsoară exact lucrurile reclamate de utilizator: explicație tăiată, exemple
 * sărite, articolul hotărât pierdut. Nu sintetizează audio — costă timp și nu
 * schimbă textul, iar aici textul e problema.
 *
 *   node --env-file=voice-service/.env scripts/voice/check-explanations.mjs [--n=3] [--i=5]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { explainSection } from '../../voice-service/src/pipeline/explain.mjs';
import { speechBudget } from '../../voice-service/src/pipeline/prompts.mjs';
import { createLlm } from '../../voice-service/src/providers/llm.mjs';
import { latexToRomanian } from '../../src/components/EduPasiAccessibility/speech.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v = true] = a.replace(/^--/, '').split('=');
    return [k, v];
  })
);

// extract-sections.mjs scrie forma canonică în `payload` (pentru hash) și
// secțiunea completă în `raw`; capul de secțiune stă la primul nivel.
const sections = JSON.parse(fs.readFileSync(path.join(ROOT, '.voice-sections.json'), 'utf8'))
  .map((s, i) => ({
    i,
    heading: s.heading,
    level: s.level,
    lessonTitle: s.lessonTitle,
    ...(s.raw || {}),
  }));

/** Cele mai relevante pentru regresie: secțiunile care CHIAR au exemple numerice. */
function numbersIn(text) {
  return [...new Set(String(text || '').match(/\d+(?:[.,]\d+)?/g) || [])];
}

const withNums = sections.map((s) => ({ ...s, nums: numbersIn(s.contentText) }));
const chosen = args.i !== undefined
  ? [withNums[Number(args.i)]]
  : withNums
      .filter((s) => (s.contentText || '').length > 150 && s.nums.length >= 3)
      .slice(0, Number(args.n || 3));

const llm = createLlm(process.env);
const analysisLlm = createLlm({
  ...process.env,
  VOICE_LLM_MODEL: process.env.VOICE_LLM_MODEL_ANALYSIS || 'llama-3.3-70b-versatile',
});

/** Substantive frecvent lăsate nearticulate la subiect — verificăm că nu au scăpat. */
const ARTICOL_LIPSA =
  /(?:^|\n|[.!?:;]\s)(Virgulă|Numitor|Numărător|Fracție|Rezultat|Termen|Numărul?|Cerc|Unghi|Produs|Cât|Rest|Sumă|Diferență)\s+(?:este|e|are|se|arată|indică|separă|reprezintă|spune|înseamnă)\b/g;

console.log(`Rulez pe ${chosen.length} secțiuni (model narațiune: ${llm.model})\n`);

for (const s of chosen) {
  const section = {
    ...s,
    latex: (s.latex || []).map((item) => ({
      ...item,
      spoken: (() => { try { return latexToRomanian(item.source); } catch { return ''; } })(),
    })),
  };
  const budget = speechBudget(section);
  const t0 = Date.now();
  let out;
  try {
    out = await explainSection(section, llm, { analysisLlm });
  } catch (err) {
    console.log(`[${s.i}] ${s.heading}\n  EȘEC: ${err.message}\n`);
    continue;
  }
  const { transcript, meta, fidelity, analysis } = out;

  const spoken = transcript.replace(/(\d+)\s+virgulă\s+(\d+)/gi, '$1,$2');
  const sourceNums = s.nums;
  const missing = sourceNums.filter((n) => !spoken.includes(n));
  const articleErrors = [...transcript.matchAll(ARTICOL_LIPSA)].map((m) => m[0].trim());
  const endsWell = /[.!?…]$/.test(transcript.trim());

  console.log(`[${s.i}] ${s.heading}`);
  console.log(`  sursă: ${(s.contentText || '').length} car., ${(s.latex || []).length} formule, ${(s.visuals || []).length} figuri`);
  console.log(`  buget ${budget.words} cuv. → rostit ${meta.words} cuv. (${Math.round((meta.words / budget.words) * 100)}%), ${Math.round((Date.now() - t0) / 1000)}s`);
  console.log(`  exemple inventariate de analiză: ${(analysis.examples || []).length}`);
  console.log(`  numere din sursă: ${sourceNums.length} → NEMENȚIONATE: ${missing.length ? missing.join(', ') : 'niciunul'}`);
  console.log(`  trunchiat: ${meta.truncated ? 'DA' : 'nu'} | se termină cu punctuație: ${endsWell ? 'da' : 'NU'}`);
  console.log(`  articol lipsă: ${articleErrors.length ? articleErrors.join(' | ') : 'niciun caz'}`);
  console.log(`  fidelitate ${fidelity.score}${fidelity.notes.length ? ' — ' + fidelity.notes.join(' ') : ''}`);
  console.log(`  ---\n  ${transcript.replace(/\n/g, '\n  ')}\n`);
}
