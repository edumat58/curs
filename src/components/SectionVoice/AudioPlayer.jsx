import React, { useCallback, useEffect, useRef, useState } from 'react';
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
 * Player complet: play/pauză/stop, derulare, sărituri, viteză, durate.
 * Aceleași controale pe desktop și pe mobil — fără versiune „redusă" pe telefon,
 * pentru că exact acolo sunt elevii.
 */
export default function AudioPlayer({ src, autoPlay = false, onClose, knownDuration = 0 }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  // Durata vine de la server odată cu explicația. Nu așteptăm ca browserul să
  // citească metadatele fișierului: pe conexiuni lente asta durează, iar până
  // atunci bara de derulare are lungime zero și elevul nu poate sări nicăieri.
  const [duration, setDuration] = useState(knownDuration || 0);
  const [speed, setSpeed] = useState(1);
  const [buffering, setBuffering] = useState(true);

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

    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('ended', onEnd);
    el.addEventListener('waiting', onWait);
    el.addEventListener('playing', onPlaying);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('ended', onEnd);
      el.removeEventListener('waiting', onWait);
      el.removeEventListener('playing', onPlaying);
    };
  }, []);

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
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M12 5V2L7 6l5 4V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z" fill="currentColor" />
          </svg>
          <span className={styles.iconLabel}>10</span>
        </button>

        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => skip(10)}
          aria-label="Înainte 10 secunde"
          title="Înainte 10 secunde"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M12 5V2l5 4-5 4V7a6 6 0 1 0 6 6h2a8 8 0 1 1-8-8z" fill="currentColor" />
          </svg>
          <span className={styles.iconLabel}>10</span>
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
        {buffering && <span className={styles.hint}>se încarcă…</span>}
        {onClose && (
          <button type="button" className={styles.close} onClick={onClose} aria-label="Închide">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
