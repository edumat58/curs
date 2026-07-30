/**
 * Sinteză vocală prin Google Gemini TTS — voce naturală, aleasă de utilizator
 * (Callirrhoe) după ce Azure a sunat „prea AI".
 *
 * Diferența mare față de Azure: Gemini NU întoarce granițele de cuvânt. Fără
 * ele, transcriptul sincronizat (evidențierea, clicul pe secțiune) nu are cum să
 * funcționeze. Le recuperăm prin ALINIERE FORȚATĂ: `echogarden` sintetizează o
 * referință eSpeak a textului, o aliniază acustic (MFCC + DTW) peste audio-ul
 * Gemini și scoate timpii pe cuvinte. Totul în Node, pe CPU — PC-ul nu are
 * Python și nici GPU utilizabil. Măsurat: ~2,6 s aliniere pentru 13 s de audio.
 *
 * Cheia e aceeași `GEMINI_API_KEY` folosită deja de model — deci zero cont nou
 * și zero cost în plus la nivelul de acces actual.
 *
 * env: GEMINI_API_KEY, VOICE_GEMINI_MODEL (implicit gemini-3.1-flash-tts-preview),
 *      VOICE_GEMINI_VOICE (implicit Callirrhoe).
 */
import * as Echogarden from 'echogarden';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

/** PCM 24 kHz 16-bit mono (ce dă Gemini) → WAV cu antet, ca să fie redabil/aliniabil. */
function pcmToWav(pcm, sampleRate = 24000) {
  const b = Buffer.alloc(44 + pcm.length);
  b.write('RIFF', 0); b.writeUInt32LE(36 + pcm.length, 4); b.write('WAVE', 8);
  b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sampleRate, 24); b.writeUInt32LE(sampleRate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(pcm.length, 40); pcm.copy(b, 44);
  return b;
}

/**
 * Textul, grupat în bucăți de cel mult ~1200 de caractere, tăiate la propoziție.
 *
 * NU sintetizăm per propoziție: o lecție are ~25 și ar însemna 25 de cereri
 * secvențiale (~40 s doar pe trei, plus riscul de 429 pe free tier). NU
 * sintetizăm nici tot deodată: textul lung poate depăși limita unei cereri.
 * Bucăți de ~1200 de caractere aduc o lecție la 2-3 cereri, fiecare cu prozodie
 * de sine stătătoare, iar alinierea lucrează oricum pe audio-ul întreg.
 */
function bucatiText(text, maxChars = 1200) {
  const fraze = String(text).split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const out = [];
  let curent = '';
  for (const f of fraze) {
    if (curent && (curent.length + 1 + f.length) > maxChars) { out.push(curent); curent = f; }
    else curent = curent ? `${curent} ${f}` : f;
  }
  if (curent) out.push(curent);
  return out;
}

/**
 * Cuvintele din timeline-ul echogarden, cu punctuația din text REATAȘATĂ.
 *
 * Azure lipește punctuația de cuvântul dinainte (am muncit la asta pentru
 * transcript); echogarden dă cuvinte curate. Ca transcriptul Gemini să arate la
 * fel, parcurgem textul sursă în paralel și punem înapoi semnul care urmează
 * fiecărui cuvânt.
 */
function cuvinteDinTimeline(res, sursa) {
  const brute = [];
  const walk = (entries) => {
    for (const e of entries || []) {
      if (e.type === 'word' && /\p{L}|\d/u.test(e.text || '')) {
        brute.push({ w: e.text, t: Math.round(e.startTime * 1000), d: Math.round((e.endTime - e.startTime) * 1000) });
      }
      if (e.timeline) walk(e.timeline);
    }
  };
  walk(res.wordTimeline || res.timeline);

  // reatașăm punctuația din sursă, în ordine
  let poz = 0;
  const jos = sursa;
  for (const c of brute) {
    const idx = jos.indexOf(c.w, poz);
    if (idx >= 0) {
      poz = idx + c.w.length;
      const semne = /^([.,;:!?…»"]+)/.exec(jos.slice(poz));
      if (semne) c.w += semne[1];
    }
  }
  return brute;
}

export function createGeminiTts(env = process.env) {
  // Cheie SEPARATĂ pentru voce, dacă e configurată: pe free tier vocea împarte
  // altfel bugetul de cereri cu modelul de text (aceeași cheie) și se blochează
  // repede. Cu `VOICE_GEMINI_API_KEY`, vocea are cotă proprie și consum separat.
  /**
   * MAI MULTE chei, rotite când una își epuizează cota zilnică.
   *
   * Cotele gratuite se numără per proiect și per model (10 cereri pe zi,
   * măsurat). O lecție cere 2-5 sinteze, deci o singură cheie ajunge pentru
   * două-trei lecții pe zi. Cheile suplimentare, fiecare din alt proiect, adaugă
   * fiecare încă o găleată — fără să schimbe nimic la voce, e tot Callirrhoe.
   *
   * Ordinea: cheia dedicată vocii prima, apoi cea de text (TTS-ul nu concurează
   * cu generarea de text, sunt modele diferite deci găleți diferite), apoi orice
   * cheie în plus din `VOICE_GEMINI_API_KEYS`, separate prin virgulă.
   */
  const chei = [
    env.VOICE_GEMINI_API_KEY,
    ...(env.VOICE_GEMINI_API_KEYS || '').split(',').map((k) => k.trim()),
    env.GEMINI_API_KEY,
  ].filter(Boolean).filter((k, i, a) => a.indexOf(k) === i);
  const key = chei[0];
  /**
   * Modelul 2.5, nu 3.1 — pentru COTĂ, nu pentru calitate.
   *
   * Cotele gratuite sunt per MODEL, iar măsurat pe cheia reală:
   * `gemini-3.1-flash-tts-preview` are 10 cereri pe zi
   * (GenerateRequestsPerDayPerProjectPerModel-FreeTier = 10), adică ~5 lecții,
   * pe când `gemini-2.5-flash-preview-tts` are găleata lui, cu limită mult mai
   * largă. Vocea Callirrhoe există în amândouă și sună la fel, deci mutarea nu
   * costă nimic la ureche și dublează practic ce se poate genera pe zi.
   */
  const model = env.VOICE_GEMINI_MODEL || 'gemini-2.5-flash-preview-tts';
  const voice = env.VOICE_GEMINI_VOICE || 'Callirrhoe';
  if (!key) throw new Error('Lipsește VOICE_GEMINI_API_KEY / GEMINI_API_KEY pentru vocea Google.');

  /**
   * Ritmare între cereri: cel puțin 6 secunde, adică ~10 pe minut.
   *
   * Limita pe minut e a doua barieră a nivelului gratuit, separată de cea zilnică.
   * Fără pauză, două bucăți consecutive ale aceleiași lecții pleacă una după alta
   * și a doua primește 429 — apoi reîncercarea așteaptă oricum, doar că după o
   * eroare. Mai bine ritmăm din start.
   */
  let ultimaCerere = 0;
  /**
   * 21 de secunde între cereri, adică sub 3 pe minut — valoarea MĂSURATĂ.
   *
   * Nivelul gratuit al modelului 2.5 TTS raportează
   * `GenerateRequestsPerMinutePerProjectPerModel-FreeTier = 3`, verificat direct
   * pe cheia reală: a șasea cerere rapidă a primit 429, cu „retry după 24s".
   * Documentația publică vorbește de 10-15 pe minut, dar aia e limita modelului
   * de TEXT; TTS-ul preview e mult mai strâns.
   */
  const PAUZA_INTRE_CERERI = Number(env.VOICE_GEMINI_MIN_GAP_MS || 21000);
  async function asteaptaRandul() {
    const trecut = Date.now() - ultimaCerere;
    if (ultimaCerere && trecut < PAUZA_INTRE_CERERI) {
      await new Promise((r) => setTimeout(r, PAUZA_INTRE_CERERI - trecut));
    }
    ultimaCerere = Date.now();
  }

  async function sintetizeazaBucata(text) {
    await asteaptaRandul();
    const body = {
      contents: [{ parts: [{ text }] }],
      generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
    };
    // Reîncercări: 429 pe minut se așteaptă, 429 pe zi trece la cheia următoare.
    let cheieIdx = 0;
    for (let incercare = 0; incercare < 5; incercare += 1) {
      const cheieCurenta = chei[cheieIdx] || key;
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cheieCurenta}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (r.ok) {
        const d = await r.json();
        const part = d.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
        if (part) return Buffer.from(part.inlineData.data, 'base64');
        throw new Error('Gemini TTS: răspuns fără audio.');
      }
      if (r.status === 429 || r.status === 503) {
        /**
         * Limita ZILNICĂ nu se recuperează prin așteptare — se dă un mesaj clar.
         *
         * Reîncercarea are sens doar pentru limita pe MINUT. La cea pe zi (10
         * cereri, măsurat pe amândouă modelele TTS), oricâte reîncercări am face
         * primim același 429, iar administratorul rămâne cu „limită de rată
         * depășită", fără să afle că trebuie să aștepte până mâine.
         */
        const detalii = await r.json().catch(() => null);
        const violari = (detalii?.error?.details || [])
          .filter((d) => /QuotaFailure/.test(d['@type'] || ''))
          .flatMap((d) => d.violations || []);
        const zilnica = violari.find((v) => /PerDay/i.test(v.quotaId || ''));
        if (zilnica) {
          // Cheia asta e terminată pe ziua de azi: trecem la următoarea, dacă există.
          if (cheieIdx + 1 < chei.length) {
            cheieIdx += 1;
            console.warn(`[voice] cheia ${cheieIdx} și-a epuizat cota zilnică; trec la următoarea`);
            continue;
          }
          throw new Error(
            `Cota zilnică Google TTS epuizată pe toate cele ${chei.length} chei `
            + `(${zilnica.quotaValue || '?'} cereri/zi de cheie, pe modelul ${model}). `
            + 'Se reînnoiește după miezul nopții, ora Pacific.'
          );
        }
        // Limita pe minut: așteptăm cât cere serverul, nu o valoare inventată.
        const retry = (detalii?.error?.details || []).find((d) => /RetryInfo/.test(d['@type'] || ''));
        const secunde = retry ? Number(String(retry.retryDelay).replace('s', '')) || 25 : 25;
        await new Promise((res) => setTimeout(res, secunde * 1000));
        continue;
      }
      throw new Error(`Gemini TTS eșuat: ${r.status} ${(await r.text()).slice(0, 120)}`);
    }
    throw new Error('Gemini TTS: limita pe minut nu s-a eliberat după reîncercări.');
  }

  return {
    name: 'gemini',
    voice,

    /** @returns {{wav, durationSec, sampleRate, voice, words, chars}} */
    async synthesize(text, { onProgress } = {}) {
      const clean = String(text).trim();
      if (!clean) throw new Error('Text gol pentru sinteză.');

      /**
       * Sintetizăm pe propoziții și concatenăm — două motive: (1) fiecare cerere
       * rămâne sub limita de tokeni a modelului, (2) știm durata EXACTĂ a fiecărei
       * propoziții din lungimea PCM, deci alinierea pornește de la granițe de
       * propoziție deja corecte, nu doar din acustică.
       */
      /**
       * O SINGURĂ cerere dacă textul încape — free tier-ul Gemini limitează
       * numărul de CERERI, nu caracterele, iar vocea împarte bugetul cu modelul
       * de text. Deci fiecare cerere economisită contează. Cădem pe bucăți doar
       * dacă textul întreg e prea lung pentru o cerere.
       */
      let pcm;
      if (clean.length <= 1400) {
        pcm = await sintetizeazaBucata(clean);
        if (onProgress) onProgress({ index: 1, total: 1 });
      } else {
        const bucati = bucatiText(clean);
        const parti = [];
        for (let i = 0; i < bucati.length; i += 1) {
          parti.push(await sintetizeazaBucata(bucati[i]));
          if (onProgress) onProgress({ index: i + 1, total: bucati.length });
        }
        pcm = Buffer.concat(parti);
      }
      const sampleRate = 24000;
      const wav = pcmToWav(pcm, sampleRate);
      const durationSec = pcm.length / sampleRate / 2;

      // aliniere forțată → timpi pe cuvinte
      const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'voice-align-'));
      const wavPath = path.join(dir, 'a.wav');
      let words = [];
      try {
        await fs.writeFile(wavPath, wav);
        const res = await Echogarden.align(wavPath, clean, { language: 'ro', engine: 'dtw' });
        words = cuvinteDinTimeline(res, clean);
      } finally {
        await fs.rm(dir, { recursive: true, force: true });
      }

      return { wav, durationSec, sampleRate, voice, words, chars: clean.length };
    },
  };
}
