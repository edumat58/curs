import React, { useEffect, useRef, useState, useCallback } from 'react';
import katex from 'katex';
import { REGISTRY } from './generators';
import styles from './styles.module.css';

/* Randează LaTeX cu KaTeX (CSS-ul KaTeX e încărcat global în site). */
function Tex({ math, block }) {
  const html = katex.renderToString(String(math), {
    throwOnError: false,
    displayMode: !!block,
  });
  return (
    <span
      className={block ? styles.texBlock : styles.tex}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
// Text cu matematică inline între $...$ — totul randat cu KaTeX.
function renderRich(text) {
  return String(text)
    .split(/\$([^$]+)\$/g)
    .map((p, i) => (i % 2 === 1 ? katex.renderToString(p, { throwOnError: false }) : escapeHtml(p)))
    .join('');
}

function normNum(s) {
  return String(s).trim().replace(/\s+/g, '').replace(',', '.');
}

// Verifică un răspuns (acceptă zecimale cu virgulă și fracții echivalente).
function checkBlank(input, blank) {
  const raw = (input ?? '').trim();
  if (!raw) return false;
  if (blank.kind === 'text') {
    return raw.toLowerCase() === String(blank.answer).toLowerCase();
  }
  let val;
  if (raw.includes('/')) {
    const parts = raw.split('/');
    val = parseFloat(normNum(parts[0])) / parseFloat(normNum(parts[1]));
  } else {
    val = parseFloat(normNum(raw));
  }
  if (!isFinite(val)) return false;
  const target = Number(blank.answer);
  const tol = blank.tol ?? (blank.kind === 'int' ? 1e-9 : 1e-6);
  return Math.abs(val - target) <= tol;
}

/**
 * <Automatism id="pythagoras" title="A5 · Teorema lui Pitagora" />
 * sau  <Automatism generator={fn} />
 */
export default function Automatism({ id, generator, title, subtitle }) {
  const gen = generator || REGISTRY[id]?.fn;
  const [q, setQ] = useState(null);
  const [inputs, setInputs] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | correct | wrong
  const [score, setScore] = useState({ ok: 0, total: 0, streak: 0, best: 0 });
  const firstInput = useRef(null);

  const nextQuestion = useCallback(() => {
    if (!gen) return;
    const question = gen();
    setQ(question);
    setInputs(question.blanks.map(() => ''));
    setStatus('idle');
    requestAnimationFrame(() => firstInput.current?.focus());
  }, [gen]);

  // Prima întrebare doar pe client (Math.random ar strica hidratarea SSR).
  useEffect(() => {
    nextQuestion();
  }, [nextQuestion]);

  const submit = (e) => {
    e.preventDefault();
    if (!q) return;
    if (status === 'idle') {
      const ok = q.blanks.every((b, i) => checkBlank(inputs[i], b));
      setStatus(ok ? 'correct' : 'wrong');
      setScore((s) => {
        const streak = ok ? s.streak + 1 : 0;
        return {
          ok: s.ok + (ok ? 1 : 0),
          total: s.total + 1,
          streak,
          best: Math.max(s.best, streak),
        };
      });
    } else {
      nextQuestion();
    }
  };

  if (!gen) {
    return (
      <div className={styles.card}>
        <p className={styles.error}>Automatism necunoscut: <code>{id}</code></p>
      </div>
    );
  }

  return (
    <section className={styles.card} aria-label={title || 'Automatism'}>
      <header className={styles.head}>
        <div className={styles.headText}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <div className={styles.scoreBox} aria-live="polite">
          <span className={styles.streak} title="Răspunsuri corecte la rând">
            🔥 {score.streak}
          </span>
          <span className={styles.tally}>
            {score.ok}/{score.total}
          </span>
        </div>
      </header>

      {!q ? (
        <p className={styles.loading}>Se pregătește o întrebare…</p>
      ) : (
        <form onSubmit={submit}>
          <div className={styles.prompt}>
            {q.prompt.text && (
              <p
                className={styles.promptText}
                dangerouslySetInnerHTML={{ __html: renderRich(q.prompt.text) }}
              />
            )}
            {q.prompt.latex && (
              <div className={styles.promptMath}>
                <Tex math={q.prompt.latex} block />
              </div>
            )}
            {q.prompt.svg && (
              <div
                className={styles.figure}
                dangerouslySetInnerHTML={{ __html: q.prompt.svg }}
              />
            )}
            {q.prompt.imageUrl && (
              <img className={styles.figureImg} src={q.prompt.imageUrl} alt="" />
            )}
          </div>

          <div className={styles.blanks}>
            {q.blanks.map((b, i) => (
              <label className={styles.blank} key={i}>
                <input
                  ref={i === 0 ? firstInput : null}
                  className={
                    status === 'wrong'
                      ? checkBlank(inputs[i], b)
                        ? styles.inputOk
                        : styles.inputBad
                      : styles.input
                  }
                  type="text"
                  inputMode={b.kind === 'text' ? 'text' : 'numeric'}
                  autoComplete="off"
                  placeholder={b.placeholder || '?'}
                  value={inputs[i]}
                  disabled={status === 'correct'}
                  onChange={(e) => {
                    const next = inputs.slice();
                    next[i] = e.target.value;
                    setInputs(next);
                    if (status === 'wrong') setStatus('idle');
                  }}
                />
              </label>
            ))}
          </div>

          <div className={styles.actions}>
            {status === 'correct' ? (
              <button type="submit" className={styles.primary}>
                Următoarea →
              </button>
            ) : (
              <button type="submit" className={styles.primary}>
                Verifică
              </button>
            )}
            <button
              type="button"
              className={styles.ghost}
              onClick={nextQuestion}
            >
              Altă întrebare
            </button>
          </div>

          {status === 'correct' && (
            <p className={styles.feedbackOk}>✓ Corect! Bravo.</p>
          )}
          {status === 'wrong' && (
            <div className={styles.feedbackBad}>
              <span>Mai încearcă. Rezolvarea:</span>
              {q.solutionLatex && (
                <span className={styles.solution}>
                  <Tex math={q.solutionLatex} />
                </span>
              )}
            </div>
          )}
        </form>
      )}
    </section>
  );
}
