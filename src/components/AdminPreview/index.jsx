/**
 * Previzualizarea lecției în panoul de admin — instant, fără build.
 *
 * Site-ul e static: orice modificare cere commit, reconstrucție și propagare prin
 * CDN — trei-șase minute până vezi ce ai scris. Pentru cel care corectează o
 * lecție, asta e diferența dintre a lucra și a aștepta. Aici randăm textul din
 * editor pe loc, ca să se vadă imediat structura, formulele și, mai ales, CODUL
 * canonic care se schimbă când bifezi „Finală" sau „Vizibilă permanent".
 *
 * NU e randarea Docusaurus, și nici nu pretinde să fie: MDX-ul se compilează la
 * build, cu pluginuri și componente proprii. E o citire fidelă a aceluiași text
 * pentru lucrurile care contează la corectură — titluri, casete, liste, tabele,
 * matematică, cod. Componentele proprii (`<Katex>`, desene) apar ca blocuri
 * marcate, ca să știi că sunt acolo și unde.
 */
import React, { useMemo } from 'react';
import katex from 'katex';
import { codLectie } from '@site/src/lib/voice/cod.mjs';
import styles from './styles.module.css';

/** Frontmatter simplu (chei „nume: valoare"), cât ne trebuie pentru flaguri. */
export function parseFrontmatter(raw) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(String(raw || ''));
  const out = {};
  if (!m) return out;
  m[1].split(/\r?\n/).forEach((linie) => {
    const p = /^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/.exec(linie);
    if (p) out[p[1]] = p[2].replace(/^["']|["']$/g, '').trim();
  });
  return out;
}

/** Corpul, fără frontmatter și fără importurile MDX (zgomot la citire). */
function corpul(raw) {
  return String(raw || '')
    .replace(/^---[\s\S]*?\r?\n---\r?\n?/, '')
    .replace(/^\s*import\s.+$/gm, '')
    .replace(/^\s*export\s.+$/gm, '');
}

/** Clasa lecției, din calea fișierului: „docs/c6/modul-1/01.md" → „c6". */
function cursulDinCale(cale) {
  const m = /docs\/(?:edupasi\/)?(c[5-8])\b/.exec(String(cale || ''));
  return m ? m[1] : null;
}

function esteEduPasi(cale) {
  return /docs\/edupasi\//.test(String(cale || ''));
}

/** O formulă KaTeX, randată în siguranță (o greșeală de sintaxă nu rupe pagina). */
function formula(tex, bloc) {
  try {
    return katex.renderToString(String(tex), {
      displayMode: Boolean(bloc),
      throwOnError: false,
      strict: false,
    });
  } catch {
    return `<code>${String(tex)}</code>`;
  }
}

/**
 * Marcajele dintr-un rând: **gras**, *cursiv*, `cod`, [link](adresă), $formulă$
 * și `<Katex>{String.raw`…`}</Katex>`.
 *
 * Se lucrează pe HTML scăpat, deci textul lecției nu poate injecta marcaj.
 */
function inline(text) {
  let s = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // <Katex>{String.raw`…`}</Katex> — formulă de sine stătătoare din lecții.
  s = s.replace(
    /&lt;Katex&gt;\{String\.raw`([\s\S]*?)`\}&lt;\/Katex&gt;/g,
    (_all, tex) => formula(tex, true)
  );
  // Orice altă componentă proprie: o arătăm ca reper, nu o executăm.
  s = s.replace(
    /&lt;([A-Z][A-Za-z0-9]*)\b[^]*?(?:\/&gt;|&lt;\/\1&gt;)/g,
    (_all, nume) => `<span class="${styles.componenta}">&lt;${nume}&gt;</span>`
  );

  s = s.replace(/\$\$([\s\S]+?)\$\$/g, (_all, tex) => formula(tex, true));
  s = s.replace(/\$([^$\n]+?)\$/g, (_all, tex) => formula(tex, false));
  s = s.replace(/`([^`]+?)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+?)\*/g, '$1<em>$2</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  return s;
}

const ADMONITII = {
  tip: 'Sfat', note: 'Notă', info: 'Info', caution: 'Atenție', danger: 'Pericol', warning: 'Atenție',
};

/** Textul lecției → HTML de citit. Pe blocuri, ca în Markdown. */
function randeaza(mdx) {
  const linii = corpul(mdx).split(/\r?\n/);
  const out = [];
  let i = 0;

  const paragraf = (buf) => {
    if (buf.length) out.push(`<p>${inline(buf.join(' '))}</p>`);
    buf.length = 0;
  };

  const buf = [];
  while (i < linii.length) {
    const l = linii[i];

    // Casetă (:::tip Titlu … :::)
    const adm = /^:::(\w+)\s*(.*)$/.exec(l);
    if (adm) {
      paragraf(buf);
      const tip = adm[1].toLowerCase();
      const titlu = adm[2].trim() || ADMONITII[tip] || tip;
      const corp = [];
      i += 1;
      while (i < linii.length && !/^:::\s*$/.test(linii[i])) { corp.push(linii[i]); i += 1; }
      i += 1;
      out.push(
        `<div class="${styles.caseta}" data-tip="${tip}">`
        + `<div class="${styles.casetaTitlu}">${inline(titlu)}</div>`
        + randeaza(`---\n---\n${corp.join('\n')}`)
        + '</div>'
      );
      continue;
    }

    // Formulă pe bloc ($$ … $$)
    if (/^\$\$\s*$/.test(l)) {
      paragraf(buf);
      const corp = [];
      i += 1;
      while (i < linii.length && !/^\$\$\s*$/.test(linii[i])) { corp.push(linii[i]); i += 1; }
      i += 1;
      out.push(formula(corp.join('\n'), true));
      continue;
    }

    // Titluri
    const h = /^(#{1,6})\s+(.*)$/.exec(l);
    if (h) {
      paragraf(buf);
      const n = h[1].length;
      out.push(`<h${n} class="${styles.titlu}">${inline(h[2])}</h${n}>`);
      i += 1;
      continue;
    }

    // Linie despărțitoare
    if (/^\s*---\s*$/.test(l)) { paragraf(buf); out.push('<hr />'); i += 1; continue; }

    // Tabel (| a | b |)
    if (/^\s*\|.*\|\s*$/.test(l) && /^\s*\|[\s:-]+\|\s*$/.test(linii[i + 1] || '')) {
      paragraf(buf);
      const celule = (rand) => rand.trim().replace(/^\||\|$/g, '').split('|').map((c) => inline(c.trim()));
      const cap = celule(l);
      i += 2;
      const randuri = [];
      while (i < linii.length && /^\s*\|.*\|\s*$/.test(linii[i])) { randuri.push(celule(linii[i])); i += 1; }
      out.push(
        `<table class="${styles.tabel}"><thead><tr>${cap.map((c) => `<th>${c}</th>`).join('')}</tr></thead>`
        + `<tbody>${randuri.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`
      );
      continue;
    }

    // Liste (- / * / 1.)
    if (/^\s*([-*]|\d+\.)\s+/.test(l)) {
      paragraf(buf);
      const ordonata = /^\s*\d+\./.test(l);
      const elemente = [];
      while (i < linii.length && /^\s*([-*]|\d+\.)\s+/.test(linii[i])) {
        elemente.push(inline(linii[i].replace(/^\s*([-*]|\d+\.)\s+/, '')));
        i += 1;
      }
      const t = ordonata ? 'ol' : 'ul';
      out.push(`<${t} class="${styles.lista}">${elemente.map((e) => `<li>${e}</li>`).join('')}</${t}>`);
      continue;
    }

    // Rând gol = sfârșit de paragraf
    if (!l.trim()) { paragraf(buf); i += 1; continue; }

    buf.push(l);
    i += 1;
  }
  paragraf(buf);
  return out.join('\n');
}

/**
 * Panoul de previzualizare: codul canonic (calculat pe loc) + lecția randată.
 */
export default function AdminPreview({ raw, path }) {
  const fm = useMemo(() => parseFrontmatter(raw), [raw]);
  const html = useMemo(() => randeaza(raw), [raw]);

  const titlu = (/(^|\n)#\s+(.+)/.exec(corpul(raw)) || [])[2] || '';
  const course = cursulDinCale(path);
  const cod = course
    ? codLectie({
      course,
      title: titlu,
      edupasi: esteEduPasi(path),
      final: fm.final === 'true',
      vizibilPermanent: fm.vizibil_permanent === 'true',
    })
    : null;

  return (
    <div className={styles.previzualizare}>
      <div className={styles.antet}>
        {cod ? <span className={styles.cod}>{cod}</span> : null}
        {fm.hide === 'true' ? <span className={styles.eticheta}>ascunsă</span> : null}
        {fm.final === 'true' ? <span className={styles.eticheta}>finală</span> : null}
        {fm.vizibil_permanent === 'true' ? <span className={styles.eticheta}>vizibilă permanent</span> : null}
        <span className={styles.nota}>calculat pe loc, fără publicare</span>
      </div>
      {/* Textul vine din editorul propriu al administratorului; marcajul e
          construit aici, din text deja scăpat. */}
      <div className={styles.corp} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
