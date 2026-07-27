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

function pointName(labels, x, y, tolerance) {
  return labelAt(labels, x, y, tolerance) || null;
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
 * @returns {{meaningful: boolean, facts: string[], labels: string[]}}
 */
export function describeFigure(markup) {
  const source = propagateDashes(String(markup || ''));
  if (!source.trim()) return { meaningful: false, facts: [], labels: [] };

  const size = canvasSize(source);
  const tolerance = size * APROPIERE_ETICHETA;
  const labels = readLabels(source);
  const segments = readSegments(source, labels, tolerance);
  const polygons = readPolygons(source, labels, tolerance);

  const facts = [];

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

  const namedSegments = segments.filter((s) => s.a && s.b);
  for (const segment of namedSegments) {
    facts.push(
      `segmentul de la ${segment.a} la ${segment.b}${segment.dashed ? ', trasat punctat (linie ajutătoare)' : ''}`
    );
  }

  for (const group of equalGroups(segments)) {
    facts.push(`segmentele ${group.join(' și ')} au aceeași lungime`);
  }

  const drepte = rightAngles(segments, labels, tolerance).filter((a) => a.vertex);
  const varfuri = [...new Set(drepte.map((a) => a.vertex))];
  for (const varf of varfuri) facts.push(`un unghi drept cu vârful în ${varf}`);

  const marked = markers.filter(Boolean);
  if (marked.length) facts.push(`punctele marcate: ${marked.join(', ')}`);

  const paths = readTags(source, 'path');
  const arcs = paths.filter((attrs) => /\bd\s*=\s*["'][^"']*[Aa]/.test(attrs)).length;
  if (arcs) facts.push(`${arcs} arc${arcs > 1 ? 'e' : ''} de cerc (de obicei marchează un unghi)`);

  const allLabels = labels.map((l) => l.text);
  // O figură fără etichete și fără geometrie recunoscută nu poate fi explicată:
  // e decor. Mai bine o spunem, decât să lăsăm modelul să improvizeze.
  const meaningful = facts.length > 0 && allLabels.length > 0;

  return { meaningful, facts, labels: allLabels };
}
