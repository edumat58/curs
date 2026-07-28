/**
 * Resintetizează audio-ul explicațiilor deja generate, fără să atingă LLM-ul.
 *
 * Scris pentru un caz real: pe Windows, Python citea textul de pe stdin cu
 * codificarea locală în loc de UTF-8, așa că „și" ajungea la espeak ca „È™" —
 * iar ™ se rostește „marcă comercială". Vocea suna bine, textul era corect în
 * baza de date, dar ce se auzea nu avea nicio legătură cu el.
 *
 * Important: TEXTUL era corect. Doar sinteza a fost greșită. Deci nu se
 * regenerează nimic cu modelul de limbaj — s-ar consuma bugetul zilnic degeaba
 * și s-ar pierde explicații bune. Se ia transcriptul din bază și se rostește
 * din nou.
 *
 * Detecția e obiectivă, nu pe dată: mojibake-ul silabisește simboluri, deci
 * umflă durata. Româna rostită de `raluca-high` merge la 110–155 de cuvinte pe
 * minut; sub 105 înseamnă că s-a rostit altceva decât scrie.
 *
 *   node --env-file=voice-service/.env scripts/voice/repara-audio.mjs [--dry]
 */
import { MongoClient, GridFSBucket } from 'mongodb';
import { createPiperTts } from '../../voice-service/src/providers/tts.mjs';
import { encodeOpus } from '../../voice-service/src/providers/encode.mjs';

const PRAG_CUVINTE_PE_MINUT = 105;
const doarRaport = process.argv.includes('--dry');

const uri = process.env.MONGODB_URI_EDUCONNECT || process.env.MONGODB_URI;
const client = await new MongoClient(uri).connect();
const db = client.db(process.env.VOICE_DB_NAME || 'edupasi');
const col = db.collection('voice_explanations');
const bucket = new GridFSBucket(db, { bucketName: 'voice_audio' });
const tts = createPiperTts(process.env);

function cuvintePeMinut(doc) {
  const cuvinte = String(doc.explanationText || '').split(/\s+/).filter(Boolean).length;
  const durata = doc.audio && doc.audio.durationSec;
  return durata > 0 ? (cuvinte / durata) * 60 : 0;
}

const toate = await col.find({ status: 'ready' }).toArray();
const stricate = toate.filter((d) => d.explanationText && cuvintePeMinut(d) < PRAG_CUVINTE_PE_MINUT);

console.log(`${toate.length} explicații, dintre care ${stricate.length} cu audio de refăcut.`);
if (doarRaport || !stricate.length) {
  await client.close();
  process.exit(0);
}

let reparate = 0;
for (const doc of stricate) {
  const inainte = cuvintePeMinut(doc);
  const eticheta = `${doc.sectionHash.slice(0, 8)} ${String(doc.heading || '').slice(0, 30)}`;
  try {
    const audio = await tts.synthesize(doc.explanationText);
    const encoded = await encodeOpus(audio.wav);

    const fileId = await new Promise((resolve, reject) => {
      const stream = bucket.openUploadStream(`${doc.sectionHash}.${encoded.codec}`, {
        contentType: encoded.contentType,
        metadata: { sectionHash: doc.sectionHash, voice: audio.voice, codec: encoded.codec },
      });
      stream.on('error', reject);
      stream.on('finish', () => resolve(stream.id));
      stream.end(encoded.buffer);
    });

    const vechiId = doc.audio && doc.audio.fileId;
    await col.updateOne(
      { sectionHash: doc.sectionHash },
      {
        $set: {
          audio: {
            fileId,
            codec: encoded.codec,
            contentType: encoded.contentType,
            bytes: encoded.buffer.length,
            durationSec: audio.durationSec,
            sampleRate: audio.sampleRate,
            voice: audio.voice,
          },
          updatedAt: new Date(),
        },
      }
    );
    // Fișierul vechi se șterge DUPĂ ce noul e salvat și legat: dacă am șterge
    // întâi, o cădere la mijloc ar lăsa explicația fără niciun audio.
    if (vechiId) await bucket.delete(vechiId).catch(() => {});

    const dupa = (doc.explanationText.split(/\s+/).filter(Boolean).length / audio.durationSec) * 60;
    console.log(`  ✔ ${eticheta} — ${Math.round(inainte)} → ${Math.round(dupa)} cuvinte/minut`);
    reparate += 1;
  } catch (err) {
    console.log(`  ✘ ${eticheta} — ${String(err.message).slice(0, 120)}`);
  }
}

console.log(`\nReparate: ${reparate}/${stricate.length}`);
await client.close();
