/**
 * Judecata locală: alege între forme ambigue după vecinii lor, fără rețea.
 *
 * Rolul ei nu e să fie deșteaptă, ci RAPIDĂ ȘI ONESTĂ. Rezolvă tăcut cazurile
 * limpezi ca să nu ajungă la Gemini, și recunoaște deschis când nu știe.
 * Fiecare cuvânt pe care-l lămurește aici e o cerere de rețea economisită și o
 * corectură care apare instantaneu, nu peste o secundă și jumătate.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AICI = path.dirname(fileURLToPath(import.meta.url));

/**
 * Cât de mult trebuie să bată fruntașa pe următoarea ca s-o credem.
 *
 * Șaizeci la unu — absurd de sus la prima vedere, dar măsurat. Proba pe cele
 * 56.290 de cuvinte de proză din lecții, cu praguri crescătoare:
 *
 *     prag   rezolvate   stricate
 *        3      16.887        136
 *        8      16.270         68
 *       15      15.826         38
 *       30      15.287         25
 *       60      14.704         14   ← ales
 *      120      14.206         11
 *
 * La prag 3 modelul rezolvă cu 2.183 de cuvinte mai mult decât la 60, dar
 * strică de zece ori mai des — și strică fix unde e mai supărător: „sumă" →
 * „suma", „rază" → „raza", adică distincția articulat/nearticulat, exact
 * lucrul pe care un model de bigrame dintr-un corpus mic n-are cum să-l
 * priceapă. Din cele 14 rămase la prag 60, nouă sunt de fapt corecturi
 * („Nemarginită" → „Nemărginită"); greșeli adevărate rămân cinci, adică una la
 * 11.000 de cuvinte.
 *
 * Ce nu rezolvă modelul local nu se pierde: merge la Gemini, care judecă
 * sensul în loc să numere vecini. Modelul local e aici doar ca să nu ajungă
 * FIECARE propoziție pe rețea, nu ca să înlocuiască judecata.
 */
const PRAG_INCREDERE = Number(process.env.DIACRITICE_PRAG) || 60;

/** Netezire: o formă nevăzută niciodată nu primește scor zero, ci foarte mic. */
const NETEZIRE = 0.35;

export class Context {
  constructor(model) {
    this.forme = model?.forme ?? {};
    this.stanga = model?.stanga ?? {};
    this.dreapta = model?.dreapta ?? {};
  }

  static dinFisier(cale = path.join(AICI, 'date', 'context.json')) {
    if (!fs.existsSync(cale)) return new Context(null);
    return new Context(JSON.parse(fs.readFileSync(cale, 'utf8')));
  }

  /**
   * Scorul unei forme în contextul dat. Vecinii cântăresc mai mult decât
   * popularitatea formei în sine: „o masă" trebuie să bată faptul că „masa"
   * e, luat singur, mai des scris.
   */
  #scor(forma, vecinStanga, vecinDreapta) {
    const cheieMinuscula = forma.toLowerCase();
    const laStanga = this.stanga[`${vecinStanga} ${cheieMinuscula}`] ?? 0;
    const laDreapta = this.dreapta[`${cheieMinuscula} ${vecinDreapta}`] ?? 0;
    const singura = this.forme[cheieMinuscula] ?? 0;

    return (laStanga + NETEZIRE) * (laDreapta + NETEZIRE) * (1 + Math.log1p(singura));
  }

  /**
   * Alege o formă, sau `null` dacă nu e destul de sigură.
   *
   * `null` nu e eșec, e răspunsul corect când datele nu ajung: peste el vine
   * Gemini, iar dacă nici el nu e disponibil, cuvântul rămâne cum l-a scris
   * omul și primește o subliniere.
   */
  alege(variante, { vecinStanga = '‹', vecinDreapta = '›' } = {}) {
    if (!variante?.length) return null;
    if (variante.length === 1) return variante[0];

    const scoruri = variante
      .map((forma) => ({ forma, scor: this.#scor(forma, vecinStanga, vecinDreapta) }))
      .sort((a, b) => b.scor - a.scor);

    const [primul, alDoilea] = scoruri;
    if (primul.scor < alDoilea.scor * PRAG_INCREDERE) return null;

    // Un scor compus numai din netezire înseamnă că n-am văzut nimic relevant.
    if (primul.scor <= NETEZIRE * NETEZIRE) return null;

    return primul.forma;
  }
}
