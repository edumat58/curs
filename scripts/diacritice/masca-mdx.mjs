/**
 * Masca MDX: unde n-avem voie să punem diacritice.
 *
 * Un corector care schimbă litere într-un fișier MDX poate strica pagina în
 * feluri tăcute și urâte: `id="vImpartireCuRest"` devenit „vÎmpărțireCuRest"
 * rupe legătura cu automatismul, `\frac` devenit „frac" cu semne strică
 * formula, iar un `import Katex from …` atins oriunde oprește build-ul
 * Docusaurus cu totul. Așa că înainte de orice atingere marcăm zonele interzise.
 *
 * Rezultatul e un `Uint8Array` cât textul, cu 1 pe fiecare octet protejat.
 * Forma asta — și nu o listă de intervale — pentru că motorul întreabă de mii
 * de ori pe secundă „am voie la poziția asta?", iar un acces în tablou e
 * instantaneu, pe când căutarea într-o listă de intervale nu.
 *
 * ── Ce NU e protejat, deși pare ────────────────────────────────────────────
 *
 * Atributele JSX nu sunt toate la fel. În lecțiile astea, `title` și `subtitle`
 * chiar conțin proză românească:
 *
 *     <Automatism id="vAdunareaFractiilor"
 *                 title="Adunarea și scăderea fracțiilor"
 *                 subtitle="Clasa a V-a · Fracții ordinare" />
 *
 * „Adunarea și scăderea fracțiilor" TREBUIE diacritizat, „vAdunareaFractiilor"
 * TREBUIE lăsat în pace. Deci protejăm eticheta întreagă și apoi RIDICĂM
 * protecția doar de pe valorile atributelor de proză, dintr-o listă albă
 * explicită. Listă albă, nu neagră: un atribut nou și necunoscut e mai bine să
 * rămână neatins decât să fie stricat.
 *
 * Aceeași logică la frontmatter: `title:` și `description:` sunt proză, dar
 * `slug:` și `sidebar_position:` sunt identificatori.
 */

/** Atribute JSX al căror conținut e proză pentru cititor, nu identificator. */
const ATRIBUTE_DE_PROZA = new Set([
  'title', 'subtitle', 'label', 'alt', 'caption', 'description',
  'placeholder', 'heading', 'text', 'eticheta', 'titlu', 'subtitlu',
]);

/** Chei de frontmatter care ajung sub ochii omului, deci vor diacritice. */
const CHEI_DE_PROZA = new Set([
  'title', 'description', 'sidebar_label', 'label', 'keywords',
]);

const PREAMBUL = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

function marcheaza(masca, de_la, pana_la, valoare = 1) {
  const inceput = Math.max(0, de_la);
  const sfarsit = Math.min(masca.length, pana_la);
  for (let i = inceput; i < sfarsit; i++) masca[i] = valoare;
}

/**
 * Frontmatterul: tot blocul e protejat, apoi descoperim valorile cheilor de
 * proză. Delimitatorii `---` rămân protejați, la fel numele cheilor.
 */
function marcheazaPreambulul(text, masca) {
  const potrivire = text.match(PREAMBUL);
  if (!potrivire || potrivire.index !== 0) return;

  marcheaza(masca, 0, potrivire[0].length);

  let cursor = text.indexOf('\n') + 1;
  for (const linie of potrivire[1].split('\n')) {
    const pereche = linie.match(/^([A-Za-z_][\w-]*):[ \t]*(.*)$/);
    if (pereche && CHEI_DE_PROZA.has(pereche[1].toLowerCase())) {
      const start = cursor + linie.indexOf(pereche[2], pereche[1].length + 1);
      if (pereche[2]) marcheaza(masca, start, start + pereche[2].length, 0);
    }
    cursor += linie.length + 1;
  }
}

/** Ridică protecția de pe valorile atributelor de proză dintr-o etichetă JSX. */
function dezvaluieAtributeleDeProza(text, masca, inceputEticheta, sfarsitEticheta) {
  const eticheta = text.slice(inceputEticheta, sfarsitEticheta);
  const atribut = /([A-Za-z_][\w-]*)\s*=\s*"([^"]*)"|([A-Za-z_][\w-]*)\s*=\s*'([^']*)'/g;

  let gasit;
  while ((gasit = atribut.exec(eticheta)) !== null) {
    const nume = (gasit[1] ?? gasit[3]).toLowerCase();
    if (!ATRIBUTE_DE_PROZA.has(nume)) continue;

    const valoare = gasit[2] ?? gasit[4];
    if (!valoare) continue;
    // +1 sare peste ghilimeaua de deschidere, ca ea să rămână protejată.
    const start = inceputEticheta + gasit.index + gasit[0].lastIndexOf(valoare);
    marcheaza(masca, start, start + valoare.length, 0);
  }
}

/**
 * Scanerul principal, o singură trecere, stânga→dreapta, cu stare.
 *
 * De ce nu un teanc de expresii regulate, câte una per construcție: pentru că
 * ele nu știu una de alta. Un `<` dintr-un bloc de cod ar deschide o „etichetă"
 * închisă abia peste zeci de rânduri, iar un `$` dintr-un `` `preț: $5` `` ar
 * deschide o formulă fantomă care înghite jumătate de lecție. Starea trebuie
 * ținută într-un singur loc, iar asta cere un scaner adevărat.
 */
export function mascaMdx(text) {
  const masca = new Uint8Array(text.length);
  marcheazaPreambulul(text, masca);

  let i = 0;
  let inceputDeLinie = true;
  let gardViu = null;   // marcatorul blocului de cod deschis (``` sau ~~~)

  while (i < text.length) {
    const c = text[i];

    if (c === '\n') { inceputDeLinie = true; i++; continue; }

    if (inceputDeLinie) {
      // Spațiile de la începutul liniei nu strică statutul de „început".
      if (c === ' ' || c === '\t') { i++; continue; }

      const restulLiniei = text.slice(i, text.indexOf('\n', i) === -1 ? text.length : text.indexOf('\n', i));

      const gard = restulLiniei.match(/^(`{3,}|~{3,})/);
      if (gard) {
        const sfarsit = i + restulLiniei.length;
        marcheaza(masca, i, sfarsit);
        // Același marcator închide blocul; unul diferit e doar text în el.
        if (!gardViu) gardViu = gard[1][0];
        else if (gardViu === gard[1][0]) gardViu = null;
        i = sfarsit;
        inceputDeLinie = false;
        continue;
      }

      if (gardViu) {
        marcheaza(masca, i, i + restulLiniei.length);
        i += restulLiniei.length;
        inceputDeLinie = false;
        continue;
      }

      // `import … from …` / `export const …`: cod JavaScript, nu proză.
      if (/^(?:import|export)\s/.test(restulLiniei)) {
        marcheaza(masca, i, i + restulLiniei.length);
        i += restulLiniei.length;
        inceputDeLinie = false;
        continue;
      }

      inceputDeLinie = false;
    }

    if (gardViu) { i++; continue; }

    // Escapare: `\$`, `\<`, `\`` — caracterul următor e literal, nu deschide nimic.
    if (c === '\\' && i + 1 < text.length) { marcheaza(masca, i, i + 2); i += 2; continue; }

    if (c === '`') {
      const lungime = /^`+/.exec(text.slice(i))[0].length;
      const inchidere = text.indexOf('`'.repeat(lungime), i + lungime);
      const sfarsit = inchidere === -1 ? text.length : inchidere + lungime;
      marcheaza(masca, i, sfarsit);
      i = sfarsit;
      continue;
    }

    if (c === '$') {
      const dublu = text.startsWith('$$', i);
      const marcator = dublu ? '$$' : '$';
      const inchidere = text.indexOf(marcator, i + marcator.length);
      const sfarsit = inchidere === -1 ? i + marcator.length : inchidere + marcator.length;
      marcheaza(masca, i, sfarsit);
      i = sfarsit;
      continue;
    }

    if (c === '<') {
      const inchidere = text.indexOf('>', i);
      /*
       * Un `<` fără `>` după el nu e etichetă, e semnul „mai mic decât" dintr-o
       * propoziție („dacă a < b atunci"). Îl lăsăm în pace, altfel am proteja
       * din greșeală tot restul lecției.
       */
      if (inchidere === -1) { i++; continue; }
      const sfarsit = inchidere + 1;
      marcheaza(masca, i, sfarsit);
      dezvaluieAtributeleDeProza(text, masca, i, sfarsit);
      i = sfarsit;
      continue;
    }

    // Expresie MDX `{…}`: JavaScript, chiar dacă stă în mijlocul unei fraze.
    if (c === '{') {
      let adancime = 0;
      let j = i;
      while (j < text.length) {
        if (text[j] === '{') adancime++;
        else if (text[j] === '}' && --adancime === 0) { j++; break; }
        j++;
      }
      marcheaza(masca, i, j);
      i = j;
      continue;
    }

    // Ținta unei legături Markdown: `[text vizibil](adresa-protejată)`.
    if (c === ']' && text[i + 1] === '(') {
      const inchidere = text.indexOf(')', i + 2);
      const sfarsit = inchidere === -1 ? text.length : inchidere + 1;
      marcheaza(masca, i + 1, sfarsit);
      i = sfarsit;
      continue;
    }

    i++;
  }

  // Adrese web scrise pe față, entități HTML: peste tot, inclusiv în proză.
  for (const tipar of [/https?:\/\/\S+/g, /\bwww\.\S+/g, /\S+@\S+\.\w+/g, /&[a-zA-Z]+;|&#\d+;/g]) {
    let gasit;
    while ((gasit = tipar.exec(text)) !== null) {
      marcheaza(masca, gasit.index, gasit.index + gasit[0].length);
    }
  }

  return masca;
}

/** Ajutor pentru teste și depanare: textul cu zonele protejate înlocuite cu „·". */
export function aratraMasca(text) {
  const masca = mascaMdx(text);
  let iesire = '';
  for (let i = 0; i < text.length; i++) {
    iesire += masca[i] && text[i] !== '\n' ? '·' : text[i];
  }
  return iesire;
}
