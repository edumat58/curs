/**
 * Rulează pipeline-ul de explicație pe o secțiune reală și arată rezultatul.
 * Serveşte la validarea prompturilor înainte de a lega tot sistemul.
 *
 *   node scripts/voice/try-explain.mjs --i=3 [--model=qwen3:30b-instruct]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAnalysisPrompt, buildNarrationPrompt } from '../../voice-service/src/pipeline/prompts.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v = true] = a.replace(/^--/, '').split('=');
    return [k, v];
  })
);
const MODEL = String(args.model || 'qwen3:30b-instruct');
const INDEX = Number(args.i || 0);

async function ollama(messages, { json = false } = {}) {
  const res = await fetch('http://127.0.0.1:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: false,
      format: json ? 'json' : undefined,
      options: { temperature: json ? 0.1 : 0.6, num_ctx: 8192 },
    }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.message.content;
}

const sections = JSON.parse(fs.readFileSync(path.join(ROOT, '.voice-sections.json'), 'utf8'));
const s = sections[INDEX];
if (!s) {
  console.error(`Nu există secțiunea ${INDEX}. Total: ${sections.length}`);
  process.exit(1);
}

const section = {
  heading: s.heading,
  lessonTitle: s.lessonTitle,
  contentText: s.raw.contentText,
  latex: s.raw.latex,
  visuals: s.raw.visuals.map((v) =>
    v.type === 'svg'
      ? { ...v, labels: (s.payload.visuals.find((p) => p.t === 'svg') || {}).labels, shapes: (s.payload.visuals.find((p) => p.t === 'svg') || {}).shapes }
      : v
  ),
  context: s.raw.context,
};

console.log(`\n=== SECȚIUNEA [${INDEX}] "${s.heading}" (${s.route}) ===`);
console.log(`text: ${section.contentText.length} car. | formule: ${section.latex.length} | figuri: ${section.visuals.length}\n`);

const t0 = Date.now();
const a = buildAnalysisPrompt(section);
const analysisRaw = await ollama(
  [{ role: 'system', content: a.system }, { role: 'user', content: a.user }],
  { json: true }
);
const t1 = Date.now();
let analysis;
try {
  analysis = JSON.parse(analysisRaw);
} catch {
  console.log('!! Analiza nu e JSON valid:\n', analysisRaw.slice(0, 500));
  process.exit(1);
}
console.log('--- TRECEREA 1: ÎNȚELEGERE ---');
console.log(`tip: ${analysis.sectionType} | ${((t1 - t0) / 1000).toFixed(1)}s`);
console.log(`ideea: ${analysis.mainIdea}`);
console.log(`scop: ${analysis.purpose}`);
console.log(`evidence: ${(analysis.evidence || []).length} | definiții: ${(analysis.definitions || []).length} | formule: ${(analysis.formulas || []).length} | figuri: ${(analysis.figures || []).length}`);
(analysis.checks || []).forEach((c) => console.log(`  [${c.status}] ${c.item}`));

const n = buildNarrationPrompt(section, analysis);
const transcript = await ollama([
  { role: 'system', content: n.system },
  { role: 'user', content: n.user },
]);
const t2 = Date.now();

console.log(`\n--- TRECEREA 2: NARAȚIUNE (${((t2 - t1) / 1000).toFixed(1)}s) ---\n`);
console.log(transcript.trim());
const words = transcript.trim().split(/\s+/).length;
console.log(`\n[${words} cuvinte ≈ ${Math.round((words / 150) * 60)}s de vorbire | total generare: ${((t2 - t0) / 1000).toFixed(1)}s]`);
