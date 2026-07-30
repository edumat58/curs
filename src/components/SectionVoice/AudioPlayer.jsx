import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  adunaBlocuri,
  adunaBlocuriSectiune,
  aliniaza,
  frazaLaMoment,
  imparteFraze,
  timpiFraze,
} from '@site/src/lib/voice/sincronizare.mjs';
import { construiesteTokeni, marcheazaSectiuni } from '@site/src/lib/voice/subtitrareMath.mjs';
import styles from './styles.module.css';

/** mm:ss — elevii citesc durata, nu secunde brute. */
function fmt(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const SPEEDS = [0.75, 0.9, 1, 1.25, 1.5, 2];

/**
 * Săritura de zece secunde, ca o singură icoană.
 *
 * Problema formei vechi nu era săgeata, ci cifra: un `<span>` poziționat
 * absolut la marginea de jos a butonului, care atârna sub arc ca o etichetă
 * lipită. Săgeata rămâne aceeași — un inel gros, cu vârf lat, care se citește
 * și la 20 de pixeli — iar „10" intră în golul din mijlocul ei, acolo unde îl
 * pune orice player.
 *
 * Inelul are centrul în (12, 13) și rază interioară 6, deci un numeral de
 * corp 7,4 stă înăuntru fără să atingă arcul.
 */
function SkipIcon({ forward }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path
        d={forward
          ? 'M12 5V2l5 4-5 4V7a6 6 0 1 0 6 6h2a8 8 0 1 1-8-8z'
          : 'M12 5V2L7 6l5 4V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z'}
        fill="currentColor"
      />
      <text
        x="12"
        y="15.8"
        textAnchor="middle"
        fill="currentColor"
        style={{ fontSize: '7.4px', fontWeight: 800, fontFamily: 'inherit' }}
      >
        10
      </text>
    </svg>
  );
}

/**
 * Player complet: play/pauză/stop, derulare, sărituri, viteză, durate.
 * Aceleași controale pe desktop și pe mobil — fără versiune „redusă" pe telefon,
 * pentru că exact acolo sunt elevii.
 */
/**
 * Evidențierea sincronizată.
 *
 * Ține minte ultimul element luminat, ca să îl stingă înainte să aprindă
 * altul, și derulează pagina spre el doar când chiar iese din câmpul vizual —
 * o pagină care sare la fiecare frază e mai obositoare decât una care nu se
 * mișcă deloc.
 */
function useEvidentiere(activ, blocuri, indexBloc, pilot) {
  const anterior = useRef(null);
  const pilotAnterior = useRef(pilot);

  useEffect(() => {
    const stinge = () => {
      if (anterior.current) {
        anterior.current.classList.remove(styles.evidentiat);
        anterior.current = null;
      }
    };
    if (!activ || indexBloc < 0 || !blocuri[indexBloc]) {
      stinge();
      return undefined;
    }
    const el = blocuri[indexBloc].el;
    /**
     * Revenirea în pilot trebuie să miște pagina PE LOC.
     *
     * Fără asta, elevul apăsa „Urmărește textul" și nu se întâmpla nimic până la
     * fraza următoare — care putea fi la zece secunde distanță. Butonul părea
     * stricat exact în momentul în care omul cerea ajutor.
     */
    const tocmaiAmRevenitInPilot = pilot && !pilotAnterior.current;
    pilotAnterior.current = pilot;
    if (el === anterior.current && !tocmaiAmRevenitInPilot) return undefined;
    if (el !== anterior.current) {
      stinge();
      el.classList.add(styles.evidentiat);
      anterior.current = el;
    }

    /**
     * Derularea aparține pilotului, nu evidențierii.
     *
     * Evidențierea merge mai departe oricum — elevul care s-a dus să se uite
     * mai jos vede în continuare unde a ajuns explicația când se întoarce. Doar
     * urmărirea automată se oprește, pentru că altfel pagina i-ar smulge
     * privirea înapoi de fiecare dată când citește altceva.
     */
    if (pilot) {
      const cadru = el.getBoundingClientRect();
      const inafara = cadru.top < 90 || cadru.bottom > window.innerHeight - 90;
      if (inafara) {
        el.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'center',
        });
      }
    }
    return undefined;
  }, [activ, blocuri, indexBloc, pilot]);

  // La demontare sau la oprirea sincronizării, pagina rămâne curată.
  useEffect(() => () => {
    if (anterior.current) anterior.current.classList.remove(styles.evidentiat);
  }, []);
}

/**
 * Indicele jetonului rostit ACUM, din timpii măsurați la sinteză.
 *
 * Cel mai mare jeton al cărui început a trecut deja de momentul curent. Între
 * două (pauze, virgule) rămâne aprins ultimul început — natural, ca la karaoke.
 * Căutare liniară: câteva sute de jetoane, de patru ori pe secundă, neglijabil.
 */
function indiceToken(tokens, ms) {
  if (!tokens || !tokens.length) return -1;
  let idx = -1;
  for (let i = 0; i < tokens.length; i += 1) {
    if (tokens[i].t <= ms) idx = i;
    else break;
  }
  return idx;
}

/**
 * Subtitrarea sincronizată: transcriptul rostit, jeton cu jeton, cu cel citit
 * acum evidențiat. Proza e cuvânt cu cuvânt; expresiile matematice apar cu
 * SIMBOLURI (`3 × 10000 + 7 × 1000`, `2²`), reasamblate din cuvinte, nu lăsate
 * ca „înmulțit cu". Cutia se derulează singură ca să țină jetonul activ în
 * mijloc, dar mișcă DOAR cutia, nu pagina.
 */
/**
 * Derulează PAGINA la o secțiune, așezând-o sub barele de sus (navbarul edumat
 * + bara de context EduPAȘI, când există), nu sub ele. `--edupasi-navbar-real` e
 * marginea de jos măsurată a navbarului.
 */
function scrollPaginaLaSectiune(el) {
  if (!el || typeof window === 'undefined') return;
  const stil = getComputedStyle(document.documentElement);
  const navbar = parseInt(stil.getPropertyValue('--edupasi-navbar-real'), 10) || 110;
  const edupasi = document.documentElement.getAttribute('data-edupasi-page') === 'true';
  const offset = navbar + (edupasi ? 68 : 0) + 16;
  const y = el.getBoundingClientRect().top + window.scrollY - offset;
  const redus = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: Math.max(0, y), behavior: redus ? 'auto' : 'smooth' });
}

function Subtitrare({ words, currentMs, contentRoot, onSeek }) {
  const activ = useRef(null);
  const cutie = useRef(null);
  const idxAnterior = useRef(-1);
  const sectiuneCurenta = useRef(null);
  const tokens = useMemo(() => {
    const baza = construiesteTokeni(words);
    // Titlurile REALE ale lecției (H2/H3 din conținut) — după ele recunoaștem
    // titlurile de secțiune rostite și le facem clicabile spre secțiune.
    const root = contentRoot
      || (typeof document !== 'undefined'
        ? document.querySelector('.theme-doc-markdown') || document.querySelector('article')
        : null);
    const titluri = root
      ? [...root.querySelectorAll('h2, h3')]
        .map((el) => ({ nume: (el.textContent || '').replace(/#$/, '').trim(), el }))
        .filter((h) => h.nume)
      : [];
    return marcheazaSectiuni(baza, titluri);
  }, [words, contentRoot]);
  /**
   * Evidențierea ia un mic AVANS față de ceas (80 ms).
   *
   * Între momentul în care citim poziția și clipa în care pixelii ajung pe ecran
   * trec randarea și un cadru de afișare — măsurat pe producție, cuvântul se
   * aprindea cu ~90-150 ms după ce începea să fie rostit, și exact atât se vede
   * ca „rămâne în urmă". Avansul anulează întârzierea; e sub pragul la care
   * ochiul ar sesiza că textul o ia înainte.
   */
  const idx = indiceToken(tokens, currentMs + 80);

  useEffect(() => {
    // Cutia are înălțime PRESTABILITĂ și derulare proprie: aducem cuvântul rostit
    // acum în MIJLOCUL cutiei, mișcând DOAR cutia (scrollTop), niciodată pagina —
    // altfel split-view-ul ar smuci lecția din spate la fiecare cuvânt.
    //
    // Comportamentul se alege după CÂT de departe e saltul:
    //   • pas mic (redare normală, sau scrub târât încet) → animat, lin — textul
    //     curge în timp real sub cuvântul rostit;
    //   • salt mare (skip de zeci de secunde, click pe bară, salt la secțiune) →
    //     INSTANTANEU. O animație lină pe o distanță uriașă practic îngheață, iar
    //     cuvântul corect rămânea în afara cutiei: părea că „nu urmărește".
    const salt = Math.abs(idx - idxAnterior.current);
    idxAnterior.current = idx;
    let raf = 0;
    let incercari = 0;
    /**
     * Elementul activ se caută în DOM după `data-activ`, NU printr-un ref.
     *
     * Cu ref, `activ.current` ajungea null exact când conta: React detașează
     * ref-ul vechi și îl atașează pe cel nou în aceeași commit, iar când noul
     * cuvânt e ÎNAINTEA celui vechi în arbore (orice salt înapoi), detașarea se
     * întâmpla DUPĂ atașare și anula referința. Efectul ieșea devreme și cutia
     * nu mai derula deloc — transcriptul rămânea la început în timp ce vocea
     * citea din mijloc: exact „textul și cititul nu mai sunt sincronizate".
     * Interogarea din DOM nu are ordinea asta de detașare.
     */
    const centreaza = () => {
      const box = cutie.current;
      if (!box) return;
      const el = box.querySelector('[data-activ]');
      if (!el) {
        // Randarea încă nu a ajuns la noul cuvânt: mai încercăm câteva cadre.
        if (incercari < 5) { incercari += 1; raf = requestAnimationFrame(centreaza); }
        return;
      }
      const rBox = box.getBoundingClientRect();
      const rEl = el.getBoundingClientRect();
      const centru = (rEl.top - rBox.top) - (box.clientHeight / 2 - rEl.height / 2);
      // Prag mic: nu re-derulăm pentru fracțiuni de pixel (evită tremuratul).
      if (Math.abs(centru) < 4) return;
      const redus = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const departe = redus || salt > 8 || Math.abs(centru) > box.clientHeight;
      box.scrollTo({ top: box.scrollTop + centru, behavior: departe ? 'auto' : 'smooth' });
    };
    raf = requestAnimationFrame(centreaza);
    return () => cancelAnimationFrame(raf);
  }, [idx]);

  /**
   * Când redarea TRECE într-o secțiune nouă, sărim și PAGINA la ea (cerut), ca
   * elevul să vadă în lecție exact bucata despre care se vorbește. Doar la
   * SCHIMBAREA de secțiune (o dată la zeci de secunde), nu la fiecare cuvânt. La
   * prima secțiune (chiar la deschidere) NU smucim pagina — omul tocmai a apăsat
   * play și citește de sus.
   */
  useEffect(() => {
    if (idx < 0) return;
    let sect = null;
    for (let j = idx; j >= 0; j -= 1) {
      const g = tokens[j] && tokens[j].grupTitlu;
      if (g && g.sectiune) { sect = g.sectiune; break; }
    }
    if (sect && sect !== sectiuneCurenta.current) {
      const prima = sectiuneCurenta.current === null;
      sectiuneCurenta.current = sect;
      if (!prima) scrollPaginaLaSectiune(sect);
    }
  }, [idx, tokens]);

  /**
   * Randarea transcriptului se recalculează DOAR când se schimbă cuvântul activ.
   *
   * Ceasul bate la ~40 ms, dar `idx` (cuvântul evidențiat) se schimbă abia la
   * graniță de cuvânt — de câteva ori pe secundă. Fără memoizare, tot transcriptul
   * (sute de jetoane) se re-randa de douăzeci și cinci de ori pe secundă: pe
   * desktop trece neobservat, pe telefon satura firul principal și evidențierea
   * rămânea în urmă cu un cuvânt întreg. Măsurat: exact simptomul „highlight cu un
   * cuvânt în urmă" de pe iPhone, invizibil la testele pe desktop. Legat de `idx`,
   * maparea rulează o dată per cuvânt, iar între tic-uri React primește aceleași
   * noduri și nu mai reconciliază nimic.
   */
  const continut = useMemo(() => {
    /**
     * Randarea merge pe GRUPURI: cuvintele unui titlu intră împreună într-un
     * singur buton (deci arată și se apasă ca un titlu), dar fiecare rămâne
     * propriul jeton, cu timpul lui — așa evidențierea avansează prin titlu
     * în loc să stea blocată pe tot blocul.
     */
    const bucati = [];
        let i = 0;
        while (i < tokens.length) {
          const grup = tokens[i].grupTitlu;
          if (!grup) { bucati.push({ tip: 'cuvant', tok: tokens[i], i }); i += 1; continue; }
          const start = i;
          while (i < tokens.length && tokens[i].grupTitlu === grup) i += 1;
          bucati.push({ tip: 'titlu', grup, tokens: tokens.slice(start, i), start });
        }
        return bucati.map((b) => {
          if (b.tip === 'cuvant') {
            const clasa = b.i === idx ? styles.cuvantActiv : (b.i < idx ? styles.cuvantCitit : styles.cuvant);
            return (
              // eslint-disable-next-line react/no-array-index-key
              <span key={b.i} ref={b.i === idx ? activ : null} data-activ={b.i === idx ? '' : undefined} className={clasa}>
                {b.tok.text}
                {' '}
              </span>
            );
          }
          return (
            <button
              key={`t${b.start}`}
              type="button"
              className={styles.subtitluSectiune}
              onClick={() => {
                if (onSeek && Number.isFinite(b.grup.t)) onSeek(b.grup.t);
                scrollPaginaLaSectiune(b.grup.sectiune);
              }}
              title="Sari aici — audio și pagină"
            >
              <span>
                {b.tokens.map((tok, k) => {
                  const poz = b.start + k;
                  return (
                    // eslint-disable-next-line react/no-array-index-key
                    <span
                      key={poz}
                      ref={poz === idx ? activ : null}
                      data-activ={poz === idx ? '' : undefined}
                      className={poz === idx ? styles.titluActiv : undefined}
                    >
                      {tok.text}
                      {k < b.tokens.length - 1 ? ' ' : ''}
                    </span>
                  );
                })}
              </span>
              <svg className={styles.subtitluSageata} viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
                <path d="M5 12h13m-6-6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          );
    });
  }, [tokens, idx, onSeek]);

  return (
    <div ref={cutie} className={styles.subtitrare} aria-label="Transcript sincronizat">
      {continut}
    </div>
  );
}

export default function AudioPlayer({
  src, autoPlay = false, onClose, knownDuration = 0, onUnavailable,
  transcript = '', sentences = null, words = null, headingElement = null, contentRoot = null,
  seekTo = null, defaultRate = null,
}) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  // Durata vine de la server odată cu explicația. Nu așteptăm ca browserul să
  // citească metadatele fișierului: pe conexiuni lente asta durează, iar până
  // atunci bara de derulare are lungime zero și elevul nu poate sări nicăieri.
  const [duration, setDuration] = useState(knownDuration || 0);
  // Viteza implicită ține de VOCE: Callirrhoe (Google) sună firesc la 1×, Azure
  // la 0,9×. Serverul o trimite în `defaultRate`; fără ea rămânem la 0,9×.
  const [speed, setSpeed] = useState(() => defaultRate || 0.9);
  const [buffering, setBuffering] = useState(true);
  const [sincron, setSincron] = useState(false);
  /**
   * Pilotul: pagina urmărește singură explicația.
   *
   * Pornește odată cu sincronizarea, dar se oprește în clipa în care elevul
   * derulează el însuși — nu i se ia controlul din mână. Sincronizarea rămâne
   * pornită, deci textul continuă să se lumineze, iar întoarcerea în pilot e un
   * singur buton. Ieșirea și revenirea sunt două acțiuni separate de pornirea
   * sincronizării, exact ca la o hartă care te urmărește până când o miști tu.
   */
  const [pilot, setPilot] = useState(true);

  /**
   * Potrivirea se calculează o singură dată, la pornirea sincronizării.
   *
   * E ieftină — câteva milisecunde — dar depinde de DOM-ul lecției, care nu se
   * schimbă în timpul redării. Refăcută la fiecare `timeupdate`, adică de patru
   * ori pe secundă, ar fi fost singura parte scumpă a funcției.
   */
  const potrivire = useMemo(() => {
    if (!transcript) return { blocuri: [], timpi: [], drum: [], demn: false };
    const blocuri = headingElement
      ? adunaBlocuriSectiune(headingElement)
      : adunaBlocuri(contentRoot);
    const fraze = imparteFraze(transcript);
    const timpi = timpiFraze(fraze, sentences, duration || knownDuration || 1);
    const drum = aliniaza(fraze, blocuri);

    /**
     * Sincronizarea se oferă doar când chiar poate ține pasul.
     *
     * Două condiții, amândouă necesare. Timpii trebuie să fie MĂSURAȚI la
     * sinteză, nu estimați din lungimea frazelor: estimarea se dezaliniază
     * cumulativ, iar după un minut arată complet altceva decât se aude. Și
     * potrivirea trebuie să prindă cel puțin jumătate din fraze — sub atât,
     * blocul luminat e mai des greșit decât corect.
     *
     * A arăta pe rândul greșit e mai rău decât a nu arăta nimic, cu atât mai
     * mult pentru un elev care are deja dificultăți de urmărire: el nu are cum
     * să știe că indicația minte, și o va crede.
     */
    const timpiReali = Array.isArray(sentences) && sentences.length === fraze.length;
    const potriviteFractie = drum.filter((j) => j >= 0).length / Math.max(1, drum.length);
    return { blocuri, timpi, drum, demn: timpiReali && potriviteFractie >= 0.5 };
  }, [transcript, sentences, headingElement, contentRoot, duration, knownDuration]);

  const frazaCurenta = sincron && potrivire.timpi.length
    ? frazaLaMoment(potrivire.timpi, current)
    : -1;
  const blocCurent = frazaCurenta >= 0 ? (potrivire.drum[frazaCurenta] ?? -1) : -1;
  useEvidentiere(sincron && playing, potrivire.blocuri, blocCurent, pilot);

  /**
   * Salt la secțiune: click pe orice bloc din pagină duce explicația acolo.
   *
   * Sincronizarea răspunde până acum la o singură întrebare — „unde a ajuns
   * explicația?". Asta o face să răspundă și la cealaltă, care e cel puțin la
   * fel de des pusă: „ce spune despre BUCATA ASTA?". Pentru un elev care a
   * recitit un paragraf și nu l-a înțeles, e diferența dintre a asculta cinci
   * minute până ajunge acolo și a apăsa o dată.
   *
   * Se caută PRIMA frază care trimite la blocul apăsat, pentru că explicația
   * unei bucăți începe la prima ei mențiune. Blocurile despre care nu se
   * vorbește nu primesc cursor de mână — un click care nu face nimic e mai rău
   * decât unul care lipsește.
   */
  useEffect(() => {
    if (!sincron || !potrivire.blocuri.length) return undefined;
    const el = audioRef.current;
    const ascultatori = [];

    potrivire.blocuri.forEach((bloc, index) => {
      const frazaTinta = potrivire.drum.indexOf(index);
      if (frazaTinta < 0 || !potrivire.timpi[frazaTinta]) return;
      const sari = (e) => {
        // Nu furăm click-urile de pe linkuri sau butoane din conținut.
        if (e.target.closest('a, button, input, [role="button"]')) return;
        el.currentTime = Math.max(0, potrivire.timpi[frazaTinta].start + 0.05);
        setCurrent(el.currentTime);
        setPilot(true);
        if (el.paused) el.play().then(() => setPlaying(true)).catch(() => {});
      };
      bloc.el.addEventListener('click', sari);
      bloc.el.classList.add(styles.saritor);
      ascultatori.push([bloc.el, sari]);
    });

    return () => ascultatori.forEach(([el2, fn]) => {
      el2.removeEventListener('click', fn);
      el2.classList.remove(styles.saritor);
    });
  }, [sincron, potrivire]);

  /**
   * Derularea făcută de om oprește pilotul; cea făcută de noi, nu.
   *
   * Nu există un eveniment care să spună cine a derulat, așa că ne uităm la
   * INTENȚIE: rotița, degetul pe ecran și tastele de navigare vin de la elev.
   * `scroll` singur nu ar merge — l-ar declanșa și `scrollIntoView`-ul nostru,
   * iar pilotul s-ar opri singur la prima frază.
   */
  useEffect(() => {
    if (!sincron) { setPilot(true); return undefined; }
    const iese = () => setPilot(false);
    const laTasta = (e) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) iese();
    };
    window.addEventListener('wheel', iese, { passive: true });
    window.addEventListener('touchmove', iese, { passive: true });
    window.addEventListener('keydown', laTasta);
    return () => {
      window.removeEventListener('wheel', iese);
      window.removeEventListener('touchmove', iese);
      window.removeEventListener('keydown', laTasta);
    };
  }, [sincron]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return undefined;
    /**
     * În timpul unui seek, iOS Safari continuă să trimită `timeupdate` cu poziția
     * VECHE până termină saltul — dacă o luăm de bună, evidențierea sare înapoi la
     * cuvântul de dinainte de clic și pare desincronizată. O ignorăm cât `seeking`
     * e adevărat; `onSeeked` pune poziția corectă când saltul s-a încheiat.
     */
    const onTime = () => { if (!el.seeking) setCurrent(el.currentTime); };
    const onSeeked = () => setCurrent(el.currentTime);
    const onMeta = () => {
      // Metadatele reale au prioritate; valoarea de la server e doar punctul
      // de plecare, ca bara să fie utilizabilă din prima secundă.
      if (Number.isFinite(el.duration) && el.duration > 0) setDuration(el.duration);
      setBuffering(false);
    };
    const onEnd = () => setPlaying(false);
    const onWait = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);
    /**
     * Audio-ul stă în GridFS și e servit tot de serviciul de voce. Dacă el cade,
     * o explicație deja generată devine la fel de indisponibilă ca una care
     * încă nu există — deci o eroare de redare e un semnal despre serviciu, nu
     * despre fișierul ăsta anume.
     */
    const onError = () => {
      setPlaying(false);
      setBuffering(false);
      if (onUnavailable) onUnavailable();
    };

    el.addEventListener('timeupdate', onTime);
    el.addEventListener('seeked', onSeeked);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('ended', onEnd);
    el.addEventListener('waiting', onWait);
    el.addEventListener('playing', onPlaying);
    el.addEventListener('error', onError);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('seeked', onSeeked);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('ended', onEnd);
      el.removeEventListener('waiting', onWait);
      el.removeEventListener('playing', onPlaying);
      el.removeEventListener('error', onError);
    };
  }, [onUnavailable]);

  useEffect(() => {
    const el = audioRef.current;
    if (el) el.playbackRate = speed;
  }, [speed]);

  /**
   * Poziția se citește pe CEAS PROPRIU cât timp se redă, nu din `timeupdate`.
   *
   * `timeupdate` sosește o dată la ~250 ms — între două evenimente, evidențierea
   * arată un cuvânt rostit deja. Măsurat pe producție: la 138,5 s era luminat
   * „Descompunerea", deși se auzea „unui". La cuvintele scurte, sfertul acela de
   * secundă se vede ca o rămânere în urmă constantă.
   *
   * Cu un cadru de animație citim ceasul de câte ori repictează browserul, dar
   * împrospătăm starea doar la ~60 ms: destul cât să nu se mai vadă întârzierea,
   * rar cât să nu redesenăm transcriptul de șaizeci de ori pe secundă degeaba.
   * `timeupdate` rămâne pentru cazurile în care nu se redă (derulare, salt).
   */
  useEffect(() => {
    if (!playing) return undefined;
    let raf = 0;
    let ultima = 0;
    const bate = () => {
      const el = audioRef.current;
      if (el && !el.paused && !el.seeking) {
        const acum = el.currentTime;
        if (Math.abs(acum - ultima) > 0.04) { ultima = acum; setCurrent(acum); }
      }
      raf = requestAnimationFrame(bate);
    };
    raf = requestAnimationFrame(bate);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  useEffect(() => {
    if (!autoPlay) return;
    const el = audioRef.current;
    if (el) el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [autoPlay, src]);

  /**
   * Salt la o SECȚIUNE, cerut de iconița de sunet de lângă titlul ei.
   *
   * `seekTo` e `{ms, nonce}`: nonce-ul se schimbă la fiecare apăsare, ca două
   * click-uri pe aceeași secțiune să reia saltul (altfel prop-ul ar fi „egal" și
   * efectul n-ar mai rula). Dacă metadatele încă nu s-au încărcat, `currentTime`
   * nu „prinde"; așteptăm `loadedmetadata` o singură dată și aplicăm apoi.
   */
  useEffect(() => {
    if (!seekTo || !Number.isFinite(seekTo.ms)) return undefined;
    const el = audioRef.current;
    if (!el) return undefined;
    const sari = () => {
      el.currentTime = Math.max(0, seekTo.ms / 1000);
      setCurrent(el.currentTime);
      setPilot(true);
      el.play().then(() => setPlaying(true)).catch(() => {});
    };
    if (el.readyState >= 1) {
      sari();
      return undefined;
    }
    el.addEventListener('loadedmetadata', sari, { once: true });
    return () => el.removeEventListener('loadedmetadata', sari);
  }, [seekTo]);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      el.pause();
      setPlaying(false);
    }
  }, []);

  const stop = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setCurrent(0);
    setPlaying(false);
  }, []);

  const skip = useCallback((delta) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.min(Math.max(0, el.currentTime + delta), el.duration || 0);
  }, []);

  const seek = useCallback((event) => {
    const el = audioRef.current;
    if (!el) return;
    const value = Number(event.target.value);
    el.currentTime = value;
    setCurrent(value);
  }, []);

  /** Salt la un moment (ms), cerut de titlul de secțiune din transcript. */
  const seekLaMs = useCallback((ms) => {
    const el = audioRef.current;
    if (!el || !Number.isFinite(ms)) return;
    el.currentTime = Math.max(0, ms / 1000);
    setCurrent(el.currentTime);
    el.play().then(() => setPlaying(true)).catch(() => {});
  }, []);

  // Meniul de viteză (setări): scos din rândul care mânca un rând întreg din dock.
  const [setari, setSetari] = useState(false);

  /**
   * DOUĂ colapsuri INDEPENDENTE, pe bara de audio, AMBELE colapsate implicit
   * (cerut): dock-ul se deschide ca o simplă bară de audio, iar elevul arată ce
   * vrea. `extins` = rândul de controale extra (±10, stop, viteză), deasupra.
   * `transcriptDeschis` = transcriptul, dedesubt.
   */
  const [extins, setExtins] = useState(false);
  const [transcriptDeschis, setTranscriptDeschis] = useState(false);

  /**
   * Cât timp TRANSCRIPTUL e deschis, navbarul de sus (+ bara de context EduPAȘI)
   * NU mai stă lipit — se derulează cu pagina, ca tot spațiul de sus să meargă în
   * text. La închidere redevin persistente. Comutăm o clasă pe <body> (CSS global).
   */
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    document.body.classList.toggle('voice-transcript-open', transcriptDeschis);
    return () => document.body.classList.remove('voice-transcript-open');
  }, [transcriptDeschis]);

  return (
    <div className={styles.player} role="group" aria-label="Explicație audio">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Închide — tab „punch-out" în colțul dreapta-sus, deasupra dock-ului, țintă
          mare, ușor de apăsat (nu mai stă înghesuit lângă bara de derulare). */}
      {onClose && (
        <button
          type="button"
          className={styles.closeTab}
          onClick={onClose}
          aria-label="Închide"
          title="Închide"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {/* Rând EXTRA de controale — apare doar EXTINS, un rând DEASUPRA barei de
          audio: ±10, stop, viteză. Restrâns, dispare de tot; rămâne doar bara de
          audio de dedesubt. */}
      {extins && (
        <div className={styles.extraRow}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => skip(-10)}
            aria-label="Înapoi 10 secunde"
            title="Înapoi 10 secunde"
          >
            <SkipIcon forward={false} />
          </button>

          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => skip(10)}
            aria-label="Înainte 10 secunde"
            title="Înainte 10 secunde"
          >
            <SkipIcon forward />
          </button>

          <button
            type="button"
            className={styles.iconBtn}
            onClick={stop}
            aria-label="Oprește"
            title="Oprește"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
            </svg>
          </button>

          <div className={styles.setariWrap}>
            <button
              type="button"
              className={styles.setariBtn}
              onClick={() => setSetari((v) => !v)}
              aria-expanded={setari}
              aria-label={`Viteză de redare: ${speed}×`}
              title="Viteză de redare"
            >
              {speed}×
            </button>
            {setari && (
              <div className={styles.setariMeniu} role="menu" aria-label="Viteza de redare">
                {SPEEDS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={value === speed}
                    className={value === speed ? styles.speedOn : styles.speed}
                    onClick={() => { setSpeed(value); setSetari(false); }}
                  >
                    {value}×
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bara de AUDIO — MEREU vizibilă, pe UN SINGUR rând: play + derulare/timp +
          colaps + închide. Seek-ul stă lângă play (nu mai e împins pe alt rând de
          celelalte butoane), deci nu se mai rupe pe două rânduri pe mobil. */}
      <div className={styles.audioBar}>
        <button
          type="button"
          className={styles.playBtn}
          onClick={toggle}
          aria-label={playing ? 'Pauză' : 'Redă explicația'}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
              <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M7 4.5l13 7.5-13 7.5z" fill="currentColor" />
            </svg>
          )}
        </button>

        <div className={styles.progress}>
          <span className={styles.time}>{fmt(current)}</span>
          <input
            className={styles.seek}
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(current, duration || 0)}
            onChange={seek}
            aria-label="Poziția în explicație"
          />
          <span className={styles.time}>-{fmt(Math.max(0, (duration || 0) - current))}</span>
        </div>

        {/* Colaps/expand CONTROALE (rândul extra de sus) — iconiță de SETĂRI. */}
        <button
          type="button"
          className={extins ? styles.colapsOn : styles.colaps}
          onClick={() => { setSetari(false); setExtins((v) => !v); }}
          aria-expanded={extins}
          aria-label={extins ? 'Ascunde controalele' : 'Mai multe controale'}
          title={extins ? 'Ascunde controalele extra' : 'Arată toate controalele'}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
            <path
              d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Colaps/expand TRANSCRIPT (dedesubt). Buton separat, pe aceeași bară. */}
        <button
          type="button"
          className={transcriptDeschis ? styles.colapsOn : styles.colaps}
          onClick={() => setTranscriptDeschis((v) => !v)}
          aria-pressed={transcriptDeschis}
          aria-label={transcriptDeschis ? 'Ascunde transcriptul' : 'Arată transcriptul'}
          title={transcriptDeschis ? 'Ascunde transcriptul' : 'Arată transcriptul'}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              d="M4 6h16M4 10h16M4 14h10M4 18h13"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {buffering && <span className={styles.hint}>se încarcă…</span>}

      {/* Transcriptul apare doar când e DESCHIS (buton propriu pe bară). Implicit
          colapsat. Subtitrare sincronizată când avem timpii pe cuvânt; altfel
          transcriptul static (audio generat înainte de a exista funcția). */}
      {transcriptDeschis && (
        Array.isArray(words) && words.length ? (
          <Subtitrare words={words} currentMs={current * 1000} contentRoot={contentRoot} onSeek={seekLaMs} />
        ) : transcript ? (
          <div className={styles.transcriptText}>{transcript}</div>
        ) : null
      )}
    </div>
  );
}
