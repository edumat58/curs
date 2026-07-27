import React, { useEffect, useMemo, useState } from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import EduPasiAccessibility from '@site/src/components/EduPasiAccessibility/SectionAccessibility';
import styles from './edupasi.module.css';

/* Etichete de clasă și ordinea lor. Lecțiile în sine vin AUTOMAT din
   static/lessons-index.json (regenerat la fiecare build din conținutul
   folderelor docs/edupasi), deci lista de mai jos nu se mai scrie de mână. */
const CLASS_LABELS = {
  c5: 'Clasa a V-a',
  c6: 'Clasa a VI-a',
  c7: 'Clasa a VII-a',
  c8: 'Clasa a VIII-a',
};
const CLASS_ORDER = ['c5', 'c6', 'c7', 'c8'];

function classLabel(course) {
  return CLASS_LABELS[course] || (course ? course.toUpperCase() : 'Lecții');
}

function moduleLabel(key) {
  if (!key) return 'Lecții';
  const match = /modul[-_]?([0-9]+)/i.exec(key);
  if (match) return `Modulul ${match[1]} - EduPAȘI`;
  return key.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// URL-urile din index includ baseUrl (/curs/...); Link îl adaugă la loc,
// așa că îl scoatem aici ca să nu se dubleze.
function stripBase(url) {
  return url.replace(/^\/curs(?=\/)/, '') || '/';
}

const collator = new Intl.Collator('ro', { numeric: true, sensitivity: 'base' });

export default function EduPasiPage() {
  const indexUrl = useBaseUrl('/lessons-index.json');
  const [state, setState] = useState({ status: 'loading', lessons: [], error: '' });
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let alive = true;
    setState({ status: 'loading', lessons: [], error: '' });
    fetch(indexUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (!alive) return;
        const lessons = (data?.lessons || []).filter((l) => l.collection === 'edupasi');
        setState({ status: 'ready', lessons, error: '' });
      })
      .catch((err) => {
        if (!alive) return;
        setState({ status: 'error', lessons: [], error: String(err?.message || err) });
      });
    return () => {
      alive = false;
    };
  }, [indexUrl]);

  // Grupare automată: Clasă → Modul → Lecții.
  const grouped = useMemo(() => {
    const byCourse = new Map();
    for (const lesson of state.lessons) {
      const course = lesson.course || 'altele';
      if (!byCourse.has(course)) byCourse.set(course, new Map());
      const modules = byCourse.get(course);
      const modKey = lesson.module || '';
      if (!modules.has(modKey)) modules.set(modKey, []);
      modules.get(modKey).push(lesson);
    }

    const courses = [...byCourse.keys()].sort((a, b) => {
      const ia = CLASS_ORDER.indexOf(a);
      const ib = CLASS_ORDER.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || collator.compare(a, b);
    });

    return courses.map((course) => {
      const modulesMap = byCourse.get(course);
      const moduleKeys = [...modulesMap.keys()].sort((a, b) => collator.compare(a, b));
      return {
        course,
        label: classLabel(course),
        count: [...modulesMap.values()].reduce((n, list) => n + list.length, 0),
        modules: moduleKeys.map((key) => ({
          key,
          label: moduleLabel(key),
          lessons: modulesMap
            .get(key)
            .slice()
            .sort((a, b) => collator.compare(a.url, b.url)),
        })),
      };
    });
  }, [state.lessons]);

  const query = searchQuery.trim().toLowerCase();

  const visible = useMemo(() => {
    return grouped
      .filter((group) => selectedGrade === 'all' || group.course === selectedGrade)
      .map((group) => ({
        ...group,
        modules: group.modules
          .map((mod) => ({
            ...mod,
            lessons: query
              ? mod.lessons.filter((l) => l.title.toLowerCase().includes(query))
              : mod.lessons,
          }))
          .filter((mod) => mod.lessons.length > 0),
      }))
      .filter((group) => group.modules.length > 0);
  }, [grouped, selectedGrade, query]);

  const totalCount = state.lessons.length;
  const visibleCount = visible.reduce(
    (n, group) => n + group.modules.reduce((k, mod) => k + mod.lessons.length, 0),
    0
  );

  const resetFilters = () => {
    setSelectedGrade('all');
    setSearchQuery('');
  };

  return (
    <Layout
      title="EduPAȘI — Matematica Adaptată"
      description="Platforma de Adaptare Școlară Incluzivă"
    >
      <div className={styles.page}>
        <main className={styles.shell}>
          <section className={styles.hero}>
            <div className={styles.heroCopy}>
              <p className={styles.sectionKicker}>EduPAȘI — Matematica Adaptată</p>
              <div className={styles.wordmark}>
                <span className={styles.steps} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <b />
                </span>
                <span>Edu<strong>PAȘI</strong></span>
              </div>
              <div className={styles.kulturosferaLine} aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <h1>
                <span className={styles.acr}>P</span>latforma de{' '}
                <span className={styles.acr}>A</span>daptare{' '}
                <span className={styles.acr}>Ș</span>colară{' '}
                <span className={styles.acr}>I</span>ncluzivă
              </h1>
              <p className={styles.lead}>
                Fiecare lecție este adaptată și reorganizată în secțiuni scurte și
                clare, cu explicații pas cu pas, format lizibil și opțiuni de
                accesibilitate vizuală.
              </p>
              <div className={styles.heroActions}>
                <a className={styles.primaryAction} href="#lectii">
                  Vezi lecțiile
                </a>
              </div>
            </div>

            
          </section>

          <section className={styles.catalogue} id="lectii">
            <div className={styles.catalogueHeading}>
              <h2>Toate lecțiile EduPAȘI</h2>
            </div>

            <div className={styles.controls}>
              <div className={styles.search}>
                <label htmlFor="edupasi-search">Caută o lecție</label>
                <div className={styles.searchField}>
                  <span aria-hidden="true">⌕</span>
                  <input
                    id="edupasi-search"
                    type="search"
                    placeholder="Scrie titlul lecției…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <fieldset className={styles.classFilters}>
                <legend>Clasa</legend>
                <div className={styles.filterButtons}>
                  <button
                    type="button"
                    className={styles.filterButton}
                    aria-pressed={selectedGrade === 'all'}
                    onClick={() => setSelectedGrade('all')}
                  >
                    <span className={styles.filterFull}>Toate clasele</span>
                    <span className={styles.filterShort}>Toate</span>
                    <span className={styles.filterCount}>{totalCount}</span>
                  </button>
                  {grouped.map((group) => (
                    <button
                      key={group.course}
                      type="button"
                      className={styles.filterButton}
                      aria-pressed={selectedGrade === group.course}
                      onClick={() => setSelectedGrade(group.course)}
                    >
                      <span className={styles.filterFull}>{group.label}</span>
                      <span className={styles.filterShort}>{group.course.toUpperCase()}</span>
                      <span className={styles.filterCount}>{group.count}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            {state.status === 'loading' && (
              <div className={styles.message}>
                <span className={styles.loadingDot} aria-hidden="true" />
                <p>Se încarcă lecțiile EduPAȘI…</p>
              </div>
            )}

            {state.status === 'error' && (
              <div className={`${styles.message} ${styles.errorMessage}`}>
                <span className={styles.loadingDot} aria-hidden="true" />
                <p>
                  Nu am putut încărca lista de lecții. Reîncarcă pagina sau încearcă
                  din nou mai târziu.
                </p>
              </div>
            )}

            {state.status === 'ready' && (
              <>
                <p className={styles.resultStatus} aria-live="polite">
                  {visibleCount} {visibleCount === 1 ? 'lecție afișată' : 'lecții afișate'}
                </p>

                {visible.length === 0 ? (
                  <div className={styles.emptyState}>
                    <span className={styles.emptyIndex} aria-hidden="true">
                      0
                    </span>
                    <div>
                      <h3>Nicio lecție găsită</h3>
                      <p>
                        {totalCount === 0
                          ? 'Încă nu există lecții EduPAȘI publicate. Adaugă fișiere în docs/edupasi și vor apărea automat aici.'
                          : 'Nu există lecții care să corespundă căutării sau clasei alese.'}
                      </p>
                      {(selectedGrade !== 'all' || query) && (
                        <button type="button" onClick={resetFilters}>
                          Șterge filtrele
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={styles.classGroups}>
                    {visible.map((group) => (
                      <div className={styles.classGroup} key={group.course}>
                        <div className={styles.classHeader}>
                          <p>EduPAȘI</p>
                          <h3>{group.label}</h3>
                        </div>
                        <div className={styles.moduleGrid}>
                          {group.modules.map((mod) => (
                            <div className={styles.moduleCard} key={mod.key}>
                              <div className={styles.moduleHeader}>
                                <h4>{mod.label}</h4>
                                <span>
                                  {mod.lessons.length}{' '}
                                  {mod.lessons.length === 1 ? 'lecție' : 'lecții'}
                                </span>
                              </div>
                              <ol className={styles.lessonList}>
                                {mod.lessons.map((lesson, index) => (
                                  <li className={styles.lessonItem} key={lesson.url}>
                                    <Link
                                      className={styles.lessonCard}
                                      to={stripBase(lesson.url)}
                                    >
                                      <span className={styles.lessonNumber}>
                                        {index + 1}
                                      </span>
                                      <span className={styles.lessonCopy}>
                                        <strong>{lesson.title}</strong>
                                        <small>
                                          {group.label} · {mod.label}
                                        </small>
                                      </span>
                                      <span className={styles.openLesson} aria-hidden="true">
                                        Deschide →
                                      </span>
                                    </Link>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </main>
        <EduPasiAccessibility />
      </div>
    </Layout>
  );
}
