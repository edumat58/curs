/**
 * Codul canonic de lecție — identitatea care leagă lecția de fișierul audio.
 *
 * Format: `MAT-GG-XTT-D-FVL`
 *   MAT  subiectul (matematică, singurul deocamdată)
 *   GG   clasa: 05 / 06 / 07 / 08
 *   XTT  litera capitolului (C/G) + numărul din titlu pe 2 cifre: C01, G02, C15
 *   D    subdiviziunea: la „C15.3" e 3; la o lecție simplă e 0
 *   FVL  trei flaguri: adaptată (EduPAȘI), Finală, vizibilă permanent
 *          F  1 dacă lecția e adaptată (în docs/edupasi/), altfel 0
 *          V  1 dacă lecția e finală (nu se mai schimbă) — marcată din admin
 *          L  1 dacă e vizibilă permanent, 0 dacă poate fi ascunsă/afișată
 *
 * Rulează IDENTIC în browser, în scriptul de build și în serviciul de voce — o
 * singură definiție, ca toate să calculeze exact același cod.
 */

/**
 * Versiunea promptului — intră în cheia audio, ca la o schimbare de prompt
 * lecțiile să se regenereze controlat.
 *
 * Stă AICI, o singură dată, pentru că e împărțită între panoul de admin (care
 * generează) și pagina elevului (care caută). Când erau două constante separate
 * și una rămânea în urmă (admin pe 6, elev pe 7), hash-urile nu se mai potriveau
 * și butonul nu apărea deloc, deși audio-ul exista. Trebuie ținută egală și cu
 * `PROMPT_VERSION` din `voice-service/src/pipeline/prompts.mjs` (partea de Node).
 */
export const PROMPT_VERSION = 7;

/** Clasa, din numele cursului (c5 → „05"). */
const GRAD = { c5: '05', c6: '06', c7: '07', c8: '08' };

/**
 * Desface titlul lecției în literă, număr și subdiviziune.
 *
 * Titlurile arată așa: „C1 - …", „C15.3 - …", „G2 - …", „C6.1 - …". Unele
 * folosesc cratimă lungă („–"), altele scurtă — nu contează, ne oprim la număr.
 * @returns {{litera, numar, subdiviziune}|null} null dacă titlul nu e de lecție.
 */
export function parseTitlu(titlu) {
  const m = /^\s*([CG])\s*(\d+)(?:\.(\d+))?/.exec(String(titlu || ''));
  if (!m) return null;
  return {
    litera: m[1].toUpperCase(),
    numar: Number(m[2]),
    subdiviziune: m[3] ? Number(m[3]) : 0,
  };
}

/** Grupul titlului: literă + număr pe două cifre. „C1" → „C01", „G15" → „G15". */
function grupTitlu(parsat) {
  return `${parsat.litera}${String(parsat.numar).padStart(2, '0')}`;
}

/**
 * Partea STABILĂ a codului — cea care leagă lecția de audio.
 *
 * Flagurile (adaptată/finală/vizibilă) se pot schimba în timp; dacă ar intra în
 * cheia audio, o simplă marcare „finală" ar orfana fișierul deja generat. Deci
 * cheia e doar identitatea: subiect + clasă + titlu + subdiviziune. Aceasta nu
 * se schimbă decât dacă lecția devine cu adevărat altă lecție.
 *
 * @returns {string|null} ex. „MAT-05-C15-3", sau null dacă nu e lecție.
 */
export function identitateLectie({ course, title }) {
  const grad = GRAD[course];
  const parsat = parseTitlu(title);
  if (!grad || !parsat) return null;
  return `MAT-${grad}-${grupTitlu(parsat)}-${parsat.subdiviziune}`;
}

/**
 * Codul COMPLET, cu flaguri, pentru afișare și evidență.
 *
 * @param {object} lectie {course, title, collection|edupasi, final, vizibilPermanent}
 * @returns {string|null}
 */
export function codLectie(lectie) {
  const identitate = identitateLectie(lectie);
  if (!identitate) return null;
  const adaptata = lectie.collection === 'edupasi' || lectie.edupasi ? 1 : 0;
  const finala = lectie.final ? 1 : 0;
  const vizibil = lectie.vizibilPermanent ? 1 : 0;
  return `${identitate}-${adaptata}${finala}${vizibil}`;
}

/**
 * Numele de bază al unui fișier audio pentru o lecție (sau o secțiune a ei).
 *
 * Pornește de la identitatea stabilă, ca fișierul să rămână legat de lecție
 * chiar dacă flagurile se schimbă. Secțiunea se adaugă ca sufix, dintr-un index
 * ori dintr-un slug scurt: „MAT-05-C15-3” pentru lecția întreagă,
 * „MAT-05-C15-3--s02” pentru a doua secțiune.
 */
export function numeFisierAudio(identitate, sectiune) {
  if (!identitate) return null;
  if (sectiune == null || sectiune === '' || sectiune === 'lectie') return identitate;
  const s = typeof sectiune === 'number'
    ? `s${String(sectiune).padStart(2, '0')}`
    : String(sectiune).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${identitate}--${s}`;
}
