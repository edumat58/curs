/**
 * Test cap-coadă: secțiune reală → explicație (Groq) → voce (Piper) → .opus
 *   node --env-file=voice-service/.env scripts/voice/try-full.mjs --i=8
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createLlm } from '../../voice-service/src/providers/llm.mjs';
import { createPiperTts } from '../../voice-service/src/providers/tts.mjs';
import { explainSection } from '../../voice-service/src/pipeline/explain.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
process.chdir(ROOT);
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v = true] = a.replace(/^--/, '').split('=');
    return [k, v];
  })
);

const sections = JSON.parse(fs.readFileSync('.voice-sections.json', 'utf8'));
const s = sections[Number(args.i || 8)];
const section = {
  heading: s.heading,
  lessonTitle: s.lessonTitle,
  contentText: s.raw.contentText,
  latex: s.raw.latex,
  visuals: s.raw.visuals,
  context: s.raw.context,
};

process.env.VOICE_LLM_PROVIDER = process.env.VOICE_LLM_PROVIDER || 'groq';
process.env.VOICE_LLM_MODEL = process.env.VOICE_LLM_MODEL || 'openai/gpt-oss-120b';

console.log(`\n=== "${s.heading}" (${s.route}) ===`);
console.log(`sursă: ${section.contentText.length} car., ${section.latex.length} formule, ${section.visuals.length} figuri\n`);

const llm = createLlm(process.env);
const t0 = Date.now();
const result = await explainSection(section, llm);
const tExplain = Date.now() - t0;

console.log(`--- EXPLICAȚIE (${(tExplain / 1000).toFixed(1)}s, ${result.meta.words}/${result.meta.budgetWords} cuvinte) ---`);
console.log(`fidelitate: ${result.fidelity.score} ${result.fidelity.needsReview ? '⚠ REVIZUIRE' : '✓'}`);
result.fidelity.notes.forEach((n) => console.log(`  ! ${n}`));
console.log(`\n${result.transcript}\n`);

const tts = createPiperTts(process.env);
const t1 = Date.now();
const audio = await tts.synthesize(result.transcript, {
  onProgress: ({ index, total }) => process.stdout.write(`\r  sinteză: ${index + 1}/${total} propoziții`),
});
const tTts = Date.now() - t1;
process.stdout.write('\n');

const wavPath = '_voice-full-test.wav';
fs.writeFileSync(wavPath, audio.wav);

let opusInfo = '';
try {
  execFileSync('opusenc', ['--bitrate', '28', '--quiet', wavPath, '_voice-full-test.opus']);
  const bytes = fs.statSync('_voice-full-test.opus').size;
  opusInfo = ` | opus: ${(bytes / 1024).toFixed(0)} KB`;
} catch (err) {
  opusInfo = ` | opusenc indisponibil (${err.message.slice(0, 40)})`;
}

console.log(`--- VOCE (${(tTts / 1000).toFixed(1)}s) ---`);
console.log(`voce: ${audio.voice} | durată: ${audio.durationSec.toFixed(1)}s | wav: ${(audio.wav.length / 1024).toFixed(0)} KB${opusInfo}`);
console.log(`raport sinteză: ${(audio.durationSec / (tTts / 1000)).toFixed(1)}× timp real`);
console.log(`\nTOTAL cap-coadă: ${((Date.now() - t0) / 1000).toFixed(1)}s pentru ${audio.durationSec.toFixed(0)}s de audio`);
console.log(`fișier: ${wavPath}`);
