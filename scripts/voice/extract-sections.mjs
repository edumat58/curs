/**
 * Extrage secțiunile lecțiilor din HTML-ul CONSTRUIT (build/), folosind exact
 * același parser pe care îl rulează și browserul (`lessonSections.mjs`).
 *
 * De ce din build și nu din MDX: după build, KaTeX e randat (deci avem sursa
 * TeX în <annotation>), componentele React au produs SVG-uri reale, iar
 * ID-urile de heading sunt cele finale. Astfel secțiunile extrase aici sunt
 * bit-cu-bit aceleași cu cele pe care le vede elevul → hash identic.
 *
 * Utilizare:
 *   node scripts/voice/extract-sections.mjs [--scope=edupasi|all] [--json=out.json]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as loadHtml } from 'cheerio';
import { collectLessonSections } from '../../src/components/EduPasiAccessibility/lessonSections.mjs';
import { sectionHash, canonicalSection } from '../../src/lib/voice/canonical.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BUILD = path.join(ROOT, 'build');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v = true] = a.replace(/^--/, '').split('=');
    return [k, v];
  })
);
const SCOPE = String(args.scope || 'edupasi');
const PROMPT_VERSION = Number(args.promptVersion || 1);

/**
 * Toate paginile HTML de lecție din build.
 * Cu `trailingSlash: false`, Docusaurus emite `pagina.html`, nu `pagina/index.html`.
 */
function findLessonHtml(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) findLessonHtml(abs, acc);
    else if (entry.name.endsWith('.html') && !entry.name.startsWith('404')) acc.push(abs);
  }
  return acc;
}

function routeOf(htmlPath) {
  const rel = path.relative(BUILD, htmlPath).split(path.sep).join('/');
  return `/${rel.replace(/(?:\/index)?\.html$/, '')}`;
}

function inScope(route) {
  if (SCOPE === 'all') return /^\/docs\//.test(route);
  return /^\/docs\/edupasi(\/|$)/.test(route);
}

/** Zona de conținut a lecției — exclude navigația, TOC-ul, footerul. */
function lessonRoot($) {
  for (const selector of ['.theme-doc-markdown', 'article', 'main']) {
    const node = $(selector).get(0);
    if (node) return node;
  }
  return null;
}

async function main() {
  if (!fs.existsSync(BUILD)) {
    console.error('Nu există build/. Rulează întâi: npm run build');
    process.exit(1);
  }

  const pages = findLessonHtml(BUILD).filter((p) => inScope(routeOf(p)));
  const out = [];

  for (const pageFile of pages) {
    const route = routeOf(pageFile);
    const html = fs.readFileSync(pageFile, 'utf8');
    const $ = loadHtml(html);
    const root = lessonRoot($);
    if (!root) continue;

    const lessonTitle = $('h1').first().text().trim();
    const sections = collectLessonSections(root);

    /**
     * Iconițele admonițiilor Docusaurus (tip/atenție/pericol) sunt SVG-uri
     * decorative fără conținut didactic. Dacă le lăsăm, umplu contextul
     * modelului cu path-uri irelevante și îl fac să creadă că lecția are figuri.
     */
    const isDecorativeIcon = (visual) => {
      if (visual.type !== 'svg') return false;
      if (visual.label || visual.description) return false;
      const markup = String(visual.markup || '');
      if (/<text\b/i.test(markup)) return false;
      const viewBox = /viewBox="([^"]+)"/i.exec(markup);
      if (!viewBox) return true;
      const [, , w, h] = viewBox[1].trim().split(/[\s,]+/).map(Number);
      return Number.isFinite(w) && Number.isFinite(h) && w <= 32 && h <= 32;
    };

    for (const section of sections) {
      section.visuals = section.visuals.filter((v) => !isDecorativeIcon(v));
      // Secțiunile pur decorative (fără text, formule sau figuri) nu merită voce.
      const hasSubstance =
        (section.contentText && section.contentText.length > 40)
        || section.latex.length > 0
        || section.visuals.length > 0;
      if (!hasSubstance) continue;

      const hash = await sectionHash(section, PROMPT_VERSION);
      out.push({
        route,
        lessonTitle,
        sectionId: section.id,
        heading: section.heading,
        level: section.level,
        hash,
        payload: canonicalSection(section),
        raw: {
          contentText: section.contentText,
          latex: section.latex.map((l) => ({ source: l.source, display: l.display })),
          visuals: section.visuals.map((v) =>
            v.type === 'image'
              ? { type: 'image', src: v.src, alt: v.alt, label: v.label }
              : { type: 'svg', label: v.label, description: v.description, markup: v.markup }
          ),
          context: section.context,
        },
      });
    }
  }

  const summary = {
    scope: SCOPE,
    promptVersion: PROMPT_VERSION,
    pages: pages.length,
    sections: out.length,
    withMath: out.filter((s) => s.raw.latex.length > 0).length,
    withVisuals: out.filter((s) => s.raw.visuals.length > 0).length,
  };

  if (args.json) {
    fs.writeFileSync(path.resolve(ROOT, String(args.json)), JSON.stringify(out, null, 1));
  }
  console.log(JSON.stringify(summary, null, 2));
  if (!args.json) {
    console.log('\nPrimele secțiuni:');
    out.slice(0, 8).forEach((s) =>
      console.log(
        ` [${s.hash.slice(0, 8)}] H${s.level} ${s.heading} — ${s.raw.contentText.length} car., ${s.raw.latex.length} formule, ${s.raw.visuals.length} figuri  (${s.route})`
      )
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
