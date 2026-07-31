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
import { describeFigure, inlocuiesteComponente } from './figure.mjs';

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
 *
 * v6: primind codul sursă, modelul a început să copieze și notația LaTeX din el
 * („0{,}1", „37\,540{,}85"), iar sinteza o rostea literal — numărul se auzea
 * rupt în cifre. Interdicția e acum explicită în prompt, deci explicațiile
 * generate cu v5 chiar sunt altele și trebuie refăcute.
 *
 * Citirea figurilor s-a schimbat de atunci (descrierea autorului, componentele
 * care desenează, axele care nu mai devin segmente), iar materialul chiar
 * diferă la 48 de lecții. Versiunea a rămas totuși 7, deliberat: ea invalidează
 * TOT, iar dintre lecțiile care aveau explicație salvată doar una era afectată.
 * Un plus de versiune ar fi șters patru înregistrări bune ca să repare una —
 * aceea a fost regenerată direct. Versiunea se incrementează când se schimbă
 * ceva pentru toată lumea, nu ca formalitate.
 */
export const PROMPT_VERSION = 7;

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
  for (const d of figure.descrieri) lines.push(`  descrierea autorului: ${d}`);
  if (figure.meaningful) {
    // Ca la lecția întreagă: doar ce ÎNVAȚĂ desenul, nu lista liniilor din el.
    if (figure.didactice.length) {
      lines.push('  ce arată desenul:');
      figure.didactice.forEach((fact) => lines.push(`    - ${fact}`));
    }
    if (figure.necitite) {
      lines.push('  (figura mai are părți desenate din cod, pe care nu le poți vedea — '
        + 'vorbește DOAR despre ce scrie mai sus și nu spune că descrii toată figura)');
    }
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

/**
 * Fereastra de tokeni pe minut a furnizorului.
 *
 * Pe tierul gratuit Groq sunt 8000. Nu e o preferință de-a noastră, e plafonul
 * peste care cererea primește „request too large" — și tot de el depinde cât
 * din lecție îi putem arăta modelului deodată. Stă în variabilă de mediu tocmai
 * ca trecerea pe un plan plătit (sute de mii de tokeni pe minut) să fie o
 * singură linie de configurare, nu o rescriere de prompturi.
 */
const FEREASTRA_TOKENI = Number(process.env.VOICE_TOKEN_WINDOW || 8000);

/**
 * Cât consumă româna, MĂSURAT, nu presupus.
 *
 * O cerere reală de narațiune: 11 619 caractere de prompt = 4143 de tokeni
 * raportați de furnizor, adică 2,80 caractere pe token. Estimarea de 3,3 pe
 * care o folosisem lăsa cererea cu 343 de tokeni peste fereastră: primea 413,
 * cobora pe modelul mic și explicația ieșea de trei ori mai scurtă — fără nici
 * un semn că ceva ar fi mers prost.
 */
const CARACTERE_PE_TOKEN = 2.8;

/** Promptul de sistem al narațiunii, măsurat: 6429 de caractere ≈ 2296 de tokeni. */
const TOKENI_PROMPT_SISTEM = 2400;

/**
 * Câte caractere de sursă încap, lăsând loc instrucțiunilor și răspunsului.
 *
 * Se scad: promptul de sistem (măsurat), rezerva pentru
 * răspuns, și 5% marjă pentru estimarea grosolană a tokenilor. Ce rămâne e
 * pentru material. Când fereastra e mare, plafonul devine lungimea maximă a
 * unei lecții și limita practic dispare.
 */
export function bugetSursaCaractere(rezervaRaspuns) {
  const disponibil = FEREASTRA_TOKENI * 0.95 - TOKENI_PROMPT_SISTEM - (rezervaRaspuns || 0);
  return Math.max(1500, Math.round(disponibil * CARACTERE_PE_TOKEN));
}

/**
 * Împarte lecția în bucăți care încap fiecare în fereastra furnizorului.
 *
 * 40% dintre lecțiile reale (88 din 219, măsurat) sunt mai lungi decât încape
 * într-o singură cerere pe tierul gratuit. Alternativa — să tăiem sursa la
 * plafon — înseamnă că elevul primește o explicație care se oprește pe la
 * jumătatea lecției fără să spună nimeni nimic. O tăiere pe care nu o vede
 * nimeni e mai rea decât o generare mai lentă.
 *
 * Tăiem la titlurile de nivel 2, pentru că acolo taie și profesorul: fiecare
 * bucată e o parte întreagă a lecției. Dacă o singură parte e prea mare, se
 * taie mai departe la rând gol — nu la mijloc de frază.
 */
export function imparteLectia(source, maxChars) {
  const text = String(source || '');
  if (text.length <= maxChars) return [text];

  const parti = text.split(/\n(?=##\s)/);
  const bucati = [];
  let curent = '';

  const adauga = (parte) => {
    if (!curent) { curent = parte; return; }
    if (curent.length + parte.length + 1 <= maxChars) curent += `\n${parte}`;
    else { bucati.push(curent); curent = parte; }
  };

  for (const parte of parti) {
    if (parte.length <= maxChars) { adauga(parte); continue; }
    // O parte singură nu încape: o rupem la rând gol, păstrând paragrafele.
    let rest = parte;
    while (rest.length > maxChars) {
      const taietura = rest.lastIndexOf('\n\n', maxChars);
      const punct = taietura > maxChars * 0.5 ? taietura : maxChars;
      adauga(rest.slice(0, punct));
      rest = rest.slice(punct);
    }
    adauga(rest);
  }
  if (curent) bucati.push(curent);

  /**
   * Fără segmente-fantomă: o bucată sub 500 de caractere nu justifică o cerere
   * LLM întreagă — auditul a găsit segmente de 12-374 de caractere care primeau
   * fiecare un prompt complet, iar pe unul modelul a COPIAT titlurile-exemplu
   * din prompt în loc să predea. Se lipesc de vecina lor; o mică depășire a
   * plafonului e mai ieftină decât o cerere-fantomă.
   */
  const pline = [];
  for (const b of bucati) {
    if (pline.length && b.length < 500) pline[pline.length - 1] += `\n${b}`;
    else pline.push(b);
  }
  if (pline.length >= 2 && pline[pline.length - 1].length < 500) {
    const mic = pline.pop();
    pline[pline.length - 1] += `\n${mic}`;
  }
  return pline;
}

/** Materialul sursă, identic pentru ambele treceri — singura realitate permisă. */
/**
 * Înlocuiește în sursă fiecare SVG cu GEOMETRIA lui citită.
 *
 * Markup-ul brut (path-uri, coordonate) nu spune nimic unui model de limbaj și
 * mănâncă tot bugetul de tokeni. `describeFigure` citește desenul — ce puncte,
 * ce segmente, ce e egal, unde e unghi drept — și le scrie în română. Așa figura
 * ajunge la model ca INFORMAȚIE, nu ca gunoi de coordonate, iar restul lecției
 * încape lângă ea. Un desen decorativ (fără conținut) dispare complet.
 */
/**
 * Sursa lecției, PREGĂTITĂ pentru model: fără frontmatter, fără importuri, cu
 * figurile deja înlocuite de geometria citită.
 *
 * Ordinea contează — auditul a arătat că segmentarea rula pe sursa BRUTĂ:
 * SVG-urile (275 în 61 de lecții) erau tăiate în două la granițele segmentelor,
 * iar modelul primea „supă de coordonate" prezentată drept lecție — ~29% din tot
 * materialul trimis. Curățată O DATĂ aici, aceeași sursă alimentează segmentarea,
 * prompturile, repararea și garda de fidelitate — o singură realitate.
 */
export function curataSursa(mdx) {
  return inlocuiesteFiguri(
    String(mdx || '')
      .replace(/^---[\s\S]*?---\s*/, '')
      .replace(/^\s*import\s.+$/gm, '')
  ).replace(/\n{3,}/g, '\n\n');
}

/**
 * Figura, așa cum o citește modelul.
 *
 * Ordinea contează: descrierea scrisă de autor (`<title>`, `aria-label`) vine
 * prima, fiindcă spune ce vrea figura să arate; geometria dedusă vine după, ca
 * detaliu. Iar dacă figura are părți desenate din cod, pe care nu le putem
 * citi, o spunem aici — altfel modelul primește un fragment și îl explică drept
 * întreg desen.
 */
function scrieFigura(fig) {
  const invata = (fig.descrieri || []).length + (fig.didactice || []).length;
  // Fără nimic de învățat din ea, figura e decor: un bloc gol ar fi tot o figură
  // în ochii modelului, adică o invitație să spună ceva despre ea.
  if (!fig.meaningful || !invata) return '[figură decorativă — se ignoră]';
  const linii = ['[FIGURĂ:'];
  for (const d of fig.descrieri) linii.push(`  descrierea autorului: ${d}`);
  if (fig.didactice && fig.didactice.length) {
    linii.push('  ce arată desenul (asta se spune elevului):');
    fig.didactice.forEach((f) => linii.push(`    - ${f}`));
  }
  /**
   * Inventarul de segmente NU se trimite deloc.
   *
   * A fost trimis ca „context, nu-l enumera" și modelul l-a enumerat oricum —
   * ba a și inventat, dintr-o listă de trei segmente scoțând un al patrulea,
   * „segmentul de la M la M", care nu exista nicăieri. Nu are cum să recite
   * ceva ce nu primește, iar pierderea e zero: elevul VEDE desenul pe ecran,
   * are nevoie de ce înseamnă el, nu de lista liniilor din care e făcut.
   */
  if (fig.necitite) {
    linii.push('  (figura mai are părți desenate din cod, pe care nu le poți vedea — '
      + 'vorbește DOAR despre ce scrie mai sus și nu spune că descrii toată figura)');
  }
  linii.push(']');
  return `\n${linii.join('\n')}\n`;
}

export function inlocuiesteFiguri(mdx) {
  return inlocuiesteComponente(
    String(mdx).replace(/<svg[\s\S]*?<\/svg>/gi, (svg) => scrieFigura(describeFigure(svg))),
    (fig) => scrieFigura(fig)
  );
}

export function renderSource(section, maxChars = 12000) {
  /**
   * Dacă avem sursa brută, ea ESTE materialul.
   *
   * Reconstrucția de mai jos — text din DOM, formule reconvertite, figuri
   * descrise de noi — pierdea notația exactă și ordinea lecției. Un model care
   * primește `0,1` deja interpretat își permite să dea altă interpretare;
   * primind `0{,}1` din fișier, nu are ce reinterpreta. Iar structura lecției e
   * explicită în cod, nu trebuie dedusă. SVG-urile le înlocuim ÎNAINTE de tăiere
   * cu geometria citită — altfel modelul nu vede figurile, doar path-uri.
   */
  if (section.sourceCode && String(section.sourceCode).trim().length > 40) {
    return [
      'Acesta este codul sursă EXACT al lecției, așa cum e scris de profesor.',
      'NUMERELE le scrii cu cifre („0,1", „37540,85") — nu le rostești în cuvinte și nu le',
      'rescrii în altă formă („zece la puterea minus unu"). FORMULELE cu notație matematică',
      '(cele dintre $...$ sau din blocurile de formule) le COPIEZI între dolari, cu LaTeX-ul lor',
      'exact — elevul le vede randate, iar vocea le citește singură. Ordinea titlurilor este ordinea lecției.',
      'Blocurile [FIGURĂ: ...] sunt desene din lecție, citite pentru tine: conțin DOAR ce',
      'arată desenul — o egalitate, un unghi drept, o valoare. Le spui ca fapt, în fraza ta,',
      'fără să pomenești că există o figură. Nu descrii desenul și nu enumeri linii: elevul',
      'îl vede pe ecran, de la tine are nevoie de înțelesul lui.',
      '',
      '```mdx',
      inlocuiesteFiguri(section.sourceCode).slice(0, maxChars),
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
- PRIMUL rând al explicației este TITLUL lecției, copiat exact cum e scris în material (fără semnul „#"), singur, ca propoziție de sine stătătoare încheiată cu punct. Abia pe rândul următor începe lecția.
- Apoi spui, în două fraze, ce va ști elevul la final — pe un ton natural și cald: „În acest curs vom aborda…", „O să înveți să…". Fără „în această lecție" și fără formulări de robot.
- Parcurgi părțile în ordinea din material și le LEGI între ele. Fiecare parte nouă începe de la ce tocmai s-a înțeles: „Acum că știi ce separă virgula, hai să vedem cum se citește numărul".
- Exemplele se fac pe îndelete, cu voce tare, pas cu pas. Ele sunt lecția; regula fără exemplu nu se reține.
- Când o parte e grea, te oprești și o reformulezi altfel, o singură dată.
- Închei strângând firul: ce am învățat, în trei-patru propoziții, în ordinea în care s-au construit. Fără să te povestești pe tine — spui MATEMATICA învățată, nu că ai explicat-o.`;

/**
 * @param {object} [segment] Bucata de lecție de predat acum, când lecția nu
 *   încape într-o singură cerere: `{index, total, sursa, dinainte}`.
 */
/**
 * Formulele `$...$` dintr-o bucată de sursă, unice și scurte.
 *
 * Se dau modelului ca LISTĂ, nu ca regulă în proză: la titluri, lista concretă a
 * funcționat acolo unde trei propoziții de instrucțiuni nu — modelul copiază ce
 * vede enumerat, dar ignoră ce i se cere abstract.
 */
function formuleleDin(sursa) {
  const gasite = [...String(sursa || '').matchAll(/\$([^$\n]{2,80})\$/g)].map((m) => m[1].trim());
  return [...new Set(gasite)].filter((f) => /[\\^_{}]|\d/.test(f)).slice(0, 25);
}

/** Titlurile ##/### dintr-o bucată de sursă, curățate de marcaje. */
function titlurileDin(sursa) {
  return [...String(sursa || '').matchAll(/^#{2,3}\s+(.+?)\s*$/gm)]
    .map((m) => m[1].replace(/[#*`_$\\{}]/g, '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

export function buildNarrationPrompt(section, analysis, segment) {
  const budget = speechBudget(section);
  const narratable = narratableAnalysis(analysis, section);
  const checklist = coverageChecklist(narratable);
  const lectie = esteLectieIntreaga(section);
  return {
    system: `Ești profesor de matematică într-o școală din România. Vorbești unui elev de gimnaziu care are nevoie de sprijin. Textul tău va fi CITIT CU VOCE TARE — deci scrii vorbire, nu articol.
${lectie ? LECTIE : ''}
Cum vorbești — asta contează cel mai mult, textul tău e AUZIT, nu citit:
- FRAZE SCURTE. Un singur gând într-o frază. Zece-cincisprezece cuvinte, apoi punct. O frază lungă, cu multe virgule, se aude ca un șir de cuvinte lipite, fără aer — elevul se pierde. Mai bine trei fraze scurte decât una lungă.
- Pui punct des. Punctul e locul unde vocea respiră. O idee, punct. Următoarea idee, punct.
- Cald și firesc, ca un profesor răbdător la tablă, nu ca un manual. Te adresezi direct elevului, cu „tu": „hai să vedem", „observi că", „acum știi".
- Legi ideile cu vorbe de trecere: „așadar", „hai să vedem", „acum că știi asta", „ai grijă aici". Fără ele, frazele sună tăiate una de alta, robotic.
- NU citești lecția cuvânt cu cuvânt. O explici cu vorbele tale, simplu.
- NU spui „în această secțiune", „după cum se observă", „vom analiza". Vorbește direct.
- ORGANIZEZI explicația PE SECȚIUNILE lecției. Fiecare titlu de secțiune din material devine un pas — ATÂT titlurile „## Titlu", CÂT ȘI subtitlurile „### 1. Titlu". Înaintea fiecărei secțiuni pui titlul EI pe un rând singur, între paranteze duble: [[Titlul secțiunii]]. Folosești DOAR titlurile din LISTA DE TITLURI de mai jos, copiate CARACTER CU CARACTER — inclusiv prefixele „a)", „b)", „1.", „3.1." — în ordinea lor — nu inventezi titluri noi și nu copiezi titluri din alte lecții. Dacă lista e goală, nu pui NICIUN marcaj. Titlurile în paranteze duble sunt SINGURELE marcaje permise.
- CHIAR ȘI ultimele secțiuni primesc titlul lor [[...]] și explicația lor completă, cu exemplele lor. Nu le comasa și nu le arunca într-o încheiere.
- FĂRĂ recapitulare, rezumat sau concluzie la final. NU scrii „ai învățat", „am parcurs", „în concluzie", „așadar ai văzut". După ultima secțiune ([[Aproximări]] sau oricare e ultima în lecție), explicată integral cu exemplele ei, te OPREȘTI. Ultima secțiune e ultimul lucru, nu un rezumat al tuturor.
- În rest: fără liste, fără alte titluri, fără emoji. Sub fiecare titlu, doar proză vorbită, curgătoare.
- Formulele se rostesc în cuvinte, niciodată caracter cu caracter. Dacă ai primit forma citită a unei formule, folosește exact acea formă.
- LITERELE FOLOSITE CA SIMBOL matematic se scriu între paranteze unghiulare: <a>, <b>, <k>, <x>, <n>. STRICT o singură literă între paranteze. NU pui în paranteze grupuri de litere, nume de unghiuri, segmente sau puncte: se scrie „unghiul M O N", „segmentul A B", nu „<MON>" sau „<AB>". Un grup de litere se scrie cu litere separate prin spațiu, ca să fie rostit literă cu literă. Exemplu: „restul împărțirii unui număr întreg <a> la un număr întreg <b>", „există un întreg <k> astfel încât <a> este egal cu <b> înmulțit cu <k>". Marcajul spune sintezei vocale cum să rostească litera (<k> se aude „capa", nu „chei"), iar elevul vede în transcript doar litera. NU scrii NICIODATĂ numele fonetic al unei litere ca text — „be", „ce", „de", „ef", „ge", „haș", „je", „capa", „em", „en", „es", „pe", „te", „ve", „ics", „igrec", „zet" sunt INTERZISE ca atare. O literă se scrie ORI cu marcaj (<b>, <k>), ORI ca majusculă într-un nume spațiat (M O N, A B). Niciodată fonetic. Nu marca literele din cuvinte obișnuite — „a plecat", „o carte", „e bine" se scriu normal. Fără ghilimele în jurul literelor.
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
- FORMA din material se păstrează, nu se „modernizează". Dacă acolo scrie „3 înmulțit cu 10000", spui „3 înmulțit cu 10000" — NU „3 înmulțit cu 10 la puterea 4". Dacă scrie „8 înmulțit cu 0,1", spui „8 înmulțit cu 0,1" — NU „8 înmulțit cu 10 la puterea minus 1". Rescrierea nu e greșită matematic, dar e din altă clasă decât lecția: elevul aude o notație pe care profesorul nu i-a predat-o și pierde firul.
- Nu introduci noțiuni care nu apar în secțiune.
- Mai bine spui mai puțin decât să inventezi. Corectitudinea este prioritatea absolută.

Acoperire — a doua regulă ca importanță:
- ABSOLUT FIECARE secțiune din material (fiecare titlu ## ȘI fiecare subtitlu ###) își are pasul ei cu titlul între [[...]], în ordinea din lecție. NICIO secțiune nu se sare, oricât de scurtă — dacă lecția are opt titluri și subtitluri, explicația are opt marcaje [[...]]. Înainte să închei, verifici că ai atins toate titlurile din material.
- În fiecare secțiune parcurgi TOT ce apare: fiecare definiție, fiecare formulă, fiecare exemplu (cu valorile exacte), fiecare informație DIDACTICĂ din figuri. Niciun punct nu se sare. Inventarul de segmente dintr-un desen nu e informație didactică: nu se enumeră.
- Respecți ordinea logică indicată.
- Termini ce ai început. Ultima idee se spune la fel de complet ca prima, iar textul se încheie cu o frază terminată — niciodată la mijlocul unui gând.

Nu comenta materialul, predă-l:
- NU vorbi despre lecție ca obiect: fără „definiția spune", „materialul arată", „formula din material", „noi vorbim despre ce scrie".
- NU menționa că există figuri, desene sau imagini ca obiecte („figura arată", „în imagine vedem"). Dacă un desen transmite ceva, spui direct informația: „unghiul din O este drept". ATENȚIE: asta NU înseamnă să eviți formulele — o formulă scrisă între dolari e conținut matematic, nu o referire la material; ea se scrie normal, în fraza ta.
- NU EVALUA materialul. Nu spui că ceva e bine sau prost făcut, clar sau neclar, complet sau incomplet, că lipsește ceva sau că nu se explică în detaliu. Nu ești corector, ești profesor: elevul are nevoie de conținut, nu de părerea ta despre lecție. Dacă ceva chiar lipsește din material, pur și simplu nu vorbești despre acel lucru.
- NU te povesti pe tine: fără „am parcurs", „am explicat", „închei cu speranța că", „sper că e clar", „în cele ce urmează". Ultima frază spune ultimul lucru de spus, apoi te oprești.
- NU repeta aceeași idee cu alte cuvinte. Spui lucrul o dată, clar, și mergi mai departe.

Cum scrii matematica (textul tău merge și la sinteza vocală, și pe ecran):
- Cu cifre și virgulă zecimală: „12,4", nu „12 virgulă 4" și nu „doisprezece virgulă patru".
- Fără separator de mii: „37540", „1000" — nu „37 540" și nu „1 000".
- În PROZĂ, fără simboluri matematice: scrii „înmulțit cu", „împărțit la", „minus", „la pătrat", nu „×", „÷", „−", „²". (Între dolari, în formule, notația rămâne exact cum e — vezi regula formulelor.)
- FORMULELE: când materialul conține o formulă cu notație matematică ($\\measuredangle MON$, $m(\\measuredangle AOB) = 80^\\circ$, $A = \\dfrac{b \\cdot h}{2}$), o COPIEZI între dolari, cu LaTeX-ul ei exact — NU o parafrazezi în cuvinte. Elevul o va VEDEA randată frumos, iar vocea o va citi în cuvinte automat — nu e treaba ta să o rostești. Exemplu corect: „Măsurăm unghiul: $m(\\measuredangle MON) = 70^\\circ$. Calculăm jumătate din măsură." Reguli: (1) doar notație adevărată între dolari — numerele simple („37540,85"), procentele și cuvintele rămân proză, fără dolari; literele-simbol singure folosesc marcajul <x>, nu dolari; (2) LaTeX-ul dintre dolari e cel din material (poți păstra doar bucata relevantă), nu inventat; (3) în afara dolarilor, NICIODATĂ notație — fără bare oblice inversate, fără acolade.

Explici, nu recitești:
- NU relua definiția cuvânt cu cuvânt. Desfă-o în pași: ce este, din ce e alcătuită, cum recunoști, la ce folosește — dar numai cu informația din material.
- Dacă materialul dă o regulă, spune-o și apoi arată ce înseamnă practic. Dacă materialul are un exemplu, exemplul lui este demonstrația: îl iei pas cu pas, spui de unde pleci, ce faci și ce obții.

LUNGIME: ai la dispoziție până la ${budget.words} de cuvinte (≈ ${budget.seconds} secunde) și cel puțin ${Math.round(budget.words * 0.75)}. Nu e o țintă de umplut: dacă ai acoperit tot ce era de acoperit mai devreme, te oprești. Dar nu sacrifici niciun punct din lista de acoperire ca să te încadrezi — spațiul e calculat ca să încapă tot.

Răspunzi NUMAI cu textul de rostit. Fără introducere, fără comentarii, fără ghilimele.`,

    /**
     * Ce vede narațiunea diferă după cât are de predat.
     *
     * La o SECȚIUNE încap amândouă: rezumatul analizei și materialul. E ieftin
     * și rezumatul chiar ajută la un fragment scurt.
     *
     * La o LECȚIE ÎNTREAGĂ nu încap. Am ținut întâi rezumatul și am scos
     * materialul — și s-a văzut la ascultare: narațiunea vorbea despre ce
     * extrăsese analiza, nu despre lecție. „O formulă care reprezintă un exemplu
     * de număr zecimal arată astfel. Apoi, o altă formulă arată reprezentarea
     * pozițională." Trei formule anunțate, niciun număr rostit — pentru că
     * modelul chiar nu le mai avea. Rezumatul e o hartă; nu poți preda o hartă.
     *
     * Deci la lecție ținem MATERIALUL și lăsăm rezumatul deoparte, păstrând din
     * el doar lista de acoperire. Sursa e mai mică decât rezumatul JSON și e
     * neambiguă: acolo scrie ce valori are lecția și în ce ordine.
     */
    user: lectie
      ? `Iată ${segment && segment.total > 1 ? `partea ${segment.index + 1} din ${segment.total} a lecției` : 'lecția'}, exact așa cum e scrisă de profesor. Ea este singura ta sursă.

${(() => {
  const titluri = titlurileDin(segment ? segment.sursa : section.sourceCode);
  return titluri.length
    ? `LISTA DE TITLURI (doar acestea, în această ordine, fiecare o singură dată):\n${titluri.map((t) => `[[${t}]]`).join('\n')}`
    : 'LISTA DE TITLURI: goală — această parte nu are titluri noi. NU pui niciun marcaj [[...]]; continui direct proza.';
})()}

${(() => {
  const formule = formuleleDin(segment ? segment.sursa : section.sourceCode);
  return formule.length
    ? `LISTA DE FORMULE (le SCRII în text exact așa, între dolari, acolo unde vorbești despre ele — nu le transformi în cuvinte; vocea le citește singură):\n${formule.map((f) => `$${f}$`).join('\n')}`
    : 'LISTA DE FORMULE: goală — lecția nu are notație matematică de afișat.';
})()}

--- MATERIAL SURSĂ ---
${
  segment
    ? renderSource({ ...section, sourceCode: segment.sursa }, segment.sursa.length)
    : renderSource(section, bugetSursaCaractere(budget.words * 3.5 + 350))
}
--- SFÂRȘIT MATERIAL ---
${
  checklist.length
    ? `\nLISTĂ DE ACOPERIRE — fiecare punct trebuie să se audă în explicație:\n${checklist
        .map((item, i) => `${i + 1}. ${item}`)
        .join('\n')}\n`
    : ''
}${
  /**
   * Continuitatea între bucăți, fără să retrimitem tot ce s-a spus.
   *
   * Ultimele fraze sunt de ajuns ca modelul să nu reia introducerea și să lege
   * ideea nouă de cea tocmai încheiată. Elevul aude o oră de curs, nu trei
   * explicații lipite.
   */
  segment && segment.total > 1
    ? `
CONTINUITATE — ești la mijlocul aceleiași ore de curs:
${segment.index === 0
  ? '- Ești la ÎNCEPUT: deschizi lecția, spui în două fraze ce va ști elevul la final, apoi intri în materialul de mai sus. NU încheia lecția — mai urmează.'
  : segment.index === segment.total - 1
    ? `- Ești la FINAL. Ultimele tale cuvinte au fost: „…${segment.dinainte}"\n- Continui de acolo, fără să te prezinți din nou și fără să reiei ce ai spus. La sfârșit închei natural, cu o singură frază de încheiere — fără recapitulare lungă.`
    : `- Ești la MIJLOC. Ultimele tale cuvinte au fost: „…${segment.dinainte}"\n- Continui de acolo, legând ideea nouă de cea tocmai încheiată. NU deschizi și NU închei lecția — mai urmează.`}
`
    : ''
}
Predă-i acum elevului ${segment && segment.total > 1 ? 'această parte' : 'lecția întreagă'}, cu voce tare, în română, în ordinea din material. Fiecare exemplu se face cu valorile lui exacte. Încheie cu o frază completă.`
      : `Ai citit deja secțiunea. Iată ce ai înțeles (doar fapte confirmate):

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
