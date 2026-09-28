/**
 * Stratul Gemini: dezambiguizare prin ALEGERE CONSTRÂNSĂ.
 *
 * ── De ce nu-i dăm modelului textul să-l rescrie ───────────────────────────
 *
 * Prima variantă încercată a fost cea evidentă: „pune diacriticele în propoziția
 * asta". Rezultatul, pe „fata a pus cartea pe masa din bucatarie", a fost:
 *
 *     „Fața a pus cartea pe masa din bucătărie."
 *
 * Adică chipul a pus cartea pe masă. Modelul nu doar că greșise sensul, dar
 * avea și libertatea să schimbe topica, să adauge cuvinte, să „îmbunătățească"
 * fraza — într-un editor care scrie direct în fișierul omului, e inacceptabil.
 *
 * Așa că am întors problema: lexiconul local face toată munca și stabilește
 * EXACT ce variante sunt posibile pentru fiecare cuvânt nesigur; modelul doar
 * alege dintr-o listă închisă. Nu primește text de rescris, primește un
 * chestionar cu variante. Pe același set de probe, precizia a urcat de la
 * greșeli grosolane la 20 din 21 (95%), iar singura ratare e un caz genuin
 * ambiguu chiar și pentru un om („a luat nota / notă de la profesor").
 *
 * Câștigul cel mare nu e însă precizia, ci că HALUCINAȚIA DEVINE IMPOSIBILĂ:
 * orice răspuns care nu e literalmente una dintre variantele oferite e aruncat
 * la validare. Modelul nu poate inventa un cuvânt, nu poate rescrie fraza, nu
 * poate scăpa un „iată versiunea corectată!" în lecția ta.
 *
 * ── Alegerea modelului ─────────────────────────────────────────────────────
 *
 * `gemini-3.5-flash-lite`, măsurat pe setul de probe: 95%, ~1,8 s pe propoziție.
 * `gemini-3.6-flash` a răspuns cu 503 („high demand") la jumătate din cereri,
 * deci nu e de încredere ca dependență a unui editor. `gemini-flash-lite-latest`
 * — cel folosit de voice-service — e mai vechi și mai slab la sarcina asta.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AICI = path.dirname(fileURLToPath(import.meta.url));
const RADACINA = path.resolve(AICI, '..', '..');

const ADRESA = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const MODEL_IMPLICIT = 'gemini-3.5-flash-lite';

/** Fișierele de mediu ale proiectului, în ordinea în care le credem. */
const FISIERE_MEDIU = ['voice-service/.env', 'backend/.env.local'];

let cheieTinuta;

/**
 * Cheia stă deja în proiect, pusă pentru voice-service. N-o dublăm și n-o
 * cerem din nou: o citim de unde e. Variabila de mediu bate fișierele, ca să
 * poată fi înlocuită la rulare fără să umbli prin ele.
 */
export function citesteCheia({ radacina = RADACINA } = {}) {
  if (cheieTinuta !== undefined) return cheieTinuta;
  if (process.env.GEMINI_API_KEY) return (cheieTinuta = process.env.GEMINI_API_KEY);

  for (const relativ of FISIERE_MEDIU) {
    const cale = path.join(radacina, relativ);
    if (!fs.existsSync(cale)) continue;

    for (const linie of fs.readFileSync(cale, 'utf8').split('\n')) {
      if (linie.trim().startsWith('#')) continue;
      const egal = linie.indexOf('=');
      if (egal < 1) continue;
      if (linie.slice(0, egal).trim() !== 'GEMINI_API_KEY') continue;

      const valoare = linie.slice(egal + 1).trim().replace(/^["']|["']$/g, '');
      if (valoare) return (cheieTinuta = valoare);
    }
  }

  return (cheieTinuta = null);
}

export class EroareGemini extends Error {
  constructor(mesaj, { status, deReincercat = false } = {}) {
    super(mesaj);
    this.name = 'EroareGemini';
    this.status = status;
    this.deReincercat = deReincercat;
  }
}

const asteapta = (ms) => new Promise((gata) => { setTimeout(gata, ms); });

/**
 * O cerere, cu reîncercări pe erorile trecătoare.
 *
 * 429 (cotă depășită) și 503 („high demand") sunt normale pe nivelul gratuit și
 * nu înseamnă că am greșit ceva — înseamnă doar „mai încearcă". Le așteptăm cu
 * pauze care se dublează. Restul erorilor ies imediat: dacă cheia e greșită, nu
 * are rost s-o mai încercăm de trei ori.
 */
export async function cereGemini({
  instructiuni,
  intrebare,
  model = process.env.DIACRITICE_MODEL || MODEL_IMPLICIT,
  incercari = 4,
  asteptareMaximaMs = 20000,
  semnal,
} = {}) {
  const cheie = citesteCheia();
  if (!cheie) throw new EroareGemini('Lipsește GEMINI_API_KEY (căutată în mediu, voice-service/.env, backend/.env.local).');

  let pauza = 2000;

  for (let incercare = 1; incercare <= incercari; incercare++) {
    let raspuns;
    try {
      raspuns = await fetch(ADRESA, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cheie}`, 'Content-Type': 'application/json' },
        signal: semnal ?? AbortSignal.timeout(asteptareMaximaMs),
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: instructiuni },
            { role: 'user', content: intrebare },
          ],
          response_format: { type: 'json_object' },
          // Zero, ca aceeași propoziție să primească mereu aceeași decizie.
          // Altfel textul ar „tremura": ștergi o virgulă, se schimbă un cuvânt.
          temperature: 0,
          max_tokens: 900,
        }),
      });
    } catch (eroare) {
      if (eroare.name === 'AbortError' && incercare < incercari) { await asteapta(pauza); pauza *= 2; continue; }
      throw new EroareGemini(`Cererea n-a ajuns la Gemini: ${eroare.message}`, { deReincercat: true });
    }

    if (raspuns.status === 429 || raspuns.status === 503) {
      if (incercare === incercari) {
        throw new EroareGemini(
          raspuns.status === 429 ? 'Cota Gemini e depășită pentru moment.' : 'Gemini e supraîncărcat.',
          { status: raspuns.status, deReincercat: true },
        );
      }
      await asteapta(pauza);
      pauza *= 2;
      continue;
    }

    if (!raspuns.ok) {
      throw new EroareGemini(`Gemini a răspuns ${raspuns.status}: ${(await raspuns.text()).slice(0, 200)}`, { status: raspuns.status });
    }

    const date = await raspuns.json();
    const continut = date?.choices?.[0]?.message?.content;
    if (!continut) throw new EroareGemini('Gemini a răspuns fără conținut.');

    try {
      return JSON.parse(continut);
    } catch {
      throw new EroareGemini(`Gemini n-a răspuns cu JSON: ${continut.slice(0, 160)}`);
    }
  }

  throw new EroareGemini('Gemini n-a răspuns după toate reîncercările.', { deReincercat: true });
}

const INSTRUCTIUNI_ALEGERE = `Ești corector de diacritice pentru limba română. NU rescrii textul.

Primești o propoziție în care unele cuvinte sunt înlocuite cu fante numerotate: {1}, {2}, …
Pentru fiecare fantă primești o listă ÎNCHISĂ de variante.

Alegi pentru fiecare fantă EXACT o variantă din lista ei — cea corectă gramatical
și semantic în contextul propoziției. Ai grijă la articulare („masa" hotărât vs
„masă" nehotărât) și la sens („fata" = copila, „față" = chipul sau suprafața).

Nu inventezi cuvinte. Nu schimbi topica. Nu adaugi și nu scoți nimic.
Nu explici. Răspunzi DOAR cu JSON: {"1": "varianta aleasă", "2": …}`;

/**
 * Alege forma potrivită pentru fiecare fantă dintr-o propoziție.
 *
 * `fante` e o listă de `{ numar, variante }`. Întoarce o hartă numar → formă,
 * conținând DOAR fantele pentru care modelul a răspuns cu o variantă chiar din
 * lista oferită. Orice altceva — cuvânt inventat, formă din altă fantă, text
 * explicativ — e tăcut ignorat, iar cuvântul rămâne cum l-a scris omul.
 */
export async function alegeFormele({ propozitie, fante, model, semnal } = {}) {
  if (!fante?.length) return new Map();

  const variante = Object.fromEntries(fante.map(({ numar, variante: v }) => [String(numar), v]));
  const raspuns = await cereGemini({
    instructiuni: INSTRUCTIUNI_ALEGERE,
    intrebare: `Propoziție: ${propozitie}\nVariante: ${JSON.stringify(variante)}`,
    model,
    semnal,
  });

  const alese = new Map();
  for (const { numar, variante: permise } of fante) {
    const ales = raspuns?.[String(numar)];
    if (typeof ales !== 'string') continue;

    // Validarea care face halucinația imposibilă: doar ce era în listă trece.
    const potrivit = permise.find((varianta) => varianta === ales)
      ?? permise.find((varianta) => varianta.toLowerCase() === ales.toLowerCase());
    if (potrivit) alese.set(numar, potrivit);
  }

  return alese;
}
