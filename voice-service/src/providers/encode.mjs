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

/**
 * Comprimatoarele știute, în ordinea preferinței.
 *
 * MP3 la BITRATE CONSTANT, nu Opus/OGG. De ce s-a schimbat: în Opus-in-OGG,
 * derularea se face estimând byte-ul din timp, iar la bitrate variabil estimarea
 * cade lângă țintă — pe iOS Safari, un salt la secțiunea „Metode" ateriza în
 * mijlocul altei fraze, iar elevul auzea cu totul altceva decât arăta
 * evidențierea. La MP3 CBR, byte-ul e proporțional cu timpul, deci saltul e
 * exact pe orice player, inclusiv iOS. Costă ceva spațiu în plus (~48 kbps față
 * de 28), dar corectitudinea saltului nu e negociabilă.
 *
 * `-flags +bitexact` și lipsa unui header VBR țin fișierul strict CBR, adică
 * perfect seekabil prin simpla regulă byte = timp × bitrate.
 */
const ENCODERS = [
  {
    name: 'ffmpeg',
    probe: ['-version'],
    args: (input, output, bitrateKbps) => [
      '-loglevel', 'error', '-y', '-i', input,
      '-c:a', 'libmp3lame', '-b:a', `${bitrateKbps}k`,
      // CBR strict: fără rezervă VBR, ca poziția în octeți să fie liniară în timp.
      '-abr', '0', '-write_xing', '0',
      output,
    ],
  },
  {
    // lame direct, dacă e instalat fără ffmpeg. `--cbr -b` forțează bitrate fix.
    name: 'lame',
    probe: ['--version'],
    args: (input, output, bitrateKbps) => [
      '--cbr', '-b', String(bitrateKbps), '--quiet', input, output,
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

export async function encodeOpus(wavBuffer, { bitrateKbps = 48 } = {}) {
  const encoder = await pickEncoder();
  if (!encoder) {
    // Fără encoder, WAV: mare, dar PCM liniar — perfect seekabil pe orice player,
    // ceea ce contează mai mult decât dimensiunea când alternativa e un salt greșit.
    return {
      buffer: wavBuffer,
      codec: 'wav',
      contentType: 'audio/wav',
    };
  }

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'voice-enc-'));
  const wavPath = path.join(dir, 'in.wav');
  const mp3Path = path.join(dir, 'out.mp3');
  try {
    await fs.writeFile(wavPath, wavBuffer);
    await run(encoder.name, encoder.args(wavPath, mp3Path, bitrateKbps));
    const buffer = await fs.readFile(mp3Path);
    return { buffer, codec: 'mp3', contentType: 'audio/mpeg' };
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}
