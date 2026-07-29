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
import { createAzureTts } from './providers/tts-azure.mjs';

/**
 * Alege motorul de voce din configurație.
 *
 * `azure` dă o voce umană (recomandat), dar cere o cheie; dacă lipsește, cădem
 * elegant pe Piper (local, robotic, dar funcțional) ca serviciul să nu se
 * oprească. `VOICE_TTS_PROVIDER=piper` forțează Piper explicit.
 */
function createTts(env) {
  const alegere = (env.VOICE_TTS_PROVIDER || (env.AZURE_SPEECH_KEY ? 'azure' : 'piper')).toLowerCase();
  if (alegere === 'azure') {
    try {
      return createAzureTts(env);
    } catch (err) {
      console.warn(`[voice] Azure indisponibil (${err.message}); folosesc Piper.`);
    }
  }
  return createPiperTts(env);
}
import { cleanForSpeech, explainSection } from './pipeline/explain.mjs';
import { litereMarcate, repuneLitere } from './pipeline/speakable.mjs';
import { speechBudget } from './pipeline/prompts.mjs';
import { createStore } from './storage/mongo.mjs';
import { encodeOpus } from './providers/encode.mjs';
import { azureUsageLive } from './providers/azure-usage.mjs';

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

/**
 * Adresa audio poartă o versiune, altfel un audio refăcut nu ajunge niciodată
 * la elev.
 *
 * Fișierul e servit cu `immutable` și un an de valabilitate — corect, pentru că
 * hash-ul se schimbă odată cu lecția. Dar când REGENERĂM audio pentru același
 * text (sinteză reparată, altă voce), conținutul se schimbă sub aceeași adresă,
 * iar `immutable` înseamnă exact că browserul nu mai întreabă. Elevul rămâne cu
 * varianta veche până își golește cache-ul, ceea ce nu are de unde să știe.
 * Marca de timp a ultimei scrieri rezolvă asta fără să atingă hash-ul.
 */
function audioUrl(doc, baseUrl) {
  if (!doc.audio) return null;
  const versiune = doc.updatedAt ? new Date(doc.updatedAt).getTime() : 0;
  return `${baseUrl}/voice/audio/${doc.sectionHash}?v=${versiune}`;
}

function publicView(doc, baseUrl) {
  return {
    status: doc.status,
    sectionHash: doc.sectionHash,
    explanationText: doc.explanationText,
    audioUrl: audioUrl(doc, baseUrl),
    // Granițele propozițiilor, măsurate la sinteză: temelia evidențierii
    // sincronizate din player. Lipsesc la explicațiile generate înainte de a
    // exista această funcție, iar clientul le estimează atunci.
    sentences: doc.audio && doc.audio.sentences ? doc.audio.sentences : null,
    // Cuvintele cu marcă de timp (t, d în ms) — subtitrarea sincronizată. Lipsesc
    // la audio-ul generat înainte de a exista funcția; atunci nu se evidențiază.
    words: doc.audio && doc.audio.words ? doc.audio.words : null,
    durationSec: doc.audio ? doc.audio.durationSec : null,
    voice: doc.audio ? doc.audio.voice : null,
    needsReview: doc.quality ? doc.quality.needsReview : null,
    generatedAt: doc.updatedAt,
  };
}

export async function createServer(env = process.env) {
  const store = await createStore(env);
  // UN SINGUR model, pentru tot. Fără al doilea model de „analiză" și fără lanț
  // de rezerve: aceeași calitate la fiecare lecție, previzibilă.
  const llm = createLlm(env);
  const tts = createTts(env);

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

  /**
   * Guard pentru rutele de admin.
   *
   * Serviciul e public (voce.asbrihome.synology.me), deci generarea manuală,
   * editarea și ștergerea trebuie protejate — altfel oricine ar putea arde cota
   * Azure sau șterge lecții. Secretul se dă din mediu; dacă lipsește, rutele de
   * admin sunt oprite complet (fail-closed), nu lăsate deschise din greșeală.
   */
  function cereAdmin(req, res, next) {
    const secret = env.VOICE_ADMIN_SECRET;
    if (!secret) return res.status(503).json({ error: 'Administrarea nu e configurată (lipsește VOICE_ADMIN_SECRET).' });
    const dat = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
    if (dat !== secret) return res.status(401).json({ error: 'Neautorizat.' });
    return next();
  }

  /**
   * Consumul Azure: cât s-a folosit din cota lunară, cât a rămas, când se
   * resetează, și defalcarea pe lecție. Pentru evidența administratorului.
   */
  app.get('/admin/voice/usage', cereAdmin, async (_req, res) => {
    try {
      // Sursa de adevăr e Azure. Dacă service principal-ul e configurat, luăm
      // consumul și cota DIRECT de la Azure — nimic fix, se schimbă cu tierul.
      const live = await azureUsageLive(env).catch((err) => {
        console.warn('[voice] Azure usage live a eșuat:', err.message);
        return null;
      });
      if (live) return res.json({ provider: tts.name, ...live });

      // Fără ARM: raportăm consumul măsurat local, dar limita rămâne NECUNOSCUTĂ
      // — nu inventăm un 500000. Limita se dă explicit din mediu doar dacă
      // administratorul chiar o cunoaște.
      const limitaConfig = env.AZURE_FREE_CHARS ? Number(env.AZURE_FREE_CHARS) : null;
      const local = await store.azureUsage(limitaConfig);
      return res.json({ provider: tts.name, ...local, sursa: 'local' });
    } catch (err) {
      return res.status(500).json({ error: String(err.message) });
    }
  });

  /**
   * Bugetul zilnic de LIMBAJ (Groq): consumat în timp real, limita, când se
   * eliberează prima tranșă. Fereastră rulantă de 24h, urmărită local.
   */
  app.get('/admin/voice/llm-usage', cereAdmin, async (_req, res) => {
    try {
      // Limita zilnică a modelului principal. gpt-oss-120b = 200.000 tokeni/zi.
      const limita = env.VOICE_LLM_DAILY_LIMIT ? Number(env.VOICE_LLM_DAILY_LIMIT) : 200000;
      res.json({ provider: llm.name, model: llm.model, ...(await store.llmUsage(limita)) });
    } catch (err) {
      return res.status(500).json({ error: String(err.message) });
    }
  });

  /** Starea vocii pentru toate lecțiile, indexată pe rută (lista din admin). */
  app.get('/admin/voice/lessons', cereAdmin, async (_req, res) => {
    try {
      res.json({ lessons: await store.listByRoute() });
    } catch (err) {
      res.status(500).json({ error: String(err.message) });
    }
  });

  /**
   * Faza 1: generează DOAR textul (model local), fără sinteză, fără cost Azure.
   * Administratorul îl va revizui înainte de a aproba audio-ul.
   */
  app.post('/admin/voice/text', cereAdmin, async (req, res) => {
    let parsed;
    try {
      parsed = validatePayload(req.body);
    } catch (err) {
      return res.status(400).json({ error: String(err.message) });
    }
    const { sectionHash, section } = parsed;

    /**
     * Generarea e ASINCRONĂ, nu în cadrul cererii HTTP.
     *
     * Modelul local scrie o lecție în două-patru minute — mult peste timeout-ul
     * reverse-proxy-ului din față (observat: 504 după ~1 minut). Așa că marcăm
     * imediat „pending", pornim generarea în fundal și răspundem pe loc. Panoul
     * întreabă periodic de starea hash-ului până apare ciorna. Aceeași mecanică
     * pe care o folosește și fluxul elevului, din exact același motiv.
     */
    if (inFlight.has(sectionHash)) {
      return res.status(202).json({ sectionHash, status: 'pending', deduped: true });
    }
    await store.markPending(sectionHash, {
      route: req.body.route || null,
      sectionId: req.body.sectionId || null,
      heading: section.heading,
      lessonTitle: section.lessonTitle || null,
    });

    const work = (async () => {
      try {
        const result = await explainSection(section, llm, {});
        // Tokenii de limbaj consumați intră în evidența bugetului zilnic.
        if (result.meta && result.meta.tokeniTotal) {
          store.recordLlmUsage(result.meta.tokeniTotal, {
            provider: result.meta.llmProvider, model: result.meta.llmModel,
            route: req.body.route || null, heading: section.heading,
          }).catch(() => {});
        }
        await store.saveDraft(sectionHash, {
          route: req.body.route || null,
          sectionId: req.body.sectionId || null,
          heading: section.heading,
          lessonTitle: section.lessonTitle || null,
          text: result.transcript,
          meta: { ...result.meta, fidelity: result.fidelity },
        });
      } catch (err) {
        await store.fail(sectionHash, err).catch(() => {});
      }
    })();
    inFlight.set(sectionHash, work);
    work.finally(() => inFlight.delete(sectionHash));

    return res.status(202).json({ sectionHash, status: 'pending' });
  });

  /** Textul curent (draft sau final) al unei explicații, pentru revizuire. */
  app.get('/admin/voice/text/:hash', cereAdmin, async (req, res) => {
    const doc = await store.findByHash(req.params.hash);
    if (!doc) return res.status(404).json({ error: 'Inexistent.' });
    return res.json({
      sectionHash: doc.sectionHash, status: doc.status, route: doc.route,
      heading: doc.heading, text: doc.explanationText || '', meta: doc.models || {},
      // Cuvintele cu timpi (când există audio): cu ele panoul de admin poate arăta
      // transcriptul EXACT cum îl vede elevul, nu textul brut cu marcaje [[...]].
      words: (doc.audio && doc.audio.words) || null,
    });
  });

  /** Faza 1b: administratorul salvează textul editat manual. */
  app.put('/admin/voice/text/:hash', cereAdmin, async (req, res) => {
    const text = String(req.body && req.body.text || '').trim();
    if (text.length < 10) return res.status(400).json({ error: 'Text prea scurt.' });
    const ok = await store.updateText(req.params.hash, text);
    if (!ok) return res.status(404).json({ error: 'Inexistent sau nu poate fi editat.' });
    return res.json({ sectionHash: req.params.hash, status: 'draft', text });
  });

  /**
   * Faza 2: sintetizează audio (Azure) din textul APROBAT și marchează gata.
   * Abia aici se consumă cotă Azure — pe text pe care administratorul l-a văzut.
   */
  app.post('/admin/voice/audio/:hash', cereAdmin, async (req, res) => {
    const doc = await store.findByHash(req.params.hash);
    if (!doc || !doc.explanationText) return res.status(404).json({ error: 'Fără text de sintetizat.' });
    try {
      /**
       * Textul aprobat trece prin ACELEAȘI pregătiri ca la generarea completă.
       *
       * Aici se sintetiza `explanationText` BRUT, deci calea din admin ocolea tot
       * ce face `cleanForSpeech`: simbolurile matematice rostite în cuvinte,
       * LaTeX-ul scos, numerele dezlipite, pauzele dintre termenii unei sume și
       * numele literelor-variabilă („k" citit „capa", nu „chei"). Regulile erau
       * scrise și testate, dar nu ajungeau niciodată la sinteză când audio-ul se
       * genera din panou — adică exact în fluxul folosit.
       */
      const audio = await tts.synthesize(cleanForSpeech(doc.explanationText));
      /**
       * Vocea spune numele literei („capa"), transcriptul arată litera („k").
       * Marcajele `<k>` din text dau ordinea; după ea punem literele înapoi în
       * cuvintele raportate de sinteză.
       */
      audio.words = repuneLitere(audio.words, litereMarcate(doc.explanationText));
      if (tts.name === 'azure' && audio.chars) {
        store.recordAzureUsage(audio.chars, {
          sectionHash: doc.sectionHash, heading: doc.heading, route: doc.route,
        }).catch(() => {});
      }
      // encodeOpus întoarce {buffer, codec, contentType} — folosim câmpurile lui,
      // nu obiectul întreg (altfel GridFS primește un Object, nu un Buffer).
      const encoded = await encodeOpus(audio.wav);
      const gata = await store.attachAudio(doc.sectionHash, {
        codec: encoded.codec, contentType: encoded.contentType, buffer: encoded.buffer,
        durationSec: audio.durationSec, sampleRate: audio.sampleRate, voice: audio.voice,
        // Cuvintele cu timing (din SDK-ul Azure) — subtitrarea sincronizată.
        words: audio.words || null, sentences: audio.sentences || null,
      });
      const baseUrl = env.VOICE_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
      return res.json({ ...publicView(gata, baseUrl), status: 'ready' });
    } catch (err) {
      return res.status(502).json({ error: String(err.message) });
    }
  });

  /** Șterge datele de voce ale unei lecții (document + audio). */
  app.delete('/admin/voice/:hash', cereAdmin, async (req, res) => {
    const ok = await store.remove(req.params.hash);
    return res.json({ removed: ok });
  });

  /**
   * Curăță orfanele: primește rutele care CHIAR există (din lesson-sources.json)
   * și șterge tot ce e pe alte rute — lecții al căror fișier a fost șters.
   */
  app.post('/admin/voice/purge', cereAdmin, async (req, res) => {
    const routes = Array.isArray(req.body && req.body.routes) ? req.body.routes : null;
    if (!routes) return res.status(400).json({ error: 'Lipsește lista de rute valide.' });
    const sterse = await store.purgeOrphans(routes);
    return res.json({ purged: sterse });
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
          const result = await explainSection(section, llm, { onStage: mark });
          await mark('sinteza');
          const audio = await tts.synthesize(result.transcript);
          await mark('audio');
          // Consumul Azure se scrie în evidență la fiecare sinteză reușită.
          if (tts.name === 'azure' && audio.chars) {
            store.recordAzureUsage(audio.chars, {
              sectionHash,
              heading: section.heading,
              route: req.body.route || null,
            }).catch(() => {});
          }
          const encoded = await encodeOpus(audio.wav);
          return await store.complete(sectionHash, {
            transcript: result.transcript,
            analysis: result.analysis,
            fidelity: result.fidelity,
            meta: {
              ...result.meta,
              ttsProvider: tts.name,
              ttsVoice: audio.voice,
              azureChars: tts.name === 'azure' ? audio.chars : undefined,
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
    /**
     * Răspunsul ăsta NU se ține în cache, niciodată.
     *
     * El conține cuvintele cu timpi ȘI adresa audio — o pereche care are sens
     * doar dacă vine din aceeași generare. Păstrat de browser, rămânea cu
     * cuvintele vechi în timp ce audio-ul se lua proaspăt, iar elevul auzea o
     * lecție și vedea evidențiat altceva. Antetul e pus pe server tocmai ca să
     * repare și clienții care încă rulează o versiune veche de pagină.
     */
    res.setHeader('Cache-Control', 'no-store, must-revalidate');
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
      // Bugetul pe ZI e altceva decât cel pe minut: primul cere să revii mâine,
      // al doilea doar peste un minut. Cu un singur model, fără rezerve, bugetul
      // zilnic epuizat înseamnă că azi nu se mai poate genera nimic nou.
      const peZi = /per day|\bTPD\b|\bRPD\b/i.test(message);
      // „try again in 34m18.048s": prindem și minutele, nu doar secundele.
      const waitMatch = /try again in (?:(\d+)m)?([\d.]+)s/i.exec(message);
      const retryAfterSec = waitMatch
        ? Math.ceil((Number(waitMatch[1] || 0) * 60) + parseFloat(waitMatch[2]))
        : undefined;
      res.status(rateLimited ? 429 : 502).json({
        status: 'error',
        error: peZi
          ? 'Bugetul de explicații pe ziua de azi s-a epuizat. Încearcă mai târziu.'
          : rateLimited
            ? 'Prea multe explicații cerute în același timp. Încearcă din nou într-un minut.'
            : message.slice(0, 300),
        code: peZi ? 'buget_epuizat' : rateLimited ? 'rate_limited' : 'generation_failed',
        retryAfterSec,
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
