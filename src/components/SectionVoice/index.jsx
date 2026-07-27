import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { collectLessonSections } from '@site/src/components/EduPasiAccessibility/lessonSections.mjs';
import { canonicalSection, sectionHash } from '@site/src/lib/voice/canonical.mjs';
import { latexToRomanian } from '@site/src/components/EduPasiAccessibility/speech.mjs';
import AudioPlayer from './AudioPlayer';
import styles from './styles.module.css';

const PROMPT_VERSION = 1;

function serviceUrl() {
  if (typeof window === 'undefined') return '';
  const configured = window.EDUPASI_VOICE_API;
  if (configured) return String(configured).replace(/\/$/, '');
  if (/^(localhost|127\.)/.test(window.location.hostname)) return 'http://localhost:8099';
  return 'https://voice.kulturosfera.com';
}

/**
 * Un buton pe secțiune. Ține starea proprie: inactiv → se pregătește → player.
 * Nu blochează pagina și nu deschide modale: elevul rămâne în lecție.
 */
function SectionButton({ section, route }) {
  const [state, setState] = useState('idle'); // idle | loading | ready | error
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');
  const abortRef = useRef(null);

  useEffect(() => () => abortRef.current && abortRef.current.abort(), []);

  const request = useCallback(async () => {
    if (state === 'loading') return;
    if (state === 'ready') {
      setState('idle');
      return;
    }
    setState('loading');
    setMessage('Pregătesc explicația…');

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
      const res = await fetch(`${serviceUrl()}/voice/section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionHash: hash,
          route,
          sectionId: section.id,
          section: { ...payload, canonical: canonicalSection(section) },
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`Serviciul a răspuns ${res.status}`);
      const json = await res.json();
      if (!json.audioUrl) throw new Error('Nu am primit audio.');
      setData(json);
      setState('ready');
    } catch (err) {
      if (err.name === 'AbortError') return;
      setState('error');
      setMessage(
        'Explicația audio nu e disponibilă acum. Încearcă din nou în câteva momente.'
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

      {state === 'loading' && <span className={styles.status}>{message}</span>}
      {state === 'error' && (
        <span className={styles.statusError} role="status">
          {message}
        </span>
      )}
      {state === 'ready' && data && (
        <AudioPlayer src={data.audioUrl} autoPlay onClose={() => setState('idle')} />
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
      heading.appendChild(slot);
      created.push({ section, slot });
    }
    setMounts(created);

    return () => {
      created.forEach(({ slot }) => slot.remove());
      setMounts([]);
    };
  }, [route]);

  return (
    <>
      {mounts.map(({ section, slot }) =>
        createPortal(<SectionButton section={section} route={route} />, slot, section.id)
      )}
    </>
  );
}
