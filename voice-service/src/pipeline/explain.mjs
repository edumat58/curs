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

/** Curăță textul înainte de sinteză: fără marcaje, fără spații duble. */
export function cleanForSpeech(text) {
  return fixDiacritics(text)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[*_#`>]+/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
  const narrationRes = await llm.chat(
    [
      { role: 'system', content: n.system },
      { role: 'user', content: n.user },
    ],
    // marjă de 60% peste buget: limită de siguranță, nu obiectiv
    { maxTokens: Math.round(budget.words * 2.6), signal }
  );

  let transcript = cleanForSpeech(narrationRes.content);
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

Dacă materialul nu conține exemple cu numere, explică regula în cuvinte, fără să ilustrezi cu valori proprii. Păstrează același ton și aceeași lungime. Răspunde doar cu textul rescris.`,
        },
      ],
      { maxTokens: Math.round(budget.words * 2.6), temperature: 0.3, signal }
    );
    transcript = cleanForSpeech(repairRes.content);
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
