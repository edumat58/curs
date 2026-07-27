// Generează static/lessons-index.json — lista lecțiilor (titlu + URL relativ +
// cuvinte-cheie) pentru tutorele Doamna Căpșunică. Îl citește backend-ul
// Kulturosfera (/api/tutore) ca să dea LINKURI EXACTE către lecții, fără căutare
// web plătită. Rulează la prebuild, deci e mereu sincron cu site-ul publicat.
// Nu atinge conținutul: citește frontmatter + primul titlu H1.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  normalizeEduPasiSlug,
  parseFrontmatter,
  resolveLessonTitle,
} from './lib/markdown-metadata.mjs';

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

const COLLECTION_LABEL = {
  standard: '',
  edupasi: 'EduPASI lectie adaptata accesibila',
};

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
    if (entry.name.startsWith('_')) continue;
    if (!/\.(md|mdx)$/i.test(entry.name)) continue;

    const rel = path.relative(DOCS, abs).split(path.sep).join('/');
    const id = rel.replace(/\.(md|mdx)$/i, '');
    const segments = id.split('/');
    const collection = segments[0] === 'edupasi' ? 'edupasi' : 'standard';
    const course = collection === 'edupasi' ? segments[1] : segments[0];
    const moduleSeg = collection === 'edupasi'
      ? (segments.length > 3 ? segments[2] : '')
      : (segments.length > 2 ? segments[1] : '');

    // doar lecțiile cursurilor live (fără arhivă, intro, status)
    if (!['c5', 'c6', 'c7', 'c8'].includes(course)) continue;

    const raw = fs.readFileSync(abs, 'utf8');
    const fm = parseFrontmatter(raw);
    if (fm.hide === 'true' || fm.hide === 'True') continue;
    if (collection === 'edupasi' && fm.edupasi_type === 'guide') continue;

    const slug = collection === 'edupasi'
      ? normalizeEduPasiSlug(fm.slug, segments.slice(1).join('/'))
      : fm.slug || '/' + id;
    const title = resolveLessonTitle(raw, fm, segments[segments.length - 1]);

    lessons.push({
      title,
      url: BASE + slug, // ex. /curs/docs/c5/modul-1/01
      collection,
      course,
      module: moduleSeg,
      keywords: [
        CLASS_LABEL[course] || '',
        moduleSeg.replace('-', ' '),
        COLLECTION_LABEL[collection],
      ].filter(Boolean),
      text: extractText(raw), // conținutul lecției pentru RAG
    });
  }
}

walk(DOCS);
lessons.sort((a, b) => a.url.localeCompare(b.url, 'ro'));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ schemaVersion: 1, lessons }, null, 1), 'utf8');
console.log(`lessons-index: ${lessons.length} lecții → ${path.relative(ROOT, OUT)}`);
