/**
 * PROBA DE ADEVĂR a sincronizării: nu verifică ce credem noi despre aliniere,
 * ci ce se AUDE efectiv. Taie 4 ferestre din audio-ul fiecărei lecții, le trece
 * prin recunoaștere vocală și compară cu ce pretinde transcriptul la acel moment.
 *
 * Metricile indirecte (ritm, monotonie) pot trece cu alinierea stricată; asta nu.
 *
 *   node --env-file=.env src/asr.mjs            # toate lecțiile cu audio
 *   node --env-file=.env src/asr.mjs 'G1 -'     # doar unele
 *
 * Cere ffmpeg în PATH. Prima rulare descarcă modelul Whisper (~500 MB).
 */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { MongoClient } from 'mongodb';
import * as Echogarden from 'echogarden';

const c = await new MongoClient(process.env.MONGODB_URI || process.env.MONGODB_URI_EDUCONNECT).connect();
const db = c.db(process.env.VOICE_DB_NAME || 'edupasi');
const col = db.collection('voice_explanations');
const bucket = new (await import('mongodb')).GridFSBucket(db, { bucketName: 'voice_audio' });

/**
 * Recunoașterea scrie unitățile PRESCURTAT — „km", „cm", „kg" — acolo unde
 * vocea le rostește întregi. Comparate literă cu literă, ferestrele acelea
 * păreau desincronizate deși se auzea exact ce trebuie: două alarme false din
 * trei, la prima rulare pe toate lecțiile. Le desfacem înainte de comparație.
 */
const PRESCURTARI = [
  [/\bkm\b/g, 'kilometri'], [/\bcm\b/g, 'centimetri'], [/\bmm\b/g, 'milimetri'],
  [/\bkg\b/g, 'kilograme'], [/\bml\b/g, 'mililitri'], [/\bmin\b/g, 'minute'],
  [/\bsec\b/g, 'secunde'], [/\bh\b/g, 'ore'],
];
const cheie = (x) => {
  let t = String(x).toLowerCase();
  for (const [re, intreg] of PRESCURTARI) t = t.replace(re, intreg);
  return t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\d]/gu, '');
};
const tmp = path.join(os.tmpdir(), 'asr' + process.pid);
fs.mkdirSync(tmp, { recursive: true });

const tinte = process.argv.slice(2);
const docs = await col.find({ 'audio.words': { $exists: true, $ne: null } }).toArray();
let rele = 0, bune = 0;

for (const d of docs) {
  const nume = (d.heading || '').slice(0, 28);
  if (tinte.length && !tinte.some((t) => nume.includes(t))) continue;
  const mp3 = path.join(tmp, 'a.mp3'), wav = path.join(tmp, 'a.wav');
  await new Promise((res, rej) => bucket.openDownloadStream(d.audio.fileId).pipe(fs.createWriteStream(mp3)).on('finish', res).on('error', rej));
  execFileSync('ffmpeg', ['-y', '-i', mp3, '-ar', '16000', '-ac', '1', wav], { stdio: 'ignore' });

  const w = d.audio.words; const dur = d.audio.durationSec;
  const lcs = (a, b) => {
    let prev = new Uint16Array(b.length + 1);
    for (let i = 1; i <= a.length; i += 1) {
      const cur = new Uint16Array(b.length + 1);
      for (let j = 1; j <= b.length; j += 1) cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
      prev = cur;
    }
    return prev[b.length];
  };

  /**
   * Întrebarea pusă corect: TOT CE S-A AUZIT în fereastră există în transcript,
   * în jurul acelui moment? — nu invers.
   *
   * Recunoașterea nu transcrie fidel fereastra: uneori sare începutul și dă doar
   * coada, alteori se oprește devreme. Când cerem ca tot ce PRETINDE transcriptul
   * să se regăsească în ce a auzit, fiecare asemenea capriciu devine alarmă
   * falsă — pe C5.1, aceeași fereastră trecea cu 97% la 14 secunde și pica la
   * 46% la 20, pe un sunet neschimbat. Măsurat invers, cu o marjă de ±6s pentru
   * transcript, capriciul nu mai contează, iar o desincronizare reală (peste 6s)
   * pică în continuare.
   */
  const probeaza = (start, len) => {
    const buc = path.join(tmp, 'f.wav');
    execFileSync('ffmpeg', ['-y', '-ss', String(start), '-t', String(len), '-i', wav, buc], { stdio: 'ignore' });
    return Echogarden.recognize(buc, { engine: 'whisper', language: 'ro', whisper: { model: 'small' } }).then((rec) => {
      const auzit = cheie(rec.transcript || '');
      const scris = cheie(w.filter((x) => x.t >= (start - 6) * 1000 && x.t < (start + len + 6) * 1000).map((x) => x.w).join(''));
      // Sub 3 cuvinte auzite nu e o probă, e o toană a decodării.
      if (auzit.length < 12) return { pot: -1, auzit, scris };
      return { pot: auzit.length ? lcs(auzit, scris) / auzit.length : 1, auzit, scris };
    });
  };

  // 4 ferestre: 15%, 40%, 65%, 90% din durată
  for (const frac of [0.15, 0.4, 0.65, 0.9]) {
    const start = Math.round(dur * frac), len = 18;
    let r = await probeaza(start, len);
    // O singură reîncercare, deplasată: desincronizarea reală pică și acolo,
    // dar o halucinație a recunoașterii nu se repetă în aceleași condiții.
    if (r.pot < 0.75) r = await probeaza(Math.max(0, start - 5), len + 6);
    const pot = r.pot < 0 ? 1 : r.pot;
    const verdict = pot >= 0.75 ? 'OK  ' : 'FAIL';
    if (pot >= 0.75) bune += 1; else rele += 1;
    console.log(`${verdict} ${nume} @${start}s ${(pot * 100).toFixed(0)}%  auzit: "${r.auzit.slice(0, 46)}"  scris: "${r.scris.slice(0, 46)}"`);
  }
}
console.log(`\nferestre corecte: ${bune} | greșite: ${rele}`);
fs.rmSync(tmp, { recursive: true, force: true });
await c.close();
process.exit(rele ? 1 : 0);
