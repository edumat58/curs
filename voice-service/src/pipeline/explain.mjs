/**
 * Pipeline-ul de explicație: înțelegere → narațiune → verificare.
 * Nu știe nimic despre HTTP, MongoDB sau furnizorul concret de LLM.
 */
import { buildAnalysisPrompt, buildNarrationPrompt, speechBudget, PROMPT_VERSION } from './prompts.mjs';
import { checkFidelity } from './fidelity.mjs';

/** Modelele mai adaugă uneori ```json în jurul răspunsului. */
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
 * Semnul minus scris („rezultă -5") nu are echivalent fonetic: sintetizatorul
 * fie îl ignoră și rostește „cinci" — care e altceva — fie îl citește ca pauză.
 * Îl scriem în cuvinte. Nu atingem cratima din interiorul cuvintelor.
 */
function spokenMinus(text) {
  return String(text).replace(/(^|[\s(„"])[-−–]\s?(?=\d)/g, '$1minus ');
}

/** Curăță textul înainte de sinteză: fără marcaje, fără spații duble. */
export function cleanForSpeech(text) {
  return fixRomanianArticles(
    spokenMinus(fixDiacritics(text))
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/[*_#`>]+/g, ' ')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[ \t]+/g, ' ')
      .replace(/\s*\n\s*/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

/**
 * Generează explicația unei secțiuni.
 * @returns {{transcript, analysis, fidelity, meta}}
 */
export async function explainSection(section, llm, { signal, analysisLlm } = {}) {
  const startedAt = Date.now();
  // Trecerea de înțelegere este extragere structurată, nu pedagogie: o poate
  // face un model mai mic. Rulând-o pe alt model câștigăm și un buget separat
  // de tokeni pe minut (limitele furnizorului sunt per model), ceea ce dublează
  // practic câte secțiuni pot fi generate într-un minut.
  const analyst = analysisLlm || llm;

  const a = buildAnalysisPrompt(section);
  const analysisRes = await analyst.chat(
    [
      { role: 'system', content: a.system },
      { role: 'user', content: a.user },
    ],
    { json: true, signal }
  );
  const analysis = parseJsonLoose(analysisRes.content);
  const analysisMs = Date.now() - startedAt;

  const n = buildNarrationPrompt(section, analysis);
  const budget = speechBudget(section);
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

  const narrationRes = await llm.chat(
    [
      { role: 'system', content: n.system },
      { role: 'user', content: n.user },
    ],
    { maxTokens: tokenCeiling, signal }
  );

  let raw = narrationRes.content;
  let truncated = narrationRes.finishReason === 'length';

  /**
   * Dacă furnizorul confirmă că a oprit modelul la plafon, cerem continuarea în
   * loc să livrăm o frază retezată. Cu plafonul de mai sus nu ar trebui să se
   * întâmple; o singură încercare e suficientă ca asigurare, iar mai multe ar
   * consuma inutil bugetul de tokeni pe minut.
   */
  if (truncated) {
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
    raw = `${raw.replace(/\s+$/, '')} ${cont.content.replace(/^\s+/, '')}`;
    truncated = cont.finishReason === 'length';
  }

  let transcript = trimToCompleteSentence(cleanForSpeech(raw));
  let fidelity = checkFidelity(section, transcript);
  let repairs = 0;

  /**
   * Buclă de reparare. Promptul singur nu e suficient: modelele inventează
   * exemple numerice tocmai pentru că e pedagogic tentant. Aici le arătăm
   * exact ce au inventat și cerem rescrierea. Verificarea e obiectivă, deci
   * bucla se termină: ori dispar valorile străine, ori marcăm needsReview.
   */
  const maxRepairs = Number(process.env.VOICE_MAX_REPAIRS ?? 2);
  while (fidelity.needsReview && fidelity.unsupportedNumbers.length && repairs < maxRepairs) {
    repairs += 1;
    const repairRes = await llm.chat(
      [
        { role: 'system', content: n.system },
        { role: 'user', content: n.user },
        { role: 'assistant', content: transcript },
        {
          role: 'user',
          content: `Ai introdus valori care NU există în materialul sursă: ${fidelity.unsupportedNumbers.join(', ')}.

Acesta este exact lucrul interzis. Rescrie explicația fără niciun exemplu numeric inventat.

Dacă materialul nu conține exemple cu numere, explică regula în cuvinte, fără să ilustrezi cu valori proprii. Exemplele care EXISTĂ în material rămân în explicație, cu valorile lor exacte — se elimină doar cele inventate. Păstrează același ton și aceeași lungime, și acoperă în continuare toate punctele din lista de acoperire. Răspunde doar cu textul rescris.`,
        },
      ],
      // Același plafon ca la generarea inițială: o rescriere trunchiată e la fel
      // de inutilizabilă ca o generare trunchiată.
      { maxTokens: tokenCeiling, temperature: 0.3, signal }
    );
    transcript = trimToCompleteSentence(cleanForSpeech(repairRes.content));
    fidelity = checkFidelity(section, transcript);
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
      // Rămâne `true` doar dacă nici continuarea nu a încăput: semnal pentru
      // profesor că acea explicație merită recitită.
      truncated,
      words: transcript.split(/\s+/).filter(Boolean).length,
      analysisMs,
      totalMs: Date.now() - startedAt,
      usage: {
        analysis: analysisRes.usage,
        narration: narrationRes.usage,
      },
    },
  };
}
