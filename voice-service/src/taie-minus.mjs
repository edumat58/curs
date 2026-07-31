/**
 * Scoate din audio cuvântul „minus" rostit din greșeală în titlul lecției.
 *
 * Cratima dintre codul lecției și numele ei („C9 - Relații") a fost citită ca
 * operație. Regula e reparată, dar sunetul deja rostit nu se schimbă singur, iar
 * o regenerare ar costa o oră și cota de sinteză a zilei. Aici îl tăiem:
 *
 *   1. îl CĂUTĂM ÎN SUNET, prin recunoaștere — nu în transcript și nu prin
 *      aliniere. Alinierea potrivește textul pe care i-l dăm noi, deci pe C9 a
 *      arătat 0,96s, unde de fapt e tăcere;
 *   2. tăiem între pauzele care îl încadrează;
 *   3. mutăm înapoi timpii cuvintelor de după și scoatem, dacă există, chiar
 *      cuvântul din listă.
 *
 *   node --env-file=.env src/taie-minus.mjs [filtru] [--chiar]
 */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { MongoClient, GridFSBucket } from 'mongodb';
import * as Echogarden from 'echogarden';

const argumente = process.argv.slice(2);
const CHIAR = argumente.includes('--chiar');
const filtru = argumente.find((a) => !a.startsWith('-'));

const c = await new MongoClient(process.env.MONGODB_URI || process.env.MONGODB_URI_EDUCONNECT).connect();
const db = c.db(process.env.VOICE_DB_NAME || 'edupasi');
const col = db.collection('voice_explanations');
const bucket = new GridFSBucket(db, { bucketName: 'voice_audio' });
const tmp = path.join(os.tmpdir(), 'taie' + process.pid);
fs.mkdirSync(tmp, { recursive: true });

for (const d of await col.find({ 'audio.words': { $exists: true, $ne: null } }).sort({ heading: 1 }).toArray()) {
  const nume = (d.heading || '').slice(0, 30);
  if (filtru && !nume.includes(filtru)) continue;

  const mp3 = path.join(tmp, 'a.mp3');
  await new Promise((res, rej) => bucket.openDownloadStream(d.audio.fileId).pipe(fs.createWriteStream(mp3)).on('finish', res).on('error', rej));
  const cap = path.join(tmp, 'cap.wav');
  execFileSync('ffmpeg', ['-y', '-t', '9', '-i', mp3, '-ar', '16000', '-ac', '1', cap], { stdio: 'ignore' });
  const rec = await Echogarden.recognize(cap, { engine: 'whisper', language: 'ro', whisper: { model: 'small' } });

  const cuvinte = [];
  const strange = (n) => { if (n.type === 'word' && String(n.text).trim()) cuvinte.push(n); (n.timeline || []).forEach(strange); };
  (rec.timeline || []).forEach(strange);
  const k = cuvinte.findIndex((x) => /^minus[.,]?$/i.test(String(x.text).trim()));
  if (k < 0) { console.log(`OK   ${nume.padEnd(32)} nu se aude „minus"`); continue; }

  const m = cuvinte[k];
  const inainte = cuvinte[k - 1];
  const dupa = cuvinte[k + 1];
  const start = inainte ? (inainte.endTime + m.startTime) / 2 : Math.max(0, m.startTime - 0.05);
  const stop = dupa ? (m.endTime + dupa.startTime) / 2 : m.endTime + 0.06;
  const scos = stop - start;
  console.log(`TAI  ${nume.padEnd(32)} ${start.toFixed(2)}s → ${stop.toFixed(2)}s (${Math.round(scos * 1000)}ms)`);
  if (!CHIAR) continue;

  // Aceleași setări cu care codează serviciul: MP3 la bitrate CONSTANT (encode.mjs).
  const iesire = path.join(tmp, 'nou.mp3');
  execFileSync('ffmpeg', ['-y', '-i', mp3, '-filter_complex',
    `[0]atrim=0:${start},asetpts=N/SR/TB[a];[0]atrim=${stop},asetpts=N/SR/TB[b];[a][b]concat=n=2:v=0:a=1`,
    '-codec:a', 'libmp3lame', '-b:a', '48k', '-ar', '24000', '-ac', '1', iesire], { stdio: 'ignore' });

  const startMs = start * 1000; const scosMs = scos * 1000;
  const noi = d.audio.words
    .filter((x) => !(x.t >= startMs && x.t + x.d <= startMs + scosMs))
    .map((x) => (x.t >= startMs ? { ...x, t: Math.max(0, Math.round(x.t - scosMs)) } : x));

  const id = await new Promise((res, rej) => {
    const s = bucket.openUploadStream(`${d.sectionHash}.mp3`, { contentType: 'audio/mpeg', metadata: { sectionHash: d.sectionHash, taiat: 'minus-titlu' } });
    fs.createReadStream(iesire).pipe(s).on('error', rej).on('finish', () => res(s.id));
  });
  const vechiId = d.audio.fileId;
  await col.updateOne({ sectionHash: d.sectionHash }, {
    $set: { 'audio.fileId': id, 'audio.words': noi, 'audio.durationSec': d.audio.durationSec - scos, updatedAt: new Date() },
  });
  await bucket.delete(vechiId).catch(() => {});
  console.log(`     ✓ ${noi.length} cuvinte, ${(d.audio.durationSec - scos).toFixed(1)}s`);
}
fs.rmSync(tmp, { recursive: true, force: true });
await c.close();
