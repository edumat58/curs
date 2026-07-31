/**
 * Împachetează depozitul `transcripts/` pentru panoul de administrare.
 *
 * Depozitul e sursa de adevăr, în git — acolo se revizuiesc textele, cu diff și
 * istoric. Panoul însă rulează în browser și nu poate citi fișiere din repo;
 * primește indexul acesta static, cheiat pe identitatea lecției, și oferă
 * administratorului propunerea cu un singur buton: „Adoptă".
 *
 *   node scripts/build-transcripts-index.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { citesteTranscript } from '../voice-service/src/verifica-structura.mjs';

const RADACINA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEPOZIT = path.join(RADACINA, 'transcripts');

const index = {};
const aduna = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) aduna(p);
    else if (e.name.endsWith('.md') && e.name !== 'STIL.md') {
      const { meta, text } = citesteTranscript(p);
      if (!meta.identitate) continue;
      index[meta.identitate] = {
        ruta: meta.ruta,
        titlu: meta.titlu,
        stare: meta.stare || 'propus',
        titluri: meta.titluri,
        fisier: path.relative(RADACINA, p),
        text,
      };
    }
  }
};
if (fs.existsSync(DEPOZIT)) aduna(DEPOZIT);

const iesire = path.join(RADACINA, 'static', 'transcripts-index.json');
fs.writeFileSync(iesire, JSON.stringify(index));
console.log(`${Object.keys(index).length} transcripturi → ${path.relative(RADACINA, iesire)}`);
