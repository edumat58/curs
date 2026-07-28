import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { collectLessonSections } from '@site/src/components/EduPasiAccessibility/lessonSections.mjs';
import { sha256Hex } from '@site/src/lib/voice/canonical.mjs';
import { PROMPT_VERSION, codLectie, identitateLectie } from '@site/src/lib/voice/cod.mjs';
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

/**
 * Ce e o lecție și ce nu.
 *
 * Butoanele de explicație au sens doar pe lecții. În `docs/` mai stau pagini de
 * automatisme, centralizatoare, organigrame și pagini-hub — toate cu titlu și
 * secțiuni, deci toate ar primi butoane fără să fie nimic de predat acolo.
 * Semnul distinctiv, respectat de toate lecțiile platformei, e titlul: „C1 - …",
 * „C6.1 - …" la algebră și „G2 - …" la geometrie.
 *
 * „G" lipsea, iar consecința nu se vedea în niciun test: 34 de lecții de
 * geometrie din 193 pur și simplu nu primeau buton, iar pagina arăta perfect
 * normal fără el. Numărat pe titlurile reale din docs/: 124 de lecții „C", 34
 * „G", 35 de automatisme „A", 22 de pagini fără cod.
 *
 * Automatismele („A5.1") rămân în afară dinadins: sunt exerciții interactive
 * generate din nou la fiecare rulare, nu au conținut de predat. La fel paginile
 * de proiect, portofoliu, test, intro sau hub — verificate una câte una.
 */
const TITLU_DE_LECTIE = /^\s*[CG]\s*\d/;

function esteLectie(root) {
  const h1 = root && root.querySelector('h1');
  return Boolean(h1 && TITLU_DE_LECTIE.test(h1.textContent || ''));
}

/** Clasa și dacă e lecție adaptată, din adresa paginii. */
function contextLectie(route) {
  const m = /\/docs\/(edupasi\/)?(c[5-8])\b/.exec(String(route || ''));
  if (!m) return null;
  return { course: m[2], edupasi: Boolean(m[1]) };
}

/**
 * Codul canonic al lecției curente, calculat din adresă + titlu.
 *
 * Flagul „finală" (V) nu se știe în pagină — se marchează din admin și stă în
 * baza de voce; aici e 0 până la o eventuală citire. Restul flagurilor se
 * cunosc: adaptată din cale, vizibil implicit 0 (lecțiile pot fi ascunse).
 */
function codPagina(route, h1) {
  const ctx = contextLectie(route);
  if (!ctx || !h1) return null;
  return codLectie({ course: ctx.course, title: h1.textContent || '', edupasi: ctx.edupasi });
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

/**
 * Numele de etapă, adus la forma din hartă.
 *
 * Serverul raportează „naratiune 2/2" când predă o lecție lungă pe bucăți, și
 * „reparare" de mai multe ori la rând. Fără normalizare, `indexOf` întorcea -1
 * pentru bucăți, fracția ieșea 0, iar bara — ținută să nu dea înapoi — îngheța
 * exact la 30%. Elevul vedea o bară oprită, deși generarea mergea. Tăiem orice
 * după primul cuvânt.
 */
function etapaDeBaza(stage) {
  return String(stage || '').trim().split(/\s+/)[0];
}

/**
 * Ținta de umplere: cea mai mare dintre reperul etapei și o înaintare continuă
 * în timp.
 *
 * Reperul de etapă e onest — nu trece de sinteză până serverul n-o confirmă —
 * dar între etape de model, care pentru o lecție întreagă pot dura zeci de
 * secunde (mai multe bucăți, reparări, așteptări de rată), reperul se lipește de
 * capătul etapei și pare oprit. Peste el punem o înaintare care depinde DOAR de
 * timpul total scurs și se apropie asimptotic de 92%: chiar dacă etapele se
 * poticnesc, bara tot urcă. Niciuna nu ajunge la 100% înainte ca serverul să
 * confirme că e gata — asta rămâne rolul stării „ready".
 */
function fractieEtapa(stage, secundeInEtapa, expectedSpeechSec, secundeTotal) {
  const baza = etapaDeBaza(stage);
  const index = ORDINE.indexOf(baza);
  let reper = 0;
  if (index >= 0) {
    const etapa = ETAPE[baza];
    const start = index > 0 ? ETAPE[ORDINE[index - 1]].pana : 0;
    const tau = etapa.tau ?? Math.min(90, Math.max(4, (expectedSpeechSec || 40) * 0.18));
    reper = start + (etapa.pana - start) * (1 - Math.exp(-Math.max(0, secundeInEtapa) / tau));
  }

  /**
   * Înaintarea de fundal. Constanta de timp o scalăm cu durata așteptată a
   * audio-ului: o lecție de trei minute durează mai mult de generat decât o
   * definiție, deci bara ei trebuie să urce mai lent, altfel ar sta lipită de
   * 92% jumătate din timp. Se oprește la 0,9 ca reperul de etapă, mai precis, să
   * poată prelua ultimele procente.
   */
  const tauGlobal = Math.min(70, Math.max(12, (expectedSpeechSec || 40) * 0.5));
  const creep = 0.9 * (1 - Math.exp(-Math.max(0, secundeTotal || 0) / tauGlobal));

  return Math.max(reper, creep);
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
    if (res.status === 429) {
      // Bugetul pe zi epuizat e altceva decât prea multe cereri pe minut.
      const d = await res.json().catch(() => null);
      if (d && d.code === 'buget_epuizat') {
        throw Object.assign(new Error(d.error || 'Bugetul de azi s-a epuizat.'), { epuizat: true });
      }
      throw new Error('rate');
    }
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
  // Momentul în care a început TOATĂ generarea, pentru înaintarea de fundal.
  const inceput = useRef(0);

  useEffect(() => {
    if (!active) {
      setFractie(0);
      reper.current = { stage: null, la: 0 };
      inceput.current = 0;
    }
  }, [active]);

  useEffect(() => {
    // Prima interogare vine abia după trei secunde. Fără reperul ăsta, bara ar
    // sta goală exact în secundele în care elevul se uită cel mai atent la ea.
    if (active && !reper.current.stage) {
      reper.current = { stage: 'analiza', la: Date.now() };
      inceput.current = Date.now();
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
      const secundeTotal = inceput.current ? (Date.now() - inceput.current) / 1000 : secunde;
      const tinta = fractieEtapa(
        stage, secunde, status && status.expectedSpeechSec, secundeTotal
      );
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

/**
 * Verifică dacă o lecție ARE deja audio generat de administrator și îl aduce.
 *
 * Elevii nu mai generează nimic — aud doar ce a pregătit și aprobat
 * administratorul. Cheia e IDENTITATEA din codul lecției (MAT-GG-XTT-D), aceeași
 * pe care o folosește panoul de admin: așa, ce s-a generat pentru o lecție se
 * regăsește exact pe pagina ei. Fără audio gata, întoarcem null și butonul nici
 * nu apare.
 */
function useLessonAudio(route, section) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let viu = true;
    const ctx = contextLectie(route);
    const identitate = ctx && section ? identitateLectie({ course: ctx.course, title: section.heading }) : null;
    if (!identitate) return undefined;
    (async () => {
      try {
        const hash = await sha256Hex(`lectie|${identitate}|pv${PROMPT_VERSION}`);
        const res = await fetch(`${serviceUrl()}/voice/section/${hash}`);
        if (!res.ok) return;
        const json = await res.json();
        if (viu && json && json.status === 'ready' && json.audioUrl) {
          setData(json);
          raporteazaReusita();
        }
      } catch {
        // fără audio ori serviciu indisponibil — butonul pur și simplu nu apare
      }
    })();
    return () => { viu = false; };
  }, [route, section]);
  return data;
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

/**
 * Butonul de deasupra titlului: lecția întreagă, redată din cache.
 *
 * Apare DOAR dacă administratorul a generat și a aprobat audio pentru lecție.
 * Elevul nu generează nimic — apasă și ascultă. Fără audio gata, componenta
 * întoarce null, deci pagina nu are niciun buton de voce.
 */
function LessonButton({ section, route, host }) {
  const data = useLessonAudio(route, section);
  const [deschis, setDeschis] = useState(false);
  const panel = usePanel(host, deschis);

  if (!data) return null;

  return (
    <>
      <button
        type="button"
        className={deschis ? styles.lessonBtnOn : styles.lessonBtn}
        onClick={() => setDeschis((d) => !d)}
        aria-expanded={deschis}
        data-edupasi-speak-button=""
      >
        <span className={styles.lessonIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20">
            {deschis ? (
              <>
                <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
                <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
              </>
            ) : (
              <path d="M7 4.5l13 7.5-13 7.5z" fill="currentColor" />
            )}
          </svg>
        </span>
        <span className={styles.lessonText}>
          <span className={styles.lessonTitle}>
            {deschis ? 'Ascunde lecția explicată' : 'Ascultă lecția explicată'}
          </span>
          <span className={styles.lessonHint}>
            Un profesor îți parcurge toată lecția, pas cu pas.
          </span>
        </span>
      </button>

      {panel
        && deschis
        && createPortal(
          <Panou
            state="ready"
            data={data}
            onClose={() => setDeschis(false)}
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

    // Butoanele mici, pe fiecare secțiune, au dispărut dinadins: acum se predă
    // și se ascultă DOAR lecția întreagă, generată de administrator. Elevul are
    // un singur buton, deasupra titlului, și niciodată de generat.
    const created = [];

    /**
     * Codul canonic al lecției, sus deasupra titlului.
     *
     * E o etichetă discretă — evidența care leagă lecția de fișierul ei audio.
     * Se pune o singură dată, înaintea oricărui buton de voce, ca să fie primul
     * lucru din colțul din stânga sus.
     */
    const cod = codPagina(route, h1);
    let etichetaCod = null;
    if (cod && h1 && !h1.previousElementSibling?.hasAttribute?.('data-edupasi-cod')) {
      etichetaCod = document.createElement('div');
      etichetaCod.setAttribute('data-edupasi-cod', '');
      etichetaCod.className = styles.codLectie;
      etichetaCod.textContent = cod;
      etichetaCod.title = 'Cod canonic al lecției (identitate + flaguri)';
      h1.insertAdjacentElement('beforebegin', etichetaCod);
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
      if (etichetaCod) etichetaCod.remove();
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
    </>
  );
}
