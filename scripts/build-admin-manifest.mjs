// Generează static/admin-manifest.json — inventarul lecțiilor pentru panoul
// de admin (/admin). Rulează automat înainte de build (npm prebuild), deci
// manifestul publicat e mereu sincron cu site-ul publicat.
//
// Nu atinge conținutul lecțiilor: citește doar frontmatter-ul.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.join(ROOT, 'docs');
const OUT = path.join(ROOT, 'static', 'admin-manifest.json');

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

const lessons = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'ro'))) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(abs);
      continue;
    }
    if (!/\.(md|mdx)$/i.test(entry.name)) continue;

    const rel = path.relative(ROOT, abs).split(path.sep).join('/');
    const raw = fs.readFileSync(abs, 'utf8');
    const fm = parseFrontmatter(raw);
    const id = rel.replace(/^docs\//, '').replace(/\.(md|mdx)$/i, '');
    const segments = id.split('/');

    lessons.push({
      id,
      path: rel,
      title: fm.title || segments[segments.length - 1],
      course: segments.length > 1 ? segments[0] : '',
      module: segments.length > 2 ? segments[1] : '',
      position: fm.sidebar_position ? Number(fm.sidebar_position) : null,
      slug: fm.slug || null,
      hidden: fm.hide === 'true' || fm.hide === 'True',
      frontmatterOk: Boolean(fm.title),
    });
  }
}

walk(DOCS);
lessons.sort((a, b) => a.id.localeCompare(b.id, 'ro'));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), lessons }, null, 1), 'utf8');
console.log(`admin-manifest: ${lessons.length} lecții → ${path.relative(ROOT, OUT)}`);
