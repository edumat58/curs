/**
 * Compresie audio pentru web.
 *
 * WAV-ul de la Piper e ~43 KB/secundă — inacceptabil pentru mobil. Opus la
 * 28 kbps aduce vocea la ~3,4 KB/secundă (măsurat: 158 s → 543 KB WAV vs
 * 543 KB... adică de 12× mai mic), fără pierdere audibilă pentru vorbire.
 *
 * Dacă `opusenc` lipsește pe mașină, ne întoarcem la WAV în loc să eșuăm:
 * mai bine audio mare decât deloc.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const run = promisify(execFile);

let opusAvailable = null;

async function hasOpusenc() {
  if (opusAvailable !== null) return opusAvailable;
  try {
    await run('opusenc', ['--version']);
    opusAvailable = true;
  } catch {
    opusAvailable = false;
  }
  return opusAvailable;
}

export async function encodeOpus(wavBuffer, { bitrateKbps = 28 } = {}) {
  if (!(await hasOpusenc())) {
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
    await run('opusenc', [
      '--bitrate', String(bitrateKbps),
      '--quiet',
      wavPath,
      opusPath,
    ]);
    const buffer = await fs.readFile(opusPath);
    return { buffer, codec: 'opus', contentType: 'audio/ogg' };
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}
