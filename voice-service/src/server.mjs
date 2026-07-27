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
import { createLlm } from './providers/llm.mjs';
import { createPiperTts } from './providers/tts.mjs';
import { explainSection } from './pipeline/explain.mjs';
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
        const doc = await inFlight.get(sectionHash);
        res.json({ ...publicView(doc, baseUrl), cached: false, deduped: true });
        return;
      }

      const work = (async () => {
        const { claimed } = await store.claim(sectionHash, {
          route: req.body.route || null,
          sectionId: req.body.sectionId || null,
          heading: section.heading,
          headingLevel: section.level || null,
          lessonTitle: section.lessonTitle || null,
        });
        if (!claimed) {
          // Alt proces generează deja; așteptăm scurt rezultatul lui.
          for (let i = 0; i < 40; i += 1) {
            await new Promise((r) => setTimeout(r, 750));
            const doc = await store.findByHash(sectionHash);
            if (doc && doc.status === 'ready') return doc;
            if (doc && doc.status === 'error') throw new Error('Generare eșuată în alt proces.');
          }
          throw new Error('Timp expirat așteptând generarea.');
        }

        try {
          const result = await explainSection(section, llm);
          const audio = await tts.synthesize(result.transcript);
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
      work.finally(() => inFlight.delete(sectionHash));

      const doc = await work;
      res.json({ ...publicView(doc, baseUrl), cached: false });
    } catch (err) {
      res.status(502).json({ error: String(err.message).slice(0, 300) });
    }
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

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = await createServer();
  app.listen(PORT, () => {
    console.log(`AI Voice Teacher ascultă pe :${PORT}`);
  });
}
