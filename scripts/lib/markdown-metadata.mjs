// Utilitare comune pentru metadatele minime folosite de manifestele EduMat.
// Nu încercăm să implementăm întregul YAML/Markdown aici: citim doar
// frontmatter-ul plat folosit deja de lecții și primul titlu Markdown H1.

export function parseFrontmatter(raw) {
  const match = String(raw).replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return {};

  const frontmatter = {};
  for (const line of match[1].split(/\r?\n/)) {
    const keyValue = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!keyValue) continue;

    let value = keyValue[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    frontmatter[keyValue[1]] = value;
  }
  return frontmatter;
}

function bodyWithoutFrontmatter(raw) {
  return String(raw)
    .replace(/^\uFEFF/, '')
    .replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '');
}

function plainHeadingText(value) {
  return value
    .replace(/\s+#+\s*$/, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[*_~]/g, '')
    .trim();
}

export function firstMarkdownH1(raw) {
  const lines = bodyWithoutFrontmatter(raw).split(/\r?\n/);
  let fence = null;

  for (const line of lines) {
    const fenceMatch = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      if (!fence) fence = marker;
      else if (fence === marker) fence = null;
      continue;
    }
    if (fence) continue;

    const heading = line.match(/^\s{0,3}#[\t ]+(.+?)\s*$/);
    if (heading) return plainHeadingText(heading[1]);
  }

  return '';
}

export function resolveLessonTitle(raw, frontmatter, filenameFallback) {
  return firstMarkdownH1(raw) || frontmatter.title || filenameFallback;
}

export function normalizeEduPasiSlug(frontmatterSlug, relativeId) {
  let route = String(frontmatterSlug || relativeId)
    .trim()
    .split(/[?#]/, 1)[0]
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '');

  route = route
    .replace(/^docs\/edupasi(?:\/|$)/i, '')
    .replace(/^edupasi(?:\/|$)/i, '')
    .replace(/^\/+|\/+$/g, '');

  if (
    !route
    || /^[a-z][a-z\d+.-]*:/i.test(route)
    || route.split('/').some((segment) => segment === '.' || segment === '..')
  ) {
    route = String(relativeId).replace(/^\/+|\/+$/g, '');
  }

  return `/edupasi/${route}`;
}
