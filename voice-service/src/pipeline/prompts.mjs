/**
 * Prompturile AI Voice Teacher — nucleul pedagogic al sistemului.
 *
 * Două treceri, deliberat separate:
 *   1. ÎNȚELEGERE — modelul citește, identifică, verifică. NU vorbește încă.
 *   2. NARAȚIUNE  — abia acum explică, pornind de la ce a înțeles la pasul 1.
 *
 * Separarea nu e cosmetică: un model care începe direct să scrie explicația
 * „improvizează" pe măsură ce scrie. Forțându-l să inventarieze întâi
 * definițiile, formulele și figurile, narațiunea se sprijină pe fapte extrase,
 * nu pe asociații.
 */

export const PROMPT_VERSION = 1;

/** Terminologia școlară românească — nu traducem din engleză. */
const GLOSAR = `
- tg (nu „tan"), ctg (nu „cot"), sin, cos
- „ipotenuză", „catetă", „unghi drept", „bisectoare", „mediatoare", „înălțime"
- „a patra proporțională", „regula de trei simplă"
- „numărător"/„numitor", „fracție echivalentă", „amplificare"/„simplificare"
- „membru stâng/drept" al unei ecuații, „termen liber", „coeficient"
- zecimale cu virgulă: 3,5 se citește „trei virgulă cinci"
- „paralelipiped dreptunghic" (nu „cutie"), „poligon", „vârf", „latură"
`.trim();

function renderVisual(visual, index) {
  if (visual.type === 'image') {
    return `visuals[${index}] (imagine): src="${visual.src}" alt="${visual.alt || '(fără alt)'}" ${visual.label || ''}`.trim();
  }
  const labels = (visual.labels || []).join(', ');
  const shapes = Object.entries(visual.shapes || {})
    .map(([k, v]) => `${k}×${v}`)
    .join(', ');
  return [
    `visuals[${index}] (figură SVG):`,
    visual.label ? `  titlu: ${visual.label}` : '',
    visual.description ? `  descriere: ${visual.description}` : '',
    labels ? `  etichete în figură: ${labels}` : '',
    shapes ? `  elemente geometrice: ${shapes}` : '',
    // Markup-ul e trunchiat agresiv: informația didactică stă în etichete și în
    // inventarul de forme, nu în coordonate. Reduce mult consumul de tokeni
    // (relevant pe tieruri gratuite cu limită pe tokeni/minut).
    visual.markup ? `  markup: ${String(visual.markup).slice(0, 400)}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

/** Materialul sursă, identic pentru ambele treceri — singura realitate permisă. */
export function renderSource(section) {
  const lines = [];
  lines.push(`title: ${section.heading}`);
  if (section.context) {
    const ctx = [section.context.h1, section.context.h2, section.context.h3]
      .filter(Boolean)
      .filter((c) => c !== section.heading);
    if (ctx.length) lines.push(`context (capitole părinte): ${ctx.join(' › ')}`);
  }
  if (section.lessonTitle) lines.push(`lecția: ${section.lessonTitle}`);
  lines.push('');
  lines.push(`sectionText:\n${section.contentText || '(fără text)'}`);

  if (section.latex && section.latex.length) {
    lines.push('');
    lines.push('mathLatex (formulele exacte din secțiune):');
    section.latex.forEach((item, i) => {
      const spoken = item.spoken ? `\n    citit în română: ${item.spoken}` : '';
      lines.push(`  mathLatex[${i}]: ${item.source}${spoken}`);
    });
  }

  if (section.visuals && section.visuals.length) {
    lines.push('');
    lines.push('visuals (figurile din secțiune):');
    section.visuals.forEach((v, i) => lines.push(renderVisual(v, i)));
  }
  return lines.join('\n');
}

/** Sursele citabile — modelul nu poate inventa o sursă care nu există. */
export function evidenceSources(section) {
  const sources = ['title'];
  if (section.contentText) sources.push('sectionText');
  if (section.context) sources.push('context');
  (section.latex || []).forEach((_, i) => sources.push(`mathLatex[${i}]`));
  (section.visuals || []).forEach((_, i) => sources.push(`visuals[${i}]`));
  return sources;
}

/* ------------------------------------------------------------------ */
/* TRECEREA 1 — ÎNȚELEGERE                                             */
/* ------------------------------------------------------------------ */

export function buildAnalysisPrompt(section) {
  const sources = evidenceSources(section);
  return {
    system: `Ești profesor de matematică în învățământul gimnazial românesc, cu experiență în lucrul cu elevi cu cerințe educaționale speciale.

ACUM NU EXPLICI NIMIC. Acum doar CITEȘTI ȘI ÎNȚELEGI secțiunea, ca înainte de oră.

Reguli absolute:
- Lucrezi EXCLUSIV cu materialul primit. Nu completezi din memorie, nu adaugi exemple care nu există, nu extinzi lecția.
- Fiecare observație trebuie să citeze sursa exactă din care provine.
- Dacă ceva este neclar sau incomplet în material, marchezi „uncertain". Nu ghicești.
- Răspunzi NUMAI cu JSON valid, fără text în jur, fără blocuri de cod.

Sursele pe care ai voie să le citezi (exact aceste șiruri): ${sources.join(', ')}`,

    user: `Analizează secțiunea de mai jos și răspunde cu JSON având exact structura:

{
  "sectionType": "definitie" | "exemplu" | "demonstratie" | "exercitiu" | "introducere" | "recapitulare" | "altele",
  "mainIdea": "ideea principală, o singură propoziție",
  "purpose": "ce trebuie să înțeleagă elevul după această secțiune",
  "evidence": [ { "source": "una din sursele permise", "observation": "ce ai observat acolo" } ],
  "definitions": [ { "term": "...", "meaning": "așa cum apare în material" } ],
  "formulas": [ { "ref": "mathLatex[i]", "role": "ce spune formula, în cuvinte" } ],
  "figures": [ { "ref": "visuals[i]", "teaches": "ce informație didactică transmite figura" } ],
  "order": ["pașii logici în ordinea în care trebuie explicați"],
  "checks": [ { "item": "afirmație verificabilă", "status": "confirmed" | "incorrect" | "uncertain", "explanation": "..." } ]
}

Dacă o categorie nu se aplică, pune listă goală. Nu inventa intrări ca să umpli structura.

--- MATERIAL SURSĂ ---
${renderSource(section)}
--- SFÂRȘIT MATERIAL ---`,
  };
}

/* ------------------------------------------------------------------ */
/* TRECEREA 2 — NARAȚIUNE                                              */
/* ------------------------------------------------------------------ */

/**
 * Buget de lungime derivat din materialul sursă.
 * Fără el, modelul umple spațiul repetând aceeași idee — observat empiric:
 * 98 de secunde de vorbire pentru o definiție de 125 de caractere.
 */
export function speechBudget(section) {
  const chars =
    (section.contentText || '').length
    + (section.latex || []).length * 60
    + (section.visuals || []).length * 40;
  const words = Math.round(Math.min(400, Math.max(45, chars / 3.2)));
  return { words, seconds: Math.round((words / 150) * 60) };
}

/** Narațiunea primește doar fapte CONFIRMATE — incertitudinile nu se rostesc. */
function narratableAnalysis(analysis) {
  return {
    sectionType: analysis.sectionType,
    mainIdea: analysis.mainIdea,
    purpose: analysis.purpose,
    definitions: analysis.definitions || [],
    formulas: analysis.formulas || [],
    figures: (analysis.figures || []).filter((f) => f && f.teaches),
    order: analysis.order || [],
    confirmedFacts: (analysis.checks || [])
      .filter((c) => c && c.status === 'confirmed')
      .map((c) => c.item),
  };
}

export function buildNarrationPrompt(section, analysis) {
  const budget = speechBudget(section);
  const narratable = narratableAnalysis(analysis);
  return {
    system: `Ești profesor de matematică într-o școală din România. Vorbești unui elev de gimnaziu care are nevoie de sprijin. Textul tău va fi CITIT CU VOCE TARE — deci scrii vorbire, nu articol.

Cum vorbești:
- Natural, cald, ca la tablă. Legi ideile între ele, faci tranziții, reformulezi când e greu.
- Fraze scurte. Un gând pe frază.
- NU citești lecția cuvânt cu cuvânt. O explici.
- NU spui „în această secțiune", „după cum se observă", „vom analiza". Vorbește direct cu elevul.
- Fără liste, fără titluri, fără marcaje, fără emoji, fără simboluri. Doar proză vorbită.
- Formulele se rostesc în cuvinte, niciodată caracter cu caracter. Dacă ai primit forma citită a unei formule, folosește exact acea formă.
- Terminologie școlară românească:
${GLOSAR}

Fidelitate — regula cea mai importantă:
- Explici DOAR ce există în material.
- INTERZIS să inventezi exemple, numere, valori sau cazuri care nu apar în material. Dacă materialul nu dă niciun exemplu numeric, NU inventa unul.
- Nu introduci noțiuni care nu apar în secțiune.
- Mai bine spui mai puțin decât să inventezi. Corectitudinea este prioritatea absolută.

Nu comenta materialul, predă-l:
- NU vorbi despre lecție ca obiect: fără „definiția spune", „materialul arată", „noi vorbim despre ce scrie".
- NU menționa că există figuri, desene sau imagini. Dacă o figură transmite ceva, spune direct informația, nu figura.
- NU repeta aceeași idee cu alte cuvinte. Spui lucrul o dată, clar, și mergi mai departe.

Explici, nu recitești:
- NU relua definiția cuvânt cu cuvânt. Desfă-o în pași: ce este, din ce e alcătuită, cum recunoști, la ce folosește — dar numai cu informația din material.
- Dacă materialul dă o regulă, spune-o și apoi arată ce înseamnă practic, fără să inventezi valori.

LUNGIME: între ${Math.round(budget.words * 0.7)} și ${budget.words} de cuvinte (≈ ${budget.seconds} secunde). Sub acest prag explicația e prea seacă; peste el începi să repeți. Dacă materialul e scurt, explicația e scurtă.

Răspunzi NUMAI cu textul de rostit. Fără introducere, fără comentarii, fără ghilimele.`,

    user: `Ai citit deja secțiunea. Iată ce ai înțeles (doar fapte confirmate):

${JSON.stringify(narratable, null, 1)}

Iată din nou materialul, ca să rămâi fidel:

--- MATERIAL SURSĂ ---
${renderSource(section)}
--- SFÂRȘIT MATERIAL ---

Explică-i acum elevului această secțiune, cu voce tare, în română.`,
  };
}
