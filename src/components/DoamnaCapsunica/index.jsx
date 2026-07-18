import React, { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import styles from './styles.module.css';

// Chatul cu Doamna Căpșunică pe site-ul edumat58 — un buton flotant la fiecare
// lecție (nu conținut în coloana centrală) care deschide un panou de chat. Vorbește
// cu tutorele Kulturosfera prin ruta publică /api/tutore (CORS + rate-limit).
// Randează matematică KaTeX și linkuri apăsabile. Respectă modul de proiecție (hideUI).

// Pe localhost lovim preview-ul local al site-ului principal; în producție,
// www.kulturosfera.com (host-ul canonic — apex-ul face 307 spre www, iar
// preflight-ul CORS NU urmărește redirect-uri, deci lovim direct www).
const API =
  typeof window !== 'undefined' && /^(localhost|127\.)/.test(window.location.hostname)
    ? 'http://localhost:3001/api/tutore'
    : 'https://www.kulturosfera.com/api/tutore';

const AVATAR = '/curs/img/doamna-capsunica.png';

const GREETING = {
  role: 'assistant',
  content:
    'Bună! Sunt Doamna Căpșunică. Spune-mi la ce te-ai blocat din lecția asta și lămurim împreună — te ghidez, îți dau exemple și îți arăt exact unde să citești.',
};

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderMath(tex, display) {
  try {
    const fixed = tex
      .replace(/\\tfrac\b/g, '\\dfrac')
      .replace(/\\frac\b/g, '\\dfrac')
      .replace(/\\tan\b/g, '\\operatorname{tg}')
      .replace(/\\cot\b/g, '\\operatorname{ctg}');
    return katex.renderToString(fixed, { throwOnError: false, displayMode: display });
  } catch {
    return escapeHtml(tex);
  }
}

// text (deja HTML-escaped) → linkuri markdown + URL-uri simple + bold
function linkify(escaped) {
  let html = escaped.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_, t, u) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${t}</a>`
  );
  html = html.replace(
    /(^|[^"=>/])(https?:\/\/[^\s<]+)/g,
    (_, pre, u) => `${pre}<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`
  );
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return html;
}

function toHtml(text) {
  return String(text || '')
    .split(/(\$\$[^$]+\$\$|\$[^$]+\$)/)
    .map((part) => {
      if (/^\$\$[^$]+\$\$$/.test(part)) return renderMath(part.slice(2, -2), true);
      if (/^\$[^$]+\$$/.test(part)) return renderMath(part.slice(1, -1), false);
      return linkify(escapeHtml(part)).replace(/\n/g, '<br/>');
    })
    .join('');
}

function lessonTitle() {
  if (typeof document === 'undefined') return '';
  const h1 = document.querySelector('article h1, .markdown h1, h1');
  return (h1?.textContent || document.title || '').trim().slice(0, 200);
}

export default function DoamnaCapsunica() {
  const [open, setOpen] = useState(false);
  const [hideUI, setHideUI] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('hideUI') === 'true' : false
  );
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const sync = () => setHideUI(localStorage.getItem('hideUI') === 'true');
    window.addEventListener('storage', sync);
    window.addEventListener('uiToggle', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('uiToggle', sync);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.filter((m) => m !== GREETING).map((m) => ({ role: m.role, content: m.content })),
          lessonContext: lessonTitle(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessages((m) => [...m, { role: 'assistant', content: data?.error || 'Ceva n-a mers. Mai încearcă o dată.' }]);
      } else {
        setMessages((m) => [...m, { role: 'assistant', content: data.reply, sources: data.sources || [] }]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: 'Nu am reușit să răspund. Verifică conexiunea și mai încearcă.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (hideUI) return null;

  return (
    <>
      {!open && (
        <button className={styles.fab} onClick={() => setOpen(true)} aria-label="Întreabă-o pe Doamna Căpșunică">
          <img className={styles.fabAvatar} src={AVATAR} alt="" />
          <span className={styles.fabLabel}>Întreabă-o pe Doamna Căpșunică</span>
        </button>
      )}

      {open && (
        <aside className={styles.panel} role="dialog" aria-label="Chat cu Doamna Căpșunică">
          <header className={styles.header}>
            <img className={styles.headerAvatar} src={AVATAR} alt="Doamna Căpșunică" />
            <div className={styles.headerText}>
              <strong>Doamna Căpșunică</strong>
              <span>Tutore Kulturosfera</span>
            </div>
            <button className={styles.close} onClick={() => setOpen(false)} aria-label="Închide">
              ×
            </button>
          </header>

          <div className={styles.messages} ref={scrollRef}>
            {messages.map((m, i) =>
              m.role === 'user' ? (
                <div key={i} className={styles.userRow}>
                  <div className={styles.userBubble}>{m.content}</div>
                </div>
              ) : (
                <div key={i} className={styles.botRow}>
                  <img className={styles.botAvatar} src={AVATAR} alt="" />
                  <div className={styles.botBubble}>
                    <div className={styles.md} dangerouslySetInnerHTML={{ __html: toHtml(m.content) }} />
                    {m.sources && m.sources.length > 0 && (
                      <div className={styles.sources}>
                        <span className={styles.sourcesLabel}>În edumat58</span>
                        {m.sources.map((s, j) => (
                          <a key={j} href={s.uri} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
                            {s.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
            {loading && (
              <div className={styles.botRow}>
                <img className={styles.botAvatar} src={AVATAR} alt="" />
                <div className={styles.typing}>se gândește…</div>
              </div>
            )}
          </div>

          <div className={styles.inputRow}>
            <textarea
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Scrie întrebarea ta…"
              rows={1}
            />
            <button className={styles.sendBtn} onClick={send} disabled={!input.trim() || loading} aria-label="Trimite">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
