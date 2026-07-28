/**
 * Sinteză vocală prin Azure Neural TTS — voce cu adevărat umană pentru română.
 *
 * De ce nu Piper: Piper e compact și local, dar sună robotic, taie sfârșituri
 * de cuvânt și e sacadat — reclamat de utilizator de mai multe ori. Vocile
 * neurale Azure (ro-RO-AlinaNeural, ro-RO-EmilNeural) sunt aproape
 * indistinctibile de un om și fac prozodia NATIV: pauze la virgulă, intonație
 * de întrebare, respirație între idei. Nivelul gratuit F0 dă 500.000 de
 * caractere pe lună — ~100 de lecții — fără cost.
 *
 * Singura dependență de cloud e VOCEA; textul rămâne generat local pe RoLlama.
 *
 * env: AZURE_SPEECH_KEY, AZURE_SPEECH_REGION (ex. „westeurope"),
 *      VOICE_AZURE_VOICE (implicit ro-RO-AlinaNeural),
 *      VOICE_AZURE_RATE (ex. „-6%", ritm ceva mai calm, mai profesoral).
 */

/** XML-escape pentru textul pus în SSML. */
function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Împarte în propoziții păstrând punctuația — pentru timpii de sincronizare. */
function propozitii(text) {
  return String(text)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * SSML cu pauze naturale.
 *
 * NU tăiem noi cuvintele ca la Piper — lăsăm motorul neural să pună prozodia.
 * Adăugăm doar o pauză scurtă între propoziții și un ritm ușor mai calm, cât
 * să sune a profesor răbdător, nu a robot grăbit.
 */
function construiesteSsml(text, voice, rate) {
  const fraze = propozitii(text);
  const corp = fraze
    .map((f) => `<s>${escapeXml(f)}</s>`)
    .join('<break time="220ms"/>');
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ro-RO">`
    + `<voice name="${voice}"><prosody rate="${rate}">${corp}</prosody></voice></speak>`;
}

/** Durata unui WAV PCM 16-bit mono, din antet + lungime. */
function durataWav(buf) {
  // data chunk începe după antetul standard de 44 de octeți.
  const sampleRate = buf.readUInt32LE(24);
  const octetiData = buf.length - 44;
  return { sampleRate, durationSec: octetiData / 2 / sampleRate };
}

export function createAzureTts(env = process.env) {
  const key = env.AZURE_SPEECH_KEY;
  const region = env.AZURE_SPEECH_REGION || 'westeurope';
  const voice = env.VOICE_AZURE_VOICE || 'ro-RO-AlinaNeural';
  const rate = env.VOICE_AZURE_RATE || '-6%';
  if (!key) throw new Error('Lipsește AZURE_SPEECH_KEY pentru vocea Azure.');

  const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

  return {
    name: 'azure',
    voice,

    /**
     * @returns {{wav, durationSec, sampleRate, voice, sentences}}
     */
    async synthesize(text, { onProgress } = {}) {
      const clean = String(text).trim();
      if (!clean) throw new Error('Text gol pentru sinteză.');
      const ssml = construiesteSsml(clean, voice, rate);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Type': 'application/ssml+xml',
          // 24 kHz, 16-bit PCM mono — calitate bună, ușor de măsurat și de encodat.
          'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm',
          'User-Agent': 'edupasi-voice',
        },
        body: ssml,
      });
      if (!res.ok) {
        const detaliu = await res.text().catch(() => '');
        throw new Error(`Azure TTS ${res.status}: ${detaliu.slice(0, 200)}`);
      }
      const wav = Buffer.from(await res.arrayBuffer());
      if (onProgress) onProgress({ index: 0, total: 1 });

      const { sampleRate, durationSec } = durataWav(wav);

      /**
       * Timpii pe propoziție, estimați proporțional cu lungimea.
       *
       * REST-ul Azure nu întoarce granițe de cuvânt (le dă doar SDK-ul prin
       * websocket). Pentru evidențierea sincronizată e destul o estimare pe
       * propoziție: vocea e fluentă, deci proporția cu numărul de caractere e
       * apropiată de adevăr. Dacă vom vrea precizie la cuvânt, trecem pe SDK.
       */
      const fraze = propozitii(clean);
      const totalCar = fraze.reduce((s, f) => s + f.length, 0) || 1;
      let acum = 0;
      const sentences = fraze.map((f) => {
        const start = acum;
        acum += (f.length / totalCar) * durationSec;
        return { start: Number(start.toFixed(3)), end: Number(acum.toFixed(3)) };
      });

      return { wav, durationSec, sampleRate, voice, sentences };
    },
  };
}
