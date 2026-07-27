/**
 * Segmentele urmează ierarhia reală H1–H3:
 * - H1 include tot până la următorul H1;
 * - H2 include tot până la următorul H1/H2, inclusiv subsecțiunile H3;
 * - H3 include tot până la următorul H1/H2/H3.
 *
 * Payload-ul părintelui include și titlurile copiilor. Astfel, controlul de pe
 * un capitol poate explica acel capitol în întregime, iar controlul unui
 * subcapitol rămâne disponibil pentru o explicație mai punctuală.
 */
export const LESSON_SECTION_GROUPING_RULE = 'hierarchical-h1-h3';

const EXCLUDED_TAGS = new Set([
  'button',
  'input',
  'nav',
  'noscript',
  'script',
  'select',
  'style',
  'textarea',
]);

const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

function childrenOf(node) {
  return Array.from(node?.childNodes || node?.children || []);
}

function isTextNode(node) {
  return node?.nodeType === 3 || node?.type === 'text';
}

function isElement(node) {
  return node?.nodeType === 1
    || node?.type === 'tag'
    || node?.type === 'script'
    || node?.type === 'style';
}

function tagNameOf(node) {
  return String(node?.tagName || node?.name || '').toLocaleLowerCase('en');
}

function attributeOf(node, name) {
  if (typeof node?.getAttribute === 'function') return node.getAttribute(name);
  const attributes = node?.attribs || {};
  const direct = attributes[name];
  if (direct !== undefined) return direct;
  const key = Object.keys(attributes).find(
    (candidate) => candidate.toLocaleLowerCase('en') === name.toLocaleLowerCase('en'),
  );
  return key ? attributes[key] : null;
}

function attributesOf(node) {
  if (node?.attributes && typeof node.attributes[Symbol.iterator] === 'function') {
    return Array.from(node.attributes, ({name, value}) => [name, value]);
  }
  return Object.entries(node?.attribs || {});
}

function classNamesOf(node) {
  return String(attributeOf(node, 'class') || '')
    .split(/\s+/)
    .filter(Boolean);
}

function hasClass(node, className) {
  return classNamesOf(node).includes(className);
}

function isToc(node) {
  const role = String(attributeOf(node, 'role') || '').toLocaleLowerCase('en');
  if (role === 'navigation') return true;

  return classNamesOf(node).some((className) => {
    const normalized = className.toLocaleLowerCase('en');
    return normalized === 'toc'
      || normalized === 'table-of-contents'
      || normalized.startsWith('tableofcontents')
      || normalized.startsWith('theme-doc-toc')
      || normalized.startsWith('toccollapsible');
  });
}

function isExcluded(node) {
  if (!isElement(node)) return false;
  if (EXCLUDED_TAGS.has(tagNameOf(node))) return true;
  if (String(attributeOf(node, 'aria-hidden') || '').toLocaleLowerCase('en') === 'true') {
    return true;
  }
  if (attributeOf(node, 'data-edupasi-speak-button') !== null) return true;
  if (attributeOf(node, 'data-edupasi-math-explain-button') !== null) return true;
  if (attributeOf(node, 'data-edupasi-section-control') !== null) return true;
  if (attributeOf(node, 'data-edupasi-section-panel') !== null) return true;
  if (attributeOf(node, 'data-edupasi-visual-description') !== null) return true;
  if (hasClass(node, 'hash-link')) return true;
  return isToc(node);
}

function rawText(node) {
  if (!node) return '';
  if (typeof node.textContent === 'string') return node.textContent;
  if (isTextNode(node)) return String(node.data || node.nodeValue || '');
  return childrenOf(node).map(rawText).join('');
}

function cleanText(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;!?])/g, '$1')
    .trim();
}

function walkDescendants(node, visit) {
  for (const child of childrenOf(node)) {
    visit(child);
    walkDescendants(child, visit);
  }
}

function descendantElements(node, predicate) {
  const matches = [];
  walkDescendants(node, (candidate) => {
    if (isElement(candidate) && predicate(candidate)) matches.push(candidate);
  });
  return matches;
}

function hasStructuralHeading(node) {
  let found = false;
  walkDescendants(node, (candidate) => {
    if (found || !isElement(candidate)) return;
    const tag = tagNameOf(candidate);
    if (tag === 'h1' || tag === 'h2' || tag === 'h3') found = true;
  });
  return found;
}

function escapeMarkupText(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeMarkupAttribute(value) {
  return escapeMarkupText(value).replace(/"/g, '&quot;');
}

function serializeElement(node) {
  if (typeof node?.outerHTML === 'string') return node.outerHTML;
  if (isTextNode(node)) return escapeMarkupText(node.data || '');
  if (!isElement(node)) return childrenOf(node).map(serializeElement).join('');

  const tag = tagNameOf(node);
  const attributes = attributesOf(node)
    .map(([name, value]) => ` ${name}="${escapeMarkupAttribute(value)}"`)
    .join('');
  if (VOID_TAGS.has(tag)) return `<${tag}${attributes}>`;
  return `<${tag}${attributes}>${childrenOf(node).map(serializeElement).join('')}</${tag}>`;
}

function indexElementsById(root) {
  const byId = new Map();
  const remember = (node) => {
    if (!isElement(node)) return;
    const id = attributeOf(node, 'id');
    if (id && !byId.has(id)) byId.set(id, node);
  };
  remember(root);
  walkDescendants(root, remember);
  return byId;
}

function textFromIdRefs(value, byId) {
  return cleanText(
    String(value || '')
      .split(/\s+/)
      .filter(Boolean)
      .map((id) => rawText(byId.get(id)))
      .filter(Boolean)
      .join(' '),
  );
}

function latexFromMathElement(node) {
  const annotations = descendantElements(
    node,
    (candidate) => (
      tagNameOf(candidate) === 'annotation'
      && String(attributeOf(candidate, 'encoding') || '').toLocaleLowerCase('en')
        === 'application/x-tex'
    ),
  );

  return Array.from(
    new Set(annotations.map((annotation) => rawText(annotation).trim()).filter(Boolean)),
  );
}

function visualFromElement(node, byId) {
  const tag = tagNameOf(node);
  const labelledBy = textFromIdRefs(attributeOf(node, 'aria-labelledby'), byId);
  const describedBy = textFromIdRefs(attributeOf(node, 'aria-describedby'), byId);
  const title = cleanText(attributeOf(node, 'title'));

  if (tag === 'img') {
    const alt = cleanText(attributeOf(node, 'alt'));
    const ariaLabel = cleanText(attributeOf(node, 'aria-label'));
    return {
      type: 'image',
      src: String(node.currentSrc || attributeOf(node, 'src') || ''),
      alt,
      label: cleanText([ariaLabel, labelledBy, title].filter(Boolean).join('. ')),
      description: describedBy,
    };
  }

  const svgTitle = cleanText(
    descendantElements(node, (candidate) => tagNameOf(candidate) === 'title')
      .map(rawText)
      .join(' '),
  );
  const svgDescription = cleanText(
    descendantElements(node, (candidate) => tagNameOf(candidate) === 'desc')
      .map(rawText)
      .join(' '),
  );
  return {
    type: 'svg',
    label: cleanText(
      [
        attributeOf(node, 'aria-label'),
        labelledBy,
        title,
        svgTitle,
      ].filter(Boolean).join('. '),
    ),
    description: cleanText([describedBy, svgDescription].filter(Boolean).join('. ')),
    markup: serializeElement(node),
  };
}

function collectNodePayload(node, byId) {
  const textParts = [];
  const latex = [];
  const visuals = [];

  function visit(candidate, ancestors = []) {
    if (!candidate || isExcluded(candidate)) return;
    if (isTextNode(candidate)) {
      textParts.push(candidate.data || candidate.nodeValue || '');
      return;
    }
    if (!isElement(candidate)) {
      childrenOf(candidate).forEach((child) => visit(child, ancestors));
      return;
    }

    const tag = tagNameOf(candidate);
    const mathContainer = hasClass(candidate, 'katex') || tag === 'math';
    if (mathContainer) {
      const formulas = latexFromMathElement(candidate);
      if (formulas.length) {
        const display = hasClass(candidate, 'katex-display')
          || ancestors.some((ancestor) => hasClass(ancestor, 'katex-display'));
        formulas.forEach((source) => {
          latex.push({ source, display });
          textParts.push(display ? ` $$${source}$$ ` : ` \\(${source}\\) `);
        });
      } else {
        textParts.push(` ${rawText(candidate)} `);
      }
      return;
    }

    if (tag === 'img' || tag === 'svg') {
      const visual = visualFromElement(candidate, byId);
      visuals.push(visual);
      const spokenDescription = cleanText(
        [visual.alt, visual.label, visual.description].filter(Boolean).join('. '),
      );
      if (spokenDescription) {
        textParts.push(` Imagine: ${spokenDescription}. `);
      }
      return;
    }

    if (tag === 'annotation') return;
    childrenOf(candidate).forEach((child) => visit(child, [...ancestors, candidate]));
  }

  visit(node);
  return {
    text: cleanText(textParts.join(' ')),
    latex,
    visuals,
  };
}

function attachContext(items, context) {
  return items.map((item) => ({
    ...item,
    context: {...context},
  }));
}

/**
 * Grupează fără mutații conținutul unei lecții în segmente controlabile.
 *
 * Returnează și referințe DOM (`headingElement`, `contentNodes`) pentru ca
 * interfața să poată atașa butonul la heading, însă payload-ul serializabil
 * este format din `text`, `latex`, `visuals` și `context`.
 */
export function collectLessonSections(root) {
  if (!root) return [];

  const byId = indexElementsById(root);
  const units = [];

  function visitStructure(node) {
    if (!node || isExcluded(node)) return;
    if (isElement(node)) {
      const tag = tagNameOf(node);
      if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
        units.push({
          kind: 'heading',
          level: Number(tag.slice(1)),
          node,
        });
        return;
      }
      if (hasStructuralHeading(node)) {
        childrenOf(node).forEach(visitStructure);
        return;
      }
    }
    units.push({kind: 'content', node});
  }

  childrenOf(root).forEach(visitStructure);

  const activeContext = {h1: '', h2: '', h3: ''};
  units.forEach((unit) => {
    if (unit.kind === 'heading') {
      const headingPayload = collectNodePayload(unit.node, byId);
      unit.payload = headingPayload;
      unit.heading = headingPayload.text || cleanText(rawText(unit.node));

      if (unit.level === 1) {
        activeContext.h1 = unit.heading;
        activeContext.h2 = '';
        activeContext.h3 = '';
      } else if (unit.level === 2) {
        activeContext.h2 = unit.heading;
        activeContext.h3 = '';
      } else {
        activeContext.h3 = unit.heading;
      }
    } else {
      unit.payload = collectNodePayload(unit.node, byId);
    }
    unit.context = {...activeContext};
  });

  const headingIndexes = units
    .map((unit, index) => (unit.kind === 'heading' ? index : -1))
    .filter((index) => index >= 0);

  return headingIndexes.map((startIndex, sectionIndex) => {
    const headingUnit = units[startIndex];
    let endIndex = units.length;

    for (let index = startIndex + 1; index < units.length; index += 1) {
      const candidate = units[index];
      if (
        candidate.kind === 'heading'
        && candidate.level <= headingUnit.level
      ) {
        endIndex = index;
        break;
      }
    }

    const contentUnits = units.slice(startIndex + 1, endIndex);
    const contentNodes = [];
    const textParts = [];
    const latex = attachContext(
      headingUnit.payload.latex,
      headingUnit.context,
    );
    const visuals = attachContext(
      headingUnit.payload.visuals,
      headingUnit.context,
    );

    contentUnits.forEach((unit) => {
      const payload = unit.payload;
      if (!payload.text && payload.latex.length === 0 && payload.visuals.length === 0) {
        return;
      }
      contentNodes.push(unit.node);
      if (payload.text) textParts.push(payload.text);
      latex.push(...attachContext(payload.latex, unit.context));
      visuals.push(...attachContext(payload.visuals, unit.context));
    });

    const contentText = cleanText(textParts.join(' '));
    return {
      id: String(
        attributeOf(headingUnit.node, 'id')
        || `edupasi-section-${sectionIndex + 1}`,
      ),
      level: headingUnit.level,
      heading: headingUnit.heading,
      headingElement: headingUnit.node,
      contentNodes,
      contentText,
      text: cleanText(
        [headingUnit.heading, contentText].filter(Boolean).join('. '),
      ),
      latex,
      visuals,
      context: {...headingUnit.context},
    };
  });
}
