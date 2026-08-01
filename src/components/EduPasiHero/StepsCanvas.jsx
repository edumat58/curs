import React, { useEffect, useRef } from 'react';
import styles from './StepsCanvas.module.css';

/**
 * „Parcursul EduPAȘI" — animația din chenarul albastru al paginii EduPAȘI.
 *
 * NOU DESIGN DE LA 0 — fără shuriken, fără arme, fără metafore violente.
 *
 * Limbaj vizual autentic EduPAȘI / edumat58 / Kulturosfera:
 *  • Steaua concavă Kulturosfera (4 vârfuri) — emblema reală a brandului
 *  • Scară de PAȘI ascendenti — gestul din wordmark (bare crescătoare + punct)
 *  • Astrolab didactic: cerc unitate, sinus, ineluri, grilă — matematica vizibilă
 *  • Un punct-elev care urcă pas cu pas, aprinzând treptele în culorile familiei
 *  • Paleta exactă: #003058, #d23d2d, #0197b0, #d8b45a, #545454
 *  • Fundal #D9EEF7, tuș bleumarin la opacități miche
 *  • Respectă `prefers-reduced-motion`
 *  • Accesibilitate completă: teme contrast, dislexie, focus vizibil
 */

// Paleta familiei — ordinea barelor = ordinea culorilor din wordmark / KulturosferaLine
const CULORI = ['#003058', '#d23d2d', '#0197b0', '#d8b45a', '#545454'];
const BLEU = '#003058';
const FUNDAL = '#D9EEF7';

// Steaua concavă Kulturosfera (4 vârfuri) — emblema reală, nu shuriken
const steaConcava = (ctx, cx, cy, exterior, talie, rot = 0) => {
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const vf = rot + (i * Math.PI) / 2 - Math.PI / 2;
    const vx = cx + exterior * Math.cos(vf), vy = cy + exterior * Math.sin(vf);
    const tx = cx + talie * Math.cos(vf + Math.PI / 4), ty = cy + talie * Math.sin(vf + Math.PI / 4);
    if (i === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
    ctx.quadraticCurveTo(cx, cy, tx, ty);
  }
  ctx.closePath();
};

const cuAlpha = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

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

    // Accesibilitate: preia accentul temei active
    const paleta = () => {
      const root = document.documentElement;
      if (!root.hasAttribute('data-edupasi-palette')) return null;
      const cs = getComputedStyle(root);
      const accent = cs.getPropertyValue('--edupasi-accent').trim();
      const focus = cs.getPropertyValue('--edupasi-focus').trim();
      if (!accent) return null;
      return { accent, focus: focus || accent };
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

    const intra = (delay, dur = 1) => Math.max(0, Math.min(1, (t - delay) / dur));

    // Geometria scării PAȘI: bare ascendente + spațiu pentru astrolab în stânga
    const geometrie = () => {
      const trepte = latime < 560 ? 3 : latime < 900 ? 4 : 5;
      const stanga = latime * 0.42;
      const zonaLat = latime - stanga - latime * 0.06;
      const latimeTreapta = zonaLat / (trepte + 0.5);
      const inaltimeTreapta = Math.min(latimeTreapta * 0.55, (inaltime * 0.5) / trepte);
      const baseX = stanga;
      const baseY = inaltime * 0.78;
      return { trepte, latimeTreapta, inaltimeTreapta, baseX, baseY };
    };

    const coltTreapta = (g, i) => ({
      x: g.baseX + i * g.latimeTreapta,
      y: g.baseY - i * g.inaltimeTreapta,
    });

    // Grilă subtilă (ca la astrolab)
    const grila = () => {
      const pas = 44;
      const drift = (t * 3.5) % pas;
      ctx.strokeStyle = cuAlpha(BLEU, 0.045);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = latime * 0.32 - drift; x < latime; x += pas) {
        ctx.moveTo(x, 0); ctx.lineTo(x, inaltime);
      }
      for (let y = -drift * 0.5; y < inaltime; y += pas) {
        ctx.moveTo(latime * 0.32, y); ctx.lineTo(latime, y);
      }
      ctx.stroke();
    };

    // Barele ascendente — ADN-ul wordmark-ului: crește din bază, capăt plin, corp translucid
    const desenScara = (g, culoareActiva) => {
      const pBaza = intra(0.15, 0.7);
      if (pBaza > 0) {
        ctx.strokeStyle = cuAlpha(BLEU, 0.35);
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(g.baseX - g.latimeTreapta * 0.15, g.baseY);
        ctx.lineTo(
          g.baseX + (g.trepte - 1) * g.latimeTreapta + g.latimeTreapta * 1.1 * pBaza,
          g.baseY
        );
        ctx.stroke();
      }

      const latBara = g.latimeTreapta * 0.58;
      for (let i = 0; i < g.trepte; i++) {
        const p = intra(0.35 + i * 0.18, 0.8);
        if (p <= 0) continue;
        const col = coltTreapta(g, i);
        const inaltBara = (i + 1) * g.inaltimeTreapta * p;
        const x = col.x + (g.latimeTreapta - latBara) / 2;
        const yTop = g.baseY - inaltBara;
        const c = culoareActiva(i);

        // Corp translucid cu gradient (ca barele din wordmark)
        const grad = ctx.createLinearGradient(0, yTop, 0, g.baseY);
        grad.addColorStop(0, cuAlpha(c, 0.38));
        grad.addColorStop(0.6, cuAlpha(c, 0.12));
        grad.addColorStop(1, cuAlpha(c, 0.04));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, yTop, latBara, inaltBara, 3);
        ctx.fill();

        // Contur subțire + capăt plin (gestul "gros/subțire" din font)
        ctx.strokeStyle = cuAlpha(c, 0.75);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, yTop, latBara, inaltBara);
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.roundRect(x, yTop, latBara, Math.min(7, inaltBara), 3);
        ctx.fill();
      }
    };

    const varfBarei = (g, i) => ({
      x: coltTreapta(g, i).x + g.latimeTreapta / 2,
      y: g.baseY - (i + 1) * g.inaltimeTreapta,
    });

    // ============================================================
    // ASTROLAB DIDACTIC — matematica vizibilă, nemaipomenită
    // Plasat în stânga scării, ca fundament al parcursului
    // ============================================================
    const desenAstrolab = (g, pal) => {
      const cx = g.baseX - g.latimeTreapta * 0.9;
      const cy = g.baseY - g.trepte * g.inaltimeTreapta * 0.45;
      const R = g.latimeTreapta * 1.1;

      // Ineluri concentrice (trasate la intrare)
      [1, 0.72, 0.45].forEach((f, i) => {
        const p = intra(0.2 + i * 0.3);
        if (p <= 0) return;
        ctx.beginPath();
        ctx.arc(cx, cy, R * f, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p);
        ctx.strokeStyle = cuAlpha(BLEU, 0.28 - i * 0.06);
        ctx.lineWidth = i === 0 ? 1.5 : 1;
        ctx.stroke();
      });

      // Gradații inel exterior (la π/6) — astrolab clasic
      const pTicks = intra(0.9);
      for (let k = 0; k < 24 * pTicks; k++) {
        const ang = (k * Math.PI) / 12 + t * 0.015;
        const major = k % 6 === 0;
        const r1 = R, r2 = R + (major ? 9 : 4);
        ctx.beginPath();
        ctx.moveTo(cx + r1 * Math.cos(ang), cy + r1 * Math.sin(ang));
        ctx.lineTo(cx + r2 * Math.cos(ang), cy + r2 * Math.sin(ang));
        ctx.strokeStyle = cuAlpha(BLEU, major ? 0.35 : 0.18);
        ctx.lineWidth = major ? 1.2 : 0.8;
        ctx.stroke();
      }

      // Inele punctate contra-rotative (ADN vizual)
      if (intra(1.3) > 0) {
        const dashRing = (r, rot, dashes, alpha) => {
          for (let k = 0; k < dashes; k++) {
            const a0 = rot + (k * Math.PI * 2) / dashes;
            ctx.beginPath();
            ctx.arc(cx, cy, r, a0, a0 + 0.055);
            ctx.strokeStyle = cuAlpha(BLEU, alpha);
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        };
        dashRing(R * 0.85, t * 0.08, 32, 0.22);
        dashRing(R * 0.55, -t * 0.12, 20, 0.18);
      }

      // Poligon morfoză (3→4→5→6) — poligoane regulate
      const pPoly = intra(1.6);
      if (pPoly > 0) {
        const cycle = (t * 0.09) % 4;
        const nBase = 3 + Math.floor(cycle);
        const frac = cycle - Math.floor(cycle);
        const drawPoly = (n, alpha, rot) => {
          ctx.beginPath();
          for (let i = 0; i <= n; i++) {
            const a = rot + (i * Math.PI * 2) / n - Math.PI / 2;
            const x = cx + R * 0.42 * Math.cos(a), y = cy + R * 0.42 * Math.sin(a);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.strokeStyle = cuAlpha(BLEU, alpha * pPoly);
          ctx.lineWidth = 1.1;
          ctx.stroke();
        };
        drawPoly(nBase, 0.28 * (1 - frac), t * 0.07);
        drawPoly(nBase + 1, 0.28 * frac, t * 0.07);
      }

      // CERCUL UNITATE: rază rotitoare + proiecții + unghi
      const ang = t * 0.55;
      const ux = cx + R * 0.72 * Math.cos(ang), uy = cy + R * 0.72 * Math.sin(ang);
      const pUnit = intra(1.9);
      if (pUnit > 0) {
        ctx.globalAlpha = pUnit;
        // Raza
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ux, uy);
        ctx.strokeStyle = cuAlpha(BLEU, 0.65); ctx.lineWidth = 1.3; ctx.stroke();
        // Unghiul
        ctx.beginPath(); ctx.arc(cx, cy, R * 0.14, 0, ang % (Math.PI * 2));
        ctx.strokeStyle = cuAlpha(BLEU, 0.4); ctx.lineWidth = 1; ctx.stroke();
        // Proiecții punctate pe axe
        ctx.setLineDash([3, 5]);
        ctx.beginPath(); ctx.moveTo(ux, uy); ctx.lineTo(ux, cy);
        ctx.moveTo(ux, uy); ctx.lineTo(cx, uy);
        ctx.strokeStyle = cuAlpha(BLEU, 0.3); ctx.lineWidth = 0.8; ctx.stroke();
        ctx.setLineDash([]);
        // Punct pe cerc
        ctx.beginPath(); ctx.arc(ux, uy, 3, 0, Math.PI * 2);
        ctx.fillStyle = cuAlpha(pal ? pal.focus : '#d8b45a', 0.95); ctx.fill();
        // Axele cercului unitate
        ctx.beginPath();
        ctx.moveTo(cx - R * 0.78, cy); ctx.lineTo(cx + R * 0.78, cy);
        ctx.moveTo(cx, cy - R * 0.78); ctx.lineTo(cx, cy + R * 0.78);
        ctx.strokeStyle = cuAlpha(BLEU, 0.1); ctx.lineWidth = 0.8; ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // SINUSUL emanat din cerc unitate — pleacă spre dreapta, către scară
      // Metaforă: matematica (cerc/sinus) → învățare (pași)
      const pSine = intra(2.2);
      if (pSine > 0) {
        const sineLen = g.baseX - cx - R * 0.92;
        ctx.beginPath();
        for (let d = 0; d <= sineLen; d += 3.5) {
          const y = cy + R * 0.72 * Math.sin(ang - d * 0.014);
          const x = cx + R * 0.92 + d;
          d === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = cuAlpha(BLEU, 0.42);
        ctx.lineWidth = 1.3;
        ctx.stroke();
        // Legătură punctată punct → început undă
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.moveTo(ux, uy);
        ctx.lineTo(cx + R * 0.92, cy + R * 0.72 * Math.sin(ang));
        ctx.strokeStyle = cuAlpha(BLEU, 0.22); ctx.lineWidth = 0.8; ctx.stroke();
        ctx.setLineDash([]);
      }

      // Sateliti stele concave pe orbite — embleme mici ale progresului
      const pSat = intra(2.0);
      if (pSat > 0) {
        ctx.globalAlpha = pSat * 0.8;
        [
          { r: R * 0.85, sp: 0.18, size: 6, ph: 0 },
          { r: R * 0.55, sp: -0.28, size: 4.5, ph: 2.2 },
          { r: R * 1.02, sp: 0.11, size: 3.5, ph: 4.7 }
        ].forEach((s) => {
          const a = s.ph + t * s.sp;
          const sx = cx + s.r * Math.cos(a), sy = cy + s.r * Math.sin(a);
          steaConcava(ctx, sx, sy, s.size, s.size * 0.32, a);
          ctx.fillStyle = cuAlpha(BLEU, 0.65);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
      }

      // Nucleu: steaua concavă emblema, respirând
      const pCore = intra(2.4);
      if (pCore > 0) {
        const breathe = 1 + Math.sin(t * 0.75) * 0.05;
        ctx.globalAlpha = pCore;
        steaConcava(ctx, cx, cy, 11 * breathe, 3.6 * breathe, 0);
        ctx.fillStyle = cuAlpha(pal ? pal.focus : '#d8b45a', 0.9);
        ctx.fill();
        ctx.strokeStyle = cuAlpha(BLEU, 0.6);
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    };

    // Steaua-destinație deasupra scării (stea concavă Kulturosfera)
    const desenSteaDestinatie = (g, pal) => {
      const varf = varfBarei(g, g.trepte - 1);
      const steaX = varf.x;
      const steaY = varf.y - g.latimeTreapta * 0.9;
      const pStea = intra(1.5, 1.2);
      const raza = g.latimeTreapta * 0.48;
      if (pStea <= 0) return;

      // Aură punctată rotitoare
      ctx.save();
      ctx.globalAlpha = pStea * 0.7;
      for (let k = 0; k < 18; k++) {
        const a0 = t * 0.12 + (k * Math.PI * 2) / 18;
        ctx.beginPath();
        ctx.arc(steaX, steaY, raza * 2.1, a0, a0 + 0.07);
        ctx.strokeStyle = cuAlpha(BLEU, 0.18);
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Steaua concavă — nu rotește ca shuriken, doar o legănare blândă
      const legan = Math.sin(t * 0.6) * 0.1;
      steaConcava(ctx, steaX, steaY, raza * pStea, raza * 0.32 * pStea, legan);
      ctx.fillStyle = cuAlpha(pal ? pal.focus : '#d8b45a', 0.15);
      ctx.fill();
      ctx.strokeStyle = pal ? pal.accent : BLEU;
      ctx.lineWidth = 2.2;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    };

    // Elevul care urcă pe bare — parabolă scurtă între vârfuri
    // Un punct cald, uman, care face PAȘI
    const desenElev = (g, culoareActiva) => {
      if (intra(1.4) <= 0 || redus) return;

      const perTreapta = 1.6;
      const start = 1.4;
      const total = g.trepte * perTreapta;
      const local = Math.max(0, (t - start) % total);
      const idx = Math.min(g.trepte - 1, Math.floor(local / perTreapta));
      const f = (local - idx * perTreapta) / perTreapta;

      const aici = varfBarei(g, idx);
      if (idx === 0 || f > 0.58) {
        // Aterizat pe bară — odihnește, a reușit pasul
        const c = culoareActiva(idx);
        ctx.beginPath();
        ctx.arc(aici.x, aici.y - 8, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = cuAlpha(BLEU, 0.15); ctx.fill();
        ctx.beginPath();
        ctx.arc(aici.x, aici.y - 8, 8, 0, Math.PI * 2);
        ctx.fillStyle = cuAlpha(c, 0.15); ctx.fill();
        ctx.beginPath();
        ctx.arc(aici.x, aici.y - 8, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = c; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4; ctx.stroke();
        return;
      }

      // În zbor către bară — arcul pasului
      const inainte = varfBarei(g, idx - 1);
      const q = f / 0.58;
      const x = inainte.x + (aici.x - inainte.x) * q;
      const y = inainte.y + (aici.y - inainte.y) * q;
      const salt = Math.sin(q * Math.PI) * g.inaltimeTreapta * 0.32;
      const c = culoareActiva(idx);

      ctx.beginPath();
      ctx.arc(x, y - 8 - salt, 2.8, 0, Math.PI * 2);
      ctx.fillStyle = cuAlpha(BLEU, 0.15); ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y - 8 - salt, 8, 0, Math.PI * 2);
      ctx.fillStyle = cuAlpha(c, 0.15); ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y - 8 - salt, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = c; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4; ctx.stroke();
    };

    // Cadru static pentru reduced-motion
    const compuneStatic = (g, pal, culoareActiva) => {
      ctx.clearRect(0, 0, latime, inaltime);
      grila();
      desenAstrolab(g, pal);
      desenScara(g, culoareActiva);
      desenSteaDestinatie(g, pal);

      // Elev pe ultima bară
      const varf = varfBarei(g, g.trepte - 1);
      ctx.beginPath();
      ctx.arc(varf.x, varf.y - 8, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = BLEU; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4; ctx.stroke();
    };

    const compune = () => {
      ctx.clearRect(0, 0, latime, inaltime);
      const g = geometrie();
      if (![g.baseX, g.baseY, g.latimeTreapta, g.inaltimeTreapta].every(Number.isFinite)
        || g.latimeTreapta < 1 || g.inaltimeTreapta < 1) {
        return;
      }
      const pal = paleta();
      const culoareActiva = (i) => (pal ? (i % 2 ? pal.focus : pal.accent) : CULORI[i % CULORI.length]);

      grila();
      desenAstrolab(g, pal);
      desenScara(g, culoareActiva);
      desenSteaDestinatie(g, pal);
      desenElev(g, culoareActiva);
    };

    let t0 = 0;
    let jurnalizat = false;
    const animeaza = (acum) => {
      if (!t0) t0 = acum;
      t = (acum - t0) / 1000;
      try {
        if (redimensioneaza()) compune();
      } catch (e) {
        if (!jurnalizat) {
          jurnalizat = true;
          console.error('[StepsCanvas] cadru sărit:', e && e.message);
        }
      }
      raf = requestAnimationFrame(animeaza);
    };

    const ro = new ResizeObserver(() => redimensioneaza());
    ro.observe(gazda);

    if (redus) {
      const cadruStatic = () => {
        if (redimensioneaza()) {
          const g = geometrie();
          const pal = paleta();
          const culoareActiva = (i) => (pal ? (i % 2 ? pal.focus : pal.accent) : CULORI[i % CULORI.length]);
          compuneStatic(g, pal, culoareActiva);
        } else {
          raf = requestAnimationFrame(cadruStatic);
        }
      };
      cadruStatic();
    } else {
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