/**
 * Serviciul AI Voice Teacher.
 *
 * Un singur proces, mereu pornit (Oracle free VM / mini-PC / laptop):
 *   POST /voice/section  → cache-hit instant SAU generează (Groq + Piper)
 *   GET  /voice/audio/:hash → redă audio din GridFS (cu suport pentru seek)
 *   GET  /health
 *
 * Clientul este cel care extrage secțiunea din DOM-ul randat și calculează
 * hash-ul — el vede KaTeX-ul randat, serverul nu. Serviciul primește payload-ul
 * gata făcut, deci nu are nevoie de un parser HTML propriu.
 */
import express from 'express';
import cors from 'cors';
import { pathToFileURL } from 'node:url';
import { createLlm } from './providers/llm.mjs';
import { createPiperTts } from './providers/tts.mjs';
import { explainSection } from './pipeline/explain.mjs';
import { speechBudget } from './pipeline/prompts.mjs';
import { createStore } from './storage/mongo.mjs';
import { encodeOpus } from './providers/encode.mjs';

const PORT = Number(process.env.PORT || 8099);
const MAX_TEXT = Number(process.env.VOICE_MAX_TEXT || 20000);

/** Cereri identice simultane așteaptă aceeași generare, nu pornesc alta. */
const inFlight = new Map();

function originAllowed(origin) {
  const allowed = (process.env.VOICE_ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!allowed.length) return true;
  return !origin || allowed.includes(origin);
}

/** Validare strictă: payload-ul vine de la client, deci nu are încredere implicită. */
function validatePayload(body) {
  if (!body || typeof body !== 'object') throw new Error('Corp invalid.');
  const { sectionHash, section } = body;
  if (typeof sectionHash !== 'string' || !/^[a-f0-9]{64}$/.test(sectionHash)) {
    throw new Error('sectionHash invalid (se așteaptă SHA-256 hex).');
  }
  if (!section || typeof section !== 'object') throw new Error('section lipsă.');
  if (typeof section.heading !== 'string' || !section.heading.trim()) {
    throw new Error('section.heading lipsă.');
  }
  const text = String(section.contentText || '');
  if (text.length > MAX_TEXT) throw new Error('Secțiune prea mare.');
  return { sectionHash, section };
}

function publicView(doc, baseUrl) {
  return {
    status: doc.status,
    sectionHash: doc.sectionHash,
    explanationText: doc.explanationText,
    audioUrl: doc.audio ? `${baseUrl}/voice/audio/${doc.sectionHash}` : null,
    durationSec: doc.audio ? doc.audio.durationSec : null,
    voice: doc.audio ? doc.audio.voice : null,
    needsReview: doc.quality ? doc.quality.needsReview : null,
    generatedAt: doc.updatedAt,
  };
}

export async function createServer(env = process.env) {
  const store = await createStore(env);
  const llm = createLlm(env);
  // Model separat pentru trecerea de înțelegere (buget de tokeni propriu).
  const analysisLlm = createLlm({
    ...env,
    VOICE_LLM_MODEL: env.VOICE_LLM_MODEL_ANALYSIS || 'llama-3.3-70b-versatile',
  });
  const tts = createPiperTts(env);

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  // O origine nepermisă nu este o eroare de server: `cors` transformă un
  // callback cu Error în 500. Răspundem `false` (fără anteturile CORS), iar
  // browserul blochează cererea — comportamentul corect, fără zgomot în loguri.
  app.use(cors({ origin: (origin, cb) => cb(null, originAllowed(origin)) }));

  app.get('/health', async (_req, res) => {
    try {
      res.json({ ok: true, ...(await store.stats()), llm: llm.model, voice: tts.voice });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err.message) });
    }
  });

  app.post('/voice/section', async (req, res) => {
    let parsed;
    try {
      parsed = validatePayload(req.body);
    } catch (err) {
      res.status(400).json({ error: String(err.message) });
      return;
    }
    const { sectionHash, section } = parsed;
    const baseUrl = env.VOICE_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;

    try {
      // 1. Cache — calea fierbinte, fără AI, fără așteptare.
      const cached = await store.findByHash(sectionHash);
      if (cached && cached.status === 'ready') {
        res.json({ ...publicView(cached, baseUrl), cached: true });
        return;
      }

      // 2. Deduplicare în proces: mai mulți elevi, aceeași secțiune, o generare.
      if (inFlight.has(sectionHash)) {
        res.status(202).json({ status: 'pending', sectionHash, deduped: true });
        return;
      }

      const work = (async () => {
        const { claimed } = await store.claim(sectionHash, {
          route: req.body.route || null,
          sectionId: req.body.sectionId || null,
          heading: section.heading,
          headingLevel: section.level || null,
          lessonTitle: section.lessonTitle || null,
          // `lectie` = toată lecția, predată ca la oră; `sectiune` = un singur
          // titlu. Se salvează ca să se vadă din bază ce fel de explicație e.
          mode: section.mode === 'lectie' ? 'lectie' : 'sectiune',
          // Cât va dura audio-ul, estimat din materialul sursă. Sinteza domină
          // timpul de generare și e proporțională cu asta, deci e singura
          // mărime cu care clientul poate scala o bară de progres onest.
          expectedSpeechSec: speechBudget(section).seconds,
          stage: 'analiza',
        });
        // Dacă rezervarea e la altcineva, nu așteptăm: clientul întreabă oricum
        // periodic de starea hash-ului și va vedea rezultatul când apare.
        if (!claimed) return null;

        try {
          const mark = (stage) => store.progress(sectionHash, stage).catch(() => {});
          const result = await explainSection(section, llm, { analysisLlm, onStage: mark });
          await mark('sinteza');
          const audio = await tts.synthesize(result.transcript);
          await mark('audio');
          const encoded = await encodeOpus(audio.wav);
          return await store.complete(sectionHash, {
            transcript: result.transcript,
            analysis: result.analysis,
            fidelity: result.fidelity,
            meta: {
              ...result.meta,
              ttsProvider: tts.name,
              ttsVoice: audio.voice,
              repairs: result.repairs,
            },
            audio: {
              buffer: encoded.buffer,
              codec: encoded.codec,
              contentType: encoded.contentType,
              durationSec: audio.durationSec,
              sampleRate: audio.sampleRate,
              voice: audio.voice,
            },
          });
        } catch (err) {
          await store.fail(sectionHash, err);
          throw err;
        }
      })();

      inFlight.set(sectionHash, work);
      // ATENȚIE: `.finally()` întoarce o promisiune NOUĂ care respinge la fel.
      // Dacă nimeni nu o tratează, Node oprește procesul (unhandled rejection)
      // — exact așa murea serviciul la prima limită de rată, iar apoi nici
      // explicațiile din cache nu mai puteau fi servite. Înghițim eroarea aici;
      // starea reală rămâne în baza de date, de unde o citește clientul.
      work
        .catch((err) => console.error(`[voice] ${sectionHash.slice(0, 8)} a eșuat:`, err.message))
        .finally(() => inFlight.delete(sectionHash));

      // NU așteptăm terminarea. O explicație completă pentru o secțiune mare
      // poate dura minute, iar reverse proxy-ul închide conexiunea la 180 de
      // secunde — munca era aruncată exact când era aproape gata. Răspundem
      // imediat, iar clientul întreabă periodic dacă e gata.
      res.status(202).json({ status: 'pending', sectionHash });
    } catch (err) {
      res.status(502).json({
        error: String(err.message).slice(0, 300),
        code: 'generation_failed',
      });
    }
  });

  /**
   * Starea unei generări pornite. Clientul o interoghează până primește `ready`.
   * Separând pornirea de așteptare, durata generării nu mai e limitată de
   * niciun timeout de rețea.
   */
  app.get('/voice/section/:hash', async (req, res) => {
    const hash = String(req.params.hash);
    if (!/^[a-f0-9]{64}$/.test(hash)) {
      res.status(400).json({ error: 'hash invalid' });
      return;
    }
    const baseUrl = env.VOICE_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
    const doc = await store.findByHash(hash);

    if (!doc) {
      res.status(404).json({ status: 'unknown', sectionHash: hash });
      return;
    }
    if (doc.status === 'ready') {
      res.json({ ...publicView(doc, baseUrl), cached: true });
      return;
    }
    if (doc.status === 'error') {
      // Limita de rată nu e o defecțiune: e o așteptare. Clientul trebuie să
      // afle asta ca să propună „încearcă din nou", nu „serviciul e picat".
      const message = String(doc.error || '');
      const rateLimited = /rate limit|429/i.test(message);
      const waitMatch = /try again in ([\d.]+)s/i.exec(message);
      res.status(rateLimited ? 429 : 502).json({
        status: 'error',
        error: rateLimited
          ? 'Prea multe explicații cerute în același timp.'
          : message.slice(0, 300),
        code: rateLimited ? 'rate_limited' : 'generation_failed',
        retryAfterSec: waitMatch ? Math.ceil(parseFloat(waitMatch[1])) : undefined,
      });
      return;
    }

    res.status(202).json({
      status: 'pending',
      sectionHash: hash,
      startedAt: doc.createdAt,
      elapsedSec: doc.createdAt ? Math.round((Date.now() - new Date(doc.createdAt)) / 1000) : null,
      // Cele două câmpuri din care clientul își construiește bara de progres:
      // unde suntem, și cât de mare e bucata care urmează.
      stage: doc.stage || null,
      stageSec: doc.stageAt ? Math.round((Date.now() - new Date(doc.stageAt)) / 1000) : null,
      expectedSpeechSec: doc.expectedSpeechSec || null,
    });
  });

  /** Redare audio, cu Range pentru derulare (seek) și cache lung în browser. */
  app.get('/voice/audio/:hash', async (req, res) => {
    const hash = String(req.params.hash);
    if (!/^[a-f0-9]{64}$/.test(hash)) {
      res.status(400).end();
      return;
    }
    const doc = await store.findByHash(hash);
    if (!doc || !doc.audio) {
      res.status(404).end();
      return;
    }

    const total = doc.audio.bytes;
    res.setHeader('Content-Type', doc.audio.contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    // Conținutul e imuabil: hash-ul se schimbă odată cu lecția.
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    const range = req.headers.range;
    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      const start = m && m[1] ? Number(m[1]) : 0;
      const end = m && m[2] ? Number(m[2]) : total - 1;
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
      res.setHeader('Content-Length', end - start + 1);
      store.openAudioStream(doc.audio.fileId, { start, end: end + 1 }).pipe(res);
      return;
    }

    res.setHeader('Content-Length', total);
    store.openAudioStream(doc.audio.fileId).pipe(res);
  });

  // Curățare periodică a rezervărilor agățate.
  setInterval(() => {
    store.releaseStale().catch(() => {});
  }, 60_000).unref();

  return app;
}

/**
 * „Am fost pornit direct, sau doar importat?"
 *
 * Comparația se face cu `pathToFileURL`, nu lipind `file://` în fața căii.
 * Pe Linux cele două arată la fel; pe Windows nu coincid niciodată —
 * `file://D:\cale\server.mjs` față de `file:///D:/cale/server.mjs`. Serviciul
 * pornea, nu asculta pe niciun port și ieșea fără nicio eroare, ceea ce e
 * exact felul de defect care te trimite să cauți în rețea, în firewall și în
 * baza de date, adică peste tot în afară de locul potrivit.
 */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // Plasă de siguranță: un serviciu educațional nu are voie să dispară în
  // tăcere. Orice eroare scăpată se loghează, dar procesul rămâne în picioare
  // ca să servească în continuare explicațiile deja generate din cache.
  process.on('unhandledRejection', (reason) => {
    console.error('[voice] respingere netratată:', reason);
  });
  process.on('uncaughtException', (err) => {
    console.error('[voice] excepție netratată:', err);
  });

  const app = await createServer();
  app.listen(PORT, () => {
    console.log(`AI Voice Teacher ascultă pe :${PORT}`);
  });
}
