import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { collectLessonSections } from '@site/src/components/EduPasiAccessibility/lessonSections.mjs';
import { canonicalSection, sectionHash } from '@site/src/lib/voice/canonical.mjs';
import {
  asculta as ascultaDisponibilitate,
  pornesteSupravegherea,
  raporteazaCadere,
  raporteazaReusita,
  stareCurenta,
} from '@site/src/lib/voice/availability.mjs';
import { latexToRomanian } from '@site/src/components/EduPasiAccessibility/speech.mjs';
import { sursaPentru } from '@site/src/lib/voice/sursa.mjs';
import AudioPlayer from './AudioPlayer';
import styles from './styles.module.css';

/** Trebuie să coincidă cu PROMPT_VERSION din serviciu: intră în hash-ul secțiunii. */
const PROMPT_VERSION = 6;

/**
 * Ce e o lecție și ce nu.
 *
 * Butoanele de explicație au sens doar pe lecții. În `docs/` mai stau pagini de
 * automatisme, centralizatoare, organigrame și pagini-hub — toate cu titlu și
 * secțiuni, deci toate ar primi butoane fără să fie nimic de predat acolo.
 * Semnul distinctiv, respectat de toate lecțiile platformei, e titlul: „C1 - …",
 * „C6.1 - …". Automatismele încep cu „A5.1", hub-urile cu altceva.
 */
const TITLU_DE_LECTIE = /^\s*C\s*\d/;

function esteLectie(root) {
  const h1 = root && root.querySelector('h1');
  return Boolean(h1 && TITLU_DE_LECTIE.test(h1.textContent || ''));
}

/**
 * Adresa serviciului de voce.
 *
 * Se poate suprascrie oricând din `window.EDUPASI_VOICE_API`, fără recompilare.
 */
const DEFAULT_VOICE_API = 'https://voce.asbrihome.synology.me';

function serviceUrl() {
  if (typeof window === 'undefined') return '';
  const configured = window.EDUPASI_VOICE_API;
  if (configured) return String(configured).replace(/\/$/, '');
  return DEFAULT_VOICE_API;
}

/**
 * Bara de progres a generării.
 *
 * Fiecare etapă are o poziție până la care are dreptul să ajungă și un timp
 * caracteristic. Înăuntrul etapei bara se apropie asimptotic de capătul ei —
 * deci înaintează mereu, dar încetinește dacă durează mai mult decât de obicei,
 * și nu ajunge niciodată în capăt înainte ca serverul să confirme etapa
 * următoare. Nu poate nici să mintă că e gata, nici să pară blocată.
 *
 * Etapa de sinteză nu are timp fix: e proporțională cu lungimea explicației, pe
 * care serverul o estimează din material și o trimite în `expectedSpeechSec`.
 * O definiție scurtă și o lecție întreagă nu pot împărți aceeași scală.
 *
 * Ponderile vin din măsurători pe serviciul real, nu din intuiție. Groq scrie
 * explicația în două-trei secunde; rostirea ei durează zeci. Prima variantă
 * dădea etapelor de model aproape jumătate din bară, iar aceea se umplea
 * instantaneu și apoi se târa — adică exact impresia de blocaj pe care bara ar
 * trebui să o evite.
 */
const ETAPE = {
  analiza: { pana: 0.1, tau: 2.5 },
  naratiune: { pana: 0.22, tau: 3 },
  reparare: { pana: 0.3, tau: 4 },
  sinteza: { pana: 0.95, tau: null },
  audio: { pana: 0.99, tau: 2 },
};
const ORDINE = ['analiza', 'naratiune', 'reparare', 'sinteza', 'audio'];

function fractieEtapa(stage, secundeInEtapa, expectedSpeechSec) {
  const index = ORDINE.indexOf(stage);
  if (index < 0) return 0;
  const etapa = ETAPE[stage];
  const start = index > 0 ? ETAPE[ORDINE[index - 1]].pana : 0;
  /**
   * Sinteza e singura etapă a cărei durată depinde de lungimea explicației:
   * măsurat pe PC, aproape un sfert din durata audio-ului rezultat. Constanta
   * de timp e aleasă ca bara să fie pe la patru cincimi când sinteza se termină
   * de obicei — dacă mașina e mai lentă, bara doar înaintează mai încet, ceea ce
   * e comportamentul corect, nu o eroare.
   */
  const tau = etapa.tau ?? Math.min(90, Math.max(4, (expectedSpeechSec || 40) * 0.18));
  return start + (etapa.pana - start) * (1 - Math.exp(-Math.max(0, secundeInEtapa) / tau));
}

/**
 * Așteaptă terminarea unei generări pornite pe server.
 *
 * Serverul răspunde imediat cu 202 și lucrează mai departe, pentru că o
 * explicație completă poate dura minute, iar reverse proxy-ul din fața lui
 * închide conexiunile la 180 de secunde. Aici doar întrebăm periodic dacă e
 * gata — fără limită de timp impusă de rețea.
 */
async function waitForReady(hash, signal, onStatus) {
  const started = Date.now();
  const LIMITA_MS = 20 * 60 * 1000;

  while (Date.now() - started < LIMITA_MS) {
    await new Promise((r) => setTimeout(r, 3000));
    if (signal.aborted) throw Object.assign(new Error('anulat'), { name: 'AbortError' });

    const res = await fetch(`${serviceUrl()}/voice/section/${hash}`, { signal });
    if (res.status === 202) {
      if (onStatus) onStatus(await res.json().catch(() => null));
      continue;
    }
    if (res.status === 429) throw new Error('rate');
    if (res.ok) return res.json();

    // 404 înseamnă că rezervarea a dispărut (repornire de serviciu); orice
    // altceva e o eroare reală de generare. În ambele cazuri, oprire.
    const detaliu = await res.json().catch(() => null);
    const err = new Error(res.status === 404 ? 'reluare' : `Serviciul a răspuns ${res.status}`);
    // Serverul spune explicit dacă a picat GENERAREA, nu serviciul.
    if (detaliu && detaliu.code === 'generation_failed') err.generare = true;
    throw err;
  }
  throw new Error('Generarea durează neobișnuit de mult.');
}

/**
 * Fracția de umplere a barei, actualizată local între interogări.
 *
 * Serverul e întrebat o dată la trei secunde; dacă bara ar aștepta răspunsul,
 * ar înainta în salturi și ar părea înțepenită între ele. Aici ținem local
 * momentul în care am văzut prima dată etapa curentă și recalculăm de zece ori
 * pe secundă. Nu dăm niciodată înapoi: o etapă care se termină mai repede
 * decât media ar face bara să sară în urmă, ceea ce arată a defecțiune.
 */
function useProgress(active, status) {
  const [fractie, setFractie] = useState(0);
  const reper = useRef({ stage: null, la: 0 });

  useEffect(() => {
    if (!active) {
      setFractie(0);
      reper.current = { stage: null, la: 0 };
    }
  }, [active]);

  useEffect(() => {
    // Prima interogare vine abia după trei secunde. Fără reperul ăsta, bara ar
    // sta goală exact în secundele în care elevul se uită cel mai atent la ea.
    if (active && !reper.current.stage) {
      reper.current = { stage: 'analiza', la: Date.now() };
    }
    if (!active || !status || !status.stage) return;
    if (reper.current.stage !== status.stage) {
      reper.current = { stage: status.stage, la: Date.now() - (status.stageSec || 0) * 1000 };
    }
  }, [active, status]);

  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => {
      const { stage, la } = reper.current;
      if (!stage) return;
      const secunde = (Date.now() - la) / 1000;
      const tinta = fractieEtapa(stage, secunde, status && status.expectedSpeechSec);
      setFractie((anterior) => Math.max(anterior, tinta));
    }, 100);
    return () => clearInterval(id);
  }, [active, status]);

  return fractie;
}

/**
 * O cădere de rețea sau un 5xx înseamnă că serviciul e jos, nu că explicația
 * asta anume e imposibilă. Distincția contează: prima situație stinge butoanele
 * pe tot site-ul, a doua doar arată o eroare aici.
 */
function pareCadereDeServiciu(err) {
  if (!err) return false;
  if (err.message === 'rate') return false;
  // O generare eșuată NU e o cădere de serviciu. Serverul răspunde tot 502 când
  // modelul refuză cererea, iar confundându-le, clientul nici nu arăta eroarea,
  // nici nu oprea bara: rămânea înghețată la prima etapă, fără nicio explicație.
  if (err.generare) return false;
  if (err.name === 'TypeError') return true; // fetch a eșuat: rețea sau serviciu mort
  return /Serviciul a răspuns 5\d\d/.test(String(err.message));
}

/** Logica de cerere, comună butonului de secțiune și celui de lecție. */
function useExplanation(section, route, mode) {
  const [state, setState] = useState('idle'); // idle | loading | ready | error
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(null);
  const abortRef = useRef(null);
  const fractie = useProgress(state === 'loading', status);

  useEffect(() => () => abortRef.current && abortRef.current.abort(), []);

  const cere = useCallback(async () => {
    if (state === 'loading') return;
    if (state === 'ready') {
      setState('idle');
      return;
    }
    setState('loading');
    setError('');
    setStatus(null);

    const cerut = { ...section, mode };

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

      /**
       * Sursa brută a lecției — cea mai bună formă în care modelul poate primi
       * materialul. Vezi `sursa.mjs`: reconstrucția pierdea notația exactă și
       * ordinea, iar modelul umplea golurile cu interpretări proprii.
       */
      const sourceCode = await sursaPentru(
        typeof window !== 'undefined' ? window.location.origin + '/curs/' : '/curs/',
        route,
        { heading: section.heading, level: section.level, intreaga: mode === 'lectie' }
      );

      const payload = {
        mode,
        sourceCode,
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
                // Markup-ul nu mai ajunge la model: serviciul citește din el
                // geometria (puncte, segmente, unghiuri drepte) și trimite mai
                // departe doar faptele. Fiind gratuit în tokeni, limita poate
                // fi generoasă — un desen tăiat în două pierde exact laturile
                // care dau sensul figurii.
                markup: String(v.markup || '').slice(0, 12000),
              }
        ),
        context: section.context,
        lessonTitle: document.querySelector('h1')?.textContent?.trim() || '',
      };

      const hash = await sectionHash(cerut, PROMPT_VERSION);
      abortRef.current = new AbortController();
      const res = await fetch(`${serviceUrl()}/voice/section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionHash: hash,
          route,
          sectionId: section.id,
          section: { ...payload, canonical: canonicalSection(cerut) },
        }),
        signal: abortRef.current.signal,
      });

      // 200 = era deja în cache. 202 = a pornit generarea; durata ei nu mai
      // trece printr-o conexiune deschisă, deci întrebăm din când în când.
      let json = res.ok ? await res.json() : null;
      if (res.status === 202) {
        json = await waitForReady(hash, abortRef.current.signal, setStatus);
      } else if (!res.ok) {
        throw new Error(`Serviciul a răspuns ${res.status}`);
      }

      if (!json || !json.audioUrl) throw new Error('Nu am primit audio.');
      raporteazaReusita();
      setData(json);
      setState('ready');
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (pareCadereDeServiciu(err)) {
        raporteazaCadere();
        return;
      }
      setState('error');
      setError(
        err.message === 'rate'
          ? 'Prea multe explicații cerute odată. Așteaptă un minut și apasă din nou.'
          : err.message === 'reluare'
            ? 'Pregătirea a fost întreruptă. Apasă din nou ca să reia.'
            : 'Nu am putut pregăti explicația. Apasă din nou pentru a reîncerca.'
      );
    }
  }, [section, route, mode, state]);

  return { state, setState, data, error, fractie, cere };
}

/**
 * Panoul (bară + player) trăiește ÎN AFARA elementului-gazdă, ca frate imediat
 * următor. În heading moștenea corpul de literă al titlului, se lipea de text
 * și se suprapunea peste ancora „#". Îl creăm doar când chiar e nevoie, ca să
 * nu stricăm selectorii CSS de tip „titlu urmat de paragraf" pe tot site-ul.
 */
function usePanel(host, needed) {
  const [panel, setPanel] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (!needed || !host) {
      if (ref.current) {
        ref.current.remove();
        ref.current = null;
        setPanel(null);
      }
      return;
    }
    if (ref.current) return;
    const el = document.createElement('div');
    el.setAttribute('data-edupasi-voice-panel', '');
    el.className = styles.panel;
    host.insertAdjacentElement('afterend', el);
    ref.current = el;
    setPanel(el);
  }, [needed, host]);

  useEffect(() => () => { if (ref.current) ref.current.remove(); }, []);

  return panel;
}

/** Bara, eroarea și playerul — aceleași pentru orice buton. */
function Panou({ state, fractie, error, data, onRetry, onClose, headingElement, contentRoot }) {
  return (
    <>
      {/* Doar bara. Progresul se citește dintr-o privire, fără cifre și fără
          cronometru — pentru un elev care abia așteaptă explicația, un procent
          care crește încet e o presiune în plus, nu o informație. Textul rămâne
          doar pentru cititoarele de ecran, care nu au ce face cu o bară. */}
      {state === 'loading' && (
        <div className={styles.waiting}>
          <div
            className={styles.bar}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(fractie * 100)}
            aria-label="Se pregătește explicația"
          >
            {/* Lățime, nu `scaleX`: scalarea ar turti și dunga care traversează
                porțiunea umplută, cu atât mai mult cu cât bara e mai goală —
                adică exact la început. */}
            <span className={styles.barFill} style={{ width: `${fractie * 100}%` }} />
          </div>
        </div>
      )}

      {state === 'error' && (
        <div className={styles.failure} role="status">
          <span className={styles.failureText}>{error}</span>
          <button type="button" className={styles.retry} onClick={onRetry}>
            Încearcă din nou
          </button>
        </div>
      )}

      {state === 'ready' && data && (
        <AudioPlayer
          src={data.audioUrl}
          knownDuration={Number(data.durationSec) || 0}
          autoPlay
          onClose={onClose}
          onUnavailable={raporteazaCadere}
          transcript={data.explanationText || ''}
          sentences={data.sentences || null}
          headingElement={headingElement}
          contentRoot={contentRoot}
        />
      )}
    </>
  );
}

/** Butonul discret din heading: explică doar secțiunea lui. */
function SectionButton({ section, route, headingElement }) {
  const { state, setState, data, error, fractie, cere } = useExplanation(section, route, 'sectiune');
  const panel = usePanel(headingElement, state !== 'idle');

  return (
    <>
      <button
        type="button"
        className={
          state === 'ready' ? styles.speakerOn : state === 'loading' ? styles.speakerBusy : styles.speaker
        }
        onClick={cere}
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
          <Panou
            state={state}
            fractie={fractie}
            error={error}
            data={data}
            onRetry={cere}
            onClose={() => setState('idle')}
            headingElement={headingElement}
          />,
          panel
        )}
    </>
  );
}

/**
 * Butonul de deasupra titlului: lecția întreagă, predată ca la oră.
 *
 * Nu e butonul de secțiune mărit. Cere serviciului modul `lectie`, care are
 * alt prompt — cu fir narativ, tranziții între părți și recapitulare — și alt
 * buget de vorbire. Stă deasupra titlului pentru că e primul lucru pe care un
 * elev care nu știe de unde să înceapă ar trebui să îl vadă.
 */
function LessonButton({ section, route, host }) {
  const { state, setState, data, error, fractie, cere } = useExplanation(section, route, 'lectie');
  const panel = usePanel(host, state !== 'idle');

  return (
    <>
      <button
        type="button"
        className={state === 'ready' ? styles.lessonBtnOn : styles.lessonBtn}
        onClick={cere}
        aria-expanded={state === 'ready'}
        data-edupasi-speak-button=""
      >
        <span className={styles.lessonIcon} aria-hidden="true">
          {state === 'loading' ? (
            <span className={styles.spinnerLight} />
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20">
              {state === 'ready' ? (
                <>
                  <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
                  <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
                </>
              ) : (
                <path d="M7 4.5l13 7.5-13 7.5z" fill="currentColor" />
              )}
            </svg>
          )}
        </span>
        <span className={styles.lessonText}>
          <span className={styles.lessonTitle}>
            {state === 'ready' ? 'Ascunde lecția explicată' : 'Ascultă lecția explicată'}
          </span>
          <span className={styles.lessonHint}>
            Un profesor îți parcurge toată lecția, pas cu pas.
          </span>
        </span>
      </button>

      {panel
        && createPortal(
          <Panou
            state={state}
            fractie={fractie}
            error={error}
            data={data}
            onRetry={cere}
            onClose={() => setState('idle')}
            contentRoot={typeof document !== 'undefined'
              ? document.querySelector('.theme-doc-markdown') || document.querySelector('article')
              : null}
          />,
          panel
        )}
    </>
  );
}

/** Ce se vede în locul butoanelor când serviciul nu răspunde. */
function Indisponibil() {
  return (
    <div className={styles.offline} role="status">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className={styles.offlineIcon}>
        <path
          d="M12 8v5M12 16.5v.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
      <span>
        Sistemul este indisponibil temporar
        <span className={styles.offlineHint}>Explicațiile audio revin de la sine, fără să reîncarci pagina.</span>
      </span>
    </div>
  );
}

/**
 * Montează butoanele pe lecție.
 *
 * Folosim portaluri în loc să rescriem DOM-ul lecției: conținutul randat de
 * Docusaurus rămâne neatins, iar butoanele dispar curat la demontare.
 */
export default function SectionVoice() {
  const [mounts, setMounts] = useState([]);
  const [lesson, setLesson] = useState(null);
  const [disponibil, setDisponibil] = useState(stareCurenta);
  const route = typeof window !== 'undefined' ? window.location.pathname : '';

  useEffect(() => {
    setDisponibil(stareCurenta());
    const opreste = ascultaDisponibilitate(setDisponibil);
    const opresteSupravegherea = pornesteSupravegherea(serviceUrl());
    return () => {
      opreste();
      opresteSupravegherea();
    };
  }, []);

  useEffect(() => {
    const root = document.querySelector('.theme-doc-markdown') || document.querySelector('article');
    // Pe orice altceva decât o lecție nu montăm nimic — nici butoane, nici
    // mesajul de indisponibilitate. O pagină de centralizator nu are ce explica.
    if (!root || !esteLectie(root)) return undefined;

    const toate = collectLessonSections(root);
    const h1 = root.querySelector('h1');
    // Secțiunea de nivel 1 acoperă deja toată lecția: exact materialul pe care
    // îl vrem pentru explicația integrală.
    const intreaga = toate.find((s) => s.level === 1) || null;

    const created = [];
    if (disponibil !== false) {
      for (const section of toate) {
        // Titlul lecției primește butonul mare, nu unul mic în plus.
        if (section.level === 1) continue;
        if (
          !((section.contentText && section.contentText.length > 40)
            || section.latex.length > 0
            || section.visuals.length > 0)
        ) continue;

        const heading = section.headingElement;
        if (!heading || heading.querySelector('[data-edupasi-voice-slot]')) continue;
        const slot = document.createElement('span');
        slot.setAttribute('data-edupasi-voice-slot', '');
        slot.className = styles.slot;
        // Înaintea ancorei „#" a Docusaurus: altfel, la hover, ancora apare
        // între titlu și buton și împinge butonul din loc chiar când elevul îl
        // țintește.
        const anchor = heading.querySelector('.hash-link');
        if (anchor) heading.insertBefore(slot, anchor);
        else heading.appendChild(slot);
        created.push({ section, slot, heading });
      }
    }

    // Gazda de deasupra titlului există și când serviciul e căzut: acolo apare
    // mesajul, o singură dată pe pagină, nu la fiecare titlu.
    let banner = null;
    if (h1 && !h1.previousElementSibling?.hasAttribute?.('data-edupasi-lesson-voice')) {
      banner = document.createElement('div');
      banner.setAttribute('data-edupasi-lesson-voice', '');
      banner.className = styles.lessonSlot;
      h1.insertAdjacentElement('beforebegin', banner);
    }

    setMounts(created);
    setLesson(banner && intreaga ? { banner, section: intreaga } : banner ? { banner, section: null } : null);

    return () => {
      created.forEach(({ slot }) => slot.remove());
      if (banner) banner.remove();
      setMounts([]);
      setLesson(null);
    };
  }, [route, disponibil]);

  return (
    <>
      {lesson
        && createPortal(
          disponibil === false
            ? <Indisponibil />
            : lesson.section && disponibil === true
              ? <LessonButton section={lesson.section} route={route} host={lesson.banner} />
              : null,
          lesson.banner
        )}
      {disponibil === true
        && mounts.map(({ section, slot, heading }) =>
          createPortal(
            <SectionButton section={section} route={route} headingElement={heading} />,
            slot,
            section.id
          )
        )}
    </>
  );
}
