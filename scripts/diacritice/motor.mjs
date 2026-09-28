/**
 * Motorul de restaurare a diacriticelor. Pur: primește text, întoarce propuneri.
 *
 * Nu știe nimic despre VS Code și nu atinge niciun fișier — ca să poată fi
 * testat cu un `node --test` obișnuit și refolosit dintr-o unealtă de linie de
 * comandă. Extensia îl împachetează, nu îl conține.
 *
 * ── Cele trei niveluri de siguranță ────────────────────────────────────────
 *
 * Fiecare cuvânt tastat trece prin lexicon și iese pe una din trei uși:
 *
 *  SIGUR      o singură formă posibilă („impartirea" → „împărțirea").
 *             Se aplică pe loc, local, fără rețea. Aici cad ~99% din cuvinte.
 *  NESIGUR    mai multe forme posibile („fata" → fata/fată/fața/față).
 *             Se cere context: întâi modelul local, apoi, dacă nici el nu e
 *             convins, Gemini. Până se lămurește, cuvântul rămâne cum l-ai
 *             scris și primește o subliniere.
 *  NEATINS    nu e în lexicon, e în zonă protejată, sau are deja diacritice.
 *
 * ── Regula care ține editorul cinstit ──────────────────────────────────────
 *
 * NU ATINGEM NICIODATĂ un cuvânt care are deja diacritice.
 *
 * Dacă ai scris „fată", ai vrut „fată" — orice altceva ar însemna un editor
 * care se ceartă cu tine. Singura excepție e cuvântul pe care l-a pus chiar
 * motorul: acela poate fi revizuit când se schimbă propoziția din jur, fiindcă
 * a fost o ghicitură a noastră, nu o decizie a ta. Extensia ține minte ce a
 * scris și îi spune motorului prin `puseDeNoi`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { mascaMdx } from './masca-mdx.mjs';

const AICI = path.dirname(fileURLToPath(import.meta.url));

const SEMNE = new Map(Object.entries({
  ă: 'a', â: 'a', î: 'i', ș: 's', ț: 't',
  Ă: 'A', Â: 'A', Î: 'I', Ș: 'S', Ț: 'T',
  ş: 's', ţ: 't', Ş: 'S', Ţ: 'T',
}));

export function dezbraca(cuvant) {
  let iesire = '';
  for (const litera of cuvant) iesire += SEMNE.get(litera) ?? litera;
  return iesire;
}

/** Are cuvântul măcar un semn românesc? Dacă da, e scris deliberat. */
export function areDiacritice(cuvant) {
  for (const litera of cuvant) if (SEMNE.has(litera)) return true;
  return false;
}

const CUVANT = /[a-zA-ZăâîșțĂÂÎȘȚşţŞŢ]+(?:[-'’][a-zA-ZăâîșțĂÂÎȘȚşţŞŢ]+)*/gu;

/**
 * Lexiconul, căutat binar direct în octeții fișierului.
 *
 * Fișierul e sortat pe octeți la construcție tocmai ca să putem face asta fără
 * să-l despachetăm. Un `Map` cu 335.000 de chei ar cere 150–200 MB în procesul
 * de extensie și câteva sute de milisecunde la fiecare pornire a editorului;
 * `Buffer`-ul costă 8 MB și se citește instantaneu.
 */
export class Lexicon {
  constructor(continut) {
    this.date = Buffer.isBuffer(continut) ? continut : Buffer.from(continut, 'utf8');
    this.inceputuri = this.#indexeazaLiniile();
  }

  static dinFisier(cale = path.join(AICI, 'date', 'lexicon.txt')) {
    return new Lexicon(fs.readFileSync(cale));
  }

  /**
   * Pozițiile de început ale liniilor, într-un `Int32Array`.
   *
   * Fără index, o căutare binară pe octeți trebuie ca după fiecare săritură la
   * mijloc să caute înapoi delimitatorul de linie — muncă în plus la fiecare
   * pas și, mai rău, cod ușor de greșit la capete. Indexul se face o dată, în
   * câteva zeci de milisecunde, și costă 4 octeți pe linie.
   */
  #indexeazaLiniile() {
    const inceputuri = [0];
    for (let i = 0; i < this.date.length; i++) {
      if (this.date[i] === 10 && i + 1 < this.date.length) inceputuri.push(i + 1);
    }
    return Int32Array.from(inceputuri);
  }

  #linie(pozitie) {
    const start = this.inceputuri[pozitie];
    const sfarsit = pozitie + 1 < this.inceputuri.length ? this.inceputuri[pozitie + 1] - 1 : this.date.length;
    return this.date.subarray(start, sfarsit);
  }

  /** Formele posibile pentru o cheie dezbrăcată, sau `null` dacă n-o știm. */
  formele(cheie) {
    const cautat = Buffer.from(cheie, 'utf8');
    let jos = 0;
    let sus = this.inceputuri.length - 1;

    while (jos <= sus) {
      const mijloc = (jos + sus) >> 1;
      const linie = this.#linie(mijloc);
      const tab = linie.indexOf(9);
      if (tab === -1) { jos = mijloc + 1; continue; }

      const comparatie = Buffer.compare(linie.subarray(0, tab), cautat);
      if (comparatie === 0) return linie.subarray(tab + 1).toString('utf8').split('|');
      if (comparatie < 0) jos = mijloc + 1;
      else sus = mijloc - 1;
    }

    return null;
  }
}

/**
 * Pune pe formă majuscula cuvântului tastat.
 *
 * Lexiconul ține totul cu minuscule, ca „Față" și „față" să nu fie două
 * variante între care ar trebui ales ceva. Majuscula se reașază aici, după
 * tiparul scris de om: „Fata" → „Fată", „FATA" → „FATĂ".
 */
export function potrivesteMajuscula(tastat, forma) {
  if (tastat === tastat.toLowerCase()) return forma;
  if (tastat === tastat.toUpperCase() && tastat.length > 1) return forma.toUpperCase();
  return forma[0].toUpperCase() + forma.slice(1);
}

/** Cuvintele de proză ale textului, cu poziția lor, sărind zonele protejate. */
export function tokenizeaza(text, masca = mascaMdx(text)) {
  const bucati = [];
  for (const gasit of text.matchAll(CUVANT)) {
    const start = gasit.index;
    const sfarsit = start + gasit[0].length;
    if (masca[start] || masca[sfarsit - 1]) continue;
    bucati.push({ text: gasit[0], start, sfarsit });
  }
  return bucati;
}

/**
 * Ruperea în propoziții, ca unitate de context.
 *
 * Contextul trimis la dezambiguizare e propoziția, nu paragraful și nu rândul.
 * Paragraful ar fi risipă — costă tokeni și amestecă fraze care n-au legătură.
 * Rândul ar fi prea puțin: în MDX o frază se rupe des pe mai multe rânduri, iar
 * „fata" de la capătul unui rând își are verbul pe rândul următor.
 */
export function propozitii(bucati, text) {
  const grupuri = [];
  let curent = [];

  for (let i = 0; i < bucati.length; i++) {
    curent.push(bucati[i]);
    const urmator = bucati[i + 1];
    const intre = urmator ? text.slice(bucati[i].sfarsit, urmator.start) : '';
    if (!urmator || /[.!?]|\n\s*\n/.test(intre)) {
      grupuri.push(curent);
      curent = [];
    }
  }

  if (curent.length) grupuri.push(curent);
  return grupuri;
}

export const SIGUR = 'sigur';
export const NESIGUR = 'nesigur';

/**
 * Analizează un text și întoarce ce se poate schimba.
 *
 * `puseDeNoi` e o mulțime de poziții de start pe care motorul le-a scris el
 * însuși mai devreme; doar acelea pot fi rescrise deși au deja diacritice.
 */
export function analizeaza(text, { lexicon, puseDeNoi = new Set() } = {}) {
  const masca = mascaMdx(text);
  const bucati = tokenizeaza(text, masca);

  const sigure = [];
  const nesigure = [];

  for (const bucata of bucati) {
    const alNostru = puseDeNoi.has(bucata.start);
    if (areDiacritice(bucata.text) && !alNostru) continue;

    const tastat = alNostru ? dezbraca(bucata.text) : bucata.text;
    const forme = lexicon.formele(tastat.toLowerCase());
    if (!forme) continue;

    const variante = forme.map((forma) => potrivesteMajuscula(tastat, forma));

    if (variante.length === 1) {
      if (variante[0] !== bucata.text) {
        sigure.push({ ...bucata, fel: SIGUR, propunere: variante[0] });
      }
      continue;
    }

    // Cuvântul tastat e el însuși una dintre variante: nu-l atingem până nu
    // avem context care să spună altceva.
    nesigure.push({ ...bucata, fel: NESIGUR, variante, tastat });
  }

  return { sigure, nesigure, bucati, masca };
}

/**
 * Aplică o listă de schimbări peste text, de la coadă spre cap.
 *
 * De la coadă, ca pozițiile celor nefăcute încă să rămână valabile: dacă am
 * merge de la început, prima înlocuire care schimbă lungimea (și „impartire" →
 * „împărțire" chiar o schimbă, în octeți) ar muta tot ce urmează.
 */
export function aplica(text, schimbari) {
  let iesire = text;
  for (const schimbare of [...schimbari].sort((a, b) => b.start - a.start)) {
    iesire = iesire.slice(0, schimbare.start) + schimbare.propunere + iesire.slice(schimbare.sfarsit);
  }
  return iesire;
}
