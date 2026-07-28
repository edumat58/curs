/**
 * Stratul de persistență: MongoDB pentru metadate + GridFS pentru audio.
 *
 * MongoDB e sursa de adevăr și cache-ul permanent: o secțiune se generează o
 * singură dată, apoi se servește de aici la infinit. Invalidarea se face pe
 * `sectionHash` — dacă lecția se schimbă, hash-ul se schimbă și se regenerează
 * doar acea secțiune.
 */
import { MongoClient, GridFSBucket, ObjectId } from 'mongodb';

const COLLECTION = 'voice_explanations';
const BUCKET = 'voice_audio';

let clientPromise = null;

function getClient(uri) {
  if (!clientPromise) clientPromise = new MongoClient(uri, { maxPoolSize: 10 }).connect();
  return clientPromise;
}

export async function createStore(env = process.env) {
  const uri = env.MONGODB_URI || env.MONGODB_URI_EDUCONNECT;
  if (!uri) throw new Error('Lipsește MONGODB_URI (sau MONGODB_URI_EDUCONNECT).');
  const dbName = env.VOICE_DB_NAME || 'edupasi';

  const client = await getClient(uri);
  const db = client.db(dbName);
  const col = db.collection(COLLECTION);
  const bucket = new GridFSBucket(db, { bucketName: BUCKET });

  // Indecșii contează: căutarea după hash e calea fierbinte (fiecare click).
  await col.createIndex({ sectionHash: 1 }, { unique: true });
  await col.createIndex({ route: 1, sectionId: 1 });
  await col.createIndex({ 'quality.needsReview': 1 });
  await col.createIndex({ status: 1, createdAt: 1 });

  return {
    /** Căutare în cache — calea fierbinte, trebuie să fie instantanee. */
    async findByHash(sectionHash) {
      return col.findOne({ sectionHash });
    },

    /**
     * Rezervă generarea pentru un hash. Inserția e atomică: dacă doi elevi dau
     * click simultan pe aceeași secțiune, doar unul generează, celălalt așteaptă.
     */
    async claim(sectionHash, meta, { staleMs = 20 * 60 * 1000 } = {}) {
      const now = new Date();

      // Repreluăm o încercare eșuată sau o rezervare abandonată (proces căzut,
      // repornire). Fără asta, o singură eroare — de exemplu o limită de rată —
      // lăsa secțiunea blocată definitiv: `insertOne` dădea duplicat, cererea
      // intra pe ramura „așteaptă alt proces" și expira, la nesfârșit.
      const retaken = await col.findOneAndUpdate(
        {
          sectionHash,
          $or: [
            { status: 'error' },
            { status: 'pending', createdAt: { $lt: new Date(Date.now() - staleMs) } },
          ],
        },
        {
          $set: { status: 'pending', ...meta, createdAt: now, updatedAt: now },
          $unset: { error: '' },
        },
        { returnDocument: 'after' }
      );
      if (retaken) return { claimed: true, doc: retaken, retaken: true };

      try {
        const doc = { sectionHash, status: 'pending', ...meta, createdAt: now, updatedAt: now };
        await col.insertOne(doc);
        return { claimed: true, doc };
      } catch (err) {
        if (err && err.code === 11000) {
          return { claimed: false, doc: await col.findOne({ sectionHash }) };
        }
        throw err;
      }
    },

    /**
     * Etapa curentă a unei generări în curs.
     *
     * Există ca elevul să vadă o bară care înaintează pe fapte, nu pe un
     * cronometru. Fără asta, singurul lucru pe care clientul îl putea afișa era
     * timpul scurs — adică o animație care se mișcă la fel de repede și când
     * serverul lucrează, și când s-a blocat.
     */
    async progress(sectionHash, stage) {
      await col.updateOne(
        { sectionHash, status: 'pending' },
        { $set: { stage, stageAt: new Date() } }
      );
    },

    /** Salvează rezultatul complet: audio în GridFS, metadatele în colecție. */
    async complete(sectionHash, { transcript, analysis, fidelity, meta, audio }) {
      const uploadId = await new Promise((resolve, reject) => {
        const stream = bucket.openUploadStream(`${sectionHash}.${audio.codec}`, {
          contentType: audio.contentType,
          metadata: { sectionHash, voice: audio.voice, codec: audio.codec },
        });
        stream.on('error', reject);
        stream.on('finish', () => resolve(stream.id));
        stream.end(audio.buffer);
      });

      await col.updateOne(
        { sectionHash },
        {
          $set: {
            status: 'ready',
            explanationText: transcript,
            analysis,
            quality: {
              fidelityScore: fidelity.score,
              needsReview: fidelity.needsReview,
              unsupportedNumbers: fidelity.unsupportedNumbers,
              notes: fidelity.notes,
            },
            audio: {
              fileId: uploadId,
              codec: audio.codec,
              contentType: audio.contentType,
              bytes: audio.buffer.length,
              durationSec: audio.durationSec,
              sampleRate: audio.sampleRate,
              voice: audio.voice,
            },
            models: meta,
            updatedAt: new Date(),
          },
          $setOnInsert: { sectionHash, createdAt: new Date() },
        },
        // `upsert` pentru că rezervarea poate să nu mai existe: la o generare
        // lungă, curățenia periodică sau o repornire o pot fi șters între timp.
        // Fără el, munca de câteva minute se pierdea în tăcere.
        { upsert: true }
      );
      return col.findOne({ sectionHash });
    },

    /** Marchează eșecul, ca un job blocat să nu rămână „pending" pe veci. */
    async fail(sectionHash, error) {
      await col.updateOne(
        { sectionHash },
        {
          $set: {
            status: 'error',
            error: String(error && error.message ? error.message : error).slice(0, 500),
            updatedAt: new Date(),
          },
        }
      );
    },

    /**
     * Eliberează rezervările vechi rămase agățate (proces căzut, deploy etc.).
     *
     * Pragul e generos intenționat: o secțiune mare se generează în minute, nu
     * în secunde. Cu 5 minute, curățenia ștergea rezervarea unui job ÎNCĂ ÎN
     * LUCRU, iar rezultatul lui se pierdea la salvare.
     */
    async releaseStale(maxAgeMs = 20 * 60 * 1000) {
      const cutoff = new Date(Date.now() - maxAgeMs);
      const res = await col.deleteMany({ status: 'pending', createdAt: { $lt: cutoff } });
      return res.deletedCount;
    },

    /** Flux de audio pentru redare (suportă și cereri parțiale). */
    openAudioStream(fileId, { start, end } = {}) {
      const id = typeof fileId === 'string' ? new ObjectId(fileId) : fileId;
      const options = {};
      if (Number.isFinite(start)) options.start = start;
      if (Number.isFinite(end)) options.end = end;
      return bucket.openDownloadStream(id, options);
    },

    async stats() {
      const [total, ready, review] = await Promise.all([
        col.countDocuments({}),
        col.countDocuments({ status: 'ready' }),
        col.countDocuments({ 'quality.needsReview': true }),
      ]);
      return { total, ready, needsReview: review };
    },

    collection: col,
  };
}
