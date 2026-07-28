/**
 * Stratul de sinteză vocală. Implementarea curentă: Piper (open-source, CPU),
 * voce feminină românească.
 *
 * Prosodia contează la fel de mult ca modelul: un profesor face pauză după o
 * definiție și înainte de o concluzie. Piper nu acceptă SSML, dar are
 * `--sentence-silence`, care inserează liniște după fiecare propoziție.
 *
 * Am sintetizat inițial frază cu frază, ca să controlăm pauza pe tipul de
 * punctuație. Măsurat pe NAS (AMD R1600), asta costa ~2 secunde de încărcare a
 * modelului la FIECARE propoziție: 27 s în loc de 19 s pentru cinci fraze.
 * Pentru o explicație de douăzeci de fraze însemna peste o jumătate de minut
 * pierdut degeaba. Un singur apel, cu pauza lăsată pe seama lui Piper, sună la
 * fel și e considerabil mai rapid.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

/** Împarte în propoziții, păstrând semnul de punctuație. */
export function splitSentences(text) {
  return String(text)
    .split(/(?<=[.!?:;])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Antet WAV PCM 16-bit mono. */
function wavHeader(dataLength, sampleRate) {
  const buf = Buffer.alloc(44);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataLength, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataLength, 40);
  return buf;
}

/** Extrage datele PCM dintr-un WAV (sare peste chunk-urile din antet). */
function pcmFromWav(buffer) {
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    if (id === 'data') return buffer.subarray(offset + 8, offset + 8 + size);
    offset += 8 + size + (size % 2);
  }
  return buffer.subarray(44);
}

export function createPiperTts(env = process.env) {
  const python = env.PIPER_PYTHON || path.join(process.cwd(), '.voice-venv/bin/python');
  const modelPath = env.PIPER_MODEL || path.join(process.cwd(), '.voice-models/ro_RO-raluca-high.onnx');
  const voiceName = path.basename(String(modelPath)).replace(/\.onnx$/, '');
  const lengthScale = Number(env.PIPER_LENGTH_SCALE || 1.0);
  /**
   * Pauza INSERTATĂ între propoziții, nu pauza totală.
   *
   * Piper lasă deja ~0,22 s de liniște la capătul fiecărei propoziții, iar
   * valoarea asta se adaugă peste. Cu 0,4 s, pauza reală măsurată ajungea la
   * 0,56–0,64 s — iar promptul cere dinadins fraze scurte, deci se ajungea la
   * peste o jumătate de secundă de tăcere la fiecare opt cuvinte. Se auzea ca o
   * voce care se oprește tot timpul.
   *
   * Cu 0,2 s, pauza reală iese pe la 0,42 s: destul cât un elev care are nevoie
   * de timp să proceseze fraza, dar fără senzația de întrerupere.
   */
  const sentenceSilence = Number(env.PIPER_SENTENCE_SILENCE || 0.2);

  /**
   * Sintetizează și întoarce PCM brut plus granițele propozițiilor.
   *
   * Rulăm un script propriu în locul liniei de comandă `python -m piper`.
   * Motivul nu e stilistic: CLI-ul lipește propozițiile într-un singur WAV și
   * aruncă informația despre unde începe fiecare, deși modelul le produce
   * separat. Fără timpii ăia nu se poate evidenția pe pagină ce se rostește
   * chiar acum. Costul e zero — același model, aceeași încărcare unică.
   */
  // `fileURLToPath`, nu `new URL(...).pathname`: pe Windows acesta din urmă dă
  // „/D:/cale", iar slash-ul din față face ca `path.join` să producă
  // „D:\D:\cale". Aceeași capcană ca la compararea cu `import.meta.url`.
  const helper = path.join(path.dirname(fileURLToPath(import.meta.url)), 'piper_sentences.py');

  function synthChunk(text, sampleRateRef, sentencesRef) {
    return new Promise((resolve, reject) => {
      const out = path.join(os.tmpdir(), `piper-${process.pid}-${Math.random().toString(36).slice(2)}.wav`);
      const args = [
        helper, modelPath, out,
        '--length-scale', String(lengthScale),
        '--sentence-silence', String(sentenceSilence),
      ];
      /**
       * UTF-8 impus explicit, în ambele sensuri.
       *
       * Node scrie textul pe stdin ca UTF-8. Pe Linux asta se potrivea din
       * întâmplare cu ce aștepta Python. Pe Windows, `sys.stdin` folosește
       * codificarea locală (cp1252), deci „și" — octeții C8 99 — era decodat ca
       * „È™", iar espeak citește ™ „marcă comercială". Explicația ieșea rostită
       * corect ca voce și complet fără sens ca text, cu audio cu 40% mai lung
       * decât ar fi trebuit, pentru că fiecare diacritică devenea două simboluri
       * silabisite.
       *
       * `PYTHONUTF8=1` pune interpretorul în modul UTF-8 indiferent de locale;
       * `PYTHONIOENCODING` acoperă și versiunile în care modul nu se aplică la
       * fluxurile standard.
       */
      const proc = spawn(python, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' },
      });
      let stderr = '';
      let stdout = '';
      proc.stdout.on('data', (d) => { stdout += d.toString('utf8'); });
      proc.stderr.on('data', (d) => { stderr += d.toString(); });
      proc.on('error', reject);
      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Piper a eșuat (${code}): ${stderr.slice(0, 300)}`));
          return;
        }
        try {
          const wav = fs.readFileSync(out);
          fs.unlinkSync(out);
          sampleRateRef.value = wav.readUInt32LE(24);
          // Timpii sunt un bonus, nu o condiție: dacă scriptul nu i-a putut
          // scoate, sinteza rămâne valabilă și doar evidențierea sincronizată
          // cade pe estimare.
          try {
            const meta = JSON.parse(stdout);
            if (meta && Array.isArray(meta.sentences)) sentencesRef.value = meta.sentences;
          } catch { /* fără timpi */ }
          resolve(pcmFromWav(wav));
        } catch (err) {
          reject(err);
        }
      });
      proc.stdin.end(text, 'utf8');
    });
  }

  return {
    name: 'piper',
    voice: voiceName,

    /**
     * Sintetizează textul complet, cu pauze naturale între propoziții.
     * @returns {{wav, durationSec, sampleRate, voice, sentences}}
     */
    async synthesize(text, { onProgress } = {}) {
      const clean = String(text).trim();
      if (!clean) throw new Error('Text gol pentru sinteză.');

      const sampleRateRef = { value: 22050 };
      const sentencesRef = { value: null };
      const data = await synthChunk(clean, sampleRateRef, sentencesRef);
      if (onProgress) onProgress({ index: 0, total: 1 });

      const wav = Buffer.concat([wavHeader(data.length, sampleRateRef.value), data]);
      return {
        wav,
        durationSec: data.length / 2 / sampleRateRef.value,
        sampleRate: sampleRateRef.value,
        voice: voiceName,
        sentences: sentencesRef.value,
      };
    },
  };
}
