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
import { createGeminiTts } from './providers/tts-gemini.mjs';

/**
 * Alege motorul de voce din configurație.
 *
 * `azure` dă o voce umană (recomandat), dar cere o cheie; dacă lipsește, cădem
 * elegant pe Piper (local, robotic, dar funcțional) ca serviciul să nu se
 * oprească. `VOICE_TTS_PROVIDER=piper` forțează Piper explicit.
 */
/**
 * Toți providerii de voce disponibili, plus care e implicit.
 *
 * Se pot folosi mai mulți DEODATĂ, ales per lecție din admin: `gemini`
 * (Callirrhoe, natural, ales de utilizator) și `azure` (uman, cu granițe de
 * cuvânt native). Implicit e Gemini când cheia există — vocea preferată —, cu
 * Azure ca alternativă selectabilă. Piper rămâne plasa de siguranță dacă lipsesc
 * amândouă, ca serviciul să nu cadă.
 *
 * Viteza implicită de redare ține de voce, nu de player: Callirrhoe sună firesc
 * la 1×, Azure la 0,9× (cerut). O ducem la client prin metadatele audio.
 */
const VITEZA_IMPLICITA = { gemini: 1, azure: 0.9, piper: 0.9 };

function createProviders(env) {
  const providers = {};
  if (env.GEMINI_API_KEY) {
    try { providers.gemini = createGeminiTts(env); } catch (err) { console.warn(`[voice] Gemini TTS indisponibil: ${err.message}`); }
  }
  if (env.AZURE_SPEECH_KEY) {
    try { providers.azure = createAzureTts(env); } catch (err) { console.warn(`[voice] Azure indisponibil: ${err.message}`); }
  }
  if (!providers.gemini && !providers.azure) providers.piper = createPiperTts(env);

  const fortat = (env.VOICE_TTS_PROVIDER || '').toLowerCase();
  const implicit = (fortat && providers[fortat]) ? fortat
    : (providers.gemini ? 'gemini' : (providers.azure ? 'azure' : 'piper'));
  return { providers, implicit };
}
import { cleanForSpeech, explainSection } from './pipeline/explain.mjs';
import { litereMarcate, repuneLitere, calculeazaFormule } from './pipeline/speakable.mjs';
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

/**
 * Verificările gate-ului: ce NU are voie să conțină un text înainte de sinteză.
 *
 * Fiecare verificare corespunde unei clase de defect văzute pe viu: comenzi
 * LaTeX rămase (se rosteau literal), grupuri lungi în paranteze unghiulare
 * (marcajul de literă generalizat greșit de model), caractere de control
 * (pătrățele în admin), titluri de secțiune lipsă (lecție ciuntită — cazul G1,
 * unde explicația se oprea la a cincea secțiune din șapte).
 */
function verificaTextPentruAudio(text, titluriLectie) {
  const t = String(text || '');
  const probleme = [];
  // Formulele $...$ sunt PERMISE (se randează KaTeX); verificăm doar restul.
  const faraFormule = t.replace(/\$[^$\n]+\$/g, ' ');
  const latexRamas = faraFormule.match(/\\[a-zA-Z]{2,}/g);
  if (latexRamas) probleme.push(`notație LaTeX rămasă (${[...new Set(latexRamas)].slice(0, 4).join(', ')})`);
  const grupuri = t.match(/<[A-Za-z][A-Za-z0-9\s]{4,}>/g);
  if (grupuri) probleme.push(`marcaje nepermise (${[...new Set(grupuri)].slice(0, 3).join(', ')})`);
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(t)) probleme.push('caractere de control invizibile');
  /**
   * Numele fonetice ale literelor scrise ca text („be", „capa") — modelul a
   * ocolit marcajul `<b>`, iar transcriptul le-ar AFIȘA așa. Se verifică doar
   * numele care nu sunt cuvinte românești („ce", „de", „pe", „te" scapă
   * intenționat — sunt cuvinte curente).
   */
  const fonetice = t.match(/\b(be|ef|ge|haș|je|capa|em|en|es|ve|ics|igrec|zet)\b/gi);
  if (fonetice) probleme.push(`nume fonetice de litere scrise ca text (${[...new Set(fonetice.map((x) => x.toLowerCase()))].slice(0, 4).join(', ')}) — folosește marcajul <literă>`);

  if (titluriLectie.length) {
    const norm = (x) => String(x).toLowerCase().replace(/[^\p{L}\d ]/gu, ' ').replace(/\s+/g, ' ').trim();
    const corp = norm(t);
    const lipsa = titluriLectie.filter((titlu) => titlu && !corp.includes(norm(titlu)));
    if (lipsa.length) probleme.push(`secțiuni neacoperite: ${lipsa.slice(0, 3).join(' | ')}${lipsa.length > 3 ? '…' : ''}`);

    /**
     * ORDINEA secțiunilor, nu doar prezența: pe G1 „Bisectoarea unui unghi" a
     * ajuns după „Unghiuri adiacente" deși în material e altfel — promptul
     * cerea ordinea și tot a fost ignorat. O regulă în prompt e o rugăminte;
     * verificarea de aici e o garanție.
     */
    if (!lipsa.length) {
      /**
       * Potrivire MONOTONĂ, nu „prima apariție": titlul lecției și introducerea
       * pot pomeni numele secțiunilor („vom aborda… bisectoarea unui unghi")
       * înainte ca secțiunile să înceapă — prima apariție dădea fals pozitiv.
       * Căutăm fiecare titlu DUPĂ poziția precedentului; dacă un titlu nu se mai
       * găsește după cel dinainte, ordinea chiar e ruptă.
       */
      let cursor = 0;
      for (let i = 0; i < titluriLectie.length; i += 1) {
        const poz = corp.indexOf(norm(titluriLectie[i]), cursor);
        if (poz < 0) {
          probleme.push(`secțiuni în ordine greșită: „${titluriLectie[i]}" nu apare după „${titluriLectie[i - 1] || 'început'}"`);
          break;
        }
        cursor = poz + 1;
      }
    }
  }
  return probleme;
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
    // Formulele $...$ cu intervalele lor de cuvinte — clientul le randează KaTeX.
    formule: doc.audio && doc.audio.formule ? doc.audio.formule : null,
    durationSec: doc.audio ? doc.audio.durationSec : null,
    voice: doc.audio ? doc.audio.voice : null,
    // Providerul + viteza lui firească: clientul pornește la 1× pentru Callirrhoe,
    // la 0,9× pentru Azure, fără să le codeze el.
    provider: doc.audio ? doc.audio.provider : null,
    defaultRate: doc.audio && doc.audio.defaultRate ? doc.audio.defaultRate : null,
    needsReview: doc.quality ? doc.quality.needsReview : null,
    generatedAt: doc.updatedAt,
  };
}

export async function createServer(env = process.env) {
  const store = await createStore(env);
  // UN SINGUR model, pentru tot. Fără al doilea model de „analiză" și fără lanț
  // de rezerve: aceeași calitate la fiecare lecție, previzibilă.
  const llm = createLlm(env);
  const { providers: ttsProviders, implicit: ttsImplicit } = createProviders(env);
  const tts = ttsProviders[ttsImplicit];
  /** Providerul cerut (per lecție), cu revenire la cel implicit dacă lipsește. */
  const ttsFor = (nume) => ttsProviders[String(nume || '').toLowerCase()] || tts;
  /** Evidența consumului, per provider (Azure și Gemini numără caractere la fel). */
  const recordUsage = (nume, chars, ctx) => {
    if (!chars) return;
    if (nume === 'azure') store.recordAzureUsage(chars, ctx).catch(() => {});
    else if (nume === 'gemini') store.recordGeminiUsage(chars, ctx).catch(() => {});
  };

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
      // AZURE: dacă service principal-ul e configurat, consumul și cota vin DIRECT
      // de la Azure (nimic fix); altfel numărăm local, iar limita rămâne cea din
      // mediu sau necunoscută (nu inventăm 500.000).
      const live = await azureUsageLive(env).catch((err) => {
        console.warn('[voice] Azure usage live a eșuat:', err.message);
        return null;
      });
      const azure = live
        ? { ...live, sursa: 'azure' }
        : { ...(await store.azureUsage(env.AZURE_FREE_CHARS ? Number(env.AZURE_FREE_CHARS) : 500000)), sursa: 'local' };

      // GEMINI TTS: numărat local. Free tier-ul Gemini e limitat pe cereri/zi, nu
      // pe caractere/lună — deci arătăm consumul real în caractere, cu limita
      // configurabilă doar dacă administratorul o cunoaște.
      const gemini = ttsProviders.gemini
        ? { ...(await store.geminiUsage(env.GEMINI_TTS_CHARS_LIMIT ? Number(env.GEMINI_TTS_CHARS_LIMIT) : null)), sursa: 'local' }
        : null;

      return res.json({
        implicit: ttsImplicit,
        disponibili: Object.keys(ttsProviders),
        azure,
        gemini,
        // păstrat pentru compatibilitate cu clientul vechi (citea câmpurile Azure la rădăcină)
        provider: 'azure',
        ...azure,
      });
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
      /**
       * GATE DE CALITATE: audio nu se generează pe un text cu probleme.
       *
       * Sinteza costă cereri din cota zilnică și minute de așteptare; un text cu
       * resturi de notație sau cu secțiuni lipsă ar produce un audio care trebuie
       * oricum refăcut. Mai bine un refuz imediat, cu lista exactă a problemelor,
       * decât un audio greșit descoperit la ascultare.
       */
      const probleme = verificaTextPentruAudio(doc.explanationText, doc.titluriLectie || []);
      if (probleme.length && !req.body?.forta) {
        return res.status(422).json({
          error: `Textul nu e gata de audio: ${probleme.join('; ')}. Corectează-l sau trimite forta:true.`,
          probleme,
        });
      }

      // Providerul ales pentru ACEASTĂ lecție: din cerere, altfel cel salvat pe
      // lecție, altfel implicitul (Callirrhoe).
      const providerNume = String(req.body?.provider || doc.voiceProvider || ttsImplicit).toLowerCase();
      const engine = ttsFor(providerNume);
      const audio = await engine.synthesize(cleanForSpeech(doc.explanationText));
      /**
       * Vocea spune numele literei („capa"), transcriptul arată litera („k").
       * Marcajele `<k>` din text dau ordinea; după ea punem literele înapoi în
       * cuvintele raportate de sinteză.
       */
      audio.words = repuneLitere(audio.words, litereMarcate(doc.explanationText));
      // Reprezentarea dublă: intervalele de cuvinte ale fiecărei formule $...$.
      audio.formule = calculeazaFormule(doc.explanationText, audio.words, (x) => cleanForSpeech(x));
      recordUsage(engine.name, audio.chars, { sectionHash: doc.sectionHash, heading: doc.heading, route: doc.route });
      // encodeOpus întoarce {buffer, codec, contentType} — folosim câmpurile lui,
      // nu obiectul întreg (altfel GridFS primește un Object, nu un Buffer).
      const encoded = await encodeOpus(audio.wav);
      const gata = await store.attachAudio(doc.sectionHash, {
        codec: encoded.codec, contentType: encoded.contentType, buffer: encoded.buffer,
        durationSec: audio.durationSec, sampleRate: audio.sampleRate, voice: audio.voice,
        provider: engine.name, defaultRate: VITEZA_IMPLICITA[engine.name] || 1,
        // Cuvintele cu timing — subtitrarea sincronizată (Azure nativ, Gemini prin aliniere).
        words: audio.words || null, sentences: audio.sentences || null,
        formule: audio.formule || null,
      });
      // Reținem providerul pe lecție, ca regenerările viitoare să-l păstreze.
      store.setVoiceProvider(doc.sectionHash, engine.name).catch(() => {});
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
        // Titlurile lecției, extrase din sursă: reperul obiectiv al gate-ului de
        // mai jos — audio nu se generează pe un text care sare secțiuni.
        const titluriLectie = [...String(section.sourceCode || '').matchAll(/^#{2,3}\s+(.+?)\s*$/gm)]
          .map((m) => m[1].replace(/[#*`_$\\{}]/g, '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim())
          .filter(Boolean);
        const { claimed } = await store.claim(sectionHash, {
          titluriLectie,
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
          const engine = ttsFor(req.body.provider || ttsImplicit);
          const audio = await engine.synthesize(result.transcript);
          await mark('audio');
          recordUsage(engine.name, audio.chars, {
            sectionHash, heading: section.heading, route: req.body.route || null,
          });
          const encoded = await encodeOpus(audio.wav);
          return await store.complete(sectionHash, {
            transcript: result.transcript,
            analysis: result.analysis,
            fidelity: result.fidelity,
            meta: {
              ...result.meta,
              ttsProvider: engine.name,
              ttsVoice: audio.voice,
              usageChars: audio.chars,
              repairs: result.repairs,
            },
            audio: {
              buffer: encoded.buffer,
              codec: encoded.codec,
              contentType: encoded.contentType,
              durationSec: audio.durationSec,
              sampleRate: audio.sampleRate,
              voice: audio.voice,
              provider: engine.name,
              defaultRate: VITEZA_IMPLICITA[engine.name] || 1,
              words: audio.words || null,
              sentences: audio.sentences || null,
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
