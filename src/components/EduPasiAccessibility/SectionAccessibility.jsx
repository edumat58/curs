import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

const DEFAULT_PREFERENCES = {
  palette: 'standard',
  easyText: false,
  focus: false,
  motion: 'full',
};

function readPreferences() {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem('edupasi-accessibility-v1');
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function applyPreferencesToDom(prefs) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (prefs.palette && prefs.palette !== 'standard') {
    root.setAttribute('data-edupasi-palette', prefs.palette);
  } else {
    root.removeAttribute('data-edupasi-palette');
  }

  root.setAttribute('data-edupasi-easy-text', String(prefs.easyText));
  root.setAttribute('data-edupasi-focus', String(prefs.focus));
  root.setAttribute('data-edupasi-motion', prefs.motion || 'full');

  try {
    localStorage.setItem('edupasi-accessibility-v1', JSON.stringify(prefs));
  } catch {
    // Ignore storage quota errors
  }
}

function EduPasiVisualAccessibility(props, ref) {
  const [preferences, setPreferences] = React.useState(DEFAULT_PREFERENCES);
  const [open, setOpen] = React.useState(false);
  const panelRef = React.useRef(null);

  React.useEffect(() => {
    const loaded = readPreferences();
    setPreferences(loaded);
    applyPreferencesToDom(loaded);

    const handleOpen = () => setOpen(true);
    window.addEventListener('edupasi:open-accessibility', handleOpen);
    return () => window.removeEventListener('edupasi:open-accessibility', handleOpen);
  }, []);

  const updatePreference = React.useCallback((key, value) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: value };
      applyPreferencesToDom(next);
      return next;
    });
  }, []);

  const resetPreferences = React.useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    applyPreferencesToDom(DEFAULT_PREFERENCES);
  }, []);

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label="Deschide panoul de accesibilitate vizuală"
      >
        <span className={styles.triggerMark}>Aa</span>
        <span>Accesibilitate</span>
      </button>

      {open && (
        <div className={styles.panel} ref={panelRef} role="dialog" aria-label="Opțiuni accesibilitate vizuală">
          <div className={styles.header}>
            <div>
              <p>EduPAȘI Vizual</p>
              <h2>Accesibilitate & Lizibilitate</h2>
            </div>
            <button
              type="button"
              className={styles.close}
              onClick={() => setOpen(false)}
              aria-label="Închide panoul"
            >
              ×
            </button>
          </div>

          <div className={styles.body}>
            <div className={styles.section}>
              <h3>Paletă culori & Contrast</h3>
              <div className={styles.choices}>
                <button
                  type="button"
                  className={preferences.palette === 'standard' ? styles.choiceActive : styles.choice}
                  onClick={() => updatePreference('palette', 'standard')}
                >
                  Standard
                </button>
                <button
                  type="button"
                  className={preferences.palette === 'safe' ? styles.choiceActive : styles.choice}
                  onClick={() => updatePreference('palette', 'safe')}
                >
                  Culori calmante
                </button>
                <button
                  type="button"
                  className={preferences.palette === 'contrast' ? styles.choiceActive : styles.choice}
                  onClick={() => updatePreference('palette', 'contrast')}
                >
                  Contrast înalt
                </button>
              </div>
            </div>

            <div className={styles.section}>
              <h3>Text ușor de urmărit</h3>
              <div className={styles.choices}>
                <button
                  type="button"
                  className={!preferences.easyText ? styles.choiceActive : styles.choice}
                  onClick={() => updatePreference('easyText', false)}
                >
                  Oprit
                </button>
                <button
                  type="button"
                  className={preferences.easyText ? styles.choiceActive : styles.choice}
                  onClick={() => updatePreference('easyText', true)}
                >
                  Pornit
                </button>
              </div>
            </div>

            <div className={styles.section}>
              <h3>Mod de concentrare (Focus)</h3>
              <div className={styles.choices}>
                <button
                  type="button"
                  className={!preferences.focus ? styles.choiceActive : styles.choice}
                  onClick={() => updatePreference('focus', false)}
                >
                  Oprit
                </button>
                <button
                  type="button"
                  className={preferences.focus ? styles.choiceActive : styles.choice}
                  onClick={() => updatePreference('focus', true)}
                >
                  Pornit
                </button>
              </div>
            </div>

            <div className={styles.section}>
              <h3>Animații & Mișcare</h3>
              <div className={styles.choices}>
                <button
                  type="button"
                  className={preferences.motion === 'full' ? styles.choiceActive : styles.choice}
                  onClick={() => updatePreference('motion', 'full')}
                >
                  Animații normale
                </button>
                <button
                  type="button"
                  className={preferences.motion === 'reduced' ? styles.choiceActive : styles.choice}
                  onClick={() => updatePreference('motion', 'reduced')}
                >
                  Mișcare redusă
                </button>
              </div>
            </div>

            <div className={styles.section}>
              <button
                type="button"
                className={styles.reset}
                onClick={resetPreferences}
              >
                Resetează toate preferințele vizuale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.forwardRef(EduPasiVisualAccessibility);
