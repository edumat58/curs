/**
 * Pipeline-ul de explicație: o singură trecere de narațiune → verificare.
 * Nu știe nimic despre HTTP, MongoDB sau furnizorul concret de LLM.
 */
import {
  buildNarrationPrompt,
  bugetSursaCaractere,
  esteLectieIntreaga,
  imparteLectia,
  speechBudget,
  PROMPT_VERSION,
  curataSursa,
} from './prompts.mjs';
import { checkFidelity } from './fidelity.mjs';
import { toSpeakable } from './speakable.mjs';

/** Modelele mai adaugă uneori ```json în jurul răspunsului. */
// eslint-disable-next-line no-unused-vars
function parseJsonLoose(raw) {
  const trimmed = String(raw).trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new Error('Analiza nu a întors JSON valid.');
  }
}

/**
 * Diacriticele românești corecte folosesc virgulă dedesubt (ș, ț), nu sedilă
 * (ş, ţ). Unele modele produc varianta veche, iar sinteza vocală o poate rosti
 * greșit sau o poate ignora. Normalizăm întotdeauna.
 */
function fixDiacritics(text) {
  return String(text)
    .replace(/ş/g, 'ș').replace(/Ş/g, 'Ș')
    .replace(/ţ/g, 'ț').replace(/Ţ/g, 'Ț');
}

/**
 * Substantivele matematice cu forma lor articulată hotărât.
 *
 * Modelul scapă uneori articolul la subiect — „Virgulă separă partea întreagă"
 * în loc de „Virgula separă…". În scris ar trece neobservat; rostit cu voce
 * tare sună a greșeală de vorbire, exact genul de detaliu care distrage un
 * elev cu dificultăți de învățare. Promptul cere articularea corectă, dar un
 * prompt poate fi ignorat — asta nu.
 */
const ARTICULARE = {
  virgulă: 'virgula', fracție: 'fracția', linie: 'linia', formulă: 'formula',
  cifră: 'cifra', sumă: 'suma', diferență: 'diferența', împărțire: 'împărțirea',
  înmulțire: 'înmulțirea', adunare: 'adunarea', scădere: 'scăderea',
  putere: 'puterea', bază: 'baza', înălțime: 'înălțimea', latură: 'latura',
  arie: 'aria', medie: 'media', unitate: 'unitatea', ecuație: 'ecuația',
  paranteză: 'paranteza', ipotenuză: 'ipotenuza', catetă: 'cateta',
  bisectoare: 'bisectoarea', mediatoare: 'mediatoarea', mediană: 'mediana',
  zecime: 'zecimea', sutime: 'sutimea', miime: 'miimea', parte: 'partea',
  valoare: 'valoarea', măsură: 'măsura', rază: 'raza', diagonală: 'diagonala',
  regulă: 'regula', proporție: 'proporția', operație: 'operația',
  numărător: 'numărătorul', numitor: 'numitorul', exponent: 'exponentul',
  coeficient: 'coeficientul', produs: 'produsul', cât: 'câtul', rest: 'restul',
  termen: 'termenul', semn: 'semnul', punct: 'punctul', unghi: 'unghiul',
  triunghi: 'triunghiul', dreptunghi: 'dreptunghiul', pătrat: 'pătratul',
  cerc: 'cercul', vârf: 'vârful', perimetru: 'perimetrul', volum: 'volumul',
  rezultat: 'rezultatul', factor: 'factorul', radical: 'radicalul',
  număr: 'numărul', raport: 'raportul', segment: 'segmentul',
};

/** Verbele care confirmă că substantivul dinainte e subiect, nu complement. */
const VERB_DUPA_SUBIECT =
  /^(este|e|era|sunt|erau|fie|are|avea|au|aveau|devine|rămâne|se|ne|îți|îi|arată|indică|separă|desparte|împarte|reprezintă|spune|înseamnă|conține|leagă|unește|marchează|apare|există|ajută|permite|schimbă|păstrează|dă|face|poate|trebuie|va|vor|ține|măsoară|arată|începe|continuă|urmează)$/i;

function capitalizeLike(model, word) {
  return model[0] === model[0].toLocaleUpperCase('ro')
    ? word[0].toLocaleUpperCase('ro') + word.slice(1)
    : word;
}

/**
 * Repune articolul hotărât pierdut, DOAR în poziție de subiect neambiguă:
 * început de frază, sau după „iar"/„însă". Mid-frază nu intervenim — acolo
 * „punem o virgulă între" e corect nearticulat, iar o corecție automată ar
 * strica exact textele bune.
 */
export function fixRomanianArticles(text) {
  // Contextul se verifică din ambele părți fără să fie consumat: lookbehind
  // pentru poziția de început de propoziție, lookahead pentru verb. Dacă am
  // captura verbul, o potrivire respinsă ar consuma și cuvântul următor, iar
  // „Iar numitor arată" nu s-ar mai putea corecta (regexul ar fi deja trecut
  // peste „numitor" încercând să potrivească „Iar").
  return String(text).replace(
    /(?<=^|\n|[.!?:;]\s|\b(?:[Ii]ar|[Îî]nsă|[Dd]ar)\s)([A-Za-zĂÂÎȘȚăâîșț]+)(?=\s+([a-zăâîșț]+))/g,
    (match, noun, next) => {
      const articulated = ARTICULARE[noun.toLocaleLowerCase('ro')];
      if (!articulated || !VERB_DUPA_SUBIECT.test(next)) return match;
      return capitalizeLike(noun, articulated);
    }
  );
}

/**
 * Ultima plasă de siguranță împotriva frazei tăiate.
 *
 * Dacă textul tot nu se termină cu punctuație finală, mai bine renunțăm la
 * fragmentul suspendat decât să lăsăm audio-ul să se oprească în aer. Nu tăiem
 * însă mai mult de ~un sfert din text: o explicație ciuntită e mai rea decât o
 * frază neterminată.
 */
export function trimToCompleteSentence(text) {
  const trimmed = String(text).trim();
  if (/[.!?…]["”»)]?$/.test(trimmed)) return trimmed;
  const cut = Math.max(
    trimmed.lastIndexOf('.'), trimmed.lastIndexOf('!'), trimmed.lastIndexOf('?')
  );
  return cut > trimmed.length * 0.6 ? trimmed.slice(0, cut + 1) : trimmed;
}

/**
 * Curăță textul înainte de sinteză.
 *
 * Legăturile Markdown se desfac aici, pentru că sunt o chestiune de format al
 * răspunsului. Tot restul — spații exotice, liniuțe tipografice, simboluri
 * matematice, unități — ține de ce poate rosti espeak-ng și stă în
 * `speakable.mjs`, împreună cu măsurătorile care justifică fiecare regulă.
 */
/**
 * Câte titluri ale lecției sunt atinse de un text — măsură obiectivă a acoperirii.
 *
 * Se compară pe formă normalizată (fără diacritice-invizibile, fără punctuație),
 * fiindcă modelul rostește titlul, nu îl copiază literal. Servește ca gardă la
 * reparare: o rescriere care atinge mai puține secțiuni a pierdut din lecție,
 * oricât de bine ar arăta la scorul de fidelitate.
 */
export function titluriAcoperite(section, text) {
  const sursa = String(section?.sourceCode || '');
  const titluri = [...sursa.matchAll(/^#{2,3}\s+(.+?)\s*$/gm)].map((m) => m[1].trim());
  if (!titluri.length) return 0;
  const norm = (s) => String(s).toLowerCase().replace(/[^\p{L}\d ]/gu, ' ').replace(/\s+/g, ' ').trim();
  const t = norm(text);
  return titluri.filter((h) => h && t.includes(norm(h))).length;
}

export function cleanForSpeech(text, optiuni = {}) {
  return fixRomanianArticles(
    toSpeakable(fixDiacritics(text).replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'), optiuni)
  );
}

/**
 * Cât spațiu rezervăm pentru o REscriere: cât are textul existent, plus o
 * marjă. Româna consumă ~2,5–3 tokeni pe cuvânt; 3,5 acoperă și cazul lung.
 */
function rescriereCeiling(text) {
  const words = String(text).split(/\s+/).filter(Boolean).length;
  return Math.max(900, Math.round(words * 3.5) + 350);
}

/**
 * Generează explicația unei secțiuni.
 * @returns {{transcript, analysis, fidelity, meta}}
 */
export async function explainSection(section, llm, { signal, onStage } = {}) {
  const startedAt = Date.now();
  const stage = (name) => { if (onStage) onStage(name); };

  /**
   * O SINGURĂ trecere, cu UN SINGUR model.
   *
   * Înainte erau două: una de „analiză" (extrăgea definiții și formule în JSON)
   * și una de narațiune. Dubla tokenii — costisitor pe un buget zilnic strâns —
   * fără să adauge calitate: de când modelul primește codul sursă al lecției,
   * citește structura direct din el, nu are nevoie de o hartă intermediară.
   * Fidelitatea o verificăm oricum după generare, pe materialul complet.
   */
  const analysis = {};

  stage('naratiune');
  /**
   * Sursa se curăță O SINGURĂ DATĂ, înainte de orice: frontmatter și importuri
   * afară, figurile înlocuite cu geometria citită. Abia APOI se segmentează —
   * altfel segmentele tăiau SVG-urile în două și modelul primea markup rupt
   * drept „codul sursă exact al lecției" (auditul: ~29% din material).
   */
  section = { ...section, sourceCode: curataSursa(section.sourceCode) };

  const budget = speechBudget(section);

  /**
   * Lecțiile lungi se predau pe bucăți, nu se taie.
   *
   * Măsurat pe cele 219 fișiere din curs: 88 sunt mai lungi decât încape într-o
   * cerere pe tierul gratuit. Tăiate la plafon, elevul ar primi o explicație
   * oprită pe la jumătate — și nimic nu i-ar spune că lipsește restul.
   */
  const segmente = esteLectieIntreaga(section)
    ? imparteLectia(section.sourceCode || '', bugetSursaCaractere(budget.words * 3.5 + 350))
    : [null];
  const n = buildNarrationPrompt(section, analysis);
  /**
   * Limită de siguranță, NU obiectiv.
   *
   * Româna consumă ~2,5–3 tokeni pe cuvânt (diacritice + cuvinte lungi), la
   * care se adaugă raționamentul intern al modelului. O marjă strânsă tăia
   * explicația în mijlocul frazei: audio se oprea brusc și exemplele rămâneau
   * nespuse. O marjă exagerată e însă la fel de dăunătoare — furnizorul
   * rezervă `max_tokens` din limita pe minut, așa că o secțiune mare cerea
   * singură tot bugetul și primea 429. Factorul de mai jos ține ~15% rezervă
   * peste cazul cel mai lung plauzibil, iar restul îl acoperă continuarea.
   */
  const tokenCeiling = Math.max(900, Math.round(budget.words * 3.5) + 350);

  /**
   * Bugetul de vorbire se împarte între bucăți proporțional cu materialul lor,
   * ca partea cu trei exemple să primească mai mult decât cea cu o definiție.
   */
  const totalCaractere = segmente.reduce((s, b) => s + (b ? b.length : 0), 0) || 1;
  let narrationRes = null;
  let raw = '';
  let truncated = false;
  // Suma tuturor tokenilor consumați de la furnizor pentru ACEASTĂ lecție —
  // narațiune (toate bucățile), continuări și rescrieri. Din ea se ține evidența
  // bugetului zilnic al modelului, pe care furnizorul nu-l expune în anteturi.
  let tokeniTotal = 0;

  for (let i = 0; i < segmente.length; i += 1) {
    const bucata = segmente[i];
    const segment = bucata === null ? undefined : {
      index: i,
      total: segmente.length,
      sursa: bucata,
      // Ultimele cuvinte spuse, ca următoarea bucată să lege, nu să reia.
      dinainte: raw.trim().slice(-220),
    };
    const p = segment ? buildNarrationPrompt(section, analysis, segment) : n;
    /**
     * Plafonul unei bucăți urmează MATERIALUL ei, cu o rezervă de o cincime.
     *
     * Împărțit strict proporțional din plafonul total, o bucată de 2800 de
     * caractere primea 358 de cuvinte — prea puțin ca să-i explice conținutul,
     * deci modelul era retezat. Măsurat pe G1 (5 bucăți): secțiuni întregi din
     * lecție lipseau din explicație. Rezerva acoperă cazul lung fără să umfle
     * cererea, iar pragul de jos ține fraza să se poată încheia.
     */
    const plafon = segmente.length > 1
      ? Math.max(900, Math.round(tokenCeiling * (bucata.length / totalCaractere) * 1.2))
      : tokenCeiling;

    if (i > 0) stage(`naratiune ${i + 1}/${segmente.length}`);
    const res = await llm.chat(
      [
        { role: 'system', content: p.system },
        { role: 'user', content: p.user },
      ],
      { maxTokens: plafon, signal }
    );
    narrationRes = res;
    tokeniTotal += res.usage?.total_tokens || 0;
    let bucataText = res.content;

    /**
     * Bucata retezată se continuă PE LOC, nu la sfârșitul lecției.
     *
     * `truncated` se suprascria la fiecare iterație, deci conta doar ultima
     * bucată: dacă una din mijloc era tăiată, pierderea nu se mai recupera
     * niciodată — exact cazul văzut, unde lecția se oprea după „a) Cu ajutorul
     * raportorului" și lipseau ultimele două secțiuni. Continuarea trebuie
     * oricum cerută AICI: cerută la final, ar continua altă parte a lecției.
     */
    if (res.finishReason === 'length') {
      try {
        const cont = await llm.chat(
          [
            { role: 'system', content: p.system },
            { role: 'user', content: p.user },
            { role: 'assistant', content: bucataText },
            {
              role: 'user',
              content:
                'Ai fost întrerupt înainte să termini. Continuă exact de unde ai rămas, fără să reiei ce ai spus deja și fără nicio introducere. Termină ideile rămase și încheie cu o frază completă.',
            },
          ],
          { maxTokens: plafon, signal }
        );
        tokeniTotal += cont.usage?.total_tokens || 0;
        bucataText = `${bucataText.replace(/\s+$/, '')} ${cont.content.replace(/^\s+/, '')}`;
        truncated = cont.finishReason === 'length';
      } catch (err) {
        console.warn(`[voice] continuarea bucății ${i + 1} a eșuat: ${err.message.slice(0, 100)}`);
        truncated = true;
      }
    }

    raw = raw ? `${raw.replace(/\s+$/, '')} ${bucataText.replace(/^\s+/, '')}` : bucataText;
  }

  /**
   * Dacă furnizorul confirmă că a oprit modelul la plafon, cerem continuarea în
   * loc să livrăm o frază retezată. Cu plafonul de mai sus nu ar trebui să se
   * întâmple; o singură încercare e suficientă ca asigurare, iar mai multe ar
   * consuma inutil bugetul de tokeni pe minut.
   */
  if (truncated) {
    /**
     * O continuare eșuată nu are voie să arunce la gunoi narațiunea existentă.
     *
     * Excepția urca până sus și explicația se marca „error", deși aveam în mână
     * un text bun, doar neterminat — pe care `trimToCompleteSentence` îl
     * încheie oricum la ultima frază completă. Elevul primea „nu am putut
     * pregăti explicația" în locul a nouăzeci la sută dintr-o lecție bună, iar
     * tokenii deja cheltuiți se pierdeau.
     */
    try {
      const cont = await llm.chat(
        [
          { role: 'system', content: n.system },
          { role: 'user', content: n.user },
          { role: 'assistant', content: raw },
          {
            role: 'user',
            content:
              'Ai fost întrerupt înainte să termini. Continuă exact de unde ai rămas, fără să reiei ce ai spus deja și fără nicio introducere. Termină ideile rămase și încheie cu o frază completă.',
          },
        ],
        { maxTokens: tokenCeiling, signal }
      );
      tokeniTotal += cont.usage?.total_tokens || 0;
      raw = `${raw.replace(/\s+$/, '')} ${cont.content.replace(/^\s+/, '')}`;
      truncated = cont.finishReason === 'length';
    } catch (err) {
      console.warn(`[voice] continuarea a eșuat, păstrez ce am: ${err.message.slice(0, 120)}`);
    }
  }

  /**
   * La stocare, marcajele de literă RĂMÂN în text (`litere:false`).
   *
   * Convertite aici, numele fonetice („be") se coceau în textul salvat, iar la
   * sinteză refacerea transcriptului nu mai găsea niciun marcaj — elevul vedea
   * „punctele, a, și, be". Conversia se face O SINGURĂ DATĂ, la sinteză, unde
   * perechea nume→literă se construiește din marcajele încă prezente.
   */
  let transcript = trimToCompleteSentence(cleanForSpeech(raw, { litere: false, formule: false }));

  /**
   * TITLUL COMPLET al lecției, garantat — nu rugat.
   *
   * Promptul cere titlul primul, dar modelul îl scurtează (a lăsat „G1 -" pe
   * dinafară la prima încercare). Regula devine cod: dacă transcriptul nu începe
   * cu titlul întreg, îl potrivim noi. Dacă modelul a scris varianta fără cod
   * („Unghiuri adiacente…"), o înlocuim cu titlul complet; dacă n-a scris nimic,
   * îl antepunem.
   */
  const titluLectie = String(section.heading || section.lessonTitle || '').trim();
  if (titluLectie) {
    const normT = (x) => String(x).toLowerCase().replace(/[^\p{L}\d ]/gu, ' ').replace(/\s+/g, ' ').trim();
    const faraCod = titluLectie.replace(/^[A-Za-z]{0,2}\d+(?:\.\d+)?\s*[-–—]\s*/, '');
    const inceput = normT(transcript.slice(0, titluLectie.length + 20));
    if (!inceput.startsWith(normT(titluLectie))) {
      if (faraCod !== titluLectie && inceput.startsWith(normT(faraCod))) {
        // varianta fără cod, scrisă de model → o înlocuim cu titlul întreg
        const idx = transcript.toLowerCase().indexOf(faraCod.toLowerCase().slice(0, 12));
        transcript = `${titluLectie}.${transcript.slice(idx >= 0 ? idx + faraCod.length : 0).replace(/^[.\s]+/, ' ')}`;
      } else {
        transcript = `${titluLectie}. ${transcript}`;
      }
    }
  }
  let fidelity = checkFidelity(section, transcript);
  let repairs = 0;

  /**
   * Buclă de reparare. Promptul singur nu e suficient: modelele inventează
   * exemple numerice tocmai pentru că e pedagogic tentant, și tot ele alunecă
   * în a comenta lecția în loc să o predea. Aici le arătăm exact ce au greșit
   * și cerem rescrierea. Verificările sunt obiective, deci bucla se termină:
   * ori dispar abaterile, ori rămâne `needsReview` pentru profesor.
   *
   * Ambele abateri intră în aceeași buclă. Cât timp comentariile despre
   * material erau doar o notă în raport, nu declanșau nimic — de aceea o frază
   * ca „figura nu explică în detaliu" ajungea nestingherită în audio.
   */
  const maxRepairs = Number(process.env.VOICE_MAX_REPAIRS ?? 2);
  while (fidelity.needsReview && repairs < maxRepairs) {
    const complaints = [];
    if (fidelity.unsupportedNumbers.length) {
      complaints.push(`Ai introdus valori care NU există în materialul sursă: ${fidelity.unsupportedNumbers.join(', ')}. Rescrie fără niciun exemplu numeric inventat. Dacă materialul nu conține exemple cu numere, explici regula în cuvinte. Exemplele care EXISTĂ în material rămân, cu valorile lor exacte — se elimină doar cele inventate.`);
    }
    if (fidelity.metaPhrases.length) {
      complaints.push(`Ai vorbit despre lecție în loc să o predai: ${fidelity.metaPhrases.join('; ')}. Scoate complet aceste formulări. Nu pomenești figuri, imagini, formule sau „materialul", nu spui dacă lecția e bine sau prost făcută, completă sau incompletă, și nu îți povestești propria explicație. Informația pe care o transmitea desenul o spui direct, ca fapt.`);
    }
    if (!complaints.length) break;

    repairs += 1;
    stage('reparare');
    const repairRes = await llm.chat(
      [
        { role: 'system', content: n.system },
        { role: 'user', content: n.user },
        { role: 'assistant', content: transcript },
        {
          role: 'user',
          content: `${complaints.join('\n\n')}

Păstrează același ton și aceeași lungime, și acoperă în continuare toate punctele din lista de acoperire. Răspunde doar cu textul rescris.`,
        },
      ],
      /**
       * Rezerva se măsoară pe textul care se rescrie, nu pe bugetul lecției.
       *
       * O rescriere are lungimea originalului, nu a plafonului. Cerând plafonul
       * întreg, cererea de reparare ajungea la ~8600 de tokeni (prompt mai mare
       * decât la generare, plus 4200 rezervați) peste fereastra de 8000 pe
       * minut a furnizorului — deci ORICE reparare primea 429 și trimitea
       * serviciul pe modelul de rezervă. Nu bugetul zilnic era problema, ci
       * rezerva noastră.
       */
      { maxTokens: rescriereCeiling(transcript), temperature: 0.3, signal }
    );

    /**
     * O rescriere se acceptă doar dacă e cel puțin la fel de bună.
     *
     * Rezultatul se lua pe încredere. O rescriere oprită de plafon, sau care
     * pierde jumătate din lecție ca să scape de reproș, înlocuia o explicație
     * bună cu una ciuntită — și nimeni nu observa, pentru că `needsReview`
     * arăta chiar mai bine după. Păstrăm ce e mai bun, nu ce e mai nou.
     */
    tokeniTotal += repairRes.usage?.total_tokens || 0;
    // Rescrierea păstrează aceleași forme ca originalul: marcaje de literă și formule.
    const candidat = trimToCompleteSentence(cleanForSpeech(repairRes.content, { litere: false, formule: false }));
    const fidelitateNoua = checkFidelity(section, candidat);
    const cuvinteVechi = transcript.split(/\s+/).filter(Boolean).length;
    const cuvinteNoi = candidat.split(/\s+/).filter(Boolean).length;

    /**
     * O rescriere nu are voie să PIARDĂ din lecție, oricât de bine ar scora.
     *
     * Condiția de dinainte cerea și „scor mai slab" ca să respingă o rescriere
     * ciuntită — dar tocmai tăierea unei secțiuni ridică scorul: dispar odată cu
     * ea și numerele reproșate, și frazele meta. Deci varianta scurtă ieșea
     * mereu „mai bună" și era acceptată. Măsurat pe G1 clasa a VI-a: narațiunea
     * completă avea 3294 de caractere și acoperea toate cele șapte titluri, dar
     * ce ajungea la elev avea 1341 și se oprea la „a) Cu ajutorul raportorului".
     *
     * Acoperirea titlurilor e o măsură obiectivă și independentă de scor: dacă
     * rescrierea atinge mai puține secțiuni ale lecției, e o pierdere, nu o
     * reparație — indiferent ce spune fidelitatea.
     */
    const acoperireVeche = titluriAcoperite(section, transcript);
    const acoperireNoua = titluriAcoperite(section, candidat);
    const pierdeSectiuni = acoperireNoua < acoperireVeche;
    const ciuntita = repairRes.finishReason === 'length' || cuvinteNoi < cuvinteVechi * 0.75;

    if (pierdeSectiuni || (ciuntita && fidelitateNoua.score <= fidelity.score)) {
      console.warn(
        `[voice] rescrierea ${repairs} respinsă: ${cuvinteNoi} cuvinte (din ${cuvinteVechi}), `
        + `${acoperireNoua} secțiuni acoperite (din ${acoperireVeche}); păstrez varianta dinainte`
      );
      break;
    }
    transcript = candidat;
    fidelity = fidelitateNoua;
  }

  return {
    transcript,
    analysis,
    fidelity,
    repairs,
    meta: {
      promptVersion: PROMPT_VERSION,
      llmProvider: llm.name,
      llmModel: narrationRes.model || llm.model,
      budgetWords: budget.words,
      // Câte bucăți a avut lecția. Peste 1 înseamnă că a fost predată în
      // reprize — util când se compară două explicații ale aceleiași lecții.
      segmente: segmente.length,
      // Rămâne `true` doar dacă nici continuarea nu a încăput: semnal pentru
      // profesor că acea explicație merită recitită.
      truncated,
      words: transcript.split(/\s+/).filter(Boolean).length,
      totalMs: Date.now() - startedAt,
      // O singură trecere acum: doar narațiunea. Pasul de analiză a fost scos.
      usage: { narration: narrationRes.usage },
      // Totalul consumat la furnizor pentru lecția asta (narațiune + continuări +
      // rescrieri). Alimentează evidența bugetului zilnic în panoul de admin.
      llmProvider: llm.name,
      tokeniTotal,
    },
  };
}
