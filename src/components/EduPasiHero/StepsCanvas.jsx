import React, { useEffect, useRef } from 'react';
import styles from './StepsCanvas.module.css';

/**
 * Grafica din eroul paginii EduPAȘI: REGRUPAREA RANGURILOR.
 *
 * Desenul nu e decor: e chiar ideea pe care o predă rubrica. Pătrățelele se adună
 * într-un rang, iar când se strâng zece se schimbă într-unul singur, cu un rang
 * mai la stânga — de la miimi spre sute, exact ca materialul de pe masă din
 * lecții. Cine a lucrat o lecție recunoaște coloanele, culorile și mișcarea.
 *
 * Varianta dinainte avea stea în patru colțuri, astrolab și inele rotitoare:
 * frumoase, dar dintr-o altă poveste, iar steaua citindu-se ca un shuriken. Aici
 * nu e nimic care să nu se regăsească într-o pagină de lecție.
 *
 * Culorile sunt exact cele din `src/components/Lectie`: bulina verde de la
 * „unități" e verdele de aici, în același loc al șirului.
 *
 * Compoziția stă în DREAPTA, fiindcă textul eroului stă în stânga, iar masca din
 * CSS topește animația spre el. Respectă `prefers-reduced-motion`: atunci se
 * desenează o singură stare, așezată, fără buclă.
 */

const RANGURI = [
  { eticheta: '100', culoare: '#b03a2a' },
  { eticheta: '10', culoare: '#5f9cbb' },
  { eticheta: '1', culoare: '#93a72f' },
  { eticheta: '0,1', culoare: '#86b1b5' },
  { eticheta: '0,01', culoare: '#c5808f' },
  { eticheta: '0,001', culoare: '#a9bd3f' },
];
const INDICE_UNITATI = 2; // după el vine virgula
const BLEU = '#003058';
const NEUTRU = '#5b6670'; // virgula și bara: gri, ca să nu ia culoarea niciunui rang

const cuAlpha = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/**
 * Scenariul, calculat o singură dată la încărcare: se adaugă un pătrat în rangul
 * cel mai mic, iar când un rang strânge zece, ele se schimbă într-unul singur cu
 * un rang mai sus. Se oprește înainte ca rangul cel mare să se umple, ca desenul
 * să nu iasă din cadru, apoi o ia de la capăt.
 */
function construiesteScenariul() {
  const cate = RANGURI.map(() => 0);
  const pasi = [];
  const limita = 60;

  while (pasi.length < limita) {
    const plin = cate.findIndex((n) => n >= 10);
    if (plin === 0) break; // s-a umplut și rangul cel mare
    if (plin > 0) {
      const inainte = cate.slice();
      cate[plin] = 0;
      cate[plin - 1] += 1;
      pasi.push({ tip: 'regrupare', coloana: plin, inainte, dupa: cate.slice() });
      continue;
    }
    const inainte = cate.slice();
    cate[RANGURI.length - 1] += 1;
    pasi.push({ tip: 'adauga', coloana: RANGURI.length - 1, inainte, dupa: cate.slice() });
  }
  pasi.push({ tip: 'reia', coloana: -1, inainte: cate.slice(), dupa: RANGURI.map(() => 0) });
  return pasi;
}

const SCENARIU = construiesteScenariul();
const DURATA_ADAUGA = 0.58;
const DURATA_REGRUPARE = 1.05;
const DURATA_RELUARE = 1.5;

const durataPasului = (pas) =>
  pas.tip === 'regrupare' ? DURATA_REGRUPARE : pas.tip === 'reia' ? DURATA_RELUARE : DURATA_ADAUGA;

const CICLU = SCENARIU.reduce((s, pas) => s + durataPasului(pas), 0);

const usor = (p) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);

export default function StepsCanvas() {
  const gazdaRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gazda = gazdaRef.current;
    if (!canvas || !gazda) return undefined;

    const ctx = canvas.getContext('2d');
    const redus = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let latime = 0;
    let inaltime = 0;
    let raf = 0;
    let pornire = 0;

    /* Paletele de accesibilitate au ultimul cuvânt: dacă elevul a ales „culori
       sigure" sau „contrast", desenul folosește accentul lor, nu paleta de rang. */
    const accentAles = () => {
      const root = document.documentElement;
      if (!root.hasAttribute('data-edupasi-palette')) return null;
      const val = getComputedStyle(root).getPropertyValue('--edupasi-accent').trim();
      return val || null;
    };

    const redimensioneaza = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = gazda.clientWidth || Math.round(gazda.getBoundingClientRect().width);
      const h = gazda.clientHeight || Math.round(gazda.getBoundingClientRect().height);
      if (w < 2 || h < 2) return false;
      if (w === latime && h === inaltime && canvas.width) return true;
      latime = w;
      inaltime = h;
      canvas.width = latime * dpr;
      canvas.height = inaltime * dpr;
      canvas.style.width = `${latime}px`;
      canvas.style.height = `${inaltime}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    };

    /* Coloanele stau în jumătatea dreaptă. Pe ecran îngust rămân doar rangurile
       mici — cele care încap fără să se îngrămădească — iar compoziția pornește
       de mai la stânga, fiindcă acolo masca lasă loc. */
    const geometrie = () => {
      const coloane = latime < 520 ? 4 : latime < 820 ? 5 : 6;
      const primul = RANGURI.length - coloane;
      const zonaX = latime * (latime < 720 ? 0.08 : 0.44);
      const zonaLat = Math.max(60, latime - zonaX - latime * 0.06);
      const pas = zonaLat / coloane;
      /* Linia de bază stă jos, ca pe o masă de lucru: coloanele cresc DIN ea, nu
         plutesc la mijlocul cadrului. Latura pătratului se strânge odată cu ea,
         altfel stiva de zece ar ieși din chenar (10 × 1,22 × latură). */
      const baza = inaltime * 0.78;
      const latPatrat = Math.max(6, Math.min(pas * 0.44, (baza - inaltime * 0.1) / 12.6));
      return { coloane, primul, zonaX, pas, latPatrat, baza };
    };

    const centrul = (g, i) => g.zonaX + (i - g.primul) * g.pas + g.pas / 2;
    const pasStivei = (g) => g.latPatrat * 1.22;
    const inaltimeStiva = (g, n) => n * pasStivei(g);

    const patrat = (g, x, yJos, culoare, alfa, scara = 1) => {
      const l = g.latPatrat * scara;
      ctx.fillStyle = cuAlpha(culoare, Math.max(0, Math.min(1, alfa)));
      ctx.beginPath();
      ctx.roundRect(x - l / 2, yJos - l, l, l, Math.max(1, l * 0.18));
      ctx.fill();
    };

    /** O coloană: banda palidă de rang, eticheta ei și stiva de pătrate. */
    const desenColoana = (g, i, cate, culoare, extra) => {
      const cx = centrul(g, i);
      const inaltBanda = inaltimeStiva(g, 10) + g.latPatrat * 0.6;

      ctx.fillStyle = cuAlpha(culoare, 0.1);
      ctx.beginPath();
      ctx.roundRect(
        cx - g.latPatrat * 0.8,
        g.baza - inaltBanda,
        g.latPatrat * 1.6,
        inaltBanda + g.latPatrat * 0.25,
        g.latPatrat * 0.8,
      );
      ctx.fill();

      ctx.fillStyle = cuAlpha(culoare, 0.75);
      ctx.font = `600 ${Math.max(9, g.latPatrat * 0.6)}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(RANGURI[i].eticheta, cx, g.baza + g.latPatrat * 1.4);

      for (let k = 0; k < cate; k += 1) {
        patrat(g, cx, g.baza - k * pasStivei(g), culoare, 0.85);
      }
      if (extra) extra(cx, culoare);
    };

    const deseneaza = (timp) => {
      if (!redimensioneaza()) {
        raf = requestAnimationFrame(deseneaza);
        return;
      }
      if (!pornire) pornire = timp;
      const t = redus ? CICLU * 0.42 : ((timp - pornire) / 1000) % CICLU;

      ctx.clearRect(0, 0, latime, inaltime);
      const g = geometrie();
      const accent = accentAles();

      // capetele zonei desenate — le folosește bara de sub coloane
      const stangaZona = centrul(g, g.primul) - g.pas * 0.55;
      const dreaptaZona = centrul(g, RANGURI.length - 1) + g.pas * 0.55;

      let acumulat = 0;
      let pas = SCENARIU[0];
      let p = 0;
      for (const candidat of SCENARIU) {
        const d = durataPasului(candidat);
        if (t < acumulat + d) {
          pas = candidat;
          p = usor((t - acumulat) / d);
          break;
        }
        acumulat += d;
      }
      const cate = pas.inainte;

      for (let i = g.primul; i < RANGURI.length; i += 1) {
        const culoare = accent || RANGURI[i].culoare;

        if (pas.tip === 'adauga' && i === pas.coloana) {
          desenColoana(g, i, cate[i], culoare, (cx) => {
            // pătratul care tocmai coboară la locul lui
            const sus = g.baza - inaltimeStiva(g, cate[i]) - g.latPatrat * 2.6 * (1 - p);
            patrat(g, cx, sus, culoare, 0.2 + 0.65 * p, 0.7 + 0.3 * p);
          });
        } else if (pas.tip === 'regrupare' && i === pas.coloana) {
          // cele zece se strâng spre bază și se sting, iar coloana se aprinde scurt:
          // momentul „zece de aici fac unu dincolo" e ideea lecției, merită văzut
          desenColoana(g, i, 0, culoare, (cx) => {
            const inaltBanda = inaltimeStiva(g, 10) + g.latPatrat * 0.6;
            ctx.strokeStyle = cuAlpha(culoare, 0.55 * (1 - p));
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(cx - g.latPatrat * 0.8, g.baza - inaltBanda, g.latPatrat * 1.6,
              inaltBanda + g.latPatrat * 0.25, g.latPatrat * 0.8);
            ctx.stroke();
            for (let k = 0; k < 10; k += 1) {
              patrat(g, cx, g.baza - k * pasStivei(g) * (1 - p), culoare, 0.85 * (1 - p), 1 - 0.3 * p);
            }
          });
        } else if (pas.tip === 'regrupare' && i === pas.coloana - 1) {
          // și se întorc ca un singur pătrat, cu un rang mai sus
          desenColoana(g, i, cate[i], culoare, (cx) => {
            const dela = centrul(g, pas.coloana);
            // urmă scurtă în spate, ca ochiul să prindă de unde vine pătratul
            for (let u = 3; u >= 0; u -= 1) {
              const pu = Math.max(0, p - u * 0.07);
              const x = dela + (cx - dela) * pu;
              const y = g.baza - inaltimeStiva(g, cate[i]) * pu;
              patrat(g, x, y, culoare, (0.3 + 0.55 * pu) * (u === 0 ? 1 : 0.18), 0.75 + 0.25 * pu);
            }
          });
        } else if (pas.tip === 'reia') {
          desenColoana(g, i, 0, culoare, (cx) => {
            for (let k = 0; k < cate[i]; k += 1) {
              patrat(g, cx, g.baza - k * pasStivei(g), culoare, 0.85 * (1 - p));
            }
          });
        } else {
          desenColoana(g, i, cate[i], culoare);
        }
      }

      /* Bara desparte cantitatea de scriere: stă la mijloc între capătul de jos al
         benzilor (g.baza + 0,25·latură) și marginea de sus a cifrelor. */
      ctx.strokeStyle = cuAlpha(NEUTRU, 0.28);
      ctx.lineWidth = 1;
      const yBara = Math.round(g.baza + g.latPatrat * 0.62) + 0.5;
      ctx.beginPath();
      ctx.moveTo(stangaZona, yBara);
      ctx.lineTo(dreaptaZona, yBara);
      ctx.stroke();

      /* Virgula: pe rândul cifrelor, exact la mijlocul dintre unități și zecimi,
         în gri — nu ține de niciun rang. */
      if (g.primul <= INDICE_UNITATI) {
        const xVirgula = (centrul(g, INDICE_UNITATI) + centrul(g, INDICE_UNITATI + 1)) / 2;
        ctx.fillStyle = cuAlpha(NEUTRU, 0.7);
        ctx.font = `600 ${Math.max(9, g.latPatrat * 0.6)}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(',', xVirgula, g.baza + g.latPatrat * 1.4);
      }

      if (!redus) raf = requestAnimationFrame(deseneaza);
    };

    raf = requestAnimationFrame(deseneaza);

    const observator = new ResizeObserver(() => {
      if (redus) {
        pornire = 0;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(deseneaza);
      }
    });
    observator.observe(gazda);

    return () => {
      observator.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={gazdaRef} className={styles.gazda} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
