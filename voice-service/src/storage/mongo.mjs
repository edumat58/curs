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
/** Evidența apelurilor de sinteză Azure, pentru urmărirea cotei lunare. */
const USAGE = 'voice_azure_usage';
/** Evidența tokenilor de LIMBAJ (Groq), pentru bugetul zilnic al modelului. */
const LLM_USAGE = 'voice_llm_usage';

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

    /* ---- Flux de admin: text mai întâi, audio după revizuire ---- */

    /**
     * Salvează DRAFT-ul de text (fără audio, fără cost Azure).
     *
     * Prima fază a fluxului de admin: modelul local scrie explicația, dar nu se
     * sintetizează încă. Administratorul o citește, o corectează (modelul e slab)
     * și abia apoi aprobă sinteza. Așa nu se arde cotă Azure pe text neaprobat,
     * iar greșelile de conținut nu ajung niciodată la elev.
     */
    async saveDraft(sectionHash, { route, sectionId, heading, lessonTitle, text, meta }) {
      await col.updateOne(
        { sectionHash },
        {
          $set: {
            status: 'draft', explanationText: text, models: meta || {},
            route: route || null, sectionId: sectionId || null,
            heading: heading || null, lessonTitle: lessonTitle || null,
            updatedAt: new Date(),
          },
          $setOnInsert: { sectionHash, createdAt: new Date() },
        },
        { upsert: true }
      );
      return col.findOne({ sectionHash });
    },

    /**
     * Marchează o generare de text pornită, ca panoul să vadă „se generează".
     *
     * Nu atinge un text sau audio deja existent decât prin status: o regenerare
     * păstrează varianta veche vizibilă până sosește cea nouă, ca administratorul
     * să nu rămână cu ecranul gol în cele câteva minute de așteptare.
     */
    async markPending(sectionHash, meta) {
      await col.updateOne(
        { sectionHash },
        {
          $set: { status: 'pending', stage: 'naratiune', ...meta, updatedAt: new Date() },
          $setOnInsert: { sectionHash, createdAt: new Date() },
        },
        { upsert: true }
      );
    },

    /** Editarea manuală a textului de către administrator. */
    async updateText(sectionHash, text) {
      const res = await col.updateOne(
        { sectionHash, status: { $in: ['draft', 'ready'] } },
        // Un text editat după ce audio era gata redevine draft: sinteza veche nu
        // mai corespunde, trebuie refăcută. Ștergem și audio-ul învechit.
        { $set: { status: 'draft', explanationText: text, updatedAt: new Date() }, $unset: { audio: '' } }
      );
      return res.matchedCount > 0;
    },

    /** Atașează audio-ul sintetizat și marchează explicația gata de elev. */
    async attachAudio(sectionHash, audio) {
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
            audio: {
              fileId: uploadId, codec: audio.codec, contentType: audio.contentType,
              bytes: audio.buffer.length, durationSec: audio.durationSec,
              sampleRate: audio.sampleRate, voice: audio.voice,
              // Subtitrarea sincronizată: cuvinte cu marcă de timp + granițe de frază.
              words: audio.words || null, sentences: audio.sentences || null,
            },
            updatedAt: new Date(),
          },
        }
      );
      return col.findOne({ sectionHash });
    },

    /** Șterge complet o explicație: document + audio din GridFS. */
    async remove(sectionHash) {
      const doc = await col.findOne({ sectionHash });
      if (!doc) return false;
      if (doc.audio && doc.audio.fileId) {
        await bucket.delete(doc.audio.fileId).catch(() => {});
      }
      await col.deleteOne({ sectionHash });
      return true;
    },

    /** Starea tuturor explicațiilor, indexată pe rută — pentru lista din admin. */
    async listByRoute() {
      const docs = await col.find({}, {
        projection: {
          sectionHash: 1, route: 1, heading: 1, status: 1, updatedAt: 1,
          'audio.durationSec': 1, 'models.azureChars': 1, 'models.words': 1,
          'quality.needsReview': 1,
        },
      }).toArray();
      const dupaRuta = {};
      for (const d of docs) if (d.route) dupaRuta[d.route] = d;
      return dupaRuta;
    },

    /**
     * Șterge datele de voce ale lecțiilor care NU mai există.
     *
     * Regula cerută: dacă FIȘIERUL lecției a fost șters din `docs/` (nu ascuns
     * din admin), tot ce ține de vocea ei dispare automat — audio, text, consum.
     * Primim rutele care CHIAR există (din `lesson-sources.json`); orice
     * explicație pe altă rută e orfană și se curăță.
     */
    async purgeOrphans(validRoutes) {
      const valide = new Set(validRoutes);
      const docs = await col.find({}, { projection: { sectionHash: 1, route: 1, 'audio.fileId': 1 } }).toArray();
      let sterse = 0;
      for (const d of docs) {
        if (d.route && !valide.has(d.route)) {
          if (d.audio && d.audio.fileId) await bucket.delete(d.audio.fileId).catch(() => {});
          await col.deleteOne({ sectionHash: d.sectionHash });
          sterse += 1;
        }
      }
      return sterse;
    },

    /**
     * Înregistrează tokenii de LIMBAJ consumați la o generare.
     *
     * Groq nu expune în anteturi bugetul ZILNIC (doar cel pe minut), iar cel
     * zilnic apare doar în mesajul de 429. Ca să-l putem arăta în timp real, îl
     * ținem noi: câți tokeni am consumat, cu marca de timp.
     */
    async recordLlmUsage(tokens, { provider, model, route, heading } = {}) {
      if (!tokens || tokens <= 0) return;
      await db.collection(LLM_USAGE).insertOne({
        tokens, provider: provider || null, model: model || null,
        route: route || null, heading: heading || null, at: new Date(),
      });
    },

    /**
     * Bugetul zilnic de LIMBAJ, pe fereastră RULANTĂ de 24 de ore.
     *
     * Limita Groq pe zi (ex. 200.000 de tokeni pe gpt-oss-120b) nu se resetează
     * la o oră fixă, ci glisant: fiecare apel iese din fereastră la 24h după ce a
     * fost făcut, eliberând atâția tokeni. De aceea „reset"-ul e momentul în care
     * cel mai vechi apel din fereastră împlinește 24h — atunci se eliberează
     * prima tranșă. Îl dăm ca dată și oră exactă.
     */
    async llmUsage(limit = null) {
      const DOUAZECISIPATRU = 24 * 60 * 60 * 1000;
      const acum = Date.now();
      const col = db.collection(LLM_USAGE);
      const inFereastra = await col
        .find({ at: { $gte: new Date(acum - DOUAZECISIPATRU) } })
        .sort({ at: 1 })
        .toArray();
      const folosit = inFereastra.reduce((s, d) => s + (d.tokens || 0), 0);
      const celMaiVechi = inFereastra[0];
      const seEliberezaLa = celMaiVechi
        ? new Date(new Date(celMaiVechi.at).getTime() + DOUAZECISIPATRU)
        : null;
      return {
        folosit,
        limita: limit,
        ramas: limit != null ? Math.max(0, limit - folosit) : null,
        procent: limit ? Math.round((folosit / limit) * 1000) / 10 : null,
        apeluri: inFereastra.length,
        // Câți tokeni și când se eliberează prima tranșă (cel mai vechi + 24h).
        seEliberezaLa: seEliberezaLa ? seEliberezaLa.toISOString() : null,
        elibereaza: celMaiVechi ? (celMaiVechi.tokens || 0) : 0,
      };
    },

    /**
     * Înregistrează un apel de sinteză Azure în evidența de consum.
     *
     * O intrare per APEL, nu per lecție: Azure taxează fiecare sinteză, deci o
     * regenerare consumă din nou. Așa evidența noastră oglindește factura.
     */
    async recordAzureUsage(chars, { sectionHash, heading, route } = {}) {
      if (!chars || chars <= 0) return;
      await db.collection(USAGE).insertOne({
        chars, sectionHash: sectionHash || null, heading: heading || null,
        route: route || null, at: new Date(),
      });
    },

    /**
     * Consumul Azure pe LUNA calendaristică curentă + defalcare pe lecție.
     *
     * Nivelul gratuit F0 dă 500.000 de caractere pe lună și se reînnoiește lunar.
     * Reperul de reset e începutul lunii următoare — aproximare curată și
     * ușor de urmărit pentru administrator.
     */
    async azureUsage(limit = null) {
      const acum = new Date();
      const inceputLuna = new Date(acum.getFullYear(), acum.getMonth(), 1);
      const resetLa = new Date(acum.getFullYear(), acum.getMonth() + 1, 1);
      const usageCol = db.collection(USAGE);

      const [totalLuna, perLectie] = await Promise.all([
        usageCol.aggregate([
          { $match: { at: { $gte: inceputLuna } } },
          { $group: { _id: null, chars: { $sum: '$chars' } } },
        ]).toArray(),
        usageCol.aggregate([
          { $match: { at: { $gte: inceputLuna } } },
          {
            $group: {
              _id: '$route',
              heading: { $last: '$heading' },
              chars: { $sum: '$chars' },
              apeluri: { $sum: 1 },
              ultima: { $max: '$at' },
            },
          },
          { $sort: { chars: -1 } },
        ]).toArray(),
      ]);

      const folosit = (totalLuna[0] && totalLuna[0].chars) || 0;
      // Limita necunoscută rămâne necunoscută: `ramas` și `procent` sunt null,
      // nu un procent calculat dintr-un număr inventat.
      return {
        folosit,
        limita: limit,
        ramas: limit != null ? Math.max(0, limit - folosit) : null,
        procent: limit ? Math.round((folosit / limit) * 1000) / 10 : null,
        seResetLa: resetLa.toISOString(),
        perLectie: perLectie.map((l) => ({
          route: l._id, heading: l.heading, chars: l.chars,
          apeluri: l.apeluri, ultima: l.ultima,
        })),
      };
    },

    collection: col,
  };
}
