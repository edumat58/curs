import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

const DEFAULT_PREFERENCES = {
  palette: 'standard',
  easyText: false,
  focus: false,
  motion: 'full',
  font: 'implicit',
  textSize: 'normal',
  spacing: 'normal',
};

/**
 * Setările de tipografie, în ordinea în care chiar ajută.
 *
 * SPAȚIEREA e prima dinadins. Efectul ei asupra citirii la copiii cu dislexie
 * e demonstrat experimental (Zorzi et al., PNAS 2012): mărirea distanței dintre
 * litere îmbunătățește viteza și acuratețea imediat, fără antrenament. Fonturile
 * „pentru dislexie" nu au acest sprijin — studiile controlate arată că elevii
 * citesc la fel sau chiar puțin mai încet cu OpenDyslexic decât cu Arial. De
 * aceea fontul e o preferință oferită, nu o promisiune, iar ordinea din panou
 * spune elevului ce să încerce întâi.
 *
 * Familiile se cer prin `local()`: nu descărcăm nimic, deci pagina rămâne la fel
 * de rapidă și offline. Dacă fontul e instalat pe dispozitiv, se folosește;
 * dacă nu, se cade elegant pe stiva de sistem, fără text invizibil.
 */
const TIPOGRAFIE = [
  {
    cheie: 'spacing',
    titlu: 'Spațierea literelor și a rândurilor',
    nota: 'Cea mai eficientă setare pentru citit. Începe cu ea.',
    optiuni: [
      ['normal', 'Normală'],
      ['aerisit', 'Aerisită'],
      ['foarte-aerisit', 'Foarte aerisită'],
    ],
  },
  {
    cheie: 'textSize',
    titlu: 'Mărimea textului',
    optiuni: [
      ['normal', 'Normal'],
      ['mare', 'Mare'],
      ['foarte-mare', 'Foarte mare'],
    ],
  },
  {
    cheie: 'font',
    titlu: 'Forma literelor',
    nota: 'Alege ce ți se pare ție mai comod — nu există un font care ajută pe toată lumea.',
    optiuni: [
      ['implicit', 'Implicit'],
      ['lizibil', 'Litere clare'],
      ['dislexie', 'Pentru dislexie'],
      ['serif', 'Cu piciorușe'],
    ],
  },
];

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
  root.setAttribute('data-edupasi-font', prefs.font || 'implicit');
  root.setAttribute('data-edupasi-text-size', prefs.textSize || 'normal');
  root.setAttribute('data-edupasi-spacing', prefs.spacing || 'normal');

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
            {TIPOGRAFIE.map((grup) => (
              <div className={styles.section} key={grup.cheie}>
                <h3>{grup.titlu}</h3>
                {grup.nota && <p className={styles.sectionNote}>{grup.nota}</p>}
                <div className={styles.choices}>
                  {grup.optiuni.map(([valoare, eticheta]) => (
                    <button
                      type="button"
                      key={valoare}
                      className={
                        preferences[grup.cheie] === valoare ? styles.choiceActive : styles.choice
                      }
                      onClick={() => updatePreference(grup.cheie, valoare)}
                    >
                      {eticheta}
                    </button>
                  ))}
                </div>
              </div>
            ))}

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
