/**
 * Geometria metamorfozei cuvântului „Incluzivă" (vezi CuvantMorf.jsx).
 *
 * Stă separat de componentă, fără React, ca să poată fi rulată și verificată în
 * afara browserului: `node src/components/EduPasiHero/morf.test.mjs` desenează
 * stările intermediare cu exact funcțiile astea, nu cu o copie a lor.
 */

export const DECALAJ = 0.045; // cu cât pornește fiecare literă în urma celei dinainte

export const usor = (p) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);

/** Un `d` de SVG dintr-un interval de contururi. */
export function caleDin(contururi, dela, cate) {
  let d = '';
  for (let c = dela; c < dela + cate; c += 1) {
    const p = contururi[c];
    d += `M${p[0].toFixed(1)},${p[1].toFixed(1)}`;
    for (let i = 2; i < p.length; i += 2) d += `L${p[i].toFixed(1)},${p[i + 1].toFixed(1)}`;
    d += 'Z';
  }
  return d;
}

/** Câte contururi are prima literă — ea se colorează separat, ca inițială. */
export const cateAreInitiala = (font) => font.litere[0].contururi.length;

/** Un font întreg ca listă plată de contururi, cu literele așezate pe rând. */
export function aplatizeaza(font) {
  const iesire = [];
  for (const litera of font.litere) {
    for (const c of litera.contururi) {
      const punct = new Array(c.length);
      for (let i = 0; i < c.length; i += 2) {
        punct[i] = c[i] + litera.x;
        punct[i + 1] = c[i + 1];
      }
      iesire.push(punct);
    }
  }
  return iesire;
}

/**
 * Conturile la momentul `t` (0…1) între fontul `a` și fontul `b`.
 *
 * FORMA fiecărei litere pleacă puțin în urma celei dinainte, așa că
 * metamorfoza trece prin cuvânt ca un val. AȘEZAREA pe rând, în schimb, merge
 * cu același ceas pentru toate literele: dacă ar fi decalată și ea, o literă
 * ajunsă deja la avansul fontului lat s-ar sui peste vecina rămasă în urmă.
 */
export function amesteca(a, b, t, decalaj = DECALAJ) {
  const n = a.litere.length;
  const intindere = 1 + decalaj * (n - 1);
  const eAsezare = usor(Math.max(0, Math.min(1, t)));
  const iesire = [];

  for (let k = 0; k < n; k += 1) {
    const la = a.litere[k];
    const lb = b.litere[k];
    const local = Math.max(0, Math.min(1, t * intindere - k * decalaj));
    const eForma = usor(local);
    const x = la.x + (lb.x - la.x) * eAsezare;
    for (let c = 0; c < la.contururi.length; c += 1) {
      const pa = la.contururi[c];
      const pb = lb.contururi[c];
      const punct = new Array(pa.length);
      for (let i = 0; i < pa.length; i += 2) {
        punct[i] = pa[i] + (pb[i] - pa[i]) * eForma + x;
        punct[i + 1] = pa[i + 1] + (pb[i + 1] - pa[i + 1]) * eForma;
      }
      iesire.push(punct);
    }
  }
  return iesire;
}
