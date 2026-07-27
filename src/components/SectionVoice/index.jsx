import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { collectLessonSections } from '@site/src/components/EduPasiAccessibility/lessonSections.mjs';
import { canonicalSection, sectionHash } from '@site/src/lib/voice/canonical.mjs';
import { latexToRomanian } from '@site/src/components/EduPasiAccessibility/speech.mjs';
import AudioPlayer from './AudioPlayer';
import styles from './styles.module.css';

/** Trebuie să coincidă cu PROMPT_VERSION din serviciu: intră în hash-ul secțiunii. */
const PROMPT_VERSION = 2;

/**
 * Adresa serviciului de voce.
 *
 * Implicit rulează pe NAS-ul propriu (Synology, container Docker, pornit non-stop),
 * expus prin reverse proxy DSM cu certificat wildcard. Se poate suprascrie oricând
 * din `window.EDUPASI_VOICE_API`, fără recompilare.
 */
const DEFAULT_VOICE_API = 'https://voce.asbrihome.synology.me';

function serviceUrl() {
  if (typeof window === 'undefined') return '';
  // Și în dezvoltare lovim tot NAS-ul: are repornire automată, iar CORS-ul
  // permite explicit localhost. Altfel, testând din localhost, ajungeai la un
  // serviciu local care putea să nici nu ruleze — sau, mai rău, care murise.
  // Pentru lucru offline pe serviciu, se pune window.EDUPASI_VOICE_API.
  const configured = window.EDUPASI_VOICE_API;
  if (configured) return String(configured).replace(/\/$/, '');
  return DEFAULT_VOICE_API;
}

/**
 * Prima generare durează zeci de secunde: se citește secțiunea, se scrie
 * explicația, apoi se rostește. Un singur mesaj fix pe tot intervalul arată ca
 * o pagină blocată. Etapele de mai jos nu sunt măsurători reale de la server —
 * sunt repere de timp — dar spun elevului că ceva se întâmplă și cam ce anume.
 */
const ETAPE = [
  { after: 0, text: 'Citesc secțiunea…' },
  { after: 6000, text: 'Pregătesc explicația…' },
  { after: 20000, text: 'Înregistrez vocea…' },
  { after: 90000, text: 'Secțiunea e lungă — o explic în întregime…' },
];

/**
 * Așteaptă terminarea unei generări pornite pe server.
 *
 * Serverul răspunde imediat cu 202 și lucrează mai departe, pentru că o
 * explicație completă pentru o secțiune mare poate dura minute, iar reverse
 * proxy-ul din fața lui închide conexiunile la 180 de secunde. Aici doar
 * întrebăm periodic dacă e gata — fără limită de timp impusă de rețea.
 */
async function waitForReady(hash, signal) {
  const started = Date.now();
  const LIMITA_MS = 15 * 60 * 1000;

  while (Date.now() - started < LIMITA_MS) {
    await new Promise((r) => setTimeout(r, 3000));
    if (signal.aborted) throw Object.assign(new Error('anulat'), { name: 'AbortError' });

    const res = await fetch(`${serviceUrl()}/voice/section/${hash}`, { signal });
    if (res.status === 202) continue;
    if (res.status === 429) throw new Error('rate');
    if (res.ok) return res.json();

    // 404 înseamnă că rezervarea a dispărut (repornire de serviciu); orice
    // altceva e o eroare reală de generare. În ambele cazuri, oprire.
    throw new Error(res.status === 404 ? 'reluare' : `Serviciul a răspuns ${res.status}`);
  }
  throw new Error('Generarea durează neobișnuit de mult.');
}

function useProgressMessage(active) {
  const [text, setText] = useState(ETAPE[0].text);
  useEffect(() => {
    if (!active) return undefined;
    setText(ETAPE[0].text);
    const timers = ETAPE.slice(1).map((etapa) =>
      setTimeout(() => setText(etapa.text), etapa.after)
    );
    return () => timers.forEach(clearTimeout);
  }, [active]);
  return text;
}

/**
 * Un buton pe secțiune. Ține starea proprie: inactiv → se pregătește → player.
 * Nu blochează pagina și nu deschide modale: elevul rămâne în lecție.
 */
function SectionButton({ section, route, headingElement }) {
  const [state, setState] = useState('idle'); // idle | loading | ready | error
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [panel, setPanel] = useState(null);
  const panelRef = useRef(null);
  const abortRef = useRef(null);
  const progress = useProgressMessage(state === 'loading');

  useEffect(() => () => abortRef.current && abortRef.current.abort(), []);

  /**
   * Panoul (mesaj de așteptare + player) trăiește ÎN AFARA headingului, ca frate
   * imediat următor. În heading moștenea corpul de literă al titlului, se lipea
   * de text și se suprapunea peste ancora „#". Îl creăm doar când chiar e nevoie,
   * ca să nu stricăm selectorii CSS de tip „titlu urmat de paragraf" pe tot site-ul.
   */
  const needsPanel = state !== 'idle';
  useEffect(() => {
    if (!needsPanel || !headingElement) {
      if (panelRef.current) {
        panelRef.current.remove();
        panelRef.current = null;
        setPanel(null);
      }
      return;
    }
    if (panelRef.current) return;
    const el = document.createElement('div');
    el.setAttribute('data-edupasi-voice-panel', '');
    el.className = styles.panel;
    headingElement.insertAdjacentElement('afterend', el);
    panelRef.current = el;
    setPanel(el);
  }, [needsPanel, headingElement]);

  useEffect(
    () => () => {
      if (panelRef.current) panelRef.current.remove();
    },
    []
  );

  const request = useCallback(async () => {
    if (state === 'loading') return;
    if (state === 'ready') {
      setState('idle');
      return;
    }
    setState('loading');
    setError('');

    try {
      // Formulele se rostesc determinist, nu le „citește" modelul caracter cu caracter.
      const latex = (section.latex || []).map((item) => ({
        source: item.source,
        display: item.display,
        spoken: (() => {
          try {
            return latexToRomanian(item.source);
          } catch {
            return '';
          }
        })(),
      }));

      const payload = {
        heading: section.heading,
        level: section.level,
        contentText: section.contentText,
        latex,
        visuals: (section.visuals || []).map((v) =>
          v.type === 'image'
            ? { type: 'image', src: v.src, alt: v.alt, label: v.label }
            : {
                type: 'svg',
                label: v.label,
                description: v.description,
                markup: String(v.markup || '').slice(0, 4000),
              }
        ),
        context: section.context,
        lessonTitle: document.querySelector('h1')?.textContent?.trim() || '',
      };

      const hash = await sectionHash(section, PROMPT_VERSION);
      abortRef.current = new AbortController();
      const body = JSON.stringify({
        sectionHash: hash,
        route,
        sectionId: section.id,
        section: { ...payload, canonical: canonicalSection(section) },
      });
      const res = await fetch(`${serviceUrl()}/voice/section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: abortRef.current.signal,
      });

      // 200 = era deja în cache. 202 = a pornit generarea; durata ei nu mai
      // trece printr-o conexiune deschisă, deci întrebăm din când în când.
      let json = res.ok ? await res.json() : null;
      if (res.status === 202) {
        json = await waitForReady(hash, abortRef.current.signal);
      } else if (!res.ok) {
        throw new Error(`Serviciul a răspuns ${res.status}`);
      }

      if (!json || !json.audioUrl) throw new Error('Nu am primit audio.');
      setData(json);
      setState('ready');
    } catch (err) {
      if (err.name === 'AbortError') return;
      setState('error');
      setError(
        err.message === 'rate'
          ? 'Prea multe explicații cerute odată. Așteaptă un minut și apasă din nou.'
          : err.message === 'reluare'
            ? 'Pregătirea a fost întreruptă. Apasă din nou ca să reia.'
            : 'Nu am putut pregăti explicația. Apasă din nou pentru a reîncerca.'
      );
    }
  }, [section, route, state]);

  return (
    <>
      <button
        type="button"
        className={
          state === 'ready' ? styles.speakerOn : state === 'loading' ? styles.speakerBusy : styles.speaker
        }
        onClick={request}
        aria-label={
          state === 'ready'
            ? `Ascunde explicația audio pentru „${section.heading}"`
            : `Ascultă explicația pentru „${section.heading}"`
        }
        aria-expanded={state === 'ready'}
        title="Ascultă explicația"
        data-edupasi-speak-button=""
      >
        {state === 'loading' ? (
          <span className={styles.spinner} aria-hidden="true" />
        ) : (
          <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
            <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
            {state === 'ready' && (
              <path
                d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8 8 0 0 1 0 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            )}
          </svg>
        )}
      </button>

      {panel
        && createPortal(
          <>
            {state === 'loading' && (
              <div className={styles.waiting} role="status">
                <span className={styles.spinner} aria-hidden="true" />
                <span className={styles.waitingText}>
                  {progress}
                  <span className={styles.waitingHint}>
                    Prima dată se pregătește de la zero. Apoi pornește instant.
                  </span>
                </span>
              </div>
            )}

            {state === 'error' && (
              <div className={styles.failure} role="status">
                <span className={styles.failureText}>{error}</span>
                <button type="button" className={styles.retry} onClick={request}>
                  Încearcă din nou
                </button>
              </div>
            )}

            {state === 'ready' && data && (
              <AudioPlayer
                src={data.audioUrl}
                knownDuration={Number(data.durationSec) || 0}
                autoPlay
                onClose={() => setState('idle')}
              />
            )}
          </>,
          panel
        )}
    </>
  );
}

/**
 * Montează câte un buton lângă fiecare heading al lecției.
 *
 * Folosim portaluri în loc să rescriem DOM-ul lecției: conținutul randat de
 * Docusaurus rămâne neatins, iar butoanele dispar curat la demontare.
 */
export default function SectionVoice() {
  const [mounts, setMounts] = useState([]);
  const route = typeof window !== 'undefined' ? window.location.pathname : '';

  useEffect(() => {
    const root = document.querySelector('.theme-doc-markdown') || document.querySelector('article');
    if (!root) return undefined;

    const sections = collectLessonSections(root).filter(
      (s) =>
        (s.contentText && s.contentText.length > 40)
        || s.latex.length > 0
        || s.visuals.length > 0
    );

    const created = [];
    for (const section of sections) {
      const heading = section.headingElement;
      if (!heading || heading.querySelector('[data-edupasi-voice-slot]')) continue;
      const slot = document.createElement('span');
      slot.setAttribute('data-edupasi-voice-slot', '');
      slot.className = styles.slot;
      // Înaintea ancorei „#" a Docusaurus: altfel, la hover, ancora apare între
      // titlu și buton și împinge butonul din loc chiar când elevul îl țintește.
      const anchor = heading.querySelector('.hash-link');
      if (anchor) heading.insertBefore(slot, anchor);
      else heading.appendChild(slot);
      created.push({ section, slot, heading });
    }
    setMounts(created);

    return () => {
      created.forEach(({ slot }) => slot.remove());
      setMounts([]);
    };
  }, [route]);

  return (
    <>
      {mounts.map(({ section, slot, heading }) =>
        createPortal(
          <SectionButton section={section} route={route} headingElement={heading} />,
          slot,
          section.id
        )
      )}
    </>
  );
}
