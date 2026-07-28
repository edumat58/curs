/**
 * Pregenerează explicațiile pentru toate lecțiile, în fundal.
 *
 * Asta e răspunsul real la limita de tokeni, nu modelele de rezervă.
 *
 * Cache-ul e permanent și cheia lui e conținutul: cât timp lecția nu se schimbă,
 * explicația generată azi e valabilă la nesfârșit. Un elev care apasă butonul
 * primește 113 ms, nu douăzeci de secunde — și, mai important, nu poate lovi
 * nicio limită, pentru că nu se generează nimic. Limita zilnică rămâne
 * relevantă doar pentru conținut NOU, adică pentru câteva lecții pe lună.
 *
 * Rulează încet dinadins. Nu e o cursă: e un proces de fundal pe o mașină care
 * oricum stă pornită. Se oprește singur când furnizorul spune că s-a terminat
 * bugetul zilei, și reia de unde a rămas la următoarea pornire — nimic nu se
 * regenerează de două ori, pentru că verifică întâi cache-ul.
 *
 *   node --env-file=voice-service/.env scripts/voice/pregenereaza.mjs \
 *     [--api=https://voce.asbrihome.synology.me] [--limita=40] [--doar=edupasi]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalSection, sectionHash } from '../../src/lib/voice/canonical.mjs';
import { latexToRomanian } from '../../src/components/EduPasiAccessibility/speech.mjs';
import { PROMPT_VERSION } from '../../voice-service/src/pipeline/prompts.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v = true] = a.replace(/^--/, '').split('=');
    return [k, v];
  })
);

const API = String(args.api || 'https://voce.asbrihome.synology.me').replace(/\/$/, '');
const LIMITA = Number(args.limita || 1000);
const DOAR = args.doar ? String(args.doar) : null;
/** Pauză între cereri: lăsăm loc elevilor reali, care au prioritate. */
const RESPIRO_MS = Number(args.respiro || 2000);

const fisier = path.join(ROOT, '.voice-sections.json');
if (!fs.existsSync(fisier)) {
  console.error('Lipsește .voice-sections.json — rulează întâi scripts/voice/extract-sections.mjs');
  process.exit(1);
}

const toate = JSON.parse(fs.readFileSync(fisier, 'utf8'))
  .map((s, i) => ({ i, ...s }))
  .filter((s) => !DOAR || String(s.route || '').includes(DOAR));

console.log(`${toate.length} secțiuni de acoperit, cel mult ${LIMITA} în rulajul ăsta.`);

let gata = 0;
let generate = 0;
let oprit = null;

for (const intrare of toate) {
  if (generate >= LIMITA || oprit) break;

  const section = {
    heading: intrare.heading,
    level: intrare.level,
    lessonTitle: intrare.lessonTitle,
    ...(intrare.raw || {}),
  };
  const latex = (section.latex || []).map((item) => ({
    source: item.source,
    display: item.display,
    spoken: (() => { try { return latexToRomanian(item.source); } catch { return ''; } })(),
  }));

  const hash = await sectionHash(section, PROMPT_VERSION);
  const eticheta = `${String(intrare.heading).slice(0, 34).padEnd(34)}`;

  try {
    const res = await fetch(`${API}/voice/section`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' },
      body: JSON.stringify({
        sectionHash: hash,
        route: intrare.route,
        sectionId: intrare.sectionId,
        section: { ...section, latex, canonical: canonicalSection(section) },
      }),
    });

    if (res.status === 200) {
      gata += 1;
      continue; // era deja în cache — nimic de făcut
    }
    if (res.status !== 202) {
      console.log(`  ? ${eticheta} HTTP ${res.status}`);
      continue;
    }

    // Așteptăm terminarea înainte să pornim următoarea: două generări simultane
    // s-ar bate pe același buget de tokeni pe minut și ar produce numai 429.
    let final = null;
    for (let i = 0; i < 300; i += 1) {
      await new Promise((r) => setTimeout(r, 3000));
      const stare = await fetch(`${API}/voice/section/${hash}`);
      if (stare.status === 202) continue;
      final = { status: stare.status, json: await stare.json().catch(() => ({})) };
      break;
    }

    if (final && final.status === 200) {
      generate += 1;
      console.log(`  ✔ ${eticheta} ${Math.round(final.json.durationSec || 0)}s`);
    } else if (final && final.status === 429) {
      // Bugetul zilei s-a terminat. Nu insistăm: reluăm mâine, de unde am rămas.
      oprit = 'limita zilnică atinsă';
    } else {
      console.log(`  ✘ ${eticheta} ${final ? final.status : 'fără răspuns'}`);
    }
  } catch (err) {
    console.log(`  ✘ ${eticheta} ${String(err.message).slice(0, 80)}`);
  }

  await new Promise((r) => setTimeout(r, RESPIRO_MS));
}

console.log(`\nDeja în cache: ${gata} | generate acum: ${generate}${oprit ? ` | oprit: ${oprit}` : ''}`);
