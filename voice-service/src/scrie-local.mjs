/**
 * Scrie transcriptul unei lecții cu MODELUL LOCAL, în bucla verificatorului.
 *
 * Ideea de la care pornește: textul bun n-a venit din mărimea modelului, ci din
 * hamul din jurul lui — sursa completă, regulile scrise, și un verificator care
 * prinde mecanic ce sună bine dar e greșit. Modelul e piesa înlocuibilă; hamul
 * nu. Aici punem un model local în locul celui din nor și măsurăm ce iese.
 *
 * Bucla: scrie → verifică → arată-i problemele → rescrie. Se oprește când
 * verificatorul nu mai are ce reproșa, sau după `--incercari` reprize.
 *
 *   node src/scrie-local.mjs <identitate> [--port 8091] [--incercari 4] [--gata]
 *
 * Fără `--gata` nu suprascrie transcriptul existent: scrie alături, cu sufixul
 * `.local.md`, ca să poți compara cele două variante.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { verifica } from './verifica-structura.mjs';

const RADACINA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const argumente = process.argv.slice(2);
const optiune = (nume, implicit) => {
  const i = argumente.indexOf(`--${nume}`);
  return i >= 0 && argumente[i + 1] ? argumente[i + 1] : implicit;
};
const identitate = argumente.find((a) => !a.startsWith('--') && /^MAT-/.test(a));
const PORT = optiune('port', '8091');
const INCERCARI = Number(optiune('incercari', 4));
const SUPRASCRIE = argumente.includes('--gata');

if (!identitate) {
  console.error('folosire: node src/scrie-local.mjs MAT-06-C01-0-0 [--port 8091] [--incercari 4] [--gata]');
  process.exit(2);
}

const inventar = JSON.parse(fs.readFileSync(path.join(RADACINA, 'voice-service/inventar-lectii.json'), 'utf8'));
const lectie = inventar.find((l) => l.identitate === identitate);
if (!lectie) {
  console.error(`nu găsesc lecția ${identitate} în inventar`);
  process.exit(2);
}

const stil = fs.readFileSync(path.join(RADACINA, 'transcripts/STIL.md'), 'utf8');
const etalon = fs.readFileSync(path.join(RADACINA, 'transcripts/c6/modul-1/01.md'), 'utf8');
const sursa = execFileSync('node', [path.join(RADACINA, 'voice-service/src/arata-sursa.mjs'), lectie.sursa], {
  cwd: RADACINA, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
});

const frontmatter = [
  '---',
  `identitate: ${lectie.identitate}`,
  `ruta: ${lectie.ruta}`,
  `titlu: ${JSON.stringify(lectie.titlu)}`,
  'titluri:',
  ...lectie.titluri.map((t) => `  - ${JSON.stringify(t)}`),
  'stare: propus',
  `sursa: ${lectie.sursa}`,
  '---',
].join('\n');

const SISTEM = `Ești profesor de matematică și scrii transcriptul de voce al unei lecții de gimnaziu —
adică EXACT ce aude elevul, lecția întreagă explicată la tablă, nu un rezumat.

Regulile pe care le respecți fără excepție:

${stil}

Iată un transcript acceptat, ca model de ton și așezare:

${etalon}`;

const cerere = (probleme) => `Scrie transcriptul lecției „${lectie.titlu}".

MATERIALUL COMPLET AL LECȚIEI:
${sursa}

Începe cu EXACT acest frontmatter, copiat neschimbat, apoi textul:

${frontmatter}

Titlurile de secțiune, în ordine, rostite întocmai: ${lectie.titluri.map((t) => JSON.stringify(t)).join(', ')}
${probleme ? `\nÎncercarea dinainte a fost respinsă de verificator. Repară EXACT astea, fără să rescrii restul:\n${probleme}` : ''}
Răspunde DOAR cu fișierul (frontmatter + text), fără explicații și fără blocuri de cod.`;

/**
 * Cererea se face cu `node:http`, nu cu `fetch`.
 *
 * Pe procesor, modelul stă minute bune înainte de primul token: întâi digeră
 * promptul (regulile, etalonul, lecția întreagă), apoi gândește. `fetch` are un
 * timeout de anteturi de 5 minute care NU se poate ridica prin AbortSignal —
 * tăia exact aici, iar eroarea nu spunea de ce. Aici nu punem niciun timeout.
 */
function cereModelului(mesajUtilizator) {
  const corp = JSON.stringify({
    messages: [
      { role: 'system', content: SISTEM },
      { role: 'user', content: mesajUtilizator },
    ],
    temperature: 0.4,
    max_tokens: 6000,
    // GPT-OSS gândește înainte să răspundă; structura unei lecții e exact
    // genul de sarcină unde raționamentul se vede.
    reasoning_effort: 'medium',
  });
  const t0 = Date.now();
  return new Promise((rezolva, respinge) => {
    const cerere = http.request({
      host: '127.0.0.1', port: Number(PORT), path: '/v1/chat/completions', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(corp) },
      timeout: 0,
    }, (raspuns) => {
      let text = '';
      raspuns.setEncoding('utf8');
      raspuns.on('data', (b) => { text += b; });
      raspuns.on('end', () => {
        if (raspuns.statusCode !== 200) { respinge(new Error(`modelul a raspuns ${raspuns.statusCode}: ${text.slice(0, 200)}`)); return; }
        let d;
        try { d = JSON.parse(text); } catch (e) { respinge(new Error('raspuns neparsabil: ' + text.slice(0, 200))); return; }
        const mesaj = d.choices?.[0]?.message || {};
        rezolva({
          text: String(mesaj.content || '').trim(),
          secunde: Math.round((Date.now() - t0) / 1000),
          tokeni: d.usage?.completion_tokens ?? null,
          tokeniPrompt: d.usage?.prompt_tokens ?? null,
        });
      });
    });
    cerere.on('error', respinge);
    cerere.setTimeout(0);
    cerere.write(corp);
    cerere.end();
  });
}

/** Modelele pun uneori răspunsul într-un bloc de cod; îl scoatem. */
const curata = (x) => String(x).replace(/^```[a-z]*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

const caleFinala = path.join(RADACINA, lectie.transcript);
const caleTest = SUPRASCRIE ? caleFinala : caleFinala.replace(/\.md$/, '.local.md');

console.log(`${lectie.titlu}\n  sursă: ${sursa.length} caractere | ${lectie.titluri.length} secțiuni`);

let probleme = null;
let total = 0;
for (let i = 1; i <= INCERCARI; i += 1) {
  const r = await cereModelului(cerere(probleme));
  total += r.secunde;
  fs.writeFileSync(caleTest, curata(r.text) + '\n');
  const v = verifica(caleTest);
  const cuvinte = curata(r.text).split(/\s+/).filter(Boolean).length;
  console.log(`  încercarea ${i}: ${r.secunde}s | prompt ${r.tokeniPrompt ?? '?'} tokeni | generat ${r.tokeni ?? '?'} tokeni${r.tokeni ? ` (${(r.tokeni / r.secunde).toFixed(1)} tok/s)` : ''} | ${cuvinte} cuvinte → ${v.probleme.length} probleme`);
  for (const p of v.probleme.slice(0, 4)) console.log(`      ✗ ${p.slice(0, 130)}`);
  if (!v.probleme.length) {
    console.log(`  ✓ curat după ${i} încercări, ${total}s în total → ${path.relative(RADACINA, caleTest)}`);
    process.exit(0);
  }
  probleme = v.probleme.map((p) => `- ${p}`).join('\n');
}
console.log(`  ✗ nerezolvat după ${INCERCARI} încercări (${total}s) → ${path.relative(RADACINA, caleTest)}`);
process.exit(1);
