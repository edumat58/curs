import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import {
  firstMarkdownH1,
  normalizeEduPasiSlug,
  parseFrontmatter,
  resolveLessonTitle,
} from './markdown-metadata.mjs';

const require = createRequire(import.meta.url);
const metadataLoader = require('../loaders/edupasi-metadata-loader.cjs');

test('titlul H1 are prioritate față de title din frontmatter', () => {
  const raw = `---
title: "Titlu vechi"
---

# **Fracții** echivalente
`;
  const frontmatter = parseFrontmatter(raw);

  assert.equal(resolveLessonTitle(raw, frontmatter, 'fisier'), 'Fracții echivalente');
});

test('title din frontmatter este fallback când lecția nu are H1', () => {
  const raw = `---
title: "Ecuații"
---

## Introducere
`;
  const frontmatter = parseFrontmatter(raw);

  assert.equal(resolveLessonTitle(raw, frontmatter, 'fisier'), 'Ecuații');
});

test('numele fișierului este ultimul fallback', () => {
  assert.equal(resolveLessonTitle('Conținut fără titlu', {}, 'lectia-01'), 'lectia-01');
});

test('un fals H1 dintr-un bloc de cod nu este folosit', () => {
  const raw = `\`\`\`md
# Nu este titlu
\`\`\`

# Titlul lecției
`;

  assert.equal(firstMarkdownH1(raw), 'Titlul lecției');
});

test('slug-urile EduPASI vechi și relative rămân sub prefixul colecției', () => {
  const canonical = '/edupasi/c5/modul-1/01';
  assert.equal(normalizeEduPasiSlug('/c5/modul-1/01', 'c5/modul-1/01'), canonical);
  assert.equal(normalizeEduPasiSlug('/edupasi/c5/modul-1/01', 'c5/modul-1/01'), canonical);
  assert.equal(normalizeEduPasiSlug('/docs/edupasi/c5/modul-1/01', 'c5/modul-1/01'), canonical);
  assert.equal(normalizeEduPasiSlug(undefined, 'c5/modul-1/01'), canonical);
});

test('loaderul Webpack emite numai metadate și folosește H1-ul', async () => {
  const generatedModule = await new Promise((resolve, reject) => {
    metadataLoader.call(
      {
        async: () => (error, code) => (error ? reject(error) : resolve(code)),
        cacheable: () => {},
        resourcePath: '/tmp/lectia-01.mdx',
      },
      `---
title: "Titlu frontmatter"
description: "Exemplu"
---

# Titlul din lecție

Conținut care nu trebuie copiat în modul.
`,
    );
  });
  const context = {module: {exports: {}}};
  vm.runInNewContext(generatedModule, context);

  assert.deepEqual(
    JSON.parse(JSON.stringify(context.module.exports)),
    {
      frontMatter: {
        title: 'Titlu frontmatter',
        description: 'Exemplu',
      },
      title: 'Titlul din lecție',
    },
  );
  assert.doesNotMatch(generatedModule, /Conținut care nu trebuie copiat/);
});

test('preambulul se închide și când linia are spații la coadă', () => {
  // Șapte lecții din curs sunt scrise cu „--- " la închiderea preambulului.
  // Fără toleranță la spațiu, potrivirea sărea la următorul „---" din pagină —
  // linia orizontală de sub titlu — și înghițea chiar titlul H1. Lecția intra
  // apoi în index numită după fișier („11") și dispărea din panoul de admin.
  const brut = [
    '---',
    'sidebar_position: 6',
    'slug: /c7/modul-1/11',
    '--- ',
    '# C8.2 – Media geometrică',
    '',
    '---',
    '',
    '## Introducere',
  ].join('\n');

  assert.equal(firstMarkdownH1(brut), 'C8.2 – Media geometrică');
  assert.deepEqual(parseFrontmatter(brut), {
    'sidebar_position': '6', slug: '/c7/modul-1/11',
  });
  assert.equal(resolveLessonTitle(brut, parseFrontmatter(brut), '11'), 'C8.2 – Media geometrică');
});
