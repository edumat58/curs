#!/usr/bin/env node
/*
 * build-c5-book.js
 * Assembles a single self-contained, printable "book" from the already-built
 * Docusaurus pages of course C5 (Matematică — Clasa a V-a).
 *
 * It reuses Docusaurus's own rendering (build/ output), so all KaTeX math,
 * inline SVG figures (including JSX-driven ones), <HighlightText> colors and
 * admonitions are preserved EXACTLY as authored — content is never modified.
 */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = __dirname;
const DOCS_SRC = path.join(ROOT, 'docs', 'c5');
const BUILD = path.join(ROOT, 'build');
const OUT = path.join(ROOT, 'c5-book');

// ---- module labels (from _category_.json) ----------------------------------
function moduleLabel(dir) {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(DOCS_SRC, dir, '_category_.json'), 'utf8'));
    return j.label || dir;
  } catch { return dir; }
}

// ---- frontmatter parsing ----------------------------------------------------
function frontmatter(file) {
  const txt = fs.readFileSync(file, 'utf8');
  const m = txt.match(/^---\n([\s\S]*?)\n---/);
  const fm = {};
  if (m) {
    for (const line of m[1].split('\n')) {
      const mm = line.match(/^([A-Za-z_]+):\s*(.*)$/);
      if (mm) fm[mm[1]] = mm[2].replace(/^["']|["']$/g, '').trim();
    }
  }
  // first H1 as fallback title
  const h1 = txt.match(/^#\s+(.+)$/m);
  fm._h1 = h1 ? h1[1].trim() : '';
  return fm;
}

// ---- collect lessons --------------------------------------------------------
const MODULES = ['modul-1', 'modul-2', 'modul-3', 'modul-4', 'modul-5'];
const lessons = []; // {module, label, file, slug, pos, anchor, builtPath, title}

for (const mod of MODULES) {
  const dir = path.join(DOCS_SRC, mod);
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir)
    .filter(f => /\.(md|mdx)$/.test(f))
    .map(f => path.join(dir, f));
  const items = [];
  for (const file of files) {
    const fm = frontmatter(file);
    if (!fm.slug) continue; // skip files without a route
    const pos = fm.sidebar_position !== undefined ? parseFloat(fm.sidebar_position) : 0;
    const builtPath = path.join(BUILD, 'docs', fm.slug.replace(/^\//, '') + '.html');
    items.push({
      module: mod,
      moduleLabel: moduleLabel(mod),
      file,
      base: path.basename(file),
      slug: fm.slug,
      pos: isNaN(pos) ? 0 : pos,
      builtPath,
      title: fm._h1,
    });
  }
  // course sequence = descending sidebar_position, then filename ascending
  items.sort((a, b) => (b.pos - a.pos) || a.base.localeCompare(b.base));
  for (const it of items) lessons.push(it);
}

// assign unique anchors
const seen = new Set();
for (const l of lessons) {
  let a = ('ch-' + l.slug.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-')).toLowerCase();
  let base = a, n = 1;
  while (seen.has(a)) a = base + '-' + (++n);
  seen.add(a);
  l.anchor = a;
}

// slug -> anchor map for internal link rewriting
const slugToAnchor = new Map();
for (const l of lessons) slugToAnchor.set(l.slug.replace(/\/$/, ''), l.anchor);

// ---- extract content of one built page -------------------------------------
function extractChapter(l) {
  if (!fs.existsSync(l.builtPath)) {
    return { html: `<p style="color:red">[Lipsește pagina construită: ${l.slug}]</p>`, title: l.title, ok: false };
  }
  const $ = cheerio.load(fs.readFileSync(l.builtPath, 'utf8'));
  const md = $('.theme-doc-markdown.markdown').first();
  if (!md.length) return { html: '', title: l.title, ok: false };

  // remove heading anchor links and edit/feedback widgets
  md.find('a.hash-link').remove();
  md.find('.theme-edit-this-page, .pagination-nav, .theme-doc-footer').remove();

  // title from rendered H1
  let title = md.find('h1').first().text().trim() || l.title || l.slug;

  // rewrite internal C5 links to in-book anchors
  md.find('a[href]').each((i, el) => {
    let href = $(el).attr('href') || '';
    // strip baseUrl/docs prefix and hash/query
    let m = href.match(/\/docs(\/c5\/[^#?]*)/);
    if (m) {
      const key = m[1].replace(/\/$/, '');
      if (slugToAnchor.has(key)) {
        $(el).attr('href', '#' + slugToAnchor.get(key));
        return;
      }
    }
    // leave external / unknown links pointing to the live site
    if (href.startsWith('/curs/')) {
      $(el).attr('href', 'https://dapi.digital' + href); // absolute fallback
    }
  });

  // fix logo / local images to bundled copy
  md.find('img[src]').each((i, el) => {
    const src = $(el).attr('src') || '';
    const m = src.match(/\/img\/(.+)$/);
    if (m) $(el).attr('src', 'img/' + m[1]);
  });

  // demote heading levels so H1 becomes the chapter title only; keep structure
  return { html: md.html() || '', title, ok: true };
}

// ---- bundle CSS + fonts + images -------------------------------------------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(OUT, 'fonts'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'img'), { recursive: true });

// copy KaTeX fonts referenced by the built CSS
const fontsDir = path.join(BUILD, 'assets', 'fonts');
if (fs.existsSync(fontsDir)) {
  for (const f of fs.readdirSync(fontsDir)) {
    if (/^KaTeX_/.test(f)) fs.copyFileSync(path.join(fontsDir, f), path.join(OUT, 'fonts', f));
  }
}
// copy logo
const logo = path.join(BUILD, 'img', 'logo.png');
if (fs.existsSync(logo)) fs.copyFileSync(logo, path.join(OUT, 'img', 'logo.png'));

// site CSS -> rewrite font urls to local ./fonts/
const cssFile = fs.readdirSync(path.join(BUILD, 'assets', 'css')).find(f => /^styles\..*\.css$/.test(f));
let css = fs.readFileSync(path.join(BUILD, 'assets', 'css', cssFile), 'utf8');
css = css.replace(/\/curs\/assets\/fonts\//g, 'fonts/');
// neutralize any other /curs/ asset refs we don't ship (keep data: and http)
css = css.replace(/url\(\/curs\/assets\/[^)]*\)/g, 'url()');
fs.writeFileSync(path.join(OUT, 'site.css'), css);

// ---- build chapters + TOC ---------------------------------------------------
function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 1) extract every chapter (and capture its rendered title)
const stats = [];
let body = '';
let curModule = '';
for (const l of lessons) {
  const ch = extractChapter(l);
  l._title = ch.title;
  stats.push({ slug: l.slug, title: ch.title, ok: ch.ok, file: l.base, module: l.moduleLabel });

  if (l.moduleLabel !== curModule) {
    curModule = l.moduleLabel;
    body += `<section class="module-divider" id="mod-${l.module}"><div class="module-kicker">Modulul</div><h1>${escapeHtml(curModule)}</h1></section>\n`;
  }
  body += `<section class="chapter" id="${l.anchor}">\n${ch.html}\n</section>\n`;
}

// 2) build the grouped table of contents
let toc = '';
let cur = null;
for (const l of lessons) {
  if (l.moduleLabel !== cur) {
    if (cur !== null) toc += '</ul></li>';
    cur = l.moduleLabel;
    toc += `<li class="toc-module"><a href="#mod-${l.module}">${escapeHtml(cur)}</a><ul>`;
  }
  toc += `<li class="toc-lesson"><a href="#${l.anchor}">${escapeHtml(l._title)}</a></li>`;
}
if (cur !== null) toc += '</ul></li>';

// ---- page shell -------------------------------------------------------------
const bookCss = `
:root{ --ink:#1c1e21; --accent:#7b2ff7; --accent2:#2563eb; }
*{ box-sizing:border-box; }
html,body{ margin:0; padding:0; }
body{ font-family: system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; color:var(--ink); line-height:1.6; background:#f5f5f7; }
.book{ max-width:900px; margin:0 auto; background:#fff; padding:0 56px; box-shadow:0 0 30px rgba(0,0,0,.08); }
.markdown{ overflow-wrap:anywhere; }
.chapter{ padding:18px 0 8px; }
.chapter svg{ max-width:100%; height:auto; display:block; margin:14px auto; }
.chapter table{ display:table; width:auto; max-width:100%; border-collapse:collapse; margin:14px 0; }
.chapter img{ max-width:100%; height:auto; }
/* Cover */
.cover{ min-height:92vh; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:60px 20px;
  background:linear-gradient(160deg,#7b2ff7 0%,#2563eb 100%); color:#fff; margin:0 -56px; }
.cover img{ width:96px; height:96px; margin-bottom:24px; filter:drop-shadow(0 6px 18px rgba(0,0,0,.3)); }
.cover .subject{ font-size:64px; font-weight:800; letter-spacing:.5px; margin:0; line-height:1.05; }
.cover .grade{ font-size:30px; font-weight:600; margin:14px 0 0; opacity:.95; }
.cover .meta{ margin-top:36px; font-size:18px; opacity:.9; }
.cover .rule{ width:90px; height:5px; background:rgba(255,255,255,.85); border-radius:3px; margin:28px auto; }
/* TOC */
.toc{ padding:40px 0; }
.toc h2{ font-size:30px; border-bottom:3px solid var(--accent); padding-bottom:10px; }
.toc ul{ list-style:none; padding-left:0; }
.toc > ul > li.toc-module{ margin:18px 0 6px; }
.toc .toc-module > a{ font-weight:800; font-size:19px; color:var(--accent2); text-decoration:none; }
.toc ul ul{ padding-left:18px; border-left:2px solid #eee; margin:6px 0 14px; }
.toc .toc-lesson a{ color:var(--ink); text-decoration:none; font-size:15px; }
.toc .toc-lesson a:hover{ color:var(--accent); }
.toc li.toc-lesson{ margin:3px 0; }
/* Module divider */
.module-divider{ margin:0 -56px; padding:80px 56px; background:linear-gradient(135deg,#eef2ff,#faf5ff); border-top:1px solid #e5e7eb; border-bottom:1px solid #e5e7eb; text-align:center; }
.module-divider .module-kicker{ text-transform:uppercase; letter-spacing:3px; color:var(--accent2); font-weight:700; font-size:14px; }
.module-divider h1{ font-size:48px; margin:8px 0 0; color:var(--accent); }
/* Print */
@media print{
  body{ background:#fff; }
  .book{ box-shadow:none; max-width:none; padding:0 12mm; }
  .cover, .module-divider{ break-after:page; page-break-after:always; }
  .chapter{ break-before:page; page-break-before:always; }
  .toc{ break-after:page; page-break-after:always; }
  a{ color:inherit; text-decoration:none; }
  .chapter svg, .chapter table, .katex-display{ break-inside:avoid; page-break-inside:avoid; }
  h1,h2,h3,h4{ break-after:avoid; }
}
`;

const html = `<!doctype html>
<html lang="ro">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Matematică — Clasa a V-a · 2025–2026</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css">
<link rel="stylesheet" href="site.css">
<style>${bookCss}</style>
</head>
<body>
<div class="book">
  <section class="cover">
    <img src="img/logo.png" alt="logo">
    <p class="subject">Matematică</p>
    <p class="grade">Clasa a V-a</p>
    <div class="rule"></div>
    <p class="meta">Culegere de lecții · Anul școlar 2025–2026</p>
  </section>

  <nav class="toc">
    <h2>Cuprins</h2>
    <ul>${toc}</ul>
  </nav>

  ${body}
</div>
</body>
</html>`;

fs.writeFileSync(path.join(OUT, 'index.html'), html);

// ---- report -----------------------------------------------------------------
console.log(`Lessons included: ${lessons.length}`);
const missing = stats.filter(s => !s.ok);
console.log(`Rendered OK: ${stats.filter(s => s.ok).length}, problems: ${missing.length}`);
for (const m of missing) console.log('  PROBLEM:', m.module, m.file, m.slug, '->', m.title);
console.log('\nOrder:');
let cm = '';
for (const s of stats) {
  if (s.module !== cm) { cm = s.module; console.log('==', cm, '=='); }
  console.log('   ', s.title);
}
console.log('\nOutput:', path.join(OUT, 'index.html'));
