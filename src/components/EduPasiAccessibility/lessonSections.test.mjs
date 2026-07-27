import assert from 'node:assert/strict';
import test from 'node:test';
import {load} from 'cheerio';
import {
  collectLessonSections,
  LESSON_SECTION_GROUPING_RULE,
} from './lessonSections.mjs';

function lessonRoot(markup) {
  const $ = load(markup, null, false);
  return $.root()[0];
}

test('H1, H2 și H3 includ ierarhic tot conținutul până la un nivel egal sau superior', () => {
  const root = lessonRoot(`
    <nav class="theme-doc-toc-desktop">Cuprins secret</nav>
    <h1 id="lectia-unu">Lecția întâi</h1>
    <p>Introducerea lecției.</p>
    <button>Nu trebuie citit</button>
    <div data-edupasi-section-control>Control injectat</div>
    <details data-edupasi-section-panel>
      <h2>Heading din explicația AI veche</h2>
      Explicație AI veche
    </details>
    <details data-edupasi-visual-description>Descriere vizuală duplicată</details>
    <h2 id="fractii">Fracții</h2>
    <aside class="tableOfContents_x9">Cuprins CSS Modules</aside>
    <p>Introducerea fracțiilor.</p>
    <h3 id="echivalente">Fracții echivalente</h3>
    <p>Conținutul subsecțiunii echivalente.</p>
    <h3 id="comparare">Compararea</h3>
    <p>Conținutul despre comparare.</p>
    <h2 id="exercitii">Exerciții</h2>
    <p>Rezolvă exercițiile propuse.</p>
    <h1 id="lectia-doi">Lecția a doua</h1>
    <p>Conținut separat pentru a doua lecție.</p>
  `);

  const sections = collectLessonSections(root);

  assert.equal(LESSON_SECTION_GROUPING_RULE, 'hierarchical-h1-h3');
  assert.deepEqual(
    sections.map(({id, level, heading}) => ({id, level, heading})),
    [
      {id: 'lectia-unu', level: 1, heading: 'Lecția întâi'},
      {id: 'fractii', level: 2, heading: 'Fracții'},
      {id: 'echivalente', level: 3, heading: 'Fracții echivalente'},
      {id: 'comparare', level: 3, heading: 'Compararea'},
      {id: 'exercitii', level: 2, heading: 'Exerciții'},
      {id: 'lectia-doi', level: 1, heading: 'Lecția a doua'},
    ],
  );

  const [
    firstLesson,
    fractions,
    equivalent,
    comparison,
    exercises,
    secondLesson,
  ] = sections;

  // H1 cuprinde inclusiv headingurile și conținutul tuturor copiilor săi.
  assert.match(firstLesson.text, /^Lecția întâi\./);
  assert.match(firstLesson.contentText, /Introducerea lecției/);
  assert.match(firstLesson.contentText, /Fracții echivalente/);
  assert.match(firstLesson.contentText, /Conținutul subsecțiunii echivalente/);
  assert.match(firstLesson.contentText, /Exerciții/);
  assert.match(firstLesson.contentText, /Rezolvă exercițiile propuse/);
  assert.doesNotMatch(firstLesson.text, /Lecția a doua|Conținut separat/);

  // H2 cuprinde H3-urile descendente, dar se oprește la următorul H2.
  assert.match(fractions.text, /^Fracții\./);
  assert.match(fractions.contentText, /Fracții echivalente/);
  assert.match(fractions.contentText, /Conținutul subsecțiunii echivalente/);
  assert.match(fractions.contentText, /Compararea/);
  assert.match(fractions.contentText, /Conținutul despre comparare/);
  assert.doesNotMatch(fractions.text, /Exerciții|Rezolvă exercițiile/);

  // Fiecare H3 se oprește la următorul heading H1/H2/H3.
  assert.match(equivalent.text, /Conținutul subsecțiunii echivalente/);
  assert.doesNotMatch(equivalent.text, /Compararea|Conținutul despre comparare/);
  assert.match(comparison.text, /Conținutul despre comparare/);
  assert.doesNotMatch(comparison.text, /Exerciții|Rezolvă exercițiile/);

  assert.match(exercises.text, /Rezolvă exercițiile propuse/);
  assert.doesNotMatch(exercises.text, /Lecția a doua|Conținut separat/);
  assert.match(secondLesson.text, /Conținut separat pentru a doua lecție/);
  assert.doesNotMatch(secondLesson.text, /Rezolvă exercițiile/);

  const allText = sections.map(({text}) => text).join(' ');
  assert.doesNotMatch(
    allText,
    /Cuprins secret|Cuprins CSS Modules|Nu trebuie citit|Control injectat|Heading din explicația AI veche|Explicație AI veche|Descriere vizuală duplicată/,
  );

  // Repetarea între părinte și copil este intenționată: fiecare control trebuie
  // să poată explica independent întregul său segment ierarhic.
  assert.equal(
    (allText.match(/Conținutul subsecțiunii echivalente/g) || []).length,
    3,
  );
});

test('păstrează LaTeX-ul original în fiecare payload ierarhic și ignoră randarea KaTeX duplicată', () => {
  const root = lessonRoot(`
    <h1 id="lectie">Lecție de calcul</h1>
    <h2 id="calcul">Calcul</h2>
    <p>
      Formula este
      <span class="katex">
        <span class="katex-mathml">
          <math>
            <semantics>
              <mfrac><mn>1</mn><mn>2</mn></mfrac>
              <annotation encoding="application/x-tex">\\frac{1}{2}</annotation>
            </semantics>
          </math>
        </span>
        <span class="katex-html" aria-hidden="true">randare duplicată 1 peste 2</span>
      </span>.
    </p>
    <div class="katex-display">
      <span class="katex">
        <math>
          <semantics>
            <mi>x</mi><mo>=</mo><mn>2</mn>
            <annotation encoding="application/x-tex">x = 2</annotation>
          </semantics>
        </math>
      </span>
    </div>
  `);

  const sections = collectLessonSections(root);
  const lesson = sections.find(({id}) => id === 'lectie');
  const calculation = sections.find(({id}) => id === 'calcul');
  const expected = [
    {source: '\\frac{1}{2}', display: false},
    {source: 'x = 2', display: true},
  ];

  assert.deepEqual(
    lesson.latex.map(({source, display}) => ({source, display})),
    expected,
  );
  assert.deepEqual(
    calculation.latex.map(({source, display}) => ({source, display})),
    expected,
  );
  assert.match(lesson.text, /Calcul/);
  assert.match(calculation.text, /\\frac\{1\}\{2\}/);
  assert.match(calculation.text, /x = 2/);
  assert.doesNotMatch(lesson.text, /randare duplicată/);
  assert.doesNotMatch(calculation.text, /randare duplicată/);
});

test('colectează imagini și SVG-uri cu contextul locului lor în ierarhie', () => {
  const root = lessonRoot(`
    <p id="descriere-diagrama">Două axe perpendiculare.</p>
    <h1 id="lectia-geometrie">Lecția de geometrie</h1>
    <h2 id="geometrie">Geometrie</h2>
    <h3 id="reprezentare">Reprezentare</h3>
    <figure>
      <img src="/img/triunghi.png" alt="Triunghi dreptunghic" aria-describedby="descriere-diagrama">
      <button data-edupasi-speak-button>Ascultă</button>
    </figure>
    <svg role="img" aria-label="Plan cartezian" viewBox="0 0 20 20">
      <title>Grafic</title>
      <desc>Axa orizontală și axa verticală.</desc>
      <path d="M0 10h20"></path>
    </svg>
  `);

  const sections = collectLessonSections(root);
  const lesson = sections.find(({id}) => id === 'lectia-geometrie');
  const representation = sections.find(({id}) => id === 'reprezentare');
  const locationContext = {
    h1: 'Lecția de geometrie',
    h2: 'Geometrie',
    h3: 'Reprezentare',
  };

  assert.deepEqual(representation.context, locationContext);
  assert.equal(representation.visuals.length, 2);
  assert.deepEqual(
    representation.visuals.map(({type, context}) => ({type, context})),
    [
      {type: 'image', context: locationContext},
      {type: 'svg', context: locationContext},
    ],
  );
  assert.deepEqual(
    lesson.visuals.map(({context}) => context),
    [locationContext, locationContext],
  );
  assert.equal(representation.visuals[0].alt, 'Triunghi dreptunghic');
  assert.equal(representation.visuals[0].description, 'Două axe perpendiculare.');
  assert.match(representation.visuals[1].label, /Plan cartezian/);
  assert.match(representation.visuals[1].description, /Axa orizontală/);
  assert.match(representation.visuals[1].markup, /^<svg[\s\S]*<path/);
  assert.doesNotMatch(representation.text, /Ascultă/);
});

test('funcționează cu headinguri în containere structurale și include copiii în contentNodes', () => {
  const root = lessonRoot(`
    <article>
      <section>
        <h1 id="capitol">Capitol</h1>
        Text introductiv direct.
        <div><p>Primul paragraf.</p></div>
        <section>
          <h2 id="numere">Numere</h2>
          <p>Al doilea paragraf.</p>
          <section>
            <h3 id="naturale">Naturale</h3>
            <p>Al treilea paragraf.</p>
          </section>
        </section>
      </section>
    </article>
  `);

  const sections = collectLessonSections(root);
  const chapter = sections.find(({id}) => id === 'capitol');
  const numbers = sections.find(({id}) => id === 'numere');
  const naturals = sections.find(({id}) => id === 'naturale');

  assert.equal(sections.length, 3);
  assert.match(chapter.contentText, /Text introductiv direct/);
  assert.match(chapter.contentText, /Primul paragraf/);
  assert.match(chapter.contentText, /Numere/);
  assert.match(chapter.contentText, /Al doilea paragraf/);
  assert.match(chapter.contentText, /Naturale/);
  assert.match(chapter.contentText, /Al treilea paragraf/);

  assert.match(numbers.contentText, /Al doilea paragraf/);
  assert.match(numbers.contentText, /Naturale/);
  assert.match(numbers.contentText, /Al treilea paragraf/);
  assert.doesNotMatch(numbers.contentText, /Primul paragraf/);

  assert.match(naturals.contentText, /Al treilea paragraf/);
  assert.doesNotMatch(naturals.contentText, /Al doilea paragraf/);
  assert.ok(
    chapter.contentNodes.some((node) => String(node.name || '').toLowerCase() === 'h2'),
  );
  assert.ok(
    numbers.contentNodes.some((node) => String(node.name || '').toLowerCase() === 'h3'),
  );
});

test('generează ID-uri stabile și nu transformă headingurile injectate în secțiuni', () => {
  const root = lessonRoot(`
    <h1>Titlu fără ID</h1>
    <p>Introducere.</p>
    <div data-edupasi-section-control>
      <h2>Control fals</h2>
    </div>
    <details data-edupasi-section-panel>
      <h3>Panou fals</h3>
    </details>
    <h2>Subtitlu fără ID</h2>
    <p>Final.</p>
  `);

  const sections = collectLessonSections(root);

  assert.deepEqual(
    sections.map(({id, heading}) => ({id, heading})),
    [
      {id: 'edupasi-section-1', heading: 'Titlu fără ID'},
      {id: 'edupasi-section-2', heading: 'Subtitlu fără ID'},
    ],
  );
  assert.doesNotMatch(
    sections.map(({text}) => text).join(' '),
    /Control fals|Panou fals/,
  );
});
