import React, { useEffect, useRef } from 'react';
import styles from './StepsCanvas.module.css';

/**
 * „Parcursul EduPAȘI" — animația din chenarul albastru al paginii EduPAȘI.
 *
 * Același limbaj vizual ca astrolabul de pe pagina edumat58: line-art subțire,
 * trasat la intrare, cu mișcare lentă și motive matematice. Diferă tema, pentru
 * că EduPAȘI înseamnă PAȘI: o scară ascendentă — exact gestul din wordmark, unde
 * barele cresc treaptă cu treaptă — pe care un punct-elev o urcă pas cu pas,
 * aprinzând fiecare treaptă în culorile familiei. Sus stă steaua concavă
 * Kulturosfera, emblema, ca destinație a parcursului.
 *
 * Desenat pe albastrul deschis al chenarului (#D9EEF7): tușe în bleumarinul de
 * brand (#003058) la opacitate mică, cu accente în roșu, turcoaz și auriu doar
 * pe treapta activă. Respectă `prefers-reduced-motion` — atunci compune un
 * singur cadru așezat, fără mișcare.
 */

// Paleta familiei, în ordinea în care se aprind treptele.
const CULORI = ['#003058', '#d23d2d', '#0197b0', '#d8b45a', '#545454'];
const BLEU = '#003058';

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
    let t = 0;

    // Dacă e activă o paletă de accesibilitate (contrast mărit, dislexie…),
    // folosim accentul ei ca să nu ne batem cap în cap cu tema aleasă de elev.
    const paleta = () => {
      const root = document.documentElement;
      if (!root.hasAttribute('data-edupasi-palette')) return null;
      const cs = getComputedStyle(root);
      const accent = cs.getPropertyValue('--edupasi-accent').trim();
      const focus = cs.getPropertyValue('--edupasi-focus').trim();
      if (!accent) return null;
      return { accent, focus: focus || accent };
    };

    // Măsurăm din elementul-gazdă, iar dacă el nu are încă dimensiuni (layout
    // neterminat, fereastră raportată 0 la montare), NU stricăm canvasul: îl
    // lăsăm cum e și reîncercăm la cadrul următor. Un canvas dus la 0×0 rămânea
    // gol pentru totdeauna dacă măsurătoarea proastă era ultima.
    const redimensioneaza = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // `clientWidth/Height` sunt proprietăți de layout întregi și stabile;
      // `getBoundingClientRect` poate raporta 0 în anumite medii (preview
      // headless) chiar când elementul are dimensiune reală.
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

    // Trasarea la intrare: fiecare element se „scrie" în primele ~2,5 secunde.
    const intra = (delay, dur = 1) => Math.max(0, Math.min(1, (t - delay) / dur));
    const cuAlpha = (hex, a) => {
      const n = parseInt(hex.slice(1), 16);
      return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
    };

    // Geometria scării: ocupă jumătatea din dreapta a chenarului (unde masca
    // lasă animația să se vadă), centrată pe verticală, ca textul să respire în
    // stânga. Dimensiunile se scot din zona vizibilă, nu din tot canvasul.
    const geometrie = () => {
      const trepte = latime < 560 ? 3 : latime < 900 ? 4 : 5;
      // Banda vizibilă începe pe la 40% din lățime (după mască).
      const stanga = latime * 0.44;
      const zonaLat = latime - stanga - latime * 0.05;
      const latimeTreapta = zonaLat / (trepte + 0.6);
      const inaltimeTreapta = Math.min(latimeTreapta * 0.62, (inaltime * 0.46) / trepte);
      const inaltimeScara = trepte * inaltimeTreapta;
      // Baza stă în partea de jos a chenarului; scara și steaua urcă de acolo,
      // lăsând aer deasupra pentru stea.
      const baseX = stanga;
      const baseY = inaltime * 0.82;
      return { trepte, latimeTreapta, inaltimeTreapta, baseX, baseY };
    };

    // Colțul din-stânga-jos al treptei i (0 = jos).
    const coltTreapta = (g, i) => ({
      x: g.baseX + i * g.latimeTreapta,
      y: g.baseY - i * g.inaltimeTreapta,
    });

    const grila = () => {
      const pas = 46;
      const drift = (t * 4) % pas;
      ctx.strokeStyle = cuAlpha(BLEU, 0.05);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = latime * 0.32 - drift; x < latime; x += pas) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, inaltime);
      }
      for (let y = -drift * 0.6; y < inaltime; y += pas) {
        ctx.moveTo(latime * 0.32, y);
        ctx.lineTo(latime, y);
      }
      ctx.stroke();
    };

    // Steluța în 5 colțuri — reușita, țelul atins. Nu emblema în 4 colțuri: pe o
    // platformă școlară aceea citea a shuriken, nu a stea. Cinci colțuri e
    // steaua de premiu pe care o desenează orice copil.
    const steluta = (cx, cy, exterior, rot) => {
      const interior = exterior * 0.42;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? exterior : interior;
        const a = rot + (i * Math.PI) / 5 - Math.PI / 2;
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    };

    // Bare ascendente — gestul din wordmark, treaptă cu treaptă. Fiecare bară
    // crește din linia de bază, în culoarea familiei, cu capătul plin și corpul
    // translucid. Se „ridică" la intrare, de la bază spre vârf.
    const desenScara = (g, ac) => {
      // Linia de bază, comună tuturor barelor.
      const pBaza = intra(0.1, 0.6);
      if (pBaza > 0) {
        ctx.strokeStyle = cuAlpha(BLEU, 0.5);
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(g.baseX - g.latimeTreapta * 0.2, g.baseY);
        ctx.lineTo(
          g.baseX + (g.trepte - 1) * g.latimeTreapta + g.latimeTreapta * 1.05 * pBaza,
          g.baseY
        );
        ctx.stroke();
      }

      const latBara = g.latimeTreapta * 0.62;
      for (let i = 0; i < g.trepte; i++) {
        const p = intra(0.3 + i * 0.16, 0.7);
        if (p <= 0) continue;
        const col = coltTreapta(g, i);
        const inaltBara = (i + 1) * g.inaltimeTreapta * p;
        const x = col.x + (g.latimeTreapta - latBara) / 2;
        const yTop = g.baseY - inaltBara;
        const c = ac(i);

        // corpul translucid
        const grad = ctx.createLinearGradient(0, yTop, 0, g.baseY);
        grad.addColorStop(0, cuAlpha(c, 0.34));
        grad.addColorStop(1, cuAlpha(c, 0.08));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.rect(x, yTop, latBara, inaltBara);
        ctx.fill();

        // conturul + capătul plin
        ctx.strokeStyle = cuAlpha(c, 0.85);
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.strokeRect(x, yTop, latBara, inaltBara);
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.rect(x, yTop, latBara, Math.min(6, inaltBara));
        ctx.fill();
      }
    };

    // Vârful barei i: unde se odihnește elevul când a ajuns pe ea.
    const varfBarei = (g, i) => ({
      x: coltTreapta(g, i).x + g.latimeTreapta / 2,
      y: g.baseY - (i + 1) * g.inaltimeTreapta,
    });

    // Punctul-elev care urcă din bară în bară. Sare în arc între vârfuri: o
    // parabolă scurtă dă senzația de pas, nu de alunecare.
    const pozitiaElevului = (g) => {
      const perTreapta = 1.5; // secunde pe treaptă
      const start = 1.2; // după ce barele s-au ridicat
      const total = g.trepte * perTreapta;
      const local = Math.max(0, (t - start) % total);
      const idx = Math.min(g.trepte - 1, Math.floor(local / perTreapta));
      const f = (local - idx * perTreapta) / perTreapta;

      const aici = varfBarei(g, idx);
      // Primele 55% urcă spre bara idx dinspre cea de dinainte; restul se odihnește.
      if (idx === 0 || f > 0.55) {
        return { x: aici.x, y: aici.y - 9, idx, aterizat: true };
      }
      const inainte = varfBarei(g, idx - 1);
      const q = f / 0.55;
      const x = inainte.x + (aici.x - inainte.x) * q;
      const y = inainte.y + (aici.y - inainte.y) * q;
      const salt = Math.sin(q * Math.PI) * g.inaltimeTreapta * 0.35; // arcul pasului
      return { x, y: y - 9 - salt, idx, aterizat: false };
    };

    const compune = () => {
      ctx.clearRect(0, 0, latime, inaltime);
      const g = geometrie();
      // Plasă de siguranță: dacă vreo dimensiune a ieșit non-finită (măsurătoare
      // proastă, împărțire la zero), nu desenăm cadrul ăsta. O pânză decorativă
      // NU are voie să arunce — ar dărâma toată pagina prin error boundary.
      if (![g.baseX, g.baseY, g.latimeTreapta, g.inaltimeTreapta].every(Number.isFinite)
        || g.latimeTreapta < 1 || g.inaltimeTreapta < 1) {
        return;
      }
      const pal = paleta();
      const culoareActiva = (i) => (pal ? (i % 2 ? pal.focus : pal.accent) : CULORI[i % CULORI.length]);

      grila();

      // Steaua-destinație, deasupra celei mai înalte bare (ultima).
      const varfUltima = varfBarei(g, g.trepte - 1);
      const steaX = varfUltima.x;
      const steaY = varfUltima.y - g.latimeTreapta * 0.85;
      const pStea = intra(1.4, 1);
      const raza = g.latimeTreapta * 0.5;
      if (pStea > 0) {
        // aură punctată rotitoare
        ctx.save();
        ctx.globalAlpha = pStea;
        for (let k = 0; k < 20; k++) {
          const a0 = t * 0.15 + (k * Math.PI * 2) / 20;
          ctx.beginPath();
          ctx.arc(steaX, steaY, raza * 1.9, a0, a0 + 0.08);
          ctx.strokeStyle = cuAlpha(BLEU, 0.22);
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
        // Steluța, cu o legănare blândă (nu rotire de shuriken): câteva grade
        // înainte și înapoi, cât o steluță care sclipește.
        const legan = Math.sin(t * 0.8) * 0.12;
        steluta(steaX, steaY, raza * pStea, legan);
        ctx.fillStyle = cuAlpha(pal ? pal.focus : '#d8b45a', 0.18);
        ctx.fill();
        ctx.strokeStyle = pal ? pal.accent : BLEU;
        ctx.lineWidth = 2.2;
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.restore();
      }

      desenScara(g, culoareActiva);

      // Punctul-elev care urcă din bară în bară.
      if (intra(1.2) > 0 && !redus) {
        const e = pozitiaElevului(g);
        const c = culoareActiva(e.idx);
        // urma sub el, ca o mică proiecție pe bară
        ctx.beginPath();
        ctx.arc(e.x, e.y + 9, 3, 0, Math.PI * 2);
        ctx.fillStyle = cuAlpha(BLEU, 0.18);
        ctx.fill();
        // halou + punct
        ctx.beginPath();
        ctx.arc(e.x, e.y, 9, 0, Math.PI * 2);
        ctx.fillStyle = cuAlpha(c, 0.18);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(e.x, e.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = c;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      } else if (redus) {
        // Cadru așezat: elevul odihnit pe ultima bară.
        const varf = varfBarei(g, g.trepte - 1);
        ctx.beginPath();
        ctx.arc(varf.x, varf.y - 9, 5, 0, Math.PI * 2);
        ctx.fillStyle = BLEU;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
    };

    // Timpul vine din ceasul real, nu din numărul de cadre. Altfel, dacă un
    // cadru sare (layout încă negata, filă în fundal), animația ar încetini sau
    // ar îngheța — exact ce se întâmpla când măsurătoarea de dimensiune pica.
    let t0 = 0;
    let jurnalizat = false;
    const animeaza = (acum) => {
      if (!t0) t0 = acum;
      t = (acum - t0) / 1000;
      // Orice ar păți desenul, bucla trăiește mai departe și pagina rămâne
      // întreagă. O animație de fundal nu e niciodată un motiv de eroare fatală.
      try {
        if (redimensioneaza()) compune();
      } catch (e) {
        if (!jurnalizat) {
          jurnalizat = true;
          // eslint-disable-next-line no-console
          console.error('[StepsCanvas] cadru sărit:', e && e.message);
        }
      }
      raf = requestAnimationFrame(animeaza);
    };

    const ro = new ResizeObserver(() => redimensioneaza());
    ro.observe(gazda);

    if (redus) {
      // La mișcare redusă tot avem nevoie de o dimensiune validă; dacă nu e gata,
      // așteptăm câteva cadre și compunem un singur cadru așezat.
      const cadruStatic = () => {
        if (redimensioneaza()) { t = 6; compune(); }
        else raf = requestAnimationFrame(cadruStatic);
      };
      cadruStatic();
    } else {
      // Pornim prin rAF, NU direct: apelul direct nu primește timestamp, iar
      // `t` ar ieși NaN la primul cadru. Așa `acum` e mereu un timp valid.
      raf = requestAnimationFrame(animeaza);
    }

    return () => {
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={gazdaRef} className={styles.gazda} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
