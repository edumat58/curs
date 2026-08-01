/**
 * Automatisme — exerciții scurte, regenerate la fiecare încercare.
 *
 * Un automatism nu e un exercițiu oarecare: e o procedură pe care elevul
 * trebuie s-o poată face fără să se gândească la ea, ca să-i rămână memoria de
 * lucru liberă pentru raționamentul propriu-zis. De aceea întrebările sunt
 * scurte, se schimbă la fiecare apăsare, iar corectura vine imediat.
 *
 * Două reguli îi dau forma, și amândouă se văd în cod:
 *
 * 1. **Elevul nu scrie matematică.** Nu are tastatură pentru radicali, fracții
 *    sau exponenți, iar dacă i-am cere așa ceva am măsura priceperea de a scrie
 *    LaTeX, nu de a calcula. Așa că fiecare răspuns e ori un număr, ori o
 *    alegere dintr-o listă. O fracție se cere pe două casete, numărător și
 *    numitor, nu ca „3/4".
 *
 * 2. **Cerința spune exact ce se completează.** Fiecare casetă are eticheta ei;
 *    nimic nu se ghicește din context și nu se strecoară indicii în paranteze.
 *
 * Contractul unei întrebări e descris în `generators.js`.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import katex from 'katex';
import { REGISTRY } from './generators';
import styles from './styles.module.css';

/** Matematică randată cu KaTeX; CSS-ul lui e încărcat global de site. */
function Tex({ math, block }) {
  const html = katex.renderToString(String(math), {
    throwOnError: false,
    displayMode: Boolean(block),
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

/** Text cu matematică între `$...$`. */
function renderRich(text) {
  return String(text)
    .split(/\$([^$]+)\$/g)
    .map((p, i) => (i % 2 === 1 ? katex.renderToString(p, { throwOnError: false }) : escapeHtml(p)))
    .join('');
}

/**
 * Verifică un răspuns.
 *
 * Zecimalele se acceptă cu virgulă sau cu punct — în manualele românești se
 * scrie cu virgulă, dar tastatura numerică de pe telefon dă punct, și n-are
 * niciun rost ca elevul să greșească din pricina asta.
 */
function verifica(raspuns, camp) {
  const brut = String(raspuns ?? '').trim();
  if (!brut) return false;

  if (camp.kind === 'choice') return brut === String(camp.answer);
  if (camp.kind === 'text') {
    const curata = (s) => String(s).trim().toLowerCase().replace(/\s+/g, ' ');
    return curata(brut) === curata(camp.answer);
  }

  const valoare = Number(brut.replace(/\s+/g, '').replace(',', '.'));
  if (!Number.isFinite(valoare)) return false;
  const tinta = Number(camp.answer);
  const toleranta = camp.tol ?? (camp.kind === 'int' ? 1e-9 : 1e-6);
  return Math.abs(valoare - tinta) <= toleranta;
}

export default function Automatism({ id, generator, title, subtitle }) {
  const genereaza = generator || REGISTRY[id]?.fn;
  const [intrebare, setIntrebare] = useState(null);
  const [raspunsuri, setRaspunsuri] = useState([]);
  const [stare, setStare] = useState('deschis'); // deschis | corect | gresit
  const [scor, setScor] = useState({ bune: 0, total: 0, sir: 0 });
  const primaCaseta = useRef(null);

  const urmatoarea = useCallback(() => {
    if (!genereaza) return;
    const noua = genereaza();
    setIntrebare(noua);
    setRaspunsuri(noua.blanks.map(() => ''));
    setStare('deschis');
    requestAnimationFrame(() => primaCaseta.current?.focus());
  }, [genereaza]);

  // Prima întrebare se face doar în browser: `Math.random` la randarea de pe
  // server ar da alt rezultat decât la hidratare și React ar reclama.
  useEffect(() => { urmatoarea(); }, [urmatoarea]);

  const trimite = (e) => {
    e.preventDefault();
    if (!intrebare) return;
    if (stare !== 'deschis') { urmatoarea(); return; }
    const corect = intrebare.blanks.every((camp, i) => verifica(raspunsuri[i], camp));
    setStare(corect ? 'corect' : 'gresit');
    setScor((s) => ({
      bune: s.bune + (corect ? 1 : 0),
      total: s.total + 1,
      sir: corect ? s.sir + 1 : 0,
    }));
  };

  const scrie = (i, valoare) => {
    setRaspunsuri((precedente) => {
      const noi = precedente.slice();
      noi[i] = valoare;
      return noi;
    });
    if (stare === 'gresit') setStare('deschis');
  };

  if (!genereaza) {
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
        <p className={styles.scoreBox} aria-live="polite">
          {scor.total > 0 && (
            <>
              <span className={styles.tally}>{scor.bune} din {scor.total}</span>
              {scor.sir > 1 && <span className={styles.streak}>{scor.sir} la rând</span>}
            </>
          )}
        </p>
      </header>

      {!intrebare ? (
        <p className={styles.loading}>Se pregătește întrebarea.</p>
      ) : (
        <form onSubmit={trimite}>
          <div className={styles.prompt}>
            {intrebare.prompt.text && (
              <p
                className={styles.promptText}
                dangerouslySetInnerHTML={{ __html: renderRich(intrebare.prompt.text) }}
              />
            )}
            {intrebare.prompt.latex && (
              <div className={styles.promptMath}>
                <Tex math={intrebare.prompt.latex} block />
              </div>
            )}
            {intrebare.prompt.svg && (
              <div
                className={styles.figure}
                dangerouslySetInnerHTML={{ __html: intrebare.prompt.svg }}
              />
            )}
          </div>

          <div className={styles.blanks}>
            {intrebare.blanks.map((camp, i) => {
              const gresitAici = stare === 'gresit' && !verifica(raspunsuri[i], camp);

              // Clasificările se aleg dintr-o listă: nimic de tastat, deci nici
              // ortografia și nici simbolurile nu stau în calea răspunsului.
              if (camp.kind === 'choice') {
                return (
                  <fieldset className={styles.choiceGroup} key={i}>
                    <legend className={styles.blankLabel}>{camp.label}</legend>
                    <div className={gresitAici ? styles.choicesBad : styles.choices}>
                      {camp.options.map((optiune) => (
                        <button
                          type="button"
                          key={optiune}
                          className={raspunsuri[i] === optiune ? styles.choiceOn : styles.choice}
                          aria-pressed={raspunsuri[i] === optiune}
                          disabled={stare === 'corect'}
                          onClick={() => scrie(i, optiune)}
                        >
                          {optiune}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                );
              }

              return (
                <label className={styles.blank} key={i}>
                  <span className={styles.blankLabel}>{camp.label}</span>
                  <input
                    ref={i === 0 ? primaCaseta : null}
                    className={gresitAici ? styles.inputBad : styles.input}
                    type="text"
                    inputMode={camp.kind === 'text' ? 'text' : 'decimal'}
                    autoComplete="off"
                    value={raspunsuri[i]}
                    disabled={stare === 'corect'}
                    onChange={(e) => scrie(i, e.target.value)}
                  />
                </label>
              );
            })}
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.primary}>
              {stare === 'deschis' ? 'Verifică' : 'Întrebarea următoare'}
            </button>
            {stare === 'deschis' && (
              <button type="button" className={styles.ghost} onClick={urmatoarea}>
                Schimbă întrebarea
              </button>
            )}
          </div>

          {stare === 'corect' && <p className={styles.feedbackOk}>Corect.</p>}
          {stare === 'gresit' && (
            <div className={styles.feedbackBad}>
              <p className={styles.feedbackTitle}>Nu este răspunsul corect.</p>
              {intrebare.solutionLatex && (
                <p className={styles.solution}><Tex math={intrebare.solutionLatex} /></p>
              )}
            </div>
          )}
        </form>
      )}
    </section>
  );
}
