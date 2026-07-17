/**
 * Backend Edumat58 (Vercel, Express):
 *  - /send-error-report  — raportarea erorilor din lecții (email, ca până acum)
 *  - /admin/*            — panoul de admin: login EduConnect+ (doar conturi
 *                          staff cu rol de administrator) + citire/scriere
 *                          lecții. Site-ul fiind static (GitHub Pages),
 *                          salvările se fac prin commit în repo-ul
 *                          edumat58/curs; Action-ul „Deploy Docusaurus"
 *                          republică site-ul automat la fiecare push pe main.
 *
 * Mod local de dezvoltare: cu LOCAL_DOCS_DIR setat, lecțiile se citesc/scriu
 * pe disc în loc de GitHub; cu LOCAL_ADMIN_PASSWORD setat, contul „admin" se
 * verifică fără bază de date (doar dev — nu se setează în producție).
 */

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');

const app = express();

app.use(cors({
  origin: [
    'https://edumat58.github.io',
    'https://edumat58.kulturosfera.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3480',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '2mb' }));

// ---------------------------------------------------------------------------
// Email (neschimbat funcțional)
// ---------------------------------------------------------------------------

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'eduprof.uruguay@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

app.post('/send-error-report', async (req, res) => {
  try {
    const { pageUrl, description } = req.body;

    const mailOptions = {
      from: process.env.GMAIL_USER || 'eduprof.uruguay@gmail.com',
      to: 'asbri.sebastian@gmail.com',
      subject: `Raporteaza o eroare - ${pageUrl}`,
      text: `
URL pagină: ${pageUrl}

Descriere problemă:
${description || 'Nu a fost furnizată o descriere.'}

---
Raport generat automat din cursurile online
Data: ${new Date().toLocaleString('ro-RO')}
      `.trim(),
    };

    const result = await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Email trimis cu succes', messageId: result.messageId });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, message: 'Eroare la trimiterea email-ului', error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// EduConnect+ — autentificare staff (aceeași verificare ca în educode/edurev)
// ---------------------------------------------------------------------------

const ADMIN_ROLES = new Set(['admin', 'super-admin', 'inquisitor']);

let educonnectClientPromise = null;
function getEduconnectClient() {
  const uri = process.env.MONGODB_URI_EDUCONNECT;
  if (!uri) throw new Error('Lipsește MONGODB_URI_EDUCONNECT pe backend.');
  if (!educonnectClientPromise) {
    educonnectClientPromise = new MongoClient(uri).connect();
  }
  return educonnectClientPromise;
}

// Hash-ul platform-wide Kulturosfera: scrypt(parolă, PASSWORD_SALT, 64) → hex.
function verifyEduconnectPassword(password, storedHex) {
  const salt = process.env.PASSWORD_SALT;
  if (!salt) throw new Error('Lipsește PASSWORD_SALT pe backend.');
  const computed = crypto.scryptSync(password, salt, 64);
  let stored;
  try {
    stored = Buffer.from(storedHex, 'hex');
  } catch {
    return false;
  }
  if (stored.length !== computed.length) return false;
  return crypto.timingSafeEqual(computed, stored);
}

function jwtSecret() {
  if (process.env.ADMIN_JWT_SECRET) return process.env.ADMIN_JWT_SECRET;
  // doar în modul local de dezvoltare acceptăm un secret implicit
  if (process.env.LOCAL_ADMIN_PASSWORD) return 'edumat-local-dev-secret';
  throw new Error('Lipsește ADMIN_JWT_SECRET pe backend.');
}

app.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ error: 'Completează emailul și parola.' });
    }

    // Branch DB-less pentru dezvoltare locală (identic cu educode) — activ
    // DOAR dacă LOCAL_ADMIN_PASSWORD e setat și identificatorul e „admin".
    const localPw = process.env.LOCAL_ADMIN_PASSWORD;
    if (localPw && email.trim() === 'admin') {
      const a = Buffer.from(password);
      const b = Buffer.from(localPw);
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
        const token = jwt.sign({ email: 'admin@local', name: 'Admin local', role: 'admin' }, jwtSecret(), { expiresIn: '60d' });
        return res.json({ token, name: 'Admin local', email: 'admin@local' });
      }
      return res.status(401).json({ error: 'Nume de utilizator sau parolă greșite.' });
    }

    const client = await getEduconnectClient();
    const user = await client.db('educonnect').collection('users').findOne(
      { email: email.trim() },
      {
        projection: { password: 1, role: 1, email: 1, firstName: 1, lastName: 1 },
        collation: { locale: 'en', strength: 2 },
      },
    );

    if (!user || typeof user.password !== 'string' || !verifyEduconnectPassword(password, user.password)) {
      return res.status(401).json({ error: 'Nume de utilizator sau parolă greșite.' });
    }
    if (!ADMIN_ROLES.has(user.role)) {
      return res.status(403).json({ error: 'Contul tău Kulturosfera nu are drepturi de administrare.' });
    }

    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
    const token = jwt.sign({ email: user.email, name, role: 'admin' }, jwtSecret(), { expiresIn: '60d' });
    res.json({ token, name, email: user.email });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Autentificarea nu a reușit: ' + error.message });
  }
});

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Neautentificat.' });
  try {
    const payload = jwt.verify(token, jwtSecret());
    if (payload.role !== 'admin') return res.status(403).json({ error: 'Acces doar pentru administratori.' });
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Sesiunea a expirat — intră din nou.' });
  }
}

// ---------------------------------------------------------------------------
// Lecții — GitHub contents API (sau disc local în dezvoltare)
// ---------------------------------------------------------------------------

const REPO = process.env.GITHUB_REPO || 'edumat58/curs';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const LOCAL_DOCS_DIR = process.env.LOCAL_DOCS_DIR || null;

// doar fișiere de lecție din docs/, fără path traversal
function validLessonPath(p) {
  if (typeof p !== 'string' || p.includes('..') || p.includes('\\')) return false;
  return /^docs\/[a-z0-9._/-]+\.(md|mdx)$/i.test(p);
}

async function github(method, apiPath, body) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    const err = new Error('Backend-ul nu are GITHUB_TOKEN configurat — salvările în repo nu sunt încă activate.');
    err.status = 503;
    throw err;
  }
  const r = await fetch(`https://api.github.com${apiPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(data.message || `GitHub a răspuns cu ${r.status}.`);
    err.status = r.status;
    throw err;
  }
  return data;
}

app.get('/admin/config', requireAdmin, (req, res) => {
  res.json({
    mode: LOCAL_DOCS_DIR ? 'local' : 'github',
    repo: REPO,
    branch: BRANCH,
    githubReady: Boolean(process.env.GITHUB_TOKEN) || Boolean(LOCAL_DOCS_DIR),
  });
});

// GET /admin/lesson?path=docs/c5/modul-1/08.mdx → { raw, sha }
app.get('/admin/lesson', requireAdmin, async (req, res) => {
  try {
    const p = req.query.path;
    if (!validLessonPath(p)) return res.status(400).json({ error: 'Cale de lecție nevalidă.' });

    if (LOCAL_DOCS_DIR) {
      const abs = path.resolve(LOCAL_DOCS_DIR, p);
      if (!abs.startsWith(path.resolve(LOCAL_DOCS_DIR) + path.sep)) return res.status(400).json({ error: 'Cale de lecție nevalidă.' });
      if (!fs.existsSync(abs)) return res.status(404).json({ error: 'Lecția nu există.' });
      return res.json({ raw: fs.readFileSync(abs, 'utf8'), sha: 'local' });
    }

    const data = await github('GET', `/repos/${REPO}/contents/${encodeURI(p)}?ref=${BRANCH}`);
    const raw = Buffer.from(data.content || '', 'base64').toString('utf8');
    res.json({ raw, sha: data.sha });
  } catch (error) {
    if (error.status === 404) return res.status(404).json({ error: 'Lecția nu există.' });
    res.status(error.status || 500).json({ error: error.message });
  }
});

// PUT /admin/lesson { path, raw, sha?, message? } → commit pe main
app.put('/admin/lesson', requireAdmin, async (req, res) => {
  try {
    const { path: p, raw, sha, message } = req.body || {};
    if (!validLessonPath(p)) return res.status(400).json({ error: 'Cale de lecție nevalidă.' });
    if (typeof raw !== 'string' || !raw.trim()) return res.status(400).json({ error: 'Conținut lipsă.' });
    if (!/^---\r?\n[\s\S]*?\r?\n---/.test(raw)) return res.status(400).json({ error: 'Lecția trebuie să înceapă cu frontmatter (--- ... ---).' });

    if (LOCAL_DOCS_DIR) {
      const abs = path.resolve(LOCAL_DOCS_DIR, p);
      if (!abs.startsWith(path.resolve(LOCAL_DOCS_DIR) + path.sep)) return res.status(400).json({ error: 'Cale de lecție nevalidă.' });
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, raw, 'utf8');
      return res.json({ ok: true, savedTo: 'local' });
    }

    const body = {
      message: message || `Admin: actualizare ${p}`,
      content: Buffer.from(raw, 'utf8').toString('base64'),
      branch: BRANCH,
      committer: { name: 'Panou admin Edumat58', email: req.admin.email || 'admin@edumat58' },
    };
    if (sha && sha !== 'local') body.sha = sha;
    const data = await github('PUT', `/repos/${REPO}/contents/${encodeURI(p)}`, body);
    res.json({ ok: true, savedTo: 'github', sha: data.content?.sha, commit: data.commit?.sha });
  } catch (error) {
    if (error.status === 409) return res.status(409).json({ error: 'Fișierul s-a schimbat între timp în repo — redeschide lecția și aplică din nou modificarea.' });
    res.status(error.status || 500).json({ error: error.message });
  }
});

// DELETE /admin/lesson { path, sha, message? }
app.delete('/admin/lesson', requireAdmin, async (req, res) => {
  try {
    const { path: p, sha, message } = req.body || {};
    if (!validLessonPath(p)) return res.status(400).json({ error: 'Cale de lecție nevalidă.' });

    if (LOCAL_DOCS_DIR) {
      const abs = path.resolve(LOCAL_DOCS_DIR, p);
      if (!abs.startsWith(path.resolve(LOCAL_DOCS_DIR) + path.sep)) return res.status(400).json({ error: 'Cale de lecție nevalidă.' });
      if (!fs.existsSync(abs)) return res.status(404).json({ error: 'Lecția nu există.' });
      fs.unlinkSync(abs);
      return res.json({ ok: true, mode: 'deleted' });
    }

    if (!sha) return res.status(400).json({ error: 'Lipsește sha-ul fișierului.' });
    await github('DELETE', `/repos/${REPO}/contents/${encodeURI(p)}`, {
      message: message || `Admin: ștergere ${p}`,
      sha,
      branch: BRANCH,
      committer: { name: 'Panou admin Edumat58', email: req.admin.email || 'admin@edumat58' },
    });
    res.json({ ok: true, mode: 'deleted' });
  } catch (error) {
    if (error.status === 404) return res.status(404).json({ error: 'Lecția nu există.' });
    res.status(error.status || 500).json({ error: error.message });
  }
});

// POST /admin/lessons/bulk { changes: [{path, raw}], message? } — un singur
// commit pentru toate fișierele (Git Data API), ca republicarea să ruleze o dată.
app.post('/admin/lessons/bulk', requireAdmin, async (req, res) => {
  try {
    const { changes, message } = req.body || {};
    if (!Array.isArray(changes) || changes.length === 0 || changes.length > 300) {
      return res.status(400).json({ error: 'Lista de modificări trebuie să aibă între 1 și 300 de lecții.' });
    }
    for (const c of changes) {
      if (!c || !validLessonPath(c.path)) return res.status(400).json({ error: `Cale de lecție nevalidă: ${c && c.path}` });
      if (typeof c.raw !== 'string' || !c.raw.trim()) return res.status(400).json({ error: `Conținut lipsă pentru ${c.path}.` });
      if (!/^---\r?\n[\s\S]*?\r?\n---/.test(c.raw)) return res.status(400).json({ error: `Frontmatter lipsă în ${c.path}.` });
    }

    if (LOCAL_DOCS_DIR) {
      for (const c of changes) {
        const abs = path.resolve(LOCAL_DOCS_DIR, c.path);
        if (!abs.startsWith(path.resolve(LOCAL_DOCS_DIR) + path.sep)) return res.status(400).json({ error: 'Cale de lecție nevalidă.' });
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, c.raw, 'utf8');
      }
      return res.json({ ok: true, savedTo: 'local', count: changes.length });
    }

    const committer = { name: 'Panou admin Edumat58', email: req.admin.email || 'admin@edumat58' };
    const ref = await github('GET', `/repos/${REPO}/git/ref/heads/${BRANCH}`);
    const headSha = ref.object.sha;
    const headCommit = await github('GET', `/repos/${REPO}/git/commits/${headSha}`);
    const tree = await github('POST', `/repos/${REPO}/git/trees`, {
      base_tree: headCommit.tree.sha,
      tree: changes.map((c) => ({ path: c.path, mode: '100644', type: 'blob', content: c.raw })),
    });
    const commit = await github('POST', `/repos/${REPO}/git/commits`, {
      message: message || `Admin: actualizare în bulk (${changes.length} lecții)`,
      tree: tree.sha,
      parents: [headSha],
      author: committer,
      committer,
    });
    await github('PATCH', `/repos/${REPO}/git/refs/heads/${BRANCH}`, { sha: commit.sha });
    res.json({ ok: true, savedTo: 'github', count: changes.length, commit: commit.sha });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3002;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend Edumat58 pe portul ${PORT}`);
  });
}

module.exports = app;
