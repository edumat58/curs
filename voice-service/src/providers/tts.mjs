/**
 * Stratul de sinteză vocală. Implementarea curentă: Piper (open-source, CPU),
 * voce feminină românească.
 *
 * Prosodia contează la fel de mult ca modelul: un profesor face pauză după o
 * definiție și înainte de o concluzie. Piper nu acceptă SSML, dar respectă
 * pauzele dintre propoziții atunci când sintetizăm frază cu frază și inserăm
 * liniște controlată — de aceea segmentăm noi textul, nu îl trimitem în bloc.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/** Pauze (ms) după semnele de punctuație — ritmul unui profesor, nu al unui robot. */
const PAUSE_AFTER = { '.': 420, '!': 420, '?': 460, ':': 340, ';': 300, ',': 0 };

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

function silence(ms, sampleRate) {
  return Buffer.alloc(Math.round((sampleRate * ms) / 1000) * 2);
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

  /** Sintetizează un fragment și întoarce PCM brut. */
  function synthChunk(text, sampleRateRef) {
    return new Promise((resolve, reject) => {
      const out = path.join(os.tmpdir(), `piper-${process.pid}-${Math.random().toString(36).slice(2)}.wav`);
      const args = ['-m', 'piper', '-m', modelPath, '-f', out, '--length-scale', String(lengthScale)];
      const proc = spawn(python, args, { stdio: ['pipe', 'ignore', 'pipe'] });
      let stderr = '';
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
     * @returns {{wav: Buffer, durationSec: number, sampleRate: number, voice: string}}
     */
    async synthesize(text, { onProgress } = {}) {
      const sentences = splitSentences(text);
      if (!sentences.length) throw new Error('Text gol pentru sinteză.');

      const sampleRateRef = { value: 22050 };
      const parts = [];

      for (let i = 0; i < sentences.length; i += 1) {
        const sentence = sentences[i];
        const pcm = await synthChunk(sentence, sampleRateRef);
        parts.push(pcm);

        const lastChar = sentence.slice(-1);
        const pause = PAUSE_AFTER[lastChar] ?? 260;
        if (pause && i < sentences.length - 1) {
          parts.push(silence(pause, sampleRateRef.value));
        }
        if (onProgress) onProgress({ index: i, total: sentences.length });
      }

      const data = Buffer.concat(parts);
      const wav = Buffer.concat([wavHeader(data.length, sampleRateRef.value), data]);
      return {
        wav,
        durationSec: data.length / 2 / sampleRateRef.value,
        sampleRate: sampleRateRef.value,
        voice: voiceName,
      };
    },
  };
}
