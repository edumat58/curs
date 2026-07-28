/**
 * Potrivirea dintre ce se rostește și ce se vede pe pagină.
 *
 * Serviciul întoarce, pe lângă audio, granițele fiecărei propoziții — momentul
 * exact în care începe și se termină. Ce lipsește e cealaltă jumătate: DESPRE
 * CE vorbește propoziția asta. Aici o aflăm.
 *
 * Nu întrebăm modelul. Ar fi mai precis, dar ar costa încă o trecere de LLM pe
 * fiecare explicație, exact pe bugetul care oricum e limitat pe zi — și ar
 * trebui regenerat tot ce există deja. Potrivirea se face din text, local, în
 * câteva milisecunde, și merge și pentru explicațiile generate demult.
 *
 * Două lucruri fac potrivirea lexicală să meargă aici, unde în general nu ar
 * merge:
 *
 * 1. NUMERELE. Explicația are voie să folosească doar valorile din material —
 *    asta o impune garda de fidelitate. Deci un „37540" din explicație vine
 *    aproape sigur din blocul care conține „37540". E cel mai tare indiciu pe
 *    care îl avem, și e gratuit.
 *
 * 2. ORDINEA. Promptul cere explicit parcurgerea materialului în ordinea lui.
 *    Deci potrivirea poate fi impusă MONOTONĂ: propoziția a cincea nu poate
 *    trimite la un bloc dinaintea celui al propoziției a patra. Asta elimină
 *    exact greșelile pe care le-ar face o potrivire pur lexicală — două
 *    paragrafe care vorbesc despre același lucru nu mai pot fi confundate,
 *    pentru că doar unul e la rând.
 */

/** Cuvinte prea comune ca să însemne ceva la potrivire. */
const CUVINTE_GOALE = new Set([
  'este', 'sunt', 'care', 'acest', 'această', 'aceste', 'acesta', 'pentru',
  'dintr', 'dintre', 'atunci', 'adică', 'astfel', 'deci', 'foarte', 'poate',
  'avem', 'putem', 'trebuie', 'cand', 'când', 'daca', 'dacă', 'toate', 'fiecare',
  'numar', 'număr', 'numarul', 'numărul', 'exemplu', 'exemplul', 'parte', 'partea',
]);

/** Un număr valorează cât trei cuvinte: e cel mai sigur indiciu de proveniență. */
const GREUTATE_NUMAR = 3;
/** Sub pragul ăsta, potrivirea e zgomot — propoziția continuă blocul anterior. */
const PRAG_POTRIVIRE = 0.12;

function normalizeaza(text) {
  return String(text || '').toLocaleLowerCase('ro').replace(/\s+/g, ' ').trim();
}

/** Semnele din care se compune „despre ce e vorba": cuvinte lungi și numere. */
export function semne(text) {
  const t = normalizeaza(text);
  const set = new Map();
  for (const m of t.matchAll(/\d+(?:[.,]\d+)?/g)) {
    const cheie = `#${m[0].replace(',', '.')}`;
    set.set(cheie, GREUTATE_NUMAR);
  }
  for (const m of t.matchAll(/[a-zăâîșț]{4,}/g)) {
    if (!CUVINTE_GOALE.has(m[0])) set.set(m[0], 1);
  }
  return set;
}

function potrivire(semneleFrazei, semneleBlocului) {
  if (!semneleFrazei.size || !semneleBlocului.size) return 0;
  let comun = 0;
  let total = 0;
  for (const [cheie, greutate] of semneleFrazei) {
    total += greutate;
    if (semneleBlocului.has(cheie)) comun += greutate;
  }
  return total ? comun / total : 0;
}

/**
 * Împarte transcriptul în propoziții.
 *
 * Trebuie să dea ACELAȘI număr de bucăți ca sinteza, altfel timpii nu se mai
 * potrivesc cu textul. Piper taie pe sfârșit de propoziție — punct, semnul
 * întrebării, semnul exclamării — nu pe virgulă sau punct și virgulă, deci
 * împărțim la fel.
 */
export function imparteFraze(text) {
  return String(text || '')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Blocurile din pagină la care se poate trimite.
 *
 * Un „bloc" e cea mai mică bucată pe care are sens să o luminezi: un paragraf,
 * un element de listă, o formulă afișată, o figură. Nu coborâm mai jos —
 * evidențierea cuvânt cu cuvânt ar tremura și ar obosi exact elevii pentru care
 * e făcută funcția.
 */
const SELECTOR_BLOC = 'p, li, blockquote, pre, table, figure, svg, img, .katex-display, .admonition';

/**
 * Blocurile unei singure secțiuni.
 *
 * O secțiune nu e un subarbore, ci un INTERVAL: tot ce urmează după titlul ei,
 * până la titlul următor de rang egal sau mai mare. De aceea nu se poate folosi
 * `querySelectorAll` pe un element părinte — nu există un asemenea element.
 */
export function adunaBlocuriSectiune(headingElement) {
  if (!headingElement) return [];
  const rang = Number(headingElement.tagName.slice(1)) || 6;
  const bucata = [];
  let nod = headingElement.nextElementSibling;
  while (nod) {
    const potrivireTitlu = /^H([1-6])$/.exec(nod.tagName || '');
    if (potrivireTitlu && Number(potrivireTitlu[1]) <= rang) break;
    bucata.push(nod);
    nod = nod.nextElementSibling;
  }
  // Un container fals ne lasă să refolosim exact aceeași logică de filtrare.
  const gazda = { querySelectorAll: (sel) => bucata.flatMap(
    (el) => [...(el.matches && el.matches(sel) ? [el] : []), ...el.querySelectorAll(sel)]
  ) };
  return adunaBlocuri(gazda);
}

export function adunaBlocuri(root) {
  if (!root) return [];
  const selector = SELECTOR_BLOC;
  const brute = Array.from(root.querySelectorAll(selector));
  const blocuri = [];

  for (const el of brute) {
    // Sărim peste ce e deja al nostru sau invizibil.
    if (el.closest('[data-edupasi-voice-panel], [data-edupasi-lesson-voice]')) continue;
    // Un paragraf dintr-o casetă păstrează caseta ca bloc, nu ambele: altfel
    // aceeași informație ar apărea de două ori și potrivirea s-ar împărți.
    if (blocuri.some((b) => b.el.contains(el))) continue;

    const esteVizual = /^(svg|img)$/i.test(el.tagName);
    const text = esteVizual
      ? [el.getAttribute('alt'), el.getAttribute('aria-label'),
        Array.from(el.querySelectorAll('text')).map((t) => t.textContent).join(' ')]
        .filter(Boolean).join(' ')
      : el.textContent;

    const curat = normalizeaza(text);
    if (!esteVizual && curat.length < 12) continue;
    blocuri.push({ el, text: curat, semne: semne(curat), vizual: esteVizual });
  }
  return blocuri;
}

/**
 * Aliniere monotonă frază → bloc, prin programare dinamică.
 *
 * `best[j]` = cel mai bun scor cumulat dacă fraza curentă se oprește la blocul
 * `j`. Fiind monoton, fraza următoare poate porni doar de la `j` încolo, ceea ce
 * se rezolvă cu un maxim prefix — deci costul e O(fraze × blocuri), nu pătratic
 * în blocuri.
 *
 * @returns {number[]} indicele blocului pentru fiecare frază, sau -1.
 */
export function aliniaza(fraze, blocuri) {
  if (!fraze.length || !blocuri.length) return fraze.map(() => -1);

  const n = fraze.length;
  const m = blocuri.length;
  const semneleFrazelor = fraze.map((f) => semne(f));

  const scor = Array.from({ length: n }, (_, i) =>
    blocuri.map((b) => potrivire(semneleFrazelor[i], b.semne))
  );

  const best = Array.from({ length: n }, () => new Array(m).fill(-Infinity));
  const dinCare = Array.from({ length: n }, () => new Array(m).fill(-1));

  for (let j = 0; j < m; j += 1) best[0][j] = scor[0][j];

  for (let i = 1; i < n; i += 1) {
    let maxPrefix = -Infinity;
    let argPrefix = -1;
    for (let j = 0; j < m; j += 1) {
      if (best[i - 1][j] > maxPrefix) {
        maxPrefix = best[i - 1][j];
        argPrefix = j;
      }
      best[i][j] = scor[i][j] + maxPrefix;
      dinCare[i][j] = argPrefix;
    }
  }

  let capat = 0;
  for (let j = 1; j < m; j += 1) if (best[n - 1][j] > best[n - 1][capat]) capat = j;

  const drum = new Array(n);
  for (let i = n - 1; i >= 0; i -= 1) {
    drum[i] = capat;
    capat = i > 0 ? dinCare[i][capat] : capat;
  }

  /**
   * O frază care nu seamănă cu nimic nu inventează o țintă: rămâne pe blocul
   * frazei dinainte. E cazul tranzițiilor („Hai să vedem mai departe") și al
   * reformulărilor, care vorbesc tot despre ce se discuta.
   */
  return drum.map((j, i) => (scor[i][j] >= PRAG_POTRIVIRE ? j : -1));
}

/**
 * Timpii fiecărei fraze.
 *
 * Explicațiile generate înainte ca sinteza să salveze granițele nu au timpi
 * reali. Atunci îi estimăm din lungimea frazelor — rostirea e aproximativ
 * proporțională cu numărul de caractere. Se dezaliniază puțin spre final, dar e
 * mult mai bine decât nimic, iar la prima resinteză devin exacți.
 */
export function timpiFraze(fraze, sentences, durataTotala) {
  if (Array.isArray(sentences) && sentences.length === fraze.length) return sentences;

  const lungimi = fraze.map((f) => Math.max(1, f.length));
  const total = lungimi.reduce((a, b) => a + b, 0);
  let cursor = 0;
  return lungimi.map((len) => {
    const start = (cursor / total) * durataTotala;
    cursor += len;
    return { start, end: (cursor / total) * durataTotala, estimat: true };
  });
}

/** Care frază se rostește la secunda dată. */
export function frazaLaMoment(timpi, secunda) {
  for (let i = 0; i < timpi.length; i += 1) {
    if (secunda < timpi[i].end) return i;
  }
  return timpi.length - 1;
}
