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

/**
 * Un număr scris românește, adus la o formă unică.
 *
 * Românește punctul GRUPEAZĂ miile și virgula separă zecimalele: „37.540,85"
 * și „37540,85" sunt același număr. Fără regula asta, garda le vedea diferite
 * și acuza explicația că a inventat „37.540" — iar reparările pornite degeaba
 * consumau din bugetul zilnic de tokeni.
 *
 * Punctul se șterge doar când chiar grupează exact trei cifre, ca „0.1" să
 * rămână zecimală, nu să devină „01".
 */
function normalizeNumber(value) {
  return String(value)
    .replace(/(?<=\d)\.(?=\d{3}(?!\d))/g, '')
    .replace(',', '.')
    .replace(/\.0+$/, '')
    .replace(/^0+(?=\d)/, '');
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

/**
 * Toate numerele dintr-un text, inclusiv cele scrise cu virgulă zecimală.
 *
 * Prima alternativă prinde numărul cu mii grupate ÎNTREG („37.540,85"); fără
 * ea, potrivirea lacomă rupea numărul în „37.540" și „85", adică fix invers
 * decât are nevoie comparația.
 */
function extractNumbers(text) {
  const found = new Set();
  const re = /-?\d{1,3}(?:\.\d{3})+(?:,\d+)?|-?\d+(?:[.,]\d+)?/g;
  let m;
  const normalizat = lipesteMii(despeakNumbers(text));
  while ((m = re.exec(normalizat)) !== null) found.add(normalizeNumber(m[0]));
  return found;
}

/**
 * Miile despărțite prin spațiu, lipite — pe AMBELE părți ale comparației.
 *
 * Modelul scrie „2 360" acolo unde sursa are `2\,360`. Extractorul vedea „2" și
 * „360", iar „360" era raportat ca valoare inventată. Sinteza nu are nicio
 * problemă cu forma asta — verificat pe Piper, „37 540,85" și „37540,85" dau
 * exact aceleași foneme — deci nu textul rostit trebuie schimbat, ci felul în
 * care garda citește numerele. Aplicând regula identic pe sursă și pe
 * transcript, o eventuală lipire greșită („2 100 de elevi") nu creează
 * diferență între ele, deci nu poate produce o alarmă falsă.
 */
function lipesteMii(text) {
  // Spațiile se scriu cu cod: îngustul (U+202F) și cel neîntrerupt (U+00A0) nu
  // se disting cu ochiul de spațiul obișnuit într-un fișier sursă.
  return String(text).replace(/(?<=\d)[ \t\u00A0\u202F\u2009](?=\d{3}(?!\d))/g, '');
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

/**
 * Formulările care trădează că modelul vorbește DESPRE lecție, nu o predă.
 *
 * Sunt tipare, nu cuvinte izolate, și diferența contează. „Figură" e termen de
 * manual („figuri geometrice plane"), la fel „imagine" sau „material didactic";
 * a le interzice ca simple cuvinte ar tăia exact vocabularul corect al lecției.
 * Ce nu are voie să apară e REFERIREA la suport — „figura de mai jos", „ce
 * arată imaginea" — și, mai ales, JUDECATA despre el.
 *
 * Lista a pornit de la un transcript real: „Figura arată o reprezentare grafică
 * a acestei despărțiri, deși nu explică în detaliu legătura cu definiția."
 * Două greșeli într-o singură frază — vorbește despre desen și îl și critică.
 *
 * Marginile de cuvânt sunt scrise cu `\p{L}`, nu cu `\b`. În JavaScript, `\b`
 * cunoaște doar literele ASCII, așa că „închei" nu are graniță de cuvânt la
 * început și „sper că" nu are la sfârșit: tiparele scrise cu `\b` nu se
 * potriveau niciodată tocmai pe cuvintele românești, adică pe toate cele care
 * contau aici.
 */
const M0 = '(?<![\\p{L}\\d])';
const M1 = '(?![\\p{L}\\d])';
const tipar = (source, label) => [new RegExp(source, 'iu'), label];

const FORMULARI_META = [
  // Referiri la suport
  tipar(`${M0}(figura|imaginea|desenul|schema|graficul|tabelul|formula|definiția|materialul|textul|secțiunea|lecția)\\s+(de mai (jos|sus)|din (material|lecție|secțiune|text))`, 'trimitere la suport'),
  // Formele nearticulate („acest tabel", „această schemă") intră și ele: modelul
  // le prefera exact acolo unde comenta suportul.
  tipar(`${M0}((acest|această|acel|acea)\\s+)?(tabel|tabelul|figura|imaginea|desenul|schema|graficul|formula|definiția|materialul|textul)\\s+(arată|ne arată|prezintă|indică|spune|ne spune|conține|scrie|explică|ilustrează)${M1}`, 'vorbește despre suport'),
  /**
   * Aceleași referiri, dar cu cuvinte între suport și verb.
   *
   * Tiparul de deasupra cere „formula arată" lipite. Modelul scrie însă
   * „O formulă care reprezintă un exemplu de număr zecimal arată astfel." —
   * aceeași abatere, cu șase cuvinte la mijloc, și trecea nestingherită. Așa a
   * ajuns în audio o explicație care anunța trei formule fără să spună ce e în
   * ele. Golul e mărginit și oprit la punctuație, ca să nu lege două fraze
   * diferite într-o falsă potrivire.
   */
  tipar(`${M0}(o |un |această |acest |acea |acel |prima |a doua |a treia |altă |alt |următoarea |următorul )?\\s*(formulă|formula|figură|figura|imagine|imaginea|desen|desenul|schemă|schema|grafic|graficul|tabel|tabelul)(?![\\p{L}])[^.!?]{0,60}?\\s(arată|ne arată|prezintă|ne prezintă|indică|ne indică|ilustrează|reprezintă|conține|scrie)${M1}`, 'vorbește despre suport'),
  /**
   * „Arată astfel" e trimitere la ceva ce elevul ar trebui să VADĂ — exact ce
   * nu are cum, ascultând. Fără continuare, fraza nu transmite nimic.
   */
  tipar(`${M0}(arată|se prezintă|se scrie|se reprezintă) (astfel|așa|în felul următor|în felul acesta)${M1}`, 'trimite la ce se vede'),
  /**
   * Exemplul se PARCURGE, nu se anunță. „Exemplul ne arată cum se efectuează
   * operația" ocupă locul calculului, fără să spună niciun număr.
   */
  tipar(`${M0}(exemplul|exemplele|exercițiul)(?![\\p{L}])[^.!?]{0,50}?\\s(ne arată|ne indică|ne prezintă|ne spune|arată cum|ilustrează)${M1}`, 'anunță exemplul în loc să îl facă'),
  tipar(`${M0}(în|din) (această|acest|acea|acel) (secțiune|material|lecție|text|paragraf|imagine|figură)${M1}`, 'se referă la secțiune'),
  // „secțiune" simplu lipsește dinadins din lista de mai jos: „secțiunea axială
  // a unui con" e geometrie curată, iar o falsă alarmă acolo ar cere o
  // rescriere degeaba.
  tipar(`${M0}(în|din) (material|materialul|lecție|lecția|text|textul|enunț|enunțul)${M1}`, 'se referă la material'),
  tipar(`${M0}după cum (se observă|se vede|vezi|arată)${M1}`, 'formulare de manual'),
  tipar(`${M0}(materialul|enunțul) (nostru|acesta|ăsta)${M1}`, 'vorbește despre material'),
  // Evaluarea materialului — interzisă indiferent de formulare.
  // Lookbehind-ul scoate adresarea către elev: „dacă nu îți este clar, reia" e
  // pedagogie, nu verdict despre lecție.
  tipar(`${M0}(?<!îți |ți-|vi )nu (este|e|sunt) (foarte |prea |chiar )?(bine|bun|bună|clar|clară|complet|completă|explicat|explicată|detaliat|detaliată)${M1}`, 'evaluează materialul'),
  tipar(`${M0}(deși|dar) nu (explică|arată|spune|precizează|detaliază)${M1}`, 'critică materialul'),
  /**
   * „Lipsește" se raportează DOAR când lipsește ceva din lecție.
   *
   * Prima formă a tiparului prindea cuvântul singur și a oprit o explicație
   * corectă: „dacă la sfârșitul părții zecimale lipsesc cifre, adăugăm zerouri"
   * — matematică curată. A costat două rescrieri degeaba, iar textul final tot
   * era marcat. Ce lipsește dintr-un număr e conținut; ce lipsește din material
   * e o reclamație.
   */
  tipar(`${M0}(lipsește|lipsesc)[^.!?]{0,40}(din (material|lecție|text|enunț)|explicaț|informaț|precizare|detali)`, 'reclamă ce lipsește din lecție'),
  tipar(`${M0}(ar fi trebuit să|ar trebui să conțină|nu se precizează|nu se explică|nu ni se spune)${M1}`, 'reclamă ce lipsește din lecție'),
  // Modelul se povestește pe sine
  tipar(`${M0}(am parcurs|am explicat|am arătat|am acoperit|am prezentat)${M1}`, 'își narează propria explicație'),
  tipar(`${M0}(închei|sper că|sperăm că|în cele ce urmează|în concluzie, am)${M1}`, 'încheiere despre sine'),
];

/** @returns {string[]} descrierea fiecărei formulări găsite, cu citatul ei. */
export function detectMetaPhrases(transcript) {
  const text = String(transcript || '');
  const found = [];
  for (const [pattern, label] of FORMULARI_META) {
    const match = pattern.exec(text);
    if (match) found.push(`${label} („${match[0].trim()}")`);
  }
  return found;
}

/**
 * Materialul sursă, concatenat — tot ce are voie modelul să folosească.
 *
 * `sourceCode` intră în corpus pentru că a devenit materialul PRINCIPAL: de
 * când modelul primește codul lecției, acolo scriu numerele. Fără el, garda
 * compara explicația cu o sursă mai săracă decât cea citită de model și
 * declara inventat tot ce venea din cod.
 */
function sourceCorpus(section) {
  const parts = [
    section.heading,
    section.lessonTitle,
    section.sourceCode,
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
 * Numerele din sursă se citesc DUPĂ ce notația LaTeX e desfăcută.
 *
 * În fișier scrie `37\,540{,}85`; extractorul vedea acolo trei numere fără
 * legătură — 37, 540, 85 — și niciodată 37540 sau 37540,85. Explicația, care
 * spunea corect „37540,85", era acuzată că inventează. Măsurat pe lecția
 * „Scrierea sub formă zecimală": 5 valori reale marcate ca inventate, scor 0,4,
 * două rescrieri cerute degeaba, fiecare pe bugetul de tokeni al zilei.
 */
function faraNotatie(text) {
  return String(text)
    .replace(/\\[,;:!]/g, '')
    .replace(/\{\s*,\s*\}/g, ',')
    .replace(/\\(?:text|textrm|mathrm|mathbf|mathit|operatorname)\s*\{([^{}]*)\}/g, '$1')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[{}$]/g, ' ');
}

/**
 * @returns {{score, needsReview, unsupportedNumbers, notes}}
 */
export function checkFidelity(section, transcript) {
  const corpus = faraNotatie(sourceCorpus(section));
  const sourceNumbers = extractNumbers(corpus);
  const spoken = extractSpelledNumbers(transcript);
  const written = extractNumbers(transcript);

  // Comparăm și fără semn: sursa scrie „3 - 8 = -5", iar vorbirea poate
  // produce „-5" sau „5" în funcție de formulare. Semnul nu e o invenție.
  const unsigned = (n) => String(n).replace(/^-/, '');
  const supported = new Set();
  for (const value of sourceNumbers) {
    supported.add(value);
    supported.add(unsigned(value));
    /**
     * Bucățile unui număr zecimal din sursă sunt tot din sursă.
     *
     * Exact asta face lecția: „37540,85 are partea întreagă 37540 și partea
     * fracționară 85". Fără regula asta, garda vedea „37540" ca valoare
     * inventată și cerea rescrierea unei explicații perfect corecte — adică
     * pedepsea fix comportamentul pe care îl cerem.
     */
    const parts = /^(-?\d+)\.(\d+)$/.exec(value);
    if (parts) {
      supported.add(unsigned(parts[1]));
      supported.add(parts[2].replace(/^0+(?=\d)/, ''));
    }
  }

  const candidates = new Set([...written, ...spoken]);
  const unsupported = [...candidates].filter(
    (n) => !supported.has(n) && !supported.has(unsigned(n)) && !NUMERE_UZUALE.has(unsigned(n))
  );

  const notes = [];
  if (unsupported.length) {
    notes.push(
      `Transcriptul conține valori care nu apar în material: ${unsupported.join(', ')}.`
    );
  }

  const words = transcript.split(/\s+/).filter(Boolean).length;
  if (words < 15) notes.push('Explicație suspect de scurtă.');

  const meta = detectMetaPhrases(transcript);
  if (meta.length) notes.push(`Formulări despre material, nu despre matematică: ${meta.join('; ')}.`);

  // Scor simplu, transparent — nu o „notă AI", ci penalizări explicite.
  let score = 1;
  score -= Math.min(0.6, unsupported.length * 0.2);
  score -= Math.min(0.4, meta.length * 0.2);
  if (words < 15) score -= 0.2;
  score = Math.max(0, Number(score.toFixed(2)));

  return {
    score,
    needsReview: unsupported.length > 0 || meta.length > 0 || score < 0.8,
    unsupportedNumbers: unsupported,
    metaPhrases: meta,
    notes,
  };
}
