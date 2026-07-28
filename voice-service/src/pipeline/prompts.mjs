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
import { describeFigure } from './figure.mjs';

/**
 * v2: analiza inventariază explicit exemplele din material, bugetul de vorbire
 * e mai larg, iar narațiunea are reguli de acoperire. Versiunea intră în hash,
 * deci explicațiile generate cu v1 (incomplete) se regenerează automat.
 *
 * v3: figurile SVG ajung la model ca geometrie citită din desen, nu ca markup
 * trunchiat; lista de acoperire nu mai numește „figura", pentru că exact ea
 * împingea modelul să vorbească despre desen în loc să spună ce arată; iar
 * evaluarea materialului („figura nu explică în detaliu") e interzisă explicit
 * și verificată după generare.
 *
 * Lecția întreagă are propriul mod (`section.mode === 'lectie'`), cu fir
 * narativ și buget separat. Modul intră în forma canonică DOAR atunci, deci
 * numai lecțiile primesc hash nou; explicațiile pe secțiuni rămân valabile,
 * pentru că promptul lor nu s-a schimbat. Versiunea nu se incrementează pentru
 * ceva ce nu schimbă rezultatul: ar arunca un cache bun și ar cere zeci de
 * regenerări pe un buget de tokeni limitat pe zi.
 */
export const PROMPT_VERSION = 5;

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

/**
 * Cum ajunge o figură la model.
 *
 * NU trimitem markup. Coordonatele nu spun nimic unui model de limbaj, iar
 * trunchiate la câteva sute de caractere spun și mai puțin — de acolo veneau
 * formulările goale despre „reprezentarea grafică". Trimitem geometria deja
 * citită: ce puncte există, ce segmente le unesc, ce e egal, unde e unghi drept.
 */
function renderVisual(visual, index) {
  if (visual.type === 'image') {
    const alt = visual.alt || visual.label || '';
    return alt
      ? `visuals[${index}] (imagine): ${alt}`
      : `visuals[${index}] (imagine fără descriere — NU ai ce spune despre ea)`;
  }

  const figure = describeFigure(visual.markup);
  const lines = [`visuals[${index}] (desen geometric):`];
  if (visual.label) lines.push(`  titlu: ${visual.label}`);
  if (visual.description) lines.push(`  descriere: ${visual.description}`);
  if (figure.meaningful) {
    lines.push('  ce se vede în desen:');
    figure.facts.forEach((fact) => lines.push(`    - ${fact}`));
  } else {
    lines.push('  desen fără conținut didactic (decorativ) — se ignoră complet.');
  }
  return lines.join('\n');
}

/**
 * Forma citită a unei formule, curățată de o silabisire inutilă.
 *
 * Convertorul de LaTeX desface orice zecimală în cuvinte („12 virgulă 4"),
 * pentru că el servește și cititorul de ecran, unde asta e corect. Modelul
 * copia însă forma aceea în explicație, iar transcriptul ieșea plin de
 * „12 virgulă 4 plus 3 virgulă 9" — greu de citit și de verificat. Sinteza
 * rostește oricum „12,4" ca „doisprezece virgulă patru", deci scrierea cu cifre
 * sună identic și se citește ca un număr.
 */
function spokenHint(text) {
  return String(text)
    .replace(/(\d+)\s+virgulă\s+(\d+)/gi, '$1,$2')
    /**
     * Marcajele de așezare în pagină nu sunt matematică.
     *
     * Convertorul descrie și structura: „tabel de calcul, rândul 1:", „rândul
     * următor:", „linie de separare". Pentru un cititor de ecran e util — el
     * chiar trebuie să știe unde e pe pagină. Într-o explicație rostită e
     * zgomot, iar modelul le copia cuminte: elevul auzea „se reprezintă prin
     * tabelul de calcul, rândul 1: 345,20; rândul următor: plus 7,92; rândul
     * următor: linie de separare" în loc de adunarea propriu-zisă.
     */
    .replace(/\b(tabel de calcul|matrice)\s*,\s*rândul\s*1\s*:\s*/gi, '')
    .replace(/\s*;?\s*rândul următor\s*:\s*/gi, ', ')
    .replace(/\s*;?\s*linie de separare\s*;?\s*/gi, ', rezultatul este ')
    .replace(/\s*,\s*,\s*/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Materialul sursă, identic pentru ambele treceri — singura realitate permisă. */
export function renderSource(section) {
  /**
   * Dacă avem sursa brută, ea ESTE materialul.
   *
   * Reconstrucția de mai jos — text din DOM, formule reconvertite, figuri
   * descrise de noi — pierdea notația exactă și ordinea lecției. Un model care
   * primește `0,1` deja interpretat își permite să dea altă interpretare;
   * primind `0{,}1` din fișier, nu are ce reinterpreta. Iar structura lecției e
   * explicită în cod, nu trebuie dedusă.
   */
  if (section.sourceCode && String(section.sourceCode).trim().length > 40) {
    return [
      'Acesta este codul sursă EXACT al lecției, așa cum e scris de profesor.',
      'Notația din el se păstrează întocmai: dacă scrie 0{,}1, spui „zero virgulă unu",',
      'nu o rescrii ca „zece la puterea minus unu". Ordinea titlurilor este ordinea lecției.',
      '',
      '```mdx',
      String(section.sourceCode).slice(0, 12000),
      '```',
    ].join('\n');
  }

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
      const spoken = item.spoken ? `\n    citit în română: ${spokenHint(item.spoken)}` : '';
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
  const lectie = esteLectieIntreaga(section);
  return {
    system: `Ești profesor de matematică în învățământul gimnazial românesc, cu experiență în lucrul cu elevi cu cerințe educaționale speciale.

ACUM NU EXPLICI NIMIC. Acum doar CITEȘTI ȘI ÎNȚELEGI ${lectie ? 'LECȚIA ÎNTREAGĂ' : 'secțiunea'}, ca înainte de oră.${
      lectie
        ? '\n\nMaterialul e o lecție completă, cu mai multe părți. La "order" pui firul ei: în ce ordine se construiesc ideile, de la ce se pleacă și unde se ajunge. Inventarul de definiții, formule și exemple le acoperă pe TOATE, din toate părțile.'
        : ''
    }

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

La "figures": completezi DOAR dacă materialul conține efectiv un element „visuals". Un bloc de formule nu este o figură. Dacă lista de figuri din material e goală, "figures" rămâne goală. La "teaches" scrii informația pe care o transmite desenul („unghiul din O este drept"), nu faptul că există un desen.

Nu evaluezi materialul. Nu notezi dacă e bine sau prost făcut, clar sau neclar, complet sau incomplet. Ce lipsește se marchează „uncertain" la "checks" și atât — mai departe nu se rostește.

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
/** O lecție întreagă se explică altfel decât o secțiune — vezi `LECTIE`. */
export function esteLectieIntreaga(section) {
  return section && section.mode === 'lectie';
}

export function speechBudget(section) {
  const weighted =
    (section.contentText || '').length
    + (section.latex || []).length * 100
    + (section.visuals || []).length * 90;

  /**
   * Lecția întreagă are alt plafon, dar nu cu mult mai mare.
   *
   * Ar merita mai mult spațiu — e o oră de curs, nu un paragraf. Limita nu e
   * pedagogică, ci de furnizor: Groq numără promptul PLUS `max_tokens` rezervat
   * în bugetul de 8000 de tokeni pe minut. Promptul unei lecții mari trece de
   * 2500 de tokeni, deci peste ~1100 de cuvinte cererea se respinge cu 429 și
   * elevul nu primește nimic. Mai bine o explicație bună de zece minute decât
   * una perfectă care nu pornește.
   */
  if (esteLectieIntreaga(section)) {
    const words = Math.round(Math.min(1100, Math.max(220, weighted / 2.4)));
    return { words, seconds: Math.round((words / 150) * 60) };
  }
  // Plafonul nu e o alegere pedagogică — o secțiune are dreptul să fie explicată
  // integral, oricât ar dura. E doar limita tehnică sub care cererea încape în
  // bugetul gratuit de 8000 de tokeni pe minut al furnizorului; peste ea,
  // generarea ar fi respinsă și elevul nu ar primi nimic.
  const words = Math.round(Math.min(800, Math.max(60, weighted / 2.6)));
  return { words, seconds: Math.round((words / 150) * 60) };
}

/** Narațiunea primește doar fapte CONFIRMATE — incertitudinile nu se rostesc. */
function narratableAnalysis(analysis, section) {
  /**
   * Figurile se verifică față de figurile care CHIAR există în secțiune.
   *
   * Într-o secțiune fără niciun desen, analiza a raportat totuși o „figură" —
   * confundase blocul de formule cu una — iar narațiunea a rostit cuminte
   * „Figura arată o reprezentare grafică…". O referință care nu trimite la un
   * `visuals[i]` real nu are ce căuta mai departe.
   */
  const existing = (section && section.visuals) || [];
  const figures = existing.length
    ? (analysis.figures || []).filter((f) => {
      if (!f || !f.teaches) return false;
      const index = /visuals\[(\d+)\]/.exec(String(f.ref || ''));
      return index ? Number(index[1]) < existing.length : false;
    })
    : [];

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
    figures,
    order: analysis.order || [],
    confirmedFacts: (analysis.checks || [])
      .filter((c) => c && c.status === 'confirmed')
      .map((c) => c.item),
  };
}

/**
 * Lista de acoperire — ce anume trebuie să apară în explicație, punct cu punct.
 *
 * Punctele numesc INFORMAȚIA, niciodată locul din care vine. Formularea veche,
 * „ce arată figura: …", cerea explicit modelului să vorbească despre figură,
 * chiar în timp ce promptul îi interzicea asta două paragrafe mai sus. Modelul
 * a ascultat lista, nu regula — pe bună dreptate: lista era mai concretă.
 */
function coverageChecklist(narratable) {
  const items = [];
  (narratable.definitions || []).forEach((d) => d && d.term && items.push(`definiția: ${d.term}`));
  (narratable.formulas || []).forEach((f) => f && f.role && items.push(`formula: ${f.role}`));
  (narratable.examples || []).forEach((e, i) => {
    const values = (e.values || []).join(', ');
    items.push(`exemplul ${i + 1}: ${e.shows || 'din material'}${values ? ` (${values})` : ''}`);
  });
  (narratable.figures || []).forEach((f) => items.push(`de spus ca fapt, direct: ${f.teaches}`));
  return items;
}

/**
 * Ce se schimbă când se explică lecția întreagă, nu o secțiune.
 *
 * Diferența nu e doar de lungime. O secțiune se explică pe loc, în context; o
 * lecție are un fir — se deschide, se construiește pas cu pas, se leagă, se
 * strânge la final. Fără instrucțiunea asta, modelul producea aceeași explicație
 * punctuală, doar mai lungă: o înșiruire de bucăți fără trecere între ele, adică
 * exact ce se aude când cineva citește un manual în loc să predea.
 */
const LECTIE = `
Predai LECȚIA ÎNTREAGĂ, ca la clasă, într-o singură oră:
- Începi spunând, în două fraze, ce va ști elevul la final. Fără „în această lecție" — vorbește direct: „Astăzi înveți să…".
- Parcurgi părțile în ordinea din material și le LEGI între ele. Fiecare parte nouă începe de la ce tocmai s-a înțeles: „Acum că știi ce separă virgula, hai să vedem cum se citește numărul".
- Exemplele se fac pe îndelete, cu voce tare, pas cu pas. Ele sunt lecția; regula fără exemplu nu se reține.
- Când o parte e grea, te oprești și o reformulezi altfel, o singură dată.
- Închei strângând firul: ce am învățat, în trei-patru propoziții, în ordinea în care s-au construit. Fără să te povestești pe tine — spui MATEMATICA învățată, nu că ai explicat-o.`;

export function buildNarrationPrompt(section, analysis) {
  const budget = speechBudget(section);
  const narratable = narratableAnalysis(analysis, section);
  const checklist = coverageChecklist(narratable);
  const lectie = esteLectieIntreaga(section);
  return {
    system: `Ești profesor de matematică într-o școală din România. Vorbești unui elev de gimnaziu care are nevoie de sprijin. Textul tău va fi CITIT CU VOCE TARE — deci scrii vorbire, nu articol.
${lectie ? LECTIE : ''}
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
- NU vorbi despre lecție ca obiect: fără „definiția spune", „materialul arată", „formula din material", „noi vorbim despre ce scrie".
- NU menționa că există figuri, desene, imagini sau formule. Dacă un desen transmite ceva, spui direct informația: „unghiul din O este drept", nu „figura arată un unghi drept".
- NU EVALUA materialul. Nu spui că ceva e bine sau prost făcut, clar sau neclar, complet sau incomplet, că lipsește ceva sau că nu se explică în detaliu. Nu ești corector, ești profesor: elevul are nevoie de conținut, nu de părerea ta despre lecție. Dacă ceva chiar lipsește din material, pur și simplu nu vorbești despre acel lucru.
- NU te povesti pe tine: fără „am parcurs", „am explicat", „închei cu speranța că", „sper că e clar", „în cele ce urmează". Ultima frază spune ultimul lucru de spus, apoi te oprești.
- NU repeta aceeași idee cu alte cuvinte. Spui lucrul o dată, clar, și mergi mai departe.

Cum scrii numerele (textul tău e trimis mai departe la sinteza vocală):
- Cu cifre și virgulă zecimală: „12,4", nu „12 virgulă 4" și nu „doisprezece virgulă patru".
- Fără separator de mii: „37540", „1000" — nu „37 540" și nu „1 000".
- Fără simboluri matematice: scrii „înmulțit cu", „împărțit la", „minus", „la pătrat", nu „×", „÷", „−", „²".

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
${
  /**
   * La lecția întreagă, materialul NU se mai repetă.
   *
   * Îl trimiteam de două ori — o dată la analiză, o dată aici — ca narațiunea
   * să poată verifica valorile. Pentru o secțiune e ieftin și util. Pentru o
   * lecție completă, a doua copie e exact ce face cererea să depășească
   * fereastra de 8000 de tokeni pe minut a tierului gratuit: furnizorul
   * răspunde „request too large", iar asta nu se rezolvă așteptând — cererea ar
   * fi prea mare și peste un minut, și peste o oră.
   *
   * Fidelitatea nu are de suferit: analiza a extras deja definițiile, formulele
   * și exemplele CU VALORILE LOR, iar lista de acoperire le poartă mai departe.
   * Verificarea de după generare se face oricum pe materialul complet, pe
   * server, unde nu costă niciun token.
   */
  lectie
    ? 'Ai deja mai sus tot ce ai extras din material. Folosește EXCLUSIV acele valori — nu adăuga altele.'
    : `Iată din nou materialul, ca să rămâi fidel:

--- MATERIAL SURSĂ ---
${renderSource(section)}
--- SFÂRȘIT MATERIAL ---`
}

Explică-i acum elevului această secțiune, cu voce tare, în română. Acoperă toate punctele din listă, în ordine, și încheie cu o frază completă.`,
  };
}
