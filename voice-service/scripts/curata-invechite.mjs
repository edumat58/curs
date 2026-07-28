/**
 * Șterge explicațiile generate cu o versiune veche de prompt, împreună cu
 * audio-ul lor din GridFS.
 *
 * Hash-ul secțiunii include PROMPT_VERSION, deci o explicație veche nu mai e
 * niciodată cerută de client — rămâne doar să ocupe spațiu și să deruteze pe
 * cine se uită în bază. Ștergerea metadatelor fără fișierul din GridFS ar lăsa
 * audio orfan, care nu se mai poate lega de nimic; de aceea se șterg împreună.
 *
 *   node --env-file=.env scripts/curata-invechite.mjs           # doar raportează
 *   node --env-file=.env scripts/curata-invechite.mjs --sterge  # chiar șterge
 */
import { GridFSBucket, MongoClient } from 'mongodb';
import { PROMPT_VERSION } from '../src/pipeline/prompts.mjs';

const uri = process.env.MONGODB_URI || process.env.MONGODB_URI_EDUCONNECT;
if (!uri) throw new Error('Lipsește MONGODB_URI.');
const chiarSterge = process.argv.includes('--sterge');

const client = await new MongoClient(uri, { maxPoolSize: 5 }).connect();
const db = client.db(process.env.VOICE_DB_NAME || 'edupasi');
const col = db.collection('voice_explanations');
const bucket = new GridFSBucket(db, { bucketName: 'voice_audio' });

const invechite = await col
  .find({ $or: [{ 'meta.promptVersion': { $lt: PROMPT_VERSION } }, { 'meta.promptVersion': null }] })
  .project({ sectionHash: 1, audioId: 1, heading: 1, 'meta.promptVersion': 1 })
  .toArray();

console.log(`versiunea curentă de prompt: ${PROMPT_VERSION}`);
console.log(`explicații învechite: ${invechite.length} din ${await col.countDocuments()}`);
for (const doc of invechite.slice(0, 10)) {
  console.log(`  v${doc.meta?.promptVersion ?? '?'}  ${doc.sectionHash.slice(0, 10)}  ${doc.heading || ''}`);
}
if (invechite.length > 10) console.log(`  … și încă ${invechite.length - 10}`);

if (!chiarSterge) {
  console.log('\n(nimic șters — rulează cu --sterge)');
} else if (invechite.length) {
  let audio = 0;
  for (const doc of invechite) {
    if (doc.audioId) {
      // Un fișier deja dispărut nu e o eroare: scopul e ca la final să nu mai existe.
      await bucket.delete(doc.audioId).then(() => { audio += 1; }, () => {});
    }
  }
  const res = await col.deleteMany({ _id: { $in: invechite.map((d) => d._id) } });
  console.log(`\nșters: ${res.deletedCount} explicații, ${audio} fișiere audio`);
}

await client.close();
