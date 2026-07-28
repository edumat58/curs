/**
 * Din cuvintele rostite (granițele de la Azure) → jetoane de subtitrare, unde
 * expresiile matematice sunt REASAMBLATE ca LaTeX pentru randare KaTeX.
 *
 * Motivul: pentru voce, `toSpeakable` transformă „3×10000+7×1000" în cuvinte —
 * „3 înmulțit cu 10000, plus 7 înmulțit cu 1000" — ca Azure să le rostească
 * corect, în ordine. Dar CITITE pe ecran, cuvintele acelea sunt urâte; elevul
 * vrea să VADĂ matematica: `3 × 10000 + 7 × 1000`. Aici facem drumul invers:
 * recunoaștem secvențele de cuvinte-operator și le lipim înapoi în simboluri,
 * apoi grupăm o expresie întreagă (număr operator număr …) într-un singur jeton
 * „math" pe care playerul îl randează cu KaTeX. Proza rămâne jeton cu jeton, ca
 * evidențierea pe cuvânt să meargă mai departe pentru text.
 *
 * Fiecare jeton păstrează timpii (t = start ms, d = durată ms) — uniunea
 * timpilor cuvintelor din care e făcut — deci sincronizarea rămâne exactă: un
 * grup matematic se aprinde cât e rostit, o proză cuvânt cu cuvânt.
 */

/** Un cuvânt e „număr"? (întreg sau zecimal cu virgulă/punct.) */
function esteNumar(w) {
  return /^-?\d[\d.,]*$/.test(String(w || '').trim());
}

/** Numărul, pregătit pentru KaTeX: virgula zecimală lipită, fără spațiere. */
function numarKatex(w) {
  return String(w).replace(/,/g, '{,}');
}

/**
 * Operatori INFIX pe una sau două cuvinte: leagă două numere.
 * Cheia e secvența de cuvinte (minuscule), valoarea e LaTeX-ul.
 */
const INFIX = [
  { cuv: ['înmulțit', 'cu'], latex: ' \\times ' },
  { cuv: ['împărțit', 'la'], latex: ' \\div ' },
  { cuv: ['egal', 'cu'], latex: ' = ' },
  { cuv: ['plus'], latex: ' + ' },
  { cuv: ['minus'], latex: ' - ' },
];

/** Operatori POSTFIX: se lipesc de numărul dinainte (puteri). */
const POSTFIX = [
  { cuv: ['la', 'pătrat'], latex: '^{2}' },
  { cuv: ['la', 'cub'], latex: '^{3}' },
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
 * @returns {Array<{tip:'text'|'math', text?:string, latex?:string, t:number, d:number}>}
 */
export function construiesteTokeni(words) {
  if (!Array.isArray(words) || !words.length) return [];
  const out = [];
  let i = 0;

  while (i < words.length) {
    // O expresie matematică începe DOAR de la un număr — altfel „plus" dintr-o
    // enumerare de proză nu declanșează o formulă.
    if (esteNumar(words[i].w)) {
      const start = words[i];
      let latex = numarKatex(words[i].w);
      let ultim = words[i];
      let j = i + 1;
      let aCrescut = true;

      while (aCrescut && j < words.length) {
        aCrescut = false;

        // postfix (putere) lipit de ce am construit până acum
        for (const op of POSTFIX) {
          if (potrivesteSecventa(words, j, op.cuv)) {
            latex += op.latex;
            ultim = words[j + op.cuv.length - 1];
            j += op.cuv.length;
            aCrescut = true;
            break;
          }
        }
        if (aCrescut) continue;

        // infix (operator între numere): operatorul + un număr după el
        for (const op of INFIX) {
          if (potrivesteSecventa(words, j, op.cuv)) {
            const dupa = words[j + op.cuv.length];
            if (dupa && esteNumar(dupa.w)) {
              latex += op.latex + numarKatex(dupa.w);
              ultim = dupa;
              j += op.cuv.length + 1;
              aCrescut = true;
              break;
            }
          }
        }
      }

      // Un singur număr, fără operatori în jur, nu merită tratat ca „formulă":
      // se afișează ca text obișnuit, ca să rămână evidențierea pe cuvânt.
      if (j === i + 1) {
        out.push({ tip: 'text', text: words[i].w, t: words[i].t, d: words[i].d });
        i += 1;
      } else {
        out.push({
          tip: 'math',
          latex,
          t: start.t,
          d: Math.max(1, ultim.t + ultim.d - start.t),
        });
        i = j;
      }
    } else {
      out.push({ tip: 'text', text: words[i].w, t: words[i].t, d: words[i].d });
      i += 1;
    }
  }

  return out;
}
