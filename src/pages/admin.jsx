import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { KulturosferaLine } from '@site/src/components/Brand';
import styles from './admin.module.css';

/**
 * Panoul de admin Edumat58 — aceeași mecanică precum gestiunea de lecții din
 * educode: autentificare EduConnect+ (doar conturi de administrator; partea
 * de elev e dezactivată temporar — platforma nu are funcții care cer logare),
 * listă de lecții cu căutare/filtru, editor MDX brut, publicare/ascundere.
 *
 * Site-ul fiind static, salvările pleacă spre backend, care face commit în
 * edumat58/curs; Action-ul „Deploy Docusaurus" republică site-ul automat.
 */

const TOKEN_KEY = 'edumat-admin-token';
const NAME_KEY = 'edumat-admin-name';

function backendBase() {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3002';
  }
  return 'https://backend-deussebyum11724s-projects.vercel.app';
}

// ---- iconițe stroke (regula Kulturosfera: fără emoji) ----------------------

const iconProps = (size) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
});

const IconUser = ({ size = 24 }) => (
  <svg {...iconProps(size)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
  </svg>
);
const IconShield = ({ size = 24 }) => (
  <svg {...iconProps(size)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconPlus = ({ size = 24 }) => (
  <svg {...iconProps(size)}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconX = ({ size = 24 }) => (
  <svg {...iconProps(size)}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconCheck = ({ size = 24 }) => (
  <svg {...iconProps(size)}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconArrowLeft = ({ size = 24 }) => (
  <svg {...iconProps(size)}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

// ---- brand EduConnect+ -----------------------------------------------------

function EduConnectButton({ children, ...props }) {
  return (
    <button type="button" {...props} className={styles.educonnectBtn}>
      {children ?? <span>EduConnect+</span>}
    </button>
  );
}

function EduConnectBadge() {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column' }}>
      <span className={styles.brandType} style={{ fontSize: '1rem', letterSpacing: '0.04em' }}>
        <span style={{ color: 'var(--km-ink)' }}>EduConnect</span>
        <span style={{ color: 'var(--km-orange)' }}>+</span>
      </span>
      <KulturosferaLine width={64} />
    </span>
  );
}

// ---- autentificare ---------------------------------------------------------

function LoginCard({ onLogin }) {
  const [open, setOpen] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [identifier, setIdentifier] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await fetch(`${backendBase()}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier.trim(), password }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(data.error || 'Autentificarea nu a reușit.');
        return;
      }
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(NAME_KEY, data.name || data.email);
      onLogin(data);
    } catch {
      setError('Backend-ul nu a răspuns — verifică conexiunea.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.loginCard}>
      <div className={styles.eyebrow}>Autentificare</div>
      <h1 className={styles.display} style={{ fontSize: '1.5rem', marginTop: '0.25rem', marginBottom: 0 }}>
        Intră în edumat58
      </h1>
      <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--km-ink2)' }}>
        Contul tău Kulturosfera funcționează pe toate platformele — aceleași date ca în edurev.
      </p>

      {!open ? (
        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <EduConnectButton onClick={() => setOpen(true)} aria-label="Continuă cu EduConnect+" />
          <p style={{ fontSize: '0.75rem', lineHeight: 1.6, color: 'var(--km-ink3)', margin: 0 }}>
            Metoda universală de conectare Kulturosfera — același cont ca în edurev.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} noValidate style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <EduConnectBadge />
            <div role="tablist" aria-label="Tip de cont" className={styles.toggle}>
              <button
                type="button"
                role="tab"
                aria-selected={false}
                disabled
                className={styles.toggleBtnDisabled}
                title="Dezactivat temporar — Edumat58 nu are funcții care cer autentificare pentru elevi"
              >
                <IconUser size={13} /> Elev
              </button>
              <button type="button" role="tab" aria-selected className={styles.toggleBtnActive}>
                <IconShield size={13} /> Admin
              </button>
            </div>
          </div>

          <div>
            <label className={styles.fieldLabel} htmlFor="login-id">Email de administrator</label>
            <input
              id="login-id"
              name="username"
              type="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="admin@kulturosfera.ro"
              required
              className={styles.input}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
            <p style={{ marginTop: '0.35rem', marginBottom: 0, fontSize: '0.75rem', color: 'var(--km-ink3)' }}>
              Doar pentru administrarea platformei. Conturile de elev sunt dezactivate temporar.
            </p>
          </div>

          <div>
            <label className={styles.fieldLabel} htmlFor="login-pw">Parolă</label>
            <input
              id="login-pw"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error ? <p role="alert" className={styles.error} style={{ margin: 0 }}>{error}</p> : null}

          <EduConnectButton type="submit" disabled={busy || !identifier || !password}>
            <span>{busy ? 'Se verifică…' : 'Intră cu EduConnect+'}</span>
          </EduConnectButton>
        </form>
      )}
    </div>
  );
}

// ---- gestiune lecții -------------------------------------------------------

function insertHide(raw) {
  // adaugă `hide: true` imediat după deschiderea frontmatter-ului
  return raw.replace(/^---\r?\n/, (m) => `${m}hide: true\n`);
}

function removeHide(raw) {
  return raw.replace(/^hide:\s*true\s*\r?\n/m, '');
}

function LessonManager({ token, name, onLogout }) {
  const manifestUrl = useBaseUrl('/admin-manifest.json');
  const docsBase = useBaseUrl('/docs/');
  const [lessons, setLessons] = React.useState(null);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [filter, setFilter] = React.useState('');
  const [course, setCourse] = React.useState('toate');
  const [creating, setCreating] = React.useState(false);
  const [config, setConfig] = React.useState(null);

  const [editing, setEditing] = React.useState(null); // { id, path }
  const [raw, setRaw] = React.useState('');
  const [sha, setSha] = React.useState(null);
  const [dirty, setDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const authFetch = React.useCallback(
    (input, init = {}) =>
      fetch(input, { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` } }),
    [token],
  );

  const load = React.useCallback(async () => {
    try {
      const r = await fetch(`${manifestUrl}?t=${Date.now()}`);
      if (!r.ok) throw new Error();
      const data = await r.json();
      setLessons(data.lessons || []);
    } catch {
      setError('Nu am putut încărca lista de lecții (admin-manifest.json).');
    }
  }, [manifestUrl]);

  React.useEffect(() => {
    void load();
    authFetch(`${backendBase()}/admin/config`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setConfig)
      .catch(() => setConfig(null));
  }, [load, authFetch]);

  // deep-link ?edit=c5/modul-1/08
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const edit = params.get('edit');
    if (edit) void openEditor(edit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const courses = React.useMemo(() => {
    const set = new Set((lessons || []).map((l) => l.course).filter(Boolean));
    return ['toate', ...Array.from(set).sort()];
  }, [lessons]);

  const visible = React.useMemo(() => {
    if (!lessons) return [];
    const needle = filter.trim().toLowerCase();
    return lessons.filter((l) => {
      if (course !== 'toate' && l.course !== course) return false;
      if (!needle) return true;
      return `${l.id} ${l.title}`.toLowerCase().includes(needle);
    });
  }, [lessons, filter, course]);

  function pathFor(idOrPath) {
    if (idOrPath.startsWith('docs/')) return idOrPath;
    const known = (lessons || []).find((l) => l.id === idOrPath);
    return known ? known.path : `docs/${idOrPath}.mdx`;
  }

  async function openEditor(idOrPath) {
    setNotice('');
    setError('');
    const p = pathFor(idOrPath);
    try {
      const r = await authFetch(`${backendBase()}/admin/lesson?path=${encodeURIComponent(p)}`);
      const data = await r.json().catch(() => ({}));
      if (r.status === 401 || r.status === 403) {
        onLogout();
        return;
      }
      if (!r.ok) {
        setError(data.error || 'Nu am putut deschide lecția.');
        return;
      }
      setRaw(data.raw);
      setSha(data.sha);
      setEditing({ id: p.replace(/^docs\//, '').replace(/\.(md|mdx)$/i, ''), path: p });
      setDirty(false);
    } catch {
      setError('Backend-ul nu a răspuns — verifică conexiunea.');
    }
  }

  async function saveRaw(p, content, currentSha, okNotice) {
    setSaving(true);
    setNotice('');
    try {
      const r = await authFetch(`${backendBase()}/admin/lesson`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: p, raw: content, sha: currentSha }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setNotice(data.error || 'Salvarea nu a mers.');
        return false;
      }
      if (data.sha) setSha(data.sha);
      setNotice(okNotice ?? (data.savedTo === 'github'
        ? 'Salvat — commit în GitHub. Site-ul se republică automat în câteva minute.'
        : 'Salvat local.'));
      return true;
    } catch {
      setNotice('Backend-ul nu a răspuns — verifică conexiunea.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function save() {
    if (!editing) return;
    const ok = await saveRaw(editing.path, raw, sha);
    if (ok) setDirty(false);
  }

  async function toggleHidden(l) {
    setNotice('');
    try {
      const r = await authFetch(`${backendBase()}/admin/lesson?path=${encodeURIComponent(l.path)}`);
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setNotice(data.error || 'Nu am putut deschide lecția.');
        return;
      }
      const isHidden = /^hide:\s*true\s*$/m.test(data.raw);
      const next = isHidden ? removeHide(data.raw) : insertHide(data.raw);
      if (next === data.raw) {
        setNotice(`Nu am putut modifica frontmatter-ul la ${l.id} — editează-l manual.`);
        return;
      }
      const ok = await saveRaw(l.path, next, data.sha, isHidden
        ? `„${l.title}" va fi din nou vizibilă după republicare (câteva minute).`
        : `„${l.title}" va dispărea din sidebar după republicare (câteva minute).`);
      if (ok) {
        setLessons((ls) => (ls || []).map((x) => (x.id === l.id ? { ...x, hidden: !isHidden } : x)));
      }
    } catch {
      setNotice('Backend-ul nu a răspuns — verifică conexiunea.');
    }
  }

  async function remove(l) {
    if (!window.confirm(`Ștergi lecția „${l.title}" (${l.id})? Fișierul se șterge din repo, iar site-ul se republică fără el.`)) return;
    setNotice('');
    try {
      const cur = await authFetch(`${backendBase()}/admin/lesson?path=${encodeURIComponent(l.path)}`);
      const curData = await cur.json().catch(() => ({}));
      const r = await authFetch(`${backendBase()}/admin/lesson`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: l.path, sha: curData.sha }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setNotice(data.error || 'Ștergerea nu a mers.');
        return;
      }
      setLessons((ls) => (ls || []).filter((x) => x.id !== l.id));
      if (editing && editing.path === l.path) setEditing(null);
      setNotice(`„${l.title}" a fost ștearsă — site-ul se republică în câteva minute.`);
    } catch {
      setNotice('Backend-ul nu a răspuns — verifică conexiunea.');
    }
  }

  function lessonUrl(l) {
    if (l.slug) return docsBase.replace(/\/$/, '') + l.slug;
    return docsBase + l.id;
  }

  // ---- vederea editor ----
  if (editing) {
    const known = (lessons || []).find((x) => x.path === editing.path);
    return (
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <button
            className={styles.backBtn}
            onClick={() => {
              if (dirty && !window.confirm('Ai modificări nesalvate. Închizi editorul?')) return;
              setEditing(null);
              setNotice('');
            }}
          >
            <IconArrowLeft size={16} /> Înapoi la listă
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              className={config?.mode === 'local' ? styles.badgeCloud : styles.badgeFile}
              title={config?.mode === 'local' ? 'Mod local de dezvoltare — se scrie pe disc' : 'Versiunea activă vine din fișierul din git (repo edumat58/curs)'}
            >
              {config?.mode === 'local' ? 'Local' : 'Fișier'}
            </span>
            {known ? (
              <Link href={lessonUrl(known)} target="_blank" className={styles.linkInfo}>
                Vezi lecția
              </Link>
            ) : null}
            <button className={styles.btn} onClick={save} disabled={saving || !dirty}>
              {saving ? 'Se salvează…' : dirty ? 'Salvează' : 'Salvat'}
            </button>
          </div>
        </div>
        <p style={{ marginTop: '0.5rem', marginBottom: 0, fontSize: '0.75rem', color: 'var(--km-ink3)', fontVariantNumeric: 'tabular-nums' }}>
          {editing.path}
        </p>
        {notice ? (
          <p className={notice.startsWith('Salvat') || notice.startsWith('„') ? styles.success : styles.error} style={{ marginTop: '0.5rem', marginBottom: 0 }}>
            {notice}
          </p>
        ) : null}
        <textarea
          className={styles.editorTextarea}
          value={raw}
          spellCheck={false}
          onChange={(e) => {
            setRaw(e.target.value);
            setDirty(true);
          }}
        />
      </div>
    );
  }

  // ---- vederea listă ----
  return (
    <div>
      <div className={styles.eyebrow}>Administrare</div>
      <div style={{ marginTop: '0.25rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <h1 className={styles.display} style={{ fontSize: '1.5rem', margin: 0 }}>Gestiune lecții</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={styles.sessionChip}>
            {name}
            <button className={styles.linkQuiet} onClick={onLogout}>Ieși</button>
          </span>
          <button className={styles.btn} onClick={() => setCreating((v) => !v)}>
            <IconPlus size={16} /> Lecție nouă
          </button>
        </div>
      </div>
      <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: 'var(--km-ink3)' }}>
        Salvările fac commit direct în repo (edumat58/curs), iar site-ul se republică automat în câteva minute.
        Lecțiile ascunse dispar din sidebar, dar rămân accesibile prin link direct.
      </p>
      {config && !config.githubReady ? (
        <p className={styles.error} style={{ marginTop: '0.25rem' }}>
          Backend-ul nu are încă GITHUB_TOKEN configurat — poți deschide și citi lecții doar după configurare, iar salvările sunt dezactivate.
        </p>
      ) : null}

      {creating ? (
        <CreateForm
          lessons={lessons || []}
          onCreate={async ({ course: c, module: m, slug, title }) => {
            const p = `docs/${c}/${m}/${slug}.mdx`;
            const siblings = (lessons || []).filter((l) => l.course === c && l.module === m);
            const position = siblings.reduce((max, l) => Math.max(max, l.position || 0), 0) + 1;
            const template = `---\ntitle: "${title}"\nsidebar_position: ${position}\nslug: /${c}/${m}/${slug}\ndescription: ""\n---\n\n# ${title}\n\n## Introducere\n\nConținut nou — completează lecția.\n`;
            const ok = await saveRaw(p, template, null, `„${title}" a fost creată — site-ul se republică în câteva minute.`);
            if (ok) {
              setCreating(false);
              setLessons((ls) => [
                ...(ls || []),
                { id: `${c}/${m}/${slug}`, path: p, title, course: c, module: m, position, slug: `/${c}/${m}/${slug}`, hidden: false, frontmatterOk: true },
              ].sort((a, b) => a.id.localeCompare(b.id, 'ro')));
            }
            return ok;
          }}
        />
      ) : null}

      <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="search"
          placeholder="Caută după titlu sau id"
          aria-label="Caută lecții"
          className={styles.input}
          style={{ width: 'auto', minWidth: 220, flex: '1 1 220px', maxWidth: 340 }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <select
          aria-label="Filtru clasă"
          className={styles.input}
          style={{ width: 'auto' }}
          value={course}
          onChange={(e) => setCourse(e.target.value)}
        >
          {courses.map((c) => (
            <option key={c} value={c}>{c === 'toate' ? 'Toate clasele' : c}</option>
          ))}
        </select>
        <span style={{ fontSize: '0.75rem', color: 'var(--km-ink3)', fontVariantNumeric: 'tabular-nums' }}>
          {visible.length} lecții
        </span>
      </div>

      {error ? <p className={styles.error} style={{ marginTop: '1rem' }}>{error}</p> : null}
      {notice ? <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--km-ink2)' }}>{notice}</p> : null}

      <div style={{ marginTop: '1rem', display: 'grid', gap: '0.25rem' }}>
        {lessons === null && !error ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--km-ink3)' }}>Se încarcă…</p>
        ) : null}
        {visible.map((l) => (
          <div key={l.id} className={styles.row}>
            <button className={styles.rowMain} onClick={() => void openEditor(l.id)}>
              <span className={l.frontmatterOk ? styles.rowTitle : styles.rowTitleBad}>{l.title}</span>
              <span className={styles.rowId}>{l.id}</span>
            </button>
            <button
              className={l.hidden ? styles.pillOff : styles.pillOn}
              onClick={() => void toggleHidden(l)}
              title={l.hidden ? 'Ascunsă din sidebar — apasă pentru a o publica' : 'Publicată — apasă pentru a o ascunde din sidebar'}
            >
              {l.hidden ? null : <IconCheck size={12} />}
              {l.hidden ? 'Ascunsă' : 'Publicată'}
            </button>
            <button className={styles.iconBtn} onClick={() => void remove(l)} aria-label={`Șterge ${l.title}`} title="Șterge lecția">
              <IconX size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreateForm({ lessons, onCreate }) {
  const [course, setCourse] = React.useState('c5');
  const [module, setModule] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [err, setErr] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (![course, module, slug].every((v) => /^[a-z0-9-]+$/.test(v))) {
      setErr('Clasa/modulul/slug-ul: doar litere mici, cifre și cratimă.');
      return;
    }
    if (lessons.some((l) => l.id === `${course}/${module}/${slug}`)) {
      setErr('Există deja o lecție cu acest slug.');
      return;
    }
    setBusy(true);
    try {
      const ok = await onCreate({ course, module, slug, title });
      if (!ok) setErr('Crearea nu a mers.');
    } finally {
      setBusy(false);
    }
  }

  const FIELDS = [
    ['Clasa (curs)', course, setCourse, 'c5'],
    ['Modul', module, setModule, 'modul-1'],
    ['Slug fișier', slug, setSlug, '08'],
  ];

  return (
    <form className={styles.createForm} onSubmit={submit}>
      {FIELDS.map(([label, value, set, placeholder]) => (
        <label key={label} className={styles.createLabel}>
          {label}
          <input className={styles.input} style={{ width: 110 }} value={value} placeholder={placeholder} required onChange={(e) => set(e.target.value)} />
        </label>
      ))}
      <label className={styles.createLabel} style={{ flex: 1, minWidth: 200 }}>
        Titlu
        <input className={styles.input} value={title} placeholder="Titlul lecției" required onChange={(e) => setTitle(e.target.value)} />
      </label>
      <button type="submit" className={styles.btn} disabled={busy}>
        {busy ? 'Se creează…' : 'Creează'}
      </button>
      {err ? <p className={styles.error} style={{ width: '100%', margin: 0 }}>{err}</p> : null}
    </form>
  );
}

// ---- pagina ----------------------------------------------------------------

export default function AdminPage() {
  const [session, setSession] = React.useState(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      setSession({ token, name: localStorage.getItem(NAME_KEY) || 'Admin' });
    }
  }, []);

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(NAME_KEY);
    setSession(null);
  }

  return (
    <Layout title="Administrare" description="Panoul de administrare Edumat58" noFooter>
      <div className={styles.root}>
        {!mounted ? null : session ? (
          <LessonManager token={session.token} name={session.name} onLogout={logout} />
        ) : (
          <div className={styles.center}>
            <LoginCard onLogin={(data) => setSession({ token: data.token, name: data.name || data.email })} />
          </div>
        )}
      </div>
    </Layout>
  );
}
