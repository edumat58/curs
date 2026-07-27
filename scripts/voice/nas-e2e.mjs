/**
 * Test end-to-end pe serviciul deja pornit: trimite o secțiune reală exact cum
 * o trimite browserul (hash cu PROMPT_VERSION 2) și verifică ce se întoarce.
 *   node scripts/voice/nas-e2e.mjs [--i=8] [--api=https://voce.asbrihome.synology.me]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalSection, sectionHash } from '../../src/lib/voice/canonical.mjs';
import { latexToRomanian } from '../../src/components/EduPasiAccessibility/speech.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v = true] = a.replace(/^--/, '').split('=');
    return [k, v];
  })
);
const API = String(args.api || 'https://voce.asbrihome.synology.me').replace(/\/$/, '');
const PROMPT_VERSION = 2;

const all = JSON.parse(fs.readFileSync(path.join(ROOT, '.voice-sections.json'), 'utf8'));
const entry = all[Number(args.i ?? 8)];
const section = {
  heading: entry.heading,
  level: entry.level,
  lessonTitle: entry.lessonTitle,
  ...(entry.raw || {}),
};

const latex = (section.latex || []).map((item) => ({
  source: item.source,
  display: item.display,
  spoken: (() => { try { return latexToRomanian(item.source); } catch { return ''; } })(),
}));

const hash = await sectionHash(section, PROMPT_VERSION);
console.log(`secțiune: ${section.heading}\nhash v2: ${hash}\napi: ${API}`);

const t0 = Date.now();
let res = await fetch(`${API}/voice/section`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' },
  body: JSON.stringify({
    sectionHash: hash,
    route: entry.route,
    sectionId: entry.sectionId,
    section: { ...section, latex, canonical: canonicalSection(section) },
  }),
});
let json = await res.json().catch(() => ({}));
console.log(`POST → HTTP ${res.status} în ${((Date.now() - t0) / 1000).toFixed(1)}s`);

// 202 = generarea rulează pe server; întrebăm periodic, exact ca browserul.
while (res.status === 202) {
  await new Promise((r) => setTimeout(r, 3000));
  res = await fetch(`${API}/voice/section/${hash}`, { headers: { Origin: 'http://localhost:3000' } });
  json = await res.json().catch(() => ({}));
  if (res.status === 202) process.stdout.write(`\r  în lucru… ${json.elapsedSec ?? '?'}s`);
}
const ms = Date.now() - t0;
console.log(`\nGATA după ${(ms / 1000).toFixed(1)}s — HTTP ${res.status}`);
if (!res.ok) { console.log(JSON.stringify(json).slice(0, 400)); process.exit(1); }

console.log(`durată audio: ${json.durationSec?.toFixed?.(1) ?? '?'}s | voce: ${json.voice} | necesită revizuire: ${json.needsReview}`);
console.log(`audioUrl: ${json.audioUrl}`);
console.log(`--- transcript ---\n${json.explanationText}`);

// Al doilea apel trebuie să vină din cache, aproape instant.
const t1 = Date.now();
const again = await fetch(`${API}/voice/section`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' },
  body: JSON.stringify({ sectionHash: hash, route: entry.route, sectionId: entry.sectionId, section: { ...section, latex, canonical: canonicalSection(section) } }),
});
console.log(`\ncache: HTTP ${again.status} în ${Date.now() - t1}ms`);

const head = await fetch(json.audioUrl, { method: 'HEAD' });
console.log(`audio: HTTP ${head.status}, ${head.headers.get('content-type')}, ${head.headers.get('content-length')} octeți`);
