/**
 * Din cuvintele rostite (granițele de la Azure) → jetoane de subtitrare, cu
 * matematica adusă la SIMBOLURI inline (× ÷ + − = puteri), nu lăsată ca vorbire.
 *
 * De ce simboluri Unicode, nu KaTeX: subtitrarea curge cuvânt cu cuvânt, cu
 * evidențiere sincronizată. Un bloc KaTeX e o formulă întreagă, indivizibilă —
 * într-un rând îngust se rupe pe verticală, umflă cutia și strică derularea. Un
 * simbol Unicode (`×`, `÷`, `²`) e un caracter obișnuit: se așază în rând ca
 * orice cuvânt, își păstrează timpul, și evidențierea pe cuvânt merge mai
 * departe. Pentru notația din lecții (înmulțiri, sume poziționale, puteri) e
 * exact ce trebuie; fracția rămâne cu `/`, nu stivuită.
 *
 * `toSpeakable` a transformat, pentru voce, „3×10000+7×1000" în „3 înmulțit cu
 * 10000, plus 7 înmulțit cu 1000". Aici facem drumul invers, DOAR pentru afișat:
 * recunoaștem secvențele de cuvinte-operator și le lipim înapoi în simbol.
 *
 * Fiecare jeton păstrează timpii (t = start ms, d = durată ms), uniunea
 * cuvintelor din care e făcut — deci sincronizarea rămâne exactă.
 */

/** Un cuvânt e „număr"? (întreg sau zecimal cu virgulă/punct.) */
function esteNumar(w) {
  return /^-?\d[\d.,]*$/.test(String(w || '').trim());
}

/**
 * Normalizează un titlu pentru comparație: scoate invizibilele (H2-urile din
 * Docusaurus au un zero-width space de la ancoră — „Definiție​" ≠ „Definiție"),
 * scoate un eventual „#" de ancoră, litere mici, un singur spațiu.
 */
function faraInvizibile(s) {
  return String(s || '')
    .replace(/[​‌‍⁠﻿­]/g, '')
    .replace(/#+\s*$/, '')
    .trim();
}
function normalizeazaTitlu(s) {
  return faraInvizibile(s).toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Marchează, în șirul de jetoane, TITLURILE de secțiune rostite.
 *
 * Modelul a pus „[[Definiție]]" înaintea fiecărei secțiuni, iar `toSpeakable` le-a
 * rostit ca titluri de sine stătătoare — deci apar în cuvinte („Definiție",
 * „Reprezentarea pozițională"…). Aici le recunoaștem după titlurile REALE ale
 * lecției (H2/H3 din pagină) și le legăm de secțiunea lor: la clic, elevul sare
 * exact acolo. Marcăm DOAR prima apariție a fiecărui titlu — anunțul secțiunii —
 * ca să nu prindem o pomenire ulterioară din proză.
 *
 * @param tokens jetoanele din construiesteTokeni
 * @param titluri [{nume, el}] — titlurile lecției, în ordine
 */
export function marcheazaSectiuni(tokens, titluri) {
  if (!Array.isArray(tokens) || !tokens.length || !Array.isArray(titluri) || !titluri.length) {
    return tokens;
  }
  const harta = titluri.map((t) => ({ ...t, cuvinte: normalizeazaTitlu(t.nume).split(' ') }));
  const folosite = new Set();
  const src = tokens.map((t) => ({ ...t }));
  const out = [];

  for (let i = 0; i < src.length; i += 1) {
    let contopit = false;
    for (const h of harta) {
      if (folosite.has(h.nume)) continue;
      const n = h.cuvinte.length;
      if (n === 0 || i + n > src.length) continue;
      const bucata = src.slice(i, i + n).map((t) => normalizeazaTitlu(t.text)).join(' ');
      if (bucata === h.cuvinte.join(' ')) {
        // Contopim cuvintele titlului într-UN jeton, cu textul real al H2-ului,
        // ca să-l randăm ca un titlu-bloc clicabil. Timpul = uniunea lor.
        const prim = src[i];
        const ultim = src[i + n - 1];
        out.push({
          text: faraInvizibile(h.nume),
          titlu: true,
          sectiune: h.el,
          t: prim.t,
          d: Math.max(1, ultim.t + ultim.d - prim.t),
        });
        folosite.add(h.nume);
        i += n - 1;
        contopit = true;
        break;
      }
    }
    if (!contopit) out.push(src[i]);
  }
  return out;
}

const SUPERSCRIPT = {
  0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹',
};

/** Operatori INFIX pe una sau două cuvinte, cu simbolul lor. */
const INFIX = [
  { cuv: ['înmulțit', 'cu'], sym: '×', matematic: true },
  { cuv: ['împărțit', 'la'], sym: '÷', matematic: true },
  { cuv: ['supra'], sym: '/', matematic: true },
  { cuv: ['egal', 'cu'], sym: '=', matematic: true },
  { cuv: ['plus'], sym: '+', matematic: false },
  { cuv: ['minus'], sym: '−', matematic: false },
];

/** Operatori POSTFIX: se lipesc de jetonul dinainte (puteri). */
const POSTFIX = [
  { cuv: ['la', 'pătrat'], sym: '²' },
  { cuv: ['la', 'cub'], sym: '³' },
];

/** Potrivește o listă de cuvinte-cheie la poziția i (comparație pe litere mici). */
function potrivesteSecventa(words, i, cuv) {
  for (let k = 0; k < cuv.length; k += 1) {
    const w = words[i + k];
    if (!w || String(w.w).trim().toLowerCase() !== cuv[k]) return false;
  }
  return true;
}

/**
 * Transformă lista de cuvinte în jetoane de afișat.
 * @returns {Array<{text:string, t:number, d:number}>}
 */
export function construiesteTokeni(words) {
  if (!Array.isArray(words) || !words.length) return [];
  const out = [];
  let i = 0;

  const extinde = (jeton, panaLa) => {
    jeton.d = Math.max(jeton.d || 1, panaLa.t + panaLa.d - jeton.t);
  };

  while (i < words.length) {
    // POSTFIX (putere) — se lipește de ultimul jeton numeric.
    let gasit = false;
    for (const op of POSTFIX) {
      if (potrivesteSecventa(words, i, op.cuv)) {
        const ult = out[out.length - 1];
        if (ult) { ult.text += op.sym; extinde(ult, words[i + op.cuv.length - 1]); }
        i += op.cuv.length;
        gasit = true;
        break;
      }
    }
    if (gasit) continue;

    // „la puterea N" → exponent Unicode al lui N, lipit de jetonul dinainte.
    if (potrivesteSecventa(words, i, ['la', 'puterea']) && words[i + 2] && /^\d+$/.test(words[i + 2].w)) {
      const ult = out[out.length - 1];
      const exp = [...words[i + 2].w].map((c) => SUPERSCRIPT[c] || c).join('');
      if (ult) { ult.text += exp; extinde(ult, words[i + 2]); }
      i += 3;
      continue;
    }

    // INFIX — operator între operanzi. Cele „matematice" (înmulțit/împărțit/egal)
    // se convertesc mereu; „plus"/„minus" doar între numere, ca să nu atingem
    // „în plus" din proză.
    for (const op of INFIX) {
      if (!potrivesteSecventa(words, i, op.cuv)) continue;
      const dupa = words[i + op.cuv.length];
      const inainteNumar = out.length && /[\d)²³⁰¹⁴-⁹]$/u.test(out[out.length - 1].text);
      const contextNumeric = (dupa && esteNumar(dupa.w)) || inainteNumar;
      if (!op.matematic && !contextNumeric) continue;
      out.push({ text: op.sym, t: words[i].t, d: words[i + op.cuv.length - 1].t + words[i + op.cuv.length - 1].d - words[i].t });
      i += op.cuv.length;
      gasit = true;
      break;
    }
    if (gasit) continue;

    // Cuvânt obișnuit.
    out.push({ text: words[i].w, t: words[i].t, d: words[i].d });
    i += 1;
  }

  return out;
}
