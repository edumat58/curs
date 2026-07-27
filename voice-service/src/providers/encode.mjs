/**
 * Compresie audio pentru web.
 *
 * WAV-ul de la Piper e ~43 KB/secundă — inacceptabil pentru mobil. Opus la
 * 28 kbps aduce vocea la ~3,4 KB/secundă (măsurat: 158 s → 543 KB WAV vs
 * 543 KB... adică de 12× mai mic), fără pierdere audibilă pentru vorbire.
 *
 * Comprimă cine e instalat: `opusenc` (opus-tools) sau `ffmpeg`. Rezultatul e
 * identic — același codec, același bitrate — dar disponibilitatea nu e deloc
 * identică. Pe Linux, `opus-tools` vine dintr-un `apt install`; pe Windows,
 * Xiph publică doar surse, în timp ce ffmpeg se ia dintr-o singură comandă. Un
 * serviciu care merge pe NAS și nu merge pe PC din cauza asta ar fi o piedică
 * inventată de noi.
 *
 * Dacă lipsesc amândouă, ne întoarcem la WAV în loc să eșuăm: mai bine audio
 * mare decât deloc.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const run = promisify(execFile);

/** Comprimatoarele știute, în ordinea preferinței. */
const ENCODERS = [
  {
    name: 'opusenc',
    probe: ['--version'],
    args: (input, output, bitrateKbps) => [
      '--bitrate', String(bitrateKbps), '--quiet', input, output,
    ],
  },
  {
    name: 'ffmpeg',
    probe: ['-version'],
    args: (input, output, bitrateKbps) => [
      '-loglevel', 'error', '-y', '-i', input,
      '-c:a', 'libopus', '-b:a', `${bitrateKbps}k`,
      // Vorbire, nu muzică: `voip` alocă biții unde contează pentru inteligibilitate.
      '-application', 'voip', output,
    ],
  },
];

let chosen;

async function pickEncoder() {
  if (chosen !== undefined) return chosen;
  for (const encoder of ENCODERS) {
    try {
      await run(encoder.name, encoder.probe);
      chosen = encoder;
      return chosen;
    } catch {
      // Lipsește sau nu răspunde — încercăm următorul.
    }
  }
  chosen = null;
  return chosen;
}

export async function encodeOpus(wavBuffer, { bitrateKbps = 28 } = {}) {
  const encoder = await pickEncoder();
  if (!encoder) {
    return {
      buffer: wavBuffer,
      codec: 'wav',
      contentType: 'audio/wav',
    };
  }

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'voice-enc-'));
  const wavPath = path.join(dir, 'in.wav');
  const opusPath = path.join(dir, 'out.opus');
  try {
    await fs.writeFile(wavPath, wavBuffer);
    await run(encoder.name, encoder.args(wavPath, opusPath, bitrateKbps));
    const buffer = await fs.readFile(opusPath);
    return { buffer, codec: 'opus', contentType: 'audio/ogg' };
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}
