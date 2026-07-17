import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { EdumatWordmark } from '@site/src/components/Brand';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './Hero.module.css';
import KulturosferaButton from '../KulturosferaButton';
import SplitText from '../SplitText/SplitText';

export default function Hero() {
    const { siteConfig } = useDocusaurusContext();
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let width, height, dpr, raf;
        let t = 0;

        const resize = () => {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        const W = (a) => `rgba(255,255,255,${a})`;
        // intrarea în scenă: totul se „trasează" în primele ~2.5 secunde
        const draw01 = (delay, dur = 1.2) => Math.max(0, Math.min(1, (t - delay) / dur));

        // steaua concavă Kulturosfera (limbajul emblemei), desenată pe canvas
        const star4 = (cx, cy, outer, waist, rot = 0) => {
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                const tip = rot + (i * Math.PI) / 2 - Math.PI / 2;
                const tx = cx + outer * Math.cos(tip), ty = cy + outer * Math.sin(tip);
                const wx = cx + waist * Math.cos(tip + Math.PI / 4), wy = cy + waist * Math.sin(tip + Math.PI / 4);
                if (i === 0) ctx.moveTo(tx, ty); else ctx.lineTo(tx, ty);
                ctx.quadraticCurveTo(cx, cy, wx, wy);
            }
            ctx.closePath();
        };

        // --- grila planului, drift lent --------------------------------------
        const drawGrid = () => {
            const step = 56;
            const off = (t * 5) % step;
            ctx.strokeStyle = W(0.045);
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let x = -off; x < width; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
            for (let y = -off * 0.6; y < height; y += step) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
            ctx.stroke();
        };

        // =====================================================================
        //  ASTROLABUL — piesa centrală: matematică + Kulturosfera + complexitate
        // =====================================================================
        const drawAstrolabe = () => {
            const cx = width * 0.78, cy = height * 0.33;
            const R = Math.min(width, height) * 0.21;

            // 1) inelele gravate concentrice, cu trasare la intrare
            [1, 0.78, 0.5].forEach((f, i) => {
                const p = draw01(0.2 + i * 0.25);
                if (p <= 0) return;
                ctx.beginPath();
                ctx.arc(cx, cy, R * f, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p);
                ctx.strokeStyle = W(0.34 - i * 0.06);
                ctx.lineWidth = i === 0 ? 1.5 : 1;
                ctx.stroke();
            });

            // 2) gradațiile de astrolab pe inelul exterior (la fiecare π/6)
            const pTicks = draw01(0.9);
            for (let k = 0; k < 24 * pTicks; k++) {
                const ang = (k * Math.PI) / 12 + t * 0.02;
                const major = k % 6 === 0;
                const r1 = R, r2 = R + (major ? 10 : 5);
                ctx.beginPath();
                ctx.moveTo(cx + r1 * Math.cos(ang), cy + r1 * Math.sin(ang));
                ctx.lineTo(cx + r2 * Math.cos(ang), cy + r2 * Math.sin(ang));
                ctx.strokeStyle = W(major ? 0.4 : 0.22);
                ctx.lineWidth = major ? 1.5 : 1;
                ctx.stroke();
            }

            // 3) inele punctate contra-rotative (ADN-ul familiei)
            const dashRing = (r, rot, dashes, alpha) => {
                for (let k = 0; k < dashes; k++) {
                    const a0 = rot + (k * Math.PI * 2) / dashes;
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, a0, a0 + 0.06);
                    ctx.strokeStyle = W(alpha);
                    ctx.lineWidth = 1.25;
                    ctx.stroke();
                }
            };
            if (draw01(1.2) > 0) {
                dashRing(R * 0.89, t * 0.12, 36, 0.3);
                dashRing(R * 0.64, -t * 0.18, 24, 0.26);
            }

            // 4) poligonul înscris care își morfează laturile (3→4→5→6)
            const pPoly = draw01(1.5);
            if (pPoly > 0) {
                const cycle = (t * 0.12) % 4;
                const nBase = 3 + Math.floor(cycle);
                const frac = cycle - Math.floor(cycle);
                const drawPoly = (n, alpha, rot) => {
                    ctx.beginPath();
                    for (let i = 0; i <= n; i++) {
                        const a = rot + (i * Math.PI * 2) / n - Math.PI / 2;
                        const x = cx + R * 0.5 * Math.cos(a), y = cy + R * 0.5 * Math.sin(a);
                        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                    }
                    ctx.strokeStyle = W(alpha * pPoly);
                    ctx.lineWidth = 1.25;
                    ctx.stroke();
                };
                drawPoly(nBase, 0.34 * (1 - frac), t * 0.1);
                drawPoly(nBase + 1, 0.34 * frac, t * 0.1);
            }

            // 5) CERCUL UNITATE: raza rotitoare, proiecțiile punctate, unghiul
            const ang = t * 0.7;
            const ux = cx + R * 0.78 * Math.cos(ang), uy = cy + R * 0.78 * Math.sin(ang);
            const pUnit = draw01(1.8);
            if (pUnit > 0) {
                ctx.globalAlpha = pUnit;
                // raza
                ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ux, uy);
                ctx.strokeStyle = W(0.75); ctx.lineWidth = 1.5; ctx.stroke();
                // arcul unghiului
                ctx.beginPath(); ctx.arc(cx, cy, R * 0.16, 0, ang % (Math.PI * 2));
                ctx.strokeStyle = W(0.5); ctx.lineWidth = 1.25; ctx.stroke();
                // proiecțiile punctate pe axe
                ctx.setLineDash([3, 5]);
                ctx.beginPath(); ctx.moveTo(ux, uy); ctx.lineTo(ux, cy);
                ctx.moveTo(ux, uy); ctx.lineTo(cx, uy);
                ctx.strokeStyle = W(0.4); ctx.lineWidth = 1; ctx.stroke();
                ctx.setLineDash([]);
                // punctul de pe cerc
                ctx.beginPath(); ctx.arc(ux, uy, 3.5, 0, Math.PI * 2);
                ctx.fillStyle = W(0.95); ctx.fill();
                // axele cercului unitate
                ctx.beginPath();
                ctx.moveTo(cx - R * 0.82, cy); ctx.lineTo(cx + R * 0.82, cy);
                ctx.moveTo(cx, cy - R * 0.82); ctx.lineTo(cx, cy + R * 0.82);
                ctx.strokeStyle = W(0.14); ctx.lineWidth = 1; ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // 6) sinusul EMANAT din cercul unitate: pleacă spre stânga, viu
            const pSine = draw01(2.1);
            if (pSine > 0) {
                const sineLen = width * 0.30 * pSine;
                ctx.beginPath();
                for (let d = 0; d <= sineLen; d += 4) {
                    const y = cy + R * 0.78 * Math.sin(ang - d * 0.016);
                    const x = cx - R * 0.95 - d;
                    d === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }
                ctx.strokeStyle = W(0.5);
                ctx.lineWidth = 1.5;
                ctx.stroke();
                // legătura punctată dintre punct și începutul undei
                ctx.setLineDash([3, 5]);
                ctx.beginPath();
                ctx.moveTo(ux, uy);
                ctx.lineTo(cx - R * 0.95, cy + R * 0.78 * Math.sin(ang));
                ctx.strokeStyle = W(0.3); ctx.lineWidth = 1; ctx.stroke();
                ctx.setLineDash([]);
            }

            // 7) sateliți-steluțe Kulturosfera pe orbite diferite
            const pSat = draw01(2.0);
            if (pSat > 0) {
                ctx.globalAlpha = pSat;
                [ { r: R * 0.89, sp: 0.25, size: 7, ph: 0 },
                  { r: R * 0.64, sp: -0.4, size: 5, ph: 2.1 },
                  { r: R * 1.06, sp: 0.14, size: 4, ph: 4.4 } ].forEach((s) => {
                    const a = s.ph + t * s.sp;
                    const sx = cx + s.r * Math.cos(a), sy = cy + s.r * Math.sin(a);
                    star4(sx, sy, s.size, s.size * 0.32, a);
                    ctx.fillStyle = W(0.9);
                    ctx.fill();
                });
                ctx.globalAlpha = 1;
            }

            // 8) nucleul: steaua concavă a emblemei, respirând
            const pCore = draw01(2.3);
            if (pCore > 0) {
                const breathe = 1 + Math.sin(t * 0.9) * 0.06;
                ctx.globalAlpha = pCore;
                star4(cx, cy, 13 * breathe, 4.2 * breathe, 0);
                ctx.fillStyle = W(0.95);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        };

        // --- spirala de aur, stânga sus --------------------------------------
        const drawSpiral = () => {
            const p = draw01(0.6);
            if (p <= 0) return;
            const cx = width * 0.13, cy = height * 0.24;
            const rot = t * 0.05;
            const maxS = Math.PI * 6 * p;
            ctx.beginPath();
            ctx.strokeStyle = W(0.18);
            ctx.lineWidth = 1.25;
            for (let s = 0; s < maxS; s += 0.05) {
                const r = 3 * Math.exp(0.18 * s);
                if (r > Math.min(width, height) * 0.15) break;
                const x = cx + r * Math.cos(s + rot), y = cy + r * Math.sin(s + rot);
                s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
            // pătratele Fibonacci sugerate: colțuri pe spirală
            for (let k = 1; k <= 4; k++) {
                const s = k * Math.PI / 2;
                if (s > maxS) break;
                const r = 3 * Math.exp(0.18 * s);
                star4(cx + r * Math.cos(s + rot), cy + r * Math.sin(s + rot), 3.4, 1.1, 0);
                ctx.fillStyle = W(0.5);
                ctx.fill();
            }
        };

        // --- Lissajous cu cometă, stânga jos ---------------------------------
        const drawLissajous = () => {
            const p = draw01(1.0);
            if (p <= 0) return;
            const cx = width * 0.17, cy = height * 0.72;
            const R = Math.min(width, height) * 0.10;
            const a = 3, b = 2 + Math.sin(t * 0.1) * 0.25;
            const delta = t * 0.32;
            ctx.beginPath();
            ctx.strokeStyle = W(0.3);
            ctx.lineWidth = 1.25;
            const maxS = Math.PI * 2 * p;
            for (let s = 0; s <= maxS; s += 0.01) {
                const x = cx + R * Math.sin(a * s + delta), y = cy + R * Math.sin(b * s);
                s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
            const s0 = (t * 0.85) % (Math.PI * 2);
            for (let k = 0; k < 10; k++) {
                const s = s0 - k * 0.02;
                const x = cx + R * Math.sin(a * s + delta), y = cy + R * Math.sin(b * s);
                ctx.beginPath(); ctx.arc(x, y, 2.8 - k * 0.2, 0, Math.PI * 2);
                ctx.fillStyle = W(Math.max(0, 0.9 - k * 0.09)); ctx.fill();
            }
        };

        // --- unda Fourier de jos, cu călători --------------------------------
        const fourierY = (x) =>
            Math.sin(x * 0.008 + t) * 30 +
            Math.sin(x * 0.016 + t * 1.7) * 14 +
            Math.sin(x * 0.032 + t * 2.3) * 6;

        const drawWave = () => {
            const p = draw01(0.4);
            if (p <= 0) return;
            const baseY = height * 0.85;
            const lim = width * p;
            ctx.beginPath();
            ctx.strokeStyle = W(0.4);
            ctx.lineWidth = 1.75;
            for (let x = 0; x <= lim; x += 4) {
                const y = baseY + fourierY(x);
                x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
            for (let i = 0; i < 4; i++) {
                const px = ((t * 80 + (i * width) / 4) % (width + 40)) - 20;
                if (px > lim) continue;
                ctx.beginPath(); ctx.arc(px, baseY + fourierY(px), 2.8, 0, Math.PI * 2);
                ctx.fillStyle = W(0.85); ctx.fill();
            }
        };

        const frame = () => {
            ctx.clearRect(0, 0, width, height);
            drawGrid();
            drawSpiral();
            drawLissajous();
            drawWave();
            drawAstrolabe();
        };

        const animate = () => {
            t += 0.016;
            frame();
            raf = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize);
        resize();
        if (reduced) {
            t = 6; frame();
        } else {
            animate();
        }

        return () => {
            window.removeEventListener('resize', resize);
            if (raf) cancelAnimationFrame(raf);
        };
    }, []);

    return (
        <header className={styles.heroContainer}>
            <canvas ref={canvasRef} className={styles.canvasBackground} />
            <div className={styles.heroOverlay}></div>
            <div className={clsx('container', styles.heroContent)}>
                <h1 className={styles.heroTitle} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                    <span style={{ color: '#fff' }}>
                        <EdumatWordmark width={420} style={{ width: 'min(420px, 86vw)' }} />
                    </span>
                    <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
                        {siteConfig.title}
                    </span>
                </h1>
                <SplitText
                    text={siteConfig.tagline}
                    className={styles.heroSubtitle}
                    delay={50}
                    animationFrom={{ opacity: 0, transform: 'translate3d(0,40px,0)' }}
                    animationTo={{ opacity: 1, transform: 'translate3d(0,0,0)' }}
                    easing="easeOutCubic"
                    threshold={0.1}
                    rootMargin="-100px"
                />
                <br></br>
                <br></br>
                <div className={styles.buttons}>
                    <Link
                        className={clsx('button button--lg', styles.glowButton)}
                        to="/navigation">
                        Descoperă Edumat
                    </Link>
                    <KulturosferaButton />
                </div>
            </div>
        </header>
    );
}
