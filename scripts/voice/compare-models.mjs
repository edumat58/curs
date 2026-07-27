/**
 * Compară modele pe aceeași secțiune reală: calitate, lungime, fidelitate, viteză.
 *   node --env-file=voice-service/.env scripts/voice/compare-models.mjs --i=1
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLlm } from '../../voice-service/src/providers/llm.mjs';
import { explainSection } from '../../voice-service/src/pipeline/explain.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v = true] = a.replace(/^--/, '').split('=');
    return [k, v];
  })
);

const MODELS = String(
  args.models || 'openai/gpt-oss-120b,llama-3.3-70b-versatile,qwen/qwen3.6-27b'
).split(',');

const sections = JSON.parse(fs.readFileSync(path.join(ROOT, '.voice-sections.json'), 'utf8'));
const s = sections[Number(args.i || 1)];

const section = {
  heading: s.heading,
  lessonTitle: s.lessonTitle,
  contentText: s.raw.contentText,
  latex: s.raw.latex,
  visuals: s.raw.visuals,
  context: s.raw.context,
};

console.log(`\n### SECȚIUNEA "${s.heading}" — ${s.raw.contentText.length} car., ${s.raw.latex.length} formule, ${s.raw.visuals.length} figuri\n`);

for (const model of MODELS) {
  process.env.VOICE_LLM_PROVIDER = 'groq';
  process.env.VOICE_LLM_MODEL = model;
  const llm = createLlm(process.env);
  try {
    const r = await explainSection(section, llm);
    console.log(`\n──────── ${model} ────────`);
    console.log(`timp: ${(r.meta.totalMs / 1000).toFixed(1)}s (analiză ${(r.meta.analysisMs / 1000).toFixed(1)}s) | ${r.meta.words} cuvinte (buget ${r.meta.budgetWords})`);
    console.log(`fidelitate: ${r.fidelity.score}${r.fidelity.needsReview ? '  ⚠ NECESITĂ REVIZUIRE' : '  ✓'}`);
    r.fidelity.notes.forEach((n) => console.log(`   ! ${n}`));
    console.log(`\n${r.transcript}\n`);
  } catch (err) {
    console.log(`\n──────── ${model} ────────`);
    console.log(`EROARE: ${err.message.slice(0, 200)}`);
  }
}
