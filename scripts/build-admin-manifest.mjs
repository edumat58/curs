// Generează static/admin-manifest.json — inventarul lecțiilor pentru panoul
// de admin (/admin). Rulează automat înainte de build (npm prebuild), deci
// manifestul publicat e mereu sincron cu site-ul publicat.
//
// Nu atinge conținutul lecțiilor: citește doar frontmatter-ul.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  firstMarkdownH1,
  normalizeEduPasiSlug,
  parseFrontmatter,
  resolveLessonTitle,
} from './lib/markdown-metadata.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.join(ROOT, 'docs');
const OUT = path.join(ROOT, 'static', 'admin-manifest.json');

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

    const rel = path.relative(ROOT, abs).split(path.sep).join('/');
    const raw = fs.readFileSync(abs, 'utf8');
    const fm = parseFrontmatter(raw);
    const id = rel.replace(/^docs\//, '').replace(/\.(md|mdx)$/i, '');
    const segments = id.split('/');
    const isEduPasi = segments[0] === 'edupasi';
    const course = isEduPasi
      ? (segments.length > 2 ? segments[1] : '')
      : (segments.length > 1 ? segments[0] : '');
    const module = isEduPasi
      ? (segments.length > 3 ? segments[2] : '')
      : (segments.length > 2 ? segments[1] : '');
    const slug = isEduPasi
      ? normalizeEduPasiSlug(fm.slug, segments.slice(1).join('/'))
      : fm.slug || `/${id}`;

    lessons.push({
      id,
      path: rel,
      title: resolveLessonTitle(raw, fm, segments[segments.length - 1]),
      description: fm.description || '',
      collection: isEduPasi ? 'edupasi' : 'standard',
      course,
      module,
      kind: fm.edupasi_type || 'lesson',
      position: fm.sidebar_position ? Number(fm.sidebar_position) : null,
      slug,
      url: `/docs${slug}`,
      hidden: fm.hide === 'true' || fm.hide === 'True',
      frontmatterOk: Boolean(fm.title || firstMarkdownH1(raw)),
    });
  }
}

walk(DOCS);
lessons.sort((a, b) => a.id.localeCompare(b.id, 'ro'));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ schemaVersion: 1, lessons }, null, 1), 'utf8');
console.log(`admin-manifest: ${lessons.length} lecții → ${path.relative(ROOT, OUT)}`);
