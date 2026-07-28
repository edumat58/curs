/**
 * Nucleul partajat al sistemului AI Voice Teacher.
 *
 * Rulează IDENTIC în browser (client) și în Node (serviciul de voce), pentru ca
 * hash-ul calculat de client să fie exact hash-ul sub care serviciul a salvat
 * explicația. Fără această paritate, cache-ul nu ar nimeri niciodată.
 *
 * Nu depinde de React, de Docusaurus sau de DOM: primește payload-ul deja
 * extras de `lessonSections.mjs`.
 */

/** Normalizează spațierea, ca diferențele de randare să nu strice hash-ul. */
function norm(value) {
  return String(value == null ? '' : value)
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Rezumat determinist al unui SVG: extrage etichetele text și inventarul de
 * forme. NU folosim un model de viziune — SVG-ul este text structurat, deci
 * un rezumat exact e mai fidel decât o interpretare vizuală.
 */
export function summarizeSvg(markup) {
  const src = String(markup || '');

  const labels = [];
  const textRe = /<text\b[^>]*>([\s\S]*?)<\/text>/gi;
  let m;
  while ((m = textRe.exec(src)) !== null) {
    const label = norm(m[1].replace(/<[^>]*>/g, ''));
    if (label) labels.push(label);
  }

  const shapes = {};
  const shapeRe = /<(circle|ellipse|rect|line|polygon|polyline|path)\b/gi;
  while ((m = shapeRe.exec(src)) !== null) {
    const tag = m[1].toLowerCase();
    shapes[tag] = (shapes[tag] || 0) + 1;
  }

  const titleMatch = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(src);
  const descMatch = /<desc\b[^>]*>([\s\S]*?)<\/desc>/i.exec(src);
  const ariaMatch = /\baria-label\s*=\s*"([^"]*)"/i.exec(src);

  return {
    title: norm(titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : ''),
    description: norm(descMatch ? descMatch[1].replace(/<[^>]*>/g, '') : ''),
    ariaLabel: norm(ariaMatch ? ariaMatch[1] : ''),
    labels,
    shapes,
  };
}

/**
 * Forma canonică a unei secțiuni — singura sursă pentru hash.
 * Include doar ce influențează explicația; exclude ID-uri instabile, ordinea
 * atributelor sau detalii de stil.
 */
export function canonicalSection(section) {
  return {
    v: 1,
    // Aceeași lecție explicată ca secțiune și explicată integral, ca la clasă,
    // sunt două explicații diferite. Fără modul în forma canonică ar avea
    // același hash și una ar rămâne peste cealaltă în cache.
    //
    // Cheia apare DOAR pentru lecția întreagă, dinadins. Adăugată și la
    // secțiuni, ar schimba toate hash-urile existente și ar arunca un cache
    // valid — adică ar cere regenerarea a zeci de explicații bune, pe un buget
    // de tokeni care oricum e limitat pe zi.
    ...(section.mode === 'lectie' ? { mode: 'lectie' } : {}),
    heading: norm(section.heading),
    level: Number(section.level) || 0,
    text: norm(section.contentText != null ? section.contentText : section.text),
    latex: (section.latex || []).map((item) => norm(item.source)),
    visuals: (section.visuals || []).map((visual) => {
      if (visual.type === 'image') {
        return {
          t: 'image',
          src: norm(visual.src).replace(/^https?:\/\/[^/]+/, ''),
          alt: norm(visual.alt),
          label: norm(visual.label),
        };
      }
      const summary = summarizeSvg(visual.markup);
      return {
        t: 'svg',
        label: norm(visual.label),
        description: norm(visual.description),
        labels: summary.labels,
        shapes: summary.shapes,
      };
    }),
  };
}

/** Serializare stabilă (chei sortate) — obligatorie pentru un hash reproductibil. */
export function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(',')}}`;
}

/**
 * SHA-256 hex prin Web Crypto.
 *
 * Folosim exclusiv API-ul standard, disponibil identic în browser și în Node 20+
 * (`globalThis.crypto.subtle`). Fallback-ul pe `node:crypto` a fost eliminat
 * intenționat: importul lui rupea bundle-ul de browser al Docusaurus
 * („UnhandledSchemeError: node:crypto"), iar acest modul trebuie să ruleze în
 * ambele medii cu același cod.
 */
export async function sha256Hex(input) {
  const webcrypto = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (!webcrypto || !webcrypto.subtle) {
    throw new Error('Web Crypto indisponibil: e nevoie de browser modern sau Node ≥ 20.');
  }
  const bytes = new TextEncoder().encode(input);
  const digest = await webcrypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash-ul unei secțiuni. `promptVersion` intră în hash intenționat: dacă
 * îmbunătățim prompturile, tot conținutul se regenerează controlat, chiar dacă
 * textul lecției nu s-a schimbat.
 */
export async function sectionHash(section, promptVersion = 1) {
  const canonical = canonicalSection(section);
  canonical.pv = promptVersion;
  return sha256Hex(stableStringify(canonical));
}
