#!/usr/bin/env node
// Structural fidelity check: source MDX vs built chapter HTML.
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = __dirname;
const DOCS = path.join(ROOT, 'docs', 'c5');
const BUILD = path.join(ROOT, 'build');
const MODULES = ['modul-1', 'modul-2', 'modul-3', 'modul-4', 'modul-5'];

function fm(file) {
  const t = fs.readFileSync(file, 'utf8');
  const m = t.match(/slug:\s*(\S+)/);
  return { slug: m ? m[1] : null, text: t };
}

// strip frontmatter + import lines + svg blocks for heading counting
function sourceCounts(txt) {
  const noFm = txt.replace(/^---\n[\s\S]*?\n---\n/, '');
  const lines = noFm.split('\n');
  let headings = 0, admon = 0, svg = 0, tables = 0;
  let inCode = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^```/.test(l)) { inCode = !inCode; continue; }
    if (inCode) continue;
    if (/^#{1,6}\s+\S/.test(l)) headings++;
    if (/^:::[a-z]+/.test(l.trim())) admon++;
    if (/<svg[\s>]/.test(l)) svg += (l.match(/<svg[\s>]/g) || []).length;
    // markdown table separator row like |---|---|
    if (/^\s*\|?\s*:?-{2,}/.test(l) && /\|/.test(l)) tables++;
  }
  // svg may span; count all <svg occurrences in whole text instead
  svg = (noFm.match(/<svg[\s>]/g) || []).length;
  return { headings, admon, svg, tables };
}

function builtCounts(slug) {
  const p = path.join(BUILD, 'docs', slug.replace(/^\//, '') + '.html');
  if (!fs.existsSync(p)) return null;
  const $ = cheerio.load(fs.readFileSync(p, 'utf8'));
  const md = $('.theme-doc-markdown.markdown');
  const html = md.html() || '';
  return {
    headings: md.find('h1,h2,h3,h4,h5,h6').length,
    admon: md.find('.theme-admonition').length,
    svg: (html.match(/<svg[\s>]/gi) || []).length,
    tables: md.find('table').length,
  };
}

let problems = 0;
console.log('lesson'.padEnd(22), 'H  s/b   A  s/b   SVG s/b   T  s/b');
for (const mod of MODULES) {
  const dir = path.join(DOCS, mod);
  for (const f of fs.readdirSync(dir).filter(x => /\.(md|mdx)$/.test(x)).sort()) {
    const file = path.join(dir, f);
    const { slug, text } = fm(file);
    if (!slug) continue;
    const s = sourceCounts(text);
    const b = builtCounts(slug);
    if (!b) { console.log(`${mod}/${f}  MISSING BUILT PAGE`); problems++; continue; }
    const flag = (a, c) => a === c ? ' ' : '!';
    const line = `${(mod + '/' + f).padEnd(22)} ${String(s.headings).padStart(2)}/${String(b.headings).padEnd(2)}${flag(s.headings, b.headings)} ${String(s.admon).padStart(2)}/${String(b.admon).padEnd(2)}${flag(s.admon, b.admon)} ${String(s.svg).padStart(3)}/${String(b.svg).padEnd(3)}${flag(s.svg, b.svg)} ${String(s.tables).padStart(2)}/${String(b.tables).padEnd(2)}${flag(s.tables, b.tables)}`;
    const bad = s.svg !== b.svg || s.admon !== b.admon;
    if (bad) problems++;
    console.log(line + (bad ? '   <== check' : ''));
  }
}
console.log('\nStructural problems flagged (svg/admonition mismatch):', problems);
console.log('Note: heading/table counts can legitimately differ (md tables vs nested, H1 title, etc.)');
