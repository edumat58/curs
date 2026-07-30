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
  return faraInvizibile(s)
    .toLowerCase()
    /**
     * Punctuația se ignoră la potrivire.
     *
     * De când semnele de punctuație de la Azure se lipesc de cuvânt (ca să se
     * vadă în transcript), titlul rostit vine „definiție." iar H2-ul din pagină e
     * „Definiție" — potrivirea pica și NICIUN titlu nu mai era clicabil. Comparăm
     * fără semne, la ambele capete.
     */
    .replace(/[.,;:!?…]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
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
/**
 * Un cuvânt rostit e „egal" cu un cuvânt de titlu și când diferă printr-o
 * SINGURĂ literă (cuvinte de 5+): administratorul corectează manual texte și o
 * greșeală măruntă de tastare nu are voie să rupă navigarea pe secțiuni.
 */
function cuvinteEgale(a, b) {
  if (a === b) return true;
  if (a.length < 5 || b.length < 5 || Math.abs(a.length - b.length) > 1) return false;
  // distanță de editare ≤ 1 (înlocuire, inserare sau ștergere)
  if (a.length === b.length) {
    let dif = 0;
    for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) { dif += 1; if (dif > 1) return false; }
    return true;
  }
  const [scurt, lung] = a.length < b.length ? [a, b] : [b, a];
  let i = 0; let j = 0; let sarite = 0;
  while (i < scurt.length && j < lung.length) {
    if (scurt[i] === lung[j]) { i += 1; j += 1; continue; }
    sarite += 1; if (sarite > 1) return false;
    j += 1;
  }
  return true;
}

/** Jetonul închide o propoziție? (punctuația e lipită de cuvânt la sinteză) */
function inchidePropozitia(text) {
  return /[.!?…]["”»)]?$/.test(String(text || '').trim());
}

export function marcheazaSectiuni(tokens, titluri, titluLectie) {
  if (!Array.isArray(tokens) || !tokens.length) return tokens;
  const out = tokens.map((t) => ({ ...t }));

  // liniuțele din titlu („G1 - Unghiuri…") nu se rostesc — afară înainte de split
  const cuvinteDin = (nume) => normalizeazaTitlu(nume).replace(/[-–—]/g, ' ').split(' ').filter(Boolean);
  const potriveste = (i, cuvinte) => {
    if (i + cuvinte.length > out.length) return false;
    for (let k = 0; k < cuvinte.length; k += 1) {
      if (!cuvinteEgale(normalizeazaTitlu(out[i + k].text), cuvinte[k])) return false;
    }
    return true;
  };
  const marcheaza = (i, n, nume, el) => {
    const grup = { nume: faraInvizibile(nume), sectiune: el, t: out[i].t };
    for (let k = 0; k < n; k += 1) out[i + k].grupTitlu = grup;
    return i + n;
  };

  /**
   * ORDONAT și PE GRANIȚE — lecția a dovedit de ce.
   *
   * Titlul lecției („G1 - Unghiuri adiacente și bisectoarea unui unghi") conține
   * numele secțiunilor, iar introducerea le pomenește și ea. Vechiul algoritm
   * marca PRIMA apariție a fiecărui titlu, oriunde: bucăți din titlul lecției
   * deveneau „secțiuni" clicabile, iar secțiunea reală — deja „folosită" — rămânea
   * text simplu. Acum:
   *   1. titlul LECȚIEI se potrivește întâi, la început, și consumă cuvintele lui;
   *   2. titlurile de secțiune se caută ÎN ORDINEA lor din lecție, fiecare DUPĂ
   *      precedentul (cursor monoton);
   *   3. un titlu se acceptă doar la GRANIȚĂ de propoziție — în text generat el e
   *      mereu propoziție de sine stătătoare; mențiunile din proză nu sunt.
   */
  let cursor = 0;
  if (titluLectie && titluLectie.nume) {
    const cuvinte = cuvinteDin(titluLectie.nume);
    for (let i = 0; i < Math.min(4, out.length) && cuvinte.length; i += 1) {
      if (potriveste(i, cuvinte)) { cursor = marcheaza(i, cuvinte.length, titluLectie.nume, titluLectie.el); break; }
    }
  }

  for (const h of (Array.isArray(titluri) ? titluri : [])) {
    const cuvinte = cuvinteDin(h.nume);
    if (!cuvinte.length) continue;
    let gasit = -1;
    // trecerea 1: doar pe granițe de propoziție
    for (let i = cursor; i < out.length; i += 1) {
      const inceputBun = i === 0 || inchidePropozitia(out[i - 1].text);
      if (inceputBun && potriveste(i, cuvinte) && inchidePropozitia(out[i + cuvinte.length - 1].text)) { gasit = i; break; }
    }
    // trecerea 2 (text editat manual, punctuație lipsă): fără granițe, tot ordonat
    if (gasit < 0) {
      for (let i = cursor; i < out.length; i += 1) {
        if (potriveste(i, cuvinte)) { gasit = i; break; }
      }
    }
    if (gasit >= 0) cursor = marcheaza(gasit, cuvinte.length, h.nume, h.el);
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
    // Punctuația lipită de cuvânt („plus,", „cu.") nu strică potrivirea: de când
    // semnele ajung în transcript, ele fac parte din jeton.
    const brut = String(w ? w.w : '').trim().toLowerCase().replace(/[.,;:!?…]+$/, '');
    if (!w || brut !== cuv[k]) return false;
  }
  return true;
}

/**
 * Transformă lista de cuvinte în jetoane de afișat.
 * @returns {Array<{text:string, t:number, d:number}>}
 */
/**
 * Simbolul lipit de literă („a=") primește spațiu la AFIȘARE.
 *
 * Sinteza raportează uneori simbolul împreună cu cuvântul următor, iar după ce
 * punem litera la loc rămâne „a=" — corect ca sunet, urât ca text. Aici e doar
 * afișare, deci nu atinge nici audio, nici timpii.
 */
function aeriseste(text) {
  return String(text).replace(/([\p{L}\d])([=+×÷−-])(?=$)/u, '$1 $2');
}

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
    out.push({ text: aeriseste(words[i].w), t: words[i].t, d: words[i].d });
    i += 1;
  }

  return out;
}
