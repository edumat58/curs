import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cleanSpeechText,
  latexToRomanian,
  mathElementToRomanian,
} from '../../src/components/EduPasiAccessibility/speech.mjs';

function mathNode(localName, textContent, children = []) {
  return {
    nodeType: 1,
    localName,
    textContent,
    children,
  };
}

function katexLikeElement(latex, math) {
  const annotation = mathNode('annotation', latex);
  return {
    matches: () => false,
    textContent: latex,
    querySelector(selector) {
      if (selector.includes('annotation')) return annotation;
      if (selector.includes('math')) return math;
      return null;
    },
  };
}

test('citește zecimalele cu virgulă în română', () => {
  assert.equal(cleanSpeechText('37,85'), '37 virgulă 85');
  assert.equal(latexToRomanian('4{,}72'), '4 virgulă 72');
});

test('citește fracții imbricate fără să piardă conținut', () => {
  assert.equal(
    latexToRomanian(String.raw`\frac{1+\frac{x}{2}}{\sqrt{y}}`),
    'fracția cu numărătorul 1 plus fracția cu numărătorul x și numitorul 2 și numitorul radical din y',
  );
});

test('citește puteri, indici și radicali de ordin n', () => {
  assert.equal(latexToRomanian('x^2+y_{1}'), 'x la pătrat plus y indice 1');
  assert.equal(latexToRomanian(String.raw`\sqrt[3]{8}`), 'radical de ordin 3 din 8');
});

test('citește vectori, segmente, relații și mulțimi', () => {
  assert.equal(
    latexToRomanian(String.raw`\vec{AB}\perp\overline{CD}`),
    'vectorul AB este perpendicular pe segmentul CD',
  );
  assert.equal(
    latexToRomanian(String.raw`x\in A\cup B`),
    'x apartine lui A reuniunea B',
  );
});

test('citește operatori cu limite și sisteme pe rânduri', () => {
  assert.equal(
    latexToRomanian(String.raw`\sum_{i=1}^{n}i`),
    'suma indice i este egal cu 1 la puterea n i',
  );
  const system = latexToRomanian(String.raw`\begin{cases}x+y=4\\x-y=2\end{cases}`);
  assert.match(system, /^sistem de relații:/);
  assert.match(system, /rândul următor:/);
});

test('păstrează textul și ignoră comenzile exclusiv vizuale', () => {
  assert.equal(
    latexToRomanian(String.raw`\Large\text{Exemplu: }\color{#FF0000}{37{,}5}`),
    'Exemplu: 37 virgulă 5',
  );
});

test('păstrează diacriticele românești literale în text și alfabete LaTeX', () => {
  assert.equal(
    latexToRomanian(String.raw`\text{Împărțirea și scăderea dau cât și diferență.}`),
    'Împărțirea și scăderea dau cât și diferență.',
  );
  assert.equal(
    latexToRomanian(String.raw`\mathrm{Număr întreg: Ă, Â, Î, Ș, Ț}`),
    'Număr întreg împărțit la Ă, Â, Î, Ș, Ț',
  );
  assert.equal(
    latexToRomanian(String.raw`\textbf{Numărul împărțit este câtul.}`),
    'Numărul împărțit este câtul.',
  );
});

test('diferențiază diacriticele de comenzile matematice reale', () => {
  const spoken = latexToRomanian(
    String.raw`\text{În triunghi, }\hat{A}=90\degree,\ \angle ABC=45\degree,\ \text{iar }\int_0^1x\,dx`,
  );

  assert.match(spoken, /^În triunghi,/);
  assert.match(spoken, /unghiul A este egal cu 90 grade/);
  assert.match(spoken, /unghiul ABC este egal cu 45 grade/);
  assert.match(spoken, /iar integrala indice 0 la puterea 1 x dx$/);
  assert.doesNotMatch(spoken, /deasupra|circumflex|breve/);
});

test('folosește adnotarea TeX când KaTeX descompune î și ă ca accente MathML', () => {
  // KaTeX reprezintă `î` prin i fără punct + circumflex și `ă` prin
  // a + breve. Arborele de prezentare singur le-ar confunda cu accente
  // matematice, însă adnotarea păstrează literele românești originale.
  const decomposedI = mathNode('mover', 'ıˆ', [
    mathNode('mtext', 'ı'),
    mathNode('mo', 'ˆ'),
  ]);
  const decomposedA = mathNode('mover', 'a˘', [
    mathNode('mtext', 'a'),
    mathNode('mo', '˘'),
  ]);
  const presentationMath = mathNode('math', 'Împărțire și scădere', [
    mathNode('mrow', 'Împărțire și scădere', [
      decomposedI,
      mathNode('mtext', 'mpărțire și sc'),
      decomposedA,
      mathNode('mtext', 'dere'),
    ]),
  ]);
  const formula = katexLikeElement(
    String.raw`\text{Împărțire și scădere}`,
    presentationMath,
  );

  assert.equal(mathElementToRomanian(formula), 'Împărțire și scădere');
  assert.doesNotMatch(mathElementToRomanian(formula), /unghi|deasupra/);
});

test('o comandă hat reală nu este convertită într-o literă Â', () => {
  const presentationMath = mathNode('math', 'A^', [
    mathNode('mover', 'A^', [
      mathNode('mi', 'A'),
      mathNode('mo', '^'),
    ]),
  ]);
  const formula = katexLikeElement(String.raw`\hat{A}`, presentationMath);
  const spoken = mathElementToRomanian(formula);

  assert.match(spoken, /^Unghiul A/);
  assert.doesNotMatch(spoken, /Â/);
});

test('nu verbalizează numele comenzilor pentru alfabetele matematice', () => {
  assert.equal(
    latexToRomanian(String.raw`x\in\mathbb{R},\ \text{adică }x\text{ este număr real}`),
    'x apartine lui R, adică x este număr real',
  );
});
