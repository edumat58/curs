/**
 * Panoul de voce din admin — generare, revizuire și publicare a explicațiilor.
 *
 * Fluxul, deliberat în două faze, ca să nu se ardă cotă Azure pe text greșit:
 *   1. Generează TEXTUL (model local) — apare ca „ciornă".
 *   2. Administratorul îl CITEȘTE și îl corectează (modelul e slab, greșește).
 *   3. Aprobă → se sintetizează AUDIO (Azure) → lecția devine „gata" pentru elev.
 *
 * Nu vorbește direct cu serviciul de voce: cheamă backend-ul (cu tokenul de
 * admin), care forwardează cu secretul. Secretul vocii nu ajunge în browser.
 *
 * Mobile-first: o coloană, butoane mari, totul curge pe verticală. Pe ecran lat
 * lista și editorul stau alături.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { sha256Hex } from '@site/src/lib/voice/canonical.mjs';
import { codLectie, identitateLectie, numeFisierAudio } from '@site/src/lib/voice/cod.mjs';
import styles from './styles.module.css';

/**
 * Cheia audio a unei lecții, derivată din IDENTITATEA ei canonică (MAT-GG-XTT-D).
 *
 * Nu din rută și nu din flaguri: identitatea e stabilă, deci o marcare „finală"
 * sau o mutare de fișier nu rupe legătura cu audio-ul deja generat. `pv` intră
 * în cheie ca la o schimbare de prompt lecțiile să se regenereze controlat.
 */
async function cheieLectie(identitate, promptVersion) {
  return sha256Hex(`lectie|${identitate}|pv${promptVersion}`);
}

/** Trebuie să coincidă cu PROMPT_VERSION din serviciu — intră în hash. */
const PROMPT_VERSION = 6;
const MAX_CONTENT = 5800; // sub limita serverului (MAX_TEXT), cu marjă

const CLASE = { c5: 'Clasa a V-a', c6: 'Clasa a VI-a', c7: 'Clasa a VII-a', c8: 'Clasa a VIII-a' };
const STARE_ETICHETA = {
  none: 'Negenerat', draft: 'Ciornă — de revizuit', ready: 'Gata', pending: 'Se generează…', error: 'Eroare',
};

/** Text curat din sursa MDX, pentru câmpul cu limită de mărime al serverului. */
function textDinSursa(mdx) {
  return String(mdx || '')
    .replace(/^---[\s\S]*?---/, '')
    .replace(/^\s*import\s.+$/gm, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<\/?[a-zA-Z][^>]*>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, MAX_CONTENT);
}

export default function VoiceAdmin({ token, apiBase }) {
  const [lessons, setLessons] = useState([]); // {url, title, course, collection}
  const [sources, setSources] = useState({}); // url -> mdx brut
  const [status, setStatus] = useState({}); // route -> doc voce
  const [usage, setUsage] = useState(null);
  const [selected, setSelected] = useState(null); // url selectat
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(''); // ce operație rulează
  const [mesaj, setMesaj] = useState('');
  const [filtruClasa, setFiltruClasa] = useState('toate');
  const [cauta, setCauta] = useState('');

  const indexUrl = useBaseUrl('/lessons-index.json');
  const sourcesUrl = useBaseUrl('/lesson-sources.json');

  const authFetch = useCallback(
    (path, init = {}) => fetch(`${apiBase}${path}`, {
      ...init,
      headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` },
    }),
    [apiBase, token]
  );

  // Lista de lecții + sursele (de pe site) și starea vocii (de la serviciu).
  const incarca = useCallback(async () => {
    try {
      const [idx, src, st, us] = await Promise.all([
        fetch(indexUrl).then((r) => r.json()).catch(() => ({ lessons: [] })),
        fetch(sourcesUrl).then((r) => r.json()).catch(() => ({})),
        authFetch('/admin/voice/lessons').then((r) => (r.ok ? r.json() : { lessons: {} })).catch(() => ({ lessons: {} })),
        authFetch('/admin/voice/usage').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      // Doar lecțiile reale (titlu care începe cu C sau G); restul n-au voce.
      const doarLectii = (idx.lessons || []).filter((l) => /^\s*[CG]\s*\d/.test(l.title || ''));
      setLessons(doarLectii);
      setSources(src || {});
      setStatus(st.lessons || {});
      setUsage(us);
    } catch (err) {
      setMesaj(`Nu am putut încărca: ${err.message}`);
    }
  }, [indexUrl, sourcesUrl, authFetch]);

  useEffect(() => { incarca(); }, [incarca]);

  const lectiiFiltrate = useMemo(() => {
    const q = cauta.trim().toLowerCase();
    return lessons.filter((l) => {
      if (filtruClasa !== 'toate' && l.course !== filtruClasa) return false;
      if (q && !(l.title || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [lessons, filtruClasa, cauta]);

  const staree = (url) => (status[url] ? status[url].status : 'none');

  const selectat = lessons.find((l) => l.url === selected) || null;

  // La selectarea unei lecții, aducem textul curent (ciornă/final) dacă există.
  useEffect(() => {
    let viu = true;
    if (!selected) { setText(''); return undefined; }
    const doc = status[selected];
    if (!doc) { setText(''); return undefined; }
    (async () => {
      const r = await authFetch(`/admin/voice/text/${doc.sectionHash}`).catch(() => null);
      if (viu && r && r.ok) { const d = await r.json(); setText(d.text || ''); }
    })();
    return () => { viu = false; };
  }, [selected, status, authFetch]);

  async function genereazaText(url) {
    const lectie = lessons.find((l) => l.url === url);
    const sursa = sources[url];
    if (!lectie || !sursa) { setMesaj('Lipsește sursa lecției.'); return; }
    const identitate = identitateLectie({ course: lectie.course, title: lectie.title });
    if (!identitate) { setMesaj('Titlul lecției nu produce un cod valid.'); return; }
    setBusy(`text:${url}`);
    setMesaj('Generez textul cu modelul local — durează câteva minute. Poți lăsa pagina deschisă.');
    try {
      const hash = await cheieLectie(identitate, PROMPT_VERSION);
      const cod = codLectie({ course: lectie.course, title: lectie.title, collection: lectie.collection });
      const r = await authFetch('/admin/voice/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionHash: hash, route: url,
          // Codul și identitatea merg la serviciu: fișierul audio se numește
          // după cod, iar identitatea rămâne evidența stabilă a lecției.
          cod, identitate, numeAudio: numeFisierAudio(identitate),
          section: {
            mode: 'lectie', sourceCode: sursa, heading: lectie.title,
            lessonTitle: lectie.title, contentText: textDinSursa(sursa),
          },
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || `Serverul a răspuns ${r.status}`);
      setSelected(url);
      await incarca();
      // Generarea rulează în fundal; întrebăm de starea ei până apare ciorna.
      const gata = await asteaptaCiorna(hash);
      if (gata && gata.status === 'draft') {
        setText(gata.text || '');
        setMesaj('Text generat. Citește-l, corectează ce trebuie (modelul local greșește), apoi aprobă audio.');
      } else if (gata && gata.status === 'error') {
        setMesaj('Generarea a eșuat pe server. Încearcă din nou.');
      } else {
        setMesaj('Generarea durează neobișnuit de mult — revino peste puțin și reîmprospătează.');
      }
      await incarca();
    } catch (err) {
      setMesaj(`Generarea a eșuat: ${err.message}`);
    } finally { setBusy(''); }
  }

  /** Întreabă periodic de starea unei generări pornite în fundal. */
  async function asteaptaCiorna(hash) {
    const start = Date.now();
    const LIMITA = 12 * 60 * 1000;
    while (Date.now() - start < LIMITA) {
      await new Promise((res) => setTimeout(res, 4000));
      const r = await authFetch(`/admin/voice/text/${hash}`).catch(() => null);
      if (!r || !r.ok) continue;
      const d = await r.json();
      if (d.status === 'draft' || d.status === 'ready' || d.status === 'error') return d;
    }
    return null;
  }

  async function salveazaText() {
    const doc = status[selected];
    if (!doc) return;
    setBusy('save'); setMesaj('Salvez textul editat…');
    try {
      const r = await authFetch(`/admin/voice/text/${doc.sectionHash}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `${r.status}`);
      setMesaj('Text salvat. Poți genera audio când ești mulțumit.');
      await incarca();
    } catch (err) { setMesaj(`Salvarea a eșuat: ${err.message}`); }
    finally { setBusy(''); }
  }

  async function genereazaAudio() {
    const doc = status[selected];
    if (!doc) return;
    setBusy('audio'); setMesaj('Sintetizez audio (Azure)…');
    try {
      // Salvăm întâi textul curent din editor, ca sinteza să folosească ce vezi.
      await authFetch(`/admin/voice/text/${doc.sectionHash}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }),
      }).catch(() => {});
      const r = await authFetch(`/admin/voice/audio/${doc.sectionHash}`, { method: 'POST' });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || `${r.status}`);
      setMesaj('Audio generat — lecția e gata pentru elevi.');
      await incarca();
    } catch (err) { setMesaj(`Sinteza a eșuat: ${err.message}`); }
    finally { setBusy(''); }
  }

  async function sterge(url) {
    const doc = status[url];
    if (!doc) return;
    if (!window.confirm('Ștergi vocea acestei lecții (text + audio)?')) return;
    setBusy(`del:${url}`);
    try {
      await authFetch(`/admin/voice/${doc.sectionHash}`, { method: 'DELETE' });
      if (selected === url) { setSelected(null); setText(''); }
      setMesaj('Șters.');
      await incarca();
    } catch (err) { setMesaj(`Ștergerea a eșuat: ${err.message}`); }
    finally { setBusy(''); }
  }

  return (
    <div className={styles.wrap}>
      <UsageBar usage={usage} />

      <div className={styles.controls}>
        <input
          className={styles.search}
          placeholder="Caută lecția…"
          value={cauta}
          onChange={(e) => setCauta(e.target.value)}
        />
        <div className={styles.chips}>
          {['toate', 'c5', 'c6', 'c7', 'c8'].map((c) => (
            <button
              key={c}
              type="button"
              className={`${styles.chip} ${filtruClasa === c ? styles.chipOn : ''}`}
              onClick={() => setFiltruClasa(c)}
            >
              {c === 'toate' ? 'Toate' : CLASE[c].replace('Clasa a ', '').replace('-a', '')}
            </button>
          ))}
        </div>
      </div>

      {mesaj ? <div className={styles.mesaj}>{mesaj}</div> : null}

      <div className={styles.layout}>
        <ul className={styles.list}>
          {lectiiFiltrate.map((l) => {
            const s = staree(l.url);
            return (
              <li
                key={l.url}
                className={`${styles.row} ${selected === l.url ? styles.rowOn : ''}`}
                onClick={() => setSelected(l.url)}
              >
                <span className={`${styles.dot} ${styles[`dot_${s}`]}`} aria-hidden />
                <span className={styles.rowTexts}>
                  <span className={styles.rowTitle}>{l.title}</span>
                  <span className={styles.rowCod}>
                    {codLectie({ course: l.course, title: l.title, collection: l.collection }) || ''}
                  </span>
                </span>
                <span className={styles.rowMeta}>{CLASE[l.course]?.replace('Clasa a ', '')}</span>
              </li>
            );
          })}
          {lectiiFiltrate.length === 0 ? <li className={styles.gol}>Nicio lecție.</li> : null}
        </ul>

        <div className={styles.editor}>
          {!selectat ? (
            <div className={styles.hint}>Alege o lecție din listă ca s-o generezi sau s-o revizuiești.</div>
          ) : (
            <>
              <div className={styles.editorHead}>
                <div>
                  <h3 className={styles.editorTitle}>{selectat.title}</h3>
                  <span className={`${styles.badge} ${styles[`badge_${staree(selectat.url)}`]}`}>
                    {STARE_ETICHETA[staree(selectat.url)]}
                  </span>
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  disabled={Boolean(busy)}
                  onClick={() => genereazaText(selectat.url)}
                >
                  {busy === `text:${selectat.url}` ? 'Se generează…'
                    : staree(selectat.url) === 'none' ? 'Generează textul' : 'Regenerează textul'}
                </button>
                {status[selectat.url] ? (
                  <>
                    <button type="button" className={styles.btn} disabled={Boolean(busy) || !text.trim()} onClick={salveazaText}>
                      {busy === 'save' ? 'Se salvează…' : 'Salvează textul'}
                    </button>
                    <button type="button" className={styles.btnAccent} disabled={Boolean(busy) || !text.trim()} onClick={genereazaAudio}>
                      {busy === 'audio' ? 'Se sintetizează…' : 'Aprobă → generează audio'}
                    </button>
                    <button type="button" className={styles.btnGhost} disabled={Boolean(busy)} onClick={() => sterge(selectat.url)}>
                      Șterge
                    </button>
                  </>
                ) : null}
              </div>

              {staree(selectat.url) === 'ready' && status[selectat.url]?.audio ? (
                <div className={styles.audioInfo}>
                  Audio: {Math.round(status[selectat.url].audio.durationSec)}s
                  {status[selectat.url].models?.azureChars ? ` · ${status[selectat.url].models.azureChars} caractere Azure` : ''}
                </div>
              ) : null}

              <textarea
                className={styles.textarea}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={status[selectat.url] ? 'Textul explicației — corectează-l aici.' : 'Generează textul mai întâi.'}
                spellCheck
              />
              <div className={styles.count}>{text.trim() ? `${text.trim().split(/\s+/).length} cuvinte` : ''}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function UsageBar({ usage }) {
  if (!usage) return null;
  const { folosit, limita, ramas, procent, seResetLa, sursa } = usage;
  const reset = seResetLa ? new Date(seResetLa).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long' }) : null;
  const pct = procent != null ? Math.min(100, procent) : null;
  return (
    <div className={styles.usage}>
      <div className={styles.usageTop}>
        <span className={styles.usageLabel}>Consum voce Azure</span>
        <span className={styles.usageNums}>
          {folosit?.toLocaleString('ro-RO')} {limita != null ? `/ ${limita.toLocaleString('ro-RO')}` : ''} caractere
        </span>
      </div>
      {pct != null ? (
        <div className={styles.bar}><div className={styles.barFill} style={{ width: `${pct}%` }} /></div>
      ) : (
        <div className={styles.usageHint}>
          Limita nu e cunoscută încă {sursa === 'local' ? '(configurează accesul Azure pentru cifra reală)' : ''}.
        </div>
      )}
      <div className={styles.usageFoot}>
        {ramas != null ? `${ramas.toLocaleString('ro-RO')} rămase` : ''}
        {reset ? ` · se reînnoiește ${reset}` : ''}
        {sursa === 'azure' ? ' · direct din Azure' : ''}
      </div>
    </div>
  );
}
