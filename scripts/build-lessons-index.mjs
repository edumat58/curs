// Generează static/lessons-index.json — lista lecțiilor (titlu + URL relativ +
// cuvinte-cheie) pentru tutorele Doamna Căpșunică. Îl citește backend-ul
// Kulturosfera (/api/tutore) ca să dea LINKURI EXACTE către lecții, fără căutare
// web plătită. Rulează la prebuild, deci e mereu sincron cu site-ul publicat.
// Nu atinge conținutul: citește frontmatter + primul titlu H1.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.join(ROOT, 'docs');
const OUT = path.join(ROOT, 'static', 'lessons-index.json');
const BASE = '/curs/docs'; // baseUrl (/curs/) + routeBasePath (docs)

// eticheta clasei pentru potrivire cu întrebări gen „clasa a VI-a"
const CLASS_LABEL = {
  c5: 'clasa 5 a cincea V',
  c6: 'clasa 6 a sasea VI',
  c7: 'clasa 7 a saptea VII',
  c8: 'clasa 8 a opta VIII',
};

function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    let value = kv[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    fm[kv[1]] = value;
  }
  return fm;
}

// primul titlu H1 din corpul lecției (după frontmatter și eventuale importuri)
function firstH1(raw) {
  const body = raw.replace(/^---[\s\S]*?---/, '');
  const m = body.match(/^\s*#\s+(.+?)\s*$/m);
  return m ? m[1].trim() : '';
}

// Extrage textul CURAT al lecției pentru RAG (ce citește tutorele): păstrează
// proza, definițiile, exemplele și formulele LaTeX; scoate frontmatter, importuri,
// diagramele SVG, marcajele de admoniție și tag-urile JSX/HTML.
const MAX_TEXT = 4000;
function extractText(raw) {
  let b = raw.replace(/^---[\s\S]*?---/, ''); // frontmatter
  b = b.replace(/^\s*import\s.+$/gm, ''); // linii import
  b = b.replace(/<svg[\s\S]*?<\/svg>/gi, ' [figură] '); // diagrame SVG
  // blocuri KaTeX → păstrează LaTeX-ul ca $$...$$
  b = b.replace(/<Katex>\s*\{\s*(?:String\.raw)?\s*`([\s\S]*?)`\s*\}\s*<\/Katex>/g, (_, t) => ` $$${t.trim()}$$ `);
  b = b.replace(/<Katex>([\s\S]*?)<\/Katex>/g, (_, t) =>
    ` $$${t.replace(/^\s*\{\s*(?:String\.raw)?\s*`/, '').replace(/`\s*\}\s*$/, '').trim()}$$ `
  );
  b = b.replace(/:::\s*\w+[^\n]*/g, '').replace(/:::/g, ''); // marcaje admoniție
  b = b.replace(/<\/?[a-zA-Z][^>]*>/g, ' '); // tag-uri JSX/HTML rămase (păstrează textul din interior)
  b = b.replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  return b.slice(0, MAX_TEXT);
}

const lessons = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'ro'))) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(abs);
      continue;
    }
    if (!/\.(md|mdx)$/i.test(entry.name)) continue;

    const rel = path.relative(DOCS, abs).split(path.sep).join('/');
    const id = rel.replace(/\.(md|mdx)$/i, '');
    const segments = id.split('/');
    const course = segments[0];

    // doar lecțiile cursurilor live (fără arhivă, intro, status)
    if (!['c5', 'c6', 'c7', 'c8'].includes(course)) continue;

    const raw = fs.readFileSync(abs, 'utf8');
    const fm = parseFrontmatter(raw);
    if (fm.hide === 'true' || fm.hide === 'True') continue;

    const slug = fm.slug || '/' + id; // slug frontmatter poate diferi de calea fișierului
    const title = fm.title || firstH1(raw) || segments[segments.length - 1];
    const moduleSeg = segments.length > 2 ? segments[1] : '';

    lessons.push({
      title,
      url: BASE + slug, // ex. /curs/docs/c5/modul-1/01
      course,
      module: moduleSeg,
      keywords: [CLASS_LABEL[course] || '', moduleSeg.replace('-', ' ')].filter(Boolean),
      text: extractText(raw), // conținutul lecției pentru RAG
    });
  }
}

walk(DOCS);
lessons.sort((a, b) => a.url.localeCompare(b.url, 'ro'));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), lessons }, null, 1), 'utf8');
console.log(`lessons-index: ${lessons.length} lecții → ${path.relative(ROOT, OUT)}`);
