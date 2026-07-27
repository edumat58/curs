const MATH_OPERATORS_RO = {
  '+': 'plus',
  '−': 'minus',
  '-': 'minus',
  '=': 'este egal cu',
  '≠': 'este diferit de',
  '≈': 'este aproximativ egal cu',
  '≡': 'este echivalent cu',
  '·': 'înmulțit cu',
  '×': 'înmulțit cu',
  '*': 'înmulțit cu',
  ':': 'împărțit la',
  '÷': 'împărțit la',
  '/': 'împărțit la',
  '<': 'este mai mic decât',
  '>': 'este mai mare decât',
  '≤': 'este mai mic sau egal cu',
  '≥': 'este mai mare sau egal cu',
  '±': 'plus sau minus',
  '∓': 'minus sau plus',
  '∈': 'apartine lui',
  '∉': 'nu apartine lui',
  '⊂': 'este inclus strict în',
  '⊆': 'este inclus în',
  '⊄': 'nu este inclus în',
  '∪': 'reuniunea',
  '∩': 'intersecția',
  '∅': 'multimea vidă',
  '∞': 'infinit',
  '→': 'tinde spre',
  '⇒': 'rezultatul este',
  '⇔': 'este echivalent cu',
  '∥': 'este paralel cu',
  '⊥': 'este perpendicular pe',
  '∠': 'unghiul',
  '°': 'grade',
  '%': 'procente',
  '|': 'modulul',
  '∣': 'modulul',
  '(': 'paranteza deschisa',
  ')': 'paranteza inchisa',
  '[': 'paranteza patrata deschisa',
  ']': 'paranteza patrata inchisa',
  '{': 'acolada deschisa',
  '}': 'acolada inchisa',
};

const MATH_IDENTIFIERS_RO = {
  α: 'alfa',
  β: 'beta',
  γ: 'gama',
  δ: 'delta',
  Δ: 'delta mare',
  ε: 'epsilon',
  θ: 'teta',
  λ: 'lambda',
  μ: 'miu',
  π: 'pi',
  ρ: 'ro',
  σ: 'sigma',
  Σ: 'sigma mare',
  φ: 'fi',
  ω: 'omega',
  sin: 'sinusul',
  cos: 'cosinusul',
  tan: 'tangenta',
  tg: 'tangenta',
  cot: 'cotangenta',
  ctg: 'cotangenta',
  log: 'logaritmul',
  ln: 'logaritmul natural',
  lim: 'limita',
};

const TEX_COMMAND_RO = {
  cdot: 'înmulțit cu',
  times: 'înmulțit cu',
  div: 'împărțit la',
  pm: 'plus sau minus',
  mp: 'minus sau plus',
  le: 'este mai mic sau egal cu',
  leq: 'este mai mic sau egal cu',
  ge: 'este mai mare sau egal cu',
  geq: 'este mai mare sau egal cu',
  ne: 'este diferit de',
  neq: 'este diferit de',
  approx: 'este aproximativ egal cu',
  equiv: 'este echivalent cu',
  in: 'apartine lui',
  notin: 'nu apartine lui',
  subset: 'este inclus strict în',
  subseteq: 'este inclus în',
  cup: 'reuniunea',
  cap: 'intersecția',
  emptyset: 'multimea vida',
  infty: 'infinit',
  to: 'tinde spre',
  rightarrow: 'tinde spre',
  Rightarrow: 'rezultatul este',
  implies: 'rezultatul este',
  Leftrightarrow: 'este echivalent cu',
  iff: 'este echivalent cu',
  parallel: 'este paralel cu',
  perp: 'este perpendicular pe',
  angle: 'unghiul',
  degree: 'grade',
  sum: 'suma',
  prod: 'produsul',
  int: 'integrala',
  iint: 'integrala dublă',
  lim: 'limita',
  sin: 'sinusul',
  cos: 'cosinusul',
  tan: 'tangenta',
  tg: 'tangenta',
  cot: 'cotangenta',
  ctg: 'cotangenta',
  log: 'logaritmul',
  ln: 'logaritmul natural',
  alpha: 'alfa',
  beta: 'beta',
  gamma: 'gama',
  delta: 'delta',
  Delta: 'delta mare',
  epsilon: 'epsilon',
  theta: 'teta',
  lambda: 'lambda',
  mu: 'miu',
  pi: 'pi',
  rho: 'ro',
  sigma: 'sigma',
  Sigma: 'sigma mare',
  phi: 'fi',
  omega: 'omega',
};

const SILENT_TEX_COMMANDS = new Set([
  'left',
  'right',
  'displaystyle',
  'textstyle',
  'scriptstyle',
  'scriptscriptstyle',
  'limits',
  'nolimits',
  'Large',
  'large',
  'small',
  'tiny',
  'quad',
  'qquad',
  'enspace',
  'hspace',
  'vspace',
  'phantom',
  'strut',
]);

const TEX_TEXT_COMMANDS = new Set([
  'text',
  'textrm',
  'textnormal',
  'textup',
  'textmd',
  'textbf',
  'textit',
  'emph',
  'mbox',
]);

const TEX_MATH_ALPHABET_COMMANDS = new Set([
  'mathrm',
  'mathbf',
  'mathit',
  'mathsf',
  'mathtt',
  'mathnormal',
  'mathbb',
  'mathcal',
  'mathfrak',
  'operatorname',
]);

const ROMANIAN_DIACRITICS = /[ăâîșțĂÂÎȘȚşţŞŢ]/u;

export function cleanSpeechText(value) {
  return String(value || '')
    .normalize('NFC')
    .replace(/\u00a0/g, ' ')
    .replace(/(\d)\s*[.,]\s*(\d)/g, '$1 virgulă $2')
    .replace(/\s+([,.;!?])/g, '$1')
    .replace(/([,.;!?])(?=\S)/g, '$1 ')
    .replace(/\s+/g, ' ')
    .trim();
}

function balancedGroup(source, start, open = '{', close = '}') {
  if (source[start] !== open) return null;
  let depth = 0;
  for (let index = start; index < source.length; index += 1) {
    if (source[index] === open) depth += 1;
    if (source[index] === close) depth -= 1;
    if (depth === 0) {
      return {
        value: source.slice(start + 1, index),
        end: index + 1,
      };
    }
  }
  return null;
}

function nextArgument(source, start) {
  let index = start;
  while (/\s/.test(source[index] || '')) index += 1;
  if (source[index] === '{') return balancedGroup(source, index);
  if (source[index] === '[') return balancedGroup(source, index, '[', ']');
  if (source[index]) return { value: source[index], end: index + 1 };
  return null;
}

function spokenExponent(value) {
  const spoken = latexToRomanian(value);
  if (cleanSpeechText(value) === '2') return 'la pătrat';
  if (cleanSpeechText(value) === '3') return 'la cub';
  return `la puterea ${spoken}`;
}

function readTexCommand(source, slashIndex) {
  if (source[slashIndex + 1] === '\\') {
    return { spoken: '; rândul următor:', end: slashIndex + 2 };
  }
  if (/[,:;! ]/.test(source[slashIndex + 1] || '')) {
    return { spoken: ' ', end: slashIndex + 2 };
  }

  const match = source.slice(slashIndex + 1).match(/^([A-Za-z]+)/);
  if (!match) {
    return {
      spoken: source[slashIndex + 1] || '',
      end: Math.min(source.length, slashIndex + 2),
    };
  }

  const command = match[1];
  let end = slashIndex + 1 + command.length;

  if (command === 'begin' || command === 'end') {
    const environment = nextArgument(source, end);
    if (!environment) return { spoken: '', end };
    end = environment.end;
    const env = environment.value.replace(/\*/g, '');
    if (command === 'end') return { spoken: '', end };
    if (env === 'cases') return { spoken: 'sistem de relații:', end };
    if (/matrix/.test(env)) return { spoken: 'matrice, rândul 1:', end };
    if (env === 'array') {
      const columns = nextArgument(source, end);
      if (columns) end = columns.end;
      return { spoken: 'tabel de calcul, rândul 1:', end };
    }
    if (env === 'aligned' || env === 'align') return { spoken: '', end };
    return { spoken: '', end };
  }

  if (command === 'frac' || command === 'dfrac' || command === 'tfrac') {
    const numerator = nextArgument(source, end);
    const denominator = numerator ? nextArgument(source, numerator.end) : null;
    if (!numerator || !denominator) return { spoken: 'fracție', end };
    return {
      spoken: `fracția cu numărătorul ${latexToRomanian(numerator.value)} și numitorul ${latexToRomanian(denominator.value)}`,
      end: denominator.end,
    };
  }

  if (command === 'sqrt') {
    let order = null;
    let radicandStart = end;
    while (/\s/.test(source[radicandStart] || '')) radicandStart += 1;
    if (source[radicandStart] === '[') {
      order = balancedGroup(source, radicandStart, '[', ']');
      radicandStart = order?.end ?? radicandStart;
    }
    const radicand = nextArgument(source, radicandStart);
    if (!radicand) return { spoken: 'radical', end };
    return {
      spoken: order
        ? `radical de ordin ${latexToRomanian(order.value)} din ${latexToRomanian(radicand.value)}`
        : `radical din ${latexToRomanian(radicand.value)}`,
      end: radicand.end,
    };
  }

  if (command === 'binom') {
    const top = nextArgument(source, end);
    const bottom = top ? nextArgument(source, top.end) : null;
    if (!top || !bottom) return { spoken: 'combinări', end };
    return {
      spoken: `combinări de ${latexToRomanian(top.value)} luate câte ${latexToRomanian(bottom.value)}`,
      end: bottom.end,
    };
  }

  if (command === 'color' || command === 'textcolor') {
    const color = nextArgument(source, end);
    const content = color ? nextArgument(source, color.end) : null;
    return {
      spoken: content ? latexToRomanian(content.value) : '',
      end: content?.end || color?.end || end,
    };
  }

  if (TEX_TEXT_COMMANDS.has(command)) {
    const content = nextArgument(source, end);
    return {
      spoken: content
        ? cleanSpeechText(content.value.replace(/\\([{}%_$#&])/g, '$1'))
        : '',
      end: content?.end || end,
    };
  }

  if (TEX_MATH_ALPHABET_COMMANDS.has(command)) {
    const content = nextArgument(source, end);
    return {
      spoken: content ? latexToRomanian(content.value) : '',
      end: content?.end || end,
    };
  }

  if (['vec', 'overrightarrow'].includes(command)) {
    const content = nextArgument(source, end);
    return {
      spoken: content ? `vectorul ${latexToRomanian(content.value)}` : 'vector',
      end: content?.end || end,
    };
  }

  if (['overline', 'bar'].includes(command)) {
    const content = nextArgument(source, end);
    return {
      spoken: content ? `segmentul ${latexToRomanian(content.value)}` : 'segment',
      end: content?.end || end,
    };
  }

  if (command === 'hat' || command === 'widehat') {
    const content = nextArgument(source, end);
    return {
      spoken: content ? `unghiul ${latexToRomanian(content.value)}` : 'unghi',
      end: content?.end || end,
    };
  }

  if (command === 'hline') return { spoken: '; linie de separare;', end };
  if (SILENT_TEX_COMMANDS.has(command)) {
    if (command === 'hspace' || command === 'vspace' || command === 'phantom') {
      const ignored = nextArgument(source, end);
      end = ignored?.end || end;
    }
    return { spoken: ' ', end };
  }

  return {
    spoken: TEX_COMMAND_RO[command] || command,
    end,
  };
}

export function latexToRomanian(value) {
  const source = String(value || '')
    .normalize('NFC')
    .replace(/\r/g, '')
    .replace(/\$\$/g, '')
    .replace(/\$/g, '');
  const output = [];

  for (let index = 0; index < source.length;) {
    const character = source[index];

    if (character === '\\') {
      const command = readTexCommand(source, index);
      output.push(` ${command.spoken} `);
      index = command.end;
      continue;
    }

    if (character === '^' || character === '_') {
      const argument = nextArgument(source, index + 1);
      if (!argument) {
        index += 1;
        continue;
      }
      output.push(
        character === '^'
          ? ` ${spokenExponent(argument.value)} `
          : ` indice ${latexToRomanian(argument.value)} `,
      );
      index = argument.end;
      continue;
    }

    if (character === '{') {
      const group = balancedGroup(source, index);
      if (group) {
        output.push(` ${latexToRomanian(group.value)} `);
        index = group.end;
        continue;
      }
    }

    if (character === '&') {
      index += 1;
      continue;
    }

    const operator = MATH_OPERATORS_RO[character];
    if (operator) {
      output.push(` ${operator} `);
      index += 1;
      continue;
    }

    output.push(MATH_IDENTIFIERS_RO[character] || character);
    index += 1;
  }

  return cleanSpeechText(output.join(''))
    .replace(/\bbara verticală ([^,;]+?) bara verticală\b/g, 'modul din $1')
    .replace(/\s*;\s*rândul următor:\s*;\s*/g, '; rândul următor: ')
    .replace(/(?:\s*;\s*){2,}/g, '; ');
}

function mathChildren(node) {
  return Array.from(node?.children || []);
}

function isSimpleMathOperand(node) {
  return ['mi', 'mn', 'msup', 'msub', 'msubsup', 'mfrac', 'msqrt', 'mroot']
    .includes(node?.localName?.toLowerCase());
}

function needsImplicitMultiplication(left, right) {
  if (!left || !right) return false;
  const leftTag = left.localName?.toLowerCase();
  const rightTag = right.localName?.toLowerCase();
  if (!isSimpleMathOperand(left) || !isSimpleMathOperand(right)) return false;
  if (leftTag === 'mi' && rightTag === 'mo') return false;
  return leftTag === 'mn' || (leftTag === 'mi' && rightTag === 'mi');
}

export function mathNodeToRomanian(node) {
  if (!node) return '';
  if (node.nodeType === 3) return cleanSpeechText(node.nodeValue);
  if (node.nodeType !== 1) return '';

  const tag = node.localName?.toLowerCase();
  const children = mathChildren(node);
  const readChildren = () => {
    const spoken = [];
    children.forEach((child, index) => {
      if (index > 0 && needsImplicitMultiplication(children[index - 1], child)) {
        spoken.push('înmulțit cu');
      }
      spoken.push(mathNodeToRomanian(child));
    });
    return cleanSpeechText(spoken.filter(Boolean).join(' '));
  };

  if (tag === 'annotation') return '';
  if (tag === 'semantics') {
    return mathNodeToRomanian(children.find((child) => child.localName !== 'annotation'));
  }
  if (tag === 'mn') return cleanSpeechText(node.textContent);
  if (tag === 'mi') {
    const identifier = cleanSpeechText(node.textContent);
    return MATH_IDENTIFIERS_RO[identifier] || identifier;
  }
  if (tag === 'mo') {
    const operator = cleanSpeechText(node.textContent);
    return MATH_OPERATORS_RO[operator] || operator;
  }
  if (tag === 'mtext') return cleanSpeechText(node.textContent);
  if (tag === 'mfrac') {
    return cleanSpeechText(
      `Avem o fracție cu numărătorul ${mathNodeToRomanian(children[0])} și numitorul ${mathNodeToRomanian(children[1])}`,
    );
  }
  if (tag === 'msqrt') return cleanSpeechText(`Radical din ${readChildren()}, adică numărul care, ridicatLa pătrat, înapoi la numărul de sub radical`);
  if (tag === 'mroot') {
    return cleanSpeechText(
      `Radical de ordin ${mathNodeToRomanian(children[1])} din ${mathNodeToRomanian(children[0])}, adică numărul care, ridicatLa puterea ${mathNodeToRomanian(children[1])}, rezultă în numărul de sub radical`,
    );
  }
  if (tag === 'msup') {
    const base = mathNodeToRomanian(children[0]);
    const exponentRaw = cleanSpeechText(children[1]?.textContent);
    if (exponentRaw === '2') return cleanSpeechText(`${base} la pătrat, adică ${base} înmulțit cu el însuși`);
    if (exponentRaw === '3') return cleanSpeechText(`${base} la cub, adică ${base} înmulțit cu el însuși și apoi încă o dată cu ${base}`);
    return cleanSpeechText(`${base} ridicat la puterea ${mathNodeToRomanian(children[1])}, adică ${base} înmulțit cu el însuși de ${mathNodeToRomanian(children[1])} ori`);
  }
  if (tag === 'msub') {
    return cleanSpeechText(
      `Avem o variabilă ${mathNodeToRomanian(children[0])} cu indice ${mathNodeToRomanian(children[1])}, ceea ce ne ajută să distinguem diferite valori ale aceleiași variabile`,
    );
  }
  if (tag === 'msubsup') {
    const base = mathNodeToRomanian(children[0]);
    const lower = mathNodeToRomanian(children[1]);
    const upper = mathNodeToRomanian(children[2]);
    if (/^(suma|produsul|integrala|integrala dublă)$/.test(base)) {
      return cleanSpeechText(`${base} de la ${lower} până la ${upper}, adică adunăm (respectiv împreunăm, integrăm) toate valorile de la ${lower} la ${upper}`);
    }
    return cleanSpeechText(`${base} indice ${lower}, la puterea ${upper}, indicând o variabilă specifică a familiei ${base}`);
  }
  if (tag === 'mover') {
    const markerText = (children[1]?.textContent || '').trim();

    const marker = cleanSpeechText(markerText);
    const content = mathNodeToRomanian(children[0]);
    if (/[→⃗]/.test(marker)) return cleanSpeechText(`Vectorul ${content}, indicând o marime și o direcție`);
    if (/[¯‾]/.test(marker)) return cleanSpeechText(`Segmentul ${content}, indicând o lungime specifică`);
    if (/[ˆ^]/.test(marker)) return cleanSpeechText(`Unghiul ${content}, indicând o amplitudini de rotație`);
    return cleanSpeechText(`${content}, cu ${mathNodeToRomanian(children[1])} deasupra, indicând o notatie suplimentare`);
  }
  if (tag === 'munder') {
    const base = mathNodeToRomanian(children[0]);
    const lower = mathNodeToRomanian(children[1]);
    if (base === 'limita')
        return cleanSpeechText(`Limita lui ${lower}, adică valoarea la care se apropiă o funcție atunci când variabila se apropie de o anumită valoare`);
    return cleanSpeechText(`${base}, de la ${lower}, indicând o restricție sau o condiție de început`);
  }
  if (tag === 'munderover') {
    return cleanSpeechText(
      `${mathNodeToRomanian(children[0])} de la ${mathNodeToRomanian(children[1])} până la ${mathNodeToRomanian(children[2])}, indicând o operație cu un interval de variație`,
    );
  }
  if (tag === 'mfenced') {
    return cleanSpeechText(`Avem o expresie grupată în paranteze: ${readChildren()}`);
  }
  if (tag === 'mtable') {
    const rows = children.filter((child) => child.localName === 'mtr' || child.localName === 'mlabeledtr');
    if (rows.length === 0) return '';
    const rowsSpeech = rows.map((row, index) => `rândul ${index + 1}: ${mathNodeToRomanian(row)}`);
    return cleanSpeechText(`Avem o tabelă cu ${rows.length} rânduri: ${rowsSpeech.join('; ')}`);
  }
  if (tag === 'mtr' || tag === 'mlabeledtr' || tag === 'mtd') return readChildren();

  return readChildren();
}

export function mathElementToRomanian(element) {
  if (!element) return '';
  const math =
    (element.matches?.('math') ? element : null)
    || element.querySelector?.('.katex-mathml math, math');
  const annotation =
    element.matches?.('annotation[encoding="application/x-tex"]')
      ? element
      : element.querySelector?.('annotation[encoding="application/x-tex"]');
  const latex = annotation?.textContent || '';
  const spoken = math ? mathNodeToRomanian(math) : '';
  const fallback = latexToRomanian(latex || element.textContent);
  // KaTeX descompune literele românești în accente MathML de prezentare:
  // de exemplu `ă` devine `a` cu breve, iar `î` devine `ı` cu circumflex.
  // Adnotarea TeX păstrează diferența esențială dintre o literă literală
  // și o comandă matematică reală, precum `\hat`, `\angle` sau `\int`.
  const preferAnnotatedLatex = Boolean(latex && ROMANIAN_DIACRITICS.test(latex));
  let result = cleanSpeechText(
    preferAnnotatedLatex ? fallback : (spoken || fallback),
  );

  if (/\\begin\{cases\}/.test(latex) && !/^sistem/.test(result)) {
    result = `sistem de relații: ${result}`;
  } else if (/\\begin\{(?:matrix|pmatrix|bmatrix|vmatrix|array)\}/.test(latex) && !/^(matrice|tabel)/.test(result)) {
    result = `matrice sau tabel de calcul: ${result}`;
  }

  return cleanSpeechText(result);
}
