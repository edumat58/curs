/**
 * Împachetează lecțiile edumat58 ca HTML gata de randat în WebView, IDENTIC cu
 * site-ul, dar consumabil de aplicația mobilă (kulto) fără să aibă site-ul lângă.
 *
 * DE UNDE VINE SCRIPTUL ĂSTA. A trăit până acum în aplicație
 * (`kulto/scripts/build-lectii-html.mjs`) și citea cursul de pe discul
 * autorului. Consecința: o lecție ștearsă de pe site rămânea în aplicație până
 * când cineva își amintea să regenereze pachetul ȘI să publice o versiune nouă
 * în magazin. Autorul a cerut opusul: „dacă scot o pagină web cu vreo lecție, să
 * se vadă instant și în aplicație". Deci generarea s-a mutat AICI, unde trăiește
 * conținutul și de unde se face deploy-ul, iar rezultatul se publică pe web ca
 * orice altă resursă a site-ului. Aplicația îl descarcă și îl ține la zi.
 *
 * DE CE HTML ȘI NU BLOCURI NATIVE.
 * Traducerea MDX -> blocuri native pierde tot ce nu are corespondent nativ:
 * clasele reale ale evidențierilor, iconițele SVG ale admonițiilor,
 * rotunjirile, tabelele componentelor EduPAȘI. Autorul a cerut afișare COMPLET
 * IDENTICĂ cu site-ul. Singurul mod de a fi identic cu un site e să randezi CE
 * RANDEAZĂ SITE-UL: HTML-ul lui, cu CSS-ul lui, cu fonturile lui.
 *
 * DE UNDE VINE HTML-UL.
 * Din `build/`, adică din ce se publică, nu din serverul de dev. Din fiecare
 * pagină se ia DOAR containerul `theme-doc-markdown` plus lanțul de părinți până
 * la `#__docusaurus` — părinții contează, fiindcă lățimea și spațierea vin din
 * `.container`/`.row`/`.col`, nu din container. Navbar, bara laterală,
 * firimiturile, subsolul și butoanele de paginare rămân afară: navigația o face
 * aplicația.
 *
 * GAURA DE UMPLUT: MATEMATICA.
 * `src/components/Katex.jsx` randează prin `@matejmazur/react-katex`, care
 * desenează în browser, nu la build. În HTML-ul construit fiecare `<Katex>` lasă
 * un `<div></div>` GOL. Aplicația nu execută JS-ul site-ului, deci golurile ar
 * rămâne goale. Aici le umplem noi, la build, cu `katex.renderToString`.
 * (`src/theme/Math.jsx` — varianta inline — randează deja la build; n-are goluri.)
 *
 * Mutat în `curs`, dispare și o verificare care exista în versiunea din
 * aplicație: acolo se compara versiunea `katex` a site-ului cu cea a aplicației,
 * fiindcă erau două instalări diferite și clasele KaTeX se schimbă între
 * versiuni minore. Aici randează exact pachetul pe care îl cheamă și
 * `@matejmazur/react-katex`, din același `node_modules`. Nu mai există două
 * versiuni care să se depărteze.
 *
 * DE CE NU SE UMPLU „TOATE DIV-URILE GOALE, ÎN ORDINE".
 * Fiindcă nu toate vin din `<Katex>`-ul lecției. Componenta `TabelDescompunere`
 * (`src/components/Lectie/index.jsx`) cheamă și ea `<Katex>` în celulele
 * `celulaFractie` — în `edupasi/c5/modul-1/01` sunt 1 formulă în MDX și 7
 * div-uri goale în pagină. Umplute „în ordine", formulele lecției ar fi ajuns în
 * tabel și tabelul în text. Deci div-urile goale se împart în DOUĂ șiruri, după
 * părinte, și fiecare șir se verifică față de sursa lui:
 *   - în `td.celulaFractie` -> fracțiile din `randuri={[...]}` ale componentei
 *   - oriunde altundeva      -> blocurile `<Katex>` din MDX
 * Dacă un șir nu se potrivește la număr, lecția NU SE SCRIE și se raportează.
 *
 * UNDE SCRIE ȘI DE CE ÎN DOUĂ LOCURI.
 * Canonic în `static/app-lectii/` (de acolo îl ia Docusaurus la buildul următor
 * și de acolo îl servește `npm start`), plus o oglindă în `build/app-lectii/`.
 * Oglinda nu e lux: `static/` se copiază în `build/` ÎNAINTE ca scriptul ăsta să
 * ruleze — el are nevoie de `build/` ca să existe HTML-ul randat, deci rulează
 * ca `postbuild`. Fără oglindă, pachetul generat de rularea curentă n-ar ajunge
 * niciodată în ce se publică (CI publică `./build`), iar site-ul ar rămâne cu
 * pachetul de la buildul precedent.
 *
 * Rulare:  node scripts/build-app-lectii.mjs   (după `npm run build`)
 *          sau automat, ca `postbuild`.
 */

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import katex from 'katex'

const RADACINA = path.resolve(import.meta.dirname, '..')
const BUILD = path.join(RADACINA, 'build')
const DOCS = path.join(RADACINA, 'docs')
const KATEX_DIST = path.join(RADACINA, 'node_modules/katex/dist')

/** Numele dosarului e și bucata de adresă: `/curs/app-lectii/…`. */
const DOSAR = 'app-lectii'
const IESIRE = path.join(RADACINA, 'static', DOSAR)
const OGLINDA = path.join(BUILD, DOSAR)
const BAZA_WEB = `/curs/${DOSAR}/`

/* ------------------------------------------------------------------ *
 * Unelte mici de HTML
 * ------------------------------------------------------------------ */

/** Etichetele care nu se închid — nu intră pe stivă. */
const FARA_INCHIDERE = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
])

const ETICHETA = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g

/**
 * Bucata dintre `<div class="theme-doc-markdown …">` și `</div>`-ul lui, numărând
 * div-urile deschise. Un parser complet de HTML ar fi exagerat: aici ne trebuie
 * doar o pereche echilibrată, iar `<div>` nu e etichetă care se auto-închide.
 */
function containerLectie(html) {
  const start = html.indexOf('<div class="theme-doc-markdown')
  if (start < 0) return null
  const re = /<div\b[^>]*>|<\/div>/g
  re.lastIndex = start
  let adancime = 0
  let m
  while ((m = re.exec(html))) {
    adancime += m[0].startsWith('</') ? -1 : 1
    if (adancime === 0) return html.slice(start, m.index + m[0].length)
  }
  return null
}

/**
 * Lanțul de etichete deschise de la `<body>` până la containerul lecției.
 * Se copiază din pagina construită, nu se scrie de mână: clasele sunt module CSS
 * cu hash (`docItemCol_VOVn`) — se schimbă la fiecare build al site-ului.
 */
function lantParinti(html, pozitieContainer) {
  const stiva = []
  ETICHETA.lastIndex = html.indexOf('<body')
  let m
  while ((m = ETICHETA.exec(html))) {
    if (m.index >= pozitieContainer) break
    const nume = m[2].toLowerCase()
    if (FARA_INCHIDERE.has(nume)) continue
    if (m[1]) {
      while (stiva.length && stiva.pop().nume !== nume) { /* recuperare din nepotriviri */ }
    } else if (!m[3].endsWith('/')) {
      stiva.push({ nume, eticheta: m[0] })
    }
  }
  return stiva
}

/**
 * Div-urile goale din corp, fiecare cu răspunsul la „stă într-o celulă
 * `celulaFractie`?". Asta e ce separă formulele lecției de cele ale componentelor.
 */
function divuriGoale(corp) {
  const gasite = []
  const stiva = []
  ETICHETA.lastIndex = 0
  let m
  while ((m = ETICHETA.exec(corp))) {
    const nume = m[2].toLowerCase()
    if (FARA_INCHIDERE.has(nume)) continue
    if (m[1]) {
      // `<div></div>`: eticheta de închidere vine imediat după cea de deschidere.
      const varf = stiva[stiva.length - 1]
      if (varf && varf.nume === 'div' && varf.sfarsit === m.index && varf.eticheta === '<div>') {
        gasite.push({
          start: varf.start,
          sfarsit: m.index + m[0].length,
          inCelulaFractie: stiva.some((e) => e.eticheta.includes('celulaFractie')),
        })
      }
      while (stiva.length && stiva.pop().nume !== nume) { /* recuperare */ }
    } else if (!m[3].endsWith('/')) {
      stiva.push({ nume, eticheta: m[0], start: m.index, sfarsit: ETICHETA.lastIndex })
    }
  }
  return gasite
}

/* ------------------------------------------------------------------ *
 * Sursa formulelor
 * ------------------------------------------------------------------ */

/**
 * Blocurile `<Katex>` din MDX, în ordinea din fișier.
 * Conținutul e mereu un literal cu accente grave — `{String.raw`…`}` — deci se
 * ia între primul și ultimul accent grav dinăuntru.
 */
function formuleDinMdx(mdx) {
  const out = []
  const re = /<Katex\b[^>]*>([\s\S]*?)<\/Katex>/g
  let m
  while ((m = re.exec(mdx))) {
    const inner = m[1]
    const a = inner.indexOf('`')
    const b = inner.lastIndexOf('`')
    out.push(a >= 0 && b > a ? inner.slice(a + 1, b) : null)
  }
  return out
}

/** Grupele de trei, ca în `grupeaza` din src/components/Lectie/index.jsx. */
function grupeaza(numar) {
  return String(numar).replace(/\B(?=(\d{3})+(?!\d))/g, '\\,')
}

/** „26478/1000" -> `\dfrac{26\,478}{1000}`. Copiat din `fractieTeX` al site-ului. */
function fractieTeX(text) {
  const bucati = String(text).split('/')
  if (bucati.length !== 2) return String(text)
  return `\\dfrac{${grupeaza(bucati[0].trim())}}{${bucati[1].trim()}}`
}

/**
 * Fracțiile din `<TabelDescompunere randuri={[…]} />`, în ordine.
 * Fiecare rând e „fracție | cifre | rezultat", iar `*` marchează rândul-model.
 */
function fractiiDinMdx(mdx) {
  const out = []
  const re = /<TabelDescompunere\b([\s\S]*?)\/>/g
  let m
  while ((m = re.exec(mdx))) {
    const lista = /randuri=\{\[([\s\S]*?)\]\}/.exec(m[1])
    if (!lista) continue
    for (const sir of lista[1].matchAll(/'([^']*)'|"([^"]*)"/g)) {
      const brut = (sir[1] ?? sir[2]).split('|')[0].trim()
      out.push(fractieTeX(brut.startsWith('*') ? brut.slice(1).trim() : brut))
    }
  }
  return out
}

/**
 * Ce pune react-katex în pagină la hidratare: un `<div>` cu HTML-ul KaTeX.
 * `throwOnError:false` lasă formula greșită să apară roșie, ca pe site, în loc
 * să oprească build-ul.
 */
function randeaza(tex) {
  return `<div>${katex.renderToString(tex, { displayMode: true, throwOnError: false })}</div>`
}

/* ------------------------------------------------------------------ *
 * Indiciul de scroll orizontal
 * ------------------------------------------------------------------ */

/**
 * Port în JS simplu al lui `src/components/ScrollOrizontal/index.jsx`.
 *
 * DE CE E NEVOIE DE EL. Desenul indiciului (umbra care stinge conținutul spre
 * marginea unde mai urmează ceva) e în CSS-ul temei, pe care îl împachetăm — dar
 * se aplică doar elementelor cu `data-scroll-x`. Atributul se pune la RULARE,
 * fiindcă „mai e ceva la dreapta" depinde de `scrollLeft` și de lățimea reală,
 * lucruri pe care un build nu le știe. Fără scriptul ăsta, formulele lungi și
 * tabelele largi s-ar putea trage la fel, dar fără niciun semn că se pot trage —
 * exact ce s-a reproșat înainte pe site.
 *
 * Ce s-a scos față de original: `useLocation` și ciclul de viață React (aici
 * pagina nu se schimbă fără reîncărcare) și observatorul de preferințe EduPAȘI
 * (aplicația nu scrie atribute pe `<html>`). Restul — pragurile, ordinea
 * măsurare-apoi-scriere, așteptarea fonturilor — e identic.
 */
const SCRIPT_SCROLL = `
(function () {
  var CANDIDATI = 'div, figure, table, section, aside, span.katex-display';
  var EXCEPTII = 'pre, [class*="codeBlock"], .katex';
  var PRAG = 4, MARGINE = 2;

  function stare(el, depasire) {
    if (depasire <= PRAG) return null;
    if (el.scrollLeft <= MARGINE) return 'start';
    if (el.scrollLeft >= depasire - MARGINE) return 'end';
    return 'mid';
  }
  function aplica(el, valoare) {
    if (valoare) { if (el.dataset.scrollX !== valoare) el.dataset.scrollX = valoare; }
    else if (el.dataset.scrollX) { delete el.dataset.scrollX; }
  }
  function marcheaza() {
    var zona = document.querySelector('main') || document.body;
    if (!zona) return;
    var masuratori = [];
    zona.querySelectorAll(CANDIDATI).forEach(function (el) {
      if (el.closest(EXCEPTII)) return;
      var depasire = el.scrollWidth - el.clientWidth;
      if (depasire <= PRAG) { masuratori.push([el, null]); return; }
      var overflow = getComputedStyle(el).overflowX;
      var scrollabil = overflow === 'auto' || overflow === 'scroll';
      masuratori.push([el, scrollabil ? stare(el, depasire) : null]);
    });
    masuratori.forEach(function (p) { aplica(p[0], p[1]); });
  }
  function laDerulare(ev) {
    var el = ev.target;
    if (!el || el.nodeType !== 1 || !el.dataset || !el.dataset.scrollX) return;
    aplica(el, stare(el, el.scrollWidth - el.clientWidth));
  }

  var cadru = null, rezerva = null;
  function executa() {
    if (cadru) cancelAnimationFrame(cadru);
    if (rezerva) clearTimeout(rezerva);
    cadru = null; rezerva = null;
    marcheaza();
  }
  function cere() {
    if (cadru || rezerva) return;
    cadru = requestAnimationFrame(executa);
    rezerva = setTimeout(executa, 300);
  }

  cere();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(cere).catch(function () {});
  window.addEventListener('resize', cere);
  window.addEventListener('orientationchange', cere);
  document.addEventListener('scroll', laDerulare, { capture: true, passive: true });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) cere(); });
})();
`

/* ------------------------------------------------------------------ *
 * Ce lecții intră în pachet
 * ------------------------------------------------------------------ */

/**
 * CE INTRĂ. `docs/c5..c8/modul-*` (cursul de matematică) și
 * `docs/edupasi/c5..c8/modul-*` (aceleași lecții, scrise pas cu pas). Ierarhia
 * clasă > modul > lecție se ia din foldere.
 *
 * DE CE SE ENUMERĂ AICI, ȘI NU SE CITEȘTE UN INDEX. Versiunea din aplicație
 * citea `kulto/assets/lectii-index.json`, adică un fișier generat de un ALT
 * script, din altă rulare. Un pachet care se publică pe web nu poate depinde de
 * starea în care a fost lăsat discul altcuiva: lista lecțiilor e a lui `docs/`,
 * deci se citește direct din `docs/`. `id`-ul are exact forma pe care o
 * construiește și catalogul aplicației (`raft:clasa/modul/slug`), fiindcă el e
 * cheia după care aplicația leagă o fișă de catalog cu fișierul ei HTML.
 *
 * NU INTRĂ: fișierele care încep cu `_` (excluse și din build-ul site-ului),
 * cele cu `hide`/`draft` în frontmatter, și orice nu stă într-un folder
 * `modul-*` (organigrame, programa adaptată, coperți de raft, pagini de site).
 */
const CLASE = ['c5', 'c6', 'c7', 'c8']

function frontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
  if (!m) return {}
  const fm = {}
  for (const rand of m[1].split('\n')) {
    const per = /^([a-zA-Z_]+):\s*(.*)$/.exec(rand)
    if (!per || per[2] === '') continue
    let v = per[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    fm[per[1]] = v
  }
  return fm
}

/**
 * Titlul lecției, în aceeași ordine de preferințe pe care o folosește catalogul
 * aplicației: frontmatter, apoi primul `# ` din text, apoi eticheta de bară,
 * apoi numele fișierului. Se curăță de marcajele de markdown care ar ajunge
 * literale în `<title>`.
 */
function titlulLectiei(fm, corp, slug) {
  const h1 = /^#\s+(.+)$/m.exec(corp)
  return (
    (fm.title || '').trim() ||
    (h1 ? h1[1].replace(/[*`]/g, '').trim() : '') ||
    (fm.sidebar_label || '').trim() ||
    slug
  )
}

function lectiileDinDocs(raport) {
  const lectii = []
  for (const raft of ['matematica', 'edupasi']) {
    const rad = raft === 'edupasi' ? path.join(DOCS, 'edupasi') : DOCS
    for (const clasa of CLASE) {
      const dirClasa = path.join(rad, clasa)
      if (!fs.existsSync(dirClasa)) continue
      for (const intrare of fs.readdirSync(dirClasa, { withFileTypes: true })) {
        if (!intrare.isDirectory() || !/^modul-/.test(intrare.name)) continue
        const dirModul = path.join(dirClasa, intrare.name)
        const fisiere = fs
          .readdirSync(dirModul)
          .filter((f) => /\.mdx?$/.test(f) && !f.startsWith('_'))
          .sort((a, b) => a.localeCompare(b, 'ro', { numeric: true }))
        for (const fisier of fisiere) {
          const cale = path.join(dirModul, fisier)
          const brut = fs.readFileSync(cale, 'utf8')
          const fm = frontmatter(brut)
          if (String(fm.hide) === 'true' || String(fm.draft) === 'true') {
            raport.ascunse.push(path.relative(DOCS, cale))
            continue
          }
          const slug = fisier.replace(/\.mdx?$/, '')
          lectii.push({
            id: `${raft}:${clasa}/${intrare.name}/${slug}`,
            titlu: titlulLectiei(fm, brut, slug),
            cale,
            fm,
          })
        }
      }
    }
  }
  return lectii.sort((a, b) => a.id.localeCompare(b.id, 'ro', { numeric: true }))
}

/**
 * Pagina construită NU stă neapărat la calea fișierului, ci la `slug`-ul din
 * frontmatter: `docs/c5/modul-4/00.mdx` are
 * `slug: /arhiva/an-scolar-2025-2026/c5/modul-4/00`. 13 din cele 289 de lecții
 * se mută așa; căutate după cale, ar fi lipsit.
 *
 * Semantica slugului e a Docusaurus și e scrisă și în `docusaurus.config.js`:
 * cu „/" la început e relativ la `routeBasePath` („docs"), altfel e relativ la
 * folderul fișierului. Fără slug, adresa e chiar calea din `docs/` — cazul ăsta
 * nu apare azi în nicio lecție, dar o linie ștearsă din frontmatter n-are voie
 * să scoată lecția din pachet fără explicație.
 */
function paginaLectiei(lectie) {
  const relativCale = path.relative(DOCS, lectie.cale).replace(/\.mdx?$/, '')
  const slug = (lectie.fm.slug || '').trim()
  let ruta
  if (!slug) ruta = relativCale
  else if (slug.startsWith('/')) ruta = slug.slice(1)
  else ruta = path.join(path.dirname(relativCale), slug)
  return path.join(BUILD, 'docs', `${ruta}.html`)
}

/** `matematica:c5/modul-1/01` -> `matematica-c5-modul-1-01.html`, plat. */
function numeFisier(id) {
  return id.replace(/[:/]/g, '-') + '.html'
}

/* ------------------------------------------------------------------ *
 * Foaia de stil și fonturile
 * ------------------------------------------------------------------ */

const numeActiv = new Set()

/** Copiază fișierul o singură dată și întoarce calea relativă din HTML. */
function adu(sursa, subdir, nume = path.basename(sursa)) {
  const tinta = path.join(IESIRE, subdir, nume)
  if (!numeActiv.has(tinta)) {
    fs.mkdirSync(path.dirname(tinta), { recursive: true })
    fs.copyFileSync(sursa, tinta)
    numeActiv.add(tinta)
  }
  return `${subdir}/${nume}`
}

/**
 * Rescrie adresele absolute ale site-ului (`/curs/…`) ca adrese locale.
 *
 * Pachetul trebuie să rămână AUTONOM: aplicația îl scrie într-un dosar al ei și
 * deschide fișierul de pe disc, unde „/curs/assets/fonts/X.woff2" n-ar cere
 * nimic de la nimeni.
 */
function localizeazaCss(css) {
  return css.replace(/url\((["']?)(\/curs\/[^)"']+)\1\)/g, (intreg, ghilimea, adresa) => {
    const relativ = adresa.slice('/curs/'.length)
    const numeFont = path.basename(relativ)

    // Fonturile KaTeX din build au hash în nume (`KaTeX_Main-Bold-<hash>.woff2`)
    // și sunt IDENTICE ca octeți cu cele din pachetul `katex` (verificat cu
    // sha1). Le luăm din pachet, cu numele curat, ca să nu ținem aceleași 46 de
    // fonturi de două ori — o dată pentru katex.min.css, o dată pentru foaia
    // site-ului.
    const katexCurat = /^(KaTeX_[A-Za-z0-9]+-[A-Za-z]+)-[0-9a-f]{32}\.(woff2|woff|ttf)$/.exec(numeFont)
    if (katexCurat) {
      return `url(${adu(path.join(KATEX_DIST, 'fonts', `${katexCurat[1]}.${katexCurat[2]}`), 'fonts')})`
    }

    const peDisc = path.join(BUILD, relativ)
    if (!fs.existsSync(peDisc)) return intreg
    const subdir = /\.(woff2?|ttf|otf|eot)$/i.test(numeFont) ? 'fonts' : 'img'
    return `url(${adu(peDisc, subdir)})`
  })
}

/* ------------------------------------------------------------------ *
 * Rularea
 * ------------------------------------------------------------------ */

if (!fs.existsSync(BUILD)) {
  throw new Error('nu există build/ — scriptul rulează DUPĂ `npm run build` (ca postbuild)')
}

fs.rmSync(IESIRE, { recursive: true, force: true })
fs.mkdirSync(IESIRE, { recursive: true })

// Foaia de stil: aceleași două fișiere, în aceeași ordine ca în `<head>`-ul
// site-ului — întâi katex.min.css (pe site vine de pe CDN; aici e din pachet,
// fiindcă aplicația trebuie să poată citi lecția și fără rețea), apoi foaia
// temei, care are ultimul cuvânt.
const numeFoaie = fs.readdirSync(path.join(BUILD, 'assets/css')).find((f) => /^styles\..*\.css$/.test(f))
if (!numeFoaie) throw new Error('nu găsesc build/assets/css/styles.*.css — buildul site-ului e incomplet')
const foaie = [
  fs.readFileSync(path.join(KATEX_DIST, 'katex.min.css'), 'utf8')
    .replace(/url\((["']?)fonts\/([^)"']+)\1\)/g, (_intreg, _g, nume) =>
      `url(${adu(path.join(KATEX_DIST, 'fonts', nume), 'fonts')})`),
  localizeazaCss(fs.readFileSync(path.join(BUILD, 'assets/css', numeFoaie), 'utf8')),
].join('\n')
fs.writeFileSync(path.join(IESIRE, 'lectie.css'), foaie)
fs.writeFileSync(path.join(IESIRE, 'lectie.js'), SCRIPT_SCROLL)

const raport = {
  scrise: 0,
  formuleMdx: 0,
  formuleTabel: 0,
  ascunse: [],
  nepotriviri: [],
  faraPagina: [],
  faraContainer: [],
  formuleFaraSursa: [],
  legaturiExterne: [],
  legaturiInterne: [],
}

const lectii = lectiileDinDocs(raport)
/** Rândurile de manifest ale lecțiilor, în ordinea id-ului. */
const intrari = []
const numeFolosite = new Map()

for (const lectie of lectii) {
  const id = lectie.id
  const mdx = fs.readFileSync(lectie.cale, 'utf8')

  const calePagina = paginaLectiei(lectie)
  if (!fs.existsSync(calePagina)) { raport.faraPagina.push(id); continue }
  const pagina = fs.readFileSync(calePagina, 'utf8')

  let corp = containerLectie(pagina)
  if (!corp) { raport.faraContainer.push(id); continue }

  // --- verificarea care oprește lecția, nu build-ul -------------------
  const goluri = divuriGoale(corp)
  const goluriMdx = goluri.filter((g) => !g.inCelulaFractie)
  const goluriTabel = goluri.filter((g) => g.inCelulaFractie)
  const formule = formuleDinMdx(mdx)
  const fractii = fractiiDinMdx(mdx)

  if (goluriMdx.length !== formule.length || goluriTabel.length !== fractii.length) {
    raport.nepotriviri.push({
      id,
      mdx: `${formule.length} <Katex> vs ${goluriMdx.length} div-uri`,
      tabel: `${fractii.length} fracții vs ${goluriTabel.length} celule`,
    })
    continue
  }

  // Se înlocuiește de la coadă la cap, ca indicii dinainte să rămână valabili.
  const umpluturi = [
    ...goluriMdx.map((g, i) => ({ ...g, tex: formule[i], fel: 'mdx' })),
    ...goluriTabel.map((g, i) => ({ ...g, tex: fractii[i], fel: 'tabel' })),
  ].sort((a, b) => b.start - a.start)

  for (const u of umpluturi) {
    if (u.tex == null) { raport.formuleFaraSursa.push(id); continue }
    corp = corp.slice(0, u.start) + randeaza(u.tex) + corp.slice(u.sfarsit)
    if (u.fel === 'mdx') raport.formuleMdx++
    else raport.formuleTabel++
  }

  // --- imagini și legături -------------------------------------------
  corp = corp.replace(/(src|href)="(\/curs\/[^"]+)"/g, (intreg, atr, adresa) => {
    const relativ = adresa.slice('/curs/'.length)
    const peDisc = path.join(BUILD, relativ)
    if (/\.(png|jpe?g|gif|svg|webp)$/i.test(relativ) && fs.existsSync(peDisc)) {
      return `${atr}="${adu(peDisc, 'img')}"`
    }
    // Legături către alte pagini ale site-ului. Rămân neatinse: aplicația le
    // prinde în `onShouldStartLoadWithRequest` și decide singură ce face.
    raport.legaturiInterne.push(`${id} -> ${adresa}`)
    return intreg
  })
  for (const m of corp.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)) {
    raport.legaturiExterne.push(`${id} -> ${m[1]}`)
  }

  // --- pagina de sine stătătoare -------------------------------------
  const parinti = lantParinti(pagina, pagina.indexOf('<div class="theme-doc-markdown'))
  const claseHtml = /<html[^>]*\sclass="([^"]*)"/.exec(pagina)?.[1] ?? ''
  const deschidere = parinti.map((p) => p.eticheta).join('\n')
  // Scriptul stă ultimul în `<body>`, ca pe site: măsoară lățimi, deci are nevoie
  // de tot conținutul deja în pagină. Într-un fișier separat, nu în pagină — altfel
  // s-ar repeta de 289 de ori, adică vreo jumătate de megaoctet degeaba.
  const inchidere = parinti
    .map((p) => `</${p.nume}>`)
    .reverse()
    .join('\n')
    .replace(/<\/body>$/, '<script src="lectie.js"></script>\n</body>')

  const document = `<!doctype html>
<html lang="ro" dir="ltr" class="${claseHtml}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${lectie.titlu.replace(/[<&]/g, (c) => (c === '<' ? '&lt;' : '&amp;'))}</title>
<link rel="stylesheet" href="lectie.css">
</head>
${deschidere}
${corp}
${inchidere}
</html>
`

  const nume = numeFisier(id)
  if (numeFolosite.has(nume)) throw new Error(`nume de fișier dublu: ${nume} (${id} și ${numeFolosite.get(nume)})`)
  numeFolosite.set(nume, id)
  fs.writeFileSync(path.join(IESIRE, nume), document)
  intrari.push({ id, fisier: nume, titlu: lectie.titlu })
  raport.scrise++
}

/* ------------------------------------------------------------------ *
 * MANIFESTUL — contractul dintre site și aplicație
 * ------------------------------------------------------------------ */

/**
 * DE CE SUMĂ DE CONTROL PE FIECARE FIȘIER. Pachetul are ~21 MB. Fără o sumă pe
 * fișier, aplicația are doar două purtări posibile, amândouă greșite: descarcă
 * tot la fiecare deschidere, sau nu află niciodată că o lecție s-a modificat
 * (data fișierului se schimbă la fiecare build al site-ului, chiar dacă textul
 * lecției nu s-a atins — deci nu poate fi criteriu). Cu suma, aplicația compară
 * și aduce doar ce s-a schimbat. Suma e a CONȚINUTULUI, deci un build care
 * regenerează identic nu produce nicio descărcare.
 *
 * DE CE ȘI O SUMĂ A PACHETULUI (`versiune`). Ca verificarea „s-a schimbat
 * ceva?" să fie o singură comparație de șiruri, nu 340. Se calculează din
 * numele și sumele tuturor fișierelor, deci se schimbă exact când se schimbă
 * conținutul pachetului — inclusiv când o lecție DISPARE, care e chiar cazul
 * cerut de autor.
 *
 * Ce NU e în manifest, dinadins: nicio cale absolută și nicio urmă de mașina pe
 * care s-a generat. `baza` e adresa publică relativă la gazdă, deci pachetul
 * merge la fel de pe GitHub Pages, de pe un server de probă sau din `npm run
 * serve`.
 */
function suma(cale) {
  return crypto.createHash('sha256').update(fs.readFileSync(cale)).digest('hex')
}

/** Toate fișierele din pachet, ca `fonts/X.woff2`, în ordine stabilă. */
function fisierePachet(dir, prefix = '') {
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const rel = prefix ? `${prefix}/${e.name}` : e.name
    if (e.isDirectory()) out.push(...fisierePachet(path.join(dir, e.name), rel))
    else out.push(rel)
  }
  return out
}

const alLectiilor = new Set(intrari.map((i) => i.fisier))
const toate = fisierePachet(IESIRE).filter((f) => f !== 'manifest.json')

/** Fișa unui fișier: nume, cât e și ce sumă are. */
function fisa(fisier) {
  const cale = path.join(IESIRE, fisier)
  return { fisier, octeti: fs.statSync(cale).size, suma: suma(cale) }
}

const lectiiManifest = intrari.map((i) => ({ id: i.id, titlu: i.titlu, ...fisa(i.fisier) }))
// Activele sunt tot restul: foaia de stil, scriptul, fonturile, imaginile.
// Aplicația le tratează la fel — un fișier cu o sumă — dar le ține deoparte,
// fiindcă ele îi trebuie TOATE, pe când lecțiile le poate aduce una câte una.
const activeManifest = toate.filter((f) => !alLectiilor.has(f)).map(fisa)

const octeti = (lista) => lista.reduce((s, f) => s + f.octeti, 0)
const octetiLectii = octeti(lectiiManifest)
const octetiActive = octeti(activeManifest)

// Versiunea pachetului: suma sumelor, în ordinea numelor. Scurtată la 16 cifre
// hexazecimale — destul ca două pachete diferite să nu se lovească, scurt cât să
// se poată ține într-o preferință și să se citească într-un jurnal.
const versiune = crypto
  .createHash('sha256')
  .update([...lectiiManifest, ...activeManifest].map((f) => `${f.fisier}:${f.suma}`).sort().join('\n'))
  .digest('hex')
  .slice(0, 16)

const manifest = {
  schema: 1,
  versiune,
  generat: new Date().toISOString(),
  baza: BAZA_WEB,
  algoritmSuma: 'sha256',
  css: 'lectie.css',
  js: 'lectie.js',
  numar: { lectii: lectiiManifest.length, active: activeManifest.length },
  octeti: { lectii: octetiLectii, active: octetiActive, total: octetiLectii + octetiActive },
  lectii: lectiiManifest,
  active: activeManifest,
}
fs.writeFileSync(path.join(IESIRE, 'manifest.json'), JSON.stringify(manifest))

/* ------------------------------------------------------------------ *
 * Oglinda în `build/`
 * ------------------------------------------------------------------ */

// Vezi antetul: `static/` s-a copiat în `build/` înainte ca scriptul să ruleze,
// deci pachetul de acum ar rata publicarea de acum. Se copiază ca ultim pas, cu
// dosarul vechi șters, ca o lecție dispărută să dispară și din oglindă.
fs.rmSync(OGLINDA, { recursive: true, force: true })
fs.cpSync(IESIRE, OGLINDA, { recursive: true })

/* ------------------------------------------------------------------ *
 * Raportul
 * ------------------------------------------------------------------ */

const grupa = (pred) => {
  const l = [...lectiiManifest, ...activeManifest].filter((f) => pred(f.fisier))
  return { numar: l.length, octeti: octeti(l) }
}
const html = grupa((f) => f.endsWith('.html'))
const cssjs = grupa((f) => f === 'lectie.css' || f === 'lectie.js')
const fonturi = grupa((f) => f.startsWith('fonts/'))
const imagini = grupa((f) => f.startsWith('img/'))
const mb = (n) => `${(n / 1048576).toFixed(2)} MB`
const kb = (n) => `${Math.round(n / 1024)} KB`

console.log(`pachet               ${DOSAR}  versiunea ${versiune}`)
console.log(`lecții în docs/      ${lectii.length}`)
console.log(`lecții scrise        ${raport.scrise}`)
console.log(`formule <Katex>      ${raport.formuleMdx}`)
console.log(`formule în tabele    ${raport.formuleTabel}`)
console.log(`ascunse (hide/draft) ${raport.ascunse.length}`)
console.log(`nepotriviri          ${raport.nepotriviri.length}`)
console.log(`fără pagină          ${raport.faraPagina.length}`)
console.log(`fără container       ${raport.faraContainer.length}`)
console.log('')
console.log(`HTML     ${String(html.numar).padStart(4)} fișiere  ${kb(html.octeti).padStart(9)}`)
console.log(`CSS+JS   ${String(cssjs.numar).padStart(4)} fișiere  ${kb(cssjs.octeti).padStart(9)}`)
console.log(`fonturi  ${String(fonturi.numar).padStart(4)} fișiere  ${kb(fonturi.octeti).padStart(9)}`)
console.log(`imagini  ${String(imagini.numar).padStart(4)} fișiere  ${kb(imagini.octeti).padStart(9)}`)
console.log(`fără fonturi              ${mb(manifest.octeti.total - fonturi.octeti).padStart(9)}`)
console.log(`TOTAL                     ${mb(manifest.octeti.total).padStart(9)}`)
console.log('')
console.log(`scris în   static/${DOSAR}/  și  build/${DOSAR}/`)
console.log(`public la  ${BAZA_WEB}manifest.json`)

if (raport.nepotriviri.length) {
  console.log(`\nNEPOTRIVIRI (lecții nescrise):`)
  for (const n of raport.nepotriviri) console.log(`  ${n.id}  mdx: ${n.mdx}  tabel: ${n.tabel}`)
}
for (const [eticheta, lista] of [
  ['ascunse în frontmatter (hide/draft)', raport.ascunse],
  ['fără pagină construită', raport.faraPagina],
  ['fără container theme-doc-markdown', raport.faraContainer],
  ['formule fără sursă în MDX', raport.formuleFaraSursa],
]) {
  if (lista.length) console.log(`\n${eticheta} (${lista.length}):\n  ${lista.join('\n  ')}`)
}
if (raport.legaturiInterne.length) {
  console.log(`\nlegături către site (rămân de tratat în aplicație, ${raport.legaturiInterne.length}):`)
  for (const l of raport.legaturiInterne) console.log(`  ${l}`)
}
if (raport.legaturiExterne.length) {
  console.log(`\nadrese externe (NU merg offline, ${raport.legaturiExterne.length}):`)
  for (const l of raport.legaturiExterne) console.log(`  ${l}`)
}
