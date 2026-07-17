import React from 'react';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import styles from './styles.module.css';

/**
 * Bara permanentă de navigare între lecții — mecanica din educode: Înapoi ·
 * Cuprins · Înainte, fixată jos, mereu la îndemână. Respectă logica hideUI
 * (modul de proiecție al platformei): când hideUI e activ, bara dispare,
 * exact ca restul cromului.
 */

interface PageRef {
  title: string;
  permalink: string;
}

interface LessonBarProps {
  prev?: PageRef | null;
  next?: PageRef | null;
}

/** Cuprinsul cursului curent, derivat din URL (maparea istorică a platformei). */
function courseIndexFor(pathname: string): { label: string; href: string } | null {
  const m = pathname.match(/\/docs\/c([5-8])(\/|$)/);
  if (!m) return null;
  const roman: Record<string, string> = { '5': 'curs-v', '6': 'curs-vi', '7': 'curs-vii', '8': 'curs-viii' };
  return { label: 'Cuprins', href: `/curs/docs/category/${roman[m[1]]}` };
}

export default function LessonBar({ prev, next }: LessonBarProps) {
  const location = useLocation();
  const [hideUI, setHideUI] = React.useState(() =>
    ExecutionEnvironment.canUseDOM ? localStorage.getItem('hideUI') === 'true' : false
  );
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const sync = () => setHideUI(localStorage.getItem('hideUI') === 'true');
    window.addEventListener('storage', sync);
    window.addEventListener('uiToggle', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('uiToggle', sync);
    };
  }, []);

  if (!mounted || hideUI) return null;

  const cuprins = courseIndexFor(location.pathname);

  return (
    <nav className={styles.bar} aria-label="Navigare între lecții">
      <div className={styles.inner}>
        {prev ? (
          <Link className={styles.navBtn} to={prev.permalink} aria-label={`Lecția anterioară: ${prev.title}`}>
            <span aria-hidden className={styles.arrow}>←</span>
            <span className={styles.btnTitle}>{prev.title}</span>
            <span className={styles.btnShort}>Înapoi</span>
          </Link>
        ) : (
          <span className={`${styles.navBtn} ${styles.disabled}`} aria-hidden>
            <span className={styles.arrow}>←</span>
            <span className={styles.btnTitle}>Prima lecție</span>
            <span className={styles.btnShort}>Înapoi</span>
          </span>
        )}

        {cuprins ? (
          <Link className={styles.cuprinsBtn} to={cuprins.href}>
            <span aria-hidden className={styles.layersIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </span>
            <span>Cuprins</span>
          </Link>
        ) : null}

        {next ? (
          <Link
            className={`${styles.navBtn} ${styles.navRight}`}
            to={next.permalink}
            aria-label={`Lecția următoare: ${next.title}`}
          >
            <span className={styles.btnTitle}>{next.title}</span>
            <span className={styles.btnShort}>Înainte</span>
            <span aria-hidden className={styles.arrow}>→</span>
          </Link>
        ) : (
          <span className={`${styles.navBtn} ${styles.navRight} ${styles.disabled}`} aria-hidden>
            <span className={styles.btnTitle}>Ultima lecție</span>
            <span className={styles.btnShort}>Înainte</span>
            <span className={styles.arrow}>→</span>
          </span>
        )}
      </div>
    </nav>
  );
}
