import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  adunaBlocuri,
  adunaBlocuriSectiune,
  aliniaza,
  frazaLaMoment,
  imparteFraze,
  timpiFraze,
} from '@site/src/lib/voice/sincronizare.mjs';
import styles from './styles.module.css';

/** mm:ss — elevii citesc durata, nu secunde brute. */
function fmt(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

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

export default function AudioPlayer({
  src, autoPlay = false, onClose, knownDuration = 0, onUnavailable,
  transcript = '', sentences = null, headingElement = null, contentRoot = null,
}) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  // Durata vine de la server odată cu explicația. Nu așteptăm ca browserul să
  // citească metadatele fișierului: pe conexiuni lente asta durează, iar până
  // atunci bara de derulare are lungime zero și elevul nu poate sări nicăieri.
  const [duration, setDuration] = useState(knownDuration || 0);
  const [speed, setSpeed] = useState(1);
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
    const onTime = () => setCurrent(el.currentTime);
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
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('ended', onEnd);
    el.addEventListener('waiting', onWait);
    el.addEventListener('playing', onPlaying);
    el.addEventListener('error', onError);
    return () => {
      el.removeEventListener('timeupdate', onTime);
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

  useEffect(() => {
    if (!autoPlay) return;
    const el = audioRef.current;
    if (el) el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [autoPlay, src]);

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

  return (
    <div className={styles.player} role="group" aria-label="Explicație audio">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Un singur rând: comenzile în stânga, derularea în dreapta. Pe telefon
          derularea trece singură pe rândul următor, prin wrap — nu există o
          variantă „redusă" de mobil, pentru că acolo sunt cei mai mulți elevi. */}
      <div className={styles.mainRow}>
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
      </div>

      <div className={styles.bottomRow}>
        <span className={styles.speedLabel}>Viteză</span>
        <div className={styles.speeds} role="group" aria-label="Viteza de redare">
          {SPEEDS.map((value) => (
            <button
              key={value}
              type="button"
              className={value === speed ? styles.speedOn : styles.speed}
              onClick={() => setSpeed(value)}
              aria-pressed={value === speed}
            >
              {value}×
            </button>
          ))}
        </div>
        {/* „Sincronizat" a fost scos dinadins: evidențierea în timp real pe
            pagină îngreuna redarea și se dezalinia. Rămâne transcriptul, static,
            dedesubt — text simplu, care merge lin. */}

        {buffering && <span className={styles.hint}>se încarcă…</span>}
        {onClose && (
          <button type="button" className={styles.close} onClick={onClose} aria-label="Închide">
            ✕
          </button>
        )}
      </div>

      {transcript ? (
        <details className={styles.transcriptBox}>
          <summary className={styles.transcriptToggle}>Vezi transcriptul</summary>
          <div className={styles.transcriptText}>{transcript}</div>
        </details>
      ) : null}
    </div>
  );
}
