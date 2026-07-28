import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import Link from '@docusaurus/Link';
import BrowserOnly from '@docusaurus/BrowserOnly';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { useLocation } from '@docusaurus/router';
import { useDocsSidebar } from '@docusaurus/plugin-content-docs/client';
import OriginalDocRootLayout from '@theme-original/DocRoot/Layout';
import shellStyles from './styles.module.css';

/* Mic ajutor pentru a combina clase condiționat, fără dependențe externe. */
function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

function cleanPath(value) {
  if (!value) return '';
  try {
    const path = new URL(value, 'https://edupasi.local').pathname;
    return decodeURIComponent(path).replace(/\/+$/, '') || '/';
  } catch {
    return String(value).split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  }
}

function isCurrentPath(pathname, href) {
  return cleanPath(pathname) === cleanPath(href);
}

function collectLessonLinks(items) {
  return items.flatMap((item) => {
    if (item.type === 'category') return collectLessonLinks(item.items || []);
    return item.type === 'link' && item.docId ? [item] : [];
  });
}

function collectNavigableEntries(items, trail = []) {
  return items.flatMap((item) => {
    if (item.type === 'category') {
      const categoryTrail = [...trail, item.label];
      const categoryEntry = item.href
        ? [{ href: item.href, label: item.label, trail: categoryTrail }]
        : [];
      return [
        ...categoryEntry,
        ...collectNavigableEntries(item.items || [], categoryTrail),
      ];
    }
    if (item.type !== 'link') return [];
    return [{ href: item.href, label: item.label, trail: [...trail, item.label] }];
  });
}

/* ============================================================
   Model de date pentru „traseul” EduPAȘI
   ------------------------------------------------------------
   Structura reală a lecțiilor este Clasă → Modul → Lecții, adică
   două niveluri de categorii. Pentru copiii cu CES, două niveluri
   de îndentare sunt prea multe: se pierd. De aceea aplatizăm totul
   într-un singur șir de „Pași” numerotați (modulele), fiecare cu o
   listă simplă de lecții. Numele clasei rămâne doar ca etichetă de
   context, nu ca încă un nivel în care trebuie să dai click.
   ============================================================ */
function collectModules(items, classLabel = null, acc = []) {
  items.forEach((item) => {
    if (item.type !== 'category') return;

    const children = item.items || [];
    const hasDirectLessons = children.some(
      (child) => child.type === 'link' && child.docId
    );
    const hasChildCategories = children.some((child) => child.type === 'category');

    if (hasDirectLessons) {
      // Categorie „frunză” = un Pas real. Orice sub-structură mai adâncă e
      // strânsă intenționat în acest pas, ca să nu apară niveluri suplimentare.
      const lessons = collectLessonLinks(children)
        .map((lesson) => ({
          href: lesson.href,
          label: lesson.label,
        }))
        .sort((a, b) => {
          const numA = (a.label.match(/\bC(\d+)/i)?.[1] || a.href.match(/\/0?(\d+)/)?.[1]) || 999;
          const numB = (b.label.match(/\bC(\d+)/i)?.[1] || b.href.match(/\/0?(\d+)/)?.[1]) || 999;
          const nA = parseInt(numA, 10);
          const nB = parseInt(numB, 10);
          if (nA !== nB) return nA - nB;
          return a.label.localeCompare(b.label, 'ro', { numeric: true });
        });

      acc.push({
        key: item.href || item.label || `pas-${acc.length}`,
        label: item.label,
        href: item.href || null,
        classLabel,
        lessons,
      });
    } else if (hasChildCategories) {
      // Categorie de grupare (ex. clasa) → coborâm, dar îi ținem minte numele.
      collectModules(children, item.label, acc);
    }
  });

  return acc;
}

function buildJourney(items) {
  const modules = collectModules(items);

  // Lecții „libere”, așezate direct la rădăcină, fără modul. Le adunăm într-un
  // prim pas ca să nu rămână niciodată pe dinafara traseului.
  const looseLessons = items
    .filter((item) => item.type === 'link' && item.docId)
    .map((item) => ({ href: item.href, label: item.label }));

  if (looseLessons.length > 0) {
    modules.unshift({
      key: 'start',
      label: 'Primii pași',
      href: null,
      classLabel: null,
      lessons: looseLessons,
    });
  }

  // Numerotăm pașii și dăm fiecărei lecții un index global, ca să putem calcula
  // „Lecția 3 din 8”, lecția următoare, cea anterioară etc.
  const orderedLessons = [];
  modules.forEach((mod, moduleIndex) => {
    mod.step = moduleIndex + 1;
    mod.lessons.forEach((lesson) => {
      lesson.globalIndex = orderedLessons.length;
      lesson.moduleKey = mod.key;
      orderedLessons.push(lesson);
    });
  });

  return { modules, orderedLessons };
}

/* ============================================================
   Iconițe (SVG simple, moștenesc culoarea și sunt ascunse de la
   cititoarele de ecran — mesajul este dat separat prin text).
   ============================================================ */
function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M4 10.5l4 4 8-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true" focusable="false">
      <path d="M6 4l10 6-10 6z" fill="currentColor" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        d="M5 12h13m-6-6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        d="M12 22s7-6.4 7-12a7 7 0 10-14 0c0 5.6 7 12 7 12z"
        fill="currentColor"
        opacity="0.16"
      />
      <path
        d="M12 22s7-6.4 7-12a7 7 0 10-14 0c0 5.6 7 12 7 12z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="10" r="2.6" fill="currentColor" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        d="M12 3l2.6 5.5 6 .8-4.4 4.2 1.1 6L12 16.9 6.7 19.5l1.1-6L3.4 9.3l6-.8z"
        fill="currentColor"
      />
    </svg>
  );
}

function EduPasiTocModal({ isOpen, onClose }) {
  const [headings, setHeadings] = useState([]);
  const [lessonTitle, setLessonTitle] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const h1 = document.querySelector('article h1, .markdown h1, h1');
    setLessonTitle((h1?.textContent || 'Lecție EduPAȘI').trim());

    const headingNodes = Array.from(
      document.querySelectorAll('article h2, article h3, .markdown h2, .markdown h3')
    ).filter((node) => {
      const text = (node.textContent || '').trim();
      return text.length > 0 && !node.closest('[data-edupasi-ignore]');
    });

    const parsedHeadings = headingNodes.map((node, index) => {
      if (!node.id) {
        node.id = `edupasi-toc-heading-${index}`;
      }
      return {
        id: node.id,
        text: node.textContent.trim(),
        tag: node.tagName.toLowerCase(),
        element: node,
      };
    });

    setHeadings(parsedHeadings);
  }, [isOpen]);

  if (!isOpen) return null;

  const scrollToHeading = (element) => {
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      element.focus?.({ preventScroll: true });
    }
    onClose();
  };

  return (
    <div className={shellStyles.tocOverlay} onClick={onClose}>
      <div
        className={shellStyles.tocModal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Cuprinsul real al lecției"
      >
        <header className={shellStyles.tocHeader}>
          <div>
            <span className={shellStyles.tocSubtitle}>Cuprinsul lecției</span>
            <h3 className={shellStyles.tocTitle}>{lessonTitle}</h3>
          </div>
          <button
            type="button"
            className={shellStyles.tocClose}
            onClick={onClose}
            aria-label="Închide cuprinsul"
          >
            ×
          </button>
        </header>

        <div className={shellStyles.tocBody}>
          {headings.length > 0 ? (
            <ul className={shellStyles.tocList}>
              {headings.map((item, idx) => (
                <li
                  key={item.id}
                  className={item.tag === 'h3' ? shellStyles.tocSubItem : shellStyles.tocItem}
                >
                  <button
                    type="button"
                    className={shellStyles.tocButton}
                    onClick={() => scrollToHeading(item.element)}
                  >
                    <span className={shellStyles.tocNumber}>{idx + 1}.</span>
                    <span>{item.text}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={shellStyles.tocEmpty}>Această lecție este concepută ca un parcurs continuu.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Un „Pas” din traseu = un modul, cu lista lui de lecții.
   Se deschide/închide singur, dar copilul poate comuta oricând.
   ============================================================ */
function JourneyStep({ module: mod, currentIndex, pathname, defaultOpen }) {
  const holdsCurrent = mod.lessons.some((lesson) => isCurrentPath(pathname, lesson.href));
  const [open, setOpen] = useState(holdsCurrent || defaultOpen);

  // Când navigarea aterizează în acest pas, îl deschidem automat.
  useEffect(() => {
    if (holdsCurrent) setOpen(true);
  }, [holdsCurrent]);

  const total = mod.lessons.length;
  const doneCount =
    currentIndex >= 0
      ? mod.lessons.filter((lesson) => lesson.globalIndex < currentIndex).length
      : 0;
  const isComplete = total > 0 && currentIndex >= 0 && doneCount === total;
  const contentId = `edupasi-pas-${mod.step}`;

  const stateClass = holdsCurrent
    ? shellStyles.stepCurrent
    : isComplete
    ? shellStyles.stepDone
    : shellStyles.stepUpcoming;

  return (
    <section className={cx(shellStyles.step, stateClass)}>
      <h3 className={shellStyles.stepHeadingReset}>
        <button
          type="button"
          className={shellStyles.stepHeader}
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen((value) => !value)}
        >
          <span
            className={shellStyles.stepMark}
            data-state={holdsCurrent ? 'current' : isComplete ? 'done' : 'upcoming'}
            aria-hidden="true"
          >
            {isComplete ? <CheckIcon /> : null}
          </span>
          <span className={shellStyles.stepInfo}>
            {mod.classLabel && (
              <span className={shellStyles.stepKicker}>{mod.classLabel}</span>
            )}
            <span className={shellStyles.stepName}>{mod.label}</span>
            {total > 0 && (
              <span className={shellStyles.stepCount}>
                {isComplete
                  ? 'Gata'
                  : `${doneCount} din ${total} ${total === 1 ? 'lecție' : 'lecții'}`}
              </span>
            )}
          </span>
          <span
            className={cx(shellStyles.stepChevron, open && shellStyles.stepChevronOpen)}
            aria-hidden="true"
          />
        </button>
      </h3>

      <div id={contentId} className={shellStyles.stepPanel} hidden={!open}>
        {mod.href && (
          <Link
            className={shellStyles.stepOverview}
            to={mod.href}
            aria-current={isCurrentPath(pathname, mod.href) ? 'page' : undefined}
            onClick={() => window.dispatchEvent(new CustomEvent('edupasi:close-navigator'))}
          >
            Vezi tot pasul
          </Link>
        )}

        <ol className={shellStyles.lessonList}>
          {mod.lessons.map((lesson, lessonIndex) => {
            const isCurrent = isCurrentPath(pathname, lesson.href);
            const isDone = currentIndex >= 0 && lesson.globalIndex < currentIndex;
            const state = isCurrent ? 'current' : isDone ? 'done' : 'upcoming';

            return (
              <li
                key={lesson.href || lessonIndex}
                className={cx(
                  shellStyles.lessonItem,
                  isDone && shellStyles.lessonItemDone,
                  isCurrent && shellStyles.lessonItemCurrent
                )}
              >
                <Link
                  className={cx(
                    shellStyles.lesson,
                    isCurrent && shellStyles.lessonCurrent,
                    isDone && shellStyles.lessonDone
                  )}
                  to={lesson.href}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  <span className={shellStyles.lessonDot} data-state={state} aria-hidden="true">
                    {isDone ? <CheckIcon /> : isCurrent ? <PlayIcon /> : null}
                  </span>
                  <span className={shellStyles.lessonText}>{lesson.label}</span>
                  <span className={shellStyles.srOnly}>
                    {isCurrent
                      ? ' — ești aici acum'
                      : isDone
                      ? ' — lecție terminată'
                      : ' — lecție de parcurs'}
                  </span>
                  {isCurrent && (
                    <span className={shellStyles.lessonNow} aria-hidden="true">
                      Acum
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function EduPasiBrandMark({ className = shellStyles.brandMark, width = "26", height = "21" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 34 28"
      width={width}
      height={height}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="1" y="19" width="9" height="8" rx="1.6" fill="#003058" opacity="0.42" />
      <rect x="12" y="10" width="9" height="17" rx="1.6" fill="#003058" opacity="0.75" />
      <rect x="23" y="5" width="9" height="22" rx="1.6" fill="#003058" />
      <circle cx="27.5" cy="2" r="2" fill="#0197b0" />
    </svg>
  );
}

function EduPasiContextBar({ items }) {
  const { pathname } = useLocation();
  const hubUrl = useBaseUrl('/edupasi');

  const navigation = useMemo(() => {
    const entries = collectNavigableEntries(items);
    const activeEntry = entries.find((entry) => isCurrentPath(pathname, entry.href));
    return {
      currentTitle: activeEntry?.label || 'Lecție EduPAȘI',
    };
  }, [items, pathname]);

  return (
    <header className={shellStyles.contextBar} data-edupasi-chrome="">
      <div className={shellStyles.contextLeft}>
        <Link className={shellStyles.wordmark} to={hubUrl} aria-label="EduPAȘI — toate lecțiile">
          <EduPasiBrandMark />
          <span>Edu<strong>PAȘI</strong></span>
        </Link>
        <Link
          className={shellStyles.homeBtn}
          to="/navigation"
          title="Centralizator — Toate rubricile platformei (Automatisme, Curs V-VIII, EduPAȘI)"
          aria-label="Centralizator — Toate rubricile platformei"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className={shellStyles.homeBtnText}>Toate rubricile</span>
        </Link>
        <div className={shellStyles.contextLesson} aria-live="polite">
          <span>Lecția curentă</span>
          <strong>{navigation.currentTitle}</strong>
        </div>
      </div>
      <button
        type="button"
        className={shellStyles.contextAccessibilityBtn}
        onClick={() => window.dispatchEvent(new CustomEvent('edupasi:open-accessibility'))}
        aria-label="Deschide panoul de accesibilitate vizuală"
      >
        <span className={shellStyles.accessibilityIcon}>Aa</span>
        <span>Accesibilitate</span>
      </button>
    </header>
  );
}

/* ============================================================
   Navigatorul EduPAȘI — reconstruit pentru copii cu CES.
   Trei zone clare, mereu în aceeași ordine:
     1. „Ești aici” — unde sunt acum + cât am parcurs.
     2. Butonul mare „Continuă” — răspunde la „ce fac acum?”.
     3. Harta traseului — pași numerotați cu lecțiile lor.
   ============================================================ */
function EduPasiLearningNavigator({ items }) {
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClose = () => setIsOpen(false);
    window.addEventListener('edupasi:close-navigator', handleClose);
    return () => window.removeEventListener('edupasi:close-navigator', handleClose);
  }, []);

  const { modules, orderedLessons } = useMemo(() => buildJourney(items), [items]);

  const total = orderedLessons.length;
  const currentIndex = orderedLessons.findIndex((lesson) =>
    isCurrentPath(pathname, lesson.href)
  );
  const onLesson = currentIndex >= 0;

  const current = onLesson ? orderedLessons[currentIndex] : null;
  const currentModule = current
    ? modules.find((mod) => mod.key === current.moduleKey)
    : null;
  const nextLesson =
    onLesson && currentIndex + 1 < total ? orderedLessons[currentIndex + 1] : null;
  const prevLesson = onLesson && currentIndex > 0 ? orderedLessons[currentIndex - 1] : null;
  const firstLesson = total > 0 ? orderedLessons[0] : null;

  // Bara de progres arată „cât de departe am ajuns”, incluzând lecția curentă.
  const reached = onLesson ? currentIndex + 1 : 0;
  const progressPercent = total > 0 ? Math.round((reached / total) * 100) : 0;

  return (
    <aside
      data-edupasi-chrome=""
      className={shellStyles.navigator}
      aria-labelledby="edupasi-navigator-title"
      data-edupasi-secondary
    >
      <div className={shellStyles.navHeader}>
        <div className={shellStyles.navTitleWrap}>
          <span className={shellStyles.navEyebrow}>Traseul meu</span>
          <h2 id="edupasi-navigator-title" className={shellStyles.navTitle}>
            Lecțiile EduPAȘI
          </h2>
        </div>
        <button
          className={shellStyles.navToggle}
          type="button"
          aria-expanded={isOpen}
          aria-controls="edupasi-navigator-content"
          onClick={() => setIsOpen((value) => !value)}
        >
          {isOpen ? 'Ascunde' : 'Extinde'}
        </button>
      </div>

      <div id="edupasi-navigator-content" className={shellStyles.navBody} hidden={!isOpen}>
        {total > 0 && (
          <div className={shellStyles.hereCard}>
            <div className={shellStyles.hereTop}>
              <span className={shellStyles.hereLabel}>
                {onLesson ? 'Ești aici' : 'Gata de start'}
              </span>
            </div>

            <p className={shellStyles.hereLesson}>
              {onLesson ? current.label : 'Alege o lecție ca să începi'}
            </p>

            {onLesson && (
              <p className={shellStyles.hereMeta}>
                {currentModule?.classLabel ? `${currentModule.classLabel} · ` : ''}
                Lecția {currentIndex + 1} din {total}
              </p>
            )}

            <div className={shellStyles.progress}>
              <div className={shellStyles.progressHead}>
                <span>Cât ai parcurs</span>
                <strong>
                  {reached} din {total}
                </strong>
              </div>
              <div
                className={shellStyles.progressTrack}
                role="progressbar"
                aria-label="Cât ai parcurs din lecțiile EduPAȘI"
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={reached}
              >
                <span
                  className={shellStyles.progressFill}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className={shellStyles.stepActions}>
              {onLesson && nextLesson && (
                <Link className={shellStyles.nextButton} to={nextLesson.href}>
                  <span className={shellStyles.nextTexts}>
                    <small>Continuă cu</small>
                    <strong>{nextLesson.label}</strong>
                  </span>
                  <span className={shellStyles.nextArrow} aria-hidden="true">
                    <ArrowIcon />
                  </span>
                </Link>
              )}

              {!onLesson && firstLesson && (
                <Link className={shellStyles.nextButton} to={firstLesson.href}>
                  <span className={shellStyles.nextTexts}>
                    <small>Începe cu</small>
                    <strong>{firstLesson.label}</strong>
                  </span>
                  <span className={shellStyles.nextArrow} aria-hidden="true">
                    <ArrowIcon />
                  </span>
                </Link>
              )}

              {onLesson && !nextLesson && (
                <div className={shellStyles.finishNote}>
                  <span className={shellStyles.finishIcon} aria-hidden="true">
                    <StarIcon />
                  </span>
                  <span>Bravo! Ai ajuns la ultima lecție.</span>
                </div>
              )}

              {onLesson && prevLesson && (
                <Link className={shellStyles.prevButton} to={prevLesson.href}>
                  <span className={shellStyles.prevArrow} aria-hidden="true">
                    <ArrowIcon />
                  </span>
                  <span>Înapoi la lecția trecută</span>
                </Link>
              )}
            </div>
          </div>
        )}

        <nav className={shellStyles.map} aria-label="Toate lecțiile, pas cu pas">
          {modules.map((mod, moduleIndex) => (
            <JourneyStep
              key={mod.key}
              module={mod}
              currentIndex={currentIndex}
              pathname={pathname}
              defaultOpen={!onLesson && moduleIndex === 0}
            />
          ))}
        </nav>
      </div>
    </aside>
  );
}

function EduPasiAccessibilityTools() {
  const [tocOpen, setTocOpen] = useState(false);

  useEffect(() => {
    const handleOpenToc = () => setTocOpen(true);
    window.addEventListener('edupasi:open-toc', handleOpenToc);
    return () => {
      window.removeEventListener('edupasi:open-toc', handleOpenToc);
    };
  }, []);

  return (
    <>
      <EduPasiTocModal isOpen={tocOpen} onClose={() => setTocOpen(false)} />
      <BrowserOnly>
        {() => {
          const EduPasiAccessibility =
            require('@site/src/components/EduPasiAccessibility/SectionAccessibility').default;
          return <EduPasiAccessibility />;
        }}
      </BrowserOnly>
      {/* Butoanele de explicație audio se montează pe headinguri doar în client:
          au nevoie de DOM-ul randat complet, cu KaTeX deja desenat. */}
      <BrowserOnly>
        {() => {
          const SectionVoice = require('@site/src/components/SectionVoice').default;
          return <SectionVoice />;
        }}
      </BrowserOnly>
      {/* Rigla urmărește cursorul, deci nu are ce căuta pe server. */}
      <BrowserOnly>
        {() => {
          const ReadingRuler =
            require('@site/src/components/EduPasiAccessibility/ReadingRuler').default;
          return <ReadingRuler />;
        }}
      </BrowserOnly>
    </>
  );
}

function NormalLessonNavbarIndicator() {
  const [targetEl, setTargetEl] = useState(null);
  const [lessonTitle, setLessonTitle] = useState('');

  useEffect(() => {
    const brand = document.querySelector('.navbar__brand');
    if (!brand) return undefined;

    let container = document.getElementById('normal-lesson-navbar-indicator-root');
    if (!container || container.parentNode !== brand) {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
      container = document.createElement('div');
      container.id = 'normal-lesson-navbar-indicator-root';
      brand.appendChild(container);
    }
    setTargetEl(container);

    const updateTitle = () => {
      const h1 = document.querySelector('article h1, .markdown h1, h1');
      const raw = (h1?.textContent || document.title || '').trim();
      const title = raw.replace(/\s*\|.*/, '').replace(/^EduMat58\s*[-–—:]\s*/i, '').trim();
      setLessonTitle(title);
    };

    updateTitle();
    const timer = setTimeout(updateTitle, 150);
    const observer = new MutationObserver(updateTitle);
    const main = document.querySelector('main') || document.body;
    observer.observe(main, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, []);

  if (!targetEl || !lessonTitle) return null;

  return ReactDOM.createPortal(
    <div className="normalLessonNavbarIndicator" aria-live="polite" title={`Lecția curentă: ${lessonTitle}`}>
      <span>Lecția curentă</span>
      <strong>{lessonTitle}</strong>
    </div>,
    targetEl
  );
}

export default function DocRootLayout({ children }) {
  const sidebar = useDocsSidebar();
  const { pathname } = useLocation();
  const edupasiDocsRoot = useBaseUrl('/docs/edupasi');
  const isEduPasi =
    sidebar?.name === 'edupasiSidebar'
    || cleanPath(pathname) === cleanPath(edupasiDocsRoot)
    || cleanPath(pathname).startsWith(`${cleanPath(edupasiDocsRoot)}/`)
    || cleanPath(pathname) === '/edupasi'
    || cleanPath(pathname).startsWith('/edupasi/');

  /**
   * Înălțimea REALĂ a barei de navigație, măsurată, nu presupusă.
   *
   * Bara de context EduPAȘI e `position: fixed` și se așeza sub `--ifm-navbar-height`.
   * Pe mobil navbarul e mai scund decât variabila, deci rămânea o dungă albă
   * între ele. Un număr fix ar fi rezolvat exact captura de ecran de azi și s-ar
   * fi stricat la prima schimbare: navbarul își schimbă înălțimea și când elevul
   * mărește textul din panoul de accesibilitate — adică fix la setarea care
   * trebuie să funcționeze impecabil.
   */
  useEffect(() => {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return undefined;
    const masoara = () => {
      /**
       * Se măsoară MARGINEA DE JOS, nu înălțimea.
       *
       * Sunt lucruri diferite de îndată ce bara are un decalaj propriu, o
       * margine sau o linie de separare: înălțimea spune cât de groasă e bara,
       * dar nu unde se termină ea pe ecran. Prima variantă folosea înălțimea,
       * iar bara de context ajungea să plutească sub navbar exact cu diferența
       * dintre cele două.
       *
       * Pagina nu e derulată în momentul măsurării (bara e fixă, deci `bottom`
       * e stabil), iar valoarea se recalculează la orice redimensionare.
       */
      const jos = Math.round(navbar.getBoundingClientRect().bottom);
      if (jos > 0) {
        document.documentElement.style.setProperty('--edupasi-navbar-real', `${jos}px`);
      }
    };
    masoara();
    const observer = new ResizeObserver(masoara);
    observer.observe(navbar);
    window.addEventListener('resize', masoara);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', masoara);
    };
  }, []);

  useEffect(() => {
    if (isEduPasi) {
      document.documentElement.setAttribute('data-edupasi-page', 'true');
    } else {
      document.documentElement.removeAttribute('data-edupasi-page');
    }
    return () => {
      document.documentElement.removeAttribute('data-edupasi-page');
    };
  }, [isEduPasi]);

  if (!isEduPasi) {
    return (
      <>
        <NormalLessonNavbarIndicator />
        <OriginalDocRootLayout>{children}</OriginalDocRootLayout>
        <EduPasiAccessibilityTools />
      </>
    );
  }

  return (
    <div className={shellStyles.edupasiShell}>
      <EduPasiContextBar items={sidebar?.items || []} />
      <div className={shellStyles.learningWorkspace}>
        <EduPasiLearningNavigator items={sidebar?.items || []} />
        <div
          id="edupasi-lesson-content"
          className={shellStyles.lessonCanvas}
          tabIndex="-1"
        >
          <OriginalDocRootLayout>{children}</OriginalDocRootLayout>
        </div>
      </div>
      <EduPasiAccessibilityTools />
    </div>
  );
}
