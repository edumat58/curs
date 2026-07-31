/**
 * Ce se vede într-o figură — dedus din SVG, nu ghicit.
 *
 * Înainte, promptul primea despre o figură atât: etichetele („O", „B", „A"),
 * un inventar de forme („line×3, circle×1") și 400 de caractere de markup.
 * Din asta nu se poate spune nimic didactic, iar modelul umplea golul cu
 * formulări goale — „figura arată o reprezentare grafică" — sau, mai rău, cu
 * păreri despre calitatea desenului.
 *
 * Un SVG nu e însă o imagine: e geometrie scrisă. Coordonatele spun exact ce
 * spune desenul — care punct e centrul, ce segmente pleacă din el, care sunt
 * egale, unde e unghi drept. Aici le citim și le scriem în română, ca modelul
 * să primească FAPTE despre figură, nu pixeli.
 *
 * Când nu iese nimic sigur, spunem asta explicit. O figură decorativă nu
 * trebuie explicată — trebuie ignorată.
 */

/** Cercurile mici pline nu sunt cercuri: sunt bulina care marchează un punct. */
const RAZA_MAXIMA_BULINA = 6;
/** Cât de departe poate sta eticheta de punctul pe care îl denumește. */
const APROPIERE_ETICHETA = 0.09;
/** Toleranța la egalitate de lungimi și la unghi drept (SVG-urile sunt desenate de mână). */
const TOLERANTA_LUNGIME = 0.03;
const TOLERANTA_UNGHI_DREPT = 0.06;

function numberAttr(tag, name) {
  const match = new RegExp(`\\b${name}\\s*=\\s*["']?(-?[\\d.]+)`, 'i').exec(tag);
  return match ? Number(match[1]) : null;
}

function isDashed(tag) {
  return /stroke-?dasharray\s*=\s*["']?[^"'\s>]/i.test(tag);
}

/**
 * Liniile punctate stau de obicei într-un `<g stroke-dasharray=...>`, nu au
 * atributul pe ele. Îl coborâm pe fiecare element din grup, ca restul codului
 * să nu mai știe nimic despre moștenirea de atribute. Grupurile din figurile
 * astea nu se imbrică, deci o singură trecere e suficientă.
 */
function propagateDashes(markup) {
  return String(markup).replace(
    /<g\b([^>]*)>([\s\S]*?)<\/g>/gi,
    (all, attrs, body) => (isDashed(attrs)
      ? all.replace(body, body.replace(/<(line|circle|path|polyline|polygon)\b/gi, '<$1 stroke-dasharray="4"'))
      : all)
  );
}

/** Etichetele desenate, cu poziția lor: `<text x="130" y="145">O</text>`. */
function readLabels(markup) {
  const labels = [];
  const re = /<text\b([^>]*)>([\s\S]*?)<\/text>/gi;
  let m;
  while ((m = re.exec(markup)) !== null) {
    const text = m[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    const x = numberAttr(m[1], 'x');
    const y = numberAttr(m[1], 'y');
    if (text && x !== null && y !== null) labels.push({ text, x, y });
  }
  return labels;
}

function readTags(markup, name) {
  const found = [];
  const re = new RegExp(`<${name}\\b([^>]*)>`, 'gi');
  let m;
  while ((m = re.exec(markup)) !== null) found.push(m[1]);
  return found;
}

/** Dimensiunea desenului, pentru toleranțe proporționale cu el. */
function canvasSize(markup) {
  const viewBox = /viewBox\s*=\s*["']([^"']+)["']/i.exec(markup);
  if (viewBox) {
    const parts = viewBox[1].trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      return Math.hypot(parts[2], parts[3]);
    }
  }
  const w = numberAttr(markup.slice(0, 300), 'width');
  const h = numberAttr(markup.slice(0, 300), 'height');
  return w && h ? Math.hypot(w, h) : 400;
}

/** Eticheta cea mai apropiată de un punct — sau nimic, dacă e prea departe. */
function labelAt(labels, x, y, tolerance) {
  let best = null;
  let bestDistance = Infinity;
  for (const label of labels) {
    const distance = Math.hypot(label.x - x, label.y - y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = label;
    }
  }
  return bestDistance <= tolerance ? best.text : null;
}

/**
 * Ce poate fi numele unui punct: o majusculă, eventual cu prim sau indice
 * („A", „M'", „A₁"), ori un număr — reperele de pe o dreaptă numerică.
 *
 * Fără filtrul ăsta, axele unui grafic deveneau geometrie: eticheta „Nota" de
 * sub axa orizontală stătea lângă capătul ei, așa că descrierea ieșea
 * „segmentul de la 0 la Nota" — o propoziție pe care modelul nu avea cum să o
 * refuze, fiindcă îi era dată drept fapt.
 */
const NUME_PUNCT = /^(?:[A-Z][′'’]?[₀-₉0-9]?|-?\d+(?:[,.]\d+)?)$/u;

function pointName(labels, x, y, tolerance) {
  const nume = labelAt(labels, x, y, tolerance);
  return nume && NUME_PUNCT.test(nume) ? nume : null;
}

/** Titluri puse de editorul grafic, nu de autor: nu descriu nimic. */
const TITLU_GOL = /^(?:layer\s*\d*|untitled|no\s*name|image|imagine|svg|group|g|artboard|path|rect)$/i;

/**
 * Descrierea scrisă de om, dacă există.
 *
 * `<title>`, `<desc>` și `aria-label` sunt puse în figuri pentru cititoarele de
 * ecran — adică exact pentru cazul nostru: cineva care nu vede desenul. Sunt
 * mai bune decât orice deducem noi din coordonate („Dreaptă numerică cu
 * sărituri 3 și zecimi până la 13,6"), fiindcă spun INTENȚIA figurii, nu forma
 * ei. Le citeam până acum ca pe niște etichete oarecare, adică deloc.
 */
function descrieriScrise(markup) {
  const gasite = [];
  for (const re of [/<title\b[^>]*>([\s\S]*?)<\/title>/gi, /<desc\b[^>]*>([\s\S]*?)<\/desc>/gi]) {
    let m;
    while ((m = re.exec(markup)) !== null) {
      const text = m[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      if (text && !TITLU_GOL.test(text)) gasite.push(text);
    }
  }
  let m;
  const aria = /aria-label\s*=\s*["']([^"']+)["']/gi;
  while ((m = aria.exec(markup)) !== null) {
    const text = m[1].replace(/\s+/g, ' ').trim();
    if (text && !TITLU_GOL.test(text)) gasite.push(text);
  }
  return [...new Set(gasite)];
}

/**
 * Elementele desenate din cod, nu scrise în figură: `<line x1={40 + i * 30}>`
 * sau un `{Array.from(...)}` care produce zeci de repere.
 *
 * Coordonatele lor nu există în text, deci nu avem cum să le citim. Important
 * nu e că le ratăm, ci că fără să le numărăm figura pare citită în întregime:
 * dintr-un grafic cu 9 bare generate rămâneau două axe, pe care le prezentam
 * drept „ce se vede în desen".
 */
function elementeGenerate(markup) {
  const cuExpresii = [...markup.matchAll(/<(?:line|circle|polygon|polyline|text|rect|path)\b([^>]*)>/gi)]
    .filter(([, attrs]) => /\b(?:x1|y1|x2|y2|cx|cy|x|y|points|d|width|height)\s*=\s*\{/.test(attrs)).length;
  const generatoare = (markup.match(/\{\s*(?:Array\.from|\[[\s\S]{0,80}?\]\s*\.map|[a-zA-Z_$][\w$]*\s*\.map)\b/g) || []).length;
  return cuExpresii + generatoare;
}

/** Segmentele: din `<line>` și din laturile poligoanelor. */
function readSegments(markup, labels, tolerance) {
  const segments = [];

  for (const attrs of readTags(markup, 'line')) {
    const x1 = numberAttr(attrs, 'x1');
    const y1 = numberAttr(attrs, 'y1');
    const x2 = numberAttr(attrs, 'x2');
    const y2 = numberAttr(attrs, 'y2');
    if ([x1, y1, x2, y2].some((v) => v === null)) continue;
    segments.push({
      x1, y1, x2, y2,
      a: pointName(labels, x1, y1, tolerance),
      b: pointName(labels, x2, y2, tolerance),
      length: Math.hypot(x2 - x1, y2 - y1),
      dashed: isDashed(attrs),
    });
  }

  return segments;
}

function readPolygons(markup, labels, tolerance) {
  const polygons = [];
  for (const name of ['polygon', 'polyline']) {
    for (const attrs of readTags(markup, name)) {
      const raw = /points\s*=\s*["']([^"']+)["']/i.exec(attrs);
      if (!raw) continue;
      const numbers = raw[1].trim().split(/[\s,]+/).map(Number).filter((n) => !Number.isNaN(n));
      const vertices = [];
      for (let i = 0; i + 1 < numbers.length; i += 2) {
        vertices.push({
          x: numbers[i],
          y: numbers[i + 1],
          label: pointName(labels, numbers[i], numbers[i + 1], tolerance),
        });
      }
      if (vertices.length >= 3) polygons.push({ vertices, closed: name === 'polygon' });
    }
  }
  return polygons;
}

/** Numele figurii cu n laturi, așa cum îi spune elevul. */
function polygonName(sides) {
  return {
    3: 'triunghi', 4: 'patrulater', 5: 'pentagon', 6: 'hexagon',
  }[sides] || `poligon cu ${sides} laturi`;
}

/**
 * Unghiurile drepte: două segmente care pornesc din același punct și fac 90°.
 *
 * Vârful se caută la punctul COMUN, nu printre capetele oricăruia dintre
 * segmente. Altfel, la o proiecție pe axă, unghiul drept din P' era raportat
 * în P — adică exact în celălalt capăt al perpendicularei.
 */
function rightAngles(segments, labels, tolerance) {
  const found = [];
  for (let i = 0; i < segments.length; i += 1) {
    for (let j = i + 1; j < segments.length; j += 1) {
      const s = segments[i];
      const t = segments[j];
      for (const [sx, sy, sox, soy] of [[s.x1, s.y1, s.x2, s.y2], [s.x2, s.y2, s.x1, s.y1]]) {
        for (const [tx, ty, tox, toy] of [[t.x1, t.y1, t.x2, t.y2], [t.x2, t.y2, t.x1, t.y1]]) {
          if (Math.hypot(sx - tx, sy - ty) > tolerance) continue;
          const u = [sox - sx, soy - sy];
          const v = [tox - tx, toy - ty];
          const norm = Math.hypot(...u) * Math.hypot(...v);
          if (!norm) continue;
          const cosine = Math.abs((u[0] * v[0] + u[1] * v[1]) / norm);
          if (cosine <= TOLERANTA_UNGHI_DREPT) {
            found.push({ vertex: pointName(labels, sx, sy, tolerance) });
          }
        }
      }
    }
  }
  return found;
}

/** Segmentele de aceeași lungime — informația didactică din spatele desenului. */
function equalGroups(segments) {
  const named = segments.filter((s) => s.a && s.b && s.length > 0);
  const groups = [];
  for (const segment of named) {
    const group = groups.find(
      (g) => Math.abs(g.length - segment.length) / g.length <= TOLERANTA_LUNGIME
    );
    if (group) group.items.push(`${segment.a}${segment.b}`);
    else groups.push({ length: segment.length, items: [`${segment.a}${segment.b}`] });
  }
  return groups.filter((g) => g.items.length > 1).map((g) => g.items);
}

/**
 * Descrierea figurii, în fraze românești.
 * @returns {{meaningful: boolean, facts: string[], didactice: string[],
 *            labels: string[], descrieri: string[], necitite: number}}
 */
export function describeFigure(markup) {
  const source = propagateDashes(String(markup || ''));
  if (!source.trim()) return { meaningful: false, facts: [], didactice: [], labels: [], descrieri: [], necitite: 0 };
  const descrieri = descrieriScrise(source);
  const necitite = elementeGenerate(source);

  const size = canvasSize(source);
  const tolerance = size * APROPIERE_ETICHETA;
  const labels = readLabels(source);
  const segments = readSegments(source, labels, tolerance);
  const polygons = readPolygons(source, labels, tolerance);

  /**
   * Două feluri de fapte, deliberat separate.
   *
   * „Segmentul de la O la M" spune ce e desenat; „segmentele OP și ON au
   * aceeași lungime" spune ce se ÎNVAȚĂ din desen. Amestecate, modelul le
   * trata la fel și — ascultător la regula că nu sare nimic — recita lista de
   * segmente: „segmentul de la O la N este însoțit de un segment de la O la
   * punct trasat punctat". Elevul nu învață nimic dintr-un inventar, iar
   * modelul, recitând, mai și greșea numele punctelor.
   */
  const elemente = [];
  const didactice = [];
  const facts = elemente;

  // Punctele marcate cu bulină: cercurile mici și pline.
  const markers = [];
  const circles = [];
  for (const attrs of readTags(source, 'circle')) {
    const cx = numberAttr(attrs, 'cx');
    const cy = numberAttr(attrs, 'cy');
    const r = numberAttr(attrs, 'r');
    if (cx === null || cy === null || r === null) continue;
    const name = pointName(labels, cx, cy, tolerance);
    if (r <= RAZA_MAXIMA_BULINA) markers.push(name);
    else circles.push({ cx, cy, r, name, dashed: isDashed(attrs) });
  }

  for (const circle of circles) {
    const radiusSegment = segments.find(
      (s) => Math.abs(Math.hypot(s.x2 - circle.cx, s.y2 - circle.cy) - circle.r) < tolerance
        || Math.abs(Math.hypot(s.x1 - circle.cx, s.y1 - circle.cy) - circle.r) < tolerance
    );
    facts.push(
      circle.name
        ? `un cerc cu centrul în ${circle.name}${radiusSegment ? ', cu raza trasată' : ''}`
        : 'un cerc'
    );
  }

  for (const polygon of polygons) {
    const named = polygon.vertices.map((v) => v.label).filter(Boolean);
    const name = polygonName(polygon.vertices.length);
    facts.push(
      named.length === polygon.vertices.length
        ? `un ${name} cu vârfurile ${named.join(', ')}`
        : `un ${name}`
    );
  }

  /**
   * Un segment are două capete DIFERITE.
   *
   * Când două puncte apropiate au o singură etichetă între ele — capătul unei
   * linii ajutătoare și piciorul perpendicularei, de pildă — amândouă o
   * revendică, iar din desen ieșea „segmentul de la M la M". Modelul primea
   * asta ca fapt și nu avea cum să o pună la îndoială.
   */
  const namedSegments = segments.filter((s) => s.a && s.b && s.a !== s.b);
  for (const segment of namedSegments) {
    facts.push(
      `segmentul de la ${segment.a} la ${segment.b}${segment.dashed ? ', trasat punctat (linie ajutătoare)' : ''}`
    );
  }

  for (const group of equalGroups(segments)) {
    didactice.push(`segmentele ${group.join(' și ')} au aceeași lungime`);
  }

  const drepte = rightAngles(segments, labels, tolerance).filter((a) => a.vertex);
  const varfuri = [...new Set(drepte.map((a) => a.vertex))];
  for (const varf of varfuri) didactice.push(`un unghi drept cu vârful în ${varf}`);

  const marked = markers.filter(Boolean);
  if (marked.length) facts.push(`punctele marcate: ${marked.join(', ')}`);

  const paths = readTags(source, 'path');
  const arcs = paths.filter((attrs) => /\bd\s*=\s*["'][^"']*[Aa]/.test(attrs)).length;
  if (arcs) didactice.push(`${arcs} arc${arcs > 1 ? 'e' : ''} de cerc (de obicei marchează un unghi)`);

  const allLabels = labels.map((l) => l.text);
  // O figură fără etichete și fără geometrie recunoscută nu poate fi explicată:
  // e decor. Mai bine o spunem, decât să lăsăm modelul să improvizeze. O
  // descriere scrisă de autor salvează însă și o figură din care n-am citit
  // nimic: acolo omul a spus deja ce arată desenul.
  const meaningful = (facts.length + didactice.length > 0 && allLabels.length > 0) || descrieri.length > 0;

  return { meaningful, facts, didactice, labels: allLabels, descrieri, necitite };
}

/**
 * Figurile care nu sunt SVG: componentele care DESENEAZĂ.
 *
 * `<BarChart series={[{data:[80,40,60,30]}]}>` nu conține niciun `<svg>`, deci
 * până acum trecea nevăzută pe lângă cititorul de figuri — modelul primea în
 * schimb codul JSX brut și avea de ales între a-l ignora și a inventa ceva pe
 * baza lui. Datele sunt însă scrise în clar chiar acolo: categoriile, valorile,
 * reperele. Le citim la fel ca geometria dintr-un SVG.
 */
const COMPONENTE_FIGURA = ['PieChart', 'BarChart', 'LineChart', 'NumberLine', 'GeometryDraw', 'Tree'];

/**
 * Textul întreg al unei componente, cu acolade și șiruri echilibrate.
 *
 * O expresie regulată nu poate face asta: `spec={{ axis: {...} }}` are acolade
 * imbricate, iar `code={`...`}` conține paranteze și ghilimele care nu închid
 * nimic. Scanăm o dată, ținând minte unde suntem.
 */
function gasesteComponente(mdx) {
  const text = String(mdx || '');
  const gasite = [];
  const re = new RegExp(`<(${COMPONENTE_FIGURA.join('|')})\\b`, 'g');
  let m;
  while ((m = re.exec(text)) !== null) {
    let adancime = 0;
    let sir = null;
    let i = m.index + m[0].length;
    for (; i < text.length; i += 1) {
      const c = text[i];
      if (sir) {
        if (c === sir && text[i - 1] !== '\\') sir = null;
      } else if (c === '"' || c === "'" || c === '`') {
        sir = c;
      } else if (c === '{') {
        adancime += 1;
      } else if (c === '}') {
        adancime -= 1;
      } else if (c === '>' && adancime === 0) {
        break;
      }
    }
    gasite.push({ nume: m[1], text: text.slice(m.index, i + 1), start: m.index, end: i + 1 });
    re.lastIndex = i + 1;
  }
  return gasite;
}

/** Listele `data: [...]`, separate în categorii (text) și valori (numere). */
function listeDeDate(corp) {
  const categorii = [];
  const valori = [];
  const obiecte = [];
  for (const m of corp.matchAll(/\bdata\s*:\s*\[([\s\S]*?)\]/g)) {
    const brut = m[1].trim();
    if (brut.startsWith('{')) {
      for (const o of brut.matchAll(/\{[^{}]*\}/g)) {
        const eticheta = /\blabel\s*:\s*['"]([^'"]+)/.exec(o[0]);
        const valoare = /\bvalue\s*:\s*(-?[\d.]+)/.exec(o[0]);
        if (eticheta || valoare) obiecte.push({ eticheta: eticheta && eticheta[1], valoare: valoare && valoare[1] });
      }
    } else if (/^['"]/.test(brut)) {
      categorii.push(...[...brut.matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]));
    } else {
      valori.push(...brut.split(',').map((x) => x.trim()).filter((x) => /^-?[\d.]+$/.test(x)));
    }
  }
  return { categorii, valori, obiecte };
}

function perechi(categorii, valori) {
  return categorii.map((c, i) => (valori[i] !== undefined ? `${c} — ${valori[i]}` : c));
}

/**
 * Ce spune o componentă-figură, în aceeași formă ca un SVG citit.
 * @returns {{meaningful: boolean, facts: string[], labels: string[],
 *            descrieri: string[], necitite: number}}
 */
export function describeComponent(nume, corp) {
  const text = String(corp || '');
  const facts = [];
  const descrieri = descrieriScrise(text);

  if (nume === 'PieChart' || nume === 'BarChart' || nume === 'LineChart') {
    const { categorii, valori, obiecte } = listeDeDate(text);
    const fel = { PieChart: 'diagramă circulară', BarChart: 'diagramă cu bare', LineChart: 'grafic cu linie' }[nume];
    if (obiecte.length) {
      facts.push(`o ${fel} cu ${obiecte.length} sectoare`);
      facts.push(`valorile din diagramă: ${obiecte.map((o) => [o.eticheta, o.valoare].filter(Boolean).join(' — ')).join(', ')}`);
    } else if (categorii.length) {
      facts.push(`o ${fel} cu ${categorii.length} categorii`);
      facts.push(`valorile din diagramă: ${perechi(categorii, valori).join(', ')}`);
    } else if (valori.length) {
      facts.push(`un ${fel} prin valorile ${valori.join(', ')}`);
    }
  } else if (nume === 'NumberLine') {
    const repere = [...text.matchAll(/['"](-?\d+(?:[,.]\d+)?)['"]\s*:/g)].map((x) => x[1]);
    if (repere.length) {
      const numere = repere.map((x) => Number(String(x).replace(',', '.')));
      facts.push(`o dreaptă numerică cu reperele de la ${Math.min(...numere)} la ${Math.max(...numere)}`);
      if (repere.length <= 14) facts.push(`reperele marcate: ${repere.join(', ')}`);
    } else {
      facts.push('o dreaptă numerică');
    }
    for (const m of text.matchAll(/\blabel\s*:\s*['"]([^'"]+)/g)) facts.push(`pe dreaptă scrie: ${m[1]}`);
  } else if (nume === 'GeometryDraw') {
    // Mini-limbajul componentei: `AB;BC;AC` sunt segmente, `A(5,25)` sunt
    // puncte, `label{'32mm';(15,6)}` sunt măsurile scrise pe desen.
    const cod = (/code\s*=\s*\{`([\s\S]*?)`\}/.exec(text) || [])[1] || '';
    const puncte = [...new Set([...cod.matchAll(/^\s*([A-Z][′'’]?\d?)\s*\(/gm)].map((x) => x[1]))];
    const segmente = [...new Set(
      cod.split(/\r?\n/)
        .filter((l) => /^\s*[A-Z][A-Z0-9;]*\s*(?:\{[^}]*\})?\s*$/.test(l))
        .flatMap((l) => l.trim().replace(/\{[^}]*\}/g, '').split(';'))
        .map((s) => s.trim())
        .filter((s) => /^[A-Z]{2,}$/.test(s))
    )];
    const masuri = [...new Set([...cod.matchAll(/label\s*\{\s*['"]([^'"]+)['"]/g)].map((x) => x[1]))];
    if (segmente.length) facts.push(`o figură geometrică cu segmentele ${segmente.join(', ')}`);
    if (puncte.length) facts.push(`punctele desenate: ${puncte.join(', ')}`);
    if (masuri.length) facts.push(`măsurile scrise pe figură: ${masuri.join(', ')}`);
  } else if (nume === 'Tree') {
    const ramuri = [...text.matchAll(/([\w,.]+)\s*->\s*([\w,.]+)/g)].map((x) => `${x[1]} → ${x[2]}`);
    if (ramuri.length) {
      facts.push(`o diagramă-arbore cu ${ramuri.length} ramuri`);
      if (ramuri.length <= 12) facts.push(`ramurile: ${ramuri.join(', ')}`);
    } else {
      facts.push('o diagramă-arbore');
    }
  }

  return { meaningful: facts.length > 0 || descrieri.length > 0, facts: [], didactice: facts, labels: [], descrieri, necitite: 0 };
}

/** Înlocuiește fiecare componentă-figură cu descrierea ei. */
export function inlocuiesteComponente(mdx, redare) {
  const text = String(mdx || '');
  const gasite = gasesteComponente(text);
  if (!gasite.length) return text;
  let iesire = '';
  let cursor = 0;
  for (const c of gasite) {
    iesire += text.slice(cursor, c.start) + redare(describeComponent(c.nume, c.text), c.nume);
    cursor = c.end;
  }
  return iesire + text.slice(cursor);
}
