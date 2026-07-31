/**
 * PETICUL: repară o greșeală mică din audio fără să regenereze lecția.
 *
 * O literă în plus într-un cuvânt nu justifică patru minute de sinteză nouă —
 * costă cotă, durează, și schimbă TOATĂ vocea lecției pentru o silabă. În
 * schimb, o înregistrare e făcută din propoziții despărțite de pauze: propoziția
 * greșită se poate decupa și înlocui cu una nou-sintetizată, iar restul lecției
 * rămâne neatins, cu timpii doar mutați cu diferența de durată.
 *
 * Pașii, fiecare cu plasa lui de siguranță:
 *   1. PLANUL (pur, fără audio): se compară forma rostită veche cu cea nouă,
 *      se găsește fereastra schimbată și se întinde până la hotare de
 *      propoziție — acolo sunt pauzele în care tăietura nu se aude.
 *   2. Dacă nu s-a schimbat nimic rostibil (doar scrierea unei formule, o
 *      virgulă), audio-ul nu se atinge deloc: se schimbă doar textul.
 *   3. Dacă fereastra e prea mare (peste ~600 de caractere), peticul refuză:
 *      la schimbări mari, regenerarea întreagă e mai cinstită decât un colaj.
 *   4. SINTEZA doar a propozițiilor schimbate, cu aceeași voce ca restul.
 *   5. ÎMBINAREA: tăiem la mijlocul pauzelor, lipim, mutăm timpii de după.
 *      Dacă numărul de cuvinte aliniate nu iese la fix, peticul se oprește
 *      FĂRĂ să scrie nimic — o lecție bună nu se strică pentru o reparație.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

/** Aceeași normalizare ca la comparațiile de sincronizare. */
const cheie = (x) => String(x).toLowerCase().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\d]/gu, '');

const eSfarsitDePropozitie = (w) => /[.!?:]$/.test(String(w).trim());

/**
 * Planul peticului — funcție PURĂ, testabilă fără sinteză și fără audio.
 *
 * @param {string[]} vechiRostite cuvintele rostite ale lecției de acum (w.w din audio.words)
 * @param {string[]} noiRostite   cuvintele formei rostite a textului nou
 * @param {string[]} noiAfisate   aceleași cuvinte, în forma afișată („k", nu „capa")
 * @returns {{fel:'nimic'}|{fel:'prea-mare',caractere:number}|
 *           {fel:'petic', vDe:number, vPana:number, nDe:number, nPana:number}}
 *   vDe..vPana = intervalul înlocuit din cuvintele vechi (inclusiv capetele);
 *   nDe..nPana = ce intră în loc, din cuvintele noi.
 */
export function planificaPeticul(vechiRostite, noiRostite, noiAfisate, { maxCaractere = 600 } = {}) {
  const V = vechiRostite.map(cheie);
  const N = noiRostite.map(cheie);

  /**
   * Prefixul și sufixul comune se măsoară în LITERE, nu în jetoane.
   *
   * Convertorul evoluează: sinteza veche a rupt „dintr-o" în două cuvinte, cel
   * de azi îl ține întreg. Sunetul e identic, dar jeton-cu-jeton șirurile
   * diverg la primul astfel de cuvânt și fereastra peticului se umflă peste
   * toată lecția — un cuvânt schimbat părea „2063 de caractere". Pe litere,
   * ruptura de tokenizare nu se vede deloc; doar vorbele chiar schimbate contează.
   *
   * Punctele de tăiere rămân totuși pe jetoane întregi: avansăm în perechi și
   * ținem minte ultima poziție în care AMBELE părți stăteau la hotar de jeton.
   */
  const aliniazaPrefix = () => {
    let i = 0; let j = 0; let a = ''; let b = '';
    let ultimI = 0; let ultimJ = 0;
    for (;;) {
      if (a === b) {
        ultimI = i; ultimJ = j;
        if (i >= V.length || j >= N.length) break;
        a += V[i]; i += 1;
      } else if (a.length < b.length) {
        if (i >= V.length) break;
        a += V[i]; i += 1;
      } else {
        if (j >= N.length) break;
        b += N[j]; j += 1;
      }
      if (!(a.startsWith(b) || b.startsWith(a))) break;
    }
    return { i: ultimI, j: ultimJ };
  };
  const aliniazaSufix = () => {
    let i = 0; let j = 0; let a = ''; let b = '';
    let ultimI = 0; let ultimJ = 0;
    for (;;) {
      if (a === b) {
        ultimI = i; ultimJ = j;
        if (i >= V.length || j >= N.length) break;
        a = V[V.length - 1 - i] + a; i += 1;
      } else if (a.length < b.length) {
        if (i >= V.length) break;
        a = V[V.length - 1 - i] + a; i += 1;
      } else {
        if (j >= N.length) break;
        b = N[N.length - 1 - j] + b; j += 1;
      }
      if (!(a.endsWith(b) || b.endsWith(a))) break;
    }
    return { i: ultimI, j: ultimJ };
  };

  const pre = aliniazaPrefix();
  if (pre.i === V.length && pre.j === N.length) return { fel: 'nimic' };
  const suf = aliniazaSufix();
  // Prefixul și sufixul nu au voie să se suprapună.
  const sufI = Math.min(suf.i, V.length - pre.i);
  const sufJ = Math.min(suf.j, N.length - pre.j);

  /**
   * Întinderea la hotare de propoziție se face pe AMÂNDOUĂ părțile deodată,
   * pas cu pas înapoi prin zona comună — care e identică literă cu literă,
   * deci hotarul găsit într-una există și în cealaltă.
   */
  let vDe = pre.i; let nDe = pre.j;
  while (vDe > 0 && !eSfarsitDePropozitie(vechiRostite[vDe - 1])) { vDe -= 1; nDe -= 1; }
  while (nDe > 0 && !eSfarsitDePropozitie(noiRostite[nDe - 1])) { nDe -= 1; vDe -= 1; }
  if (vDe < 0 || nDe < 0) { vDe = 0; nDe = 0; }

  let vPana = V.length - 1 - sufI; let nPana = N.length - 1 - sufJ;
  while (vPana < V.length - 1 && !eSfarsitDePropozitie(vechiRostite[vPana])) { vPana += 1; nPana += 1; }
  while (nPana < N.length - 1 && !eSfarsitDePropozitie(noiRostite[nPana])) { nPana += 1; vPana += 1; }
  vPana = Math.min(vPana, V.length - 1);
  nPana = Math.min(nPana, N.length - 1);

  const caractere = noiRostite.slice(nDe, nPana + 1).join(' ').length;
  if (caractere > maxCaractere) return { fel: 'prea-mare', caractere };
  if (nPana < nDe && vPana < vDe) return { fel: 'nimic' };
  return { fel: 'petic', vDe, vPana, nDe, nPana };
}

/** Momentele de tăiere: mijlocul pauzei dinaintea și de după fereastră. */
export function hotareleTaieturii(words, vDe, vPana, durataSec) {
  const inainte = words[vDe - 1];
  const primul = words[vDe];
  const ultimul = words[vPana];
  const dupa = words[vPana + 1];
  const start = inainte && primul
    ? ((inainte.t + inainte.d) + primul.t) / 2 / 1000
    : (primul ? Math.max(0, primul.t / 1000 - 0.05) : 0);
  const stop = dupa && ultimul
    ? ((ultimul.t + ultimul.d) + dupa.t) / 2 / 1000
    : (ultimul ? Math.min(durataSec, (ultimul.t + ultimul.d) / 1000 + 0.05) : durataSec);
  return { start, stop };
}

/**
 * Îmbină pe disc: [0..start) din original + peticul + [stop..capăt).
 * Peticul vine ca WAV de la sinteză; totul iese MP3 CBR 48k, ca restul
 * sistemului (poziția în fișier proporțională cu timpul — seek corect).
 */
export function imbinaAudio(originalMp3Buffer, peticWavBuffer, start, stop) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'petic-'));
  try {
    const orig = path.join(dir, 'orig.mp3');
    const petic = path.join(dir, 'petic.wav');
    const iesire = path.join(dir, 'nou.mp3');
    fs.writeFileSync(orig, originalMp3Buffer);
    fs.writeFileSync(petic, peticWavBuffer);
    execFileSync('ffmpeg', ['-y', '-i', orig, '-i', petic, '-filter_complex',
      `[0]atrim=0:${start},asetpts=N/SR/TB[a];`
      + '[1]aresample=24000,pan=mono|c0=c0[p];'
      + `[0]atrim=${stop},asetpts=N/SR/TB[b];`
      + '[a][p][b]concat=n=3:v=0:a=1',
      '-codec:a', 'libmp3lame', '-b:a', '48k', '-ar', '24000', '-ac', '1', iesire,
    ], { stdio: 'ignore' });
    return fs.readFileSync(iesire);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Potrivește cuvintele aliniate de sinteză cu jetoanele NOASTRE.
 *
 * Alinierea își face propria tokenizare și rupe cratimele: „dintr-o" iese
 * „dintr" + „o", deci lista ei are alt număr de cuvinte decât a noastră — exact
 * dezacordul care umpluse lecțiile vechi cu jetoane rupte. Aici le recompunem:
 * pentru fiecare jeton al nostru se consumă atâtea cuvinte aliniate cât să se
 * potrivească literă cu literă, iar timpii lor se contopesc.
 *
 * @returns {Array|null} null dacă literele nu se potrivesc — sinteza a rostit
 *   altceva decât i s-a cerut; mai bine refuzăm decât să scriem timpi falși.
 */
export function potrivesteJetoane(peticWords, jetoane) {
  const utile = peticWords.filter((w) => cheie(w.w).length);
  const iesire = [];
  let i = 0;
  for (const jeton of jetoane) {
    const tinta = cheie(jeton);
    if (!tinta.length) continue;
    if (i >= utile.length) return null;
    let acc = cheie(utile[i].w);
    const primul = utile[i];
    let ultimul = utile[i];
    i += 1;
    while (acc.length < tinta.length && i < utile.length) {
      acc += cheie(utile[i].w);
      ultimul = utile[i];
      i += 1;
    }
    if (acc !== tinta) return null;
    iesire.push({ t: primul.t, d: (ultimul.t + ultimul.d) - primul.t });
  }
  return i === utile.length ? iesire : null;
}

/**
 * Cuvintele lecției după petic: prefixul vechi + cuvintele peticului (mutate la
 * locul tăieturii) + sufixul vechi (mutat cu diferența de durată).
 *
 * @returns {Array|null} null dacă cuvintele peticului nu se potrivesc cu ce
 *   trebuia rostit — semn că sinteza a improvizat; nu scriem.
 */
export function cuvinteleDupaPetic({ words, vDe, vPana, peticWords, rostitePetic, afisatePetic, start, stop, durataPeticSec }) {
  if (rostitePetic) {
    const potrivite = potrivesteJetoane(peticWords, rostitePetic);
    if (!potrivite) return null;
    peticWords = potrivite.map((p, i) => ({ ...p, w: afisatePetic[i] }));
  }
  if (peticWords.length !== afisatePetic.length) return null;
  const startMs = start * 1000;
  const mutare = durataPeticSec * 1000 - (stop - start) * 1000;
  const prefix = words.slice(0, vDe);
  const mijloc = peticWords.map((w, i) => ({ ...w, w: afisatePetic[i], t: Math.round(w.t + startMs) }));
  const sufix = words.slice(vPana + 1).map((w) => ({ ...w, t: Math.round(w.t + mutare) }));
  const toate = [...prefix, ...mijloc, ...sufix];
  for (let i = 1; i < toate.length; i += 1) if (toate[i].t < toate[i - 1].t) return null;
  return toate;
}
