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

/**
 * v2: analiza inventariază explicit exemplele din material, bugetul de vorbire
 * e mai larg, iar narațiunea are reguli de acoperire. Versiunea intră în hash,
 * deci explicațiile generate cu v1 (incomplete) se regenerează automat.
 */
export const PROMPT_VERSION = 2;

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
  "examples": [ { "ref": "sursa din care provine", "shows": "ce ilustrează exemplul", "values": ["valorile exacte, copiate din material"], "result": "rezultatul, dacă materialul îl dă" } ],
  "figures": [ { "ref": "visuals[i]", "teaches": "ce informație didactică transmite figura" } ],
  "order": ["pașii logici în ordinea în care trebuie explicați"],
  "checks": [ { "item": "afirmație verificabilă", "status": "confirmed" | "incorrect" | "uncertain", "explanation": "..." } ]
}

La "examples": inventariază TOATE exemplele, calculele rezolvate și cazurile concrete care EXISTĂ în material, cu valorile lor exacte, în ordinea în care apar. Sunt partea din lecție pe care elevul o urmărește cel mai atent, deci niciunul nu are voie să lipsească din listă. Dacă materialul nu conține niciun exemplu, lista rămâne goală — nu inventezi.

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
 *
 * Bugetul are două roluri opuse și ambele contează. Fără plafon, modelul umple
 * spațiul repetând aceeași idee — observat empiric: 98 de secunde de vorbire
 * pentru o definiție de 125 de caractere. Cu plafonul prea jos însă (v1:
 * caractere/3,2, maximum 400 de cuvinte), modelul e forțat să aleagă ce spune
 * și taie exact partea scumpă: exemplele rezolvate. Elevul aude regula, dar nu
 * și cum se aplică.
 *
 * De aceea explicația are voie să fie mai lungă decât sursa. O formulă scrisă
 * pe un rând se desface în câteva fraze rostite; o figură care „se vede dintr-o
 * privire" trebuie povestită. Ponderile de mai jos reflectă acest cost.
 */
export function speechBudget(section) {
  const weighted =
    (section.contentText || '').length
    + (section.latex || []).length * 100
    + (section.visuals || []).length * 90;
  // Plafonul nu e o alegere pedagogică — o secțiune are dreptul să fie explicată
  // integral, oricât ar dura. E doar limita tehnică sub care cererea încape în
  // bugetul gratuit de 8000 de tokeni pe minut al furnizorului; peste ea,
  // generarea ar fi respinsă și elevul nu ar primi nimic.
  const words = Math.round(Math.min(800, Math.max(60, weighted / 2.6)));
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
    // Exemplele trec mai departe cu valorile lor: sunt fapte extrase din
    // material, nu invenții. Absența lor din v1 era motivul pentru care
    // narațiunea le sărea — nu le vedea niciodată.
    examples: (analysis.examples || []).filter(
      (e) => e && (e.shows || (e.values && e.values.length))
    ),
    figures: (analysis.figures || []).filter((f) => f && f.teaches),
    order: analysis.order || [],
    confirmedFacts: (analysis.checks || [])
      .filter((c) => c && c.status === 'confirmed')
      .map((c) => c.item),
  };
}

/** Lista de acoperire — ce anume trebuie să apară în explicație, punct cu punct. */
function coverageChecklist(narratable) {
  const items = [];
  (narratable.definitions || []).forEach((d) => d && d.term && items.push(`definiția: ${d.term}`));
  (narratable.formulas || []).forEach((f) => f && f.role && items.push(`formula: ${f.role}`));
  (narratable.examples || []).forEach((e, i) => {
    const values = (e.values || []).join(', ');
    items.push(`exemplul ${i + 1}: ${e.shows || 'din material'}${values ? ` (${values})` : ''}`);
  });
  (narratable.figures || []).forEach((f) => items.push(`ce arată figura: ${f.teaches}`));
  return items;
}

export function buildNarrationPrompt(section, analysis) {
  const budget = speechBudget(section);
  const narratable = narratableAnalysis(analysis);
  const checklist = coverageChecklist(narratable);
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

Româna rostită trebuie să fie corectă gramatical:
- Articolul hotărât NU se pierde. Subiectul se articulează: „Virgula separă partea întreagă", nu „Virgulă separă"; „Numitorul arată în câte părți", nu „Numitor arată"; „Fracția se simplifică", nu „Fracție se simplifică".
- Acordul în gen, număr și caz se respectă în fiecare frază.
- Diacritice complete peste tot: ă, â, î, ș, ț.

Fidelitate — regula cea mai importantă:
- Explici DOAR ce există în material. Materialul e singura ta sursă.
- Exemplele DIN MATERIAL se explică, nu se sar. Dacă materialul conține un exemplu, un calcul rezolvat sau un caz concret, îl parcurgi cu elevul folosind exact valorile scrise acolo. Sunt partea pe care elevul o înțelege cel mai bine.
- INTERZIS să inventezi exemple, numere, valori sau cazuri NOI, care nu apar în material. Dacă materialul nu dă niciun exemplu, explici regula în cuvinte — nu o ilustrezi cu valori proprii.
- Distincția e simplă: exemplele existente le folosești integral; exemple noi nu creezi.
- Nu adăuga echivalențe, conversii sau reformulări matematice care nu apar în material. Dacă materialul spune doar cum se citește un număr, spui doar cum se citește — nu îl mai traduci și în alte unități, pentru că exact acolo apar greșelile.
- Nu introduci noțiuni care nu apar în secțiune.
- Mai bine spui mai puțin decât să inventezi. Corectitudinea este prioritatea absolută.

Acoperire — a doua regulă ca importanță:
- Parcurgi TOT ce apare în lista de acoperire primită: fiecare definiție, fiecare formulă, fiecare exemplu, fiecare informație din figuri. Niciun punct nu se sare.
- Respecți ordinea logică indicată.
- Termini ce ai început. Ultima idee se spune la fel de complet ca prima, iar textul se încheie cu o frază terminată — niciodată la mijlocul unui gând.

Nu comenta materialul, predă-l:
- NU vorbi despre lecție ca obiect: fără „definiția spune", „materialul arată", „noi vorbim despre ce scrie".
- NU menționa că există figuri, desene sau imagini. Dacă o figură transmite ceva, spune direct informația, nu figura.
- NU repeta aceeași idee cu alte cuvinte. Spui lucrul o dată, clar, și mergi mai departe.

Explici, nu recitești:
- NU relua definiția cuvânt cu cuvânt. Desfă-o în pași: ce este, din ce e alcătuită, cum recunoști, la ce folosește — dar numai cu informația din material.
- Dacă materialul dă o regulă, spune-o și apoi arată ce înseamnă practic. Dacă materialul are un exemplu, exemplul lui este demonstrația: îl iei pas cu pas, spui de unde pleci, ce faci și ce obții.

LUNGIME: ai la dispoziție până la ${budget.words} de cuvinte (≈ ${budget.seconds} secunde) și cel puțin ${Math.round(budget.words * 0.75)}. Nu e o țintă de umplut: dacă ai acoperit tot ce era de acoperit mai devreme, te oprești. Dar nu sacrifici niciun punct din lista de acoperire ca să te încadrezi — spațiul e calculat ca să încapă tot.

Răspunzi NUMAI cu textul de rostit. Fără introducere, fără comentarii, fără ghilimele.`,

    user: `Ai citit deja secțiunea. Iată ce ai înțeles (doar fapte confirmate):

${JSON.stringify(narratable, null, 1)}
${
  checklist.length
    ? `\nLISTĂ DE ACOPERIRE — fiecare punct trebuie să se audă în explicație:\n${checklist
        .map((item, i) => `${i + 1}. ${item}`)
        .join('\n')}\n`
    : ''
}
Iată din nou materialul, ca să rămâi fidel:

--- MATERIAL SURSĂ ---
${renderSource(section)}
--- SFÂRȘIT MATERIAL ---

Explică-i acum elevului această secțiune, cu voce tare, în română. Acoperă toate punctele din listă, în ordine, și încheie cu o frază completă.`,
  };
}
