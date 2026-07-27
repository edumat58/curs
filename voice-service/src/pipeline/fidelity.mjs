/**
 * FidelityGuard — transformă politica „nu inventa" din instrucțiune în verificare.
 *
 * Un prompt poate fi ignorat de model; o verificare nu. După generare, controlăm
 * programatic dacă transcriptul introduce valori numerice care nu există nicăieri
 * în materialul sursă. Am prins astfel, la testele reale, un exemplu inventat
 * („să luăm 3,5") într-o definiție care nu conținea niciun număr.
 *
 * Nu blochează publicarea automat pentru orice abatere: marchează `needsReview`,
 * ca profesorul să decidă. Corectitudinea are prioritate, dar nu cu prețul
 * blocării întregului sistem la o falsă alarmă.
 */

/** Numerele „de discurs" apar firesc în vorbire fără să fie date din lecție. */
const NUMERE_UZUALE = new Set([
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '100', '1000',
]);

const CUVINTE_NUMERE = {
  zero: '0', unu: '1', una: '1', doi: '2', două: '2', trei: '3', patru: '4',
  cinci: '5', șase: '6', sase: '6', șapte: '7', sapte: '7', opt: '8',
  nouă: '9', noua: '9', zece: '10', sută: '100', suta: '100', mie: '1000',
};

function normalizeNumber(value) {
  return String(value).replace(',', '.').replace(/\.0+$/, '').replace(/^0+(?=\d)/, '');
}

/**
 * Vorbirea recompusă în scriere.
 *
 * Modelul rostește zecimalele: „5 virgulă 7". Fără recompunere, garda vedea
 * „5" și „7" separat și declara „7" ca valoare inventată, deși sursa conținea
 * „5,7". Era un fals pozitiv care marca explicații corecte ca halucinații și
 * declanșa reparări inutile.
 */
export function despeakNumbers(text) {
  // Atenție: NU transformăm „minus" în semnul „-". În română „8 minus 3" este
  // o scădere, nu numărul negativ -3; conversia producea fals pozitive.
  return String(text).replace(/(\d+)\s+virgulă\s+(\d+)/gi, '$1,$2');
}

/** Toate numerele dintr-un text, inclusiv cele scrise cu virgulă zecimală. */
function extractNumbers(text) {
  const found = new Set();
  const re = /-?\d+(?:[.,]\d+)?/g;
  let m;
  while ((m = re.exec(despeakNumbers(text))) !== null) found.add(normalizeNumber(m[0]));
  return found;
}

/** Numerele rostite în cuvinte („trei virgulă cinci" → 3, 5). */
function extractSpelledNumbers(text) {
  const found = new Set();
  const words = String(text).toLocaleLowerCase('ro').split(/[^a-zăâîșţțA-Z]+/);
  for (const w of words) {
    if (CUVINTE_NUMERE[w]) found.add(CUVINTE_NUMERE[w]);
  }
  return found;
}

/** Materialul sursă, concatenat — tot ce are voie modelul să folosească. */
function sourceCorpus(section) {
  const parts = [
    section.heading,
    section.lessonTitle,
    section.contentText,
    ...(section.latex || []).map((l) => `${l.source} ${l.spoken || ''}`),
    ...(section.visuals || []).flatMap((v) => [
      v.alt, v.label, v.description,
      ...(v.labels || []),
      v.markup,
    ]),
  ];
  if (section.context) parts.push(section.context.h1, section.context.h2, section.context.h3);
  return parts.filter(Boolean).join(' \n ');
}

/**
 * @returns {{score, needsReview, unsupportedNumbers, notes}}
 */
export function checkFidelity(section, transcript) {
  const corpus = sourceCorpus(section);
  const sourceNumbers = extractNumbers(corpus);
  const spoken = extractSpelledNumbers(transcript);
  const written = extractNumbers(transcript);

  // Comparăm și fără semn: sursa scrie „3 - 8 = -5", iar vorbirea poate
  // produce „-5" sau „5" în funcție de formulare. Semnul nu e o invenție.
  const unsigned = (n) => String(n).replace(/^-/, '');
  const sourceUnsigned = new Set([...sourceNumbers].map(unsigned));

  const candidates = new Set([...written, ...spoken]);
  const unsupported = [...candidates].filter(
    (n) =>
      !sourceNumbers.has(n)
      && !sourceUnsigned.has(unsigned(n))
      && !NUMERE_UZUALE.has(unsigned(n))
  );

  const notes = [];
  if (unsupported.length) {
    notes.push(
      `Transcriptul conține valori care nu apar în material: ${unsupported.join(', ')}.`
    );
  }

  const words = transcript.split(/\s+/).filter(Boolean).length;
  if (words < 15) notes.push('Explicație suspect de scurtă.');

  // Semnale că modelul comentează materialul în loc să predea.
  const metaPhrases = [
    'în această secțiune', 'materialul', 'definiția spune', 'după cum se observă',
    'figura', 'imaginea de mai sus', 'în text scrie',
  ];
  const lower = transcript.toLocaleLowerCase('ro');
  const meta = metaPhrases.filter((p) => lower.includes(p));
  if (meta.length) notes.push(`Formulări meta detectate: ${meta.join(', ')}.`);

  // Scor simplu, transparent — nu o „notă AI", ci penalizări explicite.
  let score = 1;
  score -= Math.min(0.6, unsupported.length * 0.2);
  score -= Math.min(0.2, meta.length * 0.1);
  if (words < 15) score -= 0.2;
  score = Math.max(0, Number(score.toFixed(2)));

  return {
    score,
    needsReview: unsupported.length > 0 || score < 0.8,
    unsupportedNumbers: unsupported,
    metaPhrases: meta,
    notes,
  };
}
