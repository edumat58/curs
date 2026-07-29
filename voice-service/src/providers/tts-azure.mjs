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

import sdk from 'microsoft-cognitiveservices-speech-sdk';

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
    // Santinela de pauză nu are voie să blocheze despărțirea: altfel titlul
    // rămâne în aceeași propoziție cu fraza următoare, iar pauza lui ajunge
    // în mijlocul frazei — exact cazul care corupe granițele de cuvânt.
    .split(/(?<=[.!?])[]*\s+/)
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
/**
 * Semnul de pauză pus în jurul titlurilor devine tăcere adevărată.
 *
 * O pauză nu schimbă vocea: motorul nu resintetizează nimic, doar inserează
 * liniște. Titlul se aude ca un anunț, iar clicul pe secțiune are unde să
 * aterizeze fără să calce peste primul cuvânt.
 */
function pauzeTitluri(escapat) {
  return escapat
    .replace(//g, '<break time="420ms"/>')
    // Tăcerea scurtă din jurul unei litere-vocală: cât să se distingă
    // litera, fără să rupă fraza. E silence, nu `prosody`.
    .replace(//g, '<break time="130ms"/>');
}


function construiesteSsml(text, voice, rate) {
  const fraze = propozitii(text);
  const corp = fraze
    .map((f) => `<s>${pauzeTitluri(escapeXml(f))}</s>`)
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

      /**
       * Sinteză prin SDK, nu prin REST, ca să obținem GRANIȚELE DE CUVÂNT.
       *
       * REST-ul dă doar audio; SDK-ul emite pe lângă audio și evenimente
       * `wordBoundary` cu marca de timp și durata fiecărui cuvânt rostit. Din
       * ele construim subtitrarea sincronizată — fiecare cuvânt evidențiat exact
       * când e citit, nu estimat. `audioOffset`/`duration` vin în „ticks" de
       * 100 ns; le aducem în milisecunde.
       */
      const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
      speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Riff24Khz16BitMonoPcm;
      const synth = new sdk.SpeechSynthesizer(speechConfig, null);

      const words = [];
      synth.wordBoundary = (_s, e) => {
        const tip = String(e.boundaryType);
        if (tip === 'WordBoundary') {
          words.push({
            t: Math.round(e.audioOffset / 10000),
            d: Math.round(e.duration / 10000),
            w: e.text,
          });
          return;
        }
        /**
         * PUNCTUAȚIA se LIPEȘTE de cuvântul dinainte, nu se aruncă.
         *
         * Aruncată (cum era), transcriptul afișat elevului ieșea ca un șir de
         * cuvinte fără virgule și fără puncte — altfel decât textul din admin,
         * și greu de citit („…fracționară Tot astăzi înveți…"). Ca jeton separat
         * ar strica sincronizarea (ar primi un rând propriu în subtitrare), deci
         * o alipim la cuvântul precedent: același timp, aceeași evidențiere.
         */
        if (tip === 'PunctuationBoundary' && words.length) {
          const semn = String(e.text || '').trim();
          if (semn) words[words.length - 1].w += semn;
        }
      };

      const wav = await new Promise((resolve, reject) => {
        synth.speakSsmlAsync(
          ssml,
          (result) => {
            synth.close();
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
              resolve(Buffer.from(result.audioData));
            } else {
              reject(new Error(`Azure TTS eșuat: ${result.errorDetails || result.reason}`));
            }
          },
          (err) => { synth.close(); reject(new Error(`Azure TTS: ${err}`)); }
        );
      });
      if (onProgress) onProgress({ index: 0, total: 1 });

      const { sampleRate, durationSec } = durataWav(wav);

      /**
       * Timpii pe propoziție rămân, ca rezervă, estimați proporțional cu
       * lungimea — dar acum avem și `words`, sursa adevărată pentru subtitrare.
       */
      const fraze = propozitii(clean);
      const totalCar = fraze.reduce((s, f) => s + f.length, 0) || 1;
      let acum = 0;
      const sentences = fraze.map((f) => {
        const start = acum;
        acum += (f.length / totalCar) * durationSec;
        return { start: Number(start.toFixed(3)), end: Number(acum.toFixed(3)) };
      });

      // `chars` = câte caractere au intrat în cota Azure la cererea asta.
      // Azure taxează per caracter de text sintetizat, la fiecare apel — de
      // aceea îl raportăm de fiecare dată, ca evidența să oglindească factura.
      return { wav, durationSec, sampleRate, voice, sentences, words, chars: clean.length };
    },
  };
}
